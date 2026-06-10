import { animate, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

/** Counts a stat up from 0 when scrolled into view. SSR renders the final value, so no-JS and reduced-motion see the real number. */
export default function CountUp({ value, className = '' }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [display, setDisplay] = useState(value);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setDisplay(0);
    setArmed(true);
  }, []);

  useEffect(() => {
    if (!armed || !inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [armed, inView, value]);

  return (
    <span ref={ref} className={`tnum ${className}`}>
      {display}
    </span>
  );
}
