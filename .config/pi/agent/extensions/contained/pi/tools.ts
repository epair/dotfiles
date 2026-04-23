import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createBashTool, createEditTool, createReadTool, createWriteTool } from "@mariozechner/pi-coding-agent";
import {
	createDockerComposeBashOps,
	createDockerComposeEditOps,
	createDockerComposeReadOps,
	createDockerComposeWriteOps,
} from "../docker/ops.js";
import { createSandboxBashOps } from "../sandbox/ops.js";
import { getWorkdir } from "../core/strategy.js";
import type { ExecutionState } from "../core/types.js";

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
