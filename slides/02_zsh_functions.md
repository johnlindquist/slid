# Copilot Aliases

Quick shortcuts for the **GitHub Copilot CLI** using zsh functions.

## `co` - Quick Prompt Mode

```zsh
co()  { copilot --model claude-opus-4.5 --allow-all-tools --silent -p "$@"; }
```

**Usage:** `co "explain this error"` → Runs silently, prints result.

## `ico` - Interactive Mode

```zsh
ico() { copilot --model claude-opus-4.5 --allow-all-tools ${1:+-i} "$@"; }
```

**Usage:**

  - `ico` → Starts a full interactive session.
  - `ico "prompt"` → Starts a session with an initial prompt.

## Model Variants

| Suffix | Model             | Example       |
|--------|-------------------|---------------|
| (none) | claude-opus-4.5   | `co`, `ico`   |
| `s`    | claude-sonnet-4.5 | `cos`, `icos` |
| `h`    | claude-haiku-4.5  | `coh`, `icoh` |
| `c`    | gpt-5.1-codex-max | `coc`, `icoc` |
| `g`    | gemini-3-pro      | `cog`, `icog` |

## Session Management

```zsh
cocon() { copilot --allow-all-tools --continue; }  # Resume the last session
cores() { copilot --allow-all-tools --resume "$@"; }  # Resume a specific session
```

## Key Copilot Flags

  - `--model <model>`: Select the AI model
  - `--allow-all-tools`: Skip confirmation prompts
  - `-p <prompt>`: Single prompt mode (non-interactive)
  - `-i <prompt>`: Interactive mode with initial prompt
  - `--continue` / `--resume`: Session management

Press → to continue...

<!-- notes: These zsh functions wrap the GitHub Copilot CLI for quick access. The 'co' function is for quick one-off prompts, while 'ico' starts a full interactive session. Model suffixes let you quickly switch between Opus, Sonnet, Haiku, Codex, and Gemini models. -->
