# Contained

A Pi extension that routes tool calls through a contained execution environment, with two strategies:

1. **Docker Compose** (preferred when `docker-compose.yml` exists)
2. **OS-level sandbox** via `@anthropic-ai/sandbox-runtime` (fallback)

## Features

- **Uses existing docker-compose.yml**: No special configuration needed - just use your existing Docker Compose setup
- **Service selection**: Automatically detects services, prompts if multiple exist
- **Auto-start containers**: Starts Docker Compose services if not running
- **Sandbox fallback**: Falls back to OS-level sandboxing when Docker isn't available
- **Per-directory configuration**: Minimal config for pi-specific settings
- **Footer status**: Shows current execution environment
- **Slash commands**: Interactive menus for configuration

## Strategy Resolution

1. If `docker-compose.yml` exists and Docker is available → use Docker Compose
2. Otherwise if sandbox is enabled → use OS-level sandbox
3. Otherwise → use local execution

## Installation

The extension lives in `$PI_CODING_AGENT_DIR/extensions/contained/` (typically `~/.config/pi/agent/extensions/contained/`).

Dependencies are installed automatically, but you can manually run:

```bash
cd "$PI_CODING_AGENT_DIR/extensions/contained"
npm install
```

### Requirements

**For Docker execution:**
- Docker installed and running
- Docker Compose (v2 `docker compose` or v1 `docker-compose`)
- A `docker-compose.yml` in your project

**For Sandbox execution:**
- macOS: Uses `sandbox-exec` (built-in)
- Linux: Requires `bubblewrap`, `socat`, `ripgrep`

## Configuration

### Docker Compose

The extension automatically uses your existing `docker-compose.yml`. Supported file names:
- `docker-compose.yml`
- `docker-compose.yaml`
- `compose.yml`
- `compose.yaml`

**Minimal pi config** (optional): `.pi/docker.json`

```json
{
  "enabled": true,
  "service": "app",
  "workdir": "/workspace",
  "composeFile": "docker-compose.dev.yml"
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `enabled` | Enable Docker execution | `true` (if compose file exists) |
| `service` | Which service to use | Auto-detected or prompted |
| `workdir` | Override working directory | Service's `working_dir` or `/app` |
| `composeFile` | Custom compose file path | Auto-detect |

### Example docker-compose.yml

```yaml
services:
  app:
    build: .
    working_dir: /app
    volumes:
      - .:/app
    command: tail -f /dev/null

  node:
    image: node:20
    working_dir: /workspace
    volumes:
      - .:/workspace
    command: sleep infinity
```

### Sandbox Configuration

Create `.pi/sandbox.json` in your project directory or `~/.pi/agent/extensions/sandbox.json` for global config:

```json
{
  "enabled": true,
  "network": {
    "allowedDomains": ["github.com", "*.npmjs.org"],
    "deniedDomains": []
  },
  "filesystem": {
    "denyRead": ["~/.ssh", "~/.aws"],
    "allowWrite": [".", "/tmp"],
    "denyWrite": [".env", ".env.*"]
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `enabled` | Enable sandbox execution | `true` |
| `network.allowedDomains` | Domains allowed for network access | Common dev domains |
| `network.deniedDomains` | Domains explicitly denied | `[]` |
| `filesystem.denyRead` | Paths denied for reading | Sensitive dirs |
| `filesystem.allowWrite` | Paths allowed for writing | `.`, `/tmp` |
| `filesystem.denyWrite` | Paths denied for writing | `.env`, keys |

## Commands

### `/env`

Show the current execution environment status, including:
- Current strategy (Docker, Sandbox, or Local)
- Docker Compose file location and services
- Active service and running status
- Sandbox configuration

### `/docker`

Interactive menu for Docker Compose configuration:
- Enable/disable Docker
- Select which service to use
- Set working directory override
- Start/stop services
- View running services

### `/sandbox`

Interactive menu for sandbox configuration:
- Enable/disable sandbox
- Configure allowed domains
- Configure denied domains
- Configure filesystem permissions
- View current configuration

## CLI Flags

```bash
# Disable Docker even if docker-compose.yml exists
pi --no-docker

# Disable sandbox (use local execution)
pi --no-sandbox

# Disable both (force local execution)
pi --no-docker --no-sandbox
```

## Footer Status

The extension shows the current execution environment in the footer:

- 🐳 **Docker: app** - Running in Docker Compose service "app"
- 🐳⏸ **Docker: app** - Docker enabled but service not running
- 🔒 **Sandbox** - Running in OS-level sandbox
- 💻 **Local** - Running locally without sandboxing

## How It Works

### Docker Compose Execution

When Docker Compose is the active strategy:

1. **Service Detection**: Parses `docker-compose.yml` to find available services
2. **Auto-Start**: If the selected service isn't running, starts it with `docker compose up -d <service>`
3. **bash**: Commands run via `docker compose exec -T -w <workdir> <service> bash -c "<command>"`
4. **read**: Files read via `docker compose exec <service> cat <path>`
5. **write**: Files written via base64 encoding through `docker compose exec`
6. **edit**: Combines read and write operations in the container

### Working Directory

The extension determines the container working directory in this order:
1. `workdir` from `.pi/docker.json` (explicit override)
2. `working_dir` from the service definition in `docker-compose.yml`
3. `/app` (default fallback)

### Sandbox Execution

When sandbox is the active strategy:

1. **bash**: Commands wrapped with `SandboxManager.wrapWithSandbox()` which applies OS-level restrictions
2. **read/write/edit**: Run locally (sandbox only affects process execution)

The sandbox uses:
- macOS: `sandbox-exec` with dynamic profiles
- Linux: `bubblewrap` for namespace isolation

### User Commands (`!`, `!!`)

User shell commands also respect the execution environment:
- With Docker: Commands run in the container via `docker compose exec`
- With Sandbox: Commands run with sandbox restrictions
- Otherwise: Commands run locally

## Examples

### Basic Usage

If you already have a `docker-compose.yml`:

```bash
# Start pi - it will auto-detect and use your compose file
pi

# It will prompt you to select a service if multiple exist
# Or auto-select if only one service is defined
```

### Node.js Development

```yaml
# docker-compose.yml
services:
  dev:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    command: sleep infinity

volumes:
  node_modules:
```

```bash
# Start pi - uses the 'dev' service
pi
```

### Multi-Service Project

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    working_dir: /app
    volumes:
      - ./frontend:/app

  backend:
    build: ./backend
    working_dir: /app
    volumes:
      - ./backend:/app

  db:
    image: postgres:15
```

```bash
# Pi will prompt: "Select Docker Compose service:"
# Choose 'frontend' or 'backend' for code execution
# (db is typically not useful for code execution)
pi

# Or pre-configure the service
echo '{"service": "backend"}' > .pi/docker.json
pi
```

### Custom Compose File

```bash
# Use a different compose file
echo '{"composeFile": "docker-compose.dev.yml"}' > .pi/docker.json
pi
```

### Restrictive Sandbox (No Docker)

```json
// .pi/sandbox.json
{
  "enabled": true,
  "network": {
    "allowedDomains": [],
    "deniedDomains": ["*"]
  },
  "filesystem": {
    "denyRead": ["~", "/etc", "/var"],
    "allowWrite": ["./build", "./dist"],
    "denyWrite": [".", ".git"]
  }
}
```

## Troubleshooting

### No docker-compose.yml found

The extension looks for these files in order:
- `docker-compose.yml`
- `docker-compose.yaml`
- `compose.yml`
- `compose.yaml`

If using a different name, configure it:
```bash
echo '{"composeFile": "my-compose.yml"}' > .pi/docker.json
```

### Docker Compose service won't start

1. Check Docker is running: `docker info`
2. Check compose file is valid: `docker compose config`
3. Check service exists: `docker compose ps`
4. Try manually: `docker compose up -d <service>`

### Service is running but commands fail

1. Check the service has bash: `docker compose exec <service> bash -c 'echo hello'`
2. Some minimal images (alpine) need `sh` instead - consider using a fuller base image
3. Check volume mounts are correct in your compose file

### Sandbox initialization fails

**macOS**: Should work out of the box with `sandbox-exec`.

**Linux**: Install required tools:
```bash
# Debian/Ubuntu
sudo apt install bubblewrap socat ripgrep

# Fedora
sudo dnf install bubblewrap socat ripgrep
```

### Performance issues

- Docker adds overhead. For faster local dev, use `--no-docker`
- Large file operations through Docker can be slow due to base64 encoding
- Consider using volume mounts for frequently accessed directories

### File permission issues

If files created in the container have wrong permissions:
1. Check your compose file sets appropriate user
2. Consider adding `user: "${UID}:${GID}"` to your service
3. Or use a startup script to fix permissions
