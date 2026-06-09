import { motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  accent?: string;
  className?: string;
  delay?: number;
}

/** Splits a heading into words and reveals them with a gentle upward stagger. SSR-visible; static under reduced-motion. */
export default function RevealText({ text, accent, className = '', delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const words = text.split(' ');
  const show = !animated || inView;

  return (
    <span ref={ref} className={className} style={{ display: 'inline-block' }}>
      {words.map((w, i) => {
        const isAccent = accent && w.replace(/[.,]/g, '') === accent;
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden' }}>
            <motion.span
              style={{ display: 'inline-block', fontStyle: isAccent ? 'italic' : undefined }}
              className={isAccent ? 'accent' : undefined}
              initial={false}
              animate={{ y: show ? 0 : '110%', opacity: show ? 1 : 0 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: delay + i * 0.06 }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
}
