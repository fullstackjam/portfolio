import { motion, useInView } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const useIso = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

/** Reveals its children (fade + rise) once when scrolled into view. SSR-visible; static under reduced-motion; no above-fold flash. */
export default function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [hidden, setHidden] = useState(false);

  useIso(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top > window.innerHeight * 0.9) setHidden(true);
  }, []);

  const visible = !hidden || inView;
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 24 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
