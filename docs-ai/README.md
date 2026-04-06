# 🛡️ Sentinel Admission — AI Knowledge Base
> File-file konteks untuk AI assistant (Claude Project, GPT Project, Gemini, dll.)
> Dirancang efisien — zero duplikasi, informasi padat, hemat token.

---

## Struktur Folder

```
docs-ai/
│
├── /compressed/              ← Untuk Web Chat (Claude/GPT/Gemini Project)
│   ├── README.md             → File ini
│   ├── 00_core.md            → Identitas Livi, workflow, rules wajib
│   ├── 01_project.md         → Arsitektur, tech stack, DB schema, environment
│   ├── 02_status.md          → Progress terkini, pending, prioritas ← SERING DIUPDATE
│   ├── 03_skill_base.md      → Critical thinking, kapan search, prinsip dasar
│   ├── 04_skill_frontend.md  → UI, animasi, design, komponen, dark mode
│   ├── 05_skill_backend.md   → Security, Laravel, observer, error handling
│   └── 06_skill_infra.md     → Docker, Fedora, Fish, deployment, debug
│
└── /granular/                ← Untuk AI Agent CLI (future — load file selektif)
    ├── /system/
    │   ├── identity.md
    │   ├── workflow.md
    │   └── rules.md
    ├── /project/
    │   ├── overview.md
    │   ├── architecture.md
    │   ├── tech.md
    │   └── status.md
    └── /skills/
        ├── ui-standards.md
        ├── security.md
        ├── document-feature.md
        └── engineering-notes.md
```

### Buat folder structure dari nol (Fish shell)
```fish
mkdir -p docs-ai/compressed
mkdir -p docs-ai/granular/system
mkdir -p docs-ai/granular/project
mkdir -p docs-ai/granular/skills
```

---

## Referensi File

| File | Isi | Kapan Di-load | Seberapa Sering Berubah? |
|---|---|---|---|
| `00_core.md` | Identitas Livi, workflow 7 langkah, rules wajib | Setiap sesi | Jarang |
| `01_project.md` | Overview project, stack, DB schema, environment | Setiap sesi | Kadang |
| `02_status.md` | Progress, pending, prioritas berikutnya | Setiap sesi | **Sering** |
| `03_skill_base.md` | Cara berpikir kritis, kapan search, prinsip dasar | Setiap sesi | Jarang |
| `04_skill_frontend.md` | UI, animasi, design, komponen, dark mode | Sesi UI/frontend | Jarang |
| `05_skill_backend.md` | Security, Laravel, observer, error handling | Sesi backend/API | Jarang |
| `06_skill_infra.md` | Docker, Fedora, Fish, deployment, debug | Sesi infra/debug | Jarang |

---

## Cara Pakai

### Web Chat (Claude Project / GPT Project / Gemini)
Upload file ke AI Project sekali — otomatis ter-load di setiap sesi baru.

**Strategi upload untuk hemat token:**

| Tipe Sesi | File yang Di-upload |
|---|---|
| Sesi biasa (wajib selalu) | `00_core` + `01_project` + `02_status` + `03_skill_base` |
| Sesi UI / frontend / animasi | + `04_skill_frontend` |
| Sesi backend / security / API | + `05_skill_backend` |
| Sesi infra / debug / deployment | + `06_skill_infra` |
| Sesi fullstack | + `04_skill_frontend` + `05_skill_backend` |

### AI Agent / CLI (Future)
Load file secara selektif sesuai konteks task via tool file-reading agent.

---

## Cara Update Status Setelah Sesi

Di akhir setiap sesi, ketik ke AI:
> **"Session done. Update 02_status.md."** + attach file `02_status.md`

AI akan generate versi baru `02_status.md` yang sudah terupdate — tinggal download dan replace file lama, lalu re-upload ke Project.

---

## Maintenance

**Hanya `02_status.md` yang perlu diupdate rutin** — setelah setiap fitur selesai atau ada keputusan baru.

Yang perlu diupdate di `02_status.md`:
- Pindahkan item selesai ke tabel ✅ Completed
- Update pending issues
- Revisi urutan next priorities
- Tambah pending decisions baru

File lain hanya perlu diupdate kalau ada **keputusan arsitektur baru, rule baru, atau pattern baru** yang sudah disepakati.

---

## Perbandingan Ukuran

| | Sebelum | Sesudah |
|---|---|---|
| Total ukuran | ~128K chars | ~68K chars |
| Penghematan | — | **~47% lebih kecil** |
| Duplikasi konten | Tinggi | Nol |
| Bahasa file AI | Campur (Indlish) | English semua |
| Bahasa README | — | Indonesia (untuk Silvia) |

> Token base load (4 file wajib) = ~32K chars — sisanya on-demand sesuai kebutuhan sesi.

---

## Catatan Penting

- `02_status.md` adalah **satu-satunya sumber kebenaran** untuk status project terkini
- Jangan ubah DB schema tanpa konfirmasi eksplisit dulu
- Warna aksen halaman sudah **final** — jangan diubah tanpa diskusi: blue-500 · cyan-500 · violet-500 · amber-500 · orange-500
- `config/sentinel.php` **tidak boleh ada** di branch `main` atau `develop`
- Folder `/granular/` masih kosong — akan diisi nanti kalau AI Agent CLI sudah konkret