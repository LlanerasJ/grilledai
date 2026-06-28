# Supabase setup — Phase 3 auth (free, no card)

One-time setup to get auth working locally. ~5 minutes.

## 1. Create the project
1. Go to **https://supabase.com** and sign in (GitHub login works).
2. **New project** → pick an org, name it `grilledai`, choose a region near you.
3. Set a **database password** (save it somewhere — you won't need it for auth, but
   you'll want it later for the DB phase).
4. Wait ~2 minutes for it to provision.

## 2. Get the API keys
1. In the project: **Project Settings** (gear) → **API**.
2. Copy these into `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   (These are public-safe — the anon key is meant for the browser. Row-level
   security protects your data later.)

## 3. Configure auth URLs
**Authentication** → **URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: add `http://localhost:3000/auth/callback`

## 4. (Dev convenience) Email confirmation
By default Supabase emails a confirmation link on signup, so you can't log in until
you click it. For fast local testing:
- **Authentication** → **Providers** (or **Sign In / Up**) → **Email** → turn **OFF**
  "Confirm email". Now signup logs you straight in.
- Leave it ON if you'd rather test the real confirmation flow (the `/auth/callback`
  route already handles the link).

## 5. Run it
```
npm run dev
```
Visit http://localhost:3000 → you'll be redirected to `/login`. Sign up, and you'll
land back on the app with your email shown top-right and a Sign out button.

## Notes
- The free tier pauses a project after ~1 week of inactivity; just un-pause it from the
  dashboard when you come back.
- Keys live in `.env.local` (gitignored) — never commit them.
