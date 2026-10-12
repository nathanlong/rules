<script lang="ts">
  /** A labelled number input with large − / + buttons. */
  let {
    label,
    value = $bindable(0),
    min = -Infinity,
    max = Infinity,
    step = 1,
    id,
  }: { label: string; value?: number; min?: number; max?: number; step?: number; id: string } = $props();

  const clamp = (n: number) => Math.min(Math.max(n, min), max);

  function onInput(event: Event) {
    const n = Number.parseInt((event.currentTarget as HTMLInputElement).value, 10);
    if (Number.isFinite(n)) value = clamp(n);
  }
</script>

<div class="stepper">
  <label class="sr-only" for={id}>{label}</label>
  <button
    type="button"
    class="btn stepper__btn"
    aria-label="Decrease {label.toLowerCase()}"
    disabled={value <= min}
    onclick={() => (value = clamp(value - step))}>−</button
  >
  <input
    {id}
    class="stepper__input"
    type="number"
    inputmode="numeric"
    min={Number.isFinite(min) ? min : undefined}
    max={Number.isFinite(max) ? max : undefined}
    {step}
    {value}
    oninput={onInput}
  />
  <button
    type="button"
    class="btn stepper__btn"
    aria-label="Increase {label.toLowerCase()}"
    disabled={value >= max}
    onclick={() => (value = clamp(value + step))}>+</button
  >
</div>

<style>
  .stepper {
    display: flex;
    width: 100%;
  }
  .stepper__btn {
    min-width: 4rem;
    min-height: 3rem;
    font-size: 1.5rem;
  }
  .stepper__input {
    flex-grow: 1;
    width: 100%;
    text-align: center;
    font-size: 2rem;
  }
</style>
