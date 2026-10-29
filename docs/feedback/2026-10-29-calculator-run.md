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

**F-5. The repo rules contradict autonomy.** `templates/repo/.claude/rules/ai-sdlc.md` says "Only a human approves a gate" and "Never merge". With autonomy granted both are false. *To fix:* the rules say what changes under autonomy.
