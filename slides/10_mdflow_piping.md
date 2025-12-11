# mdflow Piping

Chain agents together with variables and stdin.

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

## Chain Them Together

```bash
plan.copilot.md --_topic "reliability" | implement.copilot.md
```

Plan → analyze codebase → output → implement!

Press -> to continue...

<!-- notes: mdflow supports template variables with _prefix and stdin via _stdin. Pipe one agent's output to another to build powerful chains. The plan agent analyzes the codebase, then pipes its recommendation to the implement agent. -->
