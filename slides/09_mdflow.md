# mdflow

Turn markdown files into executable AI agents.

## Create an Agent

Create `.mdflow/hello.copilot.md`:

```markdown
---
model: claude-haiku-4.5
---
Hello!
```

## Run It

With mdflow command
```bash
mdflow .mdflow/hello.copilot.md
```

Or directly (after shell setup)
```bash
.mdflow/hello.copilot.md
```

Or from PATH
```bash
hello.copilot.md
```

## How It Works

- **Filename** `task.copilot.md` → runs `copilot`
- **Frontmatter** → CLI flags (`model: opus` → `--model opus`)
- **Body** → the prompt

## Shell Setup

```bash
mdflow --setup  # One-time setup
```

Then run `.md` files directly from anywhere.

Press -> to continue...

<!-- notes: mdflow makes markdown files executable. The filename determines which CLI to use (copilot, claude, gemini, codex). Frontmatter becomes CLI flags. The body is the prompt. After shell setup, you can run .md files directly like scripts. -->
