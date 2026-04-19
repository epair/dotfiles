---
name: setup-validation 
description: Analyzes what's needed for human UI validation and creates db records to validate via UI
disable-model-invocation: true
allowed-tools: Read, Bash(git diff *), Bash(git log *)
---

## Context
- LLM context: read all files in `<parent-dir>/.gitgrove/worktrees/<current-dir-name>/`
- PR diff: !`git diff main...HEAD`
- Changed files: !`git diff main...HEAD --name-only`
- Commit messages: !`git log main...HEAD`

## Tasks
1. Analyze the changes on this branch and determine what data is needed to test this new feature.
2. Check what data already exists in our db through using the rails console via `con` - avoid creating extra unneccessary records. A `User` and `Account` likely already exist. You can validate with the user and ask any necessary questions.
3. Create the necessary db entities through the rails console (`con`).
4. If the changes on this branch alter any UI/frontend views, open relevant url for the user to view the changes: `open <url>`
5. Output instructions on the steps the user should take to validate and what the expected views/output are.
