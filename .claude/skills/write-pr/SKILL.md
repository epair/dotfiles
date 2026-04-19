---
name: write-pr
description: Write the PR description and output it to the pr markdown file
context: fork
agent: Explore
allowed-tools: Bash(git diff *), Bash(git log*)
---

## Context
- LLM context: read all files in `<parent-dir>/.gitgrove/worktrees/<current-dir-name>/`
- PR diff: !`git diff origin/main`
- Changed files: !`git diff origin/main --name-only`
- Commit messages: !`git log origin/main...HEAD`

## Your tasks

1. Write a brief PR description
2. Ask for user approval of PR description
3. Rework upon rejection or write to `<parent-dir>/.gitgrove/worktrees/<current-dir-name>/pr.md` upon approval.

## PR Styling Guide
When writing PR summaries:
- Use single concise paragraphs made up of just a few sentences
- Length of PR description should be respective to code change size
    - Example: small uncomplicated text change - one short sentence; large feature creation - 4/5 sentences or 2 small paragraphs 1-3 sentences each
    - There will be exceptions to this rule: size does not equal complexity
- Use full sentences
- Referenced code should be referenced by filename or class name and surrounded by `` tick quotes
- Reference relevant Github issues or PR's, but ONLY if the user has mentioned them
    - If a git issue was given as the prompt/ticket, the prepend the summary with 'Closes #<pr-id-number>\n\n'
    - Otherwise, if a git issue or PR was explicitly mentioned, prepend the summary with 'Relevant #<pr-id-number>\n\n'
