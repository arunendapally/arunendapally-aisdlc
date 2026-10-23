# Trial: the council as a dynamic workflow, against a manual council

*2026-10-23. One real decision, run both ways on the same brief and the same four experts.*

The decision: how to narrow the Bash guard so it stops refusing harmless commands without weakening it (three false positives on 22 Oct). The workflow's record is [2026-10-23-bash-guard-targets.md](2026-10-23-bash-guard-targets.md).

| | Manual council | Workflow (`/ai-sdlc:council`) |
|---|---|---|
| Shape | 4 expert agents in parallel, then the CTO (main session) synthesises | 4 experts, then a sceptic per review checking the cited code, then a CTO agent writes the record |
| Agents | 4 | 9 |
| Wall time | about 1 minute for the experts, plus the synthesis | 4 minutes 36 seconds, in the background |
| Tokens | 88,027 in the experts; the synthesis ran in the main session's context | 49,700 output, 2.1 million cache reads, 508,000 cache writes; $2.59 at list price |
| Claims checked against the code | none before synthesis | 7 recommendations marked unsupported or wrong |

## What the sceptics caught that the manual run missed

- **Treating a heredoc file write as a Write would loosen the guard.** The Write branch only asks on `askPaths` (`scripts/hooks/pre-tool.mjs:155`) where the Bash guard denies. Three experts proposed it, and the manual synthesis adopted it; the workflow rejected it and kept a narrow rule.
- **Anchoring the push check at `^\s*git` opens bypasses:** `sudo git push`, `env X=1 git push`, `(git push ...)`, `bash -c "git push ..."`.
- **The force check is a false positive of its own:** `rm -f` anywhere in a command counts as a force push today.
- **An unquoted heredoc delimiter runs `$( )`,** so only a quoted delimiter may be treated as data.
- **`git commit -m "$(cat <<'EOF' ...)"`** fails `single` (`pre-tool.mjs:102`), so a common commit form is refused too.

## What only the manual run had

- The full list of protected-ref forms to deny: `refs/heads/main`, `--mirror`, `--all`, `--delete`, `--force-if-includes` (the workflow covered `+main` and `HEAD:main` only).
- Measuring the false share of each rule from `denials.json`, labelled by a human.

## Verdict

The workflow cost more, and gave the better decision: its sceptic step caught a recommendation that would have weakened a guard, which the manual run accepted. Use it for decisions that change a guard, a gate or anything security-sensitive. For a small or reversible decision, a manual council (or none) is cheaper and good enough. Gates, approvals and release stay in hooks, state and GitHub; the workflow only advises.
