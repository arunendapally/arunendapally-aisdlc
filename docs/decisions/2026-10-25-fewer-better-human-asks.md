# Council: fewer, better human asks

*2026-10-25. Chaired by the CTO agent. A proposal: it changes nothing until a human accepts it. No gate is passed by this record.*

The question: how does the plugin stop people approving questions, specs, reviews and merges without reading them (approval fatigue), and make the person own a strong intent instead of handing a weak one to the AI? Today a light-lane feature asks about five times: 3 to 7 product-owner questions, each with a recommended answer that can be accepted wholesale (agents/product-owner.md:12), then spec, PR review, merge and release. The request a person approves prints only owner, deadline and artefact path (scripts/sdlc.mjs:280). Five experts answered; a sceptic checked each claim against the code. The prior record docs/decisions/2026-10-25-agile-with-agents.md is on branch claude/agile-council and was not read.

Constraints held: humans own every gate; every merge needs a person (ADR-0005, scripts/lib.mjs:140); the waits from ADR-0003 stay at 3 for a feature and 1 for a bug (docs/adr/0003-simple-default-path.md:21); a step that would not catch a real failure is ceremony (ADR-0004).

## What each expert proposed

| Expert | Main proposals | Sceptic |
|---|---|---|
| Product owner | Human-typed intent in 3 parts, "drop if" holds a number; no recommended answer on intent, taste or risk; outcome target equals the drop number; approval shows intent and unmapped requirements; retro signals; no ask budget, no risk-shortened reads | Intent: new, number check gameable. Target match: no parseable format. Approval claim cited the wrong line (the Not verified heading is enforced at Verify, scripts/lib.mjs:17,26). Retro thresholds invented |
| UX designer | Intent typed in the first message, so no new wait; at most 3 questions tagged intent, taste, risk; others become [unconfirmed]; request fails unless Intent, Differs, Not verified, Risk lines print; high-risk approve note cites file:line | Tagging and [unconfirmed] supported (scripts/facts.mjs:79-86). Printed-lines check impossible: a script cannot see chat; Differs has no data; risk tier only exists at stage 5 (scripts/sdlc.mjs:258). Citation gameable |
| Agentic AI expert | Intent "change / smallest / drop if"; drop recommendations on intent, taste, risk; "## Against the intent" heading via missingHeadings (scripts/hooks/user-prompt.mjs:137); fast approvals earn no trust; metrics for long clean runs; outcome needs a result against "drop if" | Heading checks form, not substance, and the AI fills it. Open-questions check already exists (scripts/facts.mjs:84-86). Outcome note feasible (scripts/sdlc.mjs:407-418) but a perfunctory note passes |
| Tech lead | Intent before the PRD, pre-tool refuses prd.md without it; accepted recommendations recorded [unconfirmed]; tags; "## Against intent"; fast-approval share per gate | "Fast approvals earn no trust" is wrong for merges: every stage-5 key is in neverTrust (scripts/lib.mjs:140, :364, scripts/hooks/user-prompt.mjs:47). pre-tool gates only plan.md and tasks.md today (scripts/hooks/pre-tool.mjs:142-145) |
| Safe AI SDLC expert | The real failure is a rubber stamp becoming evidence. Intent recorded by the hook with who and when; wholesale acceptance recorded as "(recommended, accepted)" [unconfirmed]; audit fast approvals; summary from script data only; signals per gate, never per person | Acceptance marker and per-gate signals supported. Elapsed time is a weak proxy for reading. Identity is git user.name, self-set (scripts/hooks/user-prompt.mjs:32) |

## Where they agreed

- The intent must be typed by a person and recorded by the hook, never drafted by an agent. The hook only fires on what a human typed (scripts/hooks/user-prompt.mjs:1-2).
- No new human wait, and no ask budget that could stop a risk question.
- No reads shortened by risk before ADR-0005's evidence exists.
- Anything shown at approval must come from data the scripts hold, not text the agent writes about itself.
- Rubber-stamp signals are for the retro, per gate (lane:stage), never a mark against a person. The failure is already a known trap (templates/repo/standards/traps.md:34).
- No LLM judge of vagueness.

## Contested points and rulings

**1. How strict the intent check is.** PO: "drop if" must hold a number. UX and agentic: 6+ words per part. Safe: who and when.
*Ruling:* refuse only an empty or missing part; no word count, no number rule. *Why:* both are gamed with filler in seconds, so they catch nothing (ADR-0004). The check that can fail is that a person typed it, which an agent cannot fake.

**2. Where intent is enforced.** Tech lead: pre-tool refuses prd.md. Others: `request` at stage 1 refuses.
*Ruling:* both, and the spec is below. *Why:* refusing only at request lets the agent draft the whole PRD first, which is the "weak intent, AI fills it" failure. Refusing the write puts the person's thinking first at no extra wait, because the intent is the first message.

**3. Approval summary.** UX and agentic: request fails unless the agent prints Intent, Differs, Not verified, Risk lines, or writes "## Against the intent".
*Ruling:* rejected as worded. Instead the request script itself prints what it holds: the intent verbatim, the unconfirmed assumption ids (stage 1), and at stage 5 the risk tier, the reviewed file count and the PR body's Not verified section. No "Differs" line. *Why:* a script cannot check chat, and a heading the AI fills is self-attestation. The person judges what differs; we put their own words next to the artefact so they can.

**4. Fast approvals earn no trust.** Agentic, safe, UX for; tech lead sceptic found it wrong.
*Ruling:* dropped for merges and releases, which are never trusted already (scripts/lib.mjs:140). Deferred for other gates until retro data gives a floor. Keep only the audit fact: elapsed time from requestedAt to approvedAt (scripts/hooks/user-prompt.mjs:146). *Why:* a rule with no effect is ceremony; a floor nobody measured is a guess.

**5. Retro thresholds.** PO: under 1 minute per 100 lines, runs of 5+. Agentic: runs of 10+.
*Ruling:* report the raw distribution per gate (time to approve, runs with no rejection and no H rows); no thresholds yet. *Why:* the numbers were invented. Pick them after a month of data, by a human.

**6. Outcome against "drop if".** Agentic: outcome cannot close without a result note.
*Ruling:* rejected as a requirement. `sdlc outcome` prints the "drop if" text when it runs. *Why:* a required note passes when perfunctory; showing the person their own bar costs nothing.

**7. High-risk approve note must cite file:line.** UX, agentic.
*Ruling:* rejected. *Why:* gameable string, and reviewedFiles hold filenames only (scripts/sdlc.mjs:268).

**8. Outcome target must equal the drop number.** PO.
*Ruling:* rejected. *Why:* the PRD has no parseable metric format; it would be a new format to police one number.

## Ideas (a) to (f)

| Idea | Ruling |
|---|---|
| (a) human-typed intent | **Change.** Accept, with the spec below; empty-part check only. |
| (b) ask only what only a person can answer | **Change.** Accept as a product-owner rule: questions only on intent, taste or risk, with no recommended answer on those; reversible choices decided and recorded as [unconfirmed] assumptions, which the existing Plan check forces into Open questions (scripts/facts.mjs:84-86). A wholesale "go with your recommendations" is recorded "(recommended, accepted)" [unconfirmed]. Not enforced by a hook: the agent writes the tags. No hard cap. |
| (c) ask budget in status | **Reject.** The hook cannot count asks made in chat, and a budget can suppress a risk question. |
| (d) attention by risk | **Change.** No read is shortened. The stage-5 request leads with the risk tier ADR-0005 already computes, so the person knows where to look. |
| (e) claim against intent, differs, not verified | **Change.** Script-printed summary from held data only (ruling 3). No "Differs" line. |
| (f) rubber-stamp signals for retro | **Accept,** per gate only, raw numbers, no thresholds, never per person. |

## What must be specified before building (a)

- New hook verb `sdlc intent <slug> change: ...; smallest: ...; drop if: ...` in the regex at scripts/hooks/user-prompt.mjs:29. It creates the feature at stage 1 if absent (as hotfix does, scripts/hooks/user-prompt.mjs:56-63) or attaches to one still at stage 1; refused later.
- Stores `state.intent = { change, smallest, dropIf, by, at }`; audits it.
- scripts/hooks/pre-tool.mjs:142 also denies writing `prd.md` while `state.intent` is missing.
- `sdlc request` at stage 1 refuses without `state.intent`, and the PRD's `## Intent` section is written by the script from state, verbatim.
- Changing the intent after gate 1 is a new `sdlc intent`, which lapses gate 1 through the fingerprint (scripts/hooks/user-prompt.mjs:140).
- Bug and hotfix lanes are unchanged: the bug report and the incident text are already their intent.

## Do not

- Let an agent draft, suggest or pre-fill the intent.
- Add a human wait, an ask budget, or a word-count or number rule.
- Shorten any human read by risk before ADR-0005's evidence.
- Ask the agent to attest in a heading that it matched the intent.
- Mark or rank people by approval speed.

## What stays human

The intent text; every gate; every merge and release; the outcome call; the lane; the retro thresholds when they are set; and accepting this record.

## Not verified

None of this is built or tested. Whether people will type a three-part intent willingly, and whether elapsed time tracks reading at all, are unmeasured. Approver identity is still git user.name. The prior record on claude/agile-council was not read, so conflicts with it are unchecked.
