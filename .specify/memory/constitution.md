<!--
Sync Impact Report:
Version: 1.0.0 (Initial ratification)
Date: 2025-11-18
Modified Principles: N/A (Initial creation)
Added Sections: All sections (initial constitution)
Removed Sections: None
Templates Status:
  - .specify/templates/plan-template.md: ✅ Exists (validated)
  - .specify/templates/spec-template.md: ✅ Exists (validated)
  - .specify/templates/tasks-template.md: ✅ Exists (validated)
Follow-up TODOs: None
-->

# Project Constitution: Fitness-app-for-parents

**Version**: 1.0.0
**Ratification Date**: 2025-11-18
**Last Amended**: 2025-11-18

## Preamble

This constitution establishes the foundational principles, standards, and governance
procedures for the Fitness-app-for-parents project. All contributors, specifications,
and implementation work MUST adhere to these principles.

## Core Principles

### Principle 1: Documentation Language Standard

**Statement**: All project documentation, specifications, plans, tasks, code comments,
and user-facing content MUST be written in Traditional Chinese (繁體中文). This
constitution document is the ONLY exception and MAY be written in English.

**Rationale**: Ensures consistency and accessibility for the primary development team
and target user base who communicate in Traditional Chinese. The constitution remains
in English to maintain compatibility with international tooling and templates.

**Compliance Requirements**:
- spec.md files MUST be in Traditional Chinese
- plan.md files MUST be in Traditional Chinese
- tasks.md files MUST be in Traditional Chinese
- research.md files MUST be in Traditional Chinese
- data-model.md files MUST be in Traditional Chinese
- quickstart.md files MUST be in Traditional Chinese
- Code comments MUST be in Traditional Chinese
- Git commit messages MUST be in Traditional Chinese
- User interface text MUST be in Traditional Chinese
- API documentation MUST be in Traditional Chinese

### Principle 2: Simplicity First

**Statement**: Solutions MUST favor simplicity over complexity. Introduce new
abstractions, layers, or dependencies ONLY when simpler alternatives have been
exhausted and documented.

**Rationale**: Simple systems are easier to understand, maintain, debug, and extend.
Premature abstraction leads to technical debt and cognitive overhead.

**Compliance Requirements**:
- New dependencies require justification in the Complexity Tracking section
- Design patterns require documented rationale
- Direct solutions preferred over indirect/abstracted approaches
- Complexity increases MUST be tracked in plan.md

### Principle 3: Test-Driven Validation

**Statement**: Features MUST define acceptance criteria as testable scenarios. When
tests are requested, they MUST be written before implementation and MUST fail initially.

**Rationale**: Test-first development ensures features are designed for testability
and requirements are clear before coding begins.

**Compliance Requirements**:
- spec.md MUST include testable acceptance scenarios
- When tests are included, contract and integration tests MUST be written first
- Tests MUST demonstrate failure before implementation
- All user stories MUST be independently testable

### Principle 4: Independent User Stories

**Statement**: User stories MUST be prioritized, independently implementable, and
independently testable. Each story MUST deliver standalone value as a potential MVP.

**Rationale**: Enables incremental delivery, parallel development, and flexible
prioritization. Allows shipping value at any checkpoint.

**Compliance Requirements**:
- Each user story in spec.md MUST have assigned priority (P1, P2, P3...)
- Each story MUST include "Independent Test" description
- Tasks MUST be organized by user story in tasks.md
- Each story MUST be completable without requiring other stories

### Principle 5: Constitution Compliance Gates

**Statement**: All implementation plans MUST pass constitution checks before Phase 0
research and after Phase 1 design. Violations MUST be documented with justification.

**Rationale**: Ensures architectural decisions align with project principles before
significant implementation work begins.

**Compliance Requirements**:
- plan.md MUST include "Constitution Check" section
- Violations MUST be listed in "Complexity Tracking" table
- Justifications MUST explain why simpler alternatives were rejected
- Re-check required after design phase

### Principle 6: Explicit Over Implicit

**Statement**: Requirements, assumptions, and unknowns MUST be explicitly stated.
Use "NEEDS CLARIFICATION" markers for ambiguous requirements. Use "TODO" markers
for deferred decisions.

**Rationale**: Makes knowledge gaps visible and prevents incorrect assumptions from
propagating through design and implementation.

**Compliance Requirements**:
- Ambiguous requirements MUST be marked "NEEDS CLARIFICATION: [explanation]"
- Deferred decisions MUST be marked "TODO(<FIELD_NAME>): [explanation]"
- Assumptions MUST be documented in relevant specification sections
- All placeholders MUST have explanatory comments

### Principle 7: Semantic Versioning

**Statement**: Constitution amendments MUST follow semantic versioning:
- MAJOR: Backward-incompatible principle changes, removals, or redefinitions
- MINOR: New principles or materially expanded guidance
- PATCH: Clarifications, wording fixes, non-semantic refinements

**Rationale**: Provides clear signal of change impact and helps teams understand
whether existing work requires review.

**Compliance Requirements**:
- Version bumps MUST follow semantic versioning rules
- Sync Impact Report MUST document version change rationale
- LAST_AMENDED_DATE MUST be updated with each amendment
- Version number MUST appear in constitution header

## Governance

### Amendment Procedure

1. **Proposal**: Any contributor MAY propose amendments via written document
2. **Review**: Proposed changes MUST be reviewed against existing principles
3. **Impact Analysis**: Author MUST complete Sync Impact Report
4. **Template Sync**: Dependent templates MUST be updated before ratification
5. **Ratification**: Changes take effect upon merge to main branch
6. **Communication**: Version bump and changes MUST be communicated to all contributors

### Versioning Policy

- Constitution MUST maintain single version number at document header
- Sync Impact Report MUST be prepended as HTML comment after each amendment
- LAST_AMENDED_DATE MUST reflect most recent change
- RATIFICATION_DATE MUST remain unchanged (original adoption date)

### Compliance Review

- All plan.md files MUST include Constitution Check section
- Violations MUST be documented with justification in Complexity Tracking table
- Constitution checks occur at:
  - Before Phase 0 (research)
  - After Phase 1 (design)
  - During code review (as needed)

### Deferred Items

If critical information is missing during constitution creation or amendment:
- Insert: `TODO(<FIELD_NAME>): [explanation]`
- Document in Sync Impact Report under "Follow-up TODOs"
- Resolve in next amendment cycle

## Amendment History

### Version 1.0.0 (2025-11-18)
- Initial ratification
- Established 7 core principles
- Defined governance procedures
- Set Traditional Chinese as project documentation language
