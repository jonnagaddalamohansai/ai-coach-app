export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { question, profile } = req.body;

  const system = `You are a voice-friendly coach. Answer the question in a natural,
spoken style: short sentences, no bullet points, no markdown, 60-90 seconds when spoken.
Use this background about the user where relevant: ${profile || "none provided"}.
If the question is behavioral, use the STAR structure. If technical, explain simply
first, then add one concrete example.`;

  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: question }] }],
      }),
    }
  );
  const data = await r.json();
  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No answer returned.";
  res.status(200).json({ answer });
}