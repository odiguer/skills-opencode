---
name: git-guardrails
description: Set up opencode permission rules to block dangerous git commands (push, reset --hard, clean, branch -D, checkout ., restore .) before they execute. Use when the user wants to prevent destructive git operations, add git safety guardrails, or block git push/reset in opencode.
---

# Setup Git Guardrails

Configures opencode's `permission.bash` rules to deny dangerous git commands. opencode must be restarted for permission changes to take effect.

## What gets blocked

- `git push` (all variants, including `--force`)
- `git reset --hard`
- `git clean -f` / `git clean -fd`
- `git branch -D`
- `git checkout .`
- `git restore .`

## Steps

### 1. Ask scope

Ask the user: install for **this project** (`./opencode.json`) or **all projects** (`~/.config/opencode/opencode.json`)?

### 2. Read existing config

Read the target config file if it exists. Preserve every existing field: only merge into `permission.bash`.

### 3. Merge permission rules

Ensure the config has a top-level `permission` object with a `bash` object. Insert the deny rules after any existing `"*": "allow"` catch-all, or add `"*": "allow"` first if there is no existing bash permission config.

Example project config (`./opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "bash": {
      "*": "allow",
      "git push*": "deny",
      "git reset --hard*": "deny",
      "git clean -f*": "deny",
      "git branch -D*": "deny",
      "git checkout .*": "deny",
      "git restore .*": "deny"
    }
  }
}
```

Rules are evaluated in order and the **last matching rule wins**, so the broad `"*": "allow"` must come before the specific denials.

If the user already has bash permission rules, merge the guardrail denials in without removing their existing patterns.

### 4. Ask about customization

Ask if the user wants to add or remove any patterns from the blocked list. Edit the written config accordingly.

### 5. Write config and remind about restart

Write the merged config back to the chosen file.

Tell the user:

- The guardrails are active after they **quit and restart opencode**.
- They can edit `permission.bash` directly later; re-running this skill is only necessary if they want to change the blocked command set.

### 6. Verify (optional)

If the user agrees, attempt a blocked command in a safe way and confirm opencode denies it. For example, run `git push --dry-run` in a repo where it would otherwise be safe, and confirm the tool returns a permission-denied error.
