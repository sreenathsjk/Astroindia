# 🌟 AstroAI India

> Vedic Astrology + AI Predictions — Production SaaS

A full-stack Next.js 14 SaaS app combining authentic Vedic astrology calculations (Swiss Ephemeris) with Claude AI-powered predictions, Firebase auth, Redis caching, and Razorpay payments.

---

## 🚀 Quick Start (5 minutes)

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/astroai-india.git
cd astroai-india

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in all values in .env.local

# 4. Run locally
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
astroai-india/
├── app/
│   ├── page.tsx                    # Entry point (auth gate)
│   ├── layout.tsx                  # Root layout + fonts
│   ├── globals.css                 # Global styles
│   └── api/
│       ├── kundli/generate/        # POST: Generate Kundli, GET: Fetch Kundli
│       ├── chat/                   # POST: AI chat, GET: Chat history
│       ├── daily/                  # GET: Daily prediction (cached)
│       ├── dosha/                  # GET: Dosha analysis + remedies
│       └── payment/                # POST: Razorpay create + verify
├── components/
│   ├── LoginPage.tsx               # Firebase OTP auth
│   ├── AppShell.tsx                # Nav + page router
│   ├── KundliPage.tsx              # Kundli form + chart
│   ├── ChatPage.tsx                # AI astrologer chat
│   ├── DailyPage.tsx               # Daily predictions
│   ├── Dashboard.tsx               # Life insights dashboard
│   └── PricingPage.tsx             # Plans + Razorpay checkout
├── lib/
│   ├── astrology.ts                # Swiss Ephemeris engine
│   ├── ai.ts                       # Claude API integration
│   ├── redis.ts                    # Caching layer
│   ├── geo.ts                      # Geocoding utility
│   └── firebase/
│       ├── client.ts               # Firebase client SDK
│       └── admin.ts                # Firebase Admin SDK
├── hooks/
│   ├── useAuth.ts                  # Firebase auth state
│   ├── useKundli.ts                # Kundli generation
│   └── usePayment.ts               # Razorpay payments
└── types/index.ts                  # Full TypeScript types
```

---

## 🔑 Environment Variables

Copy `.env.example` → `.env.local` and fill in:

### Firebase (Client)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project → Add Web App → Copy config
3. Enable **Authentication → Phone** sign-in
4. Create **Firestore Database** (start in production mode)

### Firebase (Admin)
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key" → Download JSON
3. Paste entire JSON as one line in `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON`

### Anthropic Claude API
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create API key → paste as `ANTHROPIC_API_KEY`

### Redis (Upstash — recommended for Vercel)
1. Go to [upstash.com](https://upstash.com) → Create Redis database
2. Copy "Redis URL" → paste as `REDIS_URL`

### Razorpay
1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Settings → API Keys → Generate Key
3. Copy Key ID and Secret

### Google Maps
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable "Geocoding API" and "Time Zone API"
3. Create API key → paste as `GOOGLE_MAPS_API_KEY`

---

## 🌍 Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Or via GitHub:**
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → "Add New Project"
3. Import your GitHub repo
4. Add all environment variables in Vercel dashboard
5. Click Deploy ✅

---

## 🪐 Swiss Ephemeris Setup

The `sweph` npm package requires ephemeris data files:

```bash
# After npm install, download ephemeris files
# Place in /ephe folder at project root
# Download from: https://www.astro.com/swisseph/ephe/
# Required: seas_18.se1, semo_18.se1, sepl_18.se1
mkdir ephe
# Download and place .se1 files here
```

The app falls back to mathematical approximation if `sweph` is unavailable (good enough for demo; use real files for production accuracy).

---

## 💰 Monetization Setup

Plans:
- **Free**: 5 questions/day — No setup needed
- **Pro** (₹99/month): Unlimited questions
- **Report** (₹299): Full life report PDF
- **Per Question** (₹10): Single question

All payments go through Razorpay. Test mode enabled by default — switch to live keys when ready.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS |
| Auth | Firebase Phone Auth (OTP) |
| Database | Firebase Firestore |
| Cache | Redis (Upstash) |
| AI | Anthropic Claude API |
| Astrology | Swiss Ephemeris (sweph) |
| Payments | Razorpay |
| Geocoding | Google Maps API |
| Deployment | Vercel |

---

## 📱 Features

- ✅ OTP-based mobile authentication
- ✅ Vedic Kundli generation (Lagna, planets, houses, Nakshatra, Dasha)
- ✅ North Indian chart visualization
- ✅ AI astrologer chat with context injection
- ✅ Daily predictions with transit analysis
- ✅ Dosha detection (Manglik, Kaal Sarp, Shani, Pitru, Gand Mool)
- ✅ Remedy engine (gemstone, mantra, pooja, charity)
- ✅ Life dashboard with career/marriage/wealth scores
- ✅ Multi-language support (8 Indian languages)
- ✅ Razorpay payments with quota management
- ✅ Redis caching for <2s response times
- ✅ Mobile-first responsive design

---

## 📞 Support

Built with ❤️ for India.

