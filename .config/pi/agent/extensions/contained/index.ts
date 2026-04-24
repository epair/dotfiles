/**
 * Contained — tool execution routed through a contained environment.
 *
 * Provides sandboxed tool execution with execution strategies and permission gates:
 *
 * Execution Strategies:
 * 1. Docker Compose (preferred when docker-compose.yml exists)
 * 2. OS-level sandbox via @anthropic-ai/sandbox-runtime (fallback)
 * 3. Local execution (no containment)
 *
 * Permission Gate:
 * Applies to ALL strategies - checks commands against patterns before execution.
 * Different patterns can be configured per execution environment:
 * - local: strictest (most patterns, since no containment)
 * - sandbox: medium (some patterns, sandbox handles most isolation)
 * - docker: relaxed (minimal patterns, container is isolated)
 *
 * Strategy resolution:
 * - If docker-compose.yml exists and Docker is available → use Docker Compose
 * - Otherwise if sandbox is enabled and supported → use OS-level sandbox
 * - Otherwise → use local execution
 *
 * Configuration: .pi/contained.json (or ~/.pi/agent/extensions/contained.json)
 * ```json
 * {
 *   "strategy": "sandbox",
 *   "docker": {
 *     "enabled": true,
 *     "service": "app",
 *     "workdir": "/workspace"
 *   },
 *   "sandbox": {
 *     "enabled": true,
 *     "network": { "allowedDomains": ["github.com", "*.npmjs.org"] },
 *     "filesystem": { "denyRead": ["~/.ssh"], "allowWrite": [".", "/tmp"] }
 *   },
 *   "permissions": {
 *     "enabled": true,
 *     "local": {
 *       "dangerous": ["\\brm\\s+-rf", "\\bsudo\\b"],
 *       "blocked": ["\\bcurl.*\\|.*bash"]
 *     },
 *     "sandbox": {
 *       "dangerous": ["\\brm\\s+-rf"]
 *     },
 *     "docker": {}
 *   }
 * }
 * ```
 *
 * Commands:
 * - /env - Show current execution environment status
 * - /contained - Configure all settings (strategy, docker, sandbox, permissions)
 * - /docker - Configure Docker Compose settings
 * - /sandbox - Configure Sandbox settings
 * - /permissions - Configure permission gate settings
 *
 * Flags:
 * - --no-docker - Disable Docker even if configured
 * - --no-sandbox - Disable sandbox (use local execution)
 */

import { SandboxManager } from "@anthropic-ai/sandbox-runtime";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { DEFAULT_CONTAINED_CONFIG } from "./core/config.js";
import { registerCommands } from "./pi/commands.js";
import { getWorkdir, initializeStrategy } from "./core/strategy.js";
import { registerTools } from "./pi/tools.js";
import type { ExecutionState } from "./core/types.js";

export default function (pi: ExtensionAPI) {
	const state: ExecutionState = {
		strategy: "local",
		config: structuredClone(DEFAULT_CONTAINED_CONFIG),
		dockerAvailable: false,
		dockerComposeAvailable: false,
		composeFileExists: false,
		composeFilePath: null,
		composeServices: [],
		activeService: null,
		serviceRunning: false,
		sandboxInitialized: false,
		sessionApprovals: new Set(),
	};

	const localCwd = process.cwd();

	pi.registerFlag("no-docker", {
		description: "Disable Docker execution even if docker-compose.yml exists",
		type: "boolean",
		default: false,
	});

	pi.registerFlag("no-sandbox", {
		description: "Disable OS-level sandbox (use local execution)",
		type: "boolean",
		default: false,
	});

	registerTools(pi, state, localCwd);
	registerCommands(pi, state);

	pi.on("session_start", async (_event, ctx) => {
		await initializeStrategy(pi, state, ctx);
	});

	pi.on("session_shutdown", async () => {
		// Clean up sandbox
		if (state.sandboxInitialized) {
			try {
				await SandboxManager.reset();
			} catch {
				// Ignore
			}
		}
		// Note: We don't stop Docker Compose services on shutdown to allow reuse
	});

	// System prompt modification to inform the LLM about execution environment
	pi.on("before_agent_start", async (event) => {
		let envInfo = "";

		switch (state.strategy) {
			case "docker": {
				const service = state.activeService || "unknown";
				const workdir = getWorkdir(state);
				envInfo = `\n\nNote: Commands are executed in Docker Compose service '${service}'.`;
				envInfo += `\nWorking directory in container: ${workdir}`;
				if (state.composeFilePath) {
					envInfo += `\nCompose file: ${state.composeFilePath}`;
				}
				break;
			}
			case "sandbox":
				envInfo =
					"\n\nNote: Commands are executed in a sandboxed environment with restricted network and filesystem access.";
				break;
			case "local":
				// Check if permission gate is active
				if (state.config.permissions?.enabled) {
					const localPerms = state.config.permissions.local;
					const patternCount = (localPerms?.dangerous?.length || 0) + (localPerms?.blocked?.length || 0);
					if (patternCount > 0) {
						envInfo =
							"\n\nNote: Commands are executed locally but potentially dangerous commands require user approval.";
					}
				}
				break;
		}

		if (envInfo) {
			return { systemPrompt: event.systemPrompt + envInfo };
		}
	});
}
