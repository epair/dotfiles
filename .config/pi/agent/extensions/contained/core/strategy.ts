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
import { loadDockerConfig, loadSandboxConfig, saveDockerConfig } from "./config.js";
import type { ExecutionState } from "./types.js";

export function getWorkdir(state: ExecutionState): string {
	// Priority: config workdir > service working_dir > /app
	if (state.dockerConfig?.workdir) {
		return state.dockerConfig.workdir;
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

	// Load configs
	state.dockerConfig = loadDockerConfig(ctx.cwd);
	state.sandboxConfig = loadSandboxConfig(ctx.cwd);
	state.dockerAvailable = isDockerAvailable();
	state.dockerComposeAvailable = isDockerComposeAvailable();

	// Find docker-compose.yml
	state.composeFilePath = findComposeFile(ctx.cwd, state.dockerConfig.composeFile);
	state.composeFileExists = state.composeFilePath !== null;

	if (state.composeFilePath) {
		state.composeServices = parseComposeFile(state.composeFilePath);
	}

	// Determine strategy
	if (
		!noDocker &&
		state.dockerConfig.enabled !== false &&
		state.composeFileExists &&
		state.dockerAvailable &&
		state.dockerComposeAvailable
	) {
		// Try Docker Compose
		let service = state.dockerConfig.service;

		// If no service configured, auto-select or prompt
		if (!service) {
			if (state.composeServices.length === 1) {
				service = state.composeServices[0].name;
			} else if (state.composeServices.length > 1) {
				// Check if any service is already running
				const running = getRunningServices(ctx.cwd, state.composeFilePath!);
				if (running.length === 1) {
					service = running[0];
				} else if (running.length > 1) {
					service = (await selectService(state, ctx)) ?? undefined;
				} else {
					service = (await selectService(state, ctx)) ?? undefined;
				}
			}
		}

		if (!service) {
			ctx.ui.notify("No service selected. Falling back to sandbox.", "warning");
			state.strategy = noSandbox ? "local" : "sandbox";
		} else {
			state.activeService = service;

			// Check if service is running
			state.serviceRunning = isServiceRunning(ctx.cwd, state.composeFilePath!, service);

			if (!state.serviceRunning) {
				// Start the service
				ctx.ui.notify(`Starting Docker Compose service: ${service}...`, "info");
				const result = await startComposeService(ctx.cwd, state.composeFilePath!, service);

				if (result.success) {
					state.serviceRunning = true;
					state.strategy = "docker";
					ctx.ui.notify(`Docker service '${service}' started`, "success");
				} else {
					ctx.ui.notify(`Failed to start service: ${result.error}. Falling back to sandbox.`, "warning");
					state.strategy = noSandbox ? "local" : "sandbox";
				}
			} else {
				state.strategy = "docker";
				ctx.ui.notify(`Using Docker service: ${service}`, "info");
			}

			// Save the selected service for next time
			if (state.strategy === "docker" && !state.dockerConfig.service) {
				saveDockerConfig(ctx.cwd, { service });
				state.dockerConfig.service = service;
			}
		}
	} else if (!noSandbox && state.sandboxConfig?.enabled) {
		// Use sandbox
		const platform = process.platform;
		if (platform === "darwin" || platform === "linux") {
			try {
				await SandboxManager.initialize({
					network: state.sandboxConfig.network,
					filesystem: state.sandboxConfig.filesystem,
				});
				state.strategy = "sandbox";
				state.sandboxInitialized = true;
				ctx.ui.notify("Sandbox initialized", "info");
			} catch (err) {
				ctx.ui.notify(`Sandbox failed: ${err}. Using local execution.`, "warning");
				state.strategy = "local";
			}
		} else {
			ctx.ui.notify(`Sandbox not supported on ${platform}. Using local execution.`, "warning");
			state.strategy = "local";
		}
	} else {
		state.strategy = "local";
		if (noDocker && noSandbox) {
			ctx.ui.notify("Docker and sandbox disabled. Using local execution.", "info");
		} else if (!state.composeFileExists && !noDocker) {
			// No docker-compose.yml, and sandbox disabled
			if (noSandbox) {
				ctx.ui.notify("No docker-compose.yml found. Using local execution.", "info");
			}
		}
	}

	updateStatus(state, ctx);
}
