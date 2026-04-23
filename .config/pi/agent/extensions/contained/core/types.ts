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

export interface ExecutionState {
	strategy: ExecutionStrategy;
	dockerConfig: DockerConfig | null;
	sandboxConfig: SandboxConfig | null;
	dockerAvailable: boolean;
	dockerComposeAvailable: boolean;
	composeFileExists: boolean;
	composeFilePath: string | null;
	composeServices: ComposeService[];
	activeService: string | null;
	serviceRunning: boolean;
	sandboxInitialized: boolean;
}
