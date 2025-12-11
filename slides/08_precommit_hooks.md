# Pre-commit Hooks

Use Copilot in git hooks to enforce standards before commits.

## The Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Get staged .ts files
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$')

if [ -n "$STAGED" ]; then
  echo "Checking test coverage for staged .ts files..."

  OUTPUT=$(copilot --allow-all-tools -p \
    "Check staged .ts files. If methods lack tests, print <ERROR>details</ERROR>" \
    --agent testing-specialist)

  # Check for <ERROR> tags in output
  if echo "$OUTPUT" | grep -q "<ERROR>"; then
    echo "Commit blocked: Test coverage issues detected"
    echo "$OUTPUT" | grep -oP '(?<=<ERROR>).*(?=</ERROR>)'
    exit 1
  fi
fi
```

## What Happens

```bash
git commit -m "adding a function"
# ❌ Commit blocked: Test coverage issues detected
# The following methods have no test coverage:
# - validateSlidesDir() - Not tested
# - loadSlides() - Not tested
```

Press -> to continue...

<!-- notes: Git hooks can invoke Copilot to enforce standards. This pre-commit hook checks staged TypeScript files for test coverage using the testing-specialist agent. The ERROR tag pattern lets you parse structured output and block commits when issues are found. -->
