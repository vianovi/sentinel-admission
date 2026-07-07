# Staff Candidate V2

## Goal

Staff Candidate V2 turns the staff candidate area into an operational SPMB interface for monitoring, reviewing, prioritizing, and routing candidate work.

The design principle is scan-first and action-first. Candidate-style field grids remain available as drill-down content, but the main staff workflow should answer:

- Who needs review?
- What is blocking this candidate?
- Which readiness steps are complete?
- Where should staff click next?
- What future exports/reports will this page support?

## Primary Surfaces

### Semua Kandidat

The list should become the candidate data center. It should include compact KPIs, practical filters, readiness columns, action-needed badges, and quick row actions.

Planned filters:

- search
- lifecycle status
- wave
- program
- action queue

Readiness indicators:

- data completion
- documents
- payment
- exam/selection

Export Excel is intentionally only a disabled/coming-soon placement in Task-7.

### Candidate Detail Overview

The detail page should open with an operational overview before the existing detailed tabs.

Planned sections:

- identity and lifecycle header
- wave/program metadata
- primary blocker
- readiness strip
- action shortcuts
- recent activity

Existing detail tabs remain useful as secondary review surfaces.

### Perlu Tindakan

The action-needed page should become a queue foundation, not just a change-request inbox.

Supported queue buckets should only use real available data:

- pending data changes
- pending email changes
- incomplete core data
- documents waiting review
- payments waiting review
- rejected documents or payments
- verified candidates not assigned to an exam/session

Unsupported future queues must be documented instead of faked.

## Non-Goals

- Excel export implementation
- payment recap implementation
- report center implementation
- database schema changes
- candidate dashboard redesign
- admin dashboard redesign
- final admission decision automation
