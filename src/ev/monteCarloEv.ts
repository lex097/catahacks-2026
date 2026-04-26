import { mulberry32 } from '../game/deck';
import { canDouble, canHit, canSplit, dealerShouldHit } from '../game/rules';
import { getHandValue, isBlackjack, isBust } from '../game/hand';
import { recommendedAction } from '../strategy/basicStrategy';
import type { Card, GameRules, PlayerAction, PlayerHandState, Rank } from '../game/types';

type Rng = () => number;

const RANK_DRAW_ORDER: Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

function randomCard(rng: () => number): Card {
  const i = Math.floor(rng() * 13);
  return { rank: RANK_DRAW_ORDER[i], suit: 'clubs' };
}

/** Match trainer: we never decide with dealer showing a natural. */
function sampleHoleGivenNoDealerBlackjack(dealerUp: Card, rng: () => number): Card {
  for (let k = 0; k < 50; k++) {
    const hole = randomCard(rng);
    if (!isBlackjack([dealerUp, hole])) return hole;
  }
  return randomCard(rng);
}

function cloneHands(hands: PlayerHandState[]): PlayerHandState[] {
  return hands.map((h) => ({
    ...h,
    cards: [...h.cards],
  }));
}

function legalActions(
  hands: PlayerHandState[],
  activeIndex: number,
  rules: GameRules,
): PlayerAction[] {
  const hand = hands[activeIndex];
  if (!hand) return [];
  const out: PlayerAction[] = [];
  if (canHit(hand)) out.push('hit', 'stand');
  if (canDouble(hand, rules)) out.push('double');
  if (canSplit(hand, rules, hands.length)) out.push('split');
  return out;
}

function findNextPlayable(hands: PlayerHandState[], from: number): number {
  for (let i = from; i < hands.length; i++) {
    const h = hands[i];
    if (!h.stood && !isBust(h.cards)) return i;
  }
  return -1;
}

function scoreVsDealer(hands: PlayerHandState[], dealerCards: Card[]): number {
  const dVal = getHandValue(dealerCards);
  const dBust = dVal.total > 21;
  let net = 0;
  for (const h of hands) {
    const pVal = getHandValue(h.cards);
    const pBust = pVal.total > 21;
    const b = h.bet;
    if (pBust) net -= b;
    else if (dBust) net += b;
    else if (pVal.total > dVal.total) net += b;
    else if (pVal.total < dVal.total) net -= b;
  }
  return net;
}

function playDealer(dealer: Card[], rules: GameRules, rng: Rng): void {
  while (dealerShouldHit(dealer, rules)) {
    dealer.push(randomCard(rng));
  }
}

function applyPlayerAction(
  hands: PlayerHandState[],
  activeIndex: number,
  action: PlayerAction,
  rules: GameRules,
  rng: Rng,
): { hands: PlayerHandState[]; activeIndex: number } {
  const h = hands.map((x) => ({ ...x, cards: [...x.cards] }));
  const i = activeIndex;
  const hand = h[i];
  if (!hand) return { hands: h, activeIndex: -1 };

  if (action === 'hit') {
    hand.cards.push(randomCard(rng));
    if (isBust(hand.cards)) hand.stood = true;
    return advance(h, i);
  }
  if (action === 'stand') {
    hand.stood = true;
    return advance(h, i);
  }
  if (action === 'double') {
    hand.cards.push(randomCard(rng));
    hand.doubled = true;
    hand.bet *= 2;
    hand.stood = true;
    return advance(h, i);
  }
  if (action === 'split') {
    const c0 = hand.cards[0];
    const c1 = hand.cards[1];
    const aceSplit = c0.rank === 'A' && rules.splitAcesOneCard;
    const hLeft: PlayerHandState = {
      cards: [c0, randomCard(rng)],
      bet: hand.bet,
      stood: aceSplit,
      doubled: false,
      fromSplit: true,
      splitAceDone: aceSplit,
    };
    const hRight: PlayerHandState = {
      cards: [c1, randomCard(rng)],
      bet: hand.bet,
      stood: aceSplit,
      doubled: false,
      fromSplit: true,
      splitAceDone: aceSplit,
    };
    const next = [...h.slice(0, i), hLeft, hRight, ...h.slice(i + 1)];
    if (aceSplit) return advance(next, i);
    return { hands: next, activeIndex: i };
  }
  return { hands: h, activeIndex: i };
}

function advance(
  hands: PlayerHandState[],
  from: number,
): { hands: PlayerHandState[]; activeIndex: number } {
  let idx = from;
  while (idx < hands.length) {
    const g = hands[idx];
    if (!g.stood && !isBust(g.cards)) return { hands, activeIndex: idx };
    idx++;
  }
  return { hands, activeIndex: -1 };
}

/** Finish all player hands with basic strategy, then draw dealer. */
function autoplayUntilDealer(
  handsIn: PlayerHandState[],
  dealerUp: Card,
  rules: GameRules,
  dealer: Card[],
  rng: Rng,
): PlayerHandState[] {
  let hands = handsIn.map((h) => ({ ...h, cards: [...h.cards] }));
  for (;;) {
    const idx = findNextPlayable(hands, 0);
    if (idx === -1) break;
    const hand = hands[idx];
    const legal = legalActions(hands, idx, rules);
    const best = recommendedAction(hand, dealerUp, rules, hands.length, legal) ?? 'stand';
    const res = applyPlayerAction(hands, idx, best, rules, rng);
    hands = res.hands;
    if (res.activeIndex === -1) break;
  }
  playDealer(dealer, rules, rng);
  return hands;
}

function oneSimulation(
  rules: GameRules,
  dealerUp: Card,
  initialHands: PlayerHandState[],
  activeStart: number,
  firstAction: PlayerAction,
  rng: Rng,
): number {
  const hole = sampleHoleGivenNoDealerBlackjack(dealerUp, rng);
  const dealer = [dealerUp, hole];
  let hands = cloneHands(initialHands);
  let active = activeStart;

  const legal0 = legalActions(hands, active, rules);
  if (!legal0.includes(firstAction)) return 0;

  const afterFirst = applyPlayerAction(hands, active, firstAction, rules, rng);
  hands = afterFirst.hands;
  active = afterFirst.activeIndex;

  if (active === -1) {
    playDealer(dealer, rules, rng);
    return scoreVsDealer(hands, dealer);
  }

  const finalHands = autoplayUntilDealer(hands, dealerUp, rules, dealer, rng);
  return scoreVsDealer(finalHands, dealer);
}

export interface MonteCarloEvParams {
  rules: GameRules;
  dealerUp: Card;
  playerHands: PlayerHandState[];
  activeHandIndex: number;
  legalActions: PlayerAction[];
  iterationsPerAction?: number;
  seed?: number;
}

export interface MonteCarloEvResult {
  method: 'monte_carlo_infinite_deck';
  conditioning: 'dealer_not_natural_blackjack';
  autoplay_after_first: 'basic_strategy_chart';
  iterations_per_action: number;
  /** Mean net units (wins − losses; pushes 0) for one round from this spot. */
  ev_mean_units: Partial<Record<PlayerAction, number>>;
  ev_stderr_units: Partial<Record<PlayerAction, number>>;
  best_action_by_ev: PlayerAction | null;
}

const DEFAULT_ITERS = 3500;

export function estimateActionEvs(p: MonteCarloEvParams): MonteCarloEvResult {
  const n = p.iterationsPerAction ?? DEFAULT_ITERS;
  const seed = p.seed ?? 0xace1234;
  const evMean: Partial<Record<PlayerAction, number>> = {};
  const evStderr: Partial<Record<PlayerAction, number>> = {};
  let best: PlayerAction | null = null;
  let bestEv = -Infinity;

  const actionSalt: Record<PlayerAction, number> = {
    hit: 101,
    stand: 307,
    double: 503,
    split: 709,
  };

  for (const action of p.legalActions) {
    const rng = mulberry32(
      (seed + actionSalt[action] * 0x1f1f1f1f + p.activeHandIndex * 131) >>> 0,
    );
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      const x = oneSimulation(
        p.rules,
        p.dealerUp,
        p.playerHands,
        p.activeHandIndex,
        action,
        rng,
      );
      sum += x;
      sumSq += x * x;
    }
    const mean = sum / n;
    const variance = Math.max(0, sumSq / n - mean * mean);
    const stderr = Math.sqrt(variance / n);
    evMean[action] = Math.round(mean * 1000) / 1000;
    evStderr[action] = Math.round(stderr * 1000) / 1000;
    if (mean > bestEv) {
      bestEv = mean;
      best = action;
    }
  }

  return {
    method: 'monte_carlo_infinite_deck',
    conditioning: 'dealer_not_natural_blackjack',
    autoplay_after_first: 'basic_strategy_chart',
    iterations_per_action: n,
    ev_mean_units: evMean,
    ev_stderr_units: evStderr,
    best_action_by_ev: best,
  };
}
