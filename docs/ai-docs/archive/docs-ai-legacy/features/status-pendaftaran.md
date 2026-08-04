# Status Pendaftaran Center

## Purpose

`Status Pendaftaran` is a detailed admission status/checklist center. It is separate from the candidate dashboard.

- Dashboard: daily summary, high-level progress, one primary next action.
- Status Pendaftaran: detailed lifecycle status, checklist, review state, safe timeline, blockers, and links to existing action pages.

## Routes

- Candidate: `GET /dashboard/status-pendaftaran`
- Legacy candidate status URL: `GET /dashboard/status` redirects to `/dashboard/status-pendaftaran`
- Staff: `GET /dashboard/staff/candidates/{candidate}/status-pendaftaran`
- Admin: `GET /dashboard/admin/candidates/{candidate}/status-pendaftaran`

## Backend Design

Main read-model service:

- `app/Services/StatusPendaftaranService.php`

The service composes data from existing sources only:

- `CandidateStatusService`
- `CandidateCompletionEvaluator`
- `CandidateVerificationEvaluator`
- `CandidateGateService`
- `candidates.status`
- `guardian`
- `healthRecord`
- `candidate_documents`
- `payments`
- `examSessionCandidates`
- `examAttempts`
- `data_change_request`
- `users.pending_email_*`
- `admissionWave`

No migration was added. No lifecycle semantics were changed.

## UI

Candidate page:

- header / hero with current status, candidate identity, waiting side, and primary action
- lifecycle progress stepper
- checklist kelengkapan
- next actions
- safe timeline / catatan panitia
- shortcuts to existing candidate pages

Staff/admin page:

- candidate identity summary
- lifecycle and gate summary
- completion checklist
- verification checklist
- selection/exam summary
- review blockers / perlu tindakan
- safe timeline
- quick links to existing review pages

## Navigation Decision

Candidate sidebar now uses real `Status Pendaftaran` in the main menu as the replacement for the previous candidate-facing announcement/status placeholder.

Admin sidebar includes `Kandidat > Status Pendaftaran`. Because the page is per-candidate, the sidebar item opens the selected candidate status page when a candidate is active/remembered, otherwise it falls back to the candidate list.

Staff sidebar was not expanded. Staff internal access is linked from:

- candidate table row action
- candidate detail action

This keeps the staff sidebar from becoming crowded while still making the admin change visible in the main navigation.

## Security Notes

- Candidate route uses the logged-in user candidate relation, not request candidate ID.
- Staff/admin routes stay inside existing role middleware groups.
- Candidate page does not expose raw payment metadata, internal audit objects, answer keys, or internal-only fields.
- Locked feature reasons come from backend `CandidateGateService`.
- Accepted/rejected remain final manual lifecycle states.

## Known Limitations

- Timeline uses currently available records only. There is no dedicated audit/event timeline table yet.
- Daftar Ulang is shown as future/unavailable because no real reregistration flow exists.
- Candidate exam score is shown only when existing exam visibility rules allow it.
- Staff/admin status page links to existing action pages; it does not replace document, payment, exam, or change-request review workflows.
