import { execSync, spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ComposeService } from "../core/types.js";

export function isDockerAvailable(): boolean {
	try {
		execSync("docker --version", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

export function isDockerComposeAvailable(): boolean {
	try {
		// Try docker compose (v2) first
		execSync("docker compose version", { stdio: "ignore" });
		return true;
	} catch {
		try {
			// Fall back to docker-compose (v1)
			execSync("docker-compose --version", { stdio: "ignore" });
			return true;
		} catch {
			return false;
		}
	}
}

export function getComposeCommand(): string[] {
	try {
		execSync("docker compose version", { stdio: "ignore" });
		return ["docker", "compose"];
	} catch {
		return ["docker-compose"];
	}
}

export function findComposeFile(cwd: string, customPath?: string): string | null {
	if (customPath) {
		const fullPath = join(cwd, customPath);
		return existsSync(fullPath) ? fullPath : null;
	}

	const candidates = [
		"docker-compose.yml",
		"docker-compose.yaml",
		"compose.yml",
		"compose.yaml",
	];

	for (const candidate of candidates) {
		const fullPath = join(cwd, candidate);
		if (existsSync(fullPath)) {
			return fullPath;
		}
	}

	return null;
}

export function parseComposeFile(filePath: string): ComposeService[] {
	try {
		const content = readFileSync(filePath, "utf-8");
		// Simple YAML parsing for services - handles most common cases
		const services: ComposeService[] = [];

		// Find the services section
		const lines = content.split("\n");
		let inServices = false;
		let currentService: string | null = null;
		let currentIndent = 0;
		let serviceData: Record<string, any> = {};

		for (const line of lines) {
			const trimmed = line.trimStart();
			const indent = line.length - trimmed.length;

			// Detect services: section
			if (trimmed.startsWith("services:")) {
				inServices = true;
				currentIndent = indent;
				continue;
			}

			if (!inServices) continue;

			// End of services section (another top-level key)
			if (indent <= currentIndent && trimmed && !trimmed.startsWith("#") && trimmed.includes(":")) {
				if (currentService) {
					services.push({ name: currentService, ...serviceData });
				}
				break;
			}

			// Service name (one level deeper than services:)
			if (indent === currentIndent + 2 && trimmed.endsWith(":") && !trimmed.startsWith("#")) {
				if (currentService) {
					services.push({ name: currentService, ...serviceData });
				}
				currentService = trimmed.slice(0, -1).trim();
				serviceData = {};
				continue;
			}

			// Service properties
			if (currentService && indent > currentIndent + 2 && trimmed.includes(":")) {
				const colonIdx = trimmed.indexOf(":");
				const key = trimmed.slice(0, colonIdx).trim();
				const value = trimmed.slice(colonIdx + 1).trim();

				if (key === "image") {
					serviceData.image = value.replace(/["']/g, "");
				} else if (key === "working_dir") {
					serviceData.working_dir = value.replace(/["']/g, "");
				} else if (key === "build" && value) {
					serviceData.build = value.replace(/["']/g, "");
				}
			}
		}

		// Don't forget the last service
		if (currentService) {
			services.push({ name: currentService, ...serviceData });
		}

		return services;
	} catch (e) {
		console.error(`Failed to parse compose file: ${e}`);
		return [];
	}
}

export function isServiceRunning(cwd: string, composeFile: string, serviceName: string): boolean {
	try {
		const composeCmd = getComposeCommand();
		const result = spawnSync(composeCmd[0], [...composeCmd.slice(1), "-f", composeFile, "ps", "-q", serviceName], {
			cwd,
			encoding: "utf-8",
			stdio: ["ignore", "pipe", "pipe"],
		});
		return result.status === 0 && result.stdout.trim().length > 0;
	} catch {
		return false;
	}
}

export function getRunningServices(cwd: string, composeFile: string): string[] {
	try {
		const composeCmd = getComposeCommand();
		const result = spawnSync(
			composeCmd[0],
			[...composeCmd.slice(1), "-f", composeFile, "ps", "--services", "--filter", "status=running"],
			{
				cwd,
				encoding: "utf-8",
				stdio: ["ignore", "pipe", "pipe"],
			},
		);
		if (result.status === 0) {
			return result.stdout
				.trim()
				.split("\n")
				.filter((s) => s.length > 0);
		}
		return [];
	} catch {
		return [];
	}
}

export async function startComposeService(
	cwd: string,
	composeFile: string,
	serviceName: string,
): Promise<{ success: boolean; error?: string }> {
	return new Promise((resolve) => {
		const composeCmd = getComposeCommand();
		const child = spawn(composeCmd[0], [...composeCmd.slice(1), "-f", composeFile, "up", "-d", serviceName], {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stderr = "";
		child.stderr?.on("data", (d) => (stderr += d.toString()));

		child.on("error", (e) => {
			resolve({ success: false, error: e.message });
		});

		child.on("close", (code) => {
			if (code === 0) {
				resolve({ success: true });
			} else {
				resolve({ success: false, error: stderr || `Exit code ${code}` });
			}
		});
	});
}

export async function stopComposeService(cwd: string, composeFile: string, serviceName: string): Promise<void> {
	return new Promise((resolve) => {
		const composeCmd = getComposeCommand();
		const child = spawn(composeCmd[0], [...composeCmd.slice(1), "-f", composeFile, "stop", serviceName], {
			cwd,
			stdio: "ignore",
		});
		child.on("close", () => resolve());
		child.on("error", () => resolve());
	});
}
