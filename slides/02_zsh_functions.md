# Copilot Aliases

Quick shortcuts for **GitHub Copilot CLI** via zsh functions.

## `co` - Quick Prompt Mode

```zsh
co()  { copilot --model claude-opus-4.5 --allow-all-tools --silent -p "$@"; }
```

**Usage:** `co "explain this error"` → runs silently, prints result

## `ico` - Interactive Mode

```zsh
ico() { copilot --model claude-opus-4.5 --allow-all-tools ${1:+-i} "$@"; }
```

**Usage:** `ico` → full interactive session | `ico "prompt"` → starts with prompt

## Model Variants

| Suffix | Model              | Example     |
|--------|-------------------|-------------|
| (none) | claude-opus-4.5   | `co`, `ico` |
| `s`    | claude-sonnet-4.5 | `cos`, `icos` |
| `h`    | claude-haiku-4.5  | `coh`, `icoh` |
| `c`    | gpt-5.1-codex-max | `coc`, `icoc` |
| `g`    | gemini-3-pro      | `cog`, `icog` |

## Session Management

```zsh
cocon() { copilot --allow-all-tools --continue; }  # Resume last session
cores() { copilot --allow-all-tools --resume "$@"; }  # Resume specific
```

## Key Copilot Flags

- `--model <model>` - AI model selection
- `--allow-all-tools` - No confirmation prompts
- `-p <prompt>` - Single prompt mode (non-interactive)
- `-i <prompt>` - Interactive with initial prompt
- `--continue` / `--resume` - Session management

Press → to continue...

<!-- notes: These zsh functions wrap the GitHub Copilot CLI for quick access. The 'co' function is for quick one-off prompts, while 'ico' starts a full interactive session. Model suffixes let you quickly switch between Opus, Sonnet, Haiku, Codex, and Gemini models. -->
