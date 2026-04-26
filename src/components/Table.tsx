import type { GameSnapshot } from '../game/types';
import { getHandValue } from '../game/hand';
import { CardFace } from './Card';

export function Table({
  snapshot,
}: {
  snapshot: GameSnapshot;
}) {
  const dealer = snapshot.dealerCards;
  const up = dealer[0];
  const hole = dealer[1];
  const dShow = snapshot.holeHidden ? [up] : dealer;
  const dVal = snapshot.holeHidden ? null : getHandValue(dealer);

  return (
    <div className="felt">
      <section className="hand-block dealer">
        <h3>Dealer</h3>
        <div className="cards-row">
          {dShow.map((c, i) => (
            <CardFace key={`d-${i}-${c.rank}-${c.suit}`} card={c} />
          ))}
          {snapshot.holeHidden && hole && <CardFace card={hole} hidden />}
        </div>
        {!snapshot.holeHidden && dVal && (
          <p className="total">
            Total {dVal.total}
            {dVal.soft ? ' (soft)' : ''}
          </p>
        )}
      </section>

      <section className="player-hands">
        <h3>Your hands</h3>
        {snapshot.playerHands.map((h, idx) => {
          const v = getHandValue(h.cards);
          const active = snapshot.phase === 'player' && idx === snapshot.activeHandIndex;
          return (
            <div
              key={idx}
              className={`hand-block player ${active ? 'active' : ''} ${h.doubled ? 'doubled' : ''}`}
            >
              <div className="cards-row">
                {h.cards.map((c, i) => (
                  <CardFace key={`p${idx}-${i}-${c.rank}-${c.suit}`} card={c} />
                ))}
              </div>
              <p className="total">
                Hand {idx + 1}: {v.total}
                {v.soft ? ' (soft)' : ''}
                {h.doubled ? ' · doubled' : ''}
                {active ? ' · playing' : ''}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
