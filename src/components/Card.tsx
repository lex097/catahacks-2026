import type { Card as CardT } from '../game/types';

const SUIT_COLOR: Record<CardT['suit'], string> = {
  hearts: 'var(--red)',
  diamonds: 'var(--red)',
  clubs: 'var(--ink)',
  spades: 'var(--ink)',
};

const SUIT_SYM: Record<CardT['suit'], string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export function CardFace({ card, hidden }: { card: CardT; hidden?: boolean }) {
  if (hidden) {
    return (
      <div className="card card-hidden" aria-label="Hidden card">
        <span className="card-back" />
      </div>
    );
  }
  return (
    <div
      className="card"
      style={{ color: SUIT_COLOR[card.suit] }}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <span className="card-rank">{card.rank}</span>
      <span className="card-suit">{SUIT_SYM[card.suit]}</span>
    </div>
  );
}
