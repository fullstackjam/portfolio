import { describe, it, expect } from 'vitest';
import { magneticOffset } from '../src/lib/magnetic';

const rect = { left: 100, top: 100, width: 100, height: 100 } as DOMRect; // center 150,150

describe('magneticOffset', () => {
  it('returns zero when pointer is outside the radius', () => {
    expect(magneticOffset({ x: 400, y: 400 }, rect, 120, 0.4)).toEqual({ x: 0, y: 0 });
  });

  it('pulls toward the pointer scaled by strength when inside the radius', () => {
    expect(magneticOffset({ x: 180, y: 150 }, rect, 120, 0.4)).toEqual({ x: 12, y: 0 });
  });

  it('returns zero at the exact center', () => {
    expect(magneticOffset({ x: 150, y: 150 }, rect, 120, 0.4)).toEqual({ x: 0, y: 0 });
  });
});
