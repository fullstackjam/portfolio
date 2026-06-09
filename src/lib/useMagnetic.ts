import { useEffect, useRef } from 'react';
import { magneticOffset } from './magnetic';

/** Attach to an element to make it ease toward the pointer. No-op for touch / reduced-motion. */
export function useMagnetic<T extends HTMLElement>(radius = 120, strength = 0.4) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    el.style.transition = 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1)';
    el.style.willChange = 'transform';

    const onMove = (e: PointerEvent) => {
      const { x, y } = magneticOffset({ x: e.clientX, y: e.clientY }, el.getBoundingClientRect(), radius, strength);
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    const reset = () => { el.style.transform = 'translate(0px, 0px)'; };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', reset, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', reset);
    };
  }, [radius, strength]);

  return ref;
}
