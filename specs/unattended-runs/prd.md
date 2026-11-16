# PRD: unattended-runs

## Intent

<!-- Typed by Arun Endapally on 2026-11-12. Only a person changes it: sdlc intent <feature> change: ...; smallest: ...; drop if: ... -->

- Change: Less human intervention
- Smallest: Top four findings fixed
- Drop if: No measurable help

## Problem

A person running work through the plugin is stopped for things that are not decisions. In the review of 12 Nov 2026 (Arun, plugin owner) a command that only read a file was refused as a person's action, and two such refusals hold a session until someone types. The check that a test fails without the change is skipped in any repo where nobody set it up, a person starts each stage and each slice by hand, and the plugin's own first messages still say a person approves every gate.

## Users and jobs

- Person running a feature: when I have said what the work is for, I want it to reach a raised PR without starting each stage myself, so I only decide at the intent and the PR.
- Person running a capability: when the work is cut into slices, I want them worked in order without restating why, so a big piece of work needs one answer from me, not one per slice.
- Agent in a session: when I only read, I want not to be refused or held, so an unattended run does not die on a search.
- Person setting up a repo: when I start in a new repo, I want its checks proposed from what the repo already is, so tests are run and proved without my writing configuration.

## Questions asked

None, because the four changes and their order were agreed with Arun on 12 Nov 2026 ("Yes, fix them"), and each can be undone by reverting the PR.

## Constraints

- One branch and one PR for all four changes. (Arun, plugin owner)
- No guard, gate or limit is loosened for a command that can change anything. (ADR-0004, the retro rule)

## Assumptions

- A1: A command that only reads cannot carry out a person's action, whatever text it names. [unconfirmed]
- A2: Repos that use the plugin today and have no proof set would rather be told at Verify than keep skipping the proof. [unconfirmed]
- A3: A capability's reason for existing, and the result that would end it, are the same for each of its slices. [unconfirmed]
- A4: Node, Python, Go and .NET cover the repos the plugin is used in today. [unconfirmed]

## Requirements

- R1. (must) An agent that only reads is never refused as carrying out a person's action, whatever words the read names. Needs: which commands only read.
- R2. (must) A refusal of a read-only step never moves a session towards being held. Needs: which commands only read.
- R3. (must) Setting up a repo names the check that runs its tests and the check that proves them, chosen from what the repo already is, and a new repo starts with them in place. Needs: what kind of project the repo holds.
- R4. (must) A feature whose tests were not proved to fail without the change cannot pass Verify, unless a person said, with a reason, that this repo goes without the proof. Needs: whether a person waived the proof.
- R5. (must) One request takes a feature from its recorded intent to a raised PR, stopping only where a person holds a gate. Needs: where the feature stands.
- R6. (must) For a capability, the person can see which slice is ready to work next, in dependency order. Needs: each slice's dependencies and where each stands.
- R7. (should) A new slice of a capability starts with the intent a person already gave for that capability, in their words, marked as carried over. Needs: an intent a person gave for another slice of the capability.
- R8. (must) What the plugin tells people and agents at the start of a session and in its first-read documents matches how it behaves: a person decides at the intent and the PR. Needs: nothing new.
- R9. (must) A person's answer to a question is recorded for the feature it was asked about, wherever that feature's work lives, and never starts another feature by mistake. Needs: where each feature's work lives.
- R10. (must) An agent cannot change a proved test through a one-line program either. Needs: which tests are proved.
- R11. (must) An agent that starts changing code on the protected branch of a repo that runs the plugin, with no work started there, is refused and told how to start the work. Needs: whether work is started on the branch.
- R12. (must) An agent cannot delete a folder tree outside the repo it is working in. Needs: where the repo ends.
- R13. (should) Setting up a repo gives it no settings that nothing reads. Needs: nothing new.

## Changes since v1

Arun asked on 16 Nov 2026 for the rest of the open items to be fixed where they still make sense, and chose to amend this feature rather than raise a change request. R9 to R13 are new; R1 to R8 are unchanged and built. R9 and R10 come from the dogfood run of 6 Nov (answers recorded in the wrong folder; a proved test changed through a one-line program). R11 and R12 are the two guard changes Arun decided on 7 Nov. R13 removes the autonomy levels file, which the review of 12 Nov found no code reads. Added effort: about 80 counted code lines on top of 124, still one PR under the light lane's 300.

## Non-functional requirements

- Performance: None, because nothing here adds work to a tool call beyond one more pattern test.
- Security and privacy: R1 and R2 change a guard, so only commands that change nothing are let through (Constraints). R10 to R12 add refusals and loosen nothing.
- Accessibility: None, because there is no screen.
- Limits and quotas: None, because no input grows with use.

## Never

- Never let a command that writes, runs code or records a decision through as "read-only".
- Never write or reword a person's intent; a carried-over intent is their words and says where it came from.
- Never tell a person a gate waits for them when it passes on its checks.

## Out of scope

- Running other agents (Copilot, Gemini): a separate decision, on the review's to-do.
- Collapsing the several ways a repo grants autonomy into one: a design decision for Arun; only the unread levels file goes (R13).
- The other dogfood flaws of 6 Nov (stacked PRs sized against main, facts gone stale after a spec revision, slow gate runs): each needs a design first.
- Rewriting the README article: parked by Arun on 6 Nov 2026; only its statements about who decides are changed.
- Choosing proof commands for Go and .NET: the setup names their test check only, and says the proof is to be set.

## Outcome metric

Metric: human stops before the PR in a dogfood run of one feature through the single request
Baseline: 4 commands typed by a person per feature today (start, define, build, verify), from docs/getting-started.md section 3
Target: 1
Owner: Arun, plugin owner
Objective: the gates-and-names capability outcome (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept; the read-only list is the one the guard already uses for guardrail files.
- A2: who: Arun. Recommend: accept, and say it in the changelog as a change on upgrade.
- A3: who: Arun. Recommend: accept; a slice whose reason differs gets its own intent by asking again.
- A4: who: Arun. Recommend: accept; other stacks keep today's message.

## Definition of done

- [x] Open questions answered or owned
- [x] Every requirement has a scenario in acceptance.feature
- N/A: UX design, because the change has no screen
- N/A: API or data needs, because the change has neither
- [x] Assumptions confirmed or owned
