# Scripting Copilot

Use `copilot -p` to integrate AI into your shell scripts and workflows.

## Basic Usage

Get a quick answer without starting an interactive session:

```bash
copilot -p "What's the git command to undo my last commit but keep changes?"
```

## Command Substitution with `$()`

Explain an error from a failed command:

```bash
copilot -p "Explain this error: $(npm run build 2>&1)"
```

> `2>&1` captures both stdout and stderr.

Summarize a file's content:

```bash
copilot -p "What does this project do? $(cat package.json)"
```

## In Scripts

Auto-generate commit messages:

```bash
#!/bin/bash
diff=$(git diff --cached)
msg=$(copilot -p "Write a conventional commit message for this diff: $diff")
git commit -m "$msg"
```

## Key Flags

  - `-p <prompt>`: Prompt mode (non-interactive, outputs to stdout)
  - `--allow-all-tools`: Skip tool confirmation prompts

<!-- notes: The -p flag is the key to scripting with Copilot. It runs non-interactively and outputs to stdout. Use command substitution $() to embed context into your prompts since Copilot doesn't support piping stdin. -->
