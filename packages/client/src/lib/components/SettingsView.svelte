<script lang="ts">
  import { store } from '../store.svelte.js';

  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let labelName = $state('');
  let labelColor = $state('#c2562f');
  let categoryName = $state('');
  let dayWeekday = $state(2);
  let dayLabelText = $state('');

  async function addLabel() {
    if (!labelName.trim()) return;
    await store.addLabel({ name: labelName.trim(), color: labelColor });
    labelName = '';
  }
  async function addCategory() {
    if (!categoryName.trim()) return;
    await store.addCategory({ name: categoryName.trim() });
    categoryName = '';
  }
  async function addDayLabel() {
    if (!dayLabelText.trim()) return;
    await store.addDayLabel({ weekday: dayWeekday, label: dayLabelText.trim() });
    dayLabelText = '';
  }
</script>

<div class="toolbar"><h2>Settings</h2></div>

<div class="grid">
  <div class="card">
    <h3>Dish labels</h3>
    <div class="meta">Cuisine tags like Italian, Tex-Mex, Greek.</div>
    <div class="inline-add">
      <input bind:value={labelName} placeholder="Greek" onkeydown={(e) => e.key === 'Enter' && addLabel()} />
      <input type="color" bind:value={labelColor} style="width:44px;padding:2px" />
      <button class="primary" onclick={addLabel}>Add</button>
    </div>
    <div class="row">
      {#each store.labels as l (l.id)}
        <span class="chip"
          >{l.name}
          <button class="ghost danger" style="padding:0 4px" onclick={() => store.removeLabel(l.id)} aria-label="delete">×</button></span
        >
      {/each}
      {#if store.labels.length === 0}<span class="meta">none yet</span>{/if}
    </div>
  </div>

  <div class="card">
    <h3>Dish categories</h3>
    <div class="meta">Shapes of a meal like tacos, pasta, rice bowl, salad.</div>
    <div class="inline-add">
      <input bind:value={categoryName} placeholder="rice bowl" onkeydown={(e) => e.key === 'Enter' && addCategory()} />
      <button class="primary" onclick={addCategory}>Add</button>
    </div>
    <div class="row">
      {#each store.categories as c (c.id)}
        <span class="chip cat"
          >{c.name}
          <button class="ghost danger" style="padding:0 4px" onclick={() => store.removeCategory(c.id)} aria-label="delete">×</button></span
        >
      {/each}
      {#if store.categories.length === 0}<span class="meta">none yet</span>{/if}
    </div>
  </div>

  <div class="card">
    <h3>Day labels</h3>
    <div class="meta">Persistent weekday themes, e.g. Taco Tuesday — shown as suggestions on the calendar.</div>
    <div class="inline-add">
      <select bind:value={dayWeekday} style="width:auto">
        {#each WEEKDAYS as d, i (i)}<option value={i}>{d}</option>{/each}
      </select>
      <input bind:value={dayLabelText} placeholder="Taco Tuesday" onkeydown={(e) => e.key === 'Enter' && addDayLabel()} />
      <button class="primary" onclick={addDayLabel}>Add</button>
    </div>
    <div class="row" style="flex-direction:column;align-items:flex-start;gap:0.3rem">
      {#each store.dayLabels as dl (dl.id)}
        <div><strong>{WEEKDAYS[dl.weekday]}</strong> → {dl.label}
          <button class="ghost danger" style="padding:0 4px" onclick={() => store.removeDayLabel(dl.id)}>×</button>
        </div>
      {/each}
      {#if store.dayLabels.length === 0}<span class="meta">none yet</span>{/if}
    </div>
  </div>
</div>
