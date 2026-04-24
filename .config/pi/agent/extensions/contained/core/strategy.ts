import { SandboxManager } from "@anthropic-ai/sandbox-runtime";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	findComposeFile,
	getRunningServices,
	isDockerAvailable,
	isDockerComposeAvailable,
	isServiceRunning,
	parseComposeFile,
	startComposeService,
} from "../docker/compose.js";
import { loadContainedConfig, saveContainedConfig } from "./config.js";
import type { ExecutionState } from "./types.js";

export function getWorkdir(state: ExecutionState): string {
	// Priority: config workdir > service working_dir > /app
	if (state.config.docker?.workdir) {
		return state.config.docker.workdir;
	}
	if (state.activeService) {
		const service = state.composeServices.find((s) => s.name === state.activeService);
		if (service?.working_dir) {
			return service.working_dir;
		}
	}
	return "/app";
}

export function updateStatus(state: ExecutionState, ctx: ExtensionContext) {
	const theme = ctx.ui.theme;
	let statusText = "";

	// Base strategy status
	switch (state.strategy) {
		case "docker": {
			const icon = state.serviceRunning ? "🐳" : "🐳⏸";
			const svc = state.activeService || "?";
			statusText = theme.fg("accent", `${icon} Docker: ${svc}`);
			break;
		}
		case "sandbox":
			statusText = theme.fg("warning", "🔒 Sandbox");
			break;
		case "local":
			statusText = theme.fg("dim", "💻 Local");
			break;
	}

	// Add permission gate indicator if enabled
	if (state.config.permissions?.enabled) {
		const patterns = state.config.permissions[state.strategy];
		const hasPatterns = (patterns?.dangerous?.length || 0) + (patterns?.blocked?.length || 0) > 0;
		if (hasPatterns) {
			statusText += theme.fg("success", " +🛡️");
		}
	}

	ctx.ui.setStatus("contained", statusText);
}

export async function selectService(state: ExecutionState, ctx: ExtensionContext): Promise<string | null> {
	if (state.composeServices.length === 0) {
		ctx.ui.notify("No services found in docker-compose.yml", "error");
		return null;
	}

	if (state.composeServices.length === 1) {
		return state.composeServices[0].name;
	}

	// Build selection options with details
	const options = state.composeServices.map((s) => {
		let desc = s.name;
		if (s.image) desc += ` (${s.image})`;
		else if (s.build) desc += " (build)";
		return desc;
	});

	const choice = await ctx.ui.select("Select Docker Compose service:", options);
	if (!choice) return null;

	// Extract service name from choice
	const serviceName = choice.split(" ")[0];
	return serviceName;
}

export async function initializeStrategy(
	pi: ExtensionAPI,
	state: ExecutionState,
	ctx: ExtensionContext,
): Promise<void> {
	const noDocker = pi.getFlag("no-docker") as boolean;
	const noSandbox = pi.getFlag("no-sandbox") as boolean;

	// Load consolidated config
	state.config = loadContainedConfig(ctx.cwd);

	// Check Docker availability
	state.dockerAvailable = isDockerAvailable();
	state.dockerComposeAvailable = isDockerComposeAvailable();

	// Find docker-compose.yml
	state.composeFilePath = findComposeFile(ctx.cwd, state.config.docker?.composeFile);
	state.composeFileExists = state.composeFilePath !== null;

	if (state.composeFilePath) {
		state.composeServices = parseComposeFile(state.composeFilePath);
	}

	// Determine strategy
	const preferredStrategy = state.config.strategy;

	// Try Docker Compose
	if (
		!noDocker &&
		(preferredStrategy === "docker" || preferredStrategy === undefined) &&
		state.config.docker?.enabled !== false &&
		state.composeFileExists &&
		state.dockerAvailable &&
		state.dockerComposeAvailable
	) {
		let service = state.config.docker?.service;

		// If no service configured, auto-select or prompt
		if (!service) {
			if (state.composeServices.length === 1) {
				service = state.composeServices[0].name;
			} else if (state.composeServices.length > 1) {
				// Check if any service is already running
				const running = getRunningServices(ctx.cwd, state.composeFilePath!);
				if (running.length === 1) {
					service = running[0];
				} else {
					service = (await selectService(state, ctx)) ?? undefined;
				}
			}
		}

		if (!service) {
			ctx.ui.notify("No service selected. Falling back to sandbox.", "warning");
		} else {
			state.activeService = service;
			state.serviceRunning = isServiceRunning(ctx.cwd, state.composeFilePath!, service);

			if (!state.serviceRunning) {
				ctx.ui.notify(`Starting Docker Compose service: ${service}...`, "info");
				const result = await startComposeService(ctx.cwd, state.composeFilePath!, service);

				if (result.success) {
					state.serviceRunning = true;
					state.strategy = "docker";
					ctx.ui.notify(`Docker service '${service}' started`, "success");
				} else {
					ctx.ui.notify(`Failed to start service: ${result.error}. Falling back to sandbox.`, "warning");
				}
			} else {
				state.strategy = "docker";
				ctx.ui.notify(`Using Docker service: ${service}`, "info");
			}

			// Save the selected service for next time
			if (state.strategy === "docker" && !state.config.docker?.service) {
				saveContainedConfig(ctx.cwd, { docker: { service } });
				state.config.docker = { ...state.config.docker, service };
			}
		}
	}

	// Try Sandbox if Docker didn't work
	if (
		state.strategy === "local" &&
		!noSandbox &&
		(preferredStrategy === "sandbox" || preferredStrategy === undefined) &&
		state.config.sandbox?.enabled !== false
	) {
		const platform = process.platform;
		if (platform === "darwin" || platform === "linux") {
			try {
				await SandboxManager.initialize({
					network: state.config.sandbox?.network,
					filesystem: state.config.sandbox?.filesystem,
				});
				state.strategy = "sandbox";
				state.sandboxInitialized = true;
				ctx.ui.notify("Sandbox initialized", "info");
			} catch (err) {
				ctx.ui.notify(`Sandbox failed: ${err}. Using local execution.`, "warning");
			}
		} else {
			ctx.ui.notify(`Sandbox not supported on ${platform}. Using local execution.`, "warning");
		}
	}

	// Local execution with permission gate info
	if (state.strategy === "local") {
		if (noDocker && noSandbox) {
			ctx.ui.notify("Docker and sandbox disabled. Using local execution.", "info");
		} else if (!state.composeFileExists && !noDocker && noSandbox) {
			ctx.ui.notify("No docker-compose.yml found. Using local execution.", "info");
		}

		// Notify about permission gate if active
		if (state.config.permissions?.enabled) {
			const localPerms = state.config.permissions.local;
			const patternCount = (localPerms?.dangerous?.length || 0) + (localPerms?.blocked?.length || 0);
			if (patternCount > 0) {
				ctx.ui.notify(`Permission gate active (${patternCount} patterns)`, "info");
			}
		}
	}

	updateStatus(state, ctx);
}
