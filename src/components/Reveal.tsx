import { motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/** Reveals its children (fade + rise) once when scrolled into view. SSR-visible; static under reduced-motion. */
export default function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const visible = !animated || inView;
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
