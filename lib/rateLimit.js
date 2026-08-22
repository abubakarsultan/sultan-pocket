// Lightweight in-memory rate limiter for Next.js API routes.
//
// IMPORTANT (be honest with yourself about this): this store lives in the
// Node.js process memory. On a single long-running server it works fine.
// On serverless/edge platforms with multiple instances (Vercel, etc.) each
// instance has its own counter, so a determined abuser can get more
// requests than the limit by hitting different instances. It still stops
// casual spam/bots cheaply with zero infra. If you outgrow it, swap the
// Map below for Upstash Redis (@upstash/ratelimit) — same call signature.

const buckets = new Map();

// Prevent unbounded memory growth: drop old entries occasionally.
let lastSweep = Date.now();
function sweep(windowMs) {
  const now = Date.now();
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    const fresh = hits.filter((t) => now - t < windowMs);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}

function ipFromRequest(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * @param {Request} request
 * @param {{ limit?: number, windowMs?: number, keyPrefix?: string }} opts
 * @returns {{ ok: boolean, remaining: number, retryAfterSeconds: number }}
 */
export function rateLimit(request, opts = {}) {
  const limit = opts.limit ?? 20;
  const windowMs = opts.windowMs ?? 60_000;
  const key = `${opts.keyPrefix || 'default'}:${ipFromRequest(request)}`;

  sweep(windowMs);

  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);

  const ok = hits.length <= limit;
  const oldest = hits[0];
  const retryAfterSeconds = ok ? 0 : Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));

  return { ok, remaining: Math.max(0, limit - hits.length), retryAfterSeconds };
}

export function rateLimitResponse(retryAfterSeconds) {
  return Response.json(
    { error: 'Too many requests. Please slow down and try again shortly.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}
