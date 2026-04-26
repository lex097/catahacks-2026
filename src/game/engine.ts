import { buildShoe, mulberry32, shuffleInPlace } from './deck';
import { canDouble, canHit, canSplit, dealerShouldHit } from './rules';
import { getHandValue, isBlackjack, isBust } from './hand';
import type {
  Card,
  GameRules,
  GameSnapshot,
  PlayerAction,
  PlayerHandState,
  RoundPhase,
} from './types';

export class BlackjackEngine {
  private rules: GameRules;
  private shoe: Card[] = [];
  private rng: () => number;
  private shoeSeed: number;

  constructor(rules: GameRules, seed?: number) {
    this.rules = rules;
    this.shoeSeed = seed ?? Math.floor(Math.random() * 0x7fffffff);
    this.rng = mulberry32(this.shoeSeed);
    this.refillShoe();
  }

  getRules(): GameRules {
    return this.rules;
  }

  getShoeSeed(): number {
    return this.shoeSeed;
  }

  private refillShoe(): void {
    this.shoe = buildShoe(this.rules.numDecks);
    shuffleInPlace(this.shoe, this.rng);
  }

  private draw(): Card {
    if (this.shoe.length < 10) this.refillShoe();
    const c = this.shoe.pop();
    if (!c) throw new Error('empty shoe');
    return c;
  }

  dealInitial(): GameSnapshot {
    const dealer: Card[] = [this.draw(), this.draw()];
    const p0: PlayerHandState = {
      cards: [this.draw(), this.draw()],
      bet: 1,
      stood: false,
      doubled: false,
      fromSplit: false,
      splitAceDone: false,
    };
    let phase: RoundPhase = 'player';
    let resultMessage: string | null = null;
    let wins = 0;
    let pushes = 0;
    let losses = 0;

    if (isBlackjack(dealer) && isBlackjack(p0.cards)) {
      phase = 'done';
      resultMessage = 'Both blackjack — push.';
      pushes = 1;
    } else if (isBlackjack(dealer)) {
      phase = 'done';
      resultMessage = 'Dealer blackjack — you lose.';
      losses = 1;
    } else if (isBlackjack(p0.cards)) {
      phase = 'done';
      resultMessage = 'Blackjack — you win 3:2.';
      wins = 1;
    }

    return {
      shoeSeed: this.shoeSeed,
      rules: this.rules,
      phase,
      dealerCards: dealer,
      holeHidden: phase === 'player',
      playerHands: [p0],
      activeHandIndex: 0,
      resultMessage,
      winsThisRound: wins,
      pushesThisRound: pushes,
      lossesThisRound: losses,
    };
  }

  legalActions(snapshot: GameSnapshot): PlayerAction[] {
    if (snapshot.phase !== 'player') return [];
    const hand = snapshot.playerHands[snapshot.activeHandIndex];
    if (!hand) return [];
    const out: PlayerAction[] = [];
    if (canHit(hand)) out.push('hit', 'stand');
    if (canDouble(hand, this.rules)) out.push('double');
    if (canSplit(hand, this.rules, snapshot.playerHands.length)) out.push('split');
    return out;
  }

  applyPlayerAction(snapshot: GameSnapshot, action: PlayerAction): GameSnapshot {
    if (snapshot.phase !== 'player') return snapshot;
    const hands = snapshot.playerHands.map((h) => ({ ...h, cards: [...h.cards] }));
    const i = snapshot.activeHandIndex;
    const hand = hands[i];
    if (!hand) return snapshot;

    const legal = this.legalActions(snapshot);
    if (!legal.includes(action)) return snapshot;

    if (action === 'hit') {
      hand.cards.push(this.draw());
      if (isBust(hand.cards)) {
        hand.stood = true;
        return this.advanceOrFinish({ ...snapshot, playerHands: hands });
      }
      return { ...snapshot, playerHands: hands };
    }

    if (action === 'stand') {
      hand.stood = true;
      return this.advanceOrFinish({ ...snapshot, playerHands: hands });
    }

    if (action === 'double') {
      hand.cards.push(this.draw());
      hand.doubled = true;
      hand.bet *= 2;
      hand.stood = true;
      return this.advanceOrFinish({ ...snapshot, playerHands: hands });
    }

    if (action === 'split') {
      const c0 = hand.cards[0];
      const c1 = hand.cards[1];
      const aceSplit = c0.rank === 'A' && this.rules.splitAcesOneCard;
      const hLeft: PlayerHandState = {
        cards: [c0, this.draw()],
        bet: hand.bet,
        stood: aceSplit,
        doubled: false,
        fromSplit: true,
        splitAceDone: aceSplit,
      };
      const hRight: PlayerHandState = {
        cards: [c1, this.draw()],
        bet: hand.bet,
        stood: aceSplit,
        doubled: false,
        fromSplit: true,
        splitAceDone: aceSplit,
      };
      const next = [...hands.slice(0, i), hLeft, hRight, ...hands.slice(i + 1)];
      const afterSplit = { ...snapshot, playerHands: next, activeHandIndex: i };
      return aceSplit ? this.advanceOrFinish(afterSplit) : afterSplit;
    }

    return snapshot;
  }

  private advanceOrFinish(snapshot: GameSnapshot): GameSnapshot {
    const hands = snapshot.playerHands;
    let idx = snapshot.activeHandIndex;
    while (idx < hands.length) {
      const h = hands[idx];
      if (!h.stood && !isBust(h.cards)) {
        return { ...snapshot, activeHandIndex: idx };
      }
      idx++;
    }
    return this.playDealerAndScore(snapshot);
  }

  private playDealerAndScore(snapshot: GameSnapshot): GameSnapshot {
    const dealerCards = [...snapshot.dealerCards];
    while (dealerShouldHit(dealerCards, this.rules)) {
      dealerCards.push(this.draw());
    }

    const dVal = getHandValue(dealerCards);
    const dBust = dVal.total > 21;
    let wins = 0;
    let losses = 0;
    let pushes = 0;

    for (const h of snapshot.playerHands) {
      const pVal = getHandValue(h.cards);
      const pBust = pVal.total > 21;
      const mult = h.doubled ? 2 : 1;
      if (pBust) {
        losses += mult;
      } else if (dBust) {
        wins += mult;
      } else if (pVal.total > dVal.total) {
        wins += mult;
      } else if (pVal.total < dVal.total) {
        losses += mult;
      } else {
        pushes += mult;
      }
    }

    let msg: string;
    if (wins > 0 && losses === 0 && pushes === 0) msg = 'You win.';
    else if (losses > 0 && wins === 0 && pushes === 0) msg = 'You lose.';
    else if (pushes > 0 && wins === 0 && losses === 0) msg = 'Push.';
    else msg = `Round: +${wins} / −${losses} / push ${pushes} (units).`;

    return {
      ...snapshot,
      phase: 'done',
      dealerCards,
      holeHidden: false,
      resultMessage: msg,
      winsThisRound: wins,
      lossesThisRound: losses,
      pushesThisRound: pushes,
    };
  }
}
