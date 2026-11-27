# PRD: c4-model-page

Issue: https://github.com/arunendapally/arunendapally-aisdlc/issues/71

## Intent

<!-- Typed by Arun Endapally on 2026-11-26. Only a person changes it: sdlc intent <feature> change: ...; smallest: ...; drop if: ... -->

- Change: One C4 HTML page
- Smallest: Skill + template + handoff
- Drop if: dont know, you decide

## Problem

A feature's architecture is spread over its design, its capability overview and its contracts, as Mermaid blocks and tables a reviewer has to assemble in their head (issue #71). Nothing in the plugin draws them as one page, so the person approving Design and the teams that build it read three or four files to see who calls whom and what changes. Arun builds such a page by hand today (issue #71).

## Users and jobs

- Person approving Design: when a feature's design is done, I want to see its context, containers, calls, run order and changes in one place, so I can approve or send it back in minutes.
- Engineer on a team the feature touches: when I pick up my part, I want to see which calls and contracts change for my system, so I know what I build and what I must not break.

## Questions asked

- Q1: Which documents does the page read? A: The issue names architecture-overview.md, technical-design.md and Teams/<repo>/openapi.yaml, and makes them configurable if they are team conventions, not plugin outputs. The plugin writes architecture-overview.md, design.md and openapi.yaml under the feature's specs folder. Recommended: read the plugin's own documents by default, and take the issue's paths as optional inputs a team can name. (recommended, accepted: Arun, plugin owner, 2026-11-26, in the session brief)

## Constraints

- One self-contained HTML page with Context, Containers, Calls, Run and Changes tabs, Mermaid diagrams with pan and zoom, and the visual design in issue #71. (Arun, plugin owner, issue #71)
- It is a skill in this plugin, with its long page template in a reference file beside the skill, and no account-level copy. (Arun, issue #71)
- The Design step hands off to it when it finishes. (Arun, intent: smallest)

## Assumptions

- A1: The page is optional output, offered after Design, never a gate check; a generated document nobody reads is what the concept says to cut. [unconfirmed]
- A2: The drop-if answer was left to the agent ("you decide"): drop it if, in the next three full-lane dogfood runs, nobody opens the page when approving Design. [unconfirmed]
- A3: Mermaid and the fonts load from public CDNs when the page opens; the page is one file, not an offline bundle. [unconfirmed]
- A4: Light-lane features, which have no Design step, can run the skill by hand; only Design hands off to it. [unconfirmed]

## Requirements

- R1. (must) After a feature's design is done, a person can open one page for that feature with five views (context, containers, calls, run order, changes), each reachable by its own link. Needs: the feature's design, systems under change and contracts.
- R2. (must) Every box, arrow and table row on the page comes from the feature's documents; a fact they do not hold shows as Open with who must decide it. Needs: which document each fact came from.
- R3. (must) By default the page is built from the documents the plugin itself writes; a team can name its own overview, technical design and per-repo contracts instead. Needs: where the team keeps those documents, when it does not use the plugin's.
- R4. (must) The views agree with each other: every call in the calls view is an arrow between the same two containers, and back, and each system's colour matches its change in the changes view. Needs: each system's change type.
- R5. (should) A reader can pan, zoom, fit and show full screen each diagram by mouse, touch or keyboard. Needs: nothing new.
- R6. (must) The page reads well in light and dark themes and at 375px phone width with no sideways page scroll. Needs: nothing new.
- R7. (should) When Design finishes, the person is offered the page without asking for it. Needs: that the design is done.

## Non-functional requirements

- Performance: None, because the page draws at most four diagrams, each only when its tab is first shown.
- Security and privacy: None, because the page shows only the feature's own design documents, already in the repo; text from them is escaped, never run as markup.
- Accessibility: R5, R6
- Limits and quotas: None, because one page per feature is written on request, with no new call or input from users.

## Never

- Never mark a fact Decided or Verified when the documents do not say so.
- Never invent a system, call or contract that no document names.
- Never make the page a gate check that refuses a feature.
- Never keep a second copy of the skill outside the plugin.

## Out of scope

- An offline page with Mermaid and the fonts inlined: later, if A3 proves wrong.
- Generating or editing docs/architecture/workspace.dsl from the page: the architect keeps the C4 model as code.
- A handoff from the light lane's Build: A4.

## Outcome metric

Metric: full-lane dogfood features whose Design approver opened the C4 page before deciding
Baseline: none today (no page); the first read sets it
Target: 2 of the next 3
Owner: Arun, plugin owner
Objective: the person deciding at Design reads one page, not four files (issue #71)
Read on: 2027-01-31

## Open questions

- A1: who: Arun. Recommend: accept; the page helps a person decide and checks nothing.
- A2: who: Arun. Recommend: accept the metric above as the drop-if.
- A3: who: Arun. Recommend: accept; inlining Mermaid makes the file several megabytes.
- A4: who: Arun. Recommend: accept; the light lane's design is a section in tasks.md.

## Definition of done

- [x] Open questions answered or owned
- [x] Every requirement has a scenario in acceptance.feature
- [x] N/A: UX design done, if the change has a screen: the page layout and look are fixed by issue #71's spec
- [x] N/A: API or data needs named, if the change has any: no API or data changes
- [x] Assumptions confirmed or owned
