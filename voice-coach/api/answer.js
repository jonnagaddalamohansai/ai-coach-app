const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const PROMPTS = {
  answer: (profile) => `You are a voice-friendly speaking coach. Write a sample answer to the
question below in a natural spoken style: short sentences, no bullet points, no markdown,
about 60 to 90 seconds when read aloud. If the question is behavioral, use the STAR structure.
If it is technical, explain simply first, then give one concrete example.
Background about the user (use only what is relevant, never invent facts): ${profile || "none provided"}.`,

  question: (profile, role) => `You are a mock interviewer for the role: ${role || "general"}.
Ask exactly ONE realistic interview question. Output only the question text, nothing else.
User background: ${profile || "none provided"}.`,

  feedback: () => `You are a speaking coach. The user will give a practice interview answer.
Reply in plain text with: 1) Score out of 10 for clarity, structure, and specificity.
2) Two strengths. 3) Two improvements. 4) A tighter rewritten version in spoken style.
Keep it concise.`,
};

export default async function handler(req, res) {
  // open /api/answer in the browser to check which model is deployed
  if (req.method === "GET") {
    return res.status(200).json({ model: MODEL, version: "final-1" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { mode = "answer", text = "", profile = "", role = "" } = req.body || {};

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is missing. Check your .env file." });
  }
  if (!PROMPTS[mode]) {
    return res.status(400).json({ error: "Unknown mode" });
  }

  const system = PROMPTS[mode](profile, role);
  const userText = mode === "question" ? "Ask me a question." : text;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: userText }] }],
        }),
      }
    );

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Gemini request failed" });
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "No answer returned.";
    return res.status(200).json({ result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}