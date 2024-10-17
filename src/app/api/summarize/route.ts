import OpenAI from "openai";

const openai = new OpenAI();

export async function summarize(text: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0125",
    messages: [{ role: "user", content: `Summarize this text: ${text}` }],
    max_tokens: 150,
  });

  return response;
}
