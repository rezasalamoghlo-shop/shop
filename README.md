# Shop (Next.js + Supabase) 🛍️

This is a full-stack e-commerce starter built with:

- ⚡ Next.js (Frontend on Vercel)
- 🗄️ Supabase (Database + Auth + Storage)
- 🔐 Row Level Security (RLS)

---

## 🧠 Architecture

User → Next.js (Vercel) → Supabase API → PostgreSQL

---

## 🧱 Database Modules

Already configured in Supabase:

- profiles (user data)
- stores (shop owners)
- products (items)
- product_images
- orders
- order_items
- reviews
- messages

---

## 🔐 Auth Flow

Supabase Auth handles:

- email/password login
- user sessions
- auth.uid() linking to DB

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Environment variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📦 Next Steps (IMPORTANT)

### Frontend (Vercel)
- Product listing page
- Product detail page
- Cart system
- Checkout page
- Admin dashboard

### Backend (Supabase)
- RLS policies tuning
- Storage buckets for images
- Payment integration (Stripe/Zarinpal)

---

## ⚙️ Status
Backend is ready. Frontend scaffolding is next.
