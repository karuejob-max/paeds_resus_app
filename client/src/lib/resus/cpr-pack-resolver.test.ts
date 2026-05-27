import { describe, it, expect } from 'vitest';
import { resolveLifeSupportPack } from './cpr-pack-resolver';

describe('resolveLifeSupportPack', () => {
  it('returns NRP for delivery room regardless of age', () => {
    const r = resolveLifeSupportPack(24, false, 'delivery_room');
    expect(r.pack).toBe('NRP');
  });

  it('returns NRP for age under 1 month', () => {
    const r = resolveLifeSupportPack(0);
    expect(r.pack).toBe('NRP');
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
  });
});
