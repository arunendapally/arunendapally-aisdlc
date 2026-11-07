# PRD: <feature>

<!-- Define. Owner: product-owner agent. Gate: the product lead, asked with "sdlc ask <feature>"; under autonomy it passes on its checks.
     One approval covers this PRD and acceptance.feature; the approver judges it in two minutes.
     Requirements, not solutions: what people and the business need, and why, in words a user would
     recognise. A requirement stays true whatever we build; if it would change under a different design,
     it is design. No code, files, modules, APIs, tables, fields, frameworks, hosting or deploy mechanics:
     those go in the design (design.md, openapi.yaml, or "## Approach" in tasks.md in the light lane). A
     solution a person has already chosen goes in "## Constraints", with who chose it.
     A required section with only a comment in it is empty, and the gate refuses it. Keep every "## " heading
     exactly as written; never start a line with "# " or "## " inside a section.
     Or: None, because <a reason about this feature>, where a section does not apply. Every claim names its
     source (a person, a Q<n>, a fact F<n>) or is an assumption marked [unconfirmed]. Write ids plain
     ("- A1:", "- Q1:", "- R1."): "**A1**" hides the line from the gate. Link documents; do not copy them. -->

## Intent

<!-- The person's own words: "sdlc request" writes them here; do not reword them. Under autonomy only, you write the three lines. Example:
- Change: shoppers can keep items they are not ready to buy
- Smallest: one saved list per signed-in shopper
- Drop if: fewer than 2% of shoppers save anything in the first month -->

## Problem

<!-- At most three sentences: who has it, how often, what it costs them today, each number sourced. Example:
Returning shoppers lose items they meant to buy later: 18% of support chats in 2026-Q3 asked to find an
item seen before (support dashboard 2026-Q3, read by Sam, support lead). Today they search again or give up.
     Not: "Users want a better saving experience." (no who, no how often, no cost, no source) -->

## Users and jobs

<!-- At most four: "- <user>: when <situation>, I want <motivation>, so I can <outcome>." Example:
- Returning shopper: when I see an item I am not ready to buy, I want to keep it, so I can find it next week without searching. -->

## Questions asked

<!-- Only questions a wrong guess would make costly: a decision that cannot be undone, a conflict with
     existing docs, a fork that would redo most of the work. Everything else is an assumption below. Example:
- Q1: Must a shopper be signed in to save? A: Yes; guests get no saved list. (Priya, product lead)
- Q2: How long do saved items last? A: 90 days (recommended, accepted). (Priya)
- Q3: Which regions launch first? unanswered
     Or: None, because no wrong guess here is costly. -->

## Constraints

<!-- Optional. Solutions a person imposed before the requirements, each with who decided; the design follows
     them and no requirement repeats them. Example:
- Works on the existing web shop pages; no new app. (Priya, product lead)
- Uses the existing sign-in, unchanged. (Sam, security)
     Or delete this section when nobody imposed one. -->

## Assumptions

<!-- Everything you believe but did not ask or check. The tag goes last, bare. [confirmed] needs a
     person's answer (Q<n>) or a fact (F<n>); an accepted recommendation stays [unconfirmed]. Example:
- A1: 99% of shoppers save fewer than 200 items. [unconfirmed]
- A2: 90 days is long enough to come back for an item (Q2). [unconfirmed]
- A3: We know an item has sold out within one minute of it happening. [confirmed: F2] -->

## Requirements

<!-- One behaviour a user or the business can observe per line, each provable by one Gherkin scenario with real values:
     "- R<n>. (must|should|could) <who> <does or sees what>, <within which limit>. Needs: <what the product must
     already know, in plain words> (F<n> when a fact shows it exists today)."
     "Needs" catches the requirement that rests on information nobody records; name the information, not the field.
     Example:
- R1. (must) A signed-in shopper can save an in-stock item to their saved list. Needs: who the shopper is.
- R2. (should) A saved item that sells out shows as unavailable within 5 minutes. Needs: whether each item is in stock (F2).
- R3. (must) A shopper with 200 saved items sees the whole list within half a second. Needs: nothing new.
- R4. (must) Saving a 201st item is refused with "Your saved list is full (200 items)". Needs: how many items are saved.
- R5. (must) Only the signed-in shopper can see or change their saved list. Needs: who the shopper is.
- R6. (should) An item saved more than 90 days ago leaves the saved list (Q2). Needs: when each item was saved.
- R7. (must) A keyboard-only shopper can save an item and open the saved list. Needs: nothing new.
     Split any line joined by "and"; "fast", "easy", "secure" and "support X" are not requirements.
     Not: "POST /saved returns 201", "a saved_items table", "a meta tag carries the commit sha". Say what the
     person sees or can rely on; the design says how.
     must: release is blocked without it. More than 7 requirements usually means two slices. -->

## Non-functional requirements

<!-- Each line names the requirement above that states the need, or "None, because <reason specific to
     this feature>". Limits include input size: longest text, deepest nesting, most items, most calls a minute.
     Naming auth, payments or personal data under Security needs the full lane: write it as an R<n>. Example:
- Performance: R3
- Security and privacy: R5
- Accessibility: R7
- Limits and quotas: R4 -->

- Performance:
- Security and privacy:
- Accessibility:
- Limits and quotas:

## Never

<!-- What the product must never claim or do, each one a reviewer could catch in copy or code. Example:
- Never say an item is "reserved" when it is only saved.
- Never email a shopper about a saved item unless they asked to be told. -->

## Out of scope

<!-- What someone could reasonably expect that this does not do, and where it goes instead. Example:
- Sharing a saved list: a later slice, save-share (specs/saved-items/slices.md).
- Saved lists for guests: not planned (Q1).
- Support staff seeing a shopper's saved list: a later slice, after a privacy review. -->

## Outcome metric

<!-- One metric of value to users or the business, read after the lane's window (see release.md); release.md
     copies Metric and Owner. Uptime and error rates are release probes, not outcomes. Example:
Metric: share of saved items bought within 14 days of saving
Baseline: none today (no saved list); the first read sets it
Target: 8%
Owner: Priya, product lead
Objective: grow repeat purchases (2026-Q4 KR2)
     Or: Metric: None, because <reason>. -->

## Open questions

<!-- Every [unconfirmed] assumption and unanswered question: who settles it, and your recommendation. Example:
- A1: who: Sam, data team. Recommend: cap at 200 (R4) and log list sizes.
- A2: who: Priya. Recommend: 90 days, then read how old bought items were.
- Q3: who: Priya. Recommend: UK first; the region does not change the design.
     Or: None, because every assumption is confirmed and every question answered. -->

<!-- Optional "## Dependencies": another team, service or vendor that must act first (who, what, by when).
     Each kind adds its section (Current system, API changes, Performance budget): say what changes for the people
     and systems that depend on it, and cite facts; the technical detail goes in the design. -->
