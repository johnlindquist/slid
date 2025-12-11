# Agent Aliases

Wrap agents in shell functions for quick access.

## Create a Testing Alias

```zsh
cotest() {
  copilot --allow-all-tools -p "Write tests for: $@" --agent testing-specialist
}
```

## Use It

```bash
# Generate tests for a specific file
cotest "src/utils/markdown.ts"

# Test recent changes
cotest "the last 3 commits"
```

## More Agent Alias Ideas

```zsh
# Security review
cosec() { copilot -p "Security review: $@" --agent security-reviewer; }

# Documentation
codoc() { copilot -p "Document: $@" --agent docs-writer; }

# Code review
corev() { copilot -p "Review: $@" --agent code-reviewer; }
```

## Pattern

```zsh
alias() { copilot -p "<task>: $@" --agent <specialist>; }
```

Press -> to continue...

<!-- notes: Combine custom agents with shell aliases for one-liner specialized tasks. cotest wraps the testing-specialist agent with a "Write tests for" prompt prefix. Create similar aliases for security reviews, documentation, code reviews, etc. -->
