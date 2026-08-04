# Blueprint Halaman Kalender SPMB — Premium, Informatif, dan Friendly

> Fokus dokumen ini: memberi arahan umum untuk AI agent saat membangun **halaman Kalender SPMB** yang terasa seperti web produksi profesional. Dokumen ini **tidak membahas struktur folder project**, karena AI agent nanti harus membaca context project langsung dari repository.

---

## 1. Tujuan Halaman

Halaman Kalender SPMB bukan cuma kalender tanggal. Halaman ini harus menjadi pusat informasi waktu untuk seluruh proses penerimaan santri baru.

Target rasa produk:

- Modern, premium, dan rapi.
- Friendly untuk staf non-teknis.
- Informatif tanpa terasa ramai.
- Responsif untuk desktop, tablet, dan mobile.
- Mudah dipakai untuk melihat agenda, deadline, catatan, dan status penting.
- Terasa “hidup” lewat micro-interaction yang halus, bukan animasi berlebihan.

Kalender ini idealnya membantu user menjawab pertanyaan seperti:

- Hari ini ada agenda SPMB apa?
- Deadline terdekat apa?
- Ada catatan penting di tanggal tertentu?
- Agenda mana yang sudah selesai, aktif, atau urgent?
- Apa saja proses penting dalam bulan ini?

---

## 2. Konsep Besar UI

Gunakan pendekatan **FullCalendar sebagai mesin kalender utama**, lalu bungkus dengan UI modern dari **shadcn/ui**, style dari **Tailwind CSS**, dan animasi ringan dari **Motion/Framer Motion**.

Prinsipnya:

- FullCalendar menangani kalender, event rendering, navigasi bulan/minggu/hari, dan interaksi tanggal.
- shadcn/ui menangani dialog, sheet, button, badge, card, popover, command menu, tabs, skeleton, dan komponen dashboard.
- Tailwind mengatur visual custom agar kalender tidak terlihat default.
- Motion/Framer Motion memberi transisi halus agar halaman terasa hidup.
- Data event tetap datang dari backend, jangan hardcode di komponen UI.

Jangan membuat kalender custom dari nol kecuali benar-benar perlu. Fokus pada pengalaman pengguna, bukan membangun ulang fitur kalender dasar.

---

## 3. Dependency Utama yang Direkomendasikan

### Core calendar

```bash
pnpm add @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list
```

Keterangan:

- `@fullcalendar/react` — wrapper React resmi untuk FullCalendar.
- `@fullcalendar/daygrid` — tampilan kalender bulanan.
- `@fullcalendar/timegrid` — tampilan mingguan/harian berbasis jam.
- `@fullcalendar/interaction` — klik tanggal, klik event, drag/drop, selectable.
- `@fullcalendar/list` — tampilan agenda/list yang enak untuk mobile.

Opsional jika butuh fitur lanjutan:

```bash
pnpm add @fullcalendar/core
```

Biasanya ikut otomatis, tapi boleh eksplisit bila diperlukan.

---

### UI primitives

```bash
pnpm dlx shadcn@latest add button card badge dialog sheet popover tooltip tabs dropdown-menu command separator scroll-area skeleton
```

Komponen yang paling berguna untuk halaman kalender:

- `Card` untuk wrapper kalender, ringkasan, dan panel agenda.
- `Badge` untuk status agenda.
- `Dialog` untuk tambah/edit agenda.
- `Sheet` untuk detail agenda di sisi kanan.
- `Popover` untuk preview cepat saat klik event.
- `Tooltip` untuk hint singkat.
- `Tabs` untuk filter agenda: Semua, Deadline, Tes, Pembayaran, Pengumuman.
- `Command` untuk quick search agenda.
- `Skeleton` untuk loading state.
- `ScrollArea` untuk panel agenda panjang.

---

### Animation

Pilih salah satu pendekatan, jangan dobel berlebihan.

Rekomendasi modern:

```bash
pnpm add motion
```

Alternatif jika project masih memakai nama lama:

```bash
pnpm add framer-motion
```

Gunakan animasi hanya untuk:

- page entrance,
- card hover,
- perubahan filter,
- buka/tutup detail agenda,
- empty state,
- highlight event penting.

Jangan animasikan semua elemen. UI premium itu halus, bukan heboh.

---

### Data fetching dan state

Jika project belum punya pola data fetching yang kuat:

```bash
pnpm add @tanstack/react-query
```

Gunakan untuk:

- mengambil list event,
- refresh event setelah create/update/delete,
- optimistic update ringan,
- caching agenda bulanan,
- loading dan error state yang konsisten.

Jika project Inertia sudah cukup kuat dan halaman hanya menerima props dari backend, TanStack Query boleh tidak dipakai. Jangan menambah dependency kalau tidak perlu.

---

### Date utility

```bash
pnpm add date-fns
```

Gunakan untuk:

- format tanggal Indonesia,
- menghitung deadline terdekat,
- grouping agenda per hari,
- label seperti “hari ini”, “besok”, atau “3 hari lagi”.

---

### Icon

```bash
pnpm add lucide-react
```

Gunakan ikon secara konsisten:

- CalendarDays untuk kalender.
- Clock untuk jam.
- Megaphone untuk pengumuman.
- CreditCard untuk pembayaran.
- FileText untuk berkas.
- Users untuk wawancara/seleksi.
- AlertTriangle untuk urgent.
- CheckCircle untuk selesai.

---

## 4. Kombinasi Visual yang Disarankan

Gunakan konsep visual “premium school admission dashboard”.

Karakter visual:

- Background halaman soft, bukan putih polos total.
- Card besar dengan border halus dan shadow tipis.
- Header halaman punya title, subtitle, dan quick action.
- Ada ringkasan agenda di atas kalender.
- Kalender utama tetap menjadi pusat halaman.
- Detail agenda muncul di sheet kanan, bukan membuat halaman pindah.
- Event penting diberi warna dan badge, tapi tetap soft.

Contoh nuansa:

- Kalender besar di kiri/tengah.
- Panel kanan berisi “Agenda Terdekat”.
- Top summary card: Hari Ini, Minggu Ini, Deadline Terdekat, Total Agenda Aktif.
- Mobile: kalender menjadi compact dan agenda list lebih dominan.

---

## 5. Tipe Event SPMB

Gunakan tipe event agar kalender informatif dan mudah difilter.

Tipe minimal:

- `registration` — pembukaan/penutupan pendaftaran.
- `payment` — pembayaran formulir, daftar ulang, atau deadline administrasi.
- `test` — tes seleksi, CBT, wawancara, baca Qur’an, atau observasi.
- `announcement` — pengumuman hasil seleksi.
- `document` — deadline upload/validasi berkas.
- `meeting` — rapat panitia SPMB.
- `note` — catatan umum.
- `holiday` — libur/tanggal nonaktif.

Setiap tipe harus punya:

- label yang human-friendly,
- warna badge,
- icon,
- prioritas tampilan,
- aturan empty state.

---

## 6. Status Event

Selain tipe, setiap event sebaiknya punya status.

Status yang direkomendasikan:

- `draft` — belum dipublikasikan.
- `scheduled` — sudah dijadwalkan.
- `active` — sedang berlangsung / relevan hari ini.
- `completed` — selesai.
- `cancelled` — dibatalkan.
- `urgent` — mendesak.

Status bukan sekadar warna. Status harus memengaruhi UX:

- `urgent` muncul di panel atas atau diberi highlight lembut.
- `completed` tampil lebih redup.
- `cancelled` diberi garis/label jelas.
- `draft` hanya terlihat untuk role yang berwenang.

---

## 7. Fitur Halaman yang Disarankan

Fitur inti:

- Lihat kalender bulanan.
- Lihat agenda mingguan/harian jika diperlukan.
- Lihat agenda dalam mode list untuk mobile.
- Klik tanggal untuk melihat/tambah catatan.
- Klik event untuk melihat detail.
- Filter berdasarkan tipe event.
- Search agenda.
- Badge status.
- Ringkasan agenda terdekat.
- Empty state yang ramah.
- Loading skeleton.
- Error state yang bisa retry.

Fitur premium tapi tetap realistis:

- Quick action “Tambah Agenda”.
- Side sheet detail agenda.
- Mini timeline agenda terdekat.
- Highlight hari ini.
- Highlight deadline yang mendekat.
- Floating quick filter di mobile.
- View switch: Bulan / Minggu / List.
- Calendar legend untuk warna event.
- Soft animation saat berpindah filter.

---

## 8. Trik Supaya FullCalendar Tidak Terlihat Default

FullCalendar default-nya cukup fungsional, tapi sering terlihat “mentah”. Agar premium:

- Override style FullCalendar dengan class wrapper khusus, misalnya `.spmb-calendar`.
- Jangan edit global CSS terlalu liar.
- Samakan radius, border, font, dan spacing dengan design system project.
- Hilangkan border yang terlalu tebal.
- Buat header toolbar lebih clean.
- Ganti button default FullCalendar agar terasa seperti shadcn button.
- Gunakan eventContent custom untuk membuat event seperti pill/badge.
- Gunakan warna soft, bukan warna solid mencolok.
- Buat today cell punya highlight lembut.
- Gunakan popover/sheet custom untuk detail event, jangan bergantung pada alert/browser default.

Contoh pendekatan event rendering:

- Event kecil cukup tampil sebagai pill ringkas.
- Event urgent menampilkan icon kecil.
- Event completed dibuat opacity lebih rendah.
- Event cancelled diberi badge “Dibatalkan”.

---

## 9. Pola Interaksi yang Friendly

Interaksi utama:

- Klik tanggal kosong → buka sheet/dialog “Tambah Catatan / Agenda”.
- Klik event → buka detail event.
- Double click tidak wajib, karena tidak semua user terbiasa.
- Drag/drop hanya aktif untuk role yang boleh mengubah jadwal.
- Pada mobile, gunakan sheet bawah/kanan agar lebih natural.

Microcopy harus ramah:

- “Belum ada agenda di tanggal ini.”
- “Tambahkan catatan agar panitia tidak melewatkan jadwal penting.”
- “Deadline ini semakin dekat.”
- “Agenda sudah selesai.”
- “Perubahan jadwal berhasil disimpan.”

Jangan gunakan pesan yang terlalu teknis untuk user staf.

---

## 10. Animasi yang Disarankan

Gunakan animasi kecil untuk memberi rasa hidup:

- Card masuk dengan fade + translate kecil.
- Detail sheet muncul smooth.
- Agenda item hover sedikit naik.
- Badge urgent bisa diberi pulse sangat halus.
- Empty state bisa fade in.
- Skeleton loading shimmer bawaan shadcn/Tailwind.

Hindari:

- Animasi looping berlebihan.
- Motion terlalu cepat.
- Bounce berlebihan.
- Animasi pada banyak event sekaligus jika event banyak.

Aturan umum:

- Durasi animasi 150–250ms cukup.
- Gunakan easing yang halus.
- Hormati preferensi reduced motion.

---

## 11. Build Rules React — Ringan Tapi Powerful

### Komponen

- Pisahkan komponen UI kecil dari logic data.
- Jangan letakkan semua logic di satu file besar.
- Komponen kalender utama hanya mengatur konfigurasi dan event handler.
- Komponen detail event berdiri sendiri.
- Komponen filter berdiri sendiri.
- Komponen summary card berdiri sendiri.

### State

- State lokal hanya untuk UI: selectedDate, selectedEvent, openSheet, activeFilter.
- Data agenda berasal dari props/API/query, bukan hardcode.
- Hindari duplicate source of truth.
- Jangan menyimpan derived data sebagai state jika bisa dihitung dari data utama.

### Memoization

Gunakan `useMemo` untuk:

- mapping backend event ke format FullCalendar,
- filter event aktif,
- agenda terdekat,
- grouping agenda per tanggal.

Gunakan `useCallback` untuk handler yang dikirim ke FullCalendar jika perlu.

Jangan asal memo semua hal. Memoization dipakai untuk mencegah render berat, bukan hiasan.

### Rendering

- Jangan render detail semua event sekaligus.
- Untuk list panjang, tampilkan ringkas dulu.
- Batasi event preview di panel kanan, misalnya 5–7 agenda terdekat.
- Gunakan skeleton saat loading.
- Gunakan empty state saat tidak ada agenda.

### Performance

- Hindari animasi berat di setiap cell kalender.
- Hindari inline object/function berlebihan pada konfigurasi besar.
- Pastikan event mapping stabil.
- Gunakan lazy load untuk dialog/form besar jika perlu.
- Jangan melakukan request ulang setiap klik tanggal jika data bulan sudah tersedia.

---

## 12. Data Contract Umum untuk Event

AI agent boleh menyesuaikan dengan backend project, tapi minimal event sebaiknya punya bentuk konsep seperti ini:

```ts
type CalendarEvent = {
  id: string | number
  title: string
  description?: string | null
  start: string
  end?: string | null
  allDay?: boolean
  type: 'registration' | 'payment' | 'test' | 'announcement' | 'document' | 'meeting' | 'note' | 'holiday'
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled' | 'urgent'
  location?: string | null
  createdBy?: string | null
  editable?: boolean
}
```

Untuk FullCalendar, data ini bisa dimapping ke:

```ts
{
  id: String(event.id),
  title: event.title,
  start: event.start,
  end: event.end ?? undefined,
  allDay: event.allDay ?? true,
  extendedProps: {
    type: event.type,
    status: event.status,
    description: event.description,
    location: event.location,
    editable: event.editable,
  },
}
```

Jangan buang data asli. Simpan detail tambahan di `extendedProps`.

---

## 13. UX untuk Role Berbeda

Halaman kalender bisa sama, tapi action-nya berbeda.

Untuk admin/panitia:

- Bisa tambah agenda.
- Bisa edit agenda.
- Bisa hapus/batalkan agenda.
- Bisa mengatur status.
- Bisa melihat draft.

Untuk staff biasa:

- Bisa melihat agenda.
- Bisa menambah catatan jika diberi izin.
- Tidak semua event bisa diedit.

Untuk kandidat/orang tua, jika nanti dipakai:

- Hanya tampilkan agenda publik.
- Hindari detail internal panitia.
- Fokus pada deadline, tes, pembayaran, dan pengumuman.

Build rule penting:

- Jangan hanya sembunyikan tombol di frontend.
- Permission tetap harus divalidasi backend.

---

## 14. Empty State yang Bagus

Jangan biarkan kalender terasa kosong.

Contoh empty state:

> Belum ada agenda di bulan ini. Tambahkan jadwal penting seperti pembukaan pendaftaran, tes seleksi, deadline pembayaran, atau pengumuman hasil.

Untuk tanggal tertentu:

> Belum ada catatan di tanggal ini. Tanggal ini masih kosong dan aman dari agenda SPMB.

Untuk filter:

> Tidak ada agenda dengan filter ini. Coba lihat semua agenda atau ubah kategori.

Empty state harus terasa membantu, bukan sekadar “No data”.

---

## 15. Loading dan Error State

Loading:

- Gunakan skeleton card untuk summary.
- Gunakan skeleton area untuk kalender.
- Jangan tampilkan spinner sendirian di tengah layar kecuali terpaksa.

Error:

- Tampilkan pesan ramah.
- Sediakan tombol retry.
- Jangan tampilkan stack trace ke user.

Contoh:

> Kalender belum berhasil dimuat. Periksa koneksi atau coba muat ulang.

---

## 16. Design Detail yang Membuat Terlihat Premium

Detail kecil yang berdampak besar:

- Gunakan spacing lega.
- Gunakan card border halus.
- Gunakan typography jelas.
- Gunakan icon konsisten.
- Gunakan warna kategori yang soft.
- Hindari teks terlalu kecil.
- Gunakan title event yang pendek.
- Deskripsi panjang hanya di detail sheet.
- Gunakan tooltip untuk informasi tambahan.
- Gunakan “Agenda Terdekat” agar halaman langsung berguna.

Kalender premium bukan karena banyak efek, tapi karena informasi penting mudah dipahami.

---

## 17. Mobile Rules

Pada mobile:

- Jangan memaksa kalender bulanan menjadi terlalu penuh.
- Prioritaskan mode list/agenda.
- Kalender bulan tetap ada, tapi ringkas.
- Detail agenda pakai sheet.
- Tombol tambah agenda boleh menjadi floating action button.
- Filter dibuat horizontal scroll.
- Event title jangan terlalu panjang.

Mode mobile yang ideal:

1. Summary singkat.
2. Filter kategori.
3. Kalender compact.
4. Agenda tanggal terpilih.
5. Agenda terdekat.

---

## 18. Accessibility Rules

- Button harus punya label jelas.
- Jangan mengandalkan warna saja untuk membedakan status.
- Badge status harus punya teks.
- Pastikan kontras teks cukup.
- Dialog/sheet harus bisa ditutup dengan keyboard.
- Tooltip tidak boleh menyimpan informasi yang sangat penting sendirian.
- Hormati reduced motion.

---

## 19. Kalender sebagai Dashboard Mini

Agar lebih powerful, jangan tampilkan kalender sendirian. Tambahkan konteks:

- Summary card: Hari ini.
- Summary card: Deadline terdekat.
- Summary card: Agenda minggu ini.
- Summary card: Event urgent.
- Panel: Agenda terdekat.
- Legend: warna kategori.

Contoh insight:

- “3 agenda minggu ini”
- “1 deadline mendekat”
- “Tidak ada agenda hari ini”
- “Tes seleksi terjadwal Jumat”

Ini membuat halaman terasa informatif sejak pertama dibuka.

---

## 20. Do and Don’t

### Do

- Gunakan FullCalendar untuk fungsi kalender utama.
- Gunakan shadcn/ui untuk komponen interaksi.
- Gunakan Tailwind untuk membuat calendar terasa menyatu dengan design system.
- Gunakan Motion secukupnya.
- Buat event type dan status yang jelas.
- Buat UI ramah untuk user non-teknis.
- Buat mobile experience serius, bukan sekadar responsive asal.
- Pisahkan data, UI, dan transformasi event.

### Don’t

- Jangan hardcode agenda di frontend.
- Jangan membangun kalender dari nol tanpa alasan kuat.
- Jangan terlalu banyak animasi.
- Jangan gunakan warna mencolok berlebihan.
- Jangan tampilkan semua detail event langsung di cell kalender.
- Jangan membuat satu komponen React raksasa.
- Jangan mengandalkan frontend untuk permission.
- Jangan menampilkan error teknis ke user.

---

## 21. Checklist untuk AI Agent

Sebelum implementasi, AI agent harus memastikan:

- Sudah membaca context project.
- Sudah mengikuti design system yang ada.
- Sudah memahami role dan permission.
- Sudah menentukan sumber data event.
- Sudah membuat mapping event backend ke FullCalendar.
- Sudah menyiapkan empty/loading/error state.
- Sudah membuat responsive behavior.
- Sudah memastikan komponen tidak terlalu berat.
- Sudah memastikan action create/edit/delete tidak tersedia untuk role yang tidak berhak.
- Sudah memastikan tampilan kalender tidak terlihat default mentah.

---

## 22. Rekomendasi Final

Untuk halaman Kalender SPMB yang powerful, premium, dan tetap realistis, gunakan stack ini:

```bash
pnpm add @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list date-fns lucide-react motion
```

Tambahkan shadcn/ui components:

```bash
pnpm dlx shadcn@latest add button card badge dialog sheet popover tooltip tabs dropdown-menu command separator scroll-area skeleton
```

Tambahkan TanStack Query hanya jika pola data fetching project memang membutuhkannya:

```bash
pnpm add @tanstack/react-query
```

Formula besarnya:

> FullCalendar untuk mesin kalender, shadcn/ui untuk interaksi premium, Tailwind untuk visual custom, Motion untuk rasa hidup, dan backend Laravel sebagai sumber data yang aman.

Halaman ini harus terasa seperti pusat kendali agenda SPMB, bukan sekadar kalender biasa.

---

## 23. Referensi Resmi

- FullCalendar React Docs: https://fullcalendar.io/docs/react
- shadcn/ui Docs: https://ui.shadcn.com/docs
- Motion for React Docs: https://motion.dev/docs/react
- Motion Installation: https://motion.dev/docs/react-installation
- TanStack Query React Docs: https://tanstack.com/query/latest/docs/framework/react
