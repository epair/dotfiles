import { SandboxManager } from "@anthropic-ai/sandbox-runtime";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
	getRunningServices,
	isServiceRunning,
	startComposeService,
	stopComposeService,
} from "../docker/compose.js";
import { loadDockerConfig, loadSandboxConfig, saveDockerConfig, saveSandboxConfig } from "../core/config.js";
import { getWorkdir, initializeStrategy, selectService, updateStatus } from "../core/strategy.js";
import type { ExecutionState, SandboxConfig } from "../core/types.js";

export function registerCommands(pi: ExtensionAPI, state: ExecutionState): void {
	pi.registerCommand("env", {
		description: "Show execution environment status and configuration",
		handler: async (_args, ctx) => {
			const lines: string[] = [];
			const theme = ctx.ui.theme;

			lines.push(theme.bold("Execution Environment Status"));
			lines.push("");
			lines.push(`Strategy: ${theme.fg("accent", state.strategy.toUpperCase())}`);
			lines.push("");

			lines.push(theme.bold("Docker Compose:"));
			lines.push(`  Docker available: ${state.dockerAvailable ? theme.fg("success", "Yes") : theme.fg("error", "No")}`);
			lines.push(
				`  Compose available: ${state.dockerComposeAvailable ? theme.fg("success", "Yes") : theme.fg("error", "No")}`,
			);
			lines.push(
				`  Compose file: ${state.composeFileExists ? theme.fg("success", state.composeFilePath) : theme.fg("dim", "Not found")}`,
			);
			if (state.composeServices.length > 0) {
				lines.push(`  Services: ${state.composeServices.map((s) => s.name).join(", ")}`);
			}
			if (state.activeService) {
				lines.push(`  Active service: ${theme.fg("accent", state.activeService)}`);
				lines.push(`  Running: ${state.serviceRunning ? theme.fg("success", "Yes") : theme.fg("error", "No")}`);
				lines.push(`  Workdir: ${getWorkdir(state)}`);
			}
			lines.push(
				`  Enabled: ${state.dockerConfig?.enabled !== false ? theme.fg("success", "Yes") : theme.fg("dim", "No")}`,
			);
			lines.push("");

			lines.push(theme.bold("Sandbox:"));
			lines.push(`  Enabled: ${state.sandboxConfig?.enabled ? theme.fg("success", "Yes") : theme.fg("dim", "No")}`);
			lines.push(`  Initialized: ${state.sandboxInitialized ? theme.fg("success", "Yes") : theme.fg("dim", "No")}`);
			if (state.sandboxConfig?.enabled) {
				lines.push(`  Allowed Domains: ${state.sandboxConfig.network?.allowedDomains?.length || 0}`);
				lines.push(`  Write Paths: ${state.sandboxConfig.filesystem?.allowWrite?.length || 0}`);
			}

			ctx.ui.notify(lines.join("\n"), "info");
		},
	});

	pi.registerCommand("docker", {
		description: "Configure Docker Compose execution environment",
		handler: async (_args, ctx) => {
			if (!state.composeFileExists) {
				ctx.ui.notify(
					"No docker-compose.yml found in this directory.\nCreate one to use Docker execution.",
					"warning",
				);
				return;
			}

			const options = [
				state.dockerConfig?.enabled === false ? "Enable Docker" : "Disable Docker",
				"Select Service",
				"Set Working Directory",
				"Start Service",
				"Stop Service",
				"View Running Services",
				"Cancel",
			];

			const choice = await ctx.ui.select("Docker Compose Configuration", options);
			if (!choice || choice === "Cancel") return;

			switch (choice) {
				case "Enable Docker":
				case "Disable Docker": {
					const enabled = choice === "Enable Docker";
					saveDockerConfig(ctx.cwd, { enabled });
					state.dockerConfig = loadDockerConfig(ctx.cwd);

					if (enabled && state.dockerAvailable && state.dockerComposeAvailable) {
						// Re-initialize
						await initializeStrategy(pi, state, ctx);
					} else if (!enabled) {
						if (state.strategy === "docker") {
							state.strategy = state.sandboxInitialized ? "sandbox" : "local";
						}
						ctx.ui.notify("Docker disabled", "info");
					}
					updateStatus(state, ctx);
					break;
				}

				case "Select Service": {
					const service = await selectService(state, ctx);
					if (service) {
						saveDockerConfig(ctx.cwd, { service });
						state.dockerConfig = loadDockerConfig(ctx.cwd);
						state.activeService = service;

						// Check and start if needed
						state.serviceRunning = isServiceRunning(ctx.cwd, state.composeFilePath!, service);
						if (!state.serviceRunning) {
							const start = await ctx.ui.confirm("Start Service?", `Service '${service}' is not running. Start it?`);
							if (start) {
								const result = await startComposeService(ctx.cwd, state.composeFilePath!, service);
								if (result.success) {
									state.serviceRunning = true;
									state.strategy = "docker";
									ctx.ui.notify(`Service '${service}' started`, "success");
								} else {
									ctx.ui.notify(`Failed to start: ${result.error}`, "error");
								}
							}
						} else {
							state.strategy = "docker";
							ctx.ui.notify(`Switched to service: ${service}`, "success");
						}
						updateStatus(state, ctx);
					}
					break;
				}

				case "Set Working Directory": {
					const current = getWorkdir(state);
					const workdir = await ctx.ui.input("Working Directory (inside container):", current);
					if (workdir) {
						saveDockerConfig(ctx.cwd, { workdir });
						state.dockerConfig = loadDockerConfig(ctx.cwd);
						ctx.ui.notify(`Working directory set to: ${workdir}`, "success");
					}
					break;
				}

				case "Start Service": {
					if (!state.activeService) {
						const service = await selectService(state, ctx);
						if (!service) break;
						state.activeService = service;
						saveDockerConfig(ctx.cwd, { service });
					}

					const result = await startComposeService(ctx.cwd, state.composeFilePath!, state.activeService);
					if (result.success) {
						state.serviceRunning = true;
						state.strategy = "docker";
						ctx.ui.notify(`Service '${state.activeService}' started`, "success");
					} else {
						ctx.ui.notify(`Failed to start: ${result.error}`, "error");
					}
					updateStatus(state, ctx);
					break;
				}

				case "Stop Service": {
					if (!state.activeService) {
						ctx.ui.notify("No active service to stop", "warning");
						break;
					}
					await stopComposeService(ctx.cwd, state.composeFilePath!, state.activeService);
					state.serviceRunning = false;
					if (state.strategy === "docker") {
						state.strategy = state.sandboxInitialized ? "sandbox" : "local";
					}
					ctx.ui.notify(`Service '${state.activeService}' stopped`, "info");
					updateStatus(state, ctx);
					break;
				}

				case "View Running Services": {
					const running = getRunningServices(ctx.cwd, state.composeFilePath!);
					if (running.length === 0) {
						ctx.ui.notify("No services are currently running", "info");
					} else {
						ctx.ui.notify(`Running services:\n${running.map((s) => `  • ${s}`).join("\n")}`, "info");
					}
					break;
				}
			}
		},
	});

	pi.registerCommand("sandbox", {
		description: "Configure sandbox execution environment",
		handler: async (_args, ctx) => {
			const options = [
				state.sandboxConfig?.enabled ? "Disable Sandbox" : "Enable Sandbox",
				"Configure Allowed Domains",
				"Configure Denied Domains",
				"Configure Deny Read Paths",
				"Configure Allow Write Paths",
				"Configure Deny Write Paths",
				"View Current Config",
				"Cancel",
			];

			const choice = await ctx.ui.select("Sandbox Configuration", options);
			if (!choice || choice === "Cancel") return;

			switch (choice) {
				case "Enable Sandbox":
				case "Disable Sandbox": {
					const enabled = choice === "Enable Sandbox";
					saveSandboxConfig(ctx.cwd, { enabled });
					state.sandboxConfig = loadSandboxConfig(ctx.cwd);

					if (enabled) {
						const platform = process.platform;
						if (platform === "darwin" || platform === "linux") {
							try {
								await SandboxManager.initialize({
									network: state.sandboxConfig.network,
									filesystem: state.sandboxConfig.filesystem,
								});
								state.sandboxInitialized = true;
								if (state.strategy === "local") {
									state.strategy = "sandbox";
								}
								ctx.ui.notify("Sandbox enabled and initialized", "success");
							} catch (err) {
								ctx.ui.notify(`Sandbox enabled but initialization failed: ${err}`, "warning");
							}
						} else {
							ctx.ui.notify(`Sandbox enabled but not supported on ${platform}`, "warning");
						}
					} else {
						if (state.strategy === "sandbox") {
							state.strategy = "local";
						}
						state.sandboxInitialized = false;
						ctx.ui.notify("Sandbox disabled", "info");
					}
					updateStatus(state, ctx);
					break;
				}

				case "Configure Allowed Domains": {
					const current = (state.sandboxConfig?.network?.allowedDomains || []).join("\n");
					const domains = await ctx.ui.editor("Allowed Domains (one per line):", current);
					if (domains !== undefined) {
						const domainList = domains
							.split("\n")
							.map((d) => d.trim())
							.filter(Boolean);
						const network = { ...state.sandboxConfig?.network, allowedDomains: domainList };
						saveSandboxConfig(ctx.cwd, { network } as Partial<SandboxConfig>);
						state.sandboxConfig = loadSandboxConfig(ctx.cwd);
						ctx.ui.notify(`Allowed domains configured: ${domainList.length} domain(s)`, "success");
					}
					break;
				}

				case "Configure Denied Domains": {
					const current = (state.sandboxConfig?.network?.deniedDomains || []).join("\n");
					const domains = await ctx.ui.editor("Denied Domains (one per line):", current);
					if (domains !== undefined) {
						const domainList = domains
							.split("\n")
							.map((d) => d.trim())
							.filter(Boolean);
						const network = { ...state.sandboxConfig?.network, deniedDomains: domainList };
						saveSandboxConfig(ctx.cwd, { network } as Partial<SandboxConfig>);
						state.sandboxConfig = loadSandboxConfig(ctx.cwd);
						ctx.ui.notify(`Denied domains configured: ${domainList.length} domain(s)`, "success");
					}
					break;
				}

				case "Configure Deny Read Paths": {
					const current = (state.sandboxConfig?.filesystem?.denyRead || []).join("\n");
					const paths = await ctx.ui.editor("Deny Read Paths (one per line):", current);
					if (paths !== undefined) {
						const pathList = paths
							.split("\n")
							.map((p) => p.trim())
							.filter(Boolean);
						const filesystem = { ...state.sandboxConfig?.filesystem, denyRead: pathList };
						saveSandboxConfig(ctx.cwd, { filesystem } as Partial<SandboxConfig>);
						state.sandboxConfig = loadSandboxConfig(ctx.cwd);
						ctx.ui.notify(`Deny read paths configured: ${pathList.length} path(s)`, "success");
					}
					break;
				}

				case "Configure Allow Write Paths": {
					const current = (state.sandboxConfig?.filesystem?.allowWrite || []).join("\n");
					const paths = await ctx.ui.editor("Allow Write Paths (one per line):", current);
					if (paths !== undefined) {
						const pathList = paths
							.split("\n")
							.map((p) => p.trim())
							.filter(Boolean);
						const filesystem = { ...state.sandboxConfig?.filesystem, allowWrite: pathList };
						saveSandboxConfig(ctx.cwd, { filesystem } as Partial<SandboxConfig>);
						state.sandboxConfig = loadSandboxConfig(ctx.cwd);
						ctx.ui.notify(`Allow write paths configured: ${pathList.length} path(s)`, "success");
					}
					break;
				}

				case "Configure Deny Write Paths": {
					const current = (state.sandboxConfig?.filesystem?.denyWrite || []).join("\n");
					const paths = await ctx.ui.editor("Deny Write Paths (one per line):", current);
					if (paths !== undefined) {
						const pathList = paths
							.split("\n")
							.map((p) => p.trim())
							.filter(Boolean);
						const filesystem = { ...state.sandboxConfig?.filesystem, denyWrite: pathList };
						saveSandboxConfig(ctx.cwd, { filesystem } as Partial<SandboxConfig>);
						state.sandboxConfig = loadSandboxConfig(ctx.cwd);
						ctx.ui.notify(`Deny write paths configured: ${pathList.length} path(s)`, "success");
					}
					break;
				}

				case "View Current Config": {
					const lines: string[] = [];
					const theme = ctx.ui.theme;

					lines.push(theme.bold("Sandbox Configuration:"));
					lines.push("");
					lines.push(`Enabled: ${state.sandboxConfig?.enabled ? "Yes" : "No"}`);
					lines.push("");
					lines.push(theme.bold("Network:"));
					lines.push(`  Allowed: ${(state.sandboxConfig?.network?.allowedDomains || []).join(", ") || "(none)"}`);
					lines.push(`  Denied: ${(state.sandboxConfig?.network?.deniedDomains || []).join(", ") || "(none)"}`);
					lines.push("");
					lines.push(theme.bold("Filesystem:"));
					lines.push(`  Deny Read: ${(state.sandboxConfig?.filesystem?.denyRead || []).join(", ") || "(none)"}`);
					lines.push(`  Allow Write: ${(state.sandboxConfig?.filesystem?.allowWrite || []).join(", ") || "(none)"}`);
					lines.push(`  Deny Write: ${(state.sandboxConfig?.filesystem?.denyWrite || []).join(", ") || "(none)"}`);

					ctx.ui.notify(lines.join("\n"), "info");
					break;
				}
			}
		},
	});
}
