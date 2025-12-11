# mdflow Commands

Embed shell command output directly into prompts using `` !`cmd` ``.

## Daily Summary Agent

Create `.mdflow/daily-summary.copilot.md`:

```markdown
---
model: claude-haiku-4.5
---
Summarize this log:

<log>
!`git log --since="1 day ago"`
</log>
```

## Run It

```bash
daily-summary.copilot.md
```

**Output:** `[imports] Executing: git log --since="1 day ago"`

## More Examples

```markdown
Current branch: !`git branch --show-current`

Recent changes:
!`git diff --stat HEAD~5`

Environment:
!`node --version`
!`bun --version`
```

## How It Works

  - `` !`command` `` executes at parse time
  - Output replaces the command inline
  - Combine with `@` imports for richer context

Press → to continue...

<!-- notes: The bang-backtick syntax executes shell commands and inlines their output into your prompt. Great for injecting git logs, diffs, environment info, or any dynamic data. Commands run before the prompt is sent to the AI. -->
