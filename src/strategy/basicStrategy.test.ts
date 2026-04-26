import { describe, expect, it } from 'vitest';
import { chartMoveForHand, recommendedAction } from './basicStrategy';
import type { GameRules, PlayerHandState } from '../game/types';

const RULES: GameRules = {
  numDecks: 6,
  dealerHitsSoft17: true,
  doubleAfterSplit: true,
  maxSplitHands: 4,
  splitAcesOneCard: true,
};

function card(rank: import('../game/types').Card['rank']) {
  return { rank, suit: 'clubs' as const };
}

function hand(cards: import('../game/types').Card[], opts: Partial<PlayerHandState> = {}): PlayerHandState {
  return {
    cards,
    bet: 1,
    stood: false,
    doubled: false,
    fromSplit: false,
    splitAceDone: false,
    ...opts,
  };
}

describe('chartMoveForHand', () => {
  it('hard 16 vs 10 hits', () => {
    expect(chartMoveForHand([card('10'), card('6')], card('10'), false)).toBe('H');
  });

  it('hard 11 doubles', () => {
    expect(chartMoveForHand([card('5'), card('6')], card('A'), false)).toBe('D');
  });

  it('soft 18 vs dealer 9 hits', () => {
    expect(chartMoveForHand([card('A'), card('7')], card('9'), false)).toBe('H');
  });

  it('8,8 splits vs A', () => {
    expect(chartMoveForHand([card('8'), card('8')], card('A'), true)).toBe('P');
  });

  it('A,A splits', () => {
    expect(chartMoveForHand([card('A'), card('A')], card('6'), true)).toBe('P');
  });
});

describe('recommendedAction', () => {
  it('maps double to hit when not allowed', () => {
    const h = hand([card('2'), card('2'), card('7')]);
    const legal = ['hit', 'stand'] as const;
    const a = recommendedAction(h, card('6'), RULES, 1, [...legal]);
    expect(a).toBe('hit');
  });
});
