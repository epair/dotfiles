---
name: commit
description: Analyzes the changes to the current branch and commits them with appopriate git messages
allowed-tools: Bash(git add *), Bash(git commit *)
---

## Context
- LLM context: read all files in `<parent-dir>/.gitgrove/worktrees/<current-dir-name>/`
- diff: !`git diff origin/main`
- Changed files: !`git diff origin/main --name-only`

A commit message should answer the following questions within the context of its git history:
- Why is this change necessary?
- How does it address the issue?
- What side effects does this change have?

## Your tasks

1. Review the diff and changed files to understand all modifications on this branch.
2. Review the context to understand the motivations behind the changes.
2. Group the changes into logical commit groups, ideally atomic.
3. For each commit, draft a concise imperative commit message (one sentence). Commit message styling found in [commit-styling.md](commit-styling.md).
  - Draft one imperative concise sentence, no more than 50 characters
  - Use varied verbs across multiple commits — don't repeat the same verb.
  - If a commit isn't atomic, allow longer commit message formatting (seen below)
4. Present the proposed commit plan (groupings + messages) to the user for approval.
5. Upon approval, stage and commit each group. Upon rejection, rework the plan.

## Example Commit Messages

- Atomic commit message: "Extract methods for cache retrieval and execution"
- Longer commit message:
```
Capitalized, short (60 chars or less) summary

More detailed explanatory text, if necessary.  Wrap it to about 72
characters or so.  In some contexts, the first line is treated as the
subject of an email and the rest of the text as the body.  The blank
line separating the summary from the body is critical (unless you omit
the body entirely); tools like rebase can get confused if you run the
two together.

Further paragraphs come after blank lines.

- Bullet points are okay, too

- Typically a hyphen or asterisk is used for the bullet, followed by a
  single space, with blank lines in between, but conventions vary here

- Use a hanging indent
```
