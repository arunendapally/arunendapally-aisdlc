# Getting started with the AI SDLC plugin

From install to your first feature. You need Claude Code, Node 22, git and the GitHub CLI (`gh`) in the product repo you want to run it in. Sections 1 to 3 are all you need to start; section 6 sets it up for a team. The full process, and why it works the way it does, is in [org-ai-sdlc-process.md](org-ai-sdlc-process.md).

## 1. Install

```bash
claude plugin marketplace add arunendapally/arunendapally-aisdlc
```

```bash
claude plugin install ai-sdlc@arunendapally-aisdlc
```

Then start a new Claude Code session in your product repo, so the hooks load.

Optionally add the autopilot mod for the gate board above the prompt and the test-and-fix loop:

```bash
claude plugin install ai-sdlc-autopilot@arunendapally-aisdlc
```

**To update** to a new release, refresh the marketplace, update the plugin, and start a new session:

```bash
claude plugin marketplace update arunendapally-aisdlc
```

```bash
claude plugin update ai-sdlc@arunendapally-aisdlc
```

## 2. Four steps to your first feature

1. **Start the work.** In Claude Code, inside your product repo:

   ```
   /ai-sdlc:start add a saved-for-later list to the basket
   ```

   The first time, this copies the repo kit in (section 6 lists it) and never overwrites a file that already exists. Then it picks the lane and opens a feature branch.

2. **Set your gate command** in `.ai-sdlc/config.json`: the one command that runs your types, lint and tests, for example `"gateCommand": "npm run gate"`. Agents cannot edit this file, so you do it. Build refuses to pass without it.

3. **Say what it is for.** Before any spec is written, type your intent in the Claude Code prompt (not a terminal), in your own words:

   ```
   sdlc intent saved-items change: shoppers can come back to items they liked; smallest: a save button and a saved list; drop if: under 5% of shoppers save anything in two weeks
   ```

   Only you can type it; agents build to it and show it back to you at every approval.

4. **Answer and approve.** The agents ask their questions, write the spec, then build and test. You approve by typing in the prompt. The approval moves the feature on by itself:

   ```
   sdlc approve saved-items 1
   ```

   To send it back: `sdlc reject saved-items 1 the outcome metric has no baseline`.

That is all you need. The rest of this guide is reference.

## 3. What happens, stage by stage

A feature waits on you three times: the spec, the merge and the release. Agents cannot type the approvals for you; the hooks refuse it.

| Stage | You run | The agents produce | You decide |
|---|---|---|---|
| Start | `/ai-sdlc:start add a saved-items list` | The route and lane, a feature branch and `specs/saved-items/` | Your intent: `sdlc intent saved-items change: ...; smallest: ...; drop if: ...` |
| 1 Plan | `/ai-sdlc:plan saved-items` | Their questions first (you answer them), then a short `prd.md` and `acceptance.feature`: a Gherkin scenario per requirement | `sdlc approve saved-items 1` |
| 4 Build | `/ai-sdlc:build saved-items` | Tests first, then code from the builder, reviewed by the tech lead. Passes on checks | Nothing: no wait |
| 5 Verify | `/ai-sdlc:verify saved-items` | The test proof, the review packet, the findings ledger `review.md`, and a PR whose body says what was not verified | Review the PR from "Look here first", add what you find to `review.md` as H rows, then `sdlc approve saved-items 5` |
| 6 Release | `/ai-sdlc:release saved-items` | The rollout, a tested rollback, and probe results after you deploy | You merge and deploy; then `sdlc approve saved-items 6` |

**The full lane** adds stage 3 Design (`/ai-sdlc:design`: the plan, and an ADR with its review for each new datastore, dependency or service) and a fourth wait. Triage picks it for a migration that alters or drops data, a high-risk path, or a new component; you can also type `sdlc lane saved-items full` at any point before Verify.

When a gate refuses, `sdlc request` lists every reason, for example "R2 has no scenario". Ask the agent to fix them and request again. Warnings, such as a knowledge page the change made stale, do not block.

## 4. Smaller work

- **A bug:** `/ai-sdlc:bug fix-total-rounding`. One document. A failing test must reproduce it before the fix. The merge is your only gate. If it came from earlier work, the agent adds `--caused-by <feature>`.
- **A chore** (dependency bump, refactor, docs): `/ai-sdlc:task bump-express`. Your only gate is the merge.
- **Production is down:** you type `sdlc hotfix checkout-500 checkout returns 500 since 10:40`, then `/ai-sdlc:hotfix checkout-500`. It has a one-hour review deadline. A postmortem is due within two days (`/ai-sdlc:incident checkout-500`).
- **Learn an area:** `/ai-sdlc:learn the payments retry logic` writes source-backed pages in `knowledge/` and a self-check for a person becoming the expert.
- **A hard decision** (a guard, a gate, anything security-sensitive): ask Claude to run `/ai-sdlc:council` on the question. Experts review in parallel, a sceptic checks each review against the code, and the CTO writes a proposal to `docs/decisions/`. It takes a few minutes and costs a few dollars; it only advises, and you accept the proposal or not.
- **Not sure:** `/ai-sdlc:start <what you want>` triages it and picks the route.

## 5. Day to day

- **Where things stand:** `/ai-sdlc:status` lists each feature, its gate, who it waits on and for how long. With the mod, the band above the prompt shows the same. `/sdlc-board` opens the board, whose Approve button fills the prompt for you to send.
- **Let agents fix their own test failures:** `/sdlc-autopilot`. After each turn that edits files, the gate runs and the next fix starts automatically, up to the retry cap. Then it stops and notifies you.
- **Stop everything:** type `sdlc pause`; `sdlc resume` to continue.
- **Retire work that will not ship:** type `sdlc close <feature> <reason>`. It keeps its history and leaves the board. It is refused while a lesson is owed or a postmortem is open.
- **When review keeps going round:** after three refused Verify rounds the gate stops. Read what is going wrong, then type `sdlc reject <feature> 5 rethink: <the new approach>`.
- **Error budget spent:** type `sdlc freeze`. No new feature starts (`sdlc init` is refused); bug fixes, hotfixes and tasks carry on until `sdlc unfreeze`.
- **After a full-lane release:** the feature closes, and its outcome follow-up opens with the owner and read date from `release.md` (`## Outcome metric`, or `Metric: None, because ...`). Status shows OUTCOME DUE, then OVERDUE. An agent records `sdlc outcome <feature> met|missed|breach`; a breach alerts the incident commander, who decides whether to declare a hotfix. Add `"outcomeWindowDays": { "light": 7 }` to turn it on for the light lane.
- **When the retro is due early:** an escalation past the retry cap, or the same serious review finding in two features, shows RETRO DUE in `status`. Running the retro clears it.

## 6. Set it up for a team

The first `/ai-sdlc:start` copied this kit into your repo:

| Path | What it is |
|---|---|
| `CONSTITUTION.md` | The principles every stage checks against. Edit it to fit your product. |
| `.claude/rules/ai-sdlc.md` | The rules every agent follows in this repo |
| `.ai-sdlc/config.json` | Your settings. Agents cannot edit this folder. |
| `.ai-sdlc/autonomy.json` | Autonomy levels per activity |
| `knowledge/` | The agents' memory, one Markdown page per subject |
| `standards/` | Engineering and testing standards, the review checklist, the traps log |
| `.github/` | Workflows, PR template, CODEOWNERS, the ruleset |
| `docs/architecture/workspace.dsl` | The C4 model as code |

When more than one person uses it, or before the first release, a human does these once:

1. **Name who approves what**, by git user name. Leave a list empty to let anyone at the keyboard approve.
   - `"gateOwners": { "1": ["Product Lead"], "3": ["Architect"], "5": ["Tech Lead"] }`
   - `"trustOwners": ["CTO"]` for who may promote gates, if you turn earned trust on.
2. **Set your proof command**, so a feature's tests prove they depend on the change (ADR-0002). `sdlc proof` runs it twice on the test files that name the feature's criteria: on your branch, where they must pass, and on the base commit's code, where they must fail. `{files}` becomes the quoted test files. Examples: `"proofCommand": "npx jest {files}"`, `"pytest {files}"`, `"node --test {files}"`. To judge each criterion on its own, also write a JUnit report to `{report}`, for example `"npx jest {files} --reporters=jest-junit"` with `JEST_JUNIT_OUTPUT_FILE={report}`. Without it, Verify only warns and the PR must say under `## Not verified` that the proof did not run.
3. **Replace the teams** in `.github/CODEOWNERS` with your own.
4. **Turn on the GitHub ruleset.** This is the real enforcement; the hooks only fail sooner.

   ```bash
   gh api repos/OWNER/REPO/rulesets --method POST --input .github/rulesets/main.json
   ```

   For a one-person repo, first set `required_approving_review_count` to 0 and `require_code_owner_review` to false. GitHub does not let you approve your own pull request, so you would lock yourself out.
5. **Set the repo variable** `BACKUP_REVIEWERS` to a team handle. The hourly `review-sla` workflow mentions it on overdue reviews.
6. **Give agents a GitHub App or fine-grained token** with no admin or bypass rights.
7. **Expose your build id** so a release can be checked: a version endpoint, a meta tag, or your platform's read-only inspect command. Release records it as `Live: <sha>` and refuses unless it contains the reviewed change on `origin/main` and the previous release.

## 7. Optional steps

Off by default, so the default path stays short. Turn them on when the risk calls for them:

| Step | Turn it on with |
|---|---|
| Earned trust: bug and task merges that pass on checks after enough clean approvals | `"trust": true` in `.ai-sdlc/config.json`, then a trust owner types `sdlc trust bug 5` when it is READY |
| Flaky-test and leaked-data checks on every gate run | `"gateRepeats": 3` and `"dataCheckCommand"` (a script that fails when tests leave data behind) |
| The QA verdict, security results and extra review lenses | Automatic when the pre-review says `Risk: high` |
| The Design stage | `init <slug> --full`, or `sdlc lane <slug> full` |
| Facts pinned to the code | Automatic for `--kind brownfield` and `--kind data` |
| C4 changes, screens and accessibility checks | When the change adds a container or changes a screen |

## 8. Improve the process

- **Monthly**, run `/ai-sdlc:retro --since 30` (add `--repos` for your other repos). It turns what was recorded into at most three proposed plugin changes, each proven by an eval, as a PR for the platform owner to merge.
- **Before changing an agent or command**, run `npm run eval` and `npm run eval:agents` in the plugin repo; the golden tasks must not regress.

## 9. Troubleshooting

| Symptom | Why | What to do |
|---|---|---|
| `sdlc approve` records nothing | The `ai-sdlc` plugin is not installed in this session, the gate was never requested, or the command was not at the start of your message | Send it as a message of its own; install the plugin and start a new session; ask the agent to run `sdlc request <feature>` first |
| The chat does not record your command at all | The session has no plugin hooks, for example one started from another session | In your own terminal, run the same command through the CLI: `node <plugin>/scripts/sdlc.mjs approve <feature> <stage>` (also `intent`, `reject`, `close`, `lane`). Agents are refused this path |
| An `sdlc` command or a slash command is not recognised | The installed plugin is older than these docs | Update it (section 1) and start a new session |
| "No gateCommand" at Build | The gate command is not set | Set `gateCommand` in `.ai-sdlc/config.json` (section 2) |
| "is not an owner of gate N" | `gateOwners` lists other names | Approve as a listed owner, or change the config |
| An edit or command is refused with "[ai-sdlc]" | A guardrail: protected branch, secrets, a deploy, a guardrail file, or code before Build | Read the reason; humans run deploys and merges |
| "is not on origin/main" or "Live:" at Release | The change was deployed from a branch, or the running build is not this release | Merge and push, deploy from main, read the build id again |
| "has lapsed" when you approve | The change moved after the agent requested the gate | Ask the agent to request it again, and look at what changed |
| "Refused 2 times this session: hand back" | A guard refused the same step twice | Read the reason; run the step yourself if it is right, then reply so the session can act again |
| "in slices" when reading a file | The file is large | Read the code that governs it first, then the file with an offset and limit |
| "has changed since gate 1 (or 3) was approved" | The spec (`prd.md`, `acceptance.feature`) or the plan (`plan.md`) changed after you approved it | Read what changed, then approve that gate again; the feature carries on from there |
| "lives on feature/x, but ... is checked out" | The command was run for one feature on another feature's branch | `git switch` to the branch it names, then run it again |
| "needs the full lane" at Build | The light lane is for additive, low-risk work, and this change alters or drops data or touches a high-risk path | Type `sdlc lane <feature> full`; it goes back to Design |
| The Swagger page is blank | The contract changed since the viewer was written, or you are offline | Run `sdlc api <feature>` again; the page loads Swagger UI from the internet |
| The band shows a feature you do not recognise | A feature folder under `specs/` from earlier work | Press Hide, or finish or close that feature |
