# Sentinel Admission — Current Status & Progress
> This file changes frequently. Update manually after every completed feature or decision.
> Last updated: Dashboard Polish V2 session — DataDiri, DataKesehatan, DataWali, DataDokumen, Gallery upgrade

---

## ⚡ Last Session Summary
> This section is overwritten every session. AI reads this first to restore context instantly.

```
Date     : 2026-04-05
Branch   : feat/dashboard-polish-v2
Mode     : (dev-mode / demo-mode)

Did      :
  - Refactored all project docs into docs-ai/compressed/ (4 files)
  - Created 00_core.md, 01_project.md, 02_status.md, 03_skills.md, README.md
  - Generated docs-ai/granular/ folder structure (empty, for future AI Agent CLI)

Next     :
  - Fix & verify document upload (restart container + art-clear + test end-to-end)
  - Build file preview private storage (dedicated auth-protected route)

Decisions:
  - docs-ai/ structure finalized — compressed for web chat, granular for CLI (future)
  - 02_status.md Last Session Summary = overwritten every session
```

> 💡 To update: tell Livi at end of session: **"Session done. Update 02_status.md."**

---

## Active Branch
`feat/dashboard-polish-v2`

---

## Completed ✅

| Page / Feature | Notes |
|---|---|
| Landing Page v2.0 | Merged to develop. Clear. |
| CinematicShowcase | Double marquee, GalleryCard 3D parallax, lightbox, private media storage |
| Auth Pages | Login, Register, Forgot/Reset Password — needs final review |
| Form Wizard | 3-step pre-registration. Resume modal, duplicate check, localStorage. |
| Dashboard: Index | ✅ |
| Dashboard: Profile | ✅ |
| Dashboard: Data Diri | 4 tabs (tab 5 content TBD) |
| Dashboard: Data Kesehatan V2 | Wizard-style nav, partial save, cyan-500 accent |
| Dashboard: Data Wali V2 | Wizard-style nav, violet-500 accent |
| Dashboard: Data Dokumen V2 | Row style, drag & drop, 5 states, warning dots, amber-500 accent |
| Dashboard: Pembayaran V1 | Midtrans Snap, 4 states, confetti, countdown timer |
| Error Pages | 404 NotFound + comingSoon mode |
| Auto-Submitted Observer | CandidateObserver + GuardianObserver + HealthRecordObserver |
| Backend Security Fix | DocumentSecurityService magic bytes, wantsJson(), CandidateDocumentSecurity model fix |
| Infrastructure | docker-compose user:1000, filesystems.php private disk serve:true |

---

## Pending / In Progress ⚠️

### 1. Document Upload — Needs Full Test
Fix committed but not fully tested (composer dump-autoload pending).
**Action:** Restart container + `art-clear`, then test upload end-to-end.

### 2. File Preview Private Storage
Files in `storage/app/private/` can't be accessed via direct URL.
`temporaryUrl()` unreliable on local Docker disk.
**Solution:** Build dedicated auth-protected route + controller method.
**Pattern reference:** `WelcomeController::serveGallery()` — adapt with auth middleware.
Preview button already exists in `DocumentCard` (placeholder).

---

## Next Priorities (in order)

```
1. Fix & verify document upload (composer dump / restart test)
2. Fix file preview private storage (dedicated serve route)
3. Polish Pembayaran — swap accent to orange-500
4. Build Halaman Status (observer already ready)
5. Decide Tab 5 Data Diri content
6. Auth pages final review & polish
7. Fine-tune global tone, contrast, colors (after all pages done)
8. Kalender SPMB
9. Informasi page
10. Staff Dashboard
11. Admin Dashboard
12. Full audit & polish pass (after all candidate features complete)
```

---

## Pending Decisions — Ask Silvia Before Building

| Item | Status |
|---|---|
| Tab 5 Data Diri | Content not yet decided |
| Auth pages | Need final review — not final version |
| Halaman Status | What content? Timeline? Result announcement? |
| CinematicShowcase | Photos & videos are placeholder — needs real school content |
| Surat Pernyataan template | `public/assets/surat-pernyataan-template.docx` exists — needs real content from school |

---

## Document Feature — Required Level Policy

| Group | Doc Types | Required Level |
|---|---|---|
| identity | photo_formal, birth_certificate, family_card, parent_id_card | Required |
| academic | graduation_certificate, report_card | Required |
| academic | academic_transcript | Optional |
| academic | transfer_letter | Required if `is_transfer = true` |
| achievement | all | Optional (bonus) |
| welfare | kip_card, welfare_card, poverty_letter | Choose one (if applicable) |
| boarding | parent_statement | Required (UI label only, not enforced in backend) |
| boarding | recommendation_letter | Optional |

> `requiredLevel` is a UI label only — no hard backend block. Candidates can submit without uploading.

---

## Page Template Reference (Follow for all candidate dashboard pages)

```
┌─ Header (not sticky) ──────────────────────────────────────────┐
│  Icon w-9 h-9 rounded-xl + Title text-xl + Subtitle text-xs    │
└────────────────────────────────────────────────────────────────┘
┌─ Tab Bar (STICKY top-0 z-10) ──────────────────────────────────┐
│  Pill style, overflow-x-auto, dark bg rounded-2xl              │
└────────────────────────────────────────────────────────────────┘
┌─ Content (full width, no max-w-3xl) ───────────────────────────┐
│  Section headers: icon container w-9 h-9 + bold + subtitle     │
└────────────────────────────────────────────────────────────────┘
┌─ Bottom Navigation ─────────────────────────────────────────────┐
│  [← Kembali]                         [Simpan & Lanjut →]       │
│  Last tab right button: [Kirim & Selesaikan] with 2-step confirm│
└────────────────────────────────────────────────────────────────┘
```

**Never use:** `max-w-3xl mx-auto` in main content · progress bar inside content (sidebar only) · nested cards inside cards.