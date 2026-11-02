// Kitteshwar is Charitha's private cat-knight companion.
// Gemini calls travel via a protected Supabase function; no secret keys in the browser.
const endpoint = "https://mmheljndcdhzzuobjaxz.supabase.co/functions/v1/charitha-cat";
const publishableKey = "sb_publishable_r0_1AHq4VCNCcjRwJnFJeQ_eHSmnX3d";
const root = document.createElement("aside");
root.id = "catbot-root";
root.hidden = true;
root.setAttribute("aria-label", "Kitteshwar assistant");
root.innerHTML = `
  <button id="catbot-launch" type="button" aria-expanded="false" aria-controls="catbot-panel" aria-label="Chat with Kitteshwar">
    <img src="./assets/sir-meowsalot.svg" alt="Tiny cat knight holding a sword">
    <span class="catbot-twinkle" aria-hidden="true">✦</span>
  </button>
  <section id="catbot-panel" role="dialog" aria-label="Kitteshwar chat" aria-modal="false" hidden>
    <div class="catbot-header">
      <img src="./assets/sir-meowsalot.svg" alt="" class="catbot-head-avatar">
      <div class="catbot-heading"><strong>Kitteshwar</strong>
        <small>your tiny cat-knight companion ♡</small></div>
      <button type="button" id="catbot-close" aria-label="Close chat">×</button>
    </div>
    <div id="catbot-scroll" role="log" aria-live="polite" aria-relevant="additions text">
      <div class="catbot-bubble bot">Hi, I'm Kitteshwar! 🐾 Your little cat-knight is here for plans, dreams, silly ideas, and anything on your mind. ♡</div>
    </div>
    <div class="catbot-suggestions" aria-label="Conversation starters">
      <button type="button" data-cat-suggest="Give me a tiny pep talk">A little pep talk ✨</button>
      <button type="button" data-cat-suggest="Suggest a sweet journal prompt">Journal idea ✎</button>
      <button type="button" data-cat-suggest="Give me a cute caption idea for a photo">Caption idea ♡</button>
    </div>
    <form id="catbot-form">
      <label class="catbot-sr" for="catbot-input">Chat message</label>
      <textarea id="catbot-input" rows="1" maxlength="1400" placeholder="Ask your tiny knight anything…" required></textarea>
      <button type="submit" id="catbot-send" aria-label="Send message">➤</button>
    </form>
    <p class="catbot-footnote">Little thoughts stay in this chat session. Don't share secrets ♡</p>
  </section>
`;
document.body.appendChild(root);
const launch = root.querySelector("#catbot-launch");
const panel = root.querySelector("#catbot-panel");
const close = root.querySelector("#catbot-close");
const messages = root.querySelector("#catbot-scroll");
const input = root.querySelector("#catbot-input");
const form = root.querySelector("#catbot-form");
const sendButton = root.querySelector("#catbot-send");
let busy = false;
let chatHistory = [];
const ownerIsReady = () => Boolean(window.CharithaAssistant?.isOwner?.());
function syncVisibility() {
  const shouldShow = ownerIsReady();
  root.hidden = !shouldShow;
  if (!shouldShow) {
    panel.hidden = true;
    launch.setAttribute("aria-expanded", "false");
    chatHistory = [];
  }
}
const observer = new MutationObserver(syncVisibility);
observer.observe(document.getElementById("app"), { childList: true, subtree: false });
syncVisibility();
function openChat() {
  panel.hidden = false;
  launch.setAttribute("aria-expanded", "true");
  input.focus();
}
function closeChat() {
  panel.hidden = true;
  launch.setAttribute("aria-expanded", "false");
  launch.focus();
}
launch.addEventListener("click", () => panel.hidden ? openChat() : closeChat());
close.addEventListener("click", closeChat);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !panel.hidden) closeChat();
});
function addMessage(content, type) {
  const bubble = document.createElement("div");
  bubble.className = "catbot-bubble " + type;
  bubble.textContent = content;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}
async function sendMessage(text) {
  text = String(text || "").trim().slice(0, 1400);
  if (!text || busy || !ownerIsReady()) return;
  busy = true;
  sendButton.disabled = true;
  input.value = "";
  addMessage(text, "user");
  const wait = addMessage("Kitteshwar is thinking… ✨", "thinking");
  try {
    const jwt = await window.CharithaAssistant.accessToken();
    if (!jwt) throw new Error("Please sign in to chat.");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + jwt,
        "apikey": publishableKey
      },
      body: JSON.stringify({
        message: text,
        history: chatHistory.slice(-10),
        page: window.CharithaAssistant.currentPage()
      }),
      signal: AbortSignal.timeout(35000)
    });
    const data = await response.json();
    if (!response.ok || !data?.ok || typeof data.reply !== "string") {
      throw new Error(typeof data?.error === "string" ? data.error : "Kitteshwar couldn't get a response right now. Please try again.");
    }
    wait.remove();
    addMessage(data.reply, "bot");
    chatHistory.push({ role: "user", text }, { role: "assistant", text: data.reply });
    chatHistory = chatHistory.slice(-10);
  } catch (error) {
    wait.remove();
    addMessage(error?.message || "Kitteshwar couldn't reach the AI service just now.", "notice");
  } finally {
    busy = false;
    sendButton.disabled = false;
    input.focus();
  }
}
form.addEventListener("submit", event => {
  event.preventDefault();
  sendMessage(input.value);
});
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage(input.value);
  }
});
root.querySelectorAll("[data-cat-suggest]").forEach(chip => {
  chip.addEventListener("click", () => {
    if (panel.hidden) openChat();
    sendMessage(chip.dataset.catSuggest);
  });
});
