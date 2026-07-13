# Production Auditor Foundation — Start Here

Paket ini menambahkan sistem dokumentasi dan task untuk auditor AI yang menyiapkan aplikasi menuju release candidate tanpa menyentuh production.

## Cara memasang

Ekstrak isi ZIP ke **root repository**, sehingga hasilnya menjadi:

```txt
AGENTS.md
INSTALL.md
docs/ai-docs/...
```

Jika repository sudah memiliki `AGENTS.md`, jangan menimpanya secara buta. Gabungkan aturan yang sudah ada dengan paket ini dan pertahankan aturan yang lebih ketat.

## Prompt awal

```txt
Read `AGENTS.md` and execute `docs/ai-docs/tasks/master-production-audit.task.md`.

Work as the production-readiness auditor defined by the repository. Begin from durable state, verify the actual repository before trusting assumptions, and execute autonomously until a mandatory stop condition or context limit is reached. Never merge to main, deploy, expose secrets, or claim visual approval. Preserve evidence and resumable state after every meaningful checkpoint.
```

## Hasil run pertama

1. Verifikasi repository, branch, working tree, dan instruksi aktif.
2. Audit hubungan `develop`, `main`, dan branch terkait.
3. Pilih strategi release-candidate berdasarkan riwayat Git nyata.
4. Tetapkan urutan slice audit berdasarkan dependency map.
5. Jalankan baseline test/build/security checks yang aman.
6. Isi state, evidence, audit, dan release manifest.
7. Lanjut mandiri atau berhenti bila keputusan manusia benar-benar diperlukan.

## Batas utama

- `main` tidak boleh diubah auditor.
- Tidak boleh deploy.
- Tidak boleh menjalankan migration pada database production.
- Tidak boleh membaca, mencetak, atau menyimpan secret.
- Audit visual tetap dilakukan manusia.
- Hanya temuan yang terbukti yang boleh diperbaiki.
