<script lang="ts">
  import { ROUNDS, bidScore, isEntered } from "./scoring";
  import type { SkullKingGame } from "./state.svelte";

  let { game, onedit }: { game: SkullKingGame; onedit: (playerIndex: number, roundIndex: number) => void } = $props();

  const roundIndexes = Array.from({ length: ROUNDS }, (_, i) => i);
  const show = (n: number | null) => (n === null ? "" : String(n));

  function cellLabel(playerIndex: number, roundIndex: number): string {
    const name = game.displayName(playerIndex);
    const round = game.players[playerIndex].rounds[roundIndex];
    const where = `${name}, round ${roundIndex + 1}`;
    if (!isEntered(round)) return `${where}: not entered. Edit`;
    const score = game.score(playerIndex, roundIndex);
    const running = game.running[playerIndex][roundIndex];
    return `${where}: bid ${round.bid}, won ${round.won}, bonus ${round.bonus}, round score ${score}, total ${running}. Edit`;
  }
</script>

<div class="scorecard">
  <table class="scorecard__table">
    <caption class="sr-only">
      Scorecard. Round {game.currentRound + 1} of {ROUNDS} is the current round. Select a cell to edit it.
    </caption>
    <thead>
      <tr>
        <th scope="col" class="scorecard__corner"><span class="sr-only">Round</span></th>
        {#each game.players as player, playerIndex (player.id)}
          {@const leading = game.leaderIds.has(player.id)}
          <th scope="col" class="player__name" class:leader={leading}>
            {#if leading}<span aria-hidden="true">👑</span><span class="sr-only">Leading: </span>{/if}{game.displayName(
              playerIndex,
            )}
            <span class="sr-only">, total {game.totals[playerIndex]}</span>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each roundIndexes as roundIndex}
        {@const current = roundIndex === game.currentRound}
        <tr class:active={current} aria-current={current ? "true" : undefined}>
          <th scope="row" class="round__indicator">
            R{roundIndex + 1}{#if current}<span class="sr-only"> (current round)</span>{/if}
          </th>
          {#each game.players as player, playerIndex (player.id)}
            {@const round = player.rounds[roundIndex]}
            {@const entered = isEntered(round)}
            <td>
              <button
                type="button"
                class="round"
                class:active={current}
                class:leader={game.leaderIds.has(player.id)}
                aria-label={cellLabel(playerIndex, roundIndex)}
                onclick={() => onedit(playerIndex, roundIndex)}
              >
                <span class="round__upper" aria-hidden="true">
                  <span class="round__fraction">
                    <span class="round__bid">{show(round.bid)}</span>
                    <span class="round__won">{show(round.won)}</span>
                  </span>
                  <span class="round__bid-result">
                    {entered ? bidScore(round.bid!, round.won!, roundIndex, game.rules) : ""}
                  </span>
                  <span class="round__bonus">{entered ? round.bonus : ""}</span>
                </span>
                <span class="round__lower" aria-hidden="true">
                  <span class="round__score">{show(game.score(playerIndex, roundIndex))}</span>
                  <span class="round__inc-score">{show(game.running[playerIndex][roundIndex])}</span>
                </span>
              </button>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .scorecard {
    overflow: auto;
    height: calc(100dvh - var(--controls-height));
    padding-inline: 0.5em;
  }
  .scorecard__table {
    border-collapse: separate;
    border-spacing: 0.5em 0;
  }
  thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg);
  }
  .player__name {
    font-family: var(--accent);
    font-size: 1.25em;
    font-weight: normal;
    max-width: 6rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: left;
  }
  .round__indicator {
    font-family: var(--monospace);
    font-size: 0.75em;
    font-weight: normal;
    padding-inline-end: 0.25em;
  }
  tr.active .round__indicator {
    font-weight: bold;
  }
  td {
    padding: 0;
  }
  .round {
    display: block;
    width: 100%;
    min-width: 6rem;
    padding: 0;
    border: 1px solid black;
    background: transparent;
    color: inherit;
    font-family: var(--monospace);
    font-size: 1rem;
    text-align: left;
    cursor: pointer;
  }
  .round.active {
    background-color: rgba(200, 200, 255, 0.5);
  }
  .round.leader {
    background-color: rgba(255, 200, 200, 0.5);
  }
  .round.leader.active {
    background-color: rgba(230, 140, 230, 0.5);
  }
  .round__upper,
  .round__lower {
    display: flex;
    min-height: 2em;
  }
  .round__fraction {
    display: flex;
    border: 1px solid black;
    aspect-ratio: 1/1;
    width: 2em;
    position: relative;
    padding: 0.125em;
  }
  .round__fraction::after {
    display: block;
    content: "";
    width: 2.75em;
    border-top: 1px solid black;
    position: absolute;
    transform-origin: bottom right;
    transform: rotate(-45deg);
    top: 0;
    right: 0;
  }
  .round__bid,
  .round__won {
    font-size: 0.825em;
    line-height: 1;
    flex-grow: 1;
  }
  .round__won {
    align-self: flex-end;
    text-align: right;
  }
  .round__bid-result,
  .round__bonus,
  .round__score,
  .round__inc-score {
    min-width: 2em;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid black;
  }
  .round__score {
    flex-grow: 0;
    width: 2em;
    background: rgba(0, 0, 0, 0.1);
  }
  .round__inc-score {
    font-weight: bold;
  }
</style>
