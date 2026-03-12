In the majority of my projects, I use git worktrees. It is only necessary to reference the code with the current worktree or current working directory. Do not explore or reference the parent directory.

When writing git commit messages, use only one concise imperative sentence. Use a variety of appropriate verbs for multiple commit messages; don't just use 'Add' for all of them. If you're told to "commit this", split the changes up into logical commit groups if appropriate, otherwise just stick to one commit.

When writing PR descriptions/summaries, write a single short concise paragraph of made up of just a few sentences. The length of the paragraph should be respective to how large the PR is; a small bugfix change would be one short sentence while a large feature creation could be 4-5 sentences. They should be full sentences. Any referenced code should be referenced by either the filename or the class name and be surrounded by `` tick quotes.

Finalized PR descriptions/summaries should be output to `<parent-project>/.grove/metadata/<worktree-name-without-prefix>/pr.md`; the working directory will be a sibling directory under `<parent_project>/.`
