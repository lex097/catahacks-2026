import type { Card, Rank } from './types';

export interface HandValue {
  total: number;
  soft: boolean;
}

const RANK_VALUES: Record<Rank, number[]> = {
  '2': [2],
  '3': [3],
  '4': [4],
  '5': [5],
  '6': [6],
  '7': [7],
  '8': [8],
  '9': [9],
  '10': [10],
  J: [10],
  Q: [10],
  K: [10],
  A: [1, 11],
};

/** Best blackjack total using ace as 11 when legal. */
export function getHandValue(cards: Card[]): HandValue {
  let sum = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') aces++;
    else sum += RANK_VALUES[c.rank][0];
  }
  sum += aces;
  let soft = aces > 0 && sum + 10 <= 21;
  const total = soft ? sum + 10 : sum;
  return { total, soft };
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && getHandValue(cards).total === 21;
}

export function isBust(cards: Card[]): boolean {
  return getHandValue(cards).total > 21;
}

export function isPair(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const [a, b] = cards;
  return rankValueForPair(a.rank) === rankValueForPair(b.rank);
}

function rankValueForPair(r: Card['rank']): number {
  if (r === 'A') return 11;
  if (r === 'K' || r === 'Q' || r === 'J' || r === '10') return 10;
  return Number(r);
}
