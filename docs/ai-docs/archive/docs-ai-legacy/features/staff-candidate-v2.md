# Staff Candidate V2

## Goal

Staff Candidate V2 turns the staff candidate area into an operational SPMB interface for monitoring, reviewing, prioritizing, and routing candidate work.

The design principle is scan-first and action-first. Candidate-style field grids remain available as drill-down content, but the main staff workflow should answer:

- Who needs review?
- What is blocking this candidate?
- Which readiness steps are complete?
- Where should staff click next?
- What future exports/reports will this page support?

## Implemented Primary Surfaces

### Semua Kandidat

The list is now a staff candidate data center with compact KPIs, practical filters, readiness columns, action-needed badges, and quick row actions.

Implemented filters:

- search
- lifecycle status
- wave
- program
- action queue

Readiness indicators shown from backend summaries:

- data completion
- documents
- payment
- exam/selection

Export Excel is intentionally only a disabled/coming-soon placement in Task-7.

### Candidate Detail Overview

The detail page now opens with an operational overview before the existing detailed tabs.

Implemented sections:

- identity and lifecycle header
- wave/program metadata
- primary blocker
- readiness strip
- action shortcuts
- recent activity

Existing detail tabs remain useful as secondary review surfaces.

### Perlu Tindakan

The action-needed page is now a queue foundation, not just a change-request inbox. Existing data/email approval tabs remain available below the broader queue.

Supported queue buckets only use real available data:

- pending data/email changes
- incomplete core data
- documents waiting review
- payments waiting review
- rejected documents or payments
- verified candidates not assigned to an exam/session

Unsupported future queues must be documented instead of faked.

## Backend Shape

`StaffCandidateOperationalService` is the Task-7 backend presenter for list rows, detail overview data, action filters, and queue items. It reuses `StatusPendaftaranService` so lifecycle, completion, verification, review blocker, timeline, and quick-link logic stay backend-owned.

The staff candidate list search query was grouped so search terms no longer bypass status/wave/program/action filters.

## Current Limits

- Queue items are generated from the latest candidate slice instead of a paginated reporting query.
- Export Excel is not implemented.
- No schema changes were added.
- Final decision automation and broader report center work remain future tasks.

## Non-Goals

- Excel export implementation
- payment recap implementation
- report center implementation
- database schema changes
- candidate dashboard redesign
- admin dashboard redesign
- final admission decision automation
