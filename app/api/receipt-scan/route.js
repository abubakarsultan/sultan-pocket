import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

const PROMPT = `You are a receipt/bill scanner for a personal finance app used in Pakistan. Look at the attached image of a receipt or bill. Extract these fields as strictly valid JSON, with no markdown fences and no extra text:
{
  "amount": number | null,        // the final total amount paid, as a plain number (no currency symbol, no commas)
  "merchant": string | null,      // the shop/business name if visible
  "date": string | null,          // the transaction date in YYYY-MM-DD format if visible, otherwise null
  "category_guess": string | null,// one of: Food, Transport, Bills, Shopping, Groceries, Entertainment, Health, Education, Rent, Utilities, Other
  "confidence": "high" | "medium" | "low" // your confidence that amount+merchant were read correctly
}
If the image is not a receipt/bill, or text is unreadable, set fields to null and confidence to "low". The receipt may be in English, Urdu, or Roman Urdu, and may be handwritten. Return ONLY the JSON object.`;

function extractJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const rl = rateLimit(request, { limit: 15, windowMs: 60_000, keyPrefix: 'receipt-scan' });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSeconds);

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 503 });
    }

    const body = await request.json();
    const { imageBase64, mimeType } = body || {};
    if (!imageBase64 || !mimeType) {
      return Response.json({ error: 'imageBase64 and mimeType are required.' }, { status: 400 });
    }
    if (!String(mimeType).startsWith('image/')) {
      return Response.json({ error: 'Only image files are supported.' }, { status: 400 });
    }
    // Rough size guard: base64 is ~33% larger than binary; cap around 6MB decoded.
    if (imageBase64.length > 8_000_000) {
      return Response.json({ error: 'Image is too large.' }, { status: 400 });
    }

    const payload = {
      contents: [
        {
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
    };

    const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      return Response.json({ error: `Gemini request failed (${res.status}): ${text.slice(0, 300)}` }, { status: 502 });
    }

    const data = JSON.parse(text);
    const rawText = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    const parsed = extractJson(rawText);

    if (!parsed) {
      return Response.json({ ok: false, reason: 'unparseable', raw: rawText.slice(0, 300) });
    }

    return Response.json({
      ok: true,
      amount: typeof parsed.amount === 'number' ? parsed.amount : null,
      merchant: parsed.merchant || null,
      date: parsed.date || null,
      category_guess: parsed.category_guess || null,
      confidence: parsed.confidence || 'low',
    });
  } catch (e) {
    return Response.json({ error: e?.message || 'Receipt scan failed.' }, { status: 500 });
  }
}
