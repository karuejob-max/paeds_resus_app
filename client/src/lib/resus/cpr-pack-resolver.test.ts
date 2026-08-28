import { describe, it, expect } from 'vitest';
import { resolveLifeSupportPack } from './cpr-pack-resolver';

describe('resolveLifeSupportPack', () => {
  it('returns NRP for an explicitly confirmed delivery-room newborn', () => {
    const r = resolveLifeSupportPack(0, false, 'delivery_room');
    expect(r.pack).toBe('NRP');
    expect(r.ageBand).toBe('newborn_delivery_room');
    expect(r.contentVersion).toBe('2025 AHA/AAP reference');
  });

  it('rejects an older patient in a delivery-room NRP context', () => {
    expect(() => resolveLifeSupportPack(24, false, 'delivery_room')).toThrow(/newborn under 1 month/i);
  });

  it('returns PALS for a hospital infant even when under 1 month', () => {
    const r = resolveLifeSupportPack(0);
    expect(r.pack).toBe('PALS');
  });

  it('returns ACLS when puberty flagged', () => {
    const r = resolveLifeSupportPack(60, true);
    expect(r.pack).toBe('ACLS');
  });

  it('returns ACLS at or above 12 years', () => {
    const r = resolveLifeSupportPack(144);
    expect(r.pack).toBe('ACLS');
  });

  it('returns PALS for typical school-age child', () => {
    const r = resolveLifeSupportPack(72);
    expect(r.pack).toBe('PALS');
    expect(r.ageBand).toBe('infant_child');
  });

  it('rejects invalid ages instead of silently selecting a pathway', () => {
    expect(() => resolveLifeSupportPack(Number.NaN)).toThrow(/valid non-negative patient age/i);
    expect(() => resolveLifeSupportPack(-1)).toThrow(/valid non-negative patient age/i);
  });
});
