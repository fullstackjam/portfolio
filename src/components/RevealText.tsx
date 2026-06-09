import { motion, useInView } from 'motion/react';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';

// useLayoutEffect on the client (runs before paint, avoids flash); useEffect on the server (no SSR warning).
const useIso = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

interface Props {
  text: string;
  accent?: string;
  className?: string;
  delay?: number;
}

/** Splits a heading into words and reveals them with a gentle upward stagger. SSR-visible; static under reduced-motion; no above-fold flash. */
export default function RevealText({ text, accent, className = '', delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [hidden, setHidden] = useState(false);

  useIso(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;
    // Only pre-hide elements that start below the fold; above-fold stays visible (no flash).
    if (el.getBoundingClientRect().top > window.innerHeight * 0.9) setHidden(true);
  }, []);

  const words = text.split(' ');
  const show = !hidden || inView;
  const accentNorm = accent ? accent.replace(/[.,]/g, '') : undefined;

  return (
    <span ref={ref} className={className}>
      {words.map((w, i) => {
        const isAccent = accentNorm && w.replace(/[.,]/g, '') === accentNorm;
        return (
          <Fragment key={i}>
            {/* mask wrapper: padding/negative-margin gives descenders (g, p, y) room so they aren't clipped */}
            <span
              style={{
                display: 'inline-block',
                overflow: 'hidden',
                verticalAlign: 'top',
                paddingBottom: '0.15em',
                marginBottom: '-0.15em',
              }}
            >
              <motion.span
                style={{ display: 'inline-block', fontStyle: isAccent ? 'italic' : undefined }}
                className={isAccent ? 'accent' : undefined}
                initial={false}
                animate={{ y: show ? '0%' : '110%', opacity: show ? 1 : 0 }}
                transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: delay + i * 0.06 }}
              >
                {w}
              </motion.span>
            </span>
            {/* space lives OUTSIDE the overflow:hidden mask so it isn't trimmed */}
            {i < words.length - 1 ? ' ' : ''}
          </Fragment>
        );
      })}
    </span>
  );
}
