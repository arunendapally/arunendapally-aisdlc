# Council: confirm the intent without retyping a template

*2026-10-27. Chaired by the CTO agent. Accepted by the owner on 27 Oct, including the amendment to docs/decisions/2026-10-25-fewer-better-human-asks.md line 76. Rulings 2 to 5 and 7 are built in the PR that adds this record.*

**Checked after the council, 27 Oct.** In a scratch repo with a UserPromptSubmit hook that logged every prompt: a parent session's prompt to its subagent does not fire the hook; a subagent's report back to the parent does, as a prompt in the parent's session wrapped in `<agent-message>`, with no agent id. That answers the open question below. It found a hole in the then-open PR #18, which stripped any leading tag block: a report with a quoted closing tag followed by a human command would have been recorded. PR #18 now ignores any prompt that starts with `<agent-message`, so it records nothing and no longer releases a held session.

The question (GitHub issue #14, and the "yes/no instead of templates" part of #15): may the agent summarise the person's intent from the chat and record it on a plain "yes", instead of the person typing `sdlc intent <feature> change: ...; smallest: ...; drop if: ...`? If so, what may the person type, and how does the hook tell a person's confirmation from an agent's? Out of scope, fixed separately: the context-block prefix (now stripped in the uncommitted scripts/hooks/user-prompt.mjs:13), a terminal path for human verbs, quoted gh bodies tripping the Bash guard.

Constraints held: humans own every gate; a step that would not catch a real failure is ceremony (ADR-0004); the hook can only trust what arrived in the current prompt. Line numbers below are from the working tree, which has uncommitted hook edits.

## What each expert proposed

| Expert | Main proposals | Sceptic |
|---|---|---|
| Product owner | Confirm only on `sdlc intent <f> yes`; agent writes intent-proposal.md, hook refuses unless each part is a substring of a prompt logged this session; record source typed or quoted; keep typed form | A "yes" command is still a typed command. Nothing logs prompts today; a log stores raw prompts (secrets); substring accepts fragments; agent picks the fragments. Source field and clearer denial at scripts/hooks/pre-tool.mjs:193-197 supported |
| UX designer | Option (b): `sdlc intent <f> yes <code>`, 4-char hash of specs/<f>/intent.proposed.md; "drop if" typed in the same prompt; PRD must not say "Typed by" (scripts/lib.mjs:268); echo all parts; confirm form first in docs | The agent can compute the code; the person reads chat, not the file; specs/ is unguarded; it reverses the 25 Oct "do not draft" rule. Honest PRD comment supported. Echo already exists (scripts/hooks/user-prompt.mjs:98, scripts/sdlc.mjs:308). Confirm-first makes the agent draft the default |
| Safe AI SDLC expert | Option (a). Parts over several messages, merged at stage 1, each with by/at; agent names missing labels, never fills one; person vs agent is the prompt channel plus Bash denial (scripts/lib.mjs:100) and .ai-sdlc denyPaths (scripts/lib.mjs:94); no plain-reply gate approvals | Today the hook overwrites state.intent wholesale (scripts/hooks/user-prompt.mjs:95), so merge is new. Labels are unanchored: "exchange:" matches "change:" (scripts/lib.mjs:262). Whether the hook fires on agent-to-agent prompts is unchecked |
| Agentic AI expert | Option (a). "yes" or "ok" records nothing, with a mutation test; "drop:" counts as "drop if:"; refusal names missing labels only; optional transcript check refusing agent text; obvious calls recorded [unconfirmed] | Any order and separate lines already work (scripts/lib.mjs:262). Defects: unanchored labels, no ";" inside a part, continuation lines dropped. Transcript check refuses a person who copies the summary, is beaten by rewording, and contradicts the 25 Oct rule. No plain-reply approvals exist to keep |
| Tech lead | `sdlc intent <f> yes` records specs/<f>/intent.proposed.md as on disk; typed parts override; source typed or confirmed; request prints "proposed by agent, confirmed by X"; no hash needed because a new intent lapses gate 1 | Wrong: the gate-1 fingerprint (scripts/loop.mjs:347-349) is taken at request time, so an edit before the request lapses nothing. The agent writes the file freely. No source data exists yet |

## Where they agreed

- A plain "yes" in chat records nothing: no intent, no gate. All five.
- The agent cannot record an intent. Only a prompt that starts with `sdlc intent` does (scripts/hooks/user-prompt.mjs:32); agent shell commands with the verb are denied (scripts/lib.mjs:100) and state files are deny paths (scripts/lib.mjs:94).
- A refusal names the missing labels and suggests no words.
- The record must not claim more than the hook knows.
- Obvious, reversible calls are the product owner's to make and state, not a hook's.

## Contested points and rulings

**1. How the person confirms.** (c) plain "yes": nobody. (b) proposal file plus yes or hash: UX, tech lead. (d) verbatim from a prompt log: product owner. (a) the person sends the command: safe, agentic.
*Ruling:* (a). *Why:* the hook cannot see chat, so (b), (c) and (d) all record agent-authored text on a word that carries no content. The hash guards an accident, not a dishonest agent that writes it. The prompt log adds stored raw prompts for a check an agent passes by choosing fragments. A check that cannot fail is ceremony.

**2. May the agent restate the intent so the person can paste it?** The 25 Oct record says the agent never drafts, suggests or pre-fills it (line 76).
*Ruling:* amend line 76. After the person has said their intent in chat, the agent may restate it once in the command form, in the person's own words, with only the parts the person said. A part they did not say is left out and named as missing; the agent never fills it, and asks for "drop if" as an open question with no suggested answer. The person sends it, pasted or edited, as their own message. *Why, honestly:* this is still agent-arranged text. The hook records what the person sent, not who composed it, and it never could tell typing from pasting. The check that can fail is "a person sent this", not "a person typed this". The relief is real (no retyping what they just said), and the late catches stay: the hook echoes the parts (scripts/hooks/user-prompt.mjs:98) and the stage-1 request prints them (scripts/sdlc.mjs:308). Whether a restatement is faithful is not enforced.

**3. Parts over several messages.** Safe: merge at stage 1. Sceptic: new code.
*Ruling:* accept, stage 1 only. A prompt with some labels sets or replaces only those parts; `by` and `at` are the last sender; the audit row lists which parts each message set. prd.md (scripts/hooks/pre-tool.mjs:197) and the stage-1 request (scripts/sdlc.mjs:203) still need all three. *Why:* fixing one part should not mean retyping three, and the gate still refuses an incomplete intent.

**4. Parser.** Agentic: "drop:" too. Sceptic: anchoring and ";" defects.
*Ruling:* a label counts only at the start of the text, a line, or after ";". A part runs to the next label or the end, so ";" and continuation lines inside a part are kept. "drop:" counts as "drop if:". No other aliases. *Why:* fixes real silent truncation and false matches at a few lines of code.

**5. Source field (typed, quoted, confirmed).** PO, UX, tech lead for.
*Ruling:* no field. Change the PRD comment at scripts/lib.mjs:268 from "Typed by" to "Sent by". *Why:* there is no confirm path, and the hook cannot tell typed from pasted, so any source value would overclaim.

**6. Transcript check (agentic 4) and "drop if typed in the same prompt" (UX 2).** *Ruling:* reject both as hook rules. *Why:* the first refuses honest copying and is beaten by rewording; the second cannot be checked. The "never fill drop if" convention in ruling 2 covers the intent.

**7. #15 "obvious calls made and stated".** *Ruling:* accept as a product-owner rule, as the 25 Oct idea (b) already says: the agent makes reversible calls, states each in one line in chat, and records it as an [unconfirmed] assumption, which the Plan check forces into Open questions (scripts/facts.mjs:79-86). Yes/no questions are fine for taste and reversible choices, not for intent parts. Note: agents/product-owner.md:13 still asks for a recommended answer on every question, so the 25 Oct rule is not yet in the prompt.

**8. #15 "plain reply for risky gates".** *Ruling:* reject. *Why:* a "yes" names no feature, stage or content, so it cannot bind to the fingerprint the approval keys on (scripts/loop.mjs:349), and the hook cannot tell which question it answers. Approval stays `sdlc approve <f> <n>` at the start of a message.

**9. Docs show the confirm form first (UX 5).** *Ruling:* reject. Docs say: explain it in your words, then send the command, typed or pasted.

## The two questions, answered

- **What may the person type?** A message of their own that starts `sdlc intent <feature>` followed by one or more of `change:`, `smallest:`, `drop if:` (or `drop:`), typed, pasted or edited. "yes", "ok" or `sdlc intent <f> yes` record nothing and are refused with the missing labels; a test proves it.
- **How does the hook tell a person from an agent?** Only by channel: it acts on the UserPromptSubmit prompt (scripts/hooks/user-prompt.mjs:9-13,32), and the agent's other channels are denied (scripts/lib.mjs:94,100). It does not know who composed the words. Unchecked: whether UserPromptSubmit fires on prompts one agent sends another (subagent or teammate messages). If it does, an agent could record an intent, and approvals have the same hole today. Check this in a scratch repo before building.

## Do not

- Record anything on a plain "yes", a code, or a proposal file.
- Let the agent fill a part the person did not say, or suggest a "drop if".
- Store raw prompts, or compare against the transcript.
- Add a source field the hook cannot back.
- Accept plain replies at any gate.

## What stays human

Sending the intent; every gate, merge and release; the lane for this change (it touches the human-verb parser, so the CTO advises a safe AI SDLC review); and accepting this record, including the amendment to the 25 Oct line 76.

## Not verified

Nothing here is built or tested. Whether UserPromptSubmit fires on agent-to-agent prompts. Whether people paste faithfully or the agent restates faithfully; nothing enforces it. Whether paste relieves the friction in #14; issues #14 and #15 were read only through the brief, not on GitHub. The context-block stripping at scripts/hooks/user-prompt.mjs:13 is uncommitted. Approver identity is still git user.name (scripts/hooks/user-prompt.mjs:43). The process doc and constitution were not reread for this record.
