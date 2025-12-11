# GitHub CLI Commands

Use command substitution `$()` to embed `gh` CLI output into prompts.

## Validate an Issue

First, view the issue:

```bash
gh issue view 1
```

Then use `!!` to reference the previous command:

```bash
ico "Is this issue valid? $(!!)"
```

**Tip:** `!!` expands to your last command, allowing you to run `gh` first and then easily embed it.

## More Examples

Summarize a Pull Request:

```bash
co "Summarize this PR: $(gh pr view 123)"
```

Review changes:

```bash
co "Review these changes: $(gh pr diff 42)"
```

Prioritize work:

```bash
co "Which issue should I tackle? $(gh issue list --limit 5)"
```

## Key Pattern

```bash
copilot -p "Your question: $(gh command)"
#                          ^^^^^^^^^^^^
#                          Command substitution embeds output
```

Press → to continue...

<!-- notes: Use command substitution $() to embed gh CLI output directly into Copilot prompts. This works because the shell expands the command before passing the full string to Copilot. Much more reliable than piping. -->
