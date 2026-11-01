# Charitha's Space ♡

A private little home built as a birthday surprise for Charitha: a birthday letter, memories, music, notes, daily rituals, and a tiny cat-knight assistant.

## Website
https://goreadyconsulting.github.io/subbu/

The site is published from `main` using `.github/workflows/deploy.yml`.

## Features
- Birthday landing page and private, personal birthday letter stored in Supabase
- Private **Memories** with JPG/PNG/WebP/GIF/AVIF photos and MP4 video playback
- Private **Our songs** MP3 playlist, with play/pause, previous/next, delete and site uploads
- Private personal notes, and optional daily ritual activity tracker
- Password sign-in, one-time owner claim, and Supabase RLS
- **Sir Meowsalot**, a cute sword-bearing cat knight chatbot, shown only to the owner

## Supabase
Project: `mmheljndcdhzzuobjaxz`

All buckets remain private.

### Preload pictures and videos before the surprise
Go to **Storage → charitha-gallery** and upload photos or MP4s. Files can be uploaded to the root or subfolders. Once the owner signs in, they appear automatically under **Memories** without a separate database row.

### Preload MP3 songs
Go to **Storage → charitha-songs** and upload `.mp3` files. Folders work, too. They'll automatically show up under **Our songs**. You can also upload from the website after signing in. The website upload limit is 50 MB per MP3, subject to the project's global storage limit.

**Only upload music you have the rights to store and share.** No songs are bundled with the repository.

### Account setup
Use **Supabase → Authentication → Users** to create the email/password user. Passwords must never be written to GitHub or frontend code. The first login requires claiming this private website with its gift code. Only that owner can use the private features.

## Gemini cat assistant — your remaining Apps Script step
The frontend and private Supabase Edge Function `charitha-cat` are deployed. The Gemini API key is never kept in GitHub.

1. In Google Apps Script, replace `Code.gs` with the contents of [apps-script/Code.gs](./apps-script/Code.gs).
2. Open **Project settings → Script properties** and set:
   - `GEMINI_API_KEY`: your Gemini API key
   - `CAT_SHARED_SECRET`: the private shared secret provided in our ChatGPT conversation
   - `GEMINI_MODEL` (optional): default `gemini-3.8-flash`; change to a model your Gemini key can access
3. Deploy as **Web app → Execute as Me → Who has access: Anyone**. This is safe only with the shared secret check in the provided code.
4. Give the resulting `https://script.google.com/macros/s/.../exec` URL to ChatGPT. It will be saved server-side to `public.cat_assistant_settings.apps_script_url` in Supabase.
5. The cat will start answering after the URL is configured. No frontend changes are needed.

The chat is sent to a **Supabase Edge Function** which checks the signed-in owner, then forwards a limited conversation to Apps Script. The Edge Function adds the matching secret; Apps Script calls Gemini. Google Apps Script ContentService redirects are followed by the Edge Function, avoiding browser cross-origin problems.

Until Apps Script is connected, the assistant appears with a friendly setup-in-progress message instead of pretending Gemini is active.

## Project files
- `index.html`, `styles.css`, `app.js`: site + private data
- `assistant.js`, `assistant.css`: cat-knight chatbot
- `assets/sir-meowsalot.webp`: generated knight-cat mascot; SVG fallback also included
- `apps-script/Code.gs`: copy-paste backend without any API keys
- `supabase/schema.sql`: original database schema; later migrations applied in Supabase

Personal notes/photos, chat auth tokens, the Gemini API key, and the shared secret should **never** be committed to this public repository.
