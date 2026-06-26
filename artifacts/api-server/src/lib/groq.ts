import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function groqChat(systemPrompt: string, userPrompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return completion.choices[0]?.message?.content ?? "";
}

export async function groqJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: systemPrompt + "\n\nRespond ONLY with valid JSON. No markdown, no explanation, just raw JSON.",
      },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });
  const content = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}
