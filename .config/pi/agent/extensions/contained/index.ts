/**
 * Contained — tool execution routed through a contained environment.
 *
 * Provides sandboxed tool execution with two strategies:
 * 1. Docker Compose (preferred when docker-compose.yml exists)
 * 2. OS-level sandbox via @anthropic-ai/sandbox-runtime (fallback)
 *
 * Strategy resolution:
 * - If docker-compose.yml exists and Docker is available → use Docker Compose
 * - Otherwise if sandbox is enabled → use OS-level sandbox
 * - Otherwise → use local execution
 *
 * Docker config: .pi/docker.json (minimal, references docker-compose service)
 * ```json
 * {
 *   "enabled": true,
 *   "service": "app",
 *   "workdir": "/workspace"
 * }
 * ```
 *
 * Sandbox config: .pi/sandbox.json or ~/.pi/agent/extensions/sandbox.json
 * ```json
 * {
 *   "enabled": true,
 *   "network": {
 *     "allowedDomains": ["github.com", "*.npmjs.org"],
 *     "deniedDomains": []
 *   },
 *   "filesystem": {
 *     "denyRead": ["~/.ssh", "~/.aws"],
 *     "allowWrite": [".", "/tmp"],
 *     "denyWrite": [".env"]
 *   }
 * }
 * ```
 *
 * Commands:
 * - /env - Show current execution environment status
 * - /docker - Configure Docker Compose settings
 * - /sandbox - Configure Sandbox settings
 *
 * Flags:
 * - --no-docker - Disable Docker even if configured
 * - --no-sandbox - Disable sandbox (use local execution)
 */

import { SandboxManager } from "@anthropic-ai/sandbox-runtime";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerCommands } from "./pi/commands.js";
import { getWorkdir, initializeStrategy } from "./core/strategy.js";
import { registerTools } from "./pi/tools.js";
import type { ExecutionState } from "./core/types.js";

export default function (pi: ExtensionAPI) {
	const state: ExecutionState = {
		strategy: "local",
		dockerConfig: null,
		sandboxConfig: null,
		dockerAvailable: false,
		dockerComposeAvailable: false,
		composeFileExists: false,
		composeFilePath: null,
		composeServices: [],
		activeService: null,
		serviceRunning: false,
		sandboxInitialized: false,
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
		}

		if (envInfo) {
			return { systemPrompt: event.systemPrompt + envInfo };
		}
	});
}
