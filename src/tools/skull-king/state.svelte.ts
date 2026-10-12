import {
  DEFAULT_RULES,
  ROUNDS,
  clampRound,
  emptyRound,
  leaders,
  roundScore,
  runningTotals,
  total,
  type Player,
  type Round,
  type ScoringRules,
} from "./scoring";
import { newId, type SavedGame } from "./storage";

/** The round cell being edited. */
export interface EditTarget {
  player: number;
  round: number;
  /** Recording a whole round: move on to the next player after saving. */
  chain: boolean;
}

/**
 * Reactive game state. Only inputs (names, bids, tricks, bonuses) are stored;
 * every score is derived, so nothing can get out of sync.
 */
export class SkullKingGame {
  players = $state<Player[]>([]);
  started = $state(false);
  currentRound = $state(0);
  readonly rules: ScoringRules = DEFAULT_RULES;

  totals = $derived(this.players.map((p) => total(p, this.rules)));
  running = $derived(this.players.map((p) => runningTotals(p, this.rules)));
  leaderIds = $derived(leaders(this.players, this.rules));

  constructor(saved: SavedGame, rules: ScoringRules = DEFAULT_RULES) {
    this.players = saved.players;
    this.started = saved.started;
    this.currentRound = saved.currentRound;
    this.rules = rules;
  }

  toJSON(): SavedGame {
    return {
      version: 1,
      players: $state.snapshot(this.players),
      started: this.started,
      currentRound: this.currentRound,
    };
  }

  score(playerIndex: number, roundIndex: number): number | null {
    const player = this.players[playerIndex];
    return player ? roundScore(player.rounds[roundIndex], roundIndex, this.rules) : null;
  }

  displayName(playerIndex: number): string {
    return this.players[playerIndex]?.name.trim() || `Player ${playerIndex + 1}`;
  }

  addPlayer(): Player {
    const player: Player = { id: newId(), name: "", rounds: Array.from({ length: ROUNDS }, emptyRound) };
    this.players.push(player);
    return player;
  }

  removePlayer(id: string) {
    this.players = this.players.filter((p) => p.id !== id);
  }

  clearPlayers() {
    this.players = [];
    this.started = false;
    this.currentRound = 0;
  }

  hasScores(player: Player) {
    return player.rounds.some((r) => r.bid !== null || r.won !== null);
  }

  setRound(playerIndex: number, roundIndex: number, round: Round) {
    this.players[playerIndex].rounds[roundIndex] = { ...round };
  }

  clearRound(playerIndex: number, roundIndex: number) {
    this.players[playerIndex].rounds[roundIndex] = emptyRound();
  }

  goToRound(roundIndex: number) {
    this.currentRound = clampRound(roundIndex);
  }

  start() {
    if (this.players.length > 0) this.started = true;
  }

  edit() {
    this.started = false;
  }
}
