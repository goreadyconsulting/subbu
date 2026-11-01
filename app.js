
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0?bundle";

const supabase = createClient(
  "https://mmheljndcdhzzuobjaxz.supabase.co",
  "sb_publishable_r0_1AHq4VCNCcjRwJnFJeQ_eHSmnX3d"
);
const app = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const toastEl = document.getElementById("toast");
const state = {
  session: null, owner: false, view: "welcome", notes: [], photos: [],
  activities: [], logs: [], loginSent: false, authError: "",
  claimError: "", loading: true, saving: false, photoUrls: {}, photoRecords: [], letter: "", songs: [], songIndex: -1, birthdaySongUrl: ""
};
let identityRevision = 0;
let toastTimer;

const esc = (s = "") => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[c]);
const fmt = (iso, opts = { month: "short", day: "numeric" }) =>
  new Date(iso).toLocaleDateString("en-IN", opts);
const dayKey = d => {
  const z = n => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
};
const todayKey = () => dayKey(new Date());
const weekDays = () => {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { key: dayKey(d), label: d.toLocaleDateString("en-IN", { weekday: "short" }), num: d.getDate() };
  });
};
function toast(message) {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add("show");
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3400);
}
function button(text, action, klass = "button-dark") {
  return `<button class="button ${klass}" data-action="${action}">${text}</button>`;
}
function compatibilityBlock() {
  return `<section class="container couple-section" id="our-little-equation">
    <div class="couple-section-heading"><span class="eyebrow">AN ENTIRELY UNOFFICIAL LOVE REPORT</span>
      <h2>Charitha <span>×</span> Omkar</h2><p>Two people. Lots of little moments. A rather wonderful situation.</p></div>
    <div class="couple-math"><div class="couple-stat"><span>LOVE FORECAST</span><strong>♡ / ♡</strong><small>more than yesterday, less than tomorrow</small></div>
      <div class="couple-stat"><span>REASONS I LOVE YOU</span><strong>1,000,000+</strong><small>and I am not done counting</small></div>
      <div class="couple-stat"><span>THE PLAN</span><strong>73 years</strong><small>and every birthday in between</small></div></div>
    <div class="couple-letter"><div class="couple-illustration">C <span>♡</span> O</div>
      <p>One very kind, funny, charming girl who notices the little things and looks after people. One boy who is very, very glad he gets to love her.</p>
      <p class="couple-handwritten">Compatibility rating: wildly biased, 100% written by Omkar.</p></div>
  </section>`;
}
function photoByFilename(name) {
  return state.photos.find(p => (p.storage_path || "").split("/").pop().toLowerCase() === name.toLowerCase());
}
function storyMoment(filename, note) {
  const photo = photoByFilename(filename);
  if (!photo) return "";
  const video = isVideo(photo);
  const title = memoryCaption(photo);
  return `<button class="story-moment" data-action="view-photo" data-id="${esc(photo.id)}" aria-label="${video ? "Play" : "View"} ${esc(title)}">
    <div class="story-moment-media">${video
      ? '<div class="story-video-art" aria-hidden="true">▶</div>'
      : `<img src="${esc(state.photoUrls[photo.id] || "")}" alt="${esc(title)}" loading="lazy" decoding="async">`}</div>
    <span class="story-moment-name">${esc(title)} ${video ? "↗" : "♡"}</span>
    <small>${esc(note)}</small>
  </button>`;
}
function landing() {
  return `<header class="topbar container">
    <div class="brand">charitha<span>♡</span></div>
    <button class="button button-outline button-small" data-action="login">Enter your little world ↗</button>
  </header>
  <main class="birthday-landing">
    <section class="container birthday-hero birthday-public-hero">
      <div class="birthday-hero-words">
        <div class="birthday-kicker">01 NOVEMBER 1999 - THE WORLD GOT LUCKIER</div>
        <div class="birth-tiny">a little love note, made just for you</div>
        <h1>Happy birthday, <em>Charitha.</em> ♡</h1>
        <p>Hi Charitha Aluru, thank you for being born. There is so much I want to tell you, and I made this little corner of the internet to keep it all.</p>
        <div class="birthday-primary-actions">
          <button class="button button-dark" data-action="letter">show message ♡</button>
          <button class="button button-pink" data-action="surprise-song">♫ play this song for suprise</button>
        </div>
        <p class="birthday-small-note">A love letter, a song, and a whole lot of you. Sign in to open the surprise.</p>
      </div>
      <div class="birthday-hero-decoration" aria-hidden="true"><div class="birthday-orbit-heart">♡</div><span>to every little moment, and all the ones still to come</span></div>
    </section>
    <section class="container birthday-sky-section">
      <div class="section-intro">
        <span class="eyebrow">THE DAY THE UNIVERSE MET YOU</span>
        <h2>The sky when <em>you arrived.</em></h2>
        <p>1 November 1999 · 3:05 PM IST · Tenali, Andhra Pradesh</p>
      </div>
      <img class="birthday-sky-image" src="./assets/charitha-birth-sky.svg" alt="Illustration of Charitha's afternoon birth sky over Tenali, with the Sun in the southwest" loading="lazy">
      <p class="sky-disclaimer">An astronomical reconstruction of the Sun's position at your birth, not an original photograph or a record of the weather that day.</p>
    </section>
    ${compatibilityBlock()}
    <section class="container birthday-last-note"><p>I missed the first 27 years. How about we make the next 73 count?</p><button class="button button-dark" data-action="login">Step inside our little story ♡</button></section>
  </main>
  <footer class="footer container"><span>For Charitha, with all my love ♡</span><span>01 NOVEMBER</span></footer>`;
}
function loginPage() {
  return `<main class="auth-page">
    <div class="auth-card">
      <div class="auth-icon">♡</div><div class="eyebrow">Your own little world</div>
      <h1>Welcome, Charitha.</h1>
      <p>Your memories and notes are private. Sign in with your email and password to open your space.</p>
      <form data-form="login">
        <label class="form-label" for="email">Your email address</label>
        <input id="email" class="field" type="email" name="email" required autocomplete="username" placeholder="Your email address" maxlength="254">
        <label class="form-label" for="password" style="margin-top:15px">Your password</label>
        <input id="password" class="field" type="password" name="password" required autocomplete="current-password" placeholder="Enter your password">
        <button class="button button-dark" type="submit">Open my space →</button>
      </form>
      ${state.authError ? `<div class="feedback" style="background:#fbe4e3;color:#94505b">${esc(state.authError)}</div>` : ""}
      <button class="back-link" data-action="welcome">← Back to your birthday surprise</button>
    </div></main>`;
}
function claimPage() {
  return `<main class="claim-page">
    <div class="auth-card">
      <div class="auth-icon">✿</div><div class="eyebrow">One last little step</div>
      <h1>Only for you.</h1>
      <p>This is a one-person space. Enter the private gift code to unlock it for the very first time.</p>
      <form data-form="claim">
        <label class="form-label" for="giftcode">Your private gift code</label>
        <input id="giftcode" class="field" name="code" type="text" required autocomplete="off" spellcheck="false" placeholder="Paste the code here">
        <button class="button button-dark" type="submit">Unlock my space ♡</button>
      </form>
      ${state.claimError ? `<div class="feedback" style="background:#fbe4e3;color:#94505b">${esc(state.claimError)}</div>` : ""}
      <button class="back-link" data-action="signout">Not Charitha? Sign out</button>
    </div>
  </main>`;
}
function nav() {
  const entries = [
    ["home", "⌂", "My little world"],
    ["gallery", "▧", "Memories"],
    ["songs", "♫", "Our songs"],
    ["notes", "✎", "Notes to self"],
    ["activities", "☼", "Daily rituals"],
    ["birthday", "♡", "Birthday letter"]
  ];
  return `<aside class="sidebar">
    <div class="sidebar-brand">charitha<span style="color:#c28a97">♡</span></div>
    <div class="sidebar-caption">your happy little place ✦</div>
    <nav class="nav-group" aria-label="Main navigation">
      ${entries.map(([v, icon, name]) => `<button title="${name}" class="nav-button ${state.view === v ? "active" : ""}"
        data-action="view" data-view="${v}" aria-current="${state.view === v ? "page" : "false"}">
        <span class="nav-emoji">${icon}</span><span class="nav-label desktop-nav-label">${name}</span><span class="nav-label mobile-nav-label">${({ home: "Home", gallery: "Memories", songs: "Songs", notes: "Notes", activities: "Rituals", birthday: "Letter" })[v]}</span></button>`).join("")}
    </nav>
    <div class="sidebar-note"><div class="hand">a gentle reminder ♡</div><p>Your life doesn't have to be perfect to be absolutely lovely.</p></div>
    <div class="sidebar-bottom"><span class="muted" style="font-size:11px">Private & yours</span>
      <button data-action="signout">Sign out ↗</button></div>
  </aside>`;
}
function topbar() {
  const now = new Date();
  return `<div class="content-top">
    <div class="date">${now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
    <div class="content-top-right"><span class="hand">one day at a time</span><div class="avatar" title="Charitha">C</div></div>
  </div>`;
}
function home() {
  const hero = photoByFilename("Hero Section.jpg");
  const heroUrl = hero ? state.photoUrls[hero.id] || "" : "";
  const favourite = ["First Selfie.jpg", "Pottery Date.jpg", "First Temple Visit.jpg", "Her blushing.jpg", "Dino-Rawr.jpg", "Cute video.mp4"];
  const notes = ["One of our very first little moments", "A day worth keeping", "Our first temple visit", "Just you being you", "The cutest little rawr", "A tiny moving memory"];
  const moments = favourite.map((name, i) => storyMoment(name, notes[i])).filter(Boolean).join("");
  const birthdaySongReady = Boolean(state.birthdaySongUrl);
  return `<section class="birthday-private-page">
    <div class="birthday-hero birthday-private-hero">
      <div class="birthday-hero-words">
        <span class="birthday-kicker">01 NOVEMBER • YOUR DAY, ALWAYS</span>
        <span class="birth-tiny">a little something for my favourite girl</span>
        <h1>Happy birthday, <em>Charitha.</em> ♡</h1>
        <p>Hi Charitha Aluru, thank you for being born! I couldn't be there for the first 27 years, but I'd really love the remaining 73.</p>
        <p class="birthday-hero-scribble">I love you more than yesterday and not as much as tomorrow.</p>
        <div class="birthday-primary-actions">
          <button class="button button-dark" data-action="letter">show message ♡</button>
          <button class="button button-pink" data-action="surprise-song">♫ play this song for suprise</button>
        </div>
        <div class="birthday-song-inline" aria-live="polite">
          ${birthdaySongReady ? `<audio id="birthday-audio" controls preload="metadata" playsinline src="${esc(state.birthdaySongUrl)}" aria-label="Happy Birthday Song"></audio>
              <small>One little song, just for you. ♡</small>` :
              "<small>The birthday song is still getting its ribbon tied.</small>"}
        </div>
      </div>
      ${heroUrl ? `<div class="birthday-hero-photo"><img src="${esc(heroUrl)}" alt="A special photo of Charitha" fetchpriority="high"><span class="birthday-photo-sticker">my favourite girl ♡</span></div>` :
        '<div class="birthday-hero-decoration" aria-hidden="true"><div class="birthday-orbit-heart">♡</div></div>'}
    </div>
    <div class="birthday-main-letter">
      <span class="eyebrow">A LETTER FROM OMKAR, WITH LOVE</span>
      <h2>To the girl who makes the ordinary feel <em>extraordinary.</em></h2>
      <p>There are a million reasons I love you. The way you are kind to everyone, notice the smallest things, laugh, care, and simply stay completely yourself. I hope you never change any of that.</p>
      <button class="button button-outline" data-action="letter">Read every word I wrote for you ♡</button>
    </div>
    ${moments ? `<section class="birthday-story-section"><div class="birthday-section-caption">
      <span class="eyebrow">TINY CHAPTERS, BIG FEELINGS</span><h2>And a few moments <em>along the way.</em></h2>
      <p>Little pieces of our story, exactly how I named and remember them.</p></div>
      <div class="birthday-story-strip">${moments}</div>
      <button class="birthday-subtle-link" data-action="view" data-view="gallery">All our photos and videos live in Memories ↗</button></section>` : ""}
    <section class="birthday-sky-section">
      <div class="birthday-section-caption"><span class="eyebrow">THE WORLD AT 3:05 PM</span>
        <h2>When the sky first <em>met you.</em></h2>
        <p>1 November 1999 · 3:05 PM IST · Tenali, Andhra Pradesh, India</p></div>
      <img class="birthday-sky-image" src="./assets/charitha-birth-sky.svg" alt="An astronomical reconstruction of the afternoon birth sky in Tenali, with the Sun southwest" loading="lazy">
      <p class="sky-disclaimer">Recreated using the Sun's position for her birth time. Clouds and landscape are illustrative, not historical weather imagery.</p>
    </section>
    ${compatibilityBlock()}
    <section class="birthday-last-note"><p>I'll keep celebrating this birthday until the next one. And then that one, too.</p>
      <button class="button button-light" data-action="view" data-view="birthday">Keep this birthday letter ♡</button></section>
  </section>`;
}
function isVideo(p) {
  return /\.mp4$/i.test(p.storage_path || "");
}
function memoryCaption(p) {
  if ((p.caption || "").trim()) return p.caption.trim();
  const filename = (p.storage_path || "").split("/").pop().replace(/\.(jpg|jpeg|png|webp|gif|avif|mp4)$/i, "");
  const meaningful = filename.replace(/[_-]+/g, " ").trim();
  if (meaningful && !/^[a-f0-9]{8} [a-f0-9 ]{18,}$/i.test(meaningful) && !/^[a-f0-9]{24,}$/i.test(meaningful)) {
    return meaningful.slice(0, 80);
  }
  return isVideo(p) ? "a little film ♡" : "a little moment ♡";
}
function photoCard(p) {
  const video = isVideo(p);
  const caption = memoryCaption(p);
  const visual = video
    ? `<div class="video-preview" aria-hidden="true">
        <div class="filmstrip top"></div>
        <div class="video-play-icon">▶</div>
        <div class="video-type-label">A little film · MP4</div>
        <div class="filmstrip bottom"></div>
      </div>`
    : `<img loading="lazy" alt="${esc(p.caption || "A saved memory")}" src="${esc(state.photoUrls[p.id] || "")}">`;
  return `<button class="photo-card" data-action="view-photo" data-id="${esc(p.id)}" aria-label="${video ? "Play" : "View"} ${esc(caption)}">
    ${visual}
    <span class="photo-caption">${esc(caption)}</span>
    <span class="photo-date">${fmt(p.created_at)}</span></button>`;
}
function gallery() {
  const videos = state.photos.filter(isVideo).length;
  const photos = state.photos.length - videos;
  return `<section>
    <div class="page-heading"><div><span class="eyebrow">01 / your memories</span>
      <h1 class="page-title">Memory <em>diary.</em></h1>
      <p>A cosy little home for the photos and videos you want to keep.</p></div>
      <button type="button" class="button button-outline button-small" data-action="refresh-media" style="margin-right:8px">↻ Refresh</button>
      <label class="button button-dark file-button">+ Add memories
        <input type="file" id="photo-upload" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,.mp4" multiple aria-label="Upload photos and videos"></label>
    </div>
    ${state.photos.length ? `<p class="muted photo-collection">${photos} photo${photos === 1 ? "" : "s"} · ${videos} video${videos === 1 ? "" : "s"} kept ♡</p>
      <div class="gallery-grid">${state.photos.map(photoCard).join("")}</div>` :
    `<div class="empty-state"><div class="illustration">▧</div>
      <h3>Every moment tells a story.</h3>
      <p>What shall we keep first? Your gallery is private, and every photo or video is yours to add or remove.</p>
      <label class="button button-pink file-button">Choose your first memories
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,.mp4" multiple aria-label="Upload your first photos or videos"></label>
    </div>`}
    <p class="mini-hint">Private gallery · JPG, PNG, WebP, GIF, AVIF and MP4 · Up to 10 MB per photo or 50 MB per video (subject to project limits)</p>
  </section>`;
}

function songTitle(song) {
  const leaf = (song.storage_path || "").split("/").pop() || "Untitled";
  return leaf.replace(/\.mp3$/i,"").replace(/^\d{13}-[a-f0-9]{8}-/i,"").replace(/[_-]+/g," ").trim().slice(0,100) || "Untitled";
}
function songs() {
  const selected = state.songs[state.songIndex];
  return `<section>
    <div class="page-heading">
      <div><span class="eyebrow">A soundtrack, just for you ♡</span>
        <h1 class="page-title">Our <em>songs.</em></h1>
        <p>The songs you want to keep close, all in one little place.</p>
      </div>
      <button type="button" class="button button-outline button-small" data-action="refresh-media" style="margin-right:8px">↻ Refresh</button>
      <label class="button button-dark file-button">+ Add a song
        <input type="file" data-media="songs" accept=".mp3,audio/mpeg,audio/mp3" multiple aria-label="Upload MP3 songs">
      </label>
    </div>
    ${state.songs.length ? `
      <div class="songs-layout">
        <div class="song-player-card">
          <div class="song-art" aria-hidden="true"><span>♫</span><small>your little mixtape</small></div>
          <p class="eyebrow" style="margin:20px 0 7px">NOW PLAYING</p>
          <h2 id="song-now-title">${selected ? esc(songTitle(selected)) : "Pick a song, lovely ♡"}</h2>
          <p class="muted" style="font-size:12px">${state.songs.length} song${state.songs.length === 1 ? "" : "s"} in your playlist</p>
          <audio id="song-audio" controls preload="none" controlsList="nodownload" style="width:100%;margin-top:12px" aria-label="Your music player"></audio>
          <div class="song-player-buttons">
            <button class="button button-light button-small" data-action="song-prev" aria-label="Previous song">← Previous</button>
            <button class="button button-light button-small" data-action="song-next" aria-label="Next song">Next →</button>
          </div>
          <p class="mini-hint">Tap a song to play. Music stays private to your account.</p>
        </div>
        <div class="songs-list">
          <div class="eyebrow" style="padding:0 8px 14px">THE PLAYLIST</div>
          ${state.songs.map((song,i)=>`<div class="song-item ${state.songIndex===i?"selected":""}">
            <button class="song-select" data-action="play-song" data-index="${i}" aria-label="Play ${esc(songTitle(song))}">
              <span class="song-number">${state.songIndex===i?"♫":String(i+1).padStart(2,"0")}</span>
              <span class="song-name">${esc(songTitle(song))}</span>
              <span class="song-format">MP3</span>
            </button>
            <button class="delete-mini song-delete" data-action="delete-song" data-index="${i}" aria-label="Delete ${esc(songTitle(song))}" title="Delete song">×</button>
          </div>`).join("")}
        </div>
      </div>` :
      `<div class="empty-state">
        <div class="illustration">♫</div><h3>Every story has a soundtrack.</h3>
        <p>Fill this little music box with the songs that feel like you. Upload MP3s here or directly to Supabase.</p>
        <label class="button button-pink file-button">Choose MP3 songs
          <input type="file" data-media="songs" accept=".mp3,audio/mpeg,audio/mp3" multiple aria-label="Upload your first MP3 songs">
        </label>
      </div>`
    }
    <p class="mini-hint">Private MP3 files · up to 50 MB each, subject to your Supabase project limit</p>
  </section>`;
}
async function listSongs() {
  const bucket = supabase.storage.from("charitha-songs");
  const pending = [""], results = [], visited = new Set();
  while (pending.length) {
    const folder = pending.shift();
    if (visited.has(folder)) continue;
    visited.add(folder);
    let offset=0, batch=[];
    do {
      const {data,error}=await bucket.list(folder,{limit:100,offset,sortBy:{column:"name",order:"asc"}});
      if(error)throw error;
      batch=data||[];
      for (const entry of batch) {
        if(!entry.name || entry.name === ".emptyFolderPlaceholder")continue;
        const path=folder?folder+"/"+entry.name:entry.name;
        if(entry.id==null)pending.push(path);
        else if(/\.mp3$/i.test(entry.name))results.push({storage_path:path,created_at:entry.created_at});
      }
      offset+=batch.length;
    }while(batch.length===100);
  }
  return results.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
}
async function playSong(index) {
  if(!state.owner || !state.songs.length)return;
  index=(index+state.songs.length)%state.songs.length;
  state.songIndex=index;
  if(state.view!=="songs")state.view="songs";
  render();
  const audio=document.getElementById("song-audio");
  if(!audio)return;
  const song=state.songs[index];
  const {data,error}=await supabase.storage.from("charitha-songs").createSignedUrl(song.storage_path,7200);
  if(error)throw error;
  if(state.songIndex!==index || document.getElementById("song-audio")!==audio)return;
  audio.src=data.signedUrl;
  try {await audio.play();}catch {toast("Tap play to start your song ♫");}
}
async function uploadSongs(files) {
  if(!state.owner || !files.length)return;
  let added=0;
  for(const file of files){
    if(!/\.mp3$/i.test(file.name) || file.size>50*1024*1024){
      toast("Only MP3 files up to 50 MB are supported.");continue;
    }
    const safe=file.name.replace(/\.mp3$/i,"").replace(/[^a-zA-Z0-9 _-]/g,"").trim().replace(/\s+/g,"-").slice(0,65)||"song";
    const path=state.session.user.id+"/"+Date.now()+"-"+crypto.randomUUID().slice(0,8)+"-"+safe+".mp3";
    const {error}=await supabase.storage.from("charitha-songs").upload(path,file,{
      contentType:"audio/mpeg",upsert:false,cacheControl:"3600"
    });
    if(error){toast("Song upload failed: "+error.message);continue;}
    added++;
  }
  if(added){await loadData();toast(added+" song"+(added===1?"":"s")+" added to your little mixtape ♡");}
}
async function deleteSong(index){
  const song=state.songs[index];
  if(!song || !confirm("Remove this song from Charitha's music box?"))return;
  const {error}=await supabase.storage.from("charitha-songs").remove([song.storage_path]);
  if(error)throw error;
  state.songIndex=-1;
  await loadData();
  toast("Song removed.");
}

function notes() {
  return `<section>
    <div class="page-heading"><div><span class="eyebrow">02 / your thoughts</span>
      <h1 class="page-title">Notes to <em>self.</em></h1>
      <p>Ideas, dreams, reminders, feelings — there are no rules here.</p></div>
      ${button("+ New note", "new-note")}
    </div>
    ${state.notes.length ? `<div class="note-grid">${state.notes.map(n =>
      `<button class="note-card" data-action="edit-note" data-id="${n.id}">
        <h3>${esc(n.title)}</h3><p>${esc(n.body || "A thought waiting to be written.")}</p>
        <div class="note-bottom"><span>${n.pinned ? "📌 Pinned" : "✎ A little note"}</span>
          <span>${fmt(n.updated_at)}</span></div></button>`).join("")}</div>` :
    `<div class="empty-state"><div class="illustration">✎</div>
      <h3>Here's to fresh pages.</h3>
      <p>Write a thought, make a list, collect a little dream. This space is completely yours.</p>
      ${button("Write your first note", "new-note", "button-pink")}
    </div>`}
  </section>`;
}
function activities() {
  const days = weekDays();
  const count = state.logs.filter(l => l.completed_on === todayKey()).length;
  return `<section>
    <div class="page-heading"><div><span class="eyebrow">03 / your little wins</span>
      <h1 class="page-title">Daily <em>rituals.</em></h1>
      <p>Little things you enjoy doing, with no pressure to be perfect.</p></div>
      ${button("+ New ritual", "new-activity")}
    </div>
    <div class="grid-home" style="margin-bottom:26px">
      <div class="welcome-banner" style="background:#e4eee4;min-height:192px">
        <span class="eyebrow">Your kind of progress</span><h2 style="font-size:34px">Small steps count, too. ✿</h2>
        <p>Tick off the things you did. Missed a day? Nothing to catch up on.</p>
      </div>
      <div class="today-card" style="background:#f6e5e3;min-height:192px">
        <span class="eyebrow">Today</span>
        <h3 style="font-size:35px;margin:auto 0">${count} <span style="font-size:17px">/ ${state.activities.length} done</span></h3>
        <p style="margin:0">Each little win deserves a smile.</p>
      </div>
    </div>
    ${state.activities.length ? `
      <div class="eyebrow">This week · Monday to Sunday</div>
      <div class="week-strip">${days.map(d => `<div class="week-day ${d.key === todayKey() ? "today" : ""}">
        ${d.label}<b>${d.num}</b></div>`).join("")}</div>
      <div class="habit-list">${state.activities.map(a => `
        <div class="habit-row">
          <div class="habit-name"><span class="habit-emoji">${esc(a.emoji)}</span>
            <span>${esc(a.title)}</span></div>
          <div class="habit-day-controls">
            ${days.map(d => {
              const found = state.logs.find(l => l.activity_id === a.id && l.completed_on === d.key);
              return `<button class="check-day ${found ? "done" : ""}" data-action="toggle-activity" data-id="${a.id}" data-date="${d.key}"
                title="${esc(a.title)} on ${d.label} ${d.num}" aria-pressed="${found ? "true" : "false"}">${found ? "✓" : "·"}</button>`;
            }).join("")}
          </div>
          <button class="delete-mini" data-action="delete-activity" data-id="${a.id}" title="Remove this ritual" aria-label="Remove ${esc(a.title)}">×</button>
        </div>`).join("")}</div>
      <p class="mini-hint">Tap any day to mark it done or undo it. Your progress is private.</p>
      ` : `<div class="empty-state"><div class="illustration">☼</div>
        <h3>A little routine, your way.</h3><p>Reading, walking, drinking water, taking a break — whatever makes your days feel like yours.</p>
        ${button("Add a little ritual", "new-activity", "button-pink")}
      </div>`}
  </section>`;
}
function letterBody() {
  return `<div class="birthday-letter">
    <span class="eyebrow">November 01 · A birthday note</span>
    <h2>Dear Charitha, ♡</h2>
${state.letter ? state.letter.split(/\n\s*\n/).filter(Boolean).map(para => `<p class="${para.startsWith("P.S.") ? "letter-postscript" : ""}">${esc(para)}</p>`).join("") : `<p class="muted">Your letter is being tucked into its envelope. Try opening it again in a moment.</p>`}
  </div>`;
}
function birthday() {
  return `<section><span class="eyebrow">A letter, just for you</span>
    <h1 class="page-title">On your <em>birthday.</em></h1>
    <p class="muted">Some words to come back to whenever you want a little warmth.</p>
    ${letterBody()}
  </section>`;
}
function render() {
  if (state.loading) { app.innerHTML = '<div class="loading-screen"><div class="loading-flower">✳</div><p>Getting your space ready…</p></div>'; return; }
  if (!state.session) { app.innerHTML = state.view === "login" ? loginPage() : landing(); return; }
  if (!state.owner) { app.innerHTML = claimPage(); return; }
  const views = { home, gallery, songs, notes, activities, birthday };
  const body = (views[state.view] || home)();
  app.innerHTML = `<div class="shell">${nav()}<main class="content">${topbar()}${body}</main></div>`;
}
async function listPrivateGallery() {
  const bucket = supabase.storage.from("charitha-gallery");
  const pending = [""];
  const objects = [];
  const visited = new Set();
  while (pending.length) {
    const folder = pending.shift();
    if (visited.has(folder)) continue;
    visited.add(folder);
    let offset = 0;
    let page = [];
    do {
      const result = await bucket.list(folder, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
      if (result.error) throw result.error;
      page = result.data || [];
      for (const entry of page) {
        if (!entry.name || entry.name === ".emptyFolderPlaceholder") continue;
        const fullPath = folder ? folder + "/" + entry.name : entry.name;
        if (entry.id == null) {
          pending.push(fullPath);
        } else if (/\.(jpg|jpeg|png|webp|gif|avif|mp4)$/i.test(entry.name)) {
          objects.push({ storage_path: fullPath, created_at: entry.created_at });
        }
      }
      offset += page.length;
    } while (page.length === 100);
  }
  return objects;
}
async function loadData() {
  const lower = new Date();
  lower.setDate(lower.getDate() - 100);
  const requests = await Promise.all([
    supabase.from("notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false }),
    supabase.from("photos").select("*").order("created_at", { ascending: false }),
    supabase.from("activities").select("*").order("created_at", { ascending: true }),
    supabase.from("activity_logs").select("*").gte("completed_on", dayKey(lower)),
    supabase.from("birthday_letters").select("body").eq("id", 1).maybeSingle(),
    listPrivateGallery(),
    listSongs()
  ]);
  const failure = requests.find(r => r.error);
  if (failure) { toast("Couldn't load your space: " + failure.error.message); return; }
  [state.notes, state.photoRecords, state.activities, state.logs] = requests.slice(0, 4).map(r => r.data || []);
  state.letter = requests[4].data?.body || "";
  state.songs = requests[6] || [];
  const birthdayTrack = state.songs.find(song => (song.storage_path || "").split("/").pop().toLowerCase() === "happy birthday song.mp3");
  state.birthdaySongUrl = "";
  if (birthdayTrack) {
    const { data, error } = await supabase.storage.from("charitha-songs").createSignedUrl(birthdayTrack.storage_path, 7200);
    if (!error) state.birthdaySongUrl = data?.signedUrl || "";
  }
  if(state.songIndex >= state.songs.length) state.songIndex = -1;
  const byPath = new Map(state.photoRecords.map(photo => [photo.storage_path, photo]));
  state.photos = requests[5].map(file => {
    const photo = byPath.get(file.storage_path);
    return {
      id: photo?.id || "storage:" + file.storage_path,
      metaId: photo?.id || null,
      storage_path: file.storage_path,
      caption: photo?.caption || "",
      created_at: photo?.created_at || file.created_at || new Date().toISOString()
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const signed = await Promise.all(state.photos.map(async photo => {
    const { data, error } = await supabase.storage.from("charitha-gallery").createSignedUrl(photo.storage_path, 3600);
    if (error) return [photo.id, ""];
    return [photo.id, data?.signedUrl || ""];
  }));
  state.photoUrls = Object.fromEntries(signed);
  render();
}
async function syncSession(session) {
  const revision = ++identityRevision;
  state.session = session;
  if (!session) {
    state.owner = false; state.loading = false; state.view = "welcome";
    state.notes = []; state.photos = []; state.photoRecords = []; state.activities = []; state.logs = []; state.photoUrls = {}; state.letter = ""; state.songs = []; state.songIndex = -1; state.birthdaySongUrl = "";
    render(); return;
  }
  const { data, error } = await supabase.from("site_owner").select("user_id").eq("user_id", session.user.id).maybeSingle();
  if (revision !== identityRevision) return;
  if (error) toast("Unable to verify access: " + error.message);
  state.owner = Boolean(data);
  state.loading = false;
  if (state.owner) {
    if (state.view === "welcome" || state.view === "login") state.view = "home";
    render();
    await loadData();
  } else render();
}
function openModal(markup, wide = false) {
  modalRoot.innerHTML = `<div class="modal-overlay" data-overlay="true">
    <section class="modal ${wide ? "modal-wide" : ""}" role="dialog" aria-modal="true" aria-label="Edit your space">
      <button type="button" class="modal-close" data-action="close-modal" aria-label="Close">×</button>
      ${markup}
    </section></div>`;
  const field = modalRoot.querySelector("input:not([type='checkbox']), textarea");
  if (field) field.focus();
}
function closeModal() { modalRoot.innerHTML = ""; }
function noteEditor(id = null) {
  const n = id ? state.notes.find(x => x.id === id) : null;
  openModal(`<span class="eyebrow">A little thought</span><h2>${n ? "Edit your note" : "New note"} ✎</h2>
    <p class="modal-subtitle">Whatever is on your mind, this is a safe place to put it.</p>
    <form data-form="save-note" data-id="${n?.id || ""}">
      <label class="form-label" for="note-title">Give it a title</label>
      <input class="field" name="title" id="note-title" maxlength="140" required placeholder="A thought worth keeping…" value="${esc(n?.title || "")}">
      <label class="form-label" for="note-body">Your words</label>
      <textarea class="field" name="body" id="note-body" rows="7" placeholder="Dear me…">${esc(n?.body || "")}</textarea>
      <label class="check-option"><input type="checkbox" name="pinned" ${n?.pinned ? "checked" : ""}> Keep this note pinned</label>
      <div class="modal-actions">
        ${n ? `<button type="button" class="button button-outline" data-action="delete-note" data-id="${n.id}">Delete note</button>` : ""}
        <button class="button button-dark" type="submit">Save my note ♡</button>
      </div>
    </form>`);
}
function activityEditor() {
  openModal(`<span class="eyebrow">Just for you</span><h2>A new little ritual ☼</h2>
    <p class="modal-subtitle">Add something you'd enjoy checking in on — without the pressure.</p>
    <form data-form="save-activity">
      <label class="form-label" for="activity-emoji">A tiny symbol</label>
      <input class="field" id="activity-emoji" name="emoji" maxlength="8" value="🌷" style="max-width:100px">
      <label class="form-label" for="activity-title">What would you like to do?</label>
      <input class="field" id="activity-title" name="title" maxlength="80" placeholder="Read for 10 minutes" required>
      <div class="modal-actions"><button type="submit" class="button button-dark">Add to my rituals ♡</button></div>
    </form>`);
}
function photoViewer(id) {
  const p = state.photos.find(x => x.id === id);
  if (!p) return;
  const video = isVideo(p);
  const media = video
    ? `<video class="modal-photo modal-video" controls preload="metadata" playsinline src="${esc(state.photoUrls[p.id] || "")}">
        Your browser cannot play this video.
      </video>`
    : `<img class="modal-photo" src="${esc(state.photoUrls[p.id] || "")}" alt="${esc(p.caption || "Saved photograph")}">`;
  openModal(`<span class="eyebrow">A moment worth keeping</span><h2>Memory lane ♡</h2>
    ${media}
    <form data-form="save-caption" data-id="${esc(p.id)}">
      <label class="form-label" for="photo-caption">Give this ${video ? "video" : "memory"} a caption</label>
      <input class="field" name="caption" id="photo-caption" maxlength="400" placeholder="The day I…" value="${esc(p.caption)}">
      <div class="modal-actions">
        <button type="button" class="button button-outline" data-action="delete-photo" data-id="${esc(p.id)}">Remove ${video ? "video" : "photo"}</button>
        <button class="button button-dark" type="submit">Save caption</button>
      </div>
    </form>`, true);
}
async function uploadPhotos(files) {
  if (!files.length || !state.owner) return;
  const imageTypes = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    "image/gif": "gif", "image/avif": "avif"
  };
  const kind = f => f.type === "video/mp4" || (/\.mp4$/i.test(f.name) && !f.type)
    ? "video/mp4" : f.type;
  const maxSize = f => kind(f) === "video/mp4" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  const valid = files.filter(f => (kind(f) === "video/mp4" || imageTypes[kind(f)]) && f.size <= maxSize(f));
  if (valid.length !== files.length) toast("Some files were skipped. Use JPG/PNG/WebP/GIF/AVIF (10 MB) or MP4 (50 MB).");
  if (!valid.length) return;
  toast("Saving your lovely memories…");
  let uploaded = 0;
  for (const file of valid) {
    const type = kind(file);
    const ext = type === "video/mp4" ? "mp4" : imageTypes[type];
    const path = state.session.user.id + "/" + crypto.randomUUID() + "." + ext;
    const up = await supabase.storage.from("charitha-gallery").upload(path, file,
      { upsert: false, contentType: type, cacheControl: "3600" });
    if (up.error) { toast("Upload failed: " + up.error.message); continue; }
    const row = await supabase.from("photos").insert({ storage_path: path, caption: "" });
    if (row.error) {
      await supabase.storage.from("charitha-gallery").remove([path]);
      toast("Couldn't save media details: " + row.error.message);
      continue;
    }
    uploaded++;
  }
  await loadData();
  if (uploaded) toast(uploaded + " memor" + (uploaded === 1 ? "y" : "ies") + " added to your diary ♡");
}
async function removePhoto(id) {
  const p = state.photos.find(x => x.id === id);
  if (!p || !confirm("Remove this " + (isVideo(p) ? "video" : "photo") + " from your private gallery?")) return;
  const file = await supabase.storage.from("charitha-gallery").remove([p.storage_path]);
  if (file.error) throw file.error;
  if (p.metaId) {
    const rm = await supabase.from("photos").delete().eq("id", p.metaId);
    if (rm.error) toast("Photo removed, but its caption needs cleanup.");
  }
  closeModal(); await loadData(); toast("Memory removed.");
}
async function removeNote(id) {
  if (!confirm("Delete this note? This cannot be undone.")) return;
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
  closeModal(); await loadData(); toast("Note deleted.");
}
async function removeActivity(id) {
  if (!confirm("Remove this ritual and its check-ins?")) return;
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) throw error;
  await loadData(); toast("Ritual removed.");
}
async function toggleActivity(id, day) {
  const existing = state.logs.find(x => x.activity_id === id && x.completed_on === day);
  const result = existing ?
    await supabase.from("activity_logs").delete().eq("id", existing.id) :
    await supabase.from("activity_logs").insert({ activity_id: id, completed_on: day });
  if (result.error) throw result.error;
  if (existing) state.logs = state.logs.filter(x => x.id !== existing.id);
  else {
    const { data } = await supabase.from("activity_logs").select("*").eq("activity_id", id).eq("completed_on", day).single();
    if (data) state.logs.push(data);
  }
  render();
}
document.addEventListener("click", async e => {
  if (e.target.closest("[data-overlay]") && !e.target.closest(".modal")) { closeModal(); return; }
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  try {
    if (action === "welcome") { state.view = "welcome"; state.authError = ""; render(); }
    else if (action === "login") { state.view = "login"; render(); }
    else if (action === "letter") {
      if (!state.session || !state.owner) { state.view = "login"; render(); }
      else openModal(letterBody(), true);
    }
    else if (action === "surprise-song") {
      if (!state.session || !state.owner) { state.view = "login"; render(); }
      else {
        const audio = document.getElementById("birthday-audio");
        if (!audio || !state.birthdaySongUrl) toast("Your birthday song isn't quite ready yet ♡");
        else if (audio.paused) { audio.play().catch(() => toast("Tap the audio player to start the surprise ♫")); }
        else audio.pause();
      }
    }
    else if (action === "close-modal") closeModal();
    else if (action === "view") { state.view = target.dataset.view; render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (action === "signout") { await supabase.auth.signOut(); closeModal(); }
    else if (action === "new-note") noteEditor();
    else if (action === "edit-note") noteEditor(id);
    else if (action === "delete-note") await removeNote(id);
    else if (action === "new-activity") activityEditor();
    else if (action === "delete-activity") await removeActivity(id);
    else if (action === "toggle-activity") await toggleActivity(id, target.dataset.date);
    else if (action === "view-photo") photoViewer(id);
    else if (action === "delete-photo") await removePhoto(id);
    else if (action === "refresh-media") { await loadData(); toast("Your latest memories and songs are here ♡"); }
    else if (action === "play-song") await playSong(Number(target.dataset.index));
    else if (action === "song-next") await playSong(state.songIndex < 0 ? 0 : state.songIndex + 1);
    else if (action === "song-prev") await playSong(state.songIndex < 0 ? 0 : state.songIndex - 1);
    else if (action === "delete-song") await deleteSong(Number(target.dataset.index));
  } catch (err) { toast(err.message || "Something went wrong. Please try again."); }
});
document.addEventListener("change", async e => {
  if (e.target.matches("input[type=file]")) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    try {
      if(e.target.dataset.media==="songs") await uploadSongs(files);
      else await uploadPhotos(files);
    } catch (err) { toast(err.message || "There was a problem uploading."); }
  }
});
document.addEventListener("submit", async e => {
  const form = e.target.closest("[data-form]");
  if (!form) return;
  e.preventDefault();
  const submit = form.querySelector("[type=submit]");
  if (submit?.disabled) return;
  if (submit) submit.disabled = true;
  const values = new FormData(form);
  try {
    const kind = form.dataset.form;
    if (kind === "login") {
      const email = String(values.get("email") || "").trim();
      const password = String(values.get("password") || "");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      state.authError = "";
    }
    else if (kind === "claim") {
      const code = String(values.get("code") || "").trim();
      const { data, error } = await supabase.rpc("claim_charithas_space", { gift_code: code });
      if (error) throw error;
      if (!data) { state.claimError = "That code wasn't recognised. Check your private invitation and try again."; render(); return; }
      state.claimError = ""; state.view = "home";
      await syncSession(state.session);
      toast("Welcome home, Charitha ♡");
    }
    else if (kind === "save-note") {
      const details = {
        title: String(values.get("title") || "").trim() || "Untitled",
        body: String(values.get("body") || ""),
        pinned: values.get("pinned") === "on",
        updated_at: new Date().toISOString()
      };
      const id = form.dataset.id;
      const result = id ? await supabase.from("notes").update(details).eq("id", id) :
        await supabase.from("notes").insert(details);
      if (result.error) throw result.error;
      closeModal(); await loadData(); toast("Your note is safely tucked away ♡");
    }
    else if (kind === "save-activity") {
      const details = {
        title: String(values.get("title") || "").trim(),
        emoji: String(values.get("emoji") || "").trim() || "✨"
      };
      const result = await supabase.from("activities").insert(details);
      if (result.error) throw result.error;
      closeModal(); await loadData(); toast("A little ritual added ♡");
    }
    else if (kind === "save-caption") {
      const photo = state.photos.find(p => p.id === form.dataset.id);
      if (!photo) throw new Error("Photo not found; refresh the gallery.");
      const caption = String(values.get("caption") || "").trim();
      const result = photo.metaId
        ? await supabase.from("photos").update({ caption }).eq("id", photo.metaId)
        : await supabase.from("photos").insert({ storage_path: photo.storage_path, caption });
      if (result.error) throw result.error;
      closeModal(); await loadData(); toast("Caption saved ♡");
    }
  } catch (err) {
    if (form.dataset.form === "login") { state.authError = err.message; render(); }
    else if (form.dataset.form === "claim") { state.claimError = err.message; render(); }
    else toast(err.message || "Couldn't save right now.");
  } finally { if (submit?.isConnected) submit.disabled = false; }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
document.addEventListener("ended",e=>{
  if(e.target?.id==="song-audio" && state.view==="songs" && state.songIndex>=0){
    playSong(state.songIndex+1).catch(err=>toast(err.message||"Couldn't play the next song."));
  }
},true);
window.CharithaAssistant={
  async accessToken(){const {data}=await supabase.auth.getSession();return data.session?.access_token||null;},
  isOwner(){return Boolean(state.owner && state.session);},
  currentPage(){return state.view;}
};
supabase.auth.onAuthStateChange((_event, session) => {
  setTimeout(() => syncSession(session), 0);
});
supabase.auth.getSession().then(({ data }) => syncSession(data.session))
  .catch(err => { state.loading = false; toast(err.message); render(); });
