# Skill mechanics

The skill-specific branch of [`writing-for-agents`](SKILL.md): what changes when the document is a skill (frontmatter, the invocation choice, and router skills). Everything else about writing it is the universal reference in `SKILL.md`.

## Invocation

In Codex, keep `name` and `description` in SKILL.md. Preserve the existing
invocation policy in `agents/openai.yaml`; automatic discovery is the default.
For an explicitly requested user-only skill, use:

```yaml
policy:
  allow_implicit_invocation: false
```

The imported Claude frontmatter fields `disable-model-invocation` and
`argument-hint` are not accepted by the installed Codex skill validator.
Keep any useful argument guidance in the body instead. Do not change invocation
policy merely because a skill has side effects: authorization belongs to the
requested action. Local reference files may still be read by another workflow
without invoking a user-only skill as a new task.

## Splitting by invocation

The invocation cut of splitting (the sequence cut lives in `SKILL.md`): split off a model-invoked skill when you have a distinct leading word that should trigger it on its own (a trigger word you actually use in your prompts), or another skill must reach it. You pay context load for the new always-loaded description, so that independent reach has to be worth it.

## Router skills

When user-invoked skills multiply past what you can remember, that piled-up cognitive load is cured by a **router skill**: one user-invoked skill that names the others and when to reach for each, so the human has one skill to remember instead of many. It recommends a workflow; selecting it does not authorize unrelated side effects. Preserve the invocation policies of the referenced skills.
