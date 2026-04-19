---
name: gitgrove-export
description: Output the session plan to a markdown file for reference later
disable-model-invocation: true
allowed-tools: Bash(cp *), Write
---

## Context

- Use the .env variable `WORKTREE_NAME`

## Tasks

1. Copy the markdown plan file to `<parent-dir>/.gitgrove/worktrees/<WORKTREE_NAME>/plan.md` (i.e. `$PWD/../.gitgrove/worktrees/<WORKTREE_NAME>/plan.md`).
2. Use the export skill to copy the conversation text file to `<parent-dir>/.gitgrove/worktrees/<WORKTREE_NAME>/conversation.txt` to output the whole conversation.
