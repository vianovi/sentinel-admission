# Staff Operations Redesign Next Actions

## Phase B Milestones

1. Staff Candidate Detail Operational Profile
   - Restructure first viewport.
   - Buat action rail.
   - Pindahkan final admission decision dari document tab ke action rail.
   - Jaga data diri/wali/kesehatan/dokumen/payment sebagai secondary detail.

2. Perlu Tindakan Workbench
   - Bucket sidebar.
   - Queue list.
   - Detail/action panel.
   - Data/email request tetap real approve/reject.

3. Final Docs And Verification
   - Update progress/audit/feature docs.
   - Run full required checks.
   - Commit final state.

## Completed

- Staff Payment Operations Workspace.
- Staff Candidate List Workbench.

## Open Limitations

- Gateway sync service ada di backend, tetapi staff route/action belum ada. UI hanya boleh menampilkan status provider dan menandai sync/override sebagai future.
- Tidak ada schema fee components. UI tidak boleh menampilkan komponen biaya palsu.
- Staff exam assignment belum ada pada staff route. Queue hanya boleh membuka hasil ujian/status relevan.
