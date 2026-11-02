import { describe, expect, it } from 'vitest';
import { formatSignal, milestoneLine } from '../../src/ui/hero-copy.js';

describe('formatSignal', () => {
  it('writes hours, minutes and seconds', () => {
    expect(formatSignal(23 * 3600 + 53 * 60 + 12)).toBe('23 hours, 53 minutes and 12 seconds');
  });
  it('adds days and uses singular units', () => {
    expect(formatSignal(86400 + 3600 + 60 + 1)).toBe('1 day, 1 hour, 1 minute and 1 second');
  });
  it('never shows a negative time', () => {
    expect(formatSignal(-5)).toBe('0 hours, 0 minutes and 0 seconds');
  });
});

describe('milestoneLine', () => {
  it('looks ahead before the date', () => {
    expect(milestoneLine({ phase: 'before', deltaSeconds: 16 * 86400 })).toBe(
      'In about 16 days, on 18 November 2026, Voyager 1 first reaches one light-day from Earth.'
    );
  });
  it('says hours and minutes close to the moment', () => {
    expect(milestoneLine({ phase: 'before', deltaSeconds: 7200 })).toContain('In about 2 hours');
    expect(milestoneLine({ phase: 'before', deltaSeconds: 90 })).toContain('In about 2 minutes');
  });
  it('looks back afterwards', () => {
    expect(milestoneLine({ phase: 'after', deltaSeconds: 86400 })).toBe(
      'Voyager 1 first reached one light-day from Earth on 18 November 2026, about 1 day ago.'
    );
  });
});
