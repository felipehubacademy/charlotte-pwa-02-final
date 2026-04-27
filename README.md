# Charlotte AI

AI-powered English learning app built with React Native (Expo) and a Next.js backend.

## Structure

```
charlotteai/
  apps/
    mobile/   — React Native app (Expo SDK 54, Expo Router v6)
    web/      — Next.js backend (API routes, admin, legal pages)
```

## apps/mobile

The native app published on App Store and Google Play.

**Stack:** Expo SDK 54, Expo Router v6, NativeWind v4, expo-audio, Azure Speech, OpenAI Realtime API, RevenueCat, Supabase Auth

**Running locally:**
```bash
cd apps/mobile
npm install
npx expo start
```

**OTA update:** pushed automatically on every commit to `main` that touches `apps/mobile/**` via GitHub Actions.

**Native build:** `eas build` — run from `apps/mobile/`.

## apps/web

Next.js project deployed on Vercel (`charlotte.hubacademybr.com`).

Not a user-facing app — serves as the API backend for the mobile app and hosts support pages.

**What lives here:**
- `/api/*` — all API routes consumed by the mobile app
- `/admin` — internal dashboard (metrics, notifications, users)
- `/privacidade` and `/termos` — legal pages linked from app stores
- `/open` and `/auth/confirm` — deep link intermediaries for Supabase auth email flows

**Running locally:**
```bash
cd apps/web
npm install
npm run dev
```

## Environment variables

Each app has its own `.env.local`. See Vercel dashboard (apps/web) and EAS dashboard (apps/mobile) for production values.
