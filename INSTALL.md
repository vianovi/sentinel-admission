# Installation Guide

## Target struktur

```txt
<repo>/
├── AGENTS.md
├── docs/
│   └── ai-docs/
└── ...
```

## Langkah aman

1. Pastikan working tree bersih.
2. Backup `AGENTS.md` atau `docs/ai-docs` jika sudah ada.
3. Ekstrak ZIP ke root repository.
4. Tinjau dan gabungkan `AGENTS.md` bila perlu.
5. Commit paket fondasi sebagai satu commit dokumentasi.

Contoh commit:

```txt
docs(audit): add production auditor foundation
```

## Jangan mulai audit bila

- working tree tidak bersih;
- instruksi aktif tidak sesuai;
- branch sumber belum jelas;
- runtime dasar tidak tersedia;
- ada proses lain yang memodifikasi repository yang sama.

## Worktree

Worktree opsional. Gunakan hanya jika membantu isolasi dan selalu catat branch, path, serta rencana pembersihannya.
