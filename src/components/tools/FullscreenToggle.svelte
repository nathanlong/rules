<script lang="ts">
  let { class: className = "" }: { class?: string } = $props();

  let supported = $state(false);
  let active = $state(false);

  $effect(() => {
    supported = document.fullscreenEnabled;
    const sync = () => (active = document.fullscreenElement !== null);
    sync();
    // Stay in sync when fullscreen is left with Esc or a browser control.
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  });

  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // The browser refused (e.g. not triggered by a user gesture); state stays in sync via the event.
    }
  }
</script>

{#if supported}
  <button type="button" class="btn {className}" aria-pressed={active} onclick={toggle}>
    <span class="sr-only">Full screen</span>
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      width="24"
      viewBox="0 -960 960 960"
      fill="currentColor"
    >
      {#if active}
        <path
          d="M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z"
        />
      {:else}
        <path
          d="M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z"
        />
      {/if}
    </svg>
  </button>
{/if}
