# System facts: stage-names

## Facts

- F1: [governing] Stage 1 is named "Plan" with artefact prd.md and stage 3 is "Design" with artefact plan.md, so the stage that writes requirements is called Plan and the design file is called plan.md. Source: scripts/lib.mjs:10-12. Verified: 479a0fa.
- F2: Gate messages lead with the stage number ("Gate 3 (Design) passed", "is now at stage 4 (Build)"), so people read numbers first. Source: scripts/sdlc.mjs:529-535. Verified: 479a0fa.
- F3: The advance message names the next stage by number, then name. Source: scripts/loop.mjs:409. Verified: 479a0fa.
- F4: Status prints "stage <n> <name>" for each feature. Source: scripts/sdlc.mjs:697-722. Verified: 479a0fa.
- F5: The design fingerprint, design review and contract checks read plan.md by that file name, so existing features keep a plan.md design. Source: scripts/loop.mjs:447. Verified: 479a0fa.
- F6: The retro maps each stage to its command file, with stage 1 to commands/plan.md. Source: scripts/retro.mjs:8. Verified: 479a0fa.

## Not found

- Looked for any statement of each stage's input, processing and output in commands/*.md: none; each command says what to do, not what it takes in and hands on.
