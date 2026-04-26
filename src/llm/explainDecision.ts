import type { Card, GameRules, PlayerAction } from '../game/types';
import { STRATEGY_RULES_SUMMARY, actionLabel } from '../strategy/basicStrategy';
import { BASIC_STRATEGY_MATH_APPENDIX } from './basicStrategyMathAppendix';

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

Requirements:
- Cite at least one concrete number from that reference when it helps (e.g. dealer bust % or one-card bust %), rounded as given.
- Connect the recommended action to those quantities (risk vs reward), not vague intuition.
- At most 6 short sentences. If the player's action matched basic strategy, say so briefly.`;

export interface ExplainParams {
  rules: GameRules;
  dealerUp: Card;
  playerCards: Card[];
  chosen: PlayerAction;
  recommended: PlayerAction | null;
  legalActions: PlayerAction[];
}

export async function explainDecision(p: ExplainParams): Promise<string> {
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
  return text;
}
