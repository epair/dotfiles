import { SandboxManager } from "@anthropic-ai/sandbox-runtime";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
	getRunningServices,
	isServiceRunning,
	startComposeService,
	stopComposeService,
} from "../docker/compose.js";
import { getPermissionPatterns, loadContainedConfig, saveContainedConfig } from "../core/config.js";
import { getWorkdir, initializeStrategy, selectService, updateStatus } from "../core/strategy.js";
import type { ExecutionState, EnvironmentPermissions, ExecutionStrategy } from "../core/types.js";

export function registerCommands(pi: ExtensionAPI, state: ExecutionState): void {
	pi.registerCommand("env", {
		description: "Show execution environment status and configuration",
		handler: async (_args, ctx) => {
			const lines: string[] = [];
			const theme = ctx.ui.theme;

			lines.push(theme.bold("Execution Environment Status"));
			lines.push("");
			lines.push(`Strategy: ${theme.fg("accent", state.strategy.toUpperCase())}`);

			// Permission gate status
			if (state.config.permissions?.enabled) {
				const patterns = getPermissionPatterns(state.config, state.strategy);
				const dangerousCount = patterns.dangerous?.length || 0;
				const blockedCount = patterns.blocked?.length || 0;
				if (dangerousCount + blockedCount > 0) {
					lines.push(
						`Permissions: ${theme.fg("success", "Active")} (${dangerousCount} dangerous, ${blockedCount} blocked)`,
					);
				} else {
					lines.push(`Permissions: ${theme.fg("dim", "None for this strategy")}`);
				}
			} else {
				lines.push(`Permissions: ${theme.fg("dim", "Disabled")}`);
			}
			lines.push(`Session Approvals: ${state.sessionApprovals.size}`);
			lines.push("");

			lines.push(theme.bold("Docker Compose:"));
			lines.push(`  Available: ${state.dockerAvailable ? theme.fg("success", "Yes") : theme.fg("error", "No")}`);
			lines.push(
				`  Compose file: ${state.composeFileExists ? theme.fg("success", state.composeFilePath) : theme.fg("dim", "Not found")}`,
			);
			if (state.composeServices.length > 0) {
				lines.push(`  Services: ${state.composeServices.map((s) => s.name).join(", ")}`);
			}
			if (state.activeService) {
				lines.push(`  Active: ${theme.fg("accent", state.activeService)}`);
				lines.push(`  Running: ${state.serviceRunning ? theme.fg("success", "Yes") : theme.fg("error", "No")}`);
				lines.push(`  Workdir: ${getWorkdir(state)}`);
			}
			lines.push("");

			lines.push(theme.bold("Sandbox:"));
			lines.push(
				`  Enabled: ${state.config.sandbox?.enabled !== false ? theme.fg("success", "Yes") : theme.fg("dim", "No")}`,
			);
			lines.push(`  Initialized: ${state.sandboxInitialized ? theme.fg("success", "Yes") : theme.fg("dim", "No")}`);

			ctx.ui.notify(lines.join("\n"), "info");
		},
	});

	pi.registerCommand("contained", {
		description: "Configure contained execution environment",
		handler: async (_args, ctx) => {
			const options = [
				"Switch Strategy",
				"Configure Docker",
				"Configure Sandbox",
				"Configure Permissions",
				"Clear Session Approvals",
				"View Full Config",
				"Cancel",
			];

			const choice = await ctx.ui.select("Contained Configuration", options);
			if (!choice || choice === "Cancel") return;

			switch (choice) {
				case "Switch Strategy": {
					const strategies: ExecutionStrategy[] = ["docker", "sandbox", "local"];
					const strategyChoice = await ctx.ui.select(
						"Select execution strategy:",
						strategies.map((s) => {
							const current = s === state.strategy ? " (current)" : "";
							return `${s}${current}`;
						}),
					);
					if (strategyChoice) {
						const newStrategy = strategyChoice.replace(" (current)", "") as ExecutionStrategy;
						saveContainedConfig(ctx.cwd, { strategy: newStrategy });
						state.config = loadContainedConfig(ctx.cwd);
						await initializeStrategy(pi, state, ctx);
					}
					break;
				}

				case "Configure Docker": {
					await configureDocker(pi, state, ctx);
					break;
				}

				case "Configure Sandbox": {
					await configureSandbox(state, ctx);
					break;
				}

				case "Configure Permissions": {
					await configurePermissions(state, ctx);
					break;
				}

				case "Clear Session Approvals": {
					const count = state.sessionApprovals.size;
					state.sessionApprovals.clear();
					ctx.ui.notify(`Cleared ${count} session approval(s)`, "success");
					break;
				}

				case "View Full Config": {
					const configJson = JSON.stringify(state.config, null, 2);
					ctx.ui.notify(`Configuration:\n${configJson}`, "info");
					break;
				}
			}
		},
	});

	// Keep legacy commands for convenience
	pi.registerCommand("docker", {
		description: "Configure Docker Compose settings",
		handler: async (_args, ctx) => {
			await configureDocker(pi, state, ctx);
		},
	});

	pi.registerCommand("sandbox", {
		description: "Configure Sandbox settings",
		handler: async (_args, ctx) => {
			await configureSandbox(state, ctx);
		},
	});

	pi.registerCommand("permissions", {
		description: "Configure permission gate settings",
		handler: async (_args, ctx) => {
			await configurePermissions(state, ctx);
		},
	});
}

async function configureDocker(
	pi: ExtensionAPI,
	state: ExecutionState,
	ctx: Parameters<Parameters<ExtensionAPI["registerCommand"]>[1]["handler"]>[1],
): Promise<void> {
	if (!state.composeFileExists) {
		ctx.ui.notify(
			"No docker-compose.yml found in this directory.\nCreate one to use Docker execution.",
			"warning",
		);
		return;
	}

	const options = [
		state.config.docker?.enabled === false ? "Enable Docker" : "Disable Docker",
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
			saveContainedConfig(ctx.cwd, { docker: { enabled } });
			state.config = loadContainedConfig(ctx.cwd);

			if (enabled && state.dockerAvailable && state.dockerComposeAvailable) {
				await initializeStrategy(pi, state, ctx);
			} else if (!enabled && state.strategy === "docker") {
				state.strategy = state.sandboxInitialized ? "sandbox" : "local";
				ctx.ui.notify("Docker disabled", "info");
				updateStatus(state, ctx);
			}
			break;
		}

		case "Select Service": {
			const service = await selectService(state, ctx);
			if (service) {
				saveContainedConfig(ctx.cwd, { docker: { service } });
				state.config = loadContainedConfig(ctx.cwd);
				state.activeService = service;

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
				saveContainedConfig(ctx.cwd, { docker: { workdir } });
				state.config = loadContainedConfig(ctx.cwd);
				ctx.ui.notify(`Working directory set to: ${workdir}`, "success");
			}
			break;
		}

		case "Start Service": {
			if (!state.activeService) {
				const service = await selectService(state, ctx);
				if (!service) break;
				state.activeService = service;
				saveContainedConfig(ctx.cwd, { docker: { service } });
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
}

async function configureSandbox(
	state: ExecutionState,
	ctx: Parameters<Parameters<ExtensionAPI["registerCommand"]>[1]["handler"]>[1],
): Promise<void> {
	const options = [
		state.config.sandbox?.enabled !== false ? "Disable Sandbox" : "Enable Sandbox",
		"Configure Allowed Domains",
		"Configure Denied Domains",
		"Configure Filesystem Paths",
		"View Current Config",
		"Cancel",
	];

	const choice = await ctx.ui.select("Sandbox Configuration", options);
	if (!choice || choice === "Cancel") return;

	switch (choice) {
		case "Enable Sandbox":
		case "Disable Sandbox": {
			const enabled = choice === "Enable Sandbox";
			saveContainedConfig(ctx.cwd, { sandbox: { enabled } });
			state.config = loadContainedConfig(ctx.cwd);

			if (enabled) {
				const platform = process.platform;
				if (platform === "darwin" || platform === "linux") {
					try {
						await SandboxManager.initialize({
							network: state.config.sandbox?.network,
							filesystem: state.config.sandbox?.filesystem,
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
			const current = (state.config.sandbox?.network?.allowedDomains || []).join("\n");
			const domains = await ctx.ui.editor("Allowed Domains (one per line):", current);
			if (domains !== undefined) {
				const domainList = domains
					.split("\n")
					.map((d) => d.trim())
					.filter(Boolean);
				saveContainedConfig(ctx.cwd, {
					sandbox: { network: { allowedDomains: domainList } },
				});
				state.config = loadContainedConfig(ctx.cwd);
				ctx.ui.notify(`Allowed domains configured: ${domainList.length} domain(s)`, "success");
			}
			break;
		}

		case "Configure Denied Domains": {
			const current = (state.config.sandbox?.network?.deniedDomains || []).join("\n");
			const domains = await ctx.ui.editor("Denied Domains (one per line):", current);
			if (domains !== undefined) {
				const domainList = domains
					.split("\n")
					.map((d) => d.trim())
					.filter(Boolean);
				saveContainedConfig(ctx.cwd, {
					sandbox: { network: { deniedDomains: domainList } },
				});
				state.config = loadContainedConfig(ctx.cwd);
				ctx.ui.notify(`Denied domains configured: ${domainList.length} domain(s)`, "success");
			}
			break;
		}

		case "Configure Filesystem Paths": {
			const fsOptions = ["Allow Write Paths", "Deny Write Paths", "Deny Read Paths", "Cancel"];
			const fsChoice = await ctx.ui.select("Configure Filesystem", fsOptions);
			if (!fsChoice || fsChoice === "Cancel") break;

			const fsKey =
				fsChoice === "Allow Write Paths"
					? "allowWrite"
					: fsChoice === "Deny Write Paths"
						? "denyWrite"
						: "denyRead";

			const current = (state.config.sandbox?.filesystem?.[fsKey] || []).join("\n");
			const paths = await ctx.ui.editor(`${fsChoice} (one per line):`, current);
			if (paths !== undefined) {
				const pathList = paths
					.split("\n")
					.map((p) => p.trim())
					.filter(Boolean);
				saveContainedConfig(ctx.cwd, {
					sandbox: { filesystem: { [fsKey]: pathList } },
				});
				state.config = loadContainedConfig(ctx.cwd);
				ctx.ui.notify(`${fsChoice} configured: ${pathList.length} path(s)`, "success");
			}
			break;
		}

		case "View Current Config": {
			const lines: string[] = [];
			const theme = ctx.ui.theme;

			lines.push(theme.bold("Sandbox Configuration:"));
			lines.push("");
			lines.push(`Enabled: ${state.config.sandbox?.enabled !== false ? "Yes" : "No"}`);
			lines.push(`Initialized: ${state.sandboxInitialized ? "Yes" : "No"}`);
			lines.push("");
			lines.push(theme.bold("Network:"));
			lines.push(`  Allowed: ${(state.config.sandbox?.network?.allowedDomains || []).slice(0, 5).join(", ") || "(none)"}`);
			if ((state.config.sandbox?.network?.allowedDomains?.length || 0) > 5) {
				lines.push(`  ... and ${state.config.sandbox!.network!.allowedDomains!.length - 5} more`);
			}
			lines.push(`  Denied: ${(state.config.sandbox?.network?.deniedDomains || []).join(", ") || "(none)"}`);
			lines.push("");
			lines.push(theme.bold("Filesystem:"));
			lines.push(`  Deny Read: ${(state.config.sandbox?.filesystem?.denyRead || []).join(", ") || "(none)"}`);
			lines.push(`  Allow Write: ${(state.config.sandbox?.filesystem?.allowWrite || []).join(", ") || "(none)"}`);
			lines.push(`  Deny Write: ${(state.config.sandbox?.filesystem?.denyWrite || []).join(", ") || "(none)"}`);

			ctx.ui.notify(lines.join("\n"), "info");
			break;
		}
	}
}

async function configurePermissions(
	state: ExecutionState,
	ctx: Parameters<Parameters<ExtensionAPI["registerCommand"]>[1]["handler"]>[1],
): Promise<void> {
	const options = [
		state.config.permissions?.enabled ? "Disable Permissions" : "Enable Permissions",
		"Configure Local Patterns",
		"Configure Sandbox Patterns",
		"Configure Docker Patterns",
		"View Current Config",
		"Cancel",
	];

	const choice = await ctx.ui.select("Permission Gate Configuration", options);
	if (!choice || choice === "Cancel") return;

	switch (choice) {
		case "Enable Permissions":
		case "Disable Permissions": {
			const enabled = choice === "Enable Permissions";
			saveContainedConfig(ctx.cwd, { permissions: { enabled } });
			state.config = loadContainedConfig(ctx.cwd);
			ctx.ui.notify(enabled ? "Permission gate enabled" : "Permission gate disabled", "success");
			updateStatus(state, ctx);
			break;
		}

		case "Configure Local Patterns":
		case "Configure Sandbox Patterns":
		case "Configure Docker Patterns": {
			const env = choice.includes("Local") ? "local" : choice.includes("Sandbox") ? "sandbox" : "docker";
			await configureEnvironmentPatterns(state, ctx, env);
			break;
		}

		case "View Current Config": {
			const lines: string[] = [];
			const theme = ctx.ui.theme;

			lines.push(theme.bold("Permission Gate Configuration:"));
			lines.push("");
			lines.push(`Enabled: ${state.config.permissions?.enabled ? "Yes" : "No"}`);
			lines.push(`Current Strategy: ${state.strategy}`);
			lines.push("");

			for (const env of ["local", "sandbox", "docker"] as const) {
				const patterns = state.config.permissions?.[env];
				const isCurrent = env === state.strategy;
				const label = isCurrent ? theme.fg("accent", `${env} (current)`) : env;

				lines.push(theme.bold(`${label}:`));
				lines.push(`  Dangerous: ${patterns?.dangerous?.length || 0} pattern(s)`);
				lines.push(`  Blocked: ${patterns?.blocked?.length || 0} pattern(s)`);
			}

			ctx.ui.notify(lines.join("\n"), "info");
			break;
		}
	}
}

async function configureEnvironmentPatterns(
	state: ExecutionState,
	ctx: Parameters<Parameters<ExtensionAPI["registerCommand"]>[1]["handler"]>[1],
	env: "local" | "sandbox" | "docker",
): Promise<void> {
	const options = ["Configure Dangerous Patterns", "Configure Blocked Patterns", "View Patterns", "Cancel"];

	const choice = await ctx.ui.select(`${env.charAt(0).toUpperCase() + env.slice(1)} Patterns`, options);
	if (!choice || choice === "Cancel") return;

	const currentPatterns = state.config.permissions?.[env] || {};

	switch (choice) {
		case "Configure Dangerous Patterns": {
			const current = (currentPatterns.dangerous || []).join("\n");
			const patterns = await ctx.ui.editor(
				`Dangerous Patterns for ${env} (one regex per line):\n# Commands matching these require approval`,
				current,
			);
			if (patterns !== undefined) {
				const patternList = patterns
					.split("\n")
					.map((p) => p.trim())
					.filter((p) => p && !p.startsWith("#"));

				// Validate patterns
				const invalid = patternList.filter((p) => {
					try {
						new RegExp(p);
						return false;
					} catch {
						return true;
					}
				});

				if (invalid.length > 0) {
					ctx.ui.notify(`Invalid regex patterns:\n${invalid.map((p) => `  • ${p}`).join("\n")}`, "error");
				} else {
					const update: EnvironmentPermissions = { dangerous: patternList };
					saveContainedConfig(ctx.cwd, { permissions: { [env]: update } });
					state.config = loadContainedConfig(ctx.cwd);
					ctx.ui.notify(`${env} dangerous patterns updated: ${patternList.length} pattern(s)`, "success");
				}
			}
			break;
		}

		case "Configure Blocked Patterns": {
			const current = (currentPatterns.blocked || []).join("\n");
			const patterns = await ctx.ui.editor(
				`Blocked Patterns for ${env} (one regex per line):\n# Commands matching these are always blocked`,
				current,
			);
			if (patterns !== undefined) {
				const patternList = patterns
					.split("\n")
					.map((p) => p.trim())
					.filter((p) => p && !p.startsWith("#"));

				// Validate patterns
				const invalid = patternList.filter((p) => {
					try {
						new RegExp(p);
						return false;
					} catch {
						return true;
					}
				});

				if (invalid.length > 0) {
					ctx.ui.notify(`Invalid regex patterns:\n${invalid.map((p) => `  • ${p}`).join("\n")}`, "error");
				} else {
					const update: EnvironmentPermissions = { blocked: patternList };
					saveContainedConfig(ctx.cwd, { permissions: { [env]: update } });
					state.config = loadContainedConfig(ctx.cwd);
					ctx.ui.notify(`${env} blocked patterns updated: ${patternList.length} pattern(s)`, "success");
				}
			}
			break;
		}

		case "View Patterns": {
			const lines: string[] = [];
			const theme = ctx.ui.theme;

			lines.push(theme.bold(`${env.charAt(0).toUpperCase() + env.slice(1)} Patterns:`));
			lines.push("");

			lines.push(theme.fg("warning", "Dangerous (require approval):"));
			const dangerous = currentPatterns.dangerous || [];
			if (dangerous.length === 0) {
				lines.push("  (none)");
			} else {
				for (const p of dangerous.slice(0, 10)) {
					lines.push(`  • ${p}`);
				}
				if (dangerous.length > 10) {
					lines.push(`  ... and ${dangerous.length - 10} more`);
				}
			}

			lines.push("");
			lines.push(theme.fg("error", "Blocked (always denied):"));
			const blocked = currentPatterns.blocked || [];
			if (blocked.length === 0) {
				lines.push("  (none)");
			} else {
				for (const p of blocked.slice(0, 10)) {
					lines.push(`  • ${p}`);
				}
				if (blocked.length > 10) {
					lines.push(`  ... and ${blocked.length - 10} more`);
				}
			}

			ctx.ui.notify(lines.join("\n"), "info");
			break;
		}
	}
}
