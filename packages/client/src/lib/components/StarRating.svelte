<script lang="ts">
  let {
    value = null,
    onchange,
    readonly = false,
  }: { value: number | null; onchange?: (v: number | null) => void; readonly?: boolean } = $props();
</script>

<span class="stars">
  {#each [1, 2, 3, 4, 5] as n (n)}
    <button
      type="button"
      class:off={!(value && n <= value)}
      disabled={readonly}
      aria-label={`${n} star${n > 1 ? 's' : ''}`}
      onclick={() => onchange?.(value === n ? null : n)}
    >
      ★
    </button>
  {/each}
</span>
