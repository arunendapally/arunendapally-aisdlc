# Feature Specification: Save items for later

**Feature Branch**: `001-save-for-later`
**Created**: 2026-11-01
**Status**: Draft
**Input**: User description: "Let shoppers save basket items for later"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save an item (Priority: P1)

A returning shopper keeps an item they are not ready to buy.

**Why this priority**: it is the core of the feature.

**Independent Test**: save one item and see it in the saved list.

**Acceptance Scenarios**:

1. **Given** a signed-in shopper with an empty saved list, **When** they save "Blue mug", **Then** the saved list holds "Blue mug"
2. **Given** "Blue mug" is saved, **When** they save it again, **Then** the saved list holds it once

### User Story 2 - See sold-out items (Priority: P2)

**Acceptance Scenarios**:

1. **Given** "Blue mug" is saved, **When** it sells out, **Then** the saved list shows it as sold out

### Edge Cases

- What happens when the list is full?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let a signed-in shopper save an in-stock item.
- **FR-002**: System MUST keep one entry per item.
- **FR-003**: System MUST show a saved item that sells out as sold out within [NEEDS CLARIFICATION: how soon?].

### Key Entities

- **Saved item**: an item a shopper keeps, with when it was saved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 8% of saved items are bought within 14 days.
- **SC-002**: Shoppers find a saved item in under 10 seconds.

## Assumptions

- Guests cannot save items.
