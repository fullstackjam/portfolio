import type { APIRoute } from 'astro';
import { buildSystemPrompt } from '../../lib/chat-prompt';

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json().catch(() => null) as { message?: unknown } | null;
  if (!body || typeof body.message !== 'string' || !body.message.trim()) {
    return new Response(JSON.stringify({ error: 'message required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
  const apiKey = env?.DEEPSEEK_API_KEY as string | undefined;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Rate limit: 20 requests per IP per day
  const kv = env?.GITHUB_CACHE as KVNamespace | undefined;
  if (kv) {
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const key = `rl:${ip}`;
    const count = parseInt((await kv.get(key)) ?? '0', 10);
    if (count >= 20) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await kv.put(key, String(count + 1), { expirationTtl: 86400 });
  }

  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: body.message.trim() },
      ],
      stream: true,
      max_tokens: 300,
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
};
