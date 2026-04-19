---
name: gitgrove-new
description: Uses CLI tool gitgrove to create a new git worktree and tmux session with then desired configuration
disable-model-invocation: true
allowed-tools: Bash(gitgrove *), Bash(gh issue *), Bash(mkdir *), Bash(ls *), Bash(mkdir -p */.gitgrove/worktrees/*), Edit(*/.gitgrove/worktrees/*), Read(*/.gitgrove/worktrees/*), Write(*/.gitgrove/worktrees/*)
---

## Context
- If $0 is an integer, git issue prompt for future claude session: `gh issue view $0 --json body`
- Otherwise, $0 or $1 is a prompt for future claude session
- The created worktree and session will be used to develop the features in the prompt.

## Your tasks

1. Come up with a name for the worktree. The name should be dash-separated and just a few words.
   Examples: 'hubspot-setup-form', 'rails-7.1-upgrade', 'request-text-parser'
2. Output the above context (prompt + issue) to a new markdown file located at `.gitgrove/worktrees/<new-worktree-name>/prompt.md` (i.e. `$PWD/.gitgrove/worktrees/<new-worktree-name>/prompt.md` - the .gitgrove and worktrees directories already exists; find them and use the existing ones, DO NOT create new .gitgrove or worktrees directories.
3. Run `gitgrove new <worktree-name>`. DO NOT move to a different directory or call 'cd' - call the gitgrove new command from within our current directory.
