import { describe, expect, it } from 'vitest';
import { estimateActionEvs } from './monteCarloEv';
import { DEFAULT_RULES } from '../game/types';

describe('estimateActionEvs', () => {
  it('hard 16 vs 6: stand has higher sample EV than hit', () => {
    const dealerUp = { rank: '6' as const, suit: 'diamonds' as const };
    const playerHands = [
      {
        cards: [
          { rank: '10' as const, suit: 'hearts' as const },
          { rank: '6' as const, suit: 'hearts' as const },
        ],
        bet: 1,
        stood: false,
        doubled: false,
        fromSplit: false,
        splitAceDone: false,
      },
    ];
    const ev = estimateActionEvs({
      rules: DEFAULT_RULES,
      dealerUp,
      playerHands,
      activeHandIndex: 0,
      legalActions: ['hit', 'stand'],
      iterationsPerAction: 10_000,
      seed: 0xdecaf,
    });
    expect(ev.ev_mean_units.stand!).toBeGreaterThan(ev.ev_mean_units.hit!);
  });
});
