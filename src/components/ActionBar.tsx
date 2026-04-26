import type { PlayerAction } from '../game/types';
import { actionLabel } from '../strategy/basicStrategy';

export function ActionBar({
  legal,
  disabled,
  onAction,
}: {
  legal: PlayerAction[];
  disabled: boolean;
  onAction: (a: PlayerAction) => void;
}) {
  const order: PlayerAction[] = ['hit', 'stand', 'double', 'split'];
  return (
    <div className="action-bar">
      {order.map((a) => {
        const ok = legal.includes(a);
        return (
          <button
            key={a}
            type="button"
            className="btn action-btn"
            disabled={disabled || !ok}
            onClick={() => onAction(a)}
          >
            {actionLabel(a)}
          </button>
        );
      })}
    </div>
  );
}
