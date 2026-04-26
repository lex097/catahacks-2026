/**
 * Pedagogical reference for LLM explanations. Values are standard
 * infinite-deck / multi-deck approximations (6-deck H17 is very close).
 * Not exact composition-dependent EV.
 */

export const BASIC_STRATEGY_MATH_APPENDIX = `
## How basic strategy is defined (math)

Basic strategy is the action that **maximizes expected value (EV)** in dollars per dollar wagered at each decision, assuming:
- a **random** completion of the shoe (no card counting / no knowledge of remaining cards beyond the cards you see),
- fixed table rules (here: H17, DAS, etc.).

For a discrete set of legal actions A, you compare:

  EV(action) = Σ_s P(next states s | action) × (payoff(s))

where payoffs include blackjack 3:2, doubles (stake × 2), splits (sum of child hands), pushes at 0, etc. The chart is the closed-form / tabulated solution of those comparisons for every (player hand class, dealer upcard).

## Dealer bust probability vs upcard (multi-deck, H17)

Approximate **P(dealer busts | upcard)** when dealer hits to hard ≥17 and hits soft 17:

| Dealer up | P(bust) ≈ |
|-----------|-----------|
| 2 | 35% |
| 3 | 37% |
| 4 | 40% |
| 5 | 43% |
| 6 | 42% |
| 7 | 26% |
| 8 | 24% |
| 9 | 23% |
| 10 / J / Q / K | 23% |
| A | 17% |

**Use this to explain stiffs (12–16):** standing vs 2–6 is often correct because the dealer’s bust chance is relatively high, while **hitting** adds substantial **player bust risk** (see below). Vs 7–A, the dealer makes too many strong totals, so you usually **hit** stiffs to try to improve.

## One-card player bust risk (infinite-deck simplification)

If your hand is **hard** and you take **exactly one more card**, approximate P(bust) treating ranks 2–9 as face value, 10–K as 10, and ace as 1 when it would otherwise bust the hard total:

| Hard total | P(next card busts) ≈ |
|------------|----------------------|
| 12 | 31% (draw 10-value) |
| 13 | 38% |
| 14 | 46% |
| 15 | 54% |
| 16 | 62% |

(Exact numbers shift slightly with shoe composition; the ordering and magnitudes drive the chart.)

## Soft hands (ace counted flexibly)

With a usable ace (soft hand), many hits **cannot bust the same way** because the ace can drop from 11 to 1. That lowers the marginal cost of hitting vs a similar **hard** total, which is why soft totals often **hit/double** where a hard total would stand.

## Doubling

Doubling is a **one-card** commitment with **double stake**. It wins when

  EV(double) = 2·P(win | one card) − 2·P(lose | one card) (+ push terms)

exceeds the EV of **sequential hits** (possibly multiple draws). Favorable spots (e.g. 10–11 vs many upcards) have a high chance of landing on 19–21 with one card.

## Splitting

Splitting replaces one hand with two (or more) **independent** hands under the table constraints. The chart splits when the **sum of EVs** of the split hands (plus extra wager) beats playing the hand as a hard total or as a pair-as-hard.

When teaching, tie recommendations to: **dealer bust curve**, **player one-card bust curve**, **soft-hand flexibility**, and the **double = one draw at 2× stake** definition.
`.trim();
