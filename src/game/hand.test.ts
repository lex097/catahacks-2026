import { describe, expect, it } from 'vitest';
import type { Card } from './types';
import { getHandValue, isBlackjack, isBust, isPair } from './hand';

function c(rank: Card['rank'], suit: Card['suit'] = 'clubs'): Card {
  return { rank, suit };
}

describe('getHandValue', () => {
  it('counts hard totals', () => {
    expect(getHandValue([c('10'), c('7')])).toEqual({ total: 17, soft: false });
  });

  it('uses one ace as 11 when legal', () => {
    expect(getHandValue([c('A'), c('6')])).toEqual({ total: 17, soft: true });
  });

  it('falls back to hard when soft would bust', () => {
    expect(getHandValue([c('A'), c('K'), c('9')])).toEqual({ total: 20, soft: false });
  });

  it('handles multiple aces', () => {
    expect(getHandValue([c('A'), c('A'), c('9')])).toEqual({ total: 21, soft: true });
  });
});

describe('isBlackjack', () => {
  it('is true only for two-card 21', () => {
    expect(isBlackjack([c('A'), c('K')])).toBe(true);
    expect(isBlackjack([c('10'), c('6'), c('5')])).toBe(false);
  });
});

describe('isBust', () => {
  it('detects bust', () => {
    expect(isBust([c('10'), c('6'), c('7')])).toBe(true);
    expect(isBust([c('10'), c('6')])).toBe(false);
  });
});

describe('isPair', () => {
  it('treats 10-value cards as pair', () => {
    expect(isPair([c('K'), c('10')])).toBe(true);
  });
});
