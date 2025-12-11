# Continue

Resume previous sessions using `--continue` or `--resume`.

## Chaining Prompts

First, get suggestions:

```bash
co "Suggest the next 3 tasks"
```

Then, continue the conversation to dig deeper:

```bash
cocon "Argue for the task we should do next"
```

The `cocon` alias uses `--continue` to resume your most recent session.

## Session Management

Continue the most recent session:

```bash
copilot --continue
```

Select from recent sessions:

```bash
copilot --resume
```

Resume a specific session by ID:

```bash
copilot --resume abc123
```

## Why Continue?

  - Maintain context across multiple prompts
  - Build upon previous analysis
  - Avoid re-explaining your codebase
  - Chain quick prompts into deeper exploration

Press → to continue...

<!-- notes: The --continue flag resumes your most recent session with full context. This is powerful for iterative workflows - get quick suggestions with co, then use cocon to dive deeper without losing context. The --resume flag lets you pick from recent sessions. -->
