/**
 * Git Diff Viewer Extension
 *
 * Interactive walkthrough of git changes with AI explanations.
 *
 * Usage:
 *   /diff              - View unstaged changes
 *   /diff --staged     - View staged changes
 *   /diff HEAD~1       - View changes from a specific commit/range
 *
 * Keybindings:
 *   n / →      - Next change
 *   p / ←      - Previous change
 *   c / Enter  - Chat about current change
 *   Escape     - Exit viewer (or exit chat mode)
 *   q          - Quit viewer
 */

import { complete, type UserMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import {
  Container,
  Editor,
  Key,
  matchesKey,
  Spacer,
  Text,
  truncateToWidth,
  visibleWidth,
  wrapTextWithAnsi,
} from "@mariozechner/pi-tui";
import type { EditorTheme } from "@mariozechner/pi-tui";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DiffHunk {
  file: string;
  oldFile?: string; // For renames
  hunkHeader: string;
  lines: string[];
  hunkIndex: number;
  totalHunksInFile: number;
}

interface ParsedDiff {
  hunks: DiffHunk[];
  summary: string;
}

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Diff Parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseDiff(diffOutput: string): ParsedDiff {
  const hunks: DiffHunk[] = [];
  const lines = diffOutput.split("\n");

  let currentFile = "";
  let oldFile: string | undefined;
  let currentHunkLines: string[] = [];
  let currentHunkHeader = "";
  let fileHunkCount = 0;
  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;

  const flushHunk = () => {
    if (currentHunkLines.length > 0 && currentFile) {
      hunks.push({
        file: currentFile,
        oldFile,
        hunkHeader: currentHunkHeader,
        lines: [...currentHunkLines],
        hunkIndex: fileHunkCount,
        totalHunksInFile: 0, // Will be fixed up later
      });
      fileHunkCount++;
    }
    currentHunkLines = [];
    currentHunkHeader = "";
  };

  for (const line of lines) {
    // New file header
    if (line.startsWith("diff --git")) {
      flushHunk();
      // Fix up totalHunksInFile for previous file's hunks
      for (let i = hunks.length - 1; i >= 0 && hunks[i].file === currentFile; i--) {
        hunks[i].totalHunksInFile = fileHunkCount;
      }
      fileHunkCount = 0;
      filesChanged++;

      // Extract file name from "diff --git a/path b/path"
      const match = line.match(/diff --git a\/(.*) b\/(.*)/);
      if (match) {
        oldFile = match[1] !== match[2] ? match[1] : undefined;
        currentFile = match[2];
      }
      continue;
    }

    // Hunk header
    if (line.startsWith("@@")) {
      flushHunk();
      currentHunkHeader = line;
      continue;
    }

    // Skip other headers
    if (
      line.startsWith("index ") ||
      line.startsWith("--- ") ||
      line.startsWith("+++ ") ||
      line.startsWith("new file") ||
      line.startsWith("deleted file") ||
      line.startsWith("rename from") ||
      line.startsWith("rename to") ||
      line.startsWith("similarity index") ||
      line.startsWith("Binary files")
    ) {
      continue;
    }

    // Count insertions/deletions
    if (line.startsWith("+") && !line.startsWith("+++")) {
      insertions++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      deletions++;
    }

    // Content lines (including context)
    if (currentHunkHeader) {
      currentHunkLines.push(line);
    }
  }

  // Flush final hunk
  flushHunk();
  // Fix up totalHunksInFile for last file's hunks
  for (let i = hunks.length - 1; i >= 0 && hunks[i].file === currentFile; i--) {
    hunks[i].totalHunksInFile = fileHunkCount;
  }

  const summary = `${filesChanged} file${filesChanged !== 1 ? "s" : ""} changed, ${insertions} insertion${insertions !== 1 ? "s" : ""}(+), ${deletions} deletion${deletions !== 1 ? "s" : ""}(-)`;

  return { hunks, summary };
}

async function getWorkingTreeDiff(pi: ExtensionAPI): Promise<CommandResult> {
  const tracked = await pi.exec("git", ["diff"], { timeout: 10000 });
  if (tracked.code !== 0) {
    return {
      code: tracked.code,
      stdout: tracked.stdout,
      stderr: tracked.stderr,
    };
  }

  const untracked = await pi.exec("git", ["ls-files", "--others", "--exclude-standard", "-z"], {
    timeout: 10000,
  });
  if (untracked.code !== 0) {
    return {
      code: untracked.code,
      stdout: untracked.stdout,
      stderr: untracked.stderr,
    };
  }

  const untrackedFiles = untracked.stdout.split("\0").filter(Boolean);
  let untrackedDiff = "";

  for (const file of untrackedFiles) {
    const fileDiff = await pi.exec("git", ["diff", "--no-index", "--", "/dev/null", file], {
      timeout: 10000,
    });

    // git diff --no-index exits with 1 when differences are found.
    if (fileDiff.code !== 0 && fileDiff.code !== 1) {
      return {
        code: fileDiff.code,
        stdout: fileDiff.stdout,
        stderr: fileDiff.stderr,
      };
    }

    if (fileDiff.stdout.trim()) {
      untrackedDiff += (untrackedDiff ? "\n" : "") + fileDiff.stdout.trimEnd() + "\n";
    }
  }

  const combined = [tracked.stdout.trimEnd(), untrackedDiff.trimEnd()].filter(Boolean).join("\n\n");
  return {
    code: 0,
    stdout: combined,
    stderr: tracked.stderr || untracked.stderr,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Explanation
// ─────────────────────────────────────────────────────────────────────────────

const EXPLANATION_SYSTEM_PROMPT = `You are a code reviewer explaining git diff changes. Given a diff hunk, provide a clear, concise explanation of what changed and why it might matter.

Guidelines:
- Be concise (2-4 sentences typically)
- Focus on the semantic meaning of the change, not just "added/removed lines"
- Mention potential implications or things to watch for if relevant
- Use plain language, avoid jargon unless necessary
- If it's a simple change (typo fix, formatting), say so briefly`;

async function getExplanation(
  hunk: DiffHunk,
  ctx: ExtensionContext,
  signal: AbortSignal
): Promise<string> {
  if (!ctx.model) {
    return "No model selected for explanations.";
  }

  const auth = await ctx.modelRegistry.getApiKeyAndHeaders(ctx.model);
  if (!auth.ok || !auth.apiKey) {
    return `No API key for ${ctx.model.provider}`;
  }

  const diffText = `File: ${hunk.file}${hunk.oldFile ? ` (renamed from ${hunk.oldFile})` : ""}
${hunk.hunkHeader}
${hunk.lines.join("\n")}`;

  const userMessage: UserMessage = {
    role: "user",
    content: [{ type: "text", text: diffText }],
    timestamp: Date.now(),
  };

  try {
    const response = await complete(
      ctx.model,
      { systemPrompt: EXPLANATION_SYSTEM_PROMPT, messages: [userMessage] },
      { apiKey: auth.apiKey, headers: auth.headers, signal }
    );

    if (response.stopReason === "aborted") {
      return "Explanation cancelled.";
    }

    return response.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("\n");
  } catch (err) {
    if (signal.aborted) {
      return "Explanation cancelled.";
    }
    return `Error getting explanation: ${err}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Diff Viewer Component
// ─────────────────────────────────────────────────────────────────────────────

type ViewerMode = "viewing" | "chatting" | "loading";
type ViewerPane = "diff" | "detail";

class DiffViewerComponent {
  private hunks: DiffHunk[];
  private summary: string;
  private currentIndex = 0;
  private explanations: Map<number, string> = new Map();
  private mode: ViewerMode = "loading";
  private chatHistory: Array<{ role: "user" | "assistant"; text: string }> = [];
  private chatInput: Editor;
  private tui: { requestRender: () => void };
  private theme: any;
  private ctx: ExtensionContext;
  private onClose: () => void;
  private abortController: AbortController | null = null;
  private cachedWidth = 0;
  private cachedLines: string[] = [];
  private version = 0;
  private cachedVersion = -1;
  private activePane: ViewerPane = "diff";
  private diffScrollOffset = 0;
  private detailScrollOffset = 0;

  constructor(
    tui: { requestRender: () => void },
    theme: any,
    ctx: ExtensionContext,
    hunks: DiffHunk[],
    summary: string,
    onClose: () => void
  ) {
    this.tui = tui;
    this.theme = theme;
    this.ctx = ctx;
    this.hunks = hunks;
    this.summary = summary;
    this.onClose = onClose;

    const editorTheme: EditorTheme = {
      borderColor: (s) => theme.fg("accent", s),
      selectList: {
        selectedPrefix: (t) => theme.fg("accent", t),
        selectedText: (t) => theme.fg("accent", t),
        description: (t) => theme.fg("muted", t),
        scrollInfo: (t) => theme.fg("dim", t),
        noMatch: (t) => theme.fg("warning", t),
      },
    };

    this.chatInput = new Editor(tui, editorTheme);

    // Load first explanation
    this.loadExplanation(0);
  }

  private async loadExplanation(index: number): Promise<void> {
    if (this.explanations.has(index)) {
      this.mode = "viewing";
      this.version++;
      this.tui.requestRender();
      return;
    }

    this.mode = "loading";
    this.version++;
    this.tui.requestRender();

    this.abortController = new AbortController();
    const explanation = await getExplanation(
      this.hunks[index],
      this.ctx,
      this.abortController.signal
    );
    this.explanations.set(index, explanation);
    this.abortController = null;

    this.mode = "viewing";
    this.version++;
    this.tui.requestRender();
  }

  private navigate(delta: number): void {
    const newIndex = this.currentIndex + delta;
    if (newIndex >= 0 && newIndex < this.hunks.length) {
      this.currentIndex = newIndex;
      this.diffScrollOffset = 0;
      this.detailScrollOffset = 0;
      this.chatHistory = [];
      this.loadExplanation(newIndex);
    }
  }

  private setActivePane(pane: ViewerPane): void {
    if (this.activePane !== pane) {
      this.activePane = pane;
      this.version++;
      this.tui.requestRender();
    }
  }

  private getDetailViewportSize(): number {
    return this.mode === "chatting" ? 8 : 10;
  }

  private getDetailContentLines(innerWidth: number): string[] {
    const lines: string[] = [];
    const explanation = this.explanations.get(this.currentIndex);
    const accent = (s: string) => this.theme.fg("accent", s);
    const bold = (s: string) => this.theme.bold(s);
    const muted = (s: string) => this.theme.fg("muted", s);

    lines.push(accent(bold("Explanation")));
    if (this.mode === "loading" && !explanation) {
      lines.push(muted("Loading explanation..."));
    } else if (explanation) {
      lines.push(...wrapTextWithAnsi(explanation, innerWidth));
    } else {
      lines.push(muted("No explanation yet."));
    }

    if (this.chatHistory.length > 0 || this.mode === "chatting") {
      lines.push("");
      lines.push(accent(bold("Chat")));

      for (const msg of this.chatHistory) {
        const prefix = msg.role === "user" ? accent("You: ") : muted("AI: ");
        const wrapped = wrapTextWithAnsi(msg.text, Math.max(1, innerWidth - 5));
        for (let i = 0; i < wrapped.length; i++) {
          lines.push((i === 0 ? prefix : "     ") + wrapped[i]);
        }
        lines.push("");
      }

      if (this.mode === "loading" && this.abortController) {
        lines.push(muted("Loading reply..."));
      }

      if (lines[lines.length - 1] === "") {
        lines.pop();
      }
    }

    return lines;
  }

  private scrollActivePane(delta: number, width: number): void {
    const innerWidth = Math.max(10, width - 4);

    if (this.activePane === "diff") {
      const maxOffset = Math.max(0, this.hunks[this.currentIndex].lines.length - 12);
      const nextOffset = Math.max(0, Math.min(maxOffset, this.diffScrollOffset + delta));
      if (nextOffset !== this.diffScrollOffset) {
        this.diffScrollOffset = nextOffset;
        this.version++;
        this.tui.requestRender();
      }
      return;
    }

    const detailLines = this.getDetailContentLines(innerWidth);
    const maxOffset = Math.max(0, detailLines.length - this.getDetailViewportSize());
    const nextOffset = Math.max(0, Math.min(maxOffset, this.detailScrollOffset + delta));
    if (nextOffset !== this.detailScrollOffset) {
      this.detailScrollOffset = nextOffset;
      this.version++;
      this.tui.requestRender();
    }
  }

  private async sendChatMessage(): Promise<void> {
    const text = this.chatInput.getText().trim();
    if (!text || !this.ctx.model) return;

    this.chatHistory.push({ role: "user", text });
    this.chatInput.setText("");
    this.mode = "loading";
    this.version++;
    this.tui.requestRender();

    const hunk = this.hunks[this.currentIndex];
    const diffContext = `File: ${hunk.file}
${hunk.hunkHeader}
${hunk.lines.join("\n")}`;

    const messages: UserMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Here's the diff I'm looking at:\n\n${diffContext}\n\nMy explanation of it: ${this.explanations.get(this.currentIndex) || "Loading..."}`,
          },
        ],
        timestamp: Date.now(),
      },
    ];

    // Add chat history
    for (const msg of this.chatHistory) {
      messages.push({
        role: "user",
        content: [{ type: "text", text: msg.role === "user" ? msg.text : `[Previous assistant response]: ${msg.text}` }],
        timestamp: Date.now(),
      });
    }

    const auth = await this.ctx.modelRegistry.getApiKeyAndHeaders(this.ctx.model);
    if (!auth.ok || !auth.apiKey) {
      this.chatHistory.push({ role: "assistant", text: `No API key for ${this.ctx.model.provider}` });
      this.mode = "chatting";
      this.activePane = "detail";
      this.version++;
      this.tui.requestRender();
      return;
    }

    this.abortController = new AbortController();
    try {
      const response = await complete(
        this.ctx.model,
        {
          systemPrompt:
            "You are helping a developer understand a git diff. Answer their questions concisely and helpfully.",
          messages,
        },
        { apiKey: auth.apiKey, headers: auth.headers, signal: this.abortController.signal }
      );

      const responseText = response.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("\n");

      this.chatHistory.push({ role: "assistant", text: responseText });
    } catch (err) {
      if (!this.abortController.signal.aborted) {
        this.chatHistory.push({ role: "assistant", text: `Error: ${err}` });
      }
    }

    this.abortController = null;
    this.mode = "chatting";
    this.activePane = "detail";
    this.version++;
    this.tui.requestRender();
  }

  handleInput(data: string): void {
    // Global escape handling
    if (matchesKey(data, Key.escape)) {
      if (this.mode === "chatting") {
        this.mode = "viewing";
        this.version++;
        this.tui.requestRender();
        return;
      }
      if (this.mode === "loading" && this.abortController) {
        this.abortController.abort();
        return;
      }
      this.dispose();
      this.onClose();
      return;
    }

    // Quit
    if (data === "q" || data === "Q") {
      this.dispose();
      this.onClose();
      return;
    }

    // Chat mode input
    if (this.mode === "chatting") {
      if (matchesKey(data, Key.enter) && !matchesKey(data, Key.shift("enter"))) {
        this.sendChatMessage();
        return;
      }
      this.chatInput.handleInput(data);
      this.version++;
      this.tui.requestRender();
      return;
    }

    // Viewing mode controls
    if (this.mode === "viewing") {
      if (data === "h" || data === "H") {
        this.setActivePane("diff");
        return;
      }
      if (data === "l" || data === "L") {
        this.setActivePane("detail");
        return;
      }

      // Navigation
      if (matchesKey(data, "n") || matchesKey(data, Key.right)) {
        this.navigate(1);
        return;
      }
      if (matchesKey(data, "p") || matchesKey(data, Key.left)) {
        this.navigate(-1);
        return;
      }

      // Scroll active pane
      if (matchesKey(data, Key.down) || data === "j") {
        this.scrollActivePane(1, this.cachedWidth || 80);
        return;
      }
      if (matchesKey(data, Key.up) || data === "k") {
        this.scrollActivePane(-1, this.cachedWidth || 80);
        return;
      }

      // Enter chat mode
      if (matchesKey(data, Key.enter) || data === "c" || data === "C") {
        this.mode = "chatting";
        this.activePane = "detail";
        this.version++;
        this.tui.requestRender();
        return;
      }
    }
  }

  render(width: number): string[] {
    if (width === this.cachedWidth && this.cachedVersion === this.version) {
      return this.cachedLines;
    }

    const lines: string[] = [];
    const hunk = this.hunks[this.currentIndex];

    const dim = (s: string) => this.theme.fg("dim", s);
    const accent = (s: string) => this.theme.fg("accent", s);
    const bold = (s: string) => this.theme.bold(s);
    const muted = (s: string) => this.theme.fg("muted", s);
    const added = (s: string) => this.theme.fg("toolDiffAdded", s);
    const removed = (s: string) => this.theme.fg("toolDiffRemoved", s);

    const innerWidth = width - 4;
    const border = (s: string) => dim(s);
    const sectionTitle = (label: string, pane: ViewerPane) => {
      const title = this.activePane === pane ? accent(bold(`▶ ${label}`)) : muted(`  ${label}`);
      return border("│ ") + title + " ".repeat(Math.max(0, innerWidth - visibleWidth(title))) + border(" │");
    };

    // Top border
    lines.push(border(`╭${"─".repeat(width - 2)}╮`));

    // Header
    const progress = `[${this.currentIndex + 1}/${this.hunks.length}]`;
    const fileDisplay = hunk.oldFile ? `${hunk.oldFile} → ${hunk.file}` : hunk.file;
    const hunkInfo =
      hunk.totalHunksInFile > 1 ? ` (hunk ${hunk.hunkIndex + 1}/${hunk.totalHunksInFile})` : "";
    const headerText = `${accent(bold(progress))} ${bold(fileDisplay)}${muted(hunkInfo)}`;
    lines.push(
      border("│ ") +
        truncateToWidth(headerText, innerWidth) +
        " ".repeat(Math.max(0, innerWidth - visibleWidth(headerText))) +
        border(" │")
    );

    // Summary line
    lines.push(
      border("│ ") +
        muted(truncateToWidth(this.summary, innerWidth)) +
        " ".repeat(Math.max(0, innerWidth - visibleWidth(this.summary))) +
        border(" │")
    );

    // Diff pane
    lines.push(border(`├${"─".repeat(width - 2)}┤`));
    lines.push(sectionTitle("Diff", "diff"));

    const maxDiffLines = 12;
    const maxDiffOffset = Math.max(0, hunk.lines.length - maxDiffLines);
    const diffOffset = Math.min(this.diffScrollOffset, maxDiffOffset);
    const diffLines = hunk.lines.slice(diffOffset, diffOffset + maxDiffLines);
    const diffHasMoreAbove = diffOffset > 0;
    const diffHasMoreBelow = diffOffset + maxDiffLines < hunk.lines.length;

    if (diffHasMoreAbove) {
      const text = muted(`  ↑ ${diffOffset} more lines above`);
      lines.push(border("│ ") + text + " ".repeat(Math.max(0, innerWidth - visibleWidth(text))) + border(" │"));
    }

    for (const line of diffLines) {
      let styledLine: string;
      if (line.startsWith("+")) {
        styledLine = added(line);
      } else if (line.startsWith("-")) {
        styledLine = removed(line);
      } else {
        styledLine = dim(line);
      }
      const truncated = truncateToWidth(styledLine, innerWidth);
      const padding = Math.max(0, innerWidth - visibleWidth(truncated));
      lines.push(border("│ ") + truncated + " ".repeat(padding) + border(" │"));
    }

    if (diffHasMoreBelow) {
      const remaining = hunk.lines.length - (diffOffset + maxDiffLines);
      const text = muted(`  ↓ ${remaining} more lines below`);
      lines.push(border("│ ") + text + " ".repeat(Math.max(0, innerWidth - visibleWidth(text))) + border(" │"));
    }

    // Detail pane
    lines.push(border(`├${"─".repeat(width - 2)}┤`));
    lines.push(sectionTitle("Explanation / Chat", "detail"));

    const detailContent = this.getDetailContentLines(innerWidth);
    const detailViewportSize = this.getDetailViewportSize();
    const maxDetailOffset = Math.max(0, detailContent.length - detailViewportSize);
    const detailOffset = Math.min(this.detailScrollOffset, maxDetailOffset);
    const detailLines = detailContent.slice(detailOffset, detailOffset + detailViewportSize);
    const detailHasMoreAbove = detailOffset > 0;
    const detailHasMoreBelow = detailOffset + detailViewportSize < detailContent.length;

    if (detailHasMoreAbove) {
      const text = muted(`  ↑ ${detailOffset} more lines above`);
      lines.push(border("│ ") + text + " ".repeat(Math.max(0, innerWidth - visibleWidth(text))) + border(" │"));
    }

    for (const detailLine of detailLines) {
      const truncated = truncateToWidth(detailLine, innerWidth);
      const padding = Math.max(0, innerWidth - visibleWidth(truncated));
      lines.push(border("│ ") + truncated + " ".repeat(padding) + border(" │"));
    }

    if (detailHasMoreBelow) {
      const remaining = detailContent.length - (detailOffset + detailViewportSize);
      const text = muted(`  ↓ ${remaining} more lines below`);
      lines.push(border("│ ") + text + " ".repeat(Math.max(0, innerWidth - visibleWidth(text))) + border(" │"));
    }

    if (this.mode === "chatting") {
      lines.push(border(`├${"─".repeat(width - 2)}┤`));
      const inputLabel = accent(bold("Chat input"));
      lines.push(border("│ ") + inputLabel + " ".repeat(Math.max(0, innerWidth - visibleWidth(inputLabel))) + border(" │"));
      const inputLines = this.chatInput.render(innerWidth);
      for (const inputLine of inputLines) {
        lines.push(
          border("│ ") +
            inputLine +
            " ".repeat(Math.max(0, innerWidth - visibleWidth(inputLine))) +
            border(" │")
        );
      }
    }

    // Help footer
    lines.push(border(`├${"─".repeat(width - 2)}┤`));
    let helpText: string;
    if (this.mode === "loading") {
      helpText = muted("Loading... (ESC to cancel)");
    } else if (this.mode === "chatting") {
      helpText = muted("Enter: send • Shift+Enter: newline • ESC: back • q: quit");
    } else {
      helpText = muted("n/→: next • p/←: prev • h/l: switch pane • j/k: scroll pane • c/Enter: chat • ESC/q: quit");
    }
    const helpPadding = Math.max(0, innerWidth - visibleWidth(helpText));
    lines.push(border("│ ") + helpText + " ".repeat(helpPadding) + border(" │"));

    // Bottom border
    lines.push(border(`╰${"─".repeat(width - 2)}╯`));

    this.cachedLines = lines;
    this.cachedWidth = width;
    this.cachedVersion = this.version;

    return lines;
  }

  invalidate(): void {
    this.cachedWidth = 0;
  }

  dispose(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Extension Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  pi.registerCommand("diff", {
    description: "Interactive git diff viewer with AI explanations",
    handler: async (args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("diff viewer requires interactive mode", "error");
        return;
      }

      let result: CommandResult;

      if (!args?.trim()) {
        result = await getWorkingTreeDiff(pi);
      } else {
        const trimmedArgs = args.trim();
        const diffCmd =
          trimmedArgs === "--staged" || trimmedArgs === "--cached"
            ? "git diff --staged"
            : `git diff ${trimmedArgs}`;

        result = await pi.exec("bash", ["-c", diffCmd], { timeout: 10000 });
      }

      if (result.code !== 0) {
        ctx.ui.notify(`Git diff failed: ${result.stderr}`, "error");
        return;
      }

      if (!result.stdout.trim()) {
        ctx.ui.notify("No changes found", "info");
        return;
      }

      // Parse diff
      const parsed = parseDiff(result.stdout);

      if (parsed.hunks.length === 0) {
        ctx.ui.notify("No diff hunks found", "info");
        return;
      }

      // Show viewer
      await ctx.ui.custom((tui, theme, _kb, done) => {
        return new DiffViewerComponent(
          tui,
          theme,
          ctx,
          parsed.hunks,
          parsed.summary,
          () => done(undefined)
        );
      });
    },
  });
}
