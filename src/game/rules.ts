import type { Card, GameRules, PlayerHandState } from './types';
import { getHandValue, isBust } from './hand';

export function dealerShouldHit(cards: Card[], rules: GameRules): boolean {
  const { total, soft } = getHandValue(cards);
  if (total > 21) return false;
  if (total < 17) return true;
  if (total === 17 && soft && rules.dealerHitsSoft17) return true;
  return false;
}

export function canDouble(hand: PlayerHandState, rules: GameRules): boolean {
  if (hand.stood || hand.doubled || hand.splitAceDone) return false;
  if (hand.cards.length !== 2) return false;
  if (hand.fromSplit && !rules.doubleAfterSplit) return false;
  return true;
}

export function canSplit(
  hand: PlayerHandState,
  rules: GameRules,
  currentHandCount: number,
): boolean {
  if (hand.stood || hand.doubled || hand.splitAceDone) return false;
  if (hand.cards.length !== 2) return false;
  const [a, b] = hand.cards;
  const av =
    a.rank === 'A' ? 11 : a.rank === 'K' || a.rank === 'Q' || a.rank === 'J' || a.rank === '10'
      ? 10
      : Number(a.rank);
  const bv =
    b.rank === 'A' ? 11 : b.rank === 'K' || b.rank === 'Q' || b.rank === 'J' || b.rank === '10'
      ? 10
      : Number(b.rank);
  if (av !== bv) return false;
  if (currentHandCount >= rules.maxSplitHands) return false;
  return true;
}

export function canHit(hand: PlayerHandState): boolean {
  if (hand.stood || hand.doubled || hand.splitAceDone) return false;
  if (isBust(hand.cards)) return false;
  return true;
}
