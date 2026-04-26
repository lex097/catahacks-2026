import { STRATEGY_RULES_SUMMARY, actionLabel } from '../strategy/basicStrategy';
import type { PlayerAction } from '../game/types';

export function CoachPanel({
  feedback,
  explainLoading,
  explainError,
  explainText,
  onExplain,
  explainDisabled,
}: {
  feedback: {
    chosen: PlayerAction;
    recommended: PlayerAction | null;
    ok: boolean;
  } | null;
  explainLoading: boolean;
  explainError: string | null;
  explainText: string | null;
  onExplain: () => void;
  explainDisabled: boolean;
}) {
  return (
    <aside className="coach">
      <h2>Coach</h2>
      <p className="rules-blurb">{STRATEGY_RULES_SUMMARY}</p>
      {feedback ? (
        <div className={feedback.ok ? 'fb ok' : 'fb bad'}>
          <p>
            You chose <strong>{actionLabel(feedback.chosen)}</strong>.
            {feedback.recommended !== null && (
              <>
                {' '}
                Basic strategy: <strong>{actionLabel(feedback.recommended)}</strong>.
              </>
            )}
          </p>
          <p className="fb-verdict">{feedback.ok ? 'Correct.' : 'Not optimal.'}</p>
        </div>
      ) : (
        <p className="muted">Play a card — feedback appears after each action.</p>
      )}
      <div className="explain-block">
        <button
          type="button"
          className="btn secondary"
          onClick={onExplain}
          disabled={explainDisabled || explainLoading}
        >
          {explainLoading ? 'Explaining…' : 'Explain this spot'}
        </button>
        {explainError && <p className="err">{explainError}</p>}
        {explainText && <p className="explain-text">{explainText}</p>}
      </div>
      <p className="muted small">
        Explanations use a local model via Ollama (default{' '}
        <code>http://127.0.0.1:11434</code>). Override proxy target with env{' '}
        <code>LLM_PROXY_TARGET</code> for LM Studio. Optional model:{' '}
        <code>VITE_OLLAMA_MODEL</code> in <code>.env</code>.
      </p>
    </aside>
  );
}
