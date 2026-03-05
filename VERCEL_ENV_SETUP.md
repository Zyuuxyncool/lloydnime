# 🚀 Vercel Environment Variable Setup

## ⚠️ PENTING: Episode Tidak Muncul?

Jika episode tidak muncul di production (lloydnime.vercel.app), ini karena **Environment Variable belum di-set di Vercel**.

## 📝 Cara Set Environment Variable di Vercel:

### Option 1: Via Vercel Dashboard (Recommended)

1. **Buka Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Pilih project: `lloydnime`

2. **Masuk ke Settings**
   - Click tab **"Settings"** di menu atas
   - Pilih **"Environment Variables"** di sidebar kiri

3. **Tambah Environment Variable**
   - Click tombol **"Add New"**
   - Isi form:
     ```
     Name: NEXT_PUBLIC_API_URL
     Value: https://api-otakudesu-zeta.vercel.app
     ```
   - Select environment: ✅ **Production**, ✅ **Preview**, ✅ **Development**
   - Click **"Save"**

4. **Redeploy Website**
   - Go to tab **"Deployments"**
   - Click titik 3 (•••) di deployment terakhir
   - Pilih **"Redeploy"**
   - Tunggu deployment selesai (~2-3 menit)

### Option 2: Via Vercel CLI (Advanced)

```bash
# Install Vercel CLI jika belum
npm i -g vercel

# Login ke Vercel
vercel login

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Paste value: https://api-otakudesu-zeta.vercel.app

# Trigger redeploy
vercel --prod
```

## ✅ Verification

Setelah redeploy selesai, test:

1. **Cek API Response**
   ```bash
   node test-api.js
   ```
   Should show: `Episode Count: 10` (atau angka lain > 0)

2. **Cek Production Website**
   - Visit: https://lloydnime.vercel.app/detail/yuusha-party-kiyoubinbou-sub-indo
   - Episodes seharusnya muncul
   - Recommended anime seharusnya muncul di bawah

## 🔍 Troubleshooting

### Episode masih tidak muncul?

1. **Clear browser cache** (Ctrl + Shift + R atau Cmd + Shift + R)
2. **Check Vercel Build Logs**:
   - Vercel Dashboard → Deployments → Click latest deployment
   - Check "Building" logs untuk error
3. **Verify environment variable**:
   - Settings → Environment Variables
   - Pastikan `NEXT_PUBLIC_API_URL` ada dan value benar

### API tidak return data?

Test API endpoint langsung:
```bash
# PowerShell
Invoke-RestMethod -Uri "https://api-otakudesu-zeta.vercel.app/anime/anime/yuusha-party-kiyoubinbou-sub-indo"

# Atau browser
https://api-otakudesu-zeta.vercel.app/anime/anime/yuusha-party-kiyoubinbou-sub-indo
```

Seharusnya return JSON dengan `episodeList` array.

## 📚 Reference

- `.env.local` - Local development only (git ignored)
- `.env.example` - Reference untuk environment variables
- `test-api.js` - Script untuk test API response

## ⚡ Quick Commands

```bash
# Test API locally
node test-api.js

# Check git status
git status

# Check current environment
cat .env.local

# Vercel deployment status
vercel ls
```
