# Conditionals

Use LiquidJS templates to create dynamic prompts.

## Conditional Agent

Create `.mdflow/conditional-args.copilot.md`:

```markdown
{% if _1 == "yes" %}
Say {{ _2 }}
{% else %}
Say {{ _3 }}
{% endif %}
```

## Positional Arguments

Pass arguments after the filename:

```bash
conditional-args.copilot.md "yes" "pizza" "taco"
```

`_1`, `_2`, and `_3` map to the positional arguments.

## Dry Run

Preview the prompt without execution:

```bash
conditional-args.copilot.md "no" "green" "red" --dry-run
```

**Output:**

```
Final Prompt:
Say red
```

## Template Features

  - `{% if %}` / `{% else %}` / `{% endif %}` - Conditionals
  - `{% for item in list %}` - Loops
  - `{{ variable | upcase }}` - Filters

Press → to continue...

<!-- notes: mdflow uses LiquidJS for templating. You get conditionals, loops, and filters. Positional arguments become _1, _2, _3 etc. Use --dry-run to preview what prompt will be sent without actually running it. -->
