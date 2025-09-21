// netlify/functions/ask-gemini.js
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Use POST' }) };
  }

  try {
    const { question } = JSON.parse(event.body || '{}');
    if (!question) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing question' }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing GEMINI_API_KEY' }) };
    }

    // Gemini 1.5 Flash endpoint (fast, cost-friendly)
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `You are a clear, friendly physics tutor. Explain briefly, show a formula when useful.\n\nQ: ${question}` }]
        }
      ],
      generationConfig: { temperature: 0.4 }
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Upstream error', detail: errTxt }) };
    }

    const data = await r.json();
    const answer = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || 'No answer.';
    return { statusCode: 200, body: JSON.stringify({ answer }) };

  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
