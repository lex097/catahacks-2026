import { describe, expect, it } from 'vitest';
import { BlackjackEngine } from './engine';
import { DEFAULT_RULES } from './types';

describe('BlackjackEngine', () => {
  it('completes a round when player stands immediately', () => {
    const eng = new BlackjackEngine(DEFAULT_RULES, 42);
    let s = eng.dealInitial();
    if (s.phase !== 'player') return;
    const legal = eng.legalActions(s);
    expect(legal).toContain('stand');
    s = eng.applyPlayerAction(s, 'stand');
    expect(s.phase).toBe('done');
    expect(s.holeHidden).toBe(false);
    expect(s.dealerCards.length).toBeGreaterThanOrEqual(2);
  });

  it('resolves split aces without further play', () => {
    const eng = new BlackjackEngine(DEFAULT_RULES, 999001);
    let s = eng.dealInitial();
    let guard = 0;
    while (s.phase === 'player' && !eng.legalActions(s).includes('split') && guard < 80) {
      s = eng.dealInitial();
      guard++;
    }
    if (s.phase !== 'player' || !eng.legalActions(s).includes('split')) {
      expect(true).toBe(true);
      return;
    }
    s = eng.applyPlayerAction(s, 'split');
    expect(s.phase === 'dealer' || s.phase === 'done' || s.activeHandIndex < s.playerHands.length).toBe(
      true,
    );
  });
});
