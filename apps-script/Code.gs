/**
 * Sir Meowsalot • Apps Script Gemini brain
 * Paste into Code.gs and deploy as Web App.
 *
 * Script Properties:
 *   GEMINI_API_KEY     = your Gemini API key
 *   CAT_SHARED_SECRET  = value provided privately by ChatGPT (not in GitHub)
 *   GEMINI_MODEL       = optional model, defaults to gemini-3.8-flash
 *
 * Deploy: Execute as Me; Who has access: Anyone.
 * Calls originate from a private Supabase Edge Function that authenticates
 * Charitha and sends the matching shared secret. No keys belong on the website.
 */
function doGet() {
  return catJson_({ ok: true, service: "Sir Meowsalot", status: "ready" });
}

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty("CAT_SHARED_SECRET");
    var apiKey = props.getProperty("GEMINI_API_KEY");
    if (!secret || !apiKey) return catJson_({ ok: false, error: "Brain isn't configured yet." });
    if (!e || !e.postData || !e.postData.contents) return catJson_({ ok: false, error: "Missing message." });
    var req = JSON.parse(e.postData.contents);
    if (req.secret !== secret) return catJson_({ ok: false, error: "Not authorised." });
    var message = String(req.message || "").trim().slice(0, 1400);
    if (!message) return catJson_({ ok: false, error: "Please type a message." });
    var page = String(req.page || "Charitha's Space").slice(0, 100);

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
      "You are Sir Meowsalot, a tiny valiant cat knight who carries a little sword.",
      "You live in Charitha's Space, a birthday gift website for Charitha Aluru.",
      "Speak warmly, whimsically and playfully, occasionally using charming cat-and-knight imagery.",
      "You are helpful rather than annoying; respond naturally, without repeating 'mew' every line.",
      "Be concise (usually 1-4 sentences); offer more detail when asked.",
      "Help with journal prompts, short notes, motivational encouragement, song ideas,",
      "captions for photos, daily activity suggestions, and navigation.",
      "Sections of the site include Memories (photos/videos), Our songs (MP3 player),",
      "Notes to self, Daily rituals, and a private birthday letter.",
      "You cannot see, read, or modify any private notes, gallery files, songs, or account data.",
      "Never pretend that you can. Do not request passwords, gift codes, or API keys.",
      "Do not claim to be the person who made the website, or speak as the romantic partner.",
      "If feeling overwhelmed, respond kindly without minimising feelings.",
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
        generationConfig: { temperature: 0.8, maxOutputTokens: 900 }
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
    console.error("Sir Meowsalot backend error: " + String(error));
    return catJson_({ ok: false, error: "My knightly magic needs a moment. Please try again!" });
  }
}

function catJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
