import { spawn } from "node:child_process";
import { join } from "node:path";
import type { BashOperations, EditOperations, ReadOperations, WriteOperations } from "@mariozechner/pi-coding-agent";
import { getComposeCommand } from "./compose.js";

export function createDockerComposeReadOps(
	cwd: string,
	composeFile: string,
	service: string,
	workdir: string,
): ReadOperations {
	const composeCmd = getComposeCommand();

	return {
		readFile: async (path: string) => {
			const containerPath = path.startsWith("/") ? path : join(workdir, path);
			return new Promise((resolve, reject) => {
				const child = spawn(
					composeCmd[0],
					[...composeCmd.slice(1), "-f", composeFile, "exec", "-T", service, "cat", containerPath],
					{ cwd, stdio: ["ignore", "pipe", "pipe"] },
				);
				const chunks: Buffer[] = [];
				child.stdout.on("data", (d) => chunks.push(d));
				child.stderr.on("data", (d) => chunks.push(d));
				child.on("error", reject);
				child.on("close", (code) => {
					if (code !== 0) {
						reject(new Error(`Failed to read file in container: ${containerPath}`));
					} else {
						resolve(Buffer.concat(chunks));
					}
				});
			});
		},
		access: async (path: string) => {
			const containerPath = path.startsWith("/") ? path : join(workdir, path);
			return new Promise((resolve, reject) => {
				const child = spawn(
					composeCmd[0],
					[...composeCmd.slice(1), "-f", composeFile, "exec", "-T", service, "test", "-r", containerPath],
					{ cwd, stdio: "ignore" },
				);
				child.on("error", reject);
				child.on("close", (code) => {
					if (code !== 0) {
						reject(new Error(`File not accessible: ${containerPath}`));
					} else {
						resolve();
					}
				});
			});
		},
		detectImageMimeType: async (path: string) => {
			const containerPath = path.startsWith("/") ? path : join(workdir, path);
			try {
				return new Promise((resolve) => {
					const child = spawn(
						composeCmd[0],
						[...composeCmd.slice(1), "-f", composeFile, "exec", "-T", service, "file", "--mime-type", "-b", containerPath],
						{ cwd, stdio: ["ignore", "pipe", "ignore"] },
					);
					let output = "";
					child.stdout.on("data", (d) => (output += d.toString()));
					child.on("close", () => {
						const mime = output.trim();
						if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mime)) {
							resolve(mime as "image/jpeg" | "image/png" | "image/gif" | "image/webp");
						} else {
							resolve(null);
						}
					});
				});
			} catch {
				return null;
			}
		},
	};
}

export function createDockerComposeWriteOps(
	cwd: string,
	composeFile: string,
	service: string,
	workdir: string,
): WriteOperations {
	const composeCmd = getComposeCommand();

	return {
		writeFile: async (path: string, content: string | Buffer) => {
			const containerPath = path.startsWith("/") ? path : join(workdir, path);
			const b64 = Buffer.from(content).toString("base64");
			return new Promise((resolve, reject) => {
				const child = spawn(
					composeCmd[0],
					[
						...composeCmd.slice(1),
						"-f",
						composeFile,
						"exec",
						"-T",
						service,
						"sh",
						"-c",
						`echo '${b64}' | base64 -d > ${JSON.stringify(containerPath)}`,
					],
					{ cwd, stdio: "ignore" },
				);
				child.on("error", reject);
				child.on("close", (code) => {
					if (code !== 0) {
						reject(new Error(`Failed to write file in container: ${containerPath}`));
					} else {
						resolve();
					}
				});
			});
		},
		mkdir: async (dir: string) => {
			const containerPath = dir.startsWith("/") ? dir : join(workdir, dir);
			return new Promise((resolve, reject) => {
				const child = spawn(
					composeCmd[0],
					[...composeCmd.slice(1), "-f", composeFile, "exec", "-T", service, "mkdir", "-p", containerPath],
					{ cwd, stdio: "ignore" },
				);
				child.on("error", reject);
				child.on("close", (code) => {
					if (code !== 0) {
						reject(new Error(`Failed to create directory: ${containerPath}`));
					} else {
						resolve();
					}
				});
			});
		},
	};
}

export function createDockerComposeEditOps(
	cwd: string,
	composeFile: string,
	service: string,
	workdir: string,
): EditOperations {
	const read = createDockerComposeReadOps(cwd, composeFile, service, workdir);
	const write = createDockerComposeWriteOps(cwd, composeFile, service, workdir);
	return {
		readFile: read.readFile,
		access: read.access,
		writeFile: write.writeFile,
	};
}

export function createDockerComposeBashOps(
	cwd: string,
	composeFile: string,
	service: string,
	workdir: string,
): BashOperations {
	const composeCmd = getComposeCommand();

	return {
		exec: (command, execCwd, { onData, signal, timeout }) =>
			new Promise((resolve, reject) => {
				// Translate local cwd to container workdir
				const containerCwd = execCwd === cwd ? workdir : execCwd.replace(cwd, workdir);

				const child = spawn(
					composeCmd[0],
					[...composeCmd.slice(1), "-f", composeFile, "exec", "-T", "-w", containerCwd, service, "bash", "-c", command],
					{ cwd, stdio: ["ignore", "pipe", "pipe"] },
				);

				let timedOut = false;
				const timer = timeout
					? setTimeout(() => {
							timedOut = true;
							child.kill();
						}, timeout * 1000)
					: undefined;

				child.stdout.on("data", onData);
				child.stderr.on("data", onData);

				child.on("error", (e) => {
					if (timer) clearTimeout(timer);
					reject(e);
				});

				const onAbort = () => child.kill();
				signal?.addEventListener("abort", onAbort, { once: true });

				child.on("close", (code) => {
					if (timer) clearTimeout(timer);
					signal?.removeEventListener("abort", onAbort);
					if (signal?.aborted) reject(new Error("aborted"));
					else if (timedOut) reject(new Error(`timeout:${timeout}`));
					else resolve({ exitCode: code });
				});
			}),
	};
}
