# Worked example: back-in-stock alerts for an online shop

A fictional shop, **Threadline**, sells clothing in several sizes and colours. It has a web storefront, a mobile app that uses the same API, and a marketing email tool. The owner wants a "notify me when it's back" button on sold-out items.

Everything below is illustrative. It shows what each stage of the cycle produces, and what good findings look like.

---

## A starter constitution

Put this in the repo before Planning. Five to ten rules is enough. Every spec and plan is checked against it.

```markdown
# Threadline constitution

1. Customer data is scoped to its owner at the database layer, not only in code.
2. Every write is idempotent: repeating the same request never duplicates an
   order, a charge or a message.
3. Transactional messages and marketing messages are separate. Marketing needs
   recorded consent.
4. No dark patterns: no fake scarcity, no pre-ticked boxes, no countdowns that reset.
5. Prices, stock and totals shown to a customer come from the system of record,
   never from a cache older than 60 seconds.
6. Every rule enforced in the UI is also enforced in the API.
7. Simplicity: one new table is better than a new service.
```

---

## Goals for this feature

Written before each stage starts. Each stage loops until its goal is met, up to three tries, and then escalates.

| Stage | Goal |
|---|---|
| 1 Planning | Every requirement is numbered, every claim is graded, and the open questions each carry a recommendation |
| 2 Analysis | The supervisor raises no blocker on the reworked brief, and every requirement names stock or customer data that exists today |
| 3 Design | Product page, Account and admin screens are drawn in the real storefront, and every comment thread is resolved |
| 4 Implementation | Each batch is green, at or above the baseline count; a retried send job emails each subscriber exactly once |
| 5 Testing and integration | All four guards fail under mutation, the PR lists what was not verified, and the reviewer answers "yes, every phase" |
| 6 Maintenance | A test restock in production sends exactly one email to the test account |

**A loop in action (illustrative).** In Analysis, the first supervisor round says "rework" with five findings. The brief is reworked, and round two raises one new blocker: the alert table has no owner column, so it cannot be scoped at the database layer. That is fixed, and round three says "proceed". If round three had still said "rework", the loop would have stopped and gone to the owner, rather than looping a fourth time.

## 0. Clean the desk

> "Before we start back-in-stock alerts, list the branches and sessions related to it."

The agent finds an abandoned `wishlist-experiment` branch that touches the same product page. The owner archives it, so no agent builds on it by accident.

## 1. Planning

**Prompt:**

> "You are the product owner for back-in-stock alerts at Threadline. You are also an expert in retail inventory and email deliverability..."

**What a good brief contains (excerpt):**

| Claim | Grade |
|---|---|
| Back-in-stock emails convert better than general promotions | Moderate (industry reports, vendor-published) |
| Alerts sent days after restock lose most of their value | Moderate |
| Customers expect one message per restock, not one per day | Established (common complaint in reviews) |

- **Never:** fake "only 2 left" messages, signing a customer up for marketing because they asked for an alert, sending an alert for an item that sold out again before the email went.
- **Open question:** alert per product, or per size and colour? *Recommendation: per variant, because "back in stock" in the wrong size is a broken promise.*

**Structural innovation prompt:** "Study <a large marketplace> ... what can we do that they structurally cannot?"

**Good answer:** "We own our stock data and our customer's size history. We can alert on the variant they actually buy, and hold an item in their cart for 15 minutes when the alert lands. A marketplace with third-party sellers cannot promise either."

**Gate:** the owner keeps per-variant alerts and the 15-minute hold, and drops SMS.

## 2. Analysis

**Supervisor findings (illustrative):**

> **Verdict: rework.**
> 1. **Stock is tracked per product, not per variant.** The inventory table has one quantity per product (see `inventory` in the schema). Per-size alerts cannot be honest until variant stock exists. Either add variant stock first (its own spec) or ship per-product alerts and say so.
> 2. **The API bypasses the consent rule.** The web form shows a consent checkbox, but `POST /alerts` accepts a marketing flag with no consent record. Rule 6 says the API must enforce it too.
> 3. **Sending is not idempotent.** A retried job would email the same customer twice for one restock. Rule 2.
> 4. **The 15-minute cart hold is a stock reservation.** It interacts with checkout and needs its own design. Defer it.
> 5. **Harm risk:** a "price dropped too" line was proposed. That turns a transactional alert into marketing. Remove it, or require consent.
>
> **v1:** per-product alerts, transactional only, one message per restock, enforced in the API. **Defer:** variant stock (separate spec first), the cart hold, price-drop lines.

The owner accepts. Finding 1 is the one that matters: nobody had checked that the data existed.

**Integration decision (plain words):**

- The button replaces "Sold out" on the product page. No new navigation item.
- A customer manages their alerts in Account, beside Orders.
- The shop admin sees alert counts per product on the existing inventory screen.
- The mobile app gets the same button, through the same API.

**Spec:** user stories (customer subscribes, customer is alerted once, customer unsubscribes, admin sees demand), numbered requirements, success criteria such as "a restock of a product with 1,000 subscribers sends exactly 1,000 emails, even if the job is retried".

## 3. Design

**Design prompt:** "Draw every screen inside the real storefront: copy the header, product page layout and button components from `src/components/`..."

**Comment threads (illustrative):**

- On the button: "should not look like Add to cart" → changed to a secondary button with a bell icon. Resolved.
- On the confirmation: "too much text" → cut to one line, "We'll email you once when it's back." Resolved.
- On the Account screen: "where do I stop all alerts?" → added "Stop all alerts". Resolved.

**Plan judgement recorded:** "Rule 5 (fresh stock) applies when the alert is SENT, not when it is queued. We re-check stock immediately before each send and skip if the product has sold out again."

## 4. Implementation

**Task list header (the scars):**

```
- Baseline: record the passing test count first. Finish with nothing that passed
  before now failing.
- Never run tests against production or real customer emails. Use the local
  database and the email sandbox.
- Mutation-test every guard and record the result.
- Our job runner retries on timeout: every job must be safe to run twice.
- No raw SQL string building.
```

**Shape:** a strong model reviews in the build session; a cheaper model writes the code in batches (schema and domain, then API, then storefront, then admin, then email job).

**Escalation (illustrative):**

> "Spec gap: unsubscribe links must work after the alert is sent, but the spec deletes the alert row on send, so the link has nothing to look up. Options: (a) keep the row and mark it sent, (b) put a signed token in the link. Recommend (a), because it also gives the admin history. Ruling?"

Ruling: (a). The spec and data model are updated to match, not just the code.

## 5. Testing and integration

**Guards and their mutations:**

| Guard | Mutation | Expected |
|---|---|---|
| One email per restock | Remove the sent marker check | "retried job sends exactly once" fails |
| API enforces consent | Accept the marketing flag without consent | "API refuses marketing without consent" fails |
| Fresh stock at send | Skip the re-check | "sold out again before send: no email" fails |
| Owner scoping | Drop the owner filter on alerts | "customer A cannot list customer B's alerts" fails |

**PR "Not verified" section (illustrative):** "Emails checked in the sandbox only; not rendered in Outlook. Mobile app not tested on a device."

**The review question:** "Did you review your worker's work, every phase?" Suppose the answer is "the admin phase got a lighter check". The proper review then finds the admin count includes unsubscribed customers. It gets fixed before merge.

## 6. Maintenance

**Release order:**

1. Check production's schema matches what the migration expects.
2. Rehearse the migration on a copy.
3. Apply the migration and access rules.
4. Deploy the API, then the storefront, then enable the email job.
5. Probe production: subscribe a test account to a test product, restock it, confirm exactly one email.

**Feed the cycle:** the changelog notes "per-product only; variant stock is the next spec". The trap list gains "deleting a row on send breaks every link that points at it". The variant-stock spec starts at Planning, and the cycle goes round again.
