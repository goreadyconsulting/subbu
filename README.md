# Charitha's Space ♡

A private birthday site with two signed-in roles: Subbu and Kittu, collaborative memory messages, tasks, requests, direct chat, and the original birthday features.

## Website
https://goreadyconsulting.github.io/subbu/

The site is published from `main` using `.github/workflows/deploy.yml`.

## Features
- Neutral login first. Birthday content and private letter are shown only after a recognized member signs in.
- Private **Memories** with JPG/PNG/WebP/GIF/AVIF photos and MP4 video playback
- Private **Our songs** MP3 playlist, with play/pause, previous/next, delete and site uploads
- Private personal notes, and optional daily ritual activity tracker
- Two separate roles: Subbu (personal birthday space, assigned tasks, requests) and Kittu (admin, assignment and responses)
- Individual Task, Request, Message and Notification centers with Supabase Row Level Security
- Photo/video tiles display no titles. Each member can independently write a title and message, and the two sealed messages reveal together only after both submit.
- **Sir Meowsalot**, a cute sword-bearing cat knight chatbot, shown only to approved members

## Supabase
Project: `mmheljndcdhzzuobjaxz`

All buckets remain private.

### Preload pictures and videos before the surprise
Go to **Storage → charitha-gallery** and upload photos or MP4s. Files can be uploaded to the root or subfolders. Once the owner signs in, they appear automatically under **Memories** without a separate database row.

### Preload MP3 songs
Go to **Storage → charitha-songs** and upload `.mp3` files. Folders work, too. They'll automatically show up under **Our songs**. You can also upload from the website after signing in. The website upload limit is 50 MB per MP3, subject to the project's global storage limit.

**Only upload music you have the rights to store and share.** No songs are bundled with the repository.

### Two-person accounts and roles

Two confirmed Supabase Auth users are mapped to the `site_members` roles `subbu` and `kittu`.
The membership table stores the exact Auth user UUIDs; the website never grants an admin role based solely on a typed email address or self-reported metadata.

Subbu's role is a member. Kittu has the admin role and can assign tasks, respond to requests, and manage shared media. Passwords are handled by Supabase Auth and are not stored in GitHub. The two-person content is protected with Row Level Security (RLS) and authenticated RPCs.

Both users have private personal task, message, request and notification centers. Kittu can select existing photos/videos when creating a task. Media titles are never shown in the gallery; `memory_entries` only permits the author to read their entry, and `get_memory_reveals()` only returns the complete two-person exchange after both messages exist.

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

The chat is sent to a **Supabase Edge Function** which checks membership in the private site, then forwards a limited conversation to Apps Script. The Edge Function adds the matching secret; Apps Script calls Gemini. Google Apps Script ContentService redirects are followed by the Edge Function, avoiding browser cross-origin problems.

The Google Apps Script deployment URL is stored in Supabase settings and is not published in the GitHub source.

## Project files
- `index.html`, `styles.css`, `app.js`: site + private data
- `assistant.js`, `assistant.css`: cat-knight chatbot
- `duo.js`, `duo.css`: tasks, requests, direct messages, notifications and sealed memory exchanges
- `assets/sir-meowsalot.webp`: generated knight-cat mascot; SVG fallback also included
- `apps-script/Code.gs`: copy-paste backend without any API keys
- `supabase/schema.sql`: original database schema; later migrations applied in Supabase

Personal notes/photos, chat auth tokens, the Gemini API key, and the shared secret should **never** be committed to this public repository.
