# Scripting Copilot

Use `copilot -p` to integrate AI into your shell scripts and workflows.

## Basic Usage

```bash
# Get a quick answer, no interactive session
copilot -p "What's the git command to undo my last commit but keep changes?"
```

## Pipe Context In

```bash
# Explain an error from a failed command
npm run build 2>&1 | copilot -p "Explain this error and how to fix it"

# Summarize a file
cat package.json | copilot -p "What does this project do?"
```

## Generate and Execute

```bash
# Generate a command, review it, then run
copilot -p "Find all .ts files modified in the last 24 hours" | sh

# Or safer: preview first
copilot -p "Command to delete node_modules in all subdirectories" 
```

## In Scripts

```bash
#!/bin/bash
# Auto-generate commit messages
diff=$(git diff --cached)
msg=$(echo "$diff" | copilot -p "Write a conventional commit message for this diff")
git commit -m "$msg"
```

## Key Flags

- `-p <prompt>` - Prompt mode (non-interactive, outputs to stdout)
- `--silent` - Suppress status messages, clean output for piping
- `--allow-all-tools` - Skip tool confirmation prompts

Press → to continue...

<!-- notes: The -p flag is the key to scripting with Copilot. It runs non-interactively and outputs to stdout, making it perfect for pipelines. Combine with --silent for clean output that's easy to parse or pipe to other commands. -->
