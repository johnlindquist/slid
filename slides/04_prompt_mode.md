# Prompt Mode

The `-p` flag runs a single prompt and exits. Perfect for scripts.

## Quick Answers

```bash
# Get a quick answer
co "What's the command to list all Docker containers?"

# Explain something
co "Explain what git rebase does in simple terms"
```

## Key Characteristics

- **Non-interactive**: Runs once, outputs to stdout, exits
- **Pipeable**: Output can be piped to other commands
- **Scriptable**: Perfect for shell scripts and automation
- **Silent option**: Use `--silent` for clean output

## Output Behavior

```bash
# Default: includes status messages
copilot -p "Hello"

# Silent: clean output only
copilot -p "Hello" --silent
```

Press → to continue...

<!-- notes: Prompt mode with -p is the key to scripting. It's non-interactive, outputs to stdout, and exits when done. This is what makes Copilot CLI a powerful scripting tool rather than just a chat interface. -->
