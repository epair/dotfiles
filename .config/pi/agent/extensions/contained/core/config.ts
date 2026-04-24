import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getAgentDir } from "@mariozechner/pi-coding-agent";
import type {
	ContainedConfig,
	DockerConfig,
	EnvironmentPermissions,
	ExecutionStrategy,
	PermissionsConfig,
	SandboxConfig,
} from "./types.js";

/**
 * Default Docker configuration
 */
export const DEFAULT_DOCKER_CONFIG: DockerConfig = {
	enabled: true,
	service: undefined,
	workdir: undefined,
};

/**
 * Default Sandbox configuration
 */
export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
	enabled: true,
	network: {
		allowedDomains: [
			"npmjs.org",
			"*.npmjs.org",
			"registry.npmjs.org",
			"registry.yarnpkg.com",
			"pypi.org",
			"*.pypi.org",
			"github.com",
			"*.github.com",
			"api.github.com",
			"raw.githubusercontent.com",
		],
		deniedDomains: [],
	},
	filesystem: {
		denyRead: ["~/.ssh", "~/.aws", "~/.gnupg"],
		allowWrite: [".", "/tmp"],
		denyWrite: [".env", ".env.*", "*.pem", "*.key"],
	},
};

/**
 * Default permission patterns for local execution (most restrictive)
 */
const DEFAULT_LOCAL_PERMISSIONS: EnvironmentPermissions = {
	dangerous: [
		// Destructive file operations
		"\\brm\\s+(-[rf]+|--recursive|--force)",
		"\\brm\\s+-[^\\s]*r",
		"\\brmdir\\b",
		// Elevated privileges
		"\\bsudo\\b",
		"\\bdoas\\b",
		// Permission changes
		"\\bchmod\\b.*777",
		"\\bchown\\b",
		"\\bchgrp\\b",
		// System modifications
		"\\bsystemctl\\b",
		"\\bservice\\b",
		"\\blaunchctl\\b",
		// Package managers (system-wide)
		"\\bapt(-get)?\\s+(install|remove|purge)",
		"\\bbrew\\s+(install|uninstall|remove)",
		"\\bpip\\s+install\\b(?!.*--user)(?!.*-e\\s+\\.)",
		"\\bnpm\\s+(-g|--global)\\s+install",
		// Disk operations
		"\\bdd\\b",
		"\\bmkfs\\b",
		"\\bfdisk\\b",
		// Git destructive operations
		"\\bgit\\s+(push\\s+(-f|--force)|reset\\s+--hard|clean\\s+-fd)",
		// Environment modifications
		"\\bexport\\b.*(_KEY|_SECRET|_TOKEN|PASSWORD)",
		// Process control
		"\\bkill\\s+-9",
		"\\bkillall\\b",
		"\\bpkill\\b",
	],
	blocked: [
		// Piping remote scripts to shell
		"\\bcurl\\b.*\\|.*\\b(sh|bash)\\b",
		"\\bwget\\b.*\\|.*\\b(sh|bash)\\b",
	],
};

/**
 * Default permission patterns for sandbox execution (medium)
 * Sandbox handles most isolation, but some things still need approval
 */
const DEFAULT_SANDBOX_PERMISSIONS: EnvironmentPermissions = {
	dangerous: [
		// Destructive file operations on mounted paths
		"\\brm\\s+(-[rf]+|--recursive|--force)",
		"\\brm\\s+-[^\\s]*r",
		// Git destructive operations (affects real repo)
		"\\bgit\\s+(push\\s+(-f|--force)|reset\\s+--hard|clean\\s+-fd)",
	],
	blocked: [],
};

/**
 * Default permission patterns for docker execution (most relaxed)
 * Container is isolated, minimal restrictions needed
 */
const DEFAULT_DOCKER_PERMISSIONS: EnvironmentPermissions = {
	dangerous: [],
	blocked: [],
};

/**
 * Default consolidated configuration
 */
export const DEFAULT_CONTAINED_CONFIG: ContainedConfig = {
	strategy: undefined, // Auto-detect
	docker: DEFAULT_DOCKER_CONFIG,
	sandbox: DEFAULT_SANDBOX_CONFIG,
	permissions: {
		enabled: true,
		local: DEFAULT_LOCAL_PERMISSIONS,
		sandbox: DEFAULT_SANDBOX_PERMISSIONS,
		docker: DEFAULT_DOCKER_PERMISSIONS,
	},
};

/**
 * Load consolidated configuration from .pi/contained.json
 * Falls back to legacy separate config files for backwards compatibility
 */
export function loadContainedConfig(cwd: string): ContainedConfig {
	const projectPath = join(cwd, ".pi", "contained.json");
	const globalPath = join(getAgentDir(), "extensions", "contained.json");

	let config: ContainedConfig = structuredClone(DEFAULT_CONTAINED_CONFIG);

	// Load global config
	if (existsSync(globalPath)) {
		try {
			const global = JSON.parse(readFileSync(globalPath, "utf-8"));
			config = deepMergeConfig(config, global);
		} catch (e) {
			console.error(`Warning: Could not parse ${globalPath}: ${e}`);
		}
	}

	// Load project config
	if (existsSync(projectPath)) {
		try {
			const project = JSON.parse(readFileSync(projectPath, "utf-8"));
			config = deepMergeConfig(config, project);
		} catch (e) {
			console.error(`Warning: Could not parse ${projectPath}: ${e}`);
		}
	} else {
		// Backwards compatibility: check for legacy separate config files
		config = loadLegacyConfigs(cwd, config);
	}

	return config;
}

/**
 * Load legacy separate config files (.pi/docker.json, .pi/sandbox.json, .pi/permission.json)
 */
function loadLegacyConfigs(cwd: string, config: ContainedConfig): ContainedConfig {
	// Legacy docker config
	const dockerPath = join(cwd, ".pi", "docker.json");
	if (existsSync(dockerPath)) {
		try {
			const docker = JSON.parse(readFileSync(dockerPath, "utf-8"));
			config.docker = { ...config.docker, ...docker };
		} catch {
			// Ignore
		}
	}

	// Legacy sandbox config
	const sandboxPath = join(cwd, ".pi", "sandbox.json");
	if (existsSync(sandboxPath)) {
		try {
			const sandbox = JSON.parse(readFileSync(sandboxPath, "utf-8"));
			config.sandbox = deepMergeSandbox(config.sandbox || {}, sandbox);
		} catch {
			// Ignore
		}
	}

	// Legacy permission config (convert to new format)
	const permissionPath = join(cwd, ".pi", "permission.json");
	if (existsSync(permissionPath)) {
		try {
			const permission = JSON.parse(readFileSync(permissionPath, "utf-8"));
			if (permission.enabled !== undefined) {
				config.permissions = config.permissions || {};
				config.permissions.enabled = permission.enabled;
			}
			if (permission.dangerousPatterns) {
				// Apply to local (most restrictive) by default
				config.permissions = config.permissions || {};
				config.permissions.local = config.permissions.local || {};
				config.permissions.local.dangerous = [
					...new Set([...(config.permissions.local.dangerous || []), ...permission.dangerousPatterns]),
				];
			}
		} catch {
			// Ignore
		}
	}

	return config;
}

/**
 * Save consolidated configuration to .pi/contained.json
 */
export function saveContainedConfig(cwd: string, updates: Partial<ContainedConfig>): void {
	const projectPath = join(cwd, ".pi", "contained.json");
	const piDir = dirname(projectPath);

	if (!existsSync(piDir)) {
		mkdirSync(piDir, { recursive: true });
	}

	const existing = existsSync(projectPath) ? JSON.parse(readFileSync(projectPath, "utf-8")) : {};
	const merged = deepMergeConfig(existing, updates);

	writeFileSync(projectPath, JSON.stringify(merged, null, 2));
}

/**
 * Get permission patterns for a specific execution strategy
 */
export function getPermissionPatterns(
	config: ContainedConfig,
	strategy: ExecutionStrategy,
): EnvironmentPermissions {
	const permissions = config.permissions;
	if (!permissions?.enabled) {
		return { dangerous: [], blocked: [] };
	}

	const envPermissions = permissions[strategy] || {};
	return {
		dangerous: envPermissions.dangerous || [],
		blocked: envPermissions.blocked || [],
	};
}

/**
 * Deep merge two ContainedConfig objects
 */
export function deepMergeConfig(base: ContainedConfig, overrides: Partial<ContainedConfig>): ContainedConfig {
	const result: ContainedConfig = structuredClone(base);

	if (overrides.strategy !== undefined) {
		result.strategy = overrides.strategy;
	}

	if (overrides.docker) {
		result.docker = { ...result.docker, ...overrides.docker };
	}

	if (overrides.sandbox) {
		result.sandbox = deepMergeSandbox(result.sandbox || {}, overrides.sandbox);
	}

	if (overrides.permissions) {
		result.permissions = deepMergePermissions(result.permissions || {}, overrides.permissions);
	}

	return result;
}

/**
 * Deep merge sandbox config
 */
function deepMergeSandbox(base: SandboxConfig, overrides: Partial<SandboxConfig>): SandboxConfig {
	const result: SandboxConfig = { ...base };

	if (overrides.enabled !== undefined) {
		result.enabled = overrides.enabled;
	}
	if (overrides.network) {
		result.network = { ...base.network, ...overrides.network };
	}
	if (overrides.filesystem) {
		result.filesystem = { ...base.filesystem, ...overrides.filesystem };
	}

	return result;
}

/**
 * Deep merge permissions config
 */
function deepMergePermissions(base: PermissionsConfig, overrides: Partial<PermissionsConfig>): PermissionsConfig {
	const result: PermissionsConfig = { ...base };

	if (overrides.enabled !== undefined) {
		result.enabled = overrides.enabled;
	}

	for (const env of ["local", "sandbox", "docker"] as const) {
		if (overrides[env]) {
			result[env] = mergeEnvironmentPermissions(result[env] || {}, overrides[env]!);
		}
	}

	return result;
}

/**
 * Merge environment permissions (arrays are merged, not replaced)
 */
function mergeEnvironmentPermissions(
	base: EnvironmentPermissions,
	overrides: EnvironmentPermissions,
): EnvironmentPermissions {
	return {
		dangerous: overrides.dangerous
			? [...new Set([...(base.dangerous || []), ...overrides.dangerous])]
			: base.dangerous,
		blocked: overrides.blocked
			? [...new Set([...(base.blocked || []), ...overrides.blocked])]
			: base.blocked,
	};
}
