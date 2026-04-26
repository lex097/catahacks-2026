import { STRATEGY_RULES_SUMMARY, actionLabel } from '../strategy/basicStrategy';
import type { PlayerAction } from '../game/types';
import type { MonteCarloEvResult } from '../ev/monteCarloEv';
import { ExplainMarkdown } from './ExplainMarkdown';

export function CoachPanel({
  feedback,
  explainLoading,
  explainError,
  explainText,
  explainEv,
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
  explainEv: MonteCarloEvResult | null;
  onExplain: () => void;
  explainDisabled: boolean;
}) {
  const order: PlayerAction[] = ['hit', 'stand', 'double', 'split'];
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
        {explainEv && (
          <div className="ev-panel">
            <h3 className="ev-title">Estimated EV (Monte Carlo)</h3>
            <p className="muted small ev-note">
              {explainEv.iterations_per_action.toLocaleString()} trials per legal action · infinite
              13-rank shoe · dealer hole excludes dealer natural · then basic strategy autoplay.
            </p>
            <table className="ev-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Mean net units</th>
                  <th>±stderr</th>
                </tr>
              </thead>
              <tbody>
                {order.map((a) => {
                  const m = explainEv.ev_mean_units[a];
                  const s = explainEv.ev_stderr_units[a];
                  if (m === undefined || s === undefined) return null;
                  return (
                    <tr key={a}>
                      <td>{actionLabel(a)}</td>
                      <td>{m >= 0 ? `+${m}` : `${m}`}</td>
                      <td>{s}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {explainEv.best_action_by_ev && (
              <p className="ev-best">
                Highest sample EV: <strong>{actionLabel(explainEv.best_action_by_ev)}</strong>
              </p>
            )}
          </div>
        )}
        {explainText && <ExplainMarkdown source={explainText} />}
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
