# Local Development Setup Guide

Panduan penyiapan lingkungan pengembangan lokal Sentinel Admission.

---

## 1. Prasyarat Sistem
- **PHP:** >= 8.2 (disarankan PHP 8.4 / 8.5)
- **Composer:** >= 2.x
- **Node.js:** >= 20.x dan npm
- **Database:** MariaDB 10.11+ / 11.x
- **Container (Opsional):** Docker & Docker Compose

---

## 2. Langkah Instalasi

### A. Clone & Konfigurasi Environment
```bash
git clone <repository-url>
cd sentinel-admission
cp .env.example .env
```
Sesuaikan konfigurasi koneksi MariaDB di `.env`:
```ini
DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sentinel_admission_db
DB_USERNAME=root
DB_PASSWORD=
```

### B. Install Dependensi & Generate Key
```bash
composer install
npm install
php artisan key:generate
```

### C. Database Migration & Seeding
```bash
php artisan migrate --seed
```
Seeder akan membuat akun demo default (admin, staf, kandidat) beserta data master gelombang dan program studi.

### D. Menjalankan Server Development

Gunakan perintah bawaan Laravel & Vite:
```bash
# Menjalankan frontend bundler & backend bersamaan:
composer dev

# Atau jalankan secara terpisah:
npm run dev
php artisan serve
php artisan reverb:start
```

---

## 3. Menjalankan via Docker Compose

Jika menggunakan Docker:
```bash
docker compose up -d
```
- Web Application: `http://localhost:8080`
- WebSocket Reverb: `ws://localhost:8085`

---

## 4. Linting & Formatter
- Format PHP sesuai standar Laravel: `vendor/bin/pint --dirty --format agent`
- Typecheck TypeScript: `npx tsc --noEmit`
- Build produksi: `npm run build`
