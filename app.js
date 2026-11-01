
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
  claimError: "", loading: true, saving: false, photoUrls: {}, letter: ""
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
function landing() {
  return `
    <header class="topbar container">
      <div class="brand">charitha<span>♡</span></div>
      <div class="header-right"><span class="tiny-note">a little something, just for you</span>
        <button class="button button-outline button-small" data-action="login">Your space ↗</button>
      </div>
    </header>
    <main>
      <section class="hero container">
        <div class="hero-copy">
          <div class="date-pill"><b>✳</b> 01 November · A special day</div>
          <h1>Happy birthday, <em>Charitha.</em> ♡</h1>
          <p class="intro">Some people deserve more than just a birthday wish.
          So here's a tiny corner of the internet that's entirely yours — for memories, little thoughts,
          everyday wins, and everything in between.</p>
          <div class="hero-actions">
            <button class="button button-dark" data-action="login">Step inside your space <span aria-hidden="true">↗</span></button>
            <button class="button button-light" data-action="letter">A letter, just for you ♡</button>
          </div>
          <p class="hero-footnote">made with a whole lot of love & a little bit of magic ✦</p>
        </div>
        <div class="collage" aria-hidden="true">
          <div class="paper-card card-back"><div class="card-pattern alt"></div></div>
          <div class="paper-card card-middle"><div class="card-pattern"><span class="flower">✿</span></div></div>
          <div class="paper-card card-front">
            <div class="front-sticker">♡</div>
            <div><p class="front-label">all things lovely</p><div class="front-caption">your story is the pretty part</div></div>
          </div>
          <div class="tape"></div><div class="floating-star">✳</div>
          <div class="floating-heart">♡</div><div class="caption-tape">just for you!</div>
        </div>
      </section>
      <div class="waves"></div>
      <section class="container">
        <div class="section-intro"><div class="eyebrow">A place to call your own</div>
          <h2>Little things, <em class="italic">lovingly kept.</em></h2>
          <p>No pressure, no perfection. Just somewhere to keep the moments and thoughts that matter to you.</p>
        </div>
        <div class="feature-grid">
          <article class="feature-card feature-rose"><div class="feature-numeral">01 / your memories</div>
            <h3>Photo diary</h3><p>A home for all the pictures that make you smile.</p><div class="feature-doodle">✿</div></article>
          <article class="feature-card feature-lav"><div class="feature-numeral">02 / your thoughts</div>
            <h3>Notes to self</h3><p>Big dreams, tiny reminders, thoughts worth holding onto.</p><div class="feature-doodle">✎</div></article>
          <article class="feature-card feature-mint"><div class="feature-numeral">03 / your little wins</div>
            <h3>Daily rituals</h3><p>Track the things you love doing. Or don't. Your rules.</p><div class="feature-doodle">☼</div></article>
        </div>
        <div class="bottom-letter"><p>psst... there's a letter waiting for you ♡</p>
          <button class="button button-light" data-action="letter">Open the little letter ↗</button></div>
      </section>
    </main>
    <footer class="footer container"><span>Made especially for Charitha, with ♡</span><span>EST. 01 NOV 2026</span></footer>
  `;
}
function loginPage() {
  return `<main class="auth-page">
    <div class="auth-card">
      <div class="auth-icon">♡</div><div class="eyebrow">Your own little world</div>
      <h1>Welcome, Charitha.</h1>
      <p>Your memories and notes are private. Sign in with your email to open your space.</p>
      <form data-form="login">
        <label class="form-label" for="email">Your email address</label>
        <input id="email" class="field" type="email" name="email" required autocomplete="email" placeholder="you@example.com" maxlength="254">
        <button class="button button-dark" type="submit">Email me a sign-in link →</button>
      </form>
      ${state.loginSent ? '<div class="feedback">The link is on its way! Open it in this browser to come back here. Check spam too.</div>' : ""}
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
    ["gallery", "▧", "Photo diary"],
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
        <span class="nav-emoji">${icon}</span>${name}</button>`).join("")}
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
  const completedToday = state.logs.filter(a => a.completed_on === todayKey()).length;
  const recentNotes = state.notes.slice(0, 3);
  return `<section>
    <div class="eyebrow">✳ Welcome to your space</div><h1 class="page-title">Hello, lovely <em>Charitha.</em></h1>
    <p class="muted" style="margin-bottom:32px">A home for little moments, big feelings, and everything that's you.</p>
    <div class="grid-home">
      <div class="welcome-banner"><span class="eyebrow">Something to keep close</span>
        <h2>It's the little things that make a beautiful life.</h2>
        <p>Collect the bits of your story that you never want to lose.</p>
        <button class="button button-light button-small" data-action="view" data-view="birthday">A note, just for you ♡</button>
      </div>
      <div class="today-card"><span class="eyebrow">Today is a good day to begin</span>
        <h3>A fresh little page.</h3><p>Take the day at your own pace.</p>
        <div class="today-date">${new Date().getDate()} <span style="font-size:19px">${new Date().toLocaleDateString("en-IN", { month: "long" })}</span></div>
        <button class="button button-light button-small" data-action="view" data-view="activities">My daily rituals ↗</button>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><b>${state.photos.length}</b><span>Memories kept</span></div>
      <div class="stat"><b>${state.notes.length}</b><span>Notes written</span></div>
      <div class="stat"><b>${completedToday}</b><span>Little wins today</span></div>
    </div>
    <div class="split-row"><h3>Things on your mind</h3><button class="text-button" data-action="view" data-view="notes">Go to notes ↗</button></div>
    <div class="preview-grid">
      ${recentNotes.length ? recentNotes.map(n => `
        <button class="preview-card" data-action="edit-note" data-id="${n.id}">
          <h4>${esc(n.title)}</h4><p>${esc(n.body.slice(0, 105)) || "A little thought tucked away."}</p>
        </button>`).join("") :
        `<div class="empty-inline">No notes yet. That's the beautiful thing about a blank page. ♡
          <button class="text-button" style="display:block;margin-top:9px" data-action="new-note">Write your first note →</button></div>`}
    </div>
    <div class="split-row"><h3>Memory lane</h3><button class="text-button" data-action="view" data-view="gallery">See your gallery ↗</button></div>
    ${state.photos.length ? `<div class="gallery-grid">${state.photos.slice(0,3).map(photoCard).join("")}</div>` :
      `<div class="empty-inline">A gallery waiting for its very first memory. ✿
       <button class="text-button" style="display:block;margin-top:9px" data-action="view" data-view="gallery">Add a photograph →</button></div>`}
  </section>`;
}
function photoCard(p) {
  return `<button class="photo-card" data-action="view-photo" data-id="${p.id}">
    <img loading="lazy" alt="${esc(p.caption || "A saved memory")}" src="${esc(state.photoUrls[p.id] || "")}">
    <span class="photo-caption">${esc(p.caption || "a little moment ♡")}</span>
    <span class="photo-date">${fmt(p.created_at)}</span></button>`;
}
function gallery() {
  return `<section>
    <div class="page-heading"><div><span class="eyebrow">01 / your memories</span>
      <h1 class="page-title">Photo <em>diary.</em></h1>
      <p>A cosy little home for the memories you want to keep.</p></div>
      <label class="button button-dark file-button">+ Add photos
        <input type="file" id="photo-upload" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple aria-label="Upload photos"></label>
    </div>
    ${state.photos.length ? `<p class="muted photo-collection">${state.photos.length} lovely moment${state.photos.length === 1 ? "" : "s"} kept ♡</p>
      <div class="gallery-grid">${state.photos.map(photoCard).join("")}</div>` :
    `<div class="empty-state"><div class="illustration">▧</div>
      <h3>Every picture tells a story.</h3>
      <p>What shall we keep first? Your gallery is private, and every photo is yours to add or remove.</p>
      <label class="button button-pink file-button">Choose your first photos
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple aria-label="Upload your first photos"></label>
    </div>`}
    <p class="mini-hint">Private gallery · JPG, PNG, WebP, GIF or AVIF · Up to 10 MB per photo</p>
  </section>`;
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
  const views = { home, gallery, notes, activities, birthday };
  const body = (views[state.view] || home)();
  app.innerHTML = `<div class="shell">${nav()}<main class="content">${topbar()}${body}</main></div>`;
}
async function loadData() {
  const lower = new Date();
  lower.setDate(lower.getDate() - 100);
  const requests = await Promise.all([
    supabase.from("notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false }),
    supabase.from("photos").select("*").order("created_at", { ascending: false }),
    supabase.from("activities").select("*").order("created_at", { ascending: true }),
    supabase.from("activity_logs").select("*").gte("completed_on", dayKey(lower)),
    supabase.from("birthday_letters").select("body").eq("id", 1).maybeSingle()
  ]);
  const failure = requests.find(r => r.error);
  if (failure) { toast("Couldn't load your space: " + failure.error.message); return; }
  [state.notes, state.photos, state.activities, state.logs] = requests.slice(0, 4).map(r => r.data || []);
  state.letter = requests[4].data?.body || "";
  const urls = await Promise.all(state.photos.map(async photo => {
    const { data } = await supabase.storage.from("charitha-gallery").createSignedUrl(photo.storage_path, 3600);
    return [photo.id, data?.signedUrl || ""];
  }));
  state.photoUrls = Object.fromEntries(urls);
  render();
}
async function syncSession(session) {
  const revision = ++identityRevision;
  state.session = session;
  if (!session) {
    state.owner = false; state.loading = false; state.view = "welcome";
    state.notes = []; state.photos = []; state.activities = []; state.logs = []; state.photoUrls = {}; state.letter = "";
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
  openModal(`<span class="eyebrow">A moment worth keeping</span><h2>Memory lane ♡</h2>
    <img class="modal-photo" src="${esc(state.photoUrls[p.id] || "")}" alt="${esc(p.caption || "Saved photograph")}">
    <form data-form="save-caption" data-id="${p.id}">
      <label class="form-label" for="photo-caption">Give this memory a caption</label>
      <input class="field" name="caption" id="photo-caption" maxlength="400" placeholder="The day I…" value="${esc(p.caption)}">
      <div class="modal-actions">
        <button type="button" class="button button-outline" data-action="delete-photo" data-id="${p.id}">Remove photo</button>
        <button class="button button-dark" type="submit">Save caption</button>
      </div>
    </form>`, true);
}
async function uploadPhotos(files) {
  if (!files.length || !state.owner) return;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  const valid = files.filter(f => allowed.includes(f.type) && f.size <= 10 * 1024 * 1024);
  if (valid.length !== files.length) toast("Some photos were skipped (format or 10 MB limit).");
  if (!valid.length) return;
  toast("Saving your lovely memories…");
  let uploaded = 0;
  for (const file of valid) {
    const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
      "image/gif": "gif", "image/avif": "avif" })[file.type];
    const path = state.session.user.id + "/" + crypto.randomUUID() + "." + ext;
    const up = await supabase.storage.from("charitha-gallery").upload(path, file,
      { upsert: false, contentType: file.type, cacheControl: "3600" });
    if (up.error) { toast("Upload failed: " + up.error.message); continue; }
    const row = await supabase.from("photos").insert({ storage_path: path, caption: "" });
    if (row.error) {
      await supabase.storage.from("charitha-gallery").remove([path]);
      toast("Couldn't save photo details: " + row.error.message);
      continue;
    }
    uploaded++;
  }
  await loadData();
  if (uploaded) toast(uploaded + " photo" + (uploaded === 1 ? "" : "s") + " added to your diary ♡");
}
async function removePhoto(id) {
  const p = state.photos.find(x => x.id === id);
  if (!p || !confirm("Remove this photograph from your private gallery?")) return;
  const rm = await supabase.from("photos").delete().eq("id", id);
  if (rm.error) throw rm.error;
  const file = await supabase.storage.from("charitha-gallery").remove([p.storage_path]);
  if (file.error) toast("Photo entry removed, but file cleanup needs attention.");
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
  } catch (err) { toast(err.message || "Something went wrong. Please try again."); }
});
document.addEventListener("change", async e => {
  if (e.target.matches("input[type=file]")) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    try { await uploadPhotos(files); }
    catch (err) { toast(err.message || "There was a problem uploading."); }
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
      const { error } = await supabase.auth.signInWithOtp({
        email, options: { emailRedirectTo: window.location.origin + window.location.pathname,
          shouldCreateUser: true }
      });
      if (error) throw error;
      state.loginSent = true; state.authError = "";
      render();
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
      const { error } = await supabase.from("photos").update({
        caption: String(values.get("caption") || "").trim()
      }).eq("id", form.dataset.id);
      if (error) throw error;
      closeModal(); await loadData(); toast("Caption saved ♡");
    }
  } catch (err) {
    if (form.dataset.form === "login") { state.authError = err.message; render(); }
    else if (form.dataset.form === "claim") { state.claimError = err.message; render(); }
    else toast(err.message || "Couldn't save right now.");
  } finally { if (submit?.isConnected) submit.disabled = false; }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
supabase.auth.onAuthStateChange((_event, session) => {
  setTimeout(() => syncSession(session), 0);
});
supabase.auth.getSession().then(({ data }) => syncSession(data.session))
  .catch(err => { state.loading = false; toast(err.message); render(); });
