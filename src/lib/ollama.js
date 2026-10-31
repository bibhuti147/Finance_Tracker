const PROMPT = `You are reading a payment receipt or payment screenshot.
Return ONLY a JSON object, with no explanation and no markdown, in exactly this shape:
{"transaction_id": "<string>", "amount": <number>, "to_whom": "<string>", "datetime_of_transaction": "<string>"}
Rules:
- transaction_id: the transaction / reference / UTR / order ID as printed. Use "" if none is visible.
- amount: the amount paid as a plain number, no currency symbol or commas.
- to_whom: the name of the person or business that received the money.;
- datetime_of_transaction: the date and time of the transaction of the recieved money`;

// Pull the first {...} block out of the reply, even if the model adds extra text
function parseJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in model reply");
  return JSON.parse(match[0]);
}

export async function extractTransaction(base64) {
  const res = await fetch(`${process.env.EXPO_PUBLIC_OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({
      model: "qwen2.5vl:7b",
      stream: false,
      options: { temperature: 0, num_ctx: 8192 },
      messages: [{ role: "user", content: PROMPT, images: [base64] }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama ${res.status}: ${body.slice(0, 120)}`);
  }

  const data = await res.json();
  console.log("Ollama reply:", data.message.content);
  const raw = parseJson(data.message.content);

  // Clean and validate before it reaches the database
  const amount = Number(String(raw.amount).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Could not read the amount");
  }

  return {
    transaction_id: raw.transaction_id
      ? String(raw.transaction_id).trim()
      : null,
    amount,
    to_whom: raw.to_whom ? String(raw.to_whom).trim() : null,
    datetime_of_transaction: raw.datetime_of_transaction
      ? String(raw.datetime_of_transaction).trim()
      : null,
  };
}
