---
name: claude-handoff
description: Hand the current conversation off to a fresh background agent that picks up the work immediately.
---

Write a handoff summary so a fresh agent can continue the authorized task. Check that the Claude CLI and its background options are available before launching. Pass the summary as a literal argument using a process argument array (for example subprocess.run in Python), never by interpolating its text into a shell command. If the CLI is unavailable, produce the temporary document via [handoff](../handoff/SKILL.md) and report that no background agent was launched.

Always pass `-n`/`--name` with a descriptive name (e.g. `--name "Fix login bug"`); it sets the display name shown in the job list, session picker, and terminal title.

Include a "suggested skills" section in the summary, linking the local SKILL.md files the next agent should read.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information, since the summary becomes the agent's prompt.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the summary accordingly.
