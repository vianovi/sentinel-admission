# Staff Operations Redesign Next Actions

## Phase B Milestones

1. Staff Payment Operations Workspace
   - Tambah presenter/query payment operations berbasis `payments`.
   - Tambah route staff payment operations.
   - Repoint menu `Review Pembayaran`.
   - UI table transaction-first, manual proof fallback only.
   - Tambah/ubah feature test backend props.

2. Staff Candidate List Workbench
   - Hapus export mati.
   - Compact table columns dan primary action.
   - Kurangi tombol kecil yang berulang.
   - Pertahankan filter nyata.

3. Staff Candidate Detail Operational Profile
   - Restructure first viewport.
   - Buat action rail.
   - Pindahkan final admission decision dari document tab ke action rail.
   - Jaga data diri/wali/kesehatan/dokumen/payment sebagai secondary detail.

4. Perlu Tindakan Workbench
   - Bucket sidebar.
   - Queue list.
   - Detail/action panel.
   - Data/email request tetap real approve/reject.

5. Final Docs And Verification
   - Update progress/audit/feature docs.
   - Run full required checks.
   - Commit final state.

## Open Limitations

- Gateway sync service ada di backend, tetapi staff route/action belum ada. UI hanya boleh menampilkan status provider dan menandai sync/override sebagai future.
- Tidak ada schema fee components. UI tidak boleh menampilkan komponen biaya palsu.
- Staff exam assignment belum ada pada staff route. Queue hanya boleh membuka hasil ujian/status relevan.
