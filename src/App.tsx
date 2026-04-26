import { useCallback, useEffect, useRef, useState } from 'react';
import { BlackjackEngine } from './game/engine';
import { DEFAULT_RULES } from './game/types';
import type { GameSnapshot, PlayerAction } from './game/types';
import { recommendedAction, matchesStrategy } from './strategy/basicStrategy';
import { explainDecision } from './llm/explainDecision';
import { Table } from './components/Table';
import { ActionBar } from './components/ActionBar';
import { CoachPanel } from './components/CoachPanel';
import './index.css';

interface LastSpot {
  rules: GameSnapshot['rules'];
  dealerUp: GameSnapshot['dealerCards'][0];
  playerCards: GameSnapshot['playerHands'][0]['cards'];
  chosen: PlayerAction;
  recommended: PlayerAction | null;
  legal: PlayerAction[];
}

export default function App() {
  const engineRef = useRef<BlackjackEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new BlackjackEngine(DEFAULT_RULES);
  }
  const [snapshot, setSnapshot] = useState<GameSnapshot | undefined>(undefined);
  useEffect(() => {
    setSnapshot(engineRef.current!.dealInitial());
  }, []);
  const [feedback, setFeedback] = useState<{
    chosen: PlayerAction;
    recommended: PlayerAction | null;
    ok: boolean;
  } | null>(null);
  const [lastSpot, setLastSpot] = useState<LastSpot | null>(null);
  const [session, setSession] = useState({ wins: 0, losses: 0, pushes: 0 });
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [explainText, setExplainText] = useState<string | null>(null);

  const dealNew = useCallback(() => {
    setFeedback(null);
    setLastSpot(null);
    setExplainError(null);
    setExplainText(null);
    setSnapshot(engineRef.current!.dealInitial());
  }, []);

  const onAction = useCallback(
    (action: PlayerAction) => {
      const eng = engineRef.current!;
      setSnapshot((prev) => {
        if (!prev || prev.phase !== 'player') return prev;
        const hand = prev.playerHands[prev.activeHandIndex];
        if (!hand) return prev;
        const legal = eng.legalActions(prev);
        const best = recommendedAction(
          hand,
          prev.dealerCards[0],
          prev.rules,
          prev.playerHands.length,
          legal,
        );
        const ok = matchesStrategy(action, best);
        setFeedback({ chosen: action, recommended: best, ok });
        setLastSpot({
          rules: prev.rules,
          dealerUp: prev.dealerCards[0],
          playerCards: [...hand.cards],
          chosen: action,
          recommended: best,
          legal: [...legal],
        });
        const next = eng.applyPlayerAction(prev, action);
        if (next.phase === 'done') {
          setSession((s) => ({
            wins: s.wins + next.winsThisRound,
            losses: s.losses + next.lossesThisRound,
            pushes: s.pushes + next.pushesThisRound,
          }));
        }
        return next;
      });
    },
    [],
  );

  const onExplain = useCallback(async () => {
    if (!lastSpot) return;
    setExplainError(null);
    setExplainText(null);
    setExplainLoading(true);
    try {
      const text = await explainDecision({
        rules: lastSpot.rules,
        dealerUp: lastSpot.dealerUp,
        playerCards: lastSpot.playerCards,
        chosen: lastSpot.chosen,
        recommended: lastSpot.recommended,
        legalActions: lastSpot.legal,
      });
      setExplainText(text);
    } catch (e) {
      setExplainError(
        e instanceof Error
          ? e.message
          : 'Could not reach the local model. Start Ollama (or set LLM_PROXY_TARGET) and ensure a model is available.',
      );
    } finally {
      setExplainLoading(false);
    }
  }, [lastSpot]);

  if (!snapshot) {
    return (
      <div className="app">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  const legal =
    snapshot.phase === 'player' ? engineRef.current!.legalActions(snapshot) : [];
  const playing = snapshot.phase === 'player';
  const done = snapshot.phase === 'done';

  return (
    <div className="app">
      <header className="top">
        <h1>Blackjack practice</h1>
        <div className="stats">
          <span>Session: +{session.wins}</span>
          <span>−{session.losses}</span>
          <span>push {session.pushes}</span>
          <button type="button" className="btn tiny" onClick={dealNew}>
            New hand
          </button>
        </div>
      </header>

      <main className="layout">
        <div className="main-col">
          <Table snapshot={snapshot} />
          {snapshot.resultMessage && (
            <p className="result-banner">{snapshot.resultMessage}</p>
          )}
          <ActionBar
            legal={legal}
            disabled={!playing}
            onAction={onAction}
          />
          {done && (
            <button type="button" className="btn primary next" onClick={dealNew}>
              Next hand
            </button>
          )}
        </div>
        <CoachPanel
          feedback={feedback}
          explainLoading={explainLoading}
          explainError={explainError}
          explainText={explainText}
          onExplain={onExplain}
          explainDisabled={!lastSpot}
        />
      </main>
    </div>
  );
}
