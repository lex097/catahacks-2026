export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';

/** 2–10, J, Q, K, A */
export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type PlayerAction = 'hit' | 'stand' | 'double' | 'split';

export interface GameRules {
  numDecks: number;
  dealerHitsSoft17: boolean;
  doubleAfterSplit: boolean;
  /** Max number of player hands after splits (e.g. 4). */
  maxSplitHands: number;
  /** One card only on split aces. */
  splitAcesOneCard: boolean;
}

export const DEFAULT_RULES: GameRules = {
  numDecks: 6,
  dealerHitsSoft17: true,
  doubleAfterSplit: true,
  maxSplitHands: 4,
  splitAcesOneCard: true,
};

export type RoundPhase = 'player' | 'dealer' | 'done';

export interface PlayerHandState {
  cards: Card[];
  /** Bet units (practice; 1 per hand unless doubled). */
  bet: number;
  stood: boolean;
  doubled: boolean;
  fromSplit: boolean;
  /** Split aces: only one card dealt, hand locked. */
  splitAceDone: boolean;
}

export interface GameSnapshot {
  shoeSeed: number;
  rules: GameRules;
  phase: RoundPhase;
  dealerCards: Card[];
  holeHidden: boolean;
  playerHands: PlayerHandState[];
  activeHandIndex: number;
  resultMessage: string | null;
  winsThisRound: number;
  pushesThisRound: number;
  lossesThisRound: number;
}
