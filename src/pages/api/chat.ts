import type { APIRoute } from 'astro';
import type { KVNamespace } from '@cloudflare/workers-types';
import { buildSystemPrompt } from '../../lib/chat-prompt';
import { TOOLS, executeTool } from '../../lib/github-tools';

const DEEPSEEK = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-v4-pro';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
}

function sseFromText(text: string): Response {
  const escaped = JSON.stringify(text);
  const body = `data: {"choices":[{"delta":{"content":${escaped}}}]}\n\ndata: [DONE]\n\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}

async function callDeepSeek(apiKey: string, messages: ChatMessage[], opts: { tools?: unknown; stream: boolean }) {
  return fetch(DEEPSEEK, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 500,
      stream: opts.stream,
      ...(opts.tools ? { tools: opts.tools, tool_choice: 'auto' } : {}),
    }),
  });
}

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

  const ghToken = env?.GITHUB_TOKEN as string | undefined;
  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: body.message.trim() },
  ];

  const phase1 = await callDeepSeek(apiKey, messages, { tools: TOOLS, stream: false });
  if (!phase1.ok) {
    const err = await phase1.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const phase1Json = await phase1.json() as {
    choices: Array<{ message: ChatMessage; finish_reason: string }>;
  };
  const choice = phase1Json.choices[0];
  const toolCalls = choice.message.tool_calls ?? [];

  if (toolCalls.length === 0) {
    return sseFromText(choice.message.content ?? '');
  }

  messages.push(choice.message);
  if (kv) {
    const results = await Promise.all(
      toolCalls.map(async call => {
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* ignore */ }
        const out = await executeTool(call.function.name, args, kv, ghToken);
        return { role: 'tool' as const, tool_call_id: call.id, content: out };
      })
    );
    messages.push(...results);
  } else {
    for (const call of toolCalls) {
      messages.push({ role: 'tool', tool_call_id: call.id, content: 'tool unavailable' });
    }
  }

  const phase2 = await callDeepSeek(apiKey, messages, { stream: true });
  if (!phase2.ok) {
    const err = await phase2.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(phase2.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
};
