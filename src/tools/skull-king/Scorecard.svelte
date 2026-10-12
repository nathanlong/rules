<script lang="ts">
  import { createToolStorage } from "~/lib/tools/storage";
  import Board from "./Board.svelte";
  import RoundEditor from "./RoundEditor.svelte";
  import Setup from "./Setup.svelte";
  import { ROUNDS } from "./scoring";
  import { SkullKingGame, type EditTarget } from "./state.svelte";
  import { loadGame, saveGame } from "./storage";

  const SAVE_DELAY = 250;

  const storage = createToolStorage();
  const game = new SkullKingGame(loadGame(storage));

  let target = $state<EditTarget | null>(null);
  let announcement = $state("");
  /** The board cell to return focus to when the editor closes. */
  let returnFocus: HTMLElement | null = null;

  // Save shortly after any change, and immediately when the page is hidden or closed.
  $effect(() => {
    const snapshot = game.toJSON();
    const timer = setTimeout(() => saveGame(snapshot, storage), SAVE_DELAY);
    return () => clearTimeout(timer);
  });

  $effect(() => {
    const flush = () => saveGame(game.toJSON(), storage);
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  });

  // Keep the screen awake during a game, where the browser supports it.
  $effect(() => {
    if (!game.started || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Not allowed (battery saver, permissions): the game still works.
      }
    };
    const onVisible = () => document.visibilityState === "visible" && request();
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  });

  function openEditor(next: EditTarget) {
    returnFocus ??= document.activeElement as HTMLElement | null;
    target = next;
  }

  function closeEditor() {
    target = null;
    returnFocus?.focus();
    returnFocus = null;
  }

  function announceSaved(player: number, round: number) {
    const score = game.score(player, round);
    announcement = `${game.displayName(player)}: round ${round + 1} score ${score}, total ${game.totals[player]}.`;
  }
</script>

<div class="app">
  {#if !game.started}
    <Setup {game} canSave={storage.available} />
  {:else}
    <Board {game} onedit={(player, round) => openEditor({ player, round, chain: false })} />

    <div class="controls">
      <button type="button" class="btn controls__btn" onclick={() => game.edit()}
        >Edit<span class="sr-only"> players</span></button
      >
      <div class="controls__middle">
        <button
          type="button"
          class="btn controls__btn"
          aria-label="Previous round"
          disabled={game.currentRound === 0}
          onclick={() => game.goToRound(game.currentRound - 1)}>−</button
        >
        <p class="controls__round" aria-live="polite">Round: {game.currentRound + 1}</p>
        <button
          type="button"
          class="btn controls__btn"
          aria-label="Next round"
          disabled={game.currentRound === ROUNDS - 1}
          onclick={() => game.goToRound(game.currentRound + 1)}>+</button
        >
      </div>
      <button
        type="button"
        class="btn controls__btn"
        onclick={() => openEditor({ player: 0, round: game.currentRound, chain: true })}
        >Record<span class="sr-only"> round</span></button
      >
    </div>
  {/if}

  <RoundEditor {game} {target} onnavigate={(next) => (target = next)} onclose={closeEditor} onsaved={announceSaved} />

  <p class="sr-only" role="status">{announcement}</p>
</div>

<style>
  .app {
    min-height: 100dvh;
  }
  .controls {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    height: var(--controls-height);
    display: flex;
    justify-content: space-between;
    box-shadow: var(--shadow);
    background-color: var(--bg);
    z-index: 20;
  }
  .controls__middle {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
  .controls__round {
    font-weight: bold;
    white-space: nowrap;
  }
  .controls__btn {
    padding: 0 1rem;
    min-width: 44px;
  }
</style>
