# Sultan Pocket

Sultan Pocket is a personal finance web app — multi-tool dashboard (expense
tracker, budget, bills, savings goals, and more), user accounts with private
profile pages, and a blog. Live at [sultanpocket.online](https://sultanpocket.online).

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19
- **Backend:** Next.js API routes (`app/api/`) + [Supabase](https://supabase.com) (Postgres, Auth, Storage)
- **Animation/UI:** Framer Motion
- **Hosting:** Vercel

## Project structure

```
app/            All pages and routes (frontend), incl. app/api/ for backend routes
components/     Reusable UI components
  wallet/       Components specific to the expense-tracker / wallet tool
  assistant/    In-app assistant widget
lib/            Shared helper code (Supabase client, wallet calculations, rate limiting)
supabase/       Database schema — numbered SQL files, run in order (see supabase/README.md)
public/         Static assets, PWA manifest, service worker, icons
docs/           Setup notes and project history (see docs/CHANGELOG.md, docs/ADMIN_DASHBOARD.md)
play-store-assets/  Assets and listing copy for the Play Store (Android/TWA) submission
```

## Local setup

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase project URL/key
npm run dev
```

Database setup: run the numbered files in `supabase/` in order, once, in the
Supabase SQL Editor — see `supabase/README.md` for details.

## Scripts

- `npm run dev` — start the local dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint the codebase
- `npm test` — run the wallet calculation tests

## Deployment

Deployed on Vercel from this repo. See `LAUNCH_CHECKLIST.md` for the
remaining steps to publish the Android app to the Play Store.


### Latest security/database migration
Run `supabase/15_auth_security_and_integrity.sql` after migrations 01-14. It adds trusted password status, invite/email-password support, lending transaction types and integrity indexes.
