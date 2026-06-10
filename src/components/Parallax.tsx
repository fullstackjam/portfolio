import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import type { ReactNode } from 'react';

/** Scroll-linked vertical drift — used on exactly one element (the hero headline). Static under reduced-motion. */
export default function Parallax({ children, amount = 60, className = '' }: { children: ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, amount]);

  return (
    <motion.div ref={ref} style={{ y: reduced ? 0 : y }} className={className}>
      {children}
    </motion.div>
  );
}
