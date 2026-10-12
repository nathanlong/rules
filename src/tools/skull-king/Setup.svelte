<script lang="ts">
  import { tick } from "svelte";
  import ConfirmDialog from "~/components/tools/ConfirmDialog.svelte";
  import FullscreenToggle from "~/components/tools/FullscreenToggle.svelte";
  import type { Player } from "./scoring";
  import type { SkullKingGame } from "./state.svelte";

  let { game, canSave }: { game: SkullKingGame; canSave: boolean } = $props();

  let confirmClear: ConfirmDialog;
  let confirmRemove: ConfirmDialog;
  let removing = $state("");
  let addButton: HTMLButtonElement;

  const inputId = (player: Player) => `player-name-${player.id}`;

  async function addPlayer() {
    const player = game.addPlayer();
    await tick();
    document.getElementById(inputId(player))?.focus();
  }

  async function removePlayer(player: Player, index: number) {
    removing = game.displayName(index);
    if (game.hasScores(player)) {
      await tick();
      if (!(await confirmRemove.ask())) return;
    }
    game.removePlayer(player.id);
    await tick();
    // Keep focus nearby: the next player's name, or "Add Player".
    const next = game.players[Math.min(index, game.players.length - 1)];
    (next ? document.getElementById(inputId(next)) : addButton)?.focus();
  }

  async function clearPlayers() {
    if (await confirmClear.ask()) game.clearPlayers();
  }

  function onKeydown(event: KeyboardEvent, index: number) {
    // Enter moves to the next name, or adds a player after the last one.
    if (event.key !== "Enter") return;
    event.preventDefault();
    const next = game.players[index + 1];
    if (next) document.getElementById(inputId(next))?.focus();
    else addPlayer();
  }
</script>

<section class="start" aria-labelledby="sk-title">
  <FullscreenToggle class="start__fullscreen" />
  <div class="start__title">
    <h1 id="sk-title" class="title">Skull King</h1>
  </div>

  <div class="start__edit">
    <h2 id="sk-players" class="modal__label">Player Names:</h2>
    {#if !canSave}
      <p class="start__notice">
        This browser isn't allowing saved data, so the game will be lost if you leave the page.
      </p>
    {/if}
    {#if game.players.length === 0}
      <p>Add each player in seating order.</p>
    {/if}
    <ol class="start__list" aria-labelledby="sk-players">
      {#each game.players as player, index (player.id)}
        <li class="start__input-group">
          <label class="start__label" for={inputId(player)}>
            <span aria-hidden="true">{index + 1}</span>
            <span class="sr-only">Player {index + 1} name</span>
          </label>
          <input
            id={inputId(player)}
            class="start__input"
            type="text"
            autocomplete="off"
            enterkeyhint="next"
            bind:value={player.name}
            onkeydown={(e) => onKeydown(e, index)}
          />
          <button type="button" class="btn start__remove" onclick={() => removePlayer(player, index)}>
            Remove<span class="sr-only"> {game.displayName(index)}</span>
          </button>
        </li>
      {/each}
    </ol>
  </div>

  <div class="start__controls">
    <button type="button" class="btn start__control-btn" disabled={game.players.length === 0} onclick={clearPlayers}>
      Clear Data
    </button>
    <button
      type="button"
      class="btn start__control-btn"
      disabled={game.players.length === 0}
      onclick={() => game.start()}
    >
      Start Game
    </button>
    <button type="button" class="btn start__control-btn" bind:this={addButton} onclick={addPlayer}>Add Player</button>
  </div>
</section>

<ConfirmDialog
  bind:this={confirmClear}
  title="Clear all data?"
  message="This removes every player and all of their scores."
  confirmLabel="Clear Data"
/>
<ConfirmDialog
  bind:this={confirmRemove}
  title="Remove {removing}?"
  message="Their scores for this game will be deleted."
  confirmLabel="Remove"
/>

<style>
  .start {
    position: relative;
    margin: 1rem;
    min-height: calc(100dvh - 2rem);
    background: white;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow);
  }
  .start :global(.start__fullscreen) {
    position: absolute;
    right: 0;
    top: 0;
    padding: 0.5em;
    min-width: 44px;
    min-height: 44px;
  }
  .start__title {
    text-align: center;
  }
  .start__edit {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding-block-end: 1rem;
    padding-inline: 1rem;
    text-align: center;
  }
  .start__notice {
    max-width: 40rem;
    padding: 0.5rem 1rem;
    background: var(--color-offset);
    border: 1px solid var(--btn-border);
  }
  .start__list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    max-width: 40rem;
  }
  .start__input-group {
    display: flex;
    align-items: stretch;
    width: 100%;
  }
  .start__label {
    width: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--monospace);
  }
  .start__input {
    flex-grow: 1;
    min-height: 44px;
    font-family: var(--sans-serif);
    font-size: 1.125rem;
  }
  .start__remove {
    padding-inline: 0.75rem;
  }
  .start__controls {
    display: flex;
  }
  .start__control-btn {
    width: 100%;
    padding: 1rem;
  }
</style>
