import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createBashTool, createEditTool, createReadTool, createWriteTool } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { homedir } from "os";
import {
	createDockerComposeBashOps,
	createDockerComposeEditOps,
	createDockerComposeReadOps,
	createDockerComposeWriteOps,
} from "../docker/ops.js";
import { createSandboxBashOps } from "../sandbox/ops.js";
import { getWorkdir } from "../core/strategy.js";
import type { ExecutionState } from "../core/types.js";

/**
 * Shorten a path by replacing home directory with ~
 */
function shortenPath(path: string): string {
	const home = homedir();
	if (path.startsWith(home)) {
		return `~${path.slice(home.length)}`;
	}
	return path;
}

export function registerTools(pi: ExtensionAPI, state: ExecutionState, localCwd: string): void {
	const localRead = createReadTool(localCwd);
	const localWrite = createWriteTool(localCwd);
	const localEdit = createEditTool(localCwd);
	const localBash = createBashTool(localCwd);

	pi.registerTool({
		...localRead,
		label: "read (env)",
		async execute(id, params, signal, onUpdate, ctx) {
			if (state.strategy === "docker" && state.composeFilePath && state.activeService && state.serviceRunning) {
				const tool = createReadTool(localCwd, {
					operations: createDockerComposeReadOps(ctx.cwd, state.composeFilePath, state.activeService, getWorkdir(state)),
				});
				return tool.execute(id, params, signal, onUpdate);
			}
			// Sandbox doesn't affect read - use local
			return localRead.execute(id, params, signal, onUpdate);
		},
		renderCall(args, theme, _context) {
			const path = shortenPath(args.path || "");
			let pathDisplay = path ? theme.fg("accent", path) : theme.fg("toolOutput", "...");

			// Show line range if specified
			if (args.offset !== undefined || args.limit !== undefined) {
				const startLine = args.offset ?? 1;
				const endLine = args.limit !== undefined ? startLine + args.limit - 1 : "";
				pathDisplay += theme.fg("warning", `:${startLine}${endLine ? `-${endLine}` : ""}`);
			}

			return new Text(`${theme.fg("toolTitle", theme.bold("read"))} ${pathDisplay}`, 0, 0);
		},
		renderResult(result, { expanded }, theme, _context) {
			// Minimal mode: show nothing in collapsed state
			if (!expanded) {
				return new Text("", 0, 0);
			}

			// Expanded mode: show full output
			const textContent = result.content.find((c) => c.type === "text");
			if (!textContent || textContent.type !== "text") {
				return new Text("", 0, 0);
			}

			const lines = textContent.text.split("\n");
			const output = lines.map((line) => theme.fg("toolOutput", line)).join("\n");
			return new Text(`\n${output}`, 0, 0);
		},
	});

	pi.registerTool({
		...localWrite,
		label: "write (env)",
		async execute(id, params, signal, onUpdate, ctx) {
			if (state.strategy === "docker" && state.composeFilePath && state.activeService && state.serviceRunning) {
				const tool = createWriteTool(localCwd, {
					operations: createDockerComposeWriteOps(
						ctx.cwd,
						state.composeFilePath,
						state.activeService,
						getWorkdir(state),
					),
				});
				return tool.execute(id, params, signal, onUpdate);
			}
			// Sandbox doesn't affect write - use local
			return localWrite.execute(id, params, signal, onUpdate);
		},
		renderCall(args, theme, _context) {
			const path = shortenPath(args.path || "");
			const pathDisplay = path ? theme.fg("accent", path) : theme.fg("toolOutput", "...");
			const lineCount = args.content ? args.content.split("\n").length : 0;
			const lineInfo = lineCount > 0 ? theme.fg("muted", ` (${lineCount} lines)`) : "";

			return new Text(`${theme.fg("toolTitle", theme.bold("write"))} ${pathDisplay}${lineInfo}`, 0, 0);
		},
		renderResult(result, { expanded }, theme, _context) {
			// Minimal mode: show nothing (file was written)
			if (!expanded) {
				return new Text("", 0, 0);
			}

			// Expanded mode: show error if any
			if (result.content.some((c) => c.type === "text" && c.text)) {
				const textContent = result.content.find((c) => c.type === "text");
				if (textContent?.type === "text" && textContent.text) {
					return new Text(`\n${theme.fg("error", textContent.text)}`, 0, 0);
				}
			}

			return new Text("", 0, 0);
		},
	});

	pi.registerTool({
		...localEdit,
		label: "edit (env)",
		async execute(id, params, signal, onUpdate, ctx) {
			if (state.strategy === "docker" && state.composeFilePath && state.activeService && state.serviceRunning) {
				const tool = createEditTool(localCwd, {
					operations: createDockerComposeEditOps(ctx.cwd, state.composeFilePath, state.activeService, getWorkdir(state)),
				});
				return tool.execute(id, params, signal, onUpdate);
			}
			// Sandbox doesn't affect edit - use local
			return localEdit.execute(id, params, signal, onUpdate);
		},
		renderCall(args, theme, _context) {
			const path = shortenPath(args.path || "");
			const pathDisplay = path ? theme.fg("accent", path) : theme.fg("toolOutput", "...");

			return new Text(`${theme.fg("toolTitle", theme.bold("edit"))} ${pathDisplay}`, 0, 0);
		},
		renderResult(result, { expanded }, theme, _context) {
			// Minimal mode: show nothing in collapsed state
			if (!expanded) {
				return new Text("", 0, 0);
			}

			// Expanded mode: show diff or error
			const textContent = result.content.find((c) => c.type === "text");
			if (!textContent || textContent.type !== "text") {
				return new Text("", 0, 0);
			}

			// For errors, show the error message
			const text = textContent.text;
			if (text.includes("Error") || text.includes("error")) {
				return new Text(`\n${theme.fg("error", text)}`, 0, 0);
			}

			// Otherwise show the text (would be nice to show actual diff here)
			return new Text(`\n${theme.fg("toolOutput", text)}`, 0, 0);
		},
	});

	pi.registerTool({
		...localBash,
		label: "bash (env)",
		async execute(id, params, signal, onUpdate, ctx) {
			if (state.strategy === "docker" && state.composeFilePath && state.activeService && state.serviceRunning) {
				const tool = createBashTool(localCwd, {
					operations: createDockerComposeBashOps(ctx.cwd, state.composeFilePath, state.activeService, getWorkdir(state)),
				});
				return tool.execute(id, params, signal, onUpdate);
			}
			if (state.strategy === "sandbox" && state.sandboxInitialized) {
				const tool = createBashTool(localCwd, {
					operations: createSandboxBashOps(),
				});
				return tool.execute(id, params, signal, onUpdate);
			}
			return localBash.execute(id, params, signal, onUpdate);
		},
		renderCall(args, theme, _context) {
			const command = args.command || "...";
			const timeout = args.timeout as number | undefined;
			const timeoutSuffix = timeout ? theme.fg("muted", ` (timeout ${timeout}s)`) : "";

			return new Text(theme.fg("toolTitle", theme.bold(`$ ${command}`)) + timeoutSuffix, 0, 0);
		},
		renderResult(result, { expanded }, theme, _context) {
			// Minimal mode: show nothing in collapsed state
			if (!expanded) {
				return new Text("", 0, 0);
			}

			// Expanded mode: show full output
			const textContent = result.content.find((c) => c.type === "text");
			if (!textContent || textContent.type !== "text") {
				return new Text("", 0, 0);
			}

			const output = textContent.text
				.trim()
				.split("\n")
				.map((line) => theme.fg("toolOutput", line))
				.join("\n");

			if (!output) {
				return new Text("", 0, 0);
			}

			return new Text(`\n${output}`, 0, 0);
		},
	});

	// Handle user ! commands
	pi.on("user_bash", () => {
		if (state.strategy === "docker" && state.composeFilePath && state.activeService && state.serviceRunning) {
			return {
				operations: createDockerComposeBashOps(localCwd, state.composeFilePath, state.activeService, getWorkdir(state)),
			};
		}
		if (state.strategy === "sandbox" && state.sandboxInitialized) {
			return { operations: createSandboxBashOps() };
		}
		return; // Use local
	});
}
