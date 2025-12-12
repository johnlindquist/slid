# Agent Aliases

Wrap agents in shell functions for faster access.

## Create a Testing Alias

```zsh
cotest() {
  copilot --allow-all-tools -p "Write tests for: $@" --agent testing-specialist
}
```

## Use It

Generate tests for a specific file:

```bash
cotest "src/utils/markdown.ts"
```

Test recent changes:

```bash
cotest "the last 3 commits"
```

## More Agent Alias Ideas

Security review:

```zsh
cosec() { copilot -p "Security review: $@" --agent security-reviewer; }
```

Documentation:

```zsh
codoc() { copilot -p "Document: $@" --agent docs-writer; }
```

Code review:

```zsh
corev() { copilot -p "Review: $@" --agent code-reviewer; }
```

## Pattern

```zsh
alias() { copilot -p "<task>: $@" --agent <specialist>; }
```

<!-- notes: Combine custom agents with shell aliases for one-liner specialized tasks. cotest wraps the testing-specialist agent with a "Write tests for" prompt prefix. Create similar aliases for security reviews, documentation, code reviews, etc. -->
