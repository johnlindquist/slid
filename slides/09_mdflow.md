# mdflow

Turn Markdown files into executable AI agents.

## Create an Agent

Create `.mdflow/hello.copilot.md`:

```markdown
---
model: claude-haiku-4.5
---
Hello!
```

## Run It

Using the `mdflow` command:

```bash
mdflow .mdflow/hello.copilot.md
```

Or run directly (after setup):

```bash
.mdflow/hello.copilot.md
```

Or run from PATH:

```bash
hello.copilot.md
```

## How It Works

  - **Filename** `task.copilot.md` → Runs `copilot`
  - **Frontmatter** → CLI flags (`model: opus` → `--model opus`)
  - **Body** → The prompt

## Shell Setup

```bash
mdflow --setup  # One-time setup
```

After setup, you can run `.md` files directly from any location.

<!-- notes: mdflow makes markdown files executable. The filename determines which CLI to use (copilot, claude, gemini, codex). Frontmatter becomes CLI flags. The body is the prompt. After shell setup, you can run .md files directly like scripts. -->
