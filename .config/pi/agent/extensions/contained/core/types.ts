import type { SandboxRuntimeConfig } from "@anthropic-ai/sandbox-runtime";

export interface DockerConfig {
	enabled?: boolean;
	service?: string; // Which docker-compose service to use
	workdir?: string; // Working directory inside container
	composeFile?: string; // Custom compose file path (default: docker-compose.yml)
}

export interface ComposeService {
	name: string;
	image?: string;
	build?: string | { context?: string; dockerfile?: string };
	working_dir?: string;
	volumes?: string[];
}

export interface SandboxConfig extends SandboxRuntimeConfig {
	enabled?: boolean;
}

export type ExecutionStrategy = "docker" | "sandbox" | "local";

/**
 * Permission patterns for a specific execution environment
 */
export interface EnvironmentPermissions {
	/** Patterns that require user approval before execution */
	dangerous?: string[];
	/** Patterns that are always blocked (no override possible) */
	blocked?: string[];
}

/**
 * Permission configuration with per-environment overrides
 */
export interface PermissionsConfig {
	enabled?: boolean;
	/** Patterns for local (no containment) execution - strictest */
	local?: EnvironmentPermissions;
	/** Patterns for sandbox execution - medium strictness */
	sandbox?: EnvironmentPermissions;
	/** Patterns for docker execution - most relaxed */
	docker?: EnvironmentPermissions;
}

/**
 * Consolidated configuration for the contained extension
 * Stored in .pi/contained.json
 */
export interface ContainedConfig {
	/** Preferred execution strategy */
	strategy?: ExecutionStrategy;
	/** Docker compose configuration */
	docker?: DockerConfig;
	/** OS-level sandbox configuration */
	sandbox?: SandboxConfig;
	/** Permission gate configuration (applies to all strategies) */
	permissions?: PermissionsConfig;
}

export interface ExecutionState {
	strategy: ExecutionStrategy;
	config: ContainedConfig;
	dockerAvailable: boolean;
	dockerComposeAvailable: boolean;
	composeFileExists: boolean;
	composeFilePath: string | null;
	composeServices: ComposeService[];
	activeService: string | null;
	serviceRunning: boolean;
	sandboxInitialized: boolean;
	/** Session-scoped approvals (command hashes approved during this session) */
	sessionApprovals: Set<string>;
}
