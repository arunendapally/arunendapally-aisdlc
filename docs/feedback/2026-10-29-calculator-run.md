# Feedback: building a scientific calculator through the AI SDLC, with no person at the gates

*Started 2026-10-29. Claude ran every role (product owner, architect, tech lead, builder, QA, release) on a .NET minimal API and a React front end, from an empty folder, using the plugin from branch `claude/autonomy`. The owner's brief: "I don't need a single human in loop." Each finding says what happened, why it matters, and what was done about it.*

## Before a line of code

**F-1. A new repo cannot be started by an agent.** The first step, pushing the initial commit to `main` of a fresh local origin, was refused ("Agents never push to main"). Right for an existing repo, wrong for an empty one: there is no PR to open against nothing. *Done:* the owner runs a one-time setup script. *Still open:* a bootstrap path (an empty origin has no `main` to protect).

**F-2. There was no way for a person to say "agents run this repo".** Every gate is hard-wired to a typed human approval. A calculator demo and a payments system hit the same walls. *Done:* `sdlc autonomy on <reason>`, typed by a person once per repo (or from their own terminal), recorded with who, when and why. Every gate then passes on its checks, recorded as "checks: autonomy granted by <name>". `sdlc merge <feature>` lands exactly the reviewed commit on `main`, fast-forward only. Only a person grants or revokes it; agents are refused the command, the flag file and the CLI form. The guards (secrets, force pushes, deploys, guardrail files) stay.

**F-3. The guard keeps refusing the agent for words, not actions.** In three days it refused me four times for commands that only searched for, or wrote test text containing, a human command or a guarded word ("paused", "sdlc approve"). Each refusal counts toward the denial cap and stops the session. v0.4.0 fixed shell segments; text inside a heredoc test file or a `grep` pattern still trips the human-verb patterns, which run on the whole command line. *Workaround:* write such text only with the Write and Edit tools.

**F-4. The hooks govern the session's folder, not the repo the work is in.** This session sits in the plugin repo and builds the calculator in `C:\Code\sci-calc`. The pre-tool hook resolves the repo from the session's working directory: writes to the calculator are outside it, so the write guards skip them, and branch checks look at the plugin repo's branch. The guard neither protects the calculator nor knows its autonomy. *Still open.*

**F-6. .NET (and Java) tests were invisible to the test matrix,** and the message blamed the file name, not the file type. *Fixed:* `*Tests.cs`, `*ApiTests.cs`, `*IntegrationTests.cs`, Java and Kotlin names recognised; a file that names a criterion but is not a known test file is called out.

**F-7. "Run the gate before any change" has nothing to run in a new repo.** The baseline is 0 and the first run is red by construction. *Still open:* say so in `build.md` for greenfield.

**F-8. Reading plugin state any way but `cat` is refused** (`node -e` on state.json). *Workaround:* `sdlc status --json` or the Read tool.

**F-9. In a new repo the proof says little:** the base commit has no code, so every test fails without the change by not compiling. *Still open:* mark the proof "greenfield" instead of claiming a dependency.

**F-10. The proof shares only the root `node_modules`;** a front end in a subfolder runs without dependencies. *Worked around* in the calculator's `tools/proof.mjs`. *Still open in the plugin.*

**F-11. The PR size limit counted tests, project boilerplate and plugin state,** and fired only at the end of Build after everything was written (979 lines; real code about 600). *Fixed:* tests, `.sln`, `.csproj`, `tsconfig`, launch and app settings, `.gitignore` and `.ai-sdlc/` are not counted, in the gate and the CI script. *Still open:* warn at Plan when a spec is bigger than one slice (agile change 3); the calculator had to be split after it was built.

**F-12. The guard read `appsettings.json` as Claude's `settings.json`,** so routine .NET work was refused. *Fixed:* the name must stand on its own.

**F-13. Under autonomy, messages still say "a person approves".** The spec-drift check worked (an edited spec went back to Plan and passed again on its checks), but its wording did not match the grant. *Still open.*

## Verify, run by a separate agent (findings F-15 to F-25, in full at `C:/Code/sci-calc/docs/process-findings.md`)

Verify took about 4 minutes and asked for three artefacts. The pre-review found a real blocker (no input length or nesting limit: one deeply nested request could overflow the stack) and fixed it with tests, and that fix took the PR from 292 to 305 counted lines, over the light lane's 300: the size check refused the review's own fix, and the feature stopped at Verify.

- **F-15. A broken proof command read as failing tests.** *Fixed:* the message says the command itself may be broken and how to check.
- **F-16. The review packet did not know .NET tests** ("13 code, 0 test"). *Fixed:* it uses the test matrix's patterns.
- **F-17. A scripts-only `package.json` change was flagged as a dependency.** *Fixed:* only added or changed dependencies count; `.csproj` PackageReference is now read.
- **F-18. The baseline stayed 0, so it protected nothing.** *Fixed:* it ratchets to the most tests the feature has passed.
- **F-19. The size check refused the pre-review's own fix, and showed the count only when refusing.** *Fixed:* once a PR's size passed at Build or Verify, review fixes get 20% room; the gate prints the PR size every run.
- **F-20. A refused request left no trace.** *Fixed:* `status` shows the last refusal and its reasons.
- **F-21. Under autonomy a refusal had nowhere to go.** *Fixed:* the message says to fix each reason and request again, and to log a wrong check for the retro, never to work around it.
- **F-22. Adding an acceptance example for a review fix sends the feature back to Plan.** By design (the spec changed); under autonomy it passes again on its checks, now as v2 with "Changes since v1". *Still open:* whether appending a scenario for an existing requirement should count as drift.
- **F-23. The ledger's Location goes stale once a fix moves the lines.** *Still open.*
- **F-24. The pr.md and release.md templates said a person approves.** *Fixed* in every template.
- **F-25. What worked:** the guard refused nothing in that run (after F-12), the proof ran in 7 seconds, the re-review list of changed files was exact, and the merge preconditions were right.

## Asked for during the run

- **Ask, don't make people paste commands** (the owner's top complaint). *Built:* `sdlc ask` and the answers hook; every command asks with the question tool. *Not verified live:* `claude -p` has no question tool, so the hook is tested against the documented answer shapes only. The first real gate question in a desktop session is the live check.
- **A v2 design after a late change request.** *Built:* revisions and "Changes since vN".
- **OKF for knowledge.** *Built:* knowledge pages are OKF v0.2, old pages still read.

**F-5. The repo rules contradict autonomy.** `templates/repo/.claude/rules/ai-sdlc.md` says "Only a human approves a gate" and "Never merge". With autonomy granted both are false. *Fixed:* the rules, the skill, verify.md and the request messages say what changes under autonomy (F-13 too).

Status of the earlier findings: F-1 *fixed* (first commit and first push of main to an empty remote); F-4 *fixed* (the guard judges the repo a write or a leading `cd` targets); F-6 *fixed*; F-7 and F-9 *open* (greenfield baseline and proof notes); F-8 *open* (reading state needs the CLI or the Read tool); F-10 *fixed* (every node_modules shared; a missing package is not red); F-11 *fixed* (only code counts; warn at Plan over 7 scenarios); F-12 *fixed*.
