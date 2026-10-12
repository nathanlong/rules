<script lang="ts">
  import { tick, untrack } from "svelte";
  import NumberStepper from "~/components/tools/NumberStepper.svelte";
  import { BONUS_STEP, cardsInRound, roundScore } from "./scoring";
  import type { EditTarget, SkullKingGame } from "./state.svelte";

  let {
    game,
    target,
    onnavigate,
    onclose,
    onsaved,
  }: {
    game: SkullKingGame;
    target: EditTarget | null;
    onnavigate: (target: EditTarget) => void;
    onclose: () => void;
    onsaved: (playerIndex: number, roundIndex: number) => void;
  } = $props();

  const STEPS = ["Bid", "Won", "Bonus"] as const;
  const BONUS_PICKS = [0, 10, 20, 30, 40, 50, 60];

  let dialog: HTMLDialogElement;
  let panel = $state<HTMLElement>();
  let step = $state(0);
  let draft = $state({ bid: 0, won: 0, bonus: 0 });

  const cards = $derived(target ? cardsInRound(target.round) : 1);
  const picks = $derived(Array.from({ length: cards + 1 }, (_, i) => i));
  const preview = $derived(target ? roundScore(draft, target.round, game.rules) : null);
  const isLast = $derived(!!target && target.player === game.players.length - 1);

  // Open/close the native dialog to match `target`, and load the round into the draft.
  $effect(() => {
    if (!target) {
      if (dialog.open) dialog.close();
      return;
    }
    const { player, round } = target;
    untrack(() => {
      const saved = game.players[player].rounds[round];
      draft = { bid: saved.bid ?? 0, won: saved.won ?? 0, bonus: saved.bonus };
      step = 0;
      if (!dialog.open) dialog.showModal();
    });
    focusStep();
  });

  async function focusStep() {
    await tick();
    panel?.querySelector<HTMLElement>(".editor__edit-btn")?.focus();
  }

  function goToStep(next: number) {
    step = next;
    focusStep();
  }

  function pick(field: "bid" | "won" | "bonus", value: number) {
    draft[field] = value;
    if (field === "bonus") save();
    else goToStep(step + 1);
  }

  function save() {
    if (!target) return;
    const { player, round, chain } = target;
    game.setRound(player, round, draft);
    onsaved(player, round);
    if (chain && player < game.players.length - 1) onnavigate({ player: player + 1, round, chain });
    else onclose();
  }

  function previous() {
    if (!target || target.player === 0) return;
    game.setRound(target.player, target.round, draft);
    onnavigate({ ...target, player: target.player - 1 });
  }

  function clearRound() {
    if (!target) return;
    game.clearRound(target.player, target.round);
    onclose();
  }
</script>

<dialog
  bind:this={dialog}
  class="editor"
  aria-labelledby="sk-editor-title"
  oncancel={(e) => {
    e.preventDefault();
    onclose();
  }}
>
  {#if target}
    <div class="editor__title">
      {#if target.chain}
        <div class="editor__eyebrow">
          <p>Scoring round {target.round + 1}</p>
          <p class="editor__player-index">
            <span class="sr-only">Player </span>{target.player + 1}<span aria-hidden="true">/</span><span
              class="sr-only"
            >
              of
            </span>{game.players.length}
          </p>
        </div>
      {/if}
      <div class="editor__title__inner">
        <h2 id="sk-editor-title" class="modal__label editor__title__name">
          {game.displayName(target.player)}<span class="sr-only">, round {target.round + 1}</span>
        </h2>
        <p class="editor__summary" aria-live="polite">
          <span class="editor__round-tag" aria-hidden="true">R{target.round + 1}</span>
          Bid {draft.bid} · Won {draft.won} · Bonus {draft.bonus} ·
          <strong>Score {preview}</strong>
        </p>
      </div>
    </div>

    <div class="editor__tabs" role="group" aria-label="Entry step">
      {#each STEPS as label, i}
        <button
          type="button"
          class="btn editor__tabs-btn"
          class:active={step === i}
          aria-current={step === i ? "step" : undefined}
          onclick={() => goToStep(i)}>{label}</button
        >
      {/each}
    </div>

    <div class="editor__edit-group" bind:this={panel}>
      {#if step === 0}
        <NumberStepper id="sk-bid" label="Bid" bind:value={draft.bid} min={0} max={cards} />
        <div class="editor__btn-group" role="group" aria-label="Choose bid">
          {#each picks as n}
            <button
              type="button"
              class="btn editor__edit-btn"
              aria-pressed={draft.bid === n}
              onclick={() => pick("bid", n)}>{n}</button
            >
          {/each}
          <button type="button" class="btn editor__edit-btn editor__next" onclick={() => goToStep(1)}>Won →</button>
        </div>
      {:else if step === 1}
        <NumberStepper id="sk-won" label="Tricks won" bind:value={draft.won} min={0} max={cards} />
        <div class="editor__btn-group" role="group" aria-label="Choose tricks won">
          {#each picks as n}
            <button
              type="button"
              class="btn editor__edit-btn"
              aria-pressed={draft.won === n}
              onclick={() => pick("won", n)}>{n}</button
            >
          {/each}
          <button type="button" class="btn editor__edit-btn editor__next" onclick={() => goToStep(2)}>Bonus →</button>
        </div>
      {:else}
        <NumberStepper id="sk-bonus" label="Bonus" bind:value={draft.bonus} min={0} step={BONUS_STEP} />
        <div class="editor__btn-group" role="group" aria-label="Choose bonus and save">
          {#each BONUS_PICKS as n}
            <button
              type="button"
              class="btn editor__edit-btn"
              aria-pressed={draft.bonus === n}
              onclick={() => pick("bonus", n)}>{n}</button
            >
          {/each}
        </div>
      {/if}
    </div>

    <div class="editor__controls">
      <button type="button" class="btn editor__controls-btn" disabled={target.player === 0} onclick={previous}>
        ← Prev
      </button>
      <button type="button" class="btn editor__controls-btn" onclick={clearRound}>Clear</button>
      <button type="button" class="btn editor__controls-btn" onclick={onclose}>Cancel</button>
      <button type="button" class="btn editor__controls-btn" onclick={save}>
        {target.chain && !isLast ? "Next →" : "Save"}
      </button>
    </div>
  {/if}
</dialog>

<style>
  .editor {
    position: fixed;
    inset: 1rem;
    width: auto;
    height: auto;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--bg);
    color: inherit;
    box-shadow: var(--shadow);
  }
  .editor[open] {
    display: flex;
    flex-direction: column;
  }
  .editor::backdrop {
    background: rgb(0 0 0 / 0.4);
  }
  .editor__eyebrow {
    display: flex;
    justify-content: space-between;
    background-color: var(--color-offset);
    padding: 0.5rem 1rem;
  }
  .editor__player-index {
    font-family: var(--monospace);
  }
  .editor__title__inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0 1rem;
    padding-inline: 1rem;
  }
  .editor__title__name {
    flex-shrink: 1;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
  .editor__summary {
    font-family: var(--monospace);
    font-size: 0.875rem;
  }
  .editor__round-tag {
    border: 1px solid black;
    padding: 0 0.25em;
  }
  .editor__tabs {
    display: flex;
  }
  .editor__tabs-btn {
    --btn-bg: var(--btn-secondary-bg);
    --btn-border: var(--btn-secondary-border);
    --btn-text: var(--btn-secondary-text);
    width: 100%;
    padding: 0.75rem 0.5rem;
  }
  .editor__tabs-btn.active {
    --btn-bg: var(--btn-secondary-bg-active);
    --btn-border: var(--btn-secondary-border-active);
    font-weight: bold;
  }
  .editor__edit-group {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .editor__btn-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: minmax(3rem, 1fr);
    flex-grow: 1;
  }
  .editor__edit-btn {
    --btn-bg: var(--btn-bg-offset);
    --btn-border: var(--btn-border-offset);
    --btn-text: var(--btn-calc-text);
    font-family: var(--monospace);
    font-size: 1.5rem;
  }
  .editor__edit-btn[aria-pressed="true"] {
    --btn-bg: var(--btn-bg-active);
    --btn-border: var(--btn-border-active);
    font-weight: bold;
  }
  .editor__next {
    font-size: 1rem;
  }
  .editor__controls {
    display: flex;
  }
  .editor__controls-btn {
    width: 100%;
    padding: 1rem 0.5rem;
  }
</style>
