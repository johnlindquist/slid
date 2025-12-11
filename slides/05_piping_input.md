# Piping Input

Pipe any content into Copilot for analysis.

## Error Analysis

```bash
# Explain a build error
npm run build 2>&1 | co "Explain this error and how to fix it"

# Analyze test failures
bun test 2>&1 | co "Why are these tests failing?"
```

## File Analysis

```bash
# Understand a file
cat package.json | co "What does this project do?"

# Review code
cat src/index.ts | co "Review this code for issues"
```

## Log Analysis

```bash
# Parse logs
tail -100 app.log | co "Find any errors or warnings"

# Summarize activity
cat ~/.zsh_history | tail -50 | co "What was I working on?"
```

## Git Diffs

```bash
# Explain changes
git diff | co "Summarize these changes"

# Review staged changes
git diff --cached | co "Any issues with these changes?"
```

Press → to continue...

<!-- notes: Piping is incredibly powerful. You can pipe literally anything - errors, logs, files, diffs - and get instant AI analysis. This is where the CLI really shines compared to web interfaces. -->
