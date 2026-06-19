import { useState, useRef, useEffect } from 'react';
import { CANNED, CHIPS } from '../lib/console-responses';
import type { Chip } from '../lib/console-responses';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const BLINK_CSS = `
  @keyframes console-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  .console-cursor { animation: console-blink 1.1s steps(1) infinite; display:inline-block; }
`;

const C = {
  bg: '#171311',
  border: '#2a241f',
  titlebar: '#1f1a16',
  prompt: '#f0603a',
  text: '#cfc6b8',
  muted: '#8c8276',
  chipBg: '#221c18',
  inputBg: '#0f0c0a',
  font: "'JetBrains Mono', monospace",
} as const;

export default function Console() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const hasOpened = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(0);
  function nextId() { return ++msgId.current; }

  function handleOpen() {
    if (!hasOpened.current) {
      hasOpened.current = true;
      setMessages([
        { id: nextId(), role: 'user', content: 'whoami' },
        { id: nextId(), role: 'assistant', content: CANNED.whoami },
      ]);
    }
    setOpen(true);
  }

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const preset = CHIPS.find((c): c is Chip => c === trimmed);
    if (preset) {
      setMessages(m => [
        ...m,
        { id: nextId(), role: 'user', content: trimmed },
        { id: nextId(), role: 'assistant', content: CANNED[preset] },
      ]);
      setInput('');
      return;
    }

    setMessages(m => [
      ...m,
      { id: nextId(), role: 'user', content: trimmed },
      { id: nextId(), role: 'assistant', content: '', streaming: true },
    ]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop()!;
        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          try {
            const json = JSON.parse(line.slice(6)) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = json.choices?.[0]?.delta?.content;
            if (token) {
              setMessages(m => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last?.streaming) copy[copy.length - 1] = { ...last, content: last.content + token };
                return copy;
              });
            }
          } catch { /* malformed SSE line — skip */ }
        }
      }
    } catch {
      setMessages(m => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.streaming) copy[copy.length - 1] = { ...last, id: last.id, role: 'assistant', content: 'Error — try again.', streaming: false };
        return copy;
      });
    } finally {
      setMessages(m => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.streaming) copy[copy.length - 1] = { ...last, streaming: false, content: last.content || '(no response)' };
        return copy;
      });
      setStreaming(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!open) {
    return (
      <>
        <style>{BLINK_CSS}</style>
        <button
          onClick={handleOpen}
          aria-label="Open console"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 50,
            display: 'inline-flex', alignItems: 'center', gap: 9,
            background: C.bg, color: C.text,
            border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '9px 14px', cursor: 'pointer',
            fontFamily: C.font, fontSize: 11.5,
          }}
        >
          <span style={{ color: C.prompt }}>❯</span>
          ask me anything
          <span className="console-cursor" style={{ width: '0.55em', height: '1.05em', background: C.text }} />
        </button>
      </>
    );
  }

  return (
    <>
      <style>{BLINK_CSS}</style>
      <div
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          width: 330, maxHeight: 480,
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
          fontFamily: C.font,
          boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Titlebar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', background: C.titlebar,
          borderBottom: `1px solid ${C.border}`, borderRadius: '10px 10px 0 0',
          flexShrink: 0,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', gap: 5 }}>
              {(['#f0603a', '#5a5048', '#5a5048'] as const).map((bg, i) => (
                <i key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: bg, display: 'block' }} />
              ))}
            </span>
            <span style={{ color: C.muted, fontSize: 10 }}>fullstackjam — ask</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close console"
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', padding: 0 }}
          >✕</button>
        </div>

        {/* Messages */}
        <div style={{
          padding: 13, fontSize: 11, color: C.text, lineHeight: 1.6,
          overflowY: 'auto', flex: 1, minHeight: 120,
        }}>
          {messages.map((m) => (
            <div key={m.id} style={{ marginBottom: m.role === 'assistant' ? 11 : 9, whiteSpace: 'pre-wrap' }}>
              {m.role === 'user'
                ? <><span style={{ color: C.prompt }}>❯ </span>{m.content}</>
                : <span style={{ color: m.streaming ? C.muted : C.text }}>
                    {m.content}
                    {m.streaming && (
                      <span className="console-cursor" style={{ width: '0.5em', height: '0.9em', background: C.text, verticalAlign: -2, marginLeft: 2 }} />
                    )}
                  </span>
              }
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 13px 11px', flexShrink: 0 }}>
          {CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => submit(chip)}
              disabled={streaming}
              style={{
                background: C.chipBg, color: C.text,
                border: `1px solid ${C.border}`, borderRadius: 5,
                padding: '4px 9px', fontSize: 10,
                cursor: streaming ? 'not-allowed' : 'pointer',
                opacity: streaming ? 0.5 : 1,
                fontFamily: C.font,
              }}
            >{chip}</button>
          ))}
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 13px 13px', flexShrink: 0 }}>
          <span style={{ color: C.prompt, fontSize: 12 }}>❯</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(input); }}
            disabled={streaming}
            placeholder="ask about me…"
            style={{
              flex: 1, background: C.inputBg,
              border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '7px 10px', color: C.text, fontSize: 11,
              fontFamily: C.font, outline: 'none',
            }}
          />
          <button
            onClick={() => submit(input)}
            disabled={streaming}
            style={{
              background: streaming ? '#5a5048' : C.prompt, color: C.bg,
              borderRadius: 6, padding: '7px 11px', fontSize: 11, fontWeight: 500,
              border: 'none', cursor: streaming ? 'not-allowed' : 'pointer',
              fontFamily: C.font,
            }}
          >↵</button>
        </div>
      </div>
    </>
  );
}
