---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once the behavior is complete, use /code-review in local-work mode, including
staged, unstaged and untracked files belonging to the task. Fix every finding
inside the ticket scope and rerun the relevant checks.

Close out through the issue-alignment gate in
[`docs/WORKFLOW.md`](../../../docs/WORKFLOW.md):

Completion requires an immutable implementation commit, a reconciled issue index
and current milestone, and an explicit report of local and remote state. Read the
remote issue, including comments and labels; apply remote changes only when
authorized, otherwise report the exact pending mutation. A clean worktree is not
proof of publication or integration.

Commit only completed task changes on the branch selected for the task, following AGENTS.md.
