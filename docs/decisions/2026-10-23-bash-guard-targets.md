# Proposal: judge each Bash command on what it targets

*2026-10-23. Chaired by the CTO agent. A proposal: it takes effect only when a human accepts it.*

On 22 Oct 2026 the Bash guard refused three harmless commands: a heredoc appending JS to `scripts/loop.mjs` whose text named `.ai-sdlc` and `.github`, `cat templates/repo/.ai-sdlc/.gitignore; sed -n 554,558p scripts/sdlc.mjs`, and `git push -q -u origin claude/review-convergence; gh pr create ... --base main`. Each refusal counts toward `denialCap` (scripts/lib.mjs:117).

| Expert | Push check | Chained reads | Heredoc body | Tests |
|---|---|---|---|---|
| safe-ai-sdlc-expert | per segment, anchored `^\s*git` | read if every segment reads; `sed -n N,Mp` only | Write parity | |
| tech-lead | push segment only | split on `;` `&&` | data if quoted target is not a guardrail | mutation proof |
| agentic-ai-expert | per segment, deny `+refspec` | every segment a read verb | shared `checkWrite()` | golden eval 25 |
| qa-engineer | push segment, catch `+main` | per segment, add `sed -n`, `ls` | strip bodies and quoted text | allow and deny table |

## Agreed

The root cause is testing the whole line (scripts/hooks/pre-tool.mjs:86-88, :106-107). Split the command into segments first, then judge each.

## Contested, and how it is settled

- **Anchor the push regex.** Dropped. `sudo git push origin main`, `env X=1 git push`, `(git push ...)` and `bash -c "git push ..."` escape `^`. Split, then match unanchored within the segment, keeping `git -C x push` and `HEAD:main`.
- **Which operators split.** Every one: `;` `&&` `||` `|` `&` and newline, respecting quotes, `$( )` and backticks, never splitting `2>&1`. Splitting only `;` and `&&` passes `cat a | tee state.json`.
- **sed.** Only `sed -n 'N,Mp' FILE`. `sed -n 'w f'` writes. `rg --pre` and `find -exec` are not reads. `ls` is added.
- **Force and `+refspec`.** Force flags count only inside the push segment (today `rm -f` counts). `+main` and `+feature` are force pushes and are denied: a small tightening, not a loosening.
- **Heredoc as a Write.** Rejected. Write only asks on askPaths (pre-tool.mjs:155) where Bash denies, so parity loosens Bash; it is a new feature. Kept narrowly: one segment `cat >`/`>>`/`tee` to a literal path matching no guardrail, denyPaths or askPaths, quoted delimiter, nothing after the terminator. Only then is the body left out of the guardrail regex; it is still tested for SECRET (:9) and deployPatterns. Anything else falls back to the current whole-line test.
- **Strip quoted literals.** Rejected: tests/hooks.test.mjs:182 must still deny.
- **`git commit -m "$(cat <<'EOF' ...)"`.** Fails `single` (:102), so isGitRecord (:104) misses it. Exempt that exact shape with a quoted delimiter.
- **Tests.** Replay the three 22 Oct commands verbatim, plus deny rows for every hole named above. Add golden eval `25-guard-judges-each-segment` (evals/run.mjs:51-53).

## Do not

Strip quoted text; anchor at `^`; parse heredocs in general; widen read verbs beyond the list.

## Stays human

Accepting this proposal, merging the PR that changes the guard, any change to denyPaths, askPaths or protectedBranches, and accepting any security finding the safe AI SDLC expert raises on the diff.

*Not verified:* the sceptics' bypass cases were not run against the hook.
