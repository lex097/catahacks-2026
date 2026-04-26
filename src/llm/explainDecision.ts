import type { Card, GameRules, PlayerAction, PlayerHandState } from '../game/types';
import { STRATEGY_RULES_SUMMARY, actionLabel } from '../strategy/basicStrategy';
import { BASIC_STRATEGY_MATH_APPENDIX } from './basicStrategyMathAppendix';
import {
  estimateActionEvs,
  type MonteCarloEvResult,
} from '../ev/monteCarloEv';

const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL ?? 'llama3.2';

function formatCard(c: Card): string {
  const r = c.rank;
  const s =
    c.suit === 'hearts'
      ? '♥'
      : c.suit === 'diamonds'
        ? '♦'
        : c.suit === 'clubs'
          ? '♣'
          : '♠';
  return `${r}${s}`;
}

const SYSTEM = `You are a concise blackjack instructor. Explain using basic strategy only (no card counting).

You are given a "basic_strategy_math_reference" section with EV framing, approximate dealer bust rates (H17), one-card player bust rates for hard stiffs, and why doubling/splitting are special one-shot / multi-hand bets.

Formatting: Write valid GitHub-Flavored Markdown in plain text only — bullets, **bold**, and | tables | when helpful. Do not wrap your answer (or any section) in \`\`\`markdown code fences; the UI renders Markdown directly.

Requirements:
- Use the "monte_carlo_ev_estimate" block: compare EVs across legal actions and name which action wins in the simulation (may differ slightly from chart + stderr).
- Cite at least one concrete number from basic_strategy_math_reference when it helps (dealer bust % or one-card bust %).
- Connect the recommended action to risk vs reward, not vague intuition.
- At most 7 short sentences (plus a small table if useful). If the player's action matched basic strategy, say so briefly.`;

export interface ExplainParams {
  rules: GameRules;
  dealerUp: Card;
  playerCards: Card[];
  /** Full table state before the action (required for EV sims). */
  playerHands: PlayerHandState[];
  activeHandIndex: number;
  chosen: PlayerAction;
  recommended: PlayerAction | null;
  legalActions: PlayerAction[];
}

export interface ExplainDecisionResult {
  text: string;
  ev: MonteCarloEvResult;
}

export async function explainDecision(p: ExplainParams): Promise<ExplainDecisionResult> {
  const ev = estimateActionEvs({
    rules: p.rules,
    dealerUp: p.dealerUp,
    playerHands: p.playerHands,
    activeHandIndex: p.activeHandIndex,
    legalActions: p.legalActions,
  });

  const user = {
    rules: STRATEGY_RULES_SUMMARY,
    shoe: `${p.rules.numDecks}-deck shoe (table rules)`,
    dealer_up: formatCard(p.dealerUp),
    player_hand: p.playerCards.map(formatCard).join(' '),
    legal_actions: p.legalActions.map(actionLabel),
    player_chose: actionLabel(p.chosen),
    basic_strategy_recommends:
      p.recommended === null ? 'n/a' : actionLabel(p.recommended),
    basic_strategy_math_reference: BASIC_STRATEGY_MATH_APPENDIX,
    monte_carlo_ev_estimate: {
      ...ev,
      interpretation:
        'ev_mean_units: mean net units won minus lost (per initial unit bet on this hand path; doubled hands weight 2). Pushes contribute 0. Sampling uses a uniform 13-rank infinite shoe, dealer hole resampled until dealer does not have a natural blackjack, then basic strategy for all further player decisions.',
    },
  };

  const res = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: `Explain this decision:\n${JSON.stringify(user, null, 2)}`,
        },
      ],
      stream: false,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(
      `LLM request failed (${res.status}): ${t.slice(0, 400) || res.statusText}`,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from model.');
  return { text, ev };
}
