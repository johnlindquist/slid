---
title: "Deep Dive: Architecture"
layout: default
theme: neon
notes: "Emphasize the supervisor pattern as the key innovation"
---

# Architecture

The key insight: **terminal apps fight for control**.

## The Problem

When running React (Ink) and Asciinema together:
- Both want full TTY control
- Input gets garbled
- Output corrupts

## The Solution: Supervisor Pattern

```
┌─────────────────────────────────────┐
│           SUPERVISOR                │
│         (while loop)                │
│                                     │
│  ┌─────────┐      ┌─────────────┐  │
│  │  React  │ ───> │  Asciinema  │  │
│  │  (Ink)  │ <─── │   (native)  │  │
│  └─────────┘      └─────────────┘  │
│                                     │
│  Exit React → Play video → Restart  │
└─────────────────────────────────────┘
```

## Why It Works

1. React app **exits completely**
2. Asciinema gets **100% TTY control**
3. React **restarts** at the same slide

Clean handoffs = reliable presentations.

<!-- notes: This is the core architecture slide. Walk through the diagram slowly. Emphasize that the supervisor pattern is key - React and Asciinema never run simultaneously. The handoff is clean because we completely exit React before starting Asciinema, then restart React at the same slide index. -->
