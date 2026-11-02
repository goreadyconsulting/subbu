/**
 * Kitteshwar • Apps Script Gemini brain
 * Paste into Code.gs and deploy as Web App.
 *
 * Script Properties:
 *   GEMINI_API_KEY     = your Gemini API key
 *   CAT_SHARED_SECRET  = value provided privately by ChatGPT (not in GitHub)
 *   GEMINI_MODEL       = optional model, defaults to gemini-3.8-flash
 *
 * Deploy: Execute as Me; Who has access: Anyone.
 * Calls originate from a private Supabase Edge Function that authenticates
 * a verified account and sends the matching shared secret. No keys belong on the website.
 */
function doGet() {
  return catJson_({ ok: true, service: "Kitteshwar", status: "ready" });
}

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty("CAT_SHARED_SECRET");
    var apiKey = props.getProperty("GEMINI_API_KEY");
    if (!secret) return catJson_({ ok: false, error: "Kitteshwar is missing CAT_SHARED_SECRET in Apps Script settings." });
    if (!apiKey) return catJson_({ ok: false, error: "Kitteshwar is missing GEMINI_API_KEY in Apps Script settings." });
    if (!e || !e.postData || !e.postData.contents) return catJson_({ ok: false, error: "Missing message." });
    var req = JSON.parse(e.postData.contents);
    if (req.secret !== secret) return catJson_({ ok: false, error: "Not authorised." });
    var message = String(req.message || "").trim().slice(0, 1400);
    if (!message) return catJson_({ ok: false, error: "Please type a message." });
    var page = String(req.page || "Charitha's Space").slice(0, 100);
    var visitor = req.userName === "Kittu" ? "Kittu" : "Subbu";

    var history = Array.isArray(req.history) ? req.history.slice(-10) : [];
    var turns = [];
    history.forEach(function(turn) {
      if (!turn || typeof turn.text !== "string") return;
      var role = turn.role === "assistant" ? "model" : (turn.role === "user" ? "user" : null);
      if (!role) return;
      turns.push({ role: role, parts: [{ text: turn.text.slice(0, 1400) }] });
    });
    turns.push({ role: "user", parts: [{ text: message }] });

    var persona = [
      "You are Kitteshwar, Charitha's little cat-knight AI companion.",
      "You live in Charitha's Space, a birthday gift website for Charitha Aluru from Omkar.",
      "The signed-in visitor is " + visitor + ". Subbu is Charitha; Kittu is Omkar.",
      visitor === "Subbu" ?
        "This is Charitha's personal dream website. Help her plan goals for Vision Board 2027, write creative notes, and work through her ideas." :
        "Help Omkar support Charitha. He has a simplified admin account and a read-only overview of her dreams.",
      "Speak warmly, helpfully and playfully, sometimes using gentle cat-and-knight imagery.",
      "Be concise (usually 1–4 sentences). Offer more detail when asked.",
      "Sections include Memories, Messages, Tasks, Requests, Notifications, and Vision Board 2027.",
      "You cannot access private notes, vision photos, messages, or song files. Never pretend you can.",
      "Do not request passwords, script properties, tokens, or API keys.",
      "Never pretend to be Charitha or Omkar.",
      "Current section: " + page
    ].join("\n");

    var model = String(props.getProperty("GEMINI_MODEL") || "gemini-3.8-flash");
    if (!/^[a-z0-9._-]+$/i.test(model)) return catJson_({ ok: false, error: "Invalid model configuration." });

    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      headers: { "x-goog-api-key": apiKey },
      payload: JSON.stringify({
        systemInstruction: { parts: [{ text: persona }] },
        contents: turns,
        generationConfig: { maxOutputTokens: 900 }
      }),
      followRedirects: true,
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      return catJson_({ ok: false, error: "Gemini is unavailable right now. Check model access, quotas and the Apps Script execution log." });
    }
    var result = JSON.parse(response.getContentText());
    var parts = (((result.candidates || [])[0] || {}).content || {}).parts || [];
    var reply = parts.map(function(part) { return part.text || ""; }).join("\n").trim();
    if (!reply) return catJson_({ ok: false, error: "I'm out of words for a tiny moment. Please try again!" });
    return catJson_({ ok: true, reply: reply });
  } catch (error) {
    console.error("Kitteshwar backend error: " + String(error));
    return catJson_({ ok: false, error: "My knightly magic needs a moment. Please try again!" });
  }
}

function catJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
