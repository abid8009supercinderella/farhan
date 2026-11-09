import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: "nodejs"
};

const MODEL = "gemini-2.5-flash";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Send a POST request." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Missing GEMINI_API_KEY. Add it in Vercel → Project Settings → Environment Variables, then redeploy."
    });
  }

  try {
    const body = req.body || {};
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return res.status(400).json({ error: "Please type a question first." });
    }
    if (message.length > 10000) {
      return res.status(400).json({ error: "Your question is too long. Please shorten it." });
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const safeHistory = history.slice(-10)
      .filter(x => x && ["user", "model"].includes(x.role) && typeof x.text === "string")
      .map(x => ({
        role: x.role,
        parts: [{ text: x.text.slice(0, 4000) }]
      }));

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Use the stable generateContent endpoint and a widely available Flash model.
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [
        ...safeHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction:
          "You are Bilal Abid AI, a helpful and reliable general-purpose assistant. Answer accurately, clearly, and politely. If you do not know something, say so. Use readable formatting."
      }
    });

    const answer = typeof result.text === "string" ? result.text.trim() : "";
    if (!answer) {
      console.error("Gemini returned no text. Response metadata:", {
        promptFeedback: result.promptFeedback,
        candidates: result.candidates?.length || 0
      });
      return res.status(502).json({
        error: "Gemini returned an empty answer. Try asking in a different way."
      });
    }

    return res.status(200).json({ answer, model: MODEL });
  } catch (err) {
    console.error("Gemini API error:", err);
    const status = Number(err?.status) || Number(err?.code) || 500;
    const raw = String(err?.message || "");

    if (status === 400) {
      return res.status(400).json({ error: "Gemini rejected the request. Check the request and try again." });
    }
    if (status === 401 || status === 403) {
      return res.status(502).json({ error: "Gemini rejected your API key. Create/check your key in Google AI Studio and update GEMINI_API_KEY in Vercel." });
    }
    if (status === 404) {
      return res.status(502).json({ error: `The Gemini model/API was not found for this project. Server detail: ${raw.slice(0, 250)}` });
    }
    if (status === 429) {
      return res.status(429).json({ error: "Gemini API quota or rate limit reached. Check your Google AI Studio usage and billing/quota." });
    }
    return res.status(502).json({
      error: `Gemini request failed (${status}). ${raw.slice(0, 300) || "Check Vercel Function Logs."}`
    });
  }
}