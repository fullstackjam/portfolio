import { useState } from 'react';
import type { Footnote } from '../lib/types';

/** The commit-style footnote chip. A `copy` action becomes a click-to-copy
 *  button (with transient "copied" feedback); a `link` action becomes an
 *  external anchor. Visuals come from the shared `.footnote` styles. */
export default function CaseFootnote({ prompt, cmd, note, action }: Footnote) {
  const [copied, setCopied] = useState(false);

  const body = (
    <>
      <span className="prompt">{prompt}</span>
      <span className="fn-body">
        <span className="cmd">{cmd}</span>
        {note && <span className="note"> — {note}</span>}
      </span>
      <span className="fn-action" aria-hidden="true">
        {action.kind === 'copy' ? (copied ? '✓ copied' : '⧉ copy') : '↗'}
      </span>
    </>
  );

  if (action.kind === 'link') {
    return (
      <a
        className="footnote"
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${cmd} — open link`}
      >
        {body}
      </a>
    );
  }

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(cmd);
      ok = true;
    } catch {
      // Fallback for browsers/contexts where the async clipboard API is
      // unavailable or rejects (e.g. document not focused).
      try {
        const ta = document.createElement('textarea');
        ta.value = cmd;
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.setAttribute('readonly', '');
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      className={`footnote${copied ? ' is-copied' : ''}`}
      onClick={copy}
      aria-label={`Copy command: ${cmd}`}
    >
      {body}
    </button>
  );
}
