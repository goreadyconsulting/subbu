# Charitha's Space ♡

A birthday surprise that becomes Charitha's private personal website.

## What is built
- Birthday homepage and a personal letter
- Private photo diary (upload, caption, view, remove)
- Private personal notes (create, edit, pin, delete)
- Optional weekly activity and habit check-in tracker
- Passwordless email login and a one-time owner gift code
- Supabase row-level security and private photo storage

## Publishing
- GitHub repository: https://github.com/goreadyconsulting/subbu
- Expected GitHub Pages address: https://goreadyconsulting.github.io/subbu/
- Go to **Repository Settings → Pages → Build and deployment → Source → GitHub Actions**.
- The supplied `.github/workflows/deploy.yml` workflow publishes the three website files. You may need to rerun it from the Actions tab after enabling Pages.

## Supabase
Project: `mmheljndcdhzzuobjaxz`

The database and private bucket have **already been provisioned**. The applied SQL is documented in `supabase/schema.sql`. Do not rerun this migration blindly.

**Required for email sign-in:** Supabase dashboard → Authentication → URL Configuration → allow `https://goreadyconsulting.github.io/subbu/` in Redirect URLs. Set Site URL to the same address if this Supabase project is dedicated to Charitha's website.

## Giving the gift
1. Share the published site address with Charitha.
2. Privately share the gift code you received in the ChatGPT conversation. It is *not* stored in this repository.
3. She signs in using a magic link, then enters the gift code once to claim ownership.
4. Her gallery, notes and habits are private to the single owner.

The public website is intentionally visible to anyone with the link, but no personal records or private photos are publicly readable. Never publish your plaintext gift code or a Supabase secret/service-role key.

## Technology
Static HTML, CSS, JavaScript, pinned Supabase JavaScript SDK via ESM CDN. No build tools required.

## Photo support
JPG, PNG, WebP, GIF and AVIF, up to 10 MB per image.
