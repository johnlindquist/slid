# mdflow Piping

Chain agents using variables and standard input (stdin).

## Template Variables

Create `.mdflow/plan.copilot.md`:

```markdown
---
model: claude-haiku-4.5
_topic: "anything"
allow-all-tools: true
---
What's the most important fix for {{ _topic }}?

@src/**/*.ts
```

Execute:

```bash
plan.copilot.md --_topic "performance"
```

## Piping with `_stdin`

Create `.mdflow/implement.copilot.md`:

```markdown
---
model: claude-haiku-4.5
allow-all-tools: true
---
Implement the plan for: {{ _stdin }}
```

## Chaining Agents

```bash
plan.copilot.md --_topic "reliability" | implement.copilot.md
```

**Flow:** Plan → Analyze Codebase → Output → Implement!

Press → to continue...

<!-- notes: mdflow supports template variables with _prefix and stdin via _stdin. Pipe one agent's output to another to build powerful chains. The plan agent analyzes the codebase, then pipes its recommendation to the implement agent. -->
