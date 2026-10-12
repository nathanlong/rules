/** Pure Skull King scoring. No Svelte or browser APIs, so it's easy to test. */

export const ROUNDS = 10;
export const BONUS_STEP = 10;

export interface Round {
  /** `null` until entered. */
  bid: number | null;
  won: number | null;
  bonus: number;
}

export interface Player {
  id: string;
  name: string;
  rounds: Round[];
}

/**
 * House-rule switches. The defaults match the scorecard's original behavior.
 * (Open question: the official rules only award bonuses on a made bid, and
 * charge −10 × cards for any failed zero bid.)
 */
export interface ScoringRules {
  /** Only add bonus points when the bid was made exactly. */
  bonusRequiresBid: boolean;
  /** A failed zero bid costs 10 × cards in the round, instead of 10 per trick won. */
  zeroBidPenaltyPerCard: boolean;
}

export const DEFAULT_RULES: ScoringRules = {
  bonusRequiresBid: false,
  zeroBidPenaltyPerCard: false,
};

/** Round 1 deals 1 card, round 10 deals 10. */
export const cardsInRound = (roundIndex: number) => roundIndex + 1;

export const emptyRound = (): Round => ({ bid: null, won: null, bonus: 0 });

export const isEntered = (round: Round): round is Round & { bid: number; won: number } =>
  round.bid !== null && round.won !== null;

export function bidScore(bid: number, won: number, roundIndex: number, rules = DEFAULT_RULES): number {
  const cards = cardsInRound(roundIndex);
  if (bid === 0) {
    if (won === 0) return 10 * cards;
    return rules.zeroBidPenaltyPerCard ? -10 * cards : -10 * won;
  }
  return bid === won ? 20 * won : -10 * Math.abs(bid - won);
}

/** The round's score, or `null` if the round hasn't been entered. */
export function roundScore(round: Round, roundIndex: number, rules = DEFAULT_RULES): number | null {
  if (!isEntered(round)) return null;
  const made = round.bid === round.won;
  const bonus = rules.bonusRequiresBid && !made ? 0 : round.bonus;
  return bidScore(round.bid, round.won, roundIndex, rules) + bonus;
}

/** Running total after each round; `null` for rounds not yet entered. */
export function runningTotals(player: Player, rules = DEFAULT_RULES): (number | null)[] {
  let sum = 0;
  return player.rounds.map((round, i) => {
    const score = roundScore(round, i, rules);
    if (score === null) return null;
    sum += score;
    return sum;
  });
}

export function total(player: Player, rules = DEFAULT_RULES): number {
  return player.rounds.reduce((sum, round, i) => sum + (roundScore(round, i, rules) ?? 0), 0);
}

/** Ids of the players with the highest total. Ties share the lead; nobody leads before any score. */
export function leaders(players: Player[], rules = DEFAULT_RULES): Set<string> {
  const scored = players.filter((p) => p.rounds.some(isEntered));
  if (scored.length === 0) return new Set();
  const totals = scored.map((p) => total(p, rules));
  const best = Math.max(...totals);
  return new Set(scored.filter((_, i) => totals[i] === best).map((p) => p.id));
}

export const clampRound = (roundIndex: number) => Math.min(Math.max(roundIndex, 0), ROUNDS - 1);
