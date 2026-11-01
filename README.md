# Charitha's Space ♡

A birthday surprise that becomes Charitha's private personal website.

## Features

- Birthday homepage and **private birthday letter** (letter stored in Supabase; not in public source)
- Photo diary that discovers images from Supabase Storage automatically, including nested folders
- Gallery captioning and photo removal, even for pictures uploaded directly in Supabase
- Private notes (create, edit, pin, delete)
- Optional daily ritual check-ins
- Email-and-password login with a one-time private owner claim
- Supabase Row Level Security and private photo storage

## Website

GitHub Pages: https://goreadyconsulting.github.io/subbu/

The GitHub Pages workflow is in `.github/workflows/deploy.yml`.

## One-time account setup

1. Open the dedicated Supabase project: https://supabase.com/dashboard/project/mmheljndcdhzzuobjaxz
2. Open **Authentication → Users → Add user → Create new user**.
3. Use the email and password privately provided for Charitha. Select **Auto Confirm User** when available so she can sign in without requiring a verification link.
4. Open the website, sign in, and enter the private birthday gift activation code once. This claims the one-person space for that account.

**Never commit account passwords, gift codes, or Supabase service-role/secret keys.** The public frontend contains only a publishable key.

## Preload photographs before she signs in

1. Open **Supabase → Storage → charitha-gallery**.
2. Keep the bucket **private** (do not make it public).
3. Upload JPEG, PNG, WebP, GIF, or AVIF images directly into the bucket. The bucket root works; folders work too (for example `memories/`).
4. Once the owner signs in to the website, **Photo diary** discovers these images by path automatically. No SQL INSERT into `public.photos` is required. You can later add photo captions within the site.

The bucket has a 10 MB per-file limit. If you delete a picture from Supabase Storage, it disappears from the gallery on the next data refresh/sign-in.

## Architecture

Static `index.html`, `styles.css`, `app.js`; a pinned Supabase JS client is loaded from ESM CDN. Database, ownership and storage policies live in Supabase project `mmheljndcdhzzuobjaxz`. The original schema is in `supabase/schema.sql`; additional applied database migrations are tracked in the Supabase dashboard's migration history and can be inspected there.

Access restrictions: the public landing page is visible, but personal photos, notes, daily rituals and birthday message are only accessible to the claimed owner.
