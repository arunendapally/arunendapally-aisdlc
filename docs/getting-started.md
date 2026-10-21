# Getting started with the AI SDLC plugin

From install to your first feature in production. You need Claude Code, Node 22, git and the GitHub CLI (`gh`) in the product repo you want to run it in. The full process, and why it works the way it does, is in [org-ai-sdlc-process.md](org-ai-sdlc-process.md).

## 1. Install

```bash
claude plugin marketplace add arunendapally/arunendapally-aisdlc
```

```bash
claude plugin install ai-sdlc@arunendapally-aisdlc
```

The `ai-sdlc` plugin brings the agents, commands, hooks and templates. Optionally add the autopilot mod for the gate board, the per-turn stage rules and the test-and-fix loop:

```bash
claude plugin install ai-sdlc-autopilot@arunendapally-aisdlc
```

Start a new Claude Code session in your product repo afterwards, so the hooks load.

## 2. Set up the repo (once)

In Claude Code, inside your product repo, start any piece of work:

```
/ai-sdlc:start add a saved-for-later list to the basket
```

The first kickoff copies the repo kit in, and never overwrites a file that already exists:

| Path | What it is |
|---|---|
| `CONSTITUTION.md` | The principles every stage checks against. Edit it to fit your product. |
| `.claude/rules/ai-sdlc.md` | The rules every agent follows in this repo |
| `.ai-sdlc/config.json` | Your settings (next step). Agents cannot edit this folder. |
| `.ai-sdlc/autonomy.json` | Autonomy levels per activity |
| `knowledge/` | The agents' memory, one Markdown page per subject |
| `standards/` | Engineering and testing standards, the review checklist, the traps log |
| `.github/` | Workflows, PR template, CODEOWNERS, the ruleset |
| `docs/architecture/workspace.dsl` | The C4 model as code |

Then, as a human:

1. **Set your gate command** in `.ai-sdlc/config.json`. This is the one command that runs your whole gate: types, lint, every test level, scans. Example: `"gateCommand": "npm run gate"`. Gates at Build and Verify refuse to pass without it.
2. **Name who approves what**, by git user name. Leave a list empty to let anyone at the keyboard approve.
   - `"gateOwners": { "1": ["Product Lead"], "3": ["Architect"], "5": ["Tech Lead"] }`
   - `"trustOwners": ["CTO"]` for who may promote gates.
3. **Optionally**, add `"dataCheckCommand"` (a script that fails when tests leave data behind) and `"gateRepeats": 3` (to catch flaky tests on every gate run).
4. **Replace the teams** in `.github/CODEOWNERS` with your own.
5. **Turn on the GitHub ruleset.** This is the real enforcement; the hooks only fail sooner.

   ```bash
   gh api repos/OWNER/REPO/rulesets --method POST --input .github/rulesets/main.json
   ```

   For a one-person repo, first set `required_approving_review_count` to 0 and `require_code_owner_review` to false. GitHub does not let you approve your own pull request, so you would lock yourself out.
6. **Set the repo variable** `BACKUP_REVIEWERS` to a team handle. The hourly `review-sla` workflow mentions it on overdue reviews.
7. **Give agents a GitHub App or fine-grained token** with no admin or bypass rights.

## 3. Your first feature, start to finish

Each stage has a command an agent runs, and ends at a gate that waits for a named human. You approve or reject by typing in the Claude Code prompt. Agents cannot type these for you; the hooks refuse it.

```
sdlc approve saved-items 1
sdlc reject saved-items 1 the outcome metric has no baseline
```

| Stage | You run | The agents produce | You decide |
|---|---|---|---|
| 1 Plan | `/ai-sdlc:plan saved-items` | Its questions first (you answer them), then `prd.md`: graded evidence, assumptions marked confirmed or unconfirmed, numbered requirements R1, R2 ... | `sdlc approve saved-items 1` |
| 2 Analyze | `/ai-sdlc:analyze saved-items` | `facts.md` pinned to your code, `acceptance.feature` in Gherkin covering every requirement, the spec with threat model and SLOs | `sdlc approve saved-items 2`, and `sdlc lane saved-items light` if it is small and reversible |
| 3 Design | `/ai-sdlc:design saved-items` and `/ai-sdlc:design-review saved-items` | Plan, ADRs, C4 changes, an ER diagram for data work, `openapi.yaml` for API work, and a board record where three disciplines question each decision | `sdlc approve saved-items 3` |
| 4 Build | `/ai-sdlc:build saved-items` and `/ai-sdlc:tests saved-items` | Code from a cheaper builder reviewed by the tech lead, and tests at each scenario's level with their own data setup and teardown | `sdlc approve saved-items 4` |
| 5 Verify | `/ai-sdlc:verify saved-items` (it runs the pre-review) | The review packet, the findings ledger `review.md`, and a PR whose body says what was not verified | Review the PR on GitHub, starting from "Look here first". Add what you find to `review.md` as H rows. Then `sdlc approve saved-items 5`. |
| 6 Release | `/ai-sdlc:release saved-items` | The release order, rollout, a tested rollback, and probe results after you deploy | You merge and deploy; then `sdlc approve saved-items 6` |

When a gate refuses, `sdlc request` lists every reason, for example "R2 has no scenario" or "the review packet was built at an older commit". Ask the agent to fix them and request again.

## 4. Smaller work

- **A bug:** `/ai-sdlc:bug fix-total-rounding`. One document. A failing test must reproduce it before the fix. The merge is your only gate. If it came from earlier work, the agent adds `--caused-by <feature>`.
- **A chore** (dependency bump, refactor, docs): `/ai-sdlc:task bump-express`. Your only gate is the merge.
- **Production is down:** you type `sdlc hotfix checkout-500 checkout returns 500 since 10:40`, then `/ai-sdlc:hotfix checkout-500`. It has a one-hour review deadline. A postmortem is due within two days (`/ai-sdlc:incident checkout-500`).
- **Learn an area:** `/ai-sdlc:learn the payments retry logic` writes source-backed pages in `knowledge/` and a self-check for a person becoming the expert.
- **Not sure:** `/ai-sdlc:start <what you want>` triages it and picks the route.

## 5. Day to day

- **Where things stand:** `/ai-sdlc:status` lists each feature, its gate, who it waits on and for how long. With the mod, the band above the prompt shows the same. `/sdlc-board` opens the board, whose Approve button fills the prompt for you to send.
- **Let agents fix their own test failures:** `/sdlc-autopilot`. After each turn that edits files, the gate runs and the next fix starts automatically, up to the retry cap. Then it stops and notifies you.
- **Stop everything:** type `sdlc pause`; `sdlc resume` to continue.
- **Error budget spent:** type `sdlc freeze`. The light lane closes and earned promotions are suspended until `sdlc unfreeze`.
- **Give agents more autonomy:** after enough clean approvals, `sdlc trust` (run by an agent) shows which gates are READY, and a trust owner types `sdlc trust bug 5`. Any rejection or escaped bug takes it back.

## 6. Improve the process

- **Monthly**, run `/ai-sdlc:retro --since 30` (add `--repos` for your other repos). It turns what was recorded into at most three proposed plugin changes, each proven by an eval, as a PR for the platform owner to merge.
- **Before changing an agent or command**, run `npm run eval` and `npm run eval:agents` in the plugin repo; the golden tasks must not regress.

## 7. Troubleshooting

| Symptom | Why | What to do |
|---|---|---|
| `sdlc approve` records nothing | The `ai-sdlc` plugin is not installed in this session, or the gate was never requested | Install the plugin and start a new session; ask the agent to run `sdlc request <feature>` first |
| "is not an owner of gate N" | `gateOwners` lists other names | Approve as a listed owner, or change the config |
| An edit or command is refused with "[ai-sdlc]" | A guardrail: protected branch, secrets, a deploy, a guardrail file, or code before Build | Read the reason; humans run deploys and merges |
| "the review packet was built at ..., not HEAD" | Commits landed after the packet | Ask the agent to run `sdlc review <feature>` again |
| The Swagger page is blank | The contract changed since the viewer was written, or you are offline | Run `sdlc api <feature>` again; the page loads Swagger UI from the internet |
| The band shows a feature you do not recognise | A feature folder under `specs/` from earlier work | Press Hide, or finish or close that feature |
