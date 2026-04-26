import { describe, expect, it } from 'vitest';
import type { Card, GameRules } from './types';
import { dealerShouldHit } from './rules';

const H17: GameRules = {
  numDecks: 6,
  dealerHitsSoft17: true,
  doubleAfterSplit: true,
  maxSplitHands: 4,
  splitAcesOneCard: true,
};

function c(rank: Card['rank']): Card {
  return { rank, suit: 'clubs' };
}

describe('dealerShouldHit', () => {
  it('hits below 17', () => {
    expect(dealerShouldHit([c('10'), c('6')], H17)).toBe(true);
  });

  it('stands on hard 17', () => {
    expect(dealerShouldHit([c('10'), c('7')], H17)).toBe(false);
  });

  it('hits soft 17 when H17', () => {
    expect(dealerShouldHit([c('A'), c('6')], H17)).toBe(true);
  });

  it('stands on soft 18', () => {
    expect(dealerShouldHit([c('A'), c('7')], H17)).toBe(false);
  });

  it('stands on soft 17 when S17', () => {
    const s17 = { ...H17, dealerHitsSoft17: false };
    expect(dealerShouldHit([c('A'), c('6')], s17)).toBe(false);
  });
});
