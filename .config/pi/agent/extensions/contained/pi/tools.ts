import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { createBashTool, createEditTool, createReadTool, createWriteTool } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { createHash } from "crypto";
import { homedir } from "os";
import {
	createDockerComposeBashOps,
	createDockerComposeEditOps,
	createDockerComposeReadOps,
	createDockerComposeWriteOps,
} from "../docker/ops.js";
import { createSandboxBashOps } from "../sandbox/ops.js";
import { getPermissionPatterns } from "../core/config.js";
import { getWorkdir } from "../core/strategy.js";
import type { EnvironmentPermissions, ExecutionState } from "../core/types.js";

/**
 * Check if a command matches any patterns
 */
function matchesPattern(
	command: string,
	patterns: string[],
): { matches: boolean; matchedPattern?: string } {
	for (const patternStr of patterns) {
		try {
			const regex = new RegExp(patternStr, "i");
			if (regex.test(command)) {
				return { matches: true, matchedPattern: patternStr };
			}
		} catch {
			// Invalid regex pattern, skip it
		}
	}
	return { matches: false };
}

/**
 * Generate a hash for a command (used for session approvals)
 */
function hashCommand(command: string): string {
	return createHash("sha256").update(command.trim()).digest("hex").slice(0, 16);
}

/**
 * Check if a command has been approved this session
 */
function isCommandApproved(command: string, state: ExecutionState): boolean {
	return state.sessionApprovals.has(hashCommand(command));
}

/**
 * Request permission for a dangerous command
 */
async function requestPermission(
	command: string,
	matchedPattern: string,
	state: ExecutionState,
	ctx: ExtensionContext,
): Promise<{ allowed: boolean; remember: boolean }> {
	if (!ctx.hasUI) {
		// Non-interactive mode - block by default
		return { allowed: false, remember: false };
	}

	const theme = ctx.ui.theme;

	// Truncate command if too long for display
	const displayCommand = command.length > 200 ? command.slice(0, 197) + "..." : command;

	const strategyLabel = state.strategy.charAt(0).toUpperCase() + state.strategy.slice(1);

	const message = [
		`⚠️  ${theme.bold("Potentially dangerous command detected")}`,
		"",
		theme.fg("accent", `  ${displayCommand}`),
		"",
		theme.fg("dim", `Strategy: ${strategyLabel} | Pattern: ${matchedPattern}`),
		"",
		"Allow this command?",
	].join("\n");

	const choice = await ctx.ui.select(message, [
		"Yes, run once",
		"Yes, and remember for this session",
		"No, block it",
	]);

	if (choice === "Yes, run once") {
		return { allowed: true, remember: false };
	} else if (choice === "Yes, and remember for this session") {
		return { allowed: true, remember: true };
	}

	return { allowed: false, remember: false };
}

/**
 * Check command against permission patterns for current strategy
 */
async function checkPermissions(
	command: string,
	state: ExecutionState,
	ctx: ExtensionContext,
): Promise<{ allowed: boolean; reason?: string }> {
	if (!state.config.permissions?.enabled) {
		return { allowed: true };
	}

	const permissions: EnvironmentPermissions = getPermissionPatterns(state.config, state.strategy);

	// Check blocked patterns first (no override possible)
	if (permissions.blocked?.length) {
		const { matches, matchedPattern } = matchesPattern(command, permissions.blocked);
		if (matches) {
			return {
				allowed: false,
				reason: `Command blocked by policy (pattern: ${matchedPattern})`,
			};
		}
	}

	// Check dangerous patterns (user can approve)
	if (permissions.dangerous?.length) {
		const { matches, matchedPattern } = matchesPattern(command, permissions.dangerous);
		if (matches && matchedPattern) {
			// Check if already approved this session
			if (isCommandApproved(command, state)) {
				return { allowed: true };
			}

			// Request permission
			const { allowed, remember } = await requestPermission(command, matchedPattern, state, ctx);

			if (!allowed) {
				return {
					allowed: false,
					reason: `Command blocked by user (pattern: ${matchedPattern})`,
				};
			}

			if (remember) {
				state.sessionApprovals.add(hashCommand(command));
			}
		}
	}

	return { allowed: true };
}

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
			if (!expanded) {
				return new Text("", 0, 0);
			}

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
			if (!expanded) {
				return new Text("", 0, 0);
			}

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
			if (!expanded) {
				return new Text("", 0, 0);
			}

			const textContent = result.content.find((c) => c.type === "text");
			if (!textContent || textContent.type !== "text") {
				return new Text("", 0, 0);
			}

			const text = textContent.text;
			if (text.includes("Error") || text.includes("error")) {
				return new Text(`\n${theme.fg("error", text)}`, 0, 0);
			}

			return new Text(`\n${theme.fg("toolOutput", text)}`, 0, 0);
		},
	});

	pi.registerTool({
		...localBash,
		label: "bash (env)",
		async execute(id, params, signal, onUpdate, ctx) {
			const command = params.command as string;

			// Check permissions BEFORE routing to any strategy
			const { allowed, reason } = await checkPermissions(command, state, ctx);
			if (!allowed) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Command blocked: ${command}\n\n${reason}`,
						},
					],
				};
			}

			// Route to appropriate execution strategy
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
			if (!expanded) {
				return new Text("", 0, 0);
			}

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
