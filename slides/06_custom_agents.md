# Custom Agents

Define specialized personas using `--agent` and Markdown files.

## Create an Agent

Create `.github/agents/testing-specialist.md`:

```markdown
---
name: test-specialist
description: Focuses on test coverage and testing best practices
---

You are a testing specialist. Your responsibilities:
- Analyze existing tests and identify coverage gaps
- Write unit, integration, and end-to-end tests
- Ensure tests are isolated and deterministic
```

## Use the Agent

```bash
co "What is your role?" --agent testing-specialist

co "Verify test coverage for the last 5 commits" --agent testing-specialist
```

## Agent File Structure

  - **Location:** `.github/agents/<name>.md`
  - **Frontmatter:** `name`, `description`
  - **Body:** System prompt defining the agent's role

Press → to continue...

<!-- notes: Custom agents let you define specialized personas for different tasks. Put markdown files in .github/agents/ with frontmatter for name and description, then invoke with --agent flag. Great for testing specialists, security reviewers, documentation writers, etc. -->
