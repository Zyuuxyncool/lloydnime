# GitHub Actions Snapshot Setup untuk Otakudesu Data

## 🎯 Apa ini?

Setup otomatis yang scrape data dari Otakudesu API **setiap 5 menit** dan simpan snapshot ke repo GitHub. Frontend baca dari snapshot itu (5 menit fresh, bukan live).

## 📁 File yang ditambahkan:

```
.github/
  workflows/
    scrape-otakudesu.yml       ← GitHub Actions workflow
scripts/
  scrape-snapshot.js           ← Script untuk scrape data
src/app/libs/
  otakudesu-snapshot-helper.js ← Helper client untuk fetch snapshots
public/
  api-snapshots/               ← Folder untuk JSON snapshots (auto-generated)
    home.json
    schedule.json
    anime.json
    genre.json
```

## 🚀 Cara Kerja:

1. **GitHub Actions menjalankan setiap 5 menit:**
   - Fetch data dari API (`https://api-otakudesu-zeta.vercel.app`)
   - Simpan hasilnya ke JSON files di `public/api-snapshots/`
   - Auto-commit dan push ke repo

2. **Frontend membaca data:**
   - Prioritas 1: GitHub Raw snapshots (5 menit fresh)
   - Prioritas 2: Fallback ke live API (kalau GitHub fails)
   - Data selalu ada, tidak pernah kosong

3. **CDN Gratis:**
   - GitHub Raw pakai Cloudflare CDN
   - Response cepat dari mana pun user

## ✅ Setup Checklist:

- [x] GitHub Actions workflow di-push (`834d6ef`)
- [x] Scrape script siap
- [ ] **Tunggu 5 menit pertama** untuk workflow jalan
- [ ] Update frontend untuk pakai snapshots

## 📋 Next Steps:

### 1. Lihat Workflow Status:

- Buka: https://github.com/Zyuuxyncool/lloydnime/actions
- Cari workflow "Scrape Otakudesu Data"
- Tunggu workflow pertama selesai (5-10 menit)

### 2. Verify Snapshots Generated:

Kalau workflow sukses, akan ada folder:
```
public/api-snapshots/
  ├── home.json
  ├── schedule.json
  ├── anime.json
  └── genre.json
```

Check di: https://github.com/Zyuuxyncool/lloydnime/tree/main/public/api-snapshots

### 3. Update Frontend (Pilih Salah Satu):

**Opsi A: Gunakan Snapshot Helper (Recommended)**
```javascript
import { fetchOtakudesuEndpoint } from '@/app/libs/otakudesu-snapshot-helper';

// Di server component atau API route:
const result = await fetchOtakudesuEndpoint('home');
const data = result.data; // Snapshot atau fallback ke live API
```

**Opsi B: Langsung ke GitHub Raw (Simple)**
```javascript
const githubRawUrl = 'https://raw.githubusercontent.com/Zyuuxyncool/lloydnime/main/public/api-snapshots';

// Fetch snapshot:
const response = await fetch(`${githubRawUrl}/home.json`);
const data = await response.json();
```

## 💡 Keuntungan Setup Ini:

✅ **Gratis selamanya** (GitHub Actions free tier)  
✅ **5 menit fresh** (bukan 3 jam delay atau realtime yang rawan 403)  
✅ **Data tidak pernah hilang** (snapshot selalu tersimpan)  
✅ **Global CDN** (Cloudflare dari GitHub Raw)  
✅ **Backup otomatis** (snapshot di-commit ke repo)  
✅ **No manual intervention** (fully automated)

## ⚙️ Konfigurasi:

Edit `.github/workflows/scrape-otakudesu.yml` untuk:

**Ubah interval (default 5 menit):**
```yaml
- cron: '*/5 * * * *'  # Format cron
```

Contoh interval lain:
- `'0 * * * *'` = Setiap jam
- `'0 */6 * * *'` = Setiap 6 jam
- `'*/15 * * * *'` = Setiap 15 menit

**Ubah endpoint yang di-scrape:**
Edit `scripts/scrape-snapshot.js`, ubah array `ENDPOINTS`.

## 🐛 Troubleshooting:

**Workflow tidak run?**
- Cek: https://github.com/Zyuuxyncool/lloydnime/actions
- Buka workflow, lihat logs
- Mungkin ada permission issue dengan git push

**Snapshots tidak ter-generate?**
- Cek API di-reach: `https://api-otakudesu-zeta.vercel.app/otakudesu/home`
- Kalau 403 Forbidden, API sedang diblok upstream
- Workflow akan retry dan fallback dengan baik

**Private repo?**
- Untuk public repo (ini), snapshots bisa diakses siapa saja
- Safe karena hanya data anime, bukan credential

## 📊 Workflow Quota:

- **Free tier:** 2,000 minutes/bulan
- **5 menit interval:** ~288 runs/bulan × 2 detik = ~10 menit/bulan (plenty)
- **Aman untuk gratis selamanya**

---

Sekarang tinggal tunggu workflow jalan pertama kali, terus update frontend pakai helper! 🚀
