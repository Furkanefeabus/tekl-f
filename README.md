# 📱 Teklif Hazırlama Uygulaması

Modern ve kullanıcı dostu teklif yönetim sistemi.

## 🚀 Teknolojiler

### Frontend
- React Native (Expo)
- TypeScript
- Zustand (State Management)
- Axios (API İstekleri)

### Backend
- FastAPI (Python)
- Supabase (Database)
- JWT Authentication

## 📦 Kurulum

### Frontend
```bash
cd frontend
npm install
npx expo start
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

## 🌐 Deploy

### Netlify (Frontend)
- Build command: `npx expo export -p web`
- Publish directory: `frontend/dist`
- Environment variables:
  - `EXPO_PUBLIC_BACKEND_URL`: Railway backend URL

### Railway (Backend)
- Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `SUPABASE_ANON_KEY`
  - `SECRET_KEY`

## 📝 Özellikler

- ✅ Kullanıcı girişi ve kayıt
- ✅ Teklif oluşturma ve yönetimi
- ✅ Ürün yönetimi
- ✅ Müşteri yönetimi
- ✅ Ödeme takibi
- ✅ İstatistikler ve raporlar

## 🔗 Canlı Demo

- Frontend: https://bartesteklif.netlify.app
- Backend: https://web-production-a949a.up.railway.app
