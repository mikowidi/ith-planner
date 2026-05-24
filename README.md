# ITH Planner

Aplikasi manajemen task internal tim berbasis web. Dibangun dengan HTML/CSS/JS murni dan Supabase sebagai backend. Dirancang untuk tim kecil yang butuh visibility task harian, tracking progress, dan koordinasi ringan tanpa overhead tool besar.

---

## Daftar Isi

- [Fitur](#fitur)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Struktur File](#struktur-file)
- [Skema Database](#skema-database)
- [Alur Sistem](#alur-sistem)
- [Setup & Deployment](#setup--deployment)
- [Manajemen User](#manajemen-user)
- [Konfigurasi Produksi](#konfigurasi-produksi)

---

## Fitur

### Dashboard

View utama dengan kanban board 3 kolom.

| Kolom | Isi |
|---|---|
| **To do** | Semua task aktif yang belum dikerjakan, lintas tanggal |
| **In progress** | Semua task yang sedang dikerjakan, lintas tanggal |
| **Done hari ini** | Task yang diselesaikan hari ini saja (reset tiap hari) |

**Toggle Progress / Prioritas**
- **Progress** → kanban board 3 kolom
- **Prioritas** → list dikelompokin High → Med → Low

**Sort (khusus Progress view)**
- `Terakhir diedit` — card terbaru diedit muncul paling atas per kolom
- `Terbaru dibuat` — card terbaru dibuat muncul paling atas

**Task card menampilkan:**
- Judul (diperbesar, font-weight 600)
- Preview deskripsi (max 2 baris)
- Badge priority (High / Med / Low)
- Avatar + nama semua assignee
- Footer: `Diedit [nama] · [tanggal] [jam]` atau `Selesai · [tanggal] [jam]`
- `overdue X hari` dalam teks merah — muncul di bawah footer kalau task_date sudah lewat dan belum selesai

**Drag & drop** — geser card antar kolom untuk update status secara langsung. Drop zone aktif saat drag.

---

### My Tasks

Semua task yang di-assign ke user yang sedang login.

- Dikelompokin: **Sedang dikerjakan** (todo + inprogress) di atas, **Selesai** di bawah
- Diurutkan berdasarkan priority: High → Med → Low
- Tidak ada checkmark — grup "Selesai" pakai strikethrough + opacity

---

### Backlog

Task dengan status `todo` yang `task_date`-nya sudah lewat hari ini.

- Diurutkan dari paling lama tertunda di atas
- Badge hari berwarna: merah (≥7 hari), kuning (3–6 hari), abu-abu (<3 hari)
- Tombol `✓ Selesai` untuk mark done langsung tanpa buka modal
- Badge angka merah di sidebar menunjukkan jumlah task tertunda

---

### Tim View

View historis dengan filter kombinasi.

**Filter yang tersedia:**
- **Orang** — satu anggota, kombinasi, atau semua
- **Status** — To do / In progress / Selesai / Semua
- **Tanggal** — from–to date picker (default: hari ini)

**Tampilan:**
- Single person dipilih → flat list diurutkan tanggal terbaru di atas
- Multiple / semua orang → dikelompokin per anggota tim

---

### Modal Task (Buat & Edit)

Dibuka via FAB (+), shortcut `N`, atau klik card mana saja.

**Field yang tersedia:**

| Field | Wajib | Default |
|---|---|---|
| Status | ✓ | To do |
| Judul | ✓ | — |
| Deskripsi | — | kosong |
| Prioritas | ✓ | Med |
| Tanggal task | ✓ | Hari ini |
| Assign ke | ✓ min. 1 | — |

**Validasi:** title kosong atau tidak ada assignee → field highlight merah + toast notifikasi.

**Riwayat perubahan:** tampil 3 entri terbaru. Kalau lebih, ada tombol `Lihat X perubahan lainnya` untuk expand. Setiap entri mencatat: siapa yang edit, field apa, nilai sebelum dan sesudah, dan timestamp.

---

### Notifikasi

Bell icon di kanan atas topbar. Badge merah muncul kalau ada notif yang belum dibaca.

- Notif dikirim ketika user di-assign ke task yang baru dibuat atau task yang assignee-nya diupdate
- Klik item notif → langsung jump ke task yang relevan
- `Tandai dibaca` per item, atau `Tandai semua dibaca`
- Realtime: notif masuk otomatis tanpa refresh

---

### Fitur Lainnya

**Jam WITA** — jam digital detik per detik di sidebar, disesuaikan timezone Bali (UTC+8).

**Realtime sync** — perubahan dari user lain tampil otomatis di semua tab yang sedang buka app, tanpa perlu refresh. Powered by Supabase Realtime.

**Responsive** — di window ≤700px (e.g. PowerToys 1/6 layout), sidebar disembunyikan dan app otomatis beralih ke Priority view.

---

## Keyboard Shortcuts

| Shortcut | Aksi |
|---|---|
| `N` | Buka modal buat task baru |
| `Esc` | Tutup modal |
| `Ctrl + Enter` | Simpan task (berlaku dari field manapun di modal) |
| `←` `→` | Navigasi antar tombol Status atau Priority di modal |
| `Space` | Pilih Status / Priority yang sedang difokus, lalu pindah ke field berikutnya |
| `Enter` | Pindah ke field berikutnya (Judul → Deskripsi → Priority → Tanggal → Assignee) |
| `Shift + Enter` | Baris baru di dalam Deskripsi |
| `↑` `↓` | Navigasi antar nama di bagian Assign ke |

---

## Struktur File

```
tim-planner/
├── index.html          # Halaman login
├── app.html            # Main app (semua view + logic)
├── css/
│   └── main.css        # Semua styling (per section dengan komentar)
└── js/
    ├── supabase.js     # Inisialisasi Supabase client
    ├── auth.js         # Login, session, profiles
    └── tasks.js        # CRUD task, notifikasi, realtime, helper functions
```

---

## Skema Database

### Tabel `profiles`
Profil user yang terhubung ke Supabase Auth.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid | Primary key, sama dengan auth.users.id |
| `name` | text | Nama tampil di app |
| `avatar_color` | text | Warna hex untuk avatar inisial |

### Tabel `tasks`
Task utama.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `title` | text | Judul task |
| `description` | text | Deskripsi opsional |
| `status` | text | `todo` / `inprogress` / `done` |
| `priority` | text | `low` / `med` / `high` |
| `created_by` | uuid | FK → profiles.id |
| `last_edited_by` | uuid | FK → profiles.id |
| `last_edited_at` | timestamptz | Timestamp edit terakhir |
| `created_at` | timestamptz | Timestamp pembuatan |
| `task_date` | date | Tanggal task dijadwalkan |
| `completed_at` | timestamptz | Diisi saat status berubah ke `done` |

### Tabel `task_assignees`
Relasi many-to-many antara task dan user.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `task_id` | uuid | FK → tasks.id (CASCADE) |
| `user_id` | uuid | FK → profiles.id (CASCADE) |

### Tabel `task_history`
Riwayat setiap perubahan field pada task.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid | Primary key |
| `task_id` | uuid | FK → tasks.id (CASCADE) |
| `edited_by` | uuid | FK → profiles.id |
| `field_changed` | text | Nama field yang diubah |
| `old_value` | text | Nilai sebelum perubahan |
| `new_value` | text | Nilai setelah perubahan |
| `edited_at` | timestamptz | Waktu perubahan |

### Tabel `notifications`
Notifikasi per user.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Penerima notifikasi, FK → profiles.id |
| `task_id` | uuid | FK → tasks.id |
| `type` | text | Tipe notif (saat ini: `assigned`) |
| `message` | text | Teks notifikasi |
| `is_read` | boolean | Status baca, default false |
| `created_at` | timestamptz | Waktu notif dibuat |
| `created_by` | uuid | Pengirim, FK → profiles.id |

---

## Alur Sistem

### Auth Flow

```
User buka index.html
    ↓
getSession() dicek
    ↓ session ada          ↓ tidak ada
redirect app.html      tampil form login
    ↓
signInWithPassword(email, password)
    ↓ sukses              ↓ gagal
redirect app.html     tampil pesan error
```

User baru hanya bisa dibuat oleh admin via Supabase Dashboard → Authentication → Users → Invite user. Tidak ada open sign-up.

### Task Flow

```
User klik FAB atau tekan N
    ↓
openCreateModal() — reset semua field, default status: todo
    ↓
User isi form, klik Simpan atau Ctrl+Enter
    ↓
validateForm() — cek title & assignee
    ↓ valid
createTask(taskData, assigneeIds, userId)
    ↓
INSERT ke tabel tasks
    ↓
INSERT ke tabel task_assignees
    ↓
INSERT notifikasi untuk assignee baru (kecuali diri sendiri)
    ↓
Supabase Realtime trigger → semua tab reload otomatis
```

### Realtime Flow

```
App init → subscribeToTasks(callback)
    ↓
Supabase buka koneksi WebSocket
    ↓
Siapapun edit task di tab lain
    ↓
Supabase broadcast event ke semua subscriber
    ↓
callback() → loadTasks() → re-render view
```

### Overdue Logic

Task dianggap overdue kalau:
- `task_date` < hari ini
- `status` ≠ `done`

Jumlah hari dihitung: `Math.floor((today - task_date) / 86400000)`

Task overdue muncul di Backlog dan di card kanban (teks merah di bawah footer).

---

## Setup & Deployment

### Development (localhost)

1. Clone / download folder `tim-planner`
2. Buka di VS Code
3. Install ekstensi **Live Server**
4. Klik kanan `index.html` → Open with Live Server
5. Buka di browser: `http://localhost:5500`

### Deploy ke Netlify

1. Buka [netlify.com](https://netlify.com), login
2. Drag & drop folder `tim-planner` ke Netlify dashboard
3. Salin URL yang digenerate (contoh: `https://ith-planner.netlify.app`)
4. Buka Supabase → Authentication → URL Configuration:
   - **Site URL** → ganti ke URL Netlify
   - **Redirect URLs** → tambahkan URL Netlify
5. Update juga `localhost:5500` tetap ada di Redirect URLs kalau masih mau development lokal

---

## Manajemen User

### Tambah User Baru

1. Supabase Dashboard → Authentication → Users
2. Klik **Invite user**
3. Masukkan email anggota tim
4. User menerima email invite, klik link, set password sendiri
5. Setelah login pertama, profil dibuat otomatis dengan nama dari email prefix dan warna avatar random

### Ganti Password User

Supabase Dashboard → Authentication → Users → klik user → Send password reset email

### Hapus User

Supabase Dashboard → Authentication → Users → klik user → Delete user
Data task dan history tidak ikut terhapus (foreign key diset ke `SET NULL` untuk history, CASCADE untuk assignees).

---

## Konfigurasi Produksi

Yang perlu diubah sebelum dipakai untuk keperluan nyata:

**1. Ganti URL di Supabase**
- Authentication → URL Configuration → Site URL: ganti dari `localhost` ke URL produksi

**2. Buat user beneran**
- Hapus user dummy (`deus@timplanner.com` dll.) dari Supabase → Authentication → Users
- Invite anggota tim dengan email asli mereka

**3. Hapus data dummy**
```sql
DELETE FROM notifications;
DELETE FROM task_history;
DELETE FROM task_assignees;
DELETE FROM tasks;
```

**4. Review Row Level Security**
Semua tabel sudah punya RLS aktif. Kebijakan yang berlaku: user hanya bisa akses data kalau sudah login (authenticated). Tidak ada pembatasan per-user — semua anggota tim bisa baca dan edit semua task. Ini sesuai desain awal (tim kecil, flat hierarchy).

**5. Backup rutin**
Supabase free tier tidak punya backup otomatis. Untuk backup manual: Database → Backups di Supabase dashboard (tersedia di paid plan), atau export manual via SQL Editor:
```sql
COPY tasks TO STDOUT WITH CSV HEADER;
```

---

## Catatan Teknis

**Tech stack:**
- Frontend: HTML5, CSS3, Vanilla JavaScript (ES Modules)
- Backend: Supabase (PostgreSQL + Auth + Realtime)
- Hosting: Netlify (static)
- Font: DM Sans + DM Mono (Google Fonts)

**Browser yang didukung:** Chrome, Edge, Firefox, Safari versi modern. Tidak didukung: IE.

**Batas Supabase free tier:**
- Database: 500MB
- Bandwidth: 5GB/bulan
- Realtime: 200 concurrent connections
- Auth: unlimited users

Untuk tim 3 orang dengan pemakaian normal, free tier lebih dari cukup.
