import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getAgentDir } from "@mariozechner/pi-coding-agent";
import type { DockerConfig, SandboxConfig } from "./types.js";

export const DEFAULT_DOCKER_CONFIG: DockerConfig = {
	enabled: true, // Enable by default if docker-compose.yml exists
	service: undefined, // Auto-detect or prompt user
	workdir: undefined, // Use service's working_dir or /app
};

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

export function loadDockerConfig(cwd: string): DockerConfig {
	const projectPath = join(cwd, ".pi", "docker.json");
	const globalPath = join(getAgentDir(), "extensions", "docker.json");

	let config = { ...DEFAULT_DOCKER_CONFIG };

	if (existsSync(globalPath)) {
		try {
			const global = JSON.parse(readFileSync(globalPath, "utf-8"));
			config = { ...config, ...global };
		} catch (e) {
			console.error(`Warning: Could not parse ${globalPath}: ${e}`);
		}
	}

	if (existsSync(projectPath)) {
		try {
			const project = JSON.parse(readFileSync(projectPath, "utf-8"));
			config = { ...config, ...project };
		} catch (e) {
			console.error(`Warning: Could not parse ${projectPath}: ${e}`);
		}
	}

	return config;
}

export function loadSandboxConfig(cwd: string): SandboxConfig {
	const projectPath = join(cwd, ".pi", "sandbox.json");
	const globalPath = join(getAgentDir(), "extensions", "sandbox.json");

	let config: SandboxConfig = { ...DEFAULT_SANDBOX_CONFIG };

	if (existsSync(globalPath)) {
		try {
			const global = JSON.parse(readFileSync(globalPath, "utf-8"));
			config = deepMergeSandbox(config, global);
		} catch (e) {
			console.error(`Warning: Could not parse ${globalPath}: ${e}`);
		}
	}

	if (existsSync(projectPath)) {
		try {
			const project = JSON.parse(readFileSync(projectPath, "utf-8"));
			config = deepMergeSandbox(config, project);
		} catch (e) {
			console.error(`Warning: Could not parse ${projectPath}: ${e}`);
		}
	}

	return config;
}

export function saveDockerConfig(cwd: string, config: Partial<DockerConfig>): void {
	const projectPath = join(cwd, ".pi", "docker.json");
	const piDir = dirname(projectPath);
	if (!existsSync(piDir)) {
		mkdirSync(piDir, { recursive: true });
	}
	const existing = existsSync(projectPath) ? JSON.parse(readFileSync(projectPath, "utf-8")) : {};
	writeFileSync(projectPath, JSON.stringify({ ...existing, ...config }, null, 2));
}

export function saveSandboxConfig(cwd: string, config: Partial<SandboxConfig>): void {
	const projectPath = join(cwd, ".pi", "sandbox.json");
	const piDir = dirname(projectPath);
	if (!existsSync(piDir)) {
		mkdirSync(piDir, { recursive: true });
	}
	const existing = existsSync(projectPath) ? JSON.parse(readFileSync(projectPath, "utf-8")) : {};
	writeFileSync(projectPath, JSON.stringify({ ...existing, ...config }, null, 2));
}

export function deepMergeSandbox(base: SandboxConfig, overrides: Partial<SandboxConfig>): SandboxConfig {
	const result: SandboxConfig = { ...base };
	if (overrides.enabled !== undefined) result.enabled = overrides.enabled;
	if (overrides.network) {
		result.network = { ...base.network, ...overrides.network };
	}
	if (overrides.filesystem) {
		result.filesystem = { ...base.filesystem, ...overrides.filesystem };
	}
	return result;
}
