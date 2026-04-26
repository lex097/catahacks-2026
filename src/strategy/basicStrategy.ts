import type { Card, GameRules, PlayerAction, PlayerHandState } from '../game/types';
import { getHandValue, isPair } from '../game/hand';
import { canSplit } from '../game/rules';

/**
 * Chart matches: 6 decks, dealer hits soft 17, DAS, double any two,
 * split up to 4 hands, one card to split aces, no surrender, no ENHC.
 */
export const STRATEGY_RULES_SUMMARY =
  '6-deck shoe, dealer hits soft 17 (H17), double after split (DAS), double any first two cards, re-split to 4 hands max, split aces receive one card each only, no surrender.';

export type ChartCode = 'H' | 'S' | 'D' | 'Dh' | 'Ds' | 'P';

function dealerColumn(up: Card): number {
  if (up.rank === 'A') return 9;
  const v =
    up.rank === '10' || up.rank === 'J' || up.rank === 'Q' || up.rank === 'K'
      ? 10
      : Number(up.rank);
  return v === 10 ? 8 : v - 2;
}

/** Hard totals 5–17+ mapped by index 0 = 5, ... last = 17+ */
const HARD: ChartCode[][] = [
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
  ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'],
  ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

/** Soft: A+2 .. A+7 (player 13–18), then A+8 (19), A+9 (20) */
const SOFT: ChartCode[][] = [
  ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
  ['S', 'D', 'D', 'D', 'D', 'S', 'S', 'H', 'H', 'H'],
  ['S', 'S', 'S', 'S', 'D', 'S', 'S', 'S', 'S', 'S'],
  ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

/** Pairs by value: 2,3,4,5,6,7,8,9,10,A */
const PAIRS: ChartCode[][] = [
  ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
  ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
  ['P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H', 'H'],
  ['P', 'P', 'P', 'P', 'P', 'P', 'H', 'H', 'H', 'H'],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['P', 'P', 'P', 'P', 'P', 'S', 'P', 'P', 'S', 'S'],
  ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
];

function pairRow(rank: Card['rank']): number {
  if (rank === 'A') return 9;
  const v =
    rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K' ? 10 : Number(rank);
  return v - 2;
}

export function chartMoveForHand(
  playerCards: Card[],
  dealerUp: Card,
  canSplitHere: boolean,
): ChartCode {
  const ci = dealerColumn(dealerUp);
  if (canSplitHere && isPair(playerCards)) {
    return PAIRS[pairRow(playerCards[0].rank)][ci];
  }
  const { total, soft } = getHandValue(playerCards);
  if (soft && playerCards.some((c) => c.rank === 'A') && total <= 21) {
    const nonAce = playerCards.filter((c) => c.rank !== 'A');
    const otherSum = nonAce.reduce((s, c) => {
      const v =
        c.rank === '10' || c.rank === 'J' || c.rank === 'Q' || c.rank === 'K'
          ? 10
          : Number(c.rank);
      return s + v;
    }, 0);
    const softTotal = otherSum + 11;
    if (softTotal >= 13 && softTotal <= 21) {
      const si = softTotal - 13;
      if (si >= 0 && si < SOFT.length) return SOFT[si][ci];
    }
  }
  const hard = Math.min(Math.max(total, 5), 17);
  const hi = hard - 5;
  return HARD[hi][ci];
}

function chartToAction(
  code: ChartCode,
  legal: Set<PlayerAction>,
): PlayerAction | null {
  if (code === 'P') {
    return legal.has('split') ? 'split' : null;
  }
  if (code === 'S') {
    return legal.has('stand') ? 'stand' : null;
  }
  if (code === 'H') {
    return legal.has('hit') ? 'hit' : null;
  }
  if (code === 'D') {
    if (legal.has('double')) return 'double';
    if (legal.has('hit')) return 'hit';
    return null;
  }
  if (code === 'Dh') {
    if (legal.has('double')) return 'double';
    if (legal.has('hit')) return 'hit';
    return null;
  }
  if (code === 'Ds') {
    if (legal.has('double')) return 'double';
    if (legal.has('stand')) return 'stand';
    return null;
  }
  return null;
}

export function recommendedAction(
  hand: PlayerHandState,
  dealerUp: Card,
  rules: GameRules,
  numPlayerHands: number,
  legal: PlayerAction[],
): PlayerAction | null {
  const legalSet = new Set(legal);
  const spl = canSplit(hand, rules, numPlayerHands);
  let code = chartMoveForHand(hand.cards, dealerUp, spl);
  if (code === 'P' && !spl) {
    code = chartMoveForHand(hand.cards, dealerUp, false);
  }
  return chartToAction(code, legalSet);
}

export function actionLabel(a: PlayerAction): string {
  switch (a) {
    case 'hit':
      return 'Hit';
    case 'stand':
      return 'Stand';
    case 'double':
      return 'Double';
    case 'split':
      return 'Split';
  }
}

export function matchesStrategy(
  chosen: PlayerAction,
  best: PlayerAction | null,
): boolean {
  if (best === null) return true;
  return chosen === best;
}
