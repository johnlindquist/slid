# Continue

Resume previous sessions with `--continue` or `--resume`.

## Chain Prompts Together

First, get suggestions
```bash
co "Suggest the next 3 tasks"
```

Then continue the conversation to dig deeper
```bash
cocon "Argue for the task we should do next"
```

The `cocon` alias uses `--continue` to resume your most recent session.

## Session Management

Continue most recent session
```bash
copilot --continue
```

Pick from recent sessions
```bash
copilot --resume
```

Resume a specific session ID
```bash
copilot --resume abc123
```

## Why Continue?

- Keep context across multiple prompts
- Build on previous analysis
- Avoid re-explaining your codebase
- Chain quick prompts into deeper exploration

Press -> to continue...

<!-- notes: The --continue flag resumes your most recent session with full context. This is powerful for iterative workflows - get quick suggestions with co, then use cocon to dive deeper without losing context. The --resume flag lets you pick from recent sessions. -->
