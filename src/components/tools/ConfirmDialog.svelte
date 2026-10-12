<script lang="ts">
  /**
   * Accessible confirmation using the native <dialog>: focus is trapped, Esc
   * cancels, and the rest of the page is inert while it's open.
   * Call `ask()` to open it; it resolves to true when confirmed.
   */
  let {
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
  }: { title: string; message: string; confirmLabel?: string; cancelLabel?: string } = $props();

  const uid = $props.id();
  let dialog: HTMLDialogElement;
  let resolve: ((ok: boolean) => void) | undefined;

  export function ask(): Promise<boolean> {
    dialog.showModal();
    return new Promise((r) => (resolve = r));
  }

  function close(ok: boolean) {
    dialog.close();
    resolve?.(ok);
    resolve = undefined;
  }
</script>

<dialog bind:this={dialog} class="confirm" aria-labelledby="{uid}-title" oncancel={() => resolve?.(false)}>
  <h2 id="{uid}-title" class="modal__label">{title}</h2>
  <p>{message}</p>
  <div class="confirm__actions">
    <!-- Focus starts on the safe choice. -->
    <!-- svelte-ignore a11y_autofocus -->
    <button type="button" class="btn confirm__btn" autofocus onclick={() => close(false)}>{cancelLabel}</button>
    <button type="button" class="btn confirm__btn" onclick={() => close(true)}>{confirmLabel}</button>
  </div>
</dialog>

<style>
  .confirm {
    margin: auto;
    padding: 1.5rem;
    max-width: min(24rem, calc(100vw - 2rem));
    border: 0;
    box-shadow: var(--shadow);
    background: var(--bg);
    color: inherit;
  }
  .confirm::backdrop {
    background: rgb(0 0 0 / 0.5);
  }
  .confirm p {
    margin-block: 1rem;
  }
  .confirm__actions {
    display: flex;
    gap: 0.5rem;
  }
  .confirm__btn {
    flex: 1;
    padding: 0.75rem 1rem;
  }
</style>
