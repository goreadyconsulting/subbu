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
- **Kitteshwar**, a cute sword-bearing cat knight chatbot, shown only to approved members

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

## Vision Board 2027 — Charitha's personal space

Daily Rituals has been replaced in the website navigation by Vision Board 2027. The old activities and logs remain stored; nothing was deleted.

The board is **owned by Charitha (Subbu)**. She alone can view or change the complete private goal records, add/edit/delete a goal, read personal notes, choose status, search Wikimedia Commons reference photos, or upload to the private `charitha-vision` storage bucket. Her board offers a two-column iPhone collage and a List view.

**Omkar (Kittu)** sees a separate, minimal, read-only *Her Dreams · Overview* screen with only goal names, status labels, and aggregate counts. The website never queries the full `vision_board_items` table or requests private picture URLs on his account. Database RLS prevents it, and the authenticated server-side `get_partner_vision_overview()` RPC returns only `title` and `stage`. Kittu's account shows the admin dashboard, collaboration tools, shared Memories, and the small dreams overview instead of Charitha's personal birthday, notes or music sections.

Online photo suggestions are from Wikimedia Commons and preserve author/license/source attribution. External image availability can change; private uploads are preferred for permanent memories.

## Kitteshwar — private Gemini AI assistant

Kitteshwar is the cat-knight companion for both private accounts. The user sees a separate welcome message as Subbu or Kittu, and chat history is discarded when accounts change.

Kitteshwar uses **Supabase Edge Functions → Gemini**. Gemini credentials are held only in Supabase server-side secrets, never in browser code or GitHub.

- Edge Function: `charitha-cat`
- Required secret: `GEMINI_API_KEY` in [Supabase Edge Functions secrets](https://supabase.com/dashboard/project/mmheljndcdhzzuobjaxz/functions/secrets)
- Optional secret: `GEMINI_MODEL` to change the model
- Approved user access: signed-in members of `site_members` only
- Chat history is local to the current session and clears when accounts change.

The original cat-knight artwork is `assets/sir-meowsalot.webp`, used for both the floating chat icon and chat header. A vector fallback is kept for browsers that cannot display WebP.

## Project files
- `index.html`, `styles.css`, `app.js`: site + private data
- `assistant.js`, `assistant.css`: cat-knight chatbot
- `duo.js`, `duo.css`: tasks, requests, direct messages, notifications and sealed memory exchanges
- `assets/sir-meowsalot.webp`: original Kitteshwar cat-knight artwork; SVG fallback for older browsers
- `supabase/schema.sql`: original database schema; later migrations applied in Supabase

Personal notes/photos, chat auth tokens, and the Gemini API key should **never** be committed to this public repository.
