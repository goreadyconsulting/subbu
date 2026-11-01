# Charitha's Space ♡

A birthday surprise that becomes Charitha's private personal website.

## Features

- Birthday homepage and **private birthday letter** (letter stored in Supabase; not in public source)
- Memory diary that discovers photos and MP4 videos from private Supabase Storage automatically, including nested folders
- Gallery captioning, private MP4 playback, and media removal, including files uploaded directly in Supabase
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
3. Upload JPG, PNG, WebP, GIF, AVIF or MP4 files directly into the bucket. The bucket root works; folders work too (for example `memories/` or `videos/`).
4. Once the owner signs in to the website, **Memories** discovers these images and MP4 clips automatically. No SQL INSERT into `public.photos` is required. She can play videos and add captions inside the site.

Website uploads allow images up to 10 MB and MP4 videos up to 50 MB; the actual Supabase project-wide file-size limit also applies (Free plan: maximum 50 MB). The bucket remains private. For larger videos, check the project plan and global Storage limit, and prefer dashboard/resumable upload. MP4s encoded with H.264 video and AAC audio offer the broadest browser compatibility. If you delete a file from Supabase Storage, it disappears from the diary on the next sign-in or data refresh.

## Architecture

Static `index.html`, `styles.css`, `app.js`; a pinned Supabase JS client is loaded from ESM CDN. Database, ownership and storage policies live in Supabase project `mmheljndcdhzzuobjaxz`. The original schema is in `supabase/schema.sql`; additional applied database migrations are tracked in the Supabase dashboard's migration history and can be inspected there.

Access restrictions: the public landing page is visible, but personal photos, notes, daily rituals and birthday message are only accessible to the claimed owner.
