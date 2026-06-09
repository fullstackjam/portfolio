import { useMagnetic } from '../lib/useMagnetic';
import type { ReactNode } from 'react';

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}

export default function MagneticLink({ href, children, className = '', external = false }: Props) {
  const ref = useMagnetic<HTMLAnchorElement>(100, 0.35);
  const ext = external ? { target: '_blank', rel: 'noopener' } : {};
  return (
    <a ref={ref} href={href} className={`inline-block ${className}`} {...ext}>
      {children}
    </a>
  );
}
