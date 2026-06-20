<script lang="ts">
  import type { MealPlanEntry, MealSlot } from '@nostimos/shared';
  import { store } from '../store.svelte.js';
  import Modal from './Modal.svelte';

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const SLOTS: MealSlot[] = ['lunch', 'dinner'];

  let mode = $state<'week' | 'month'>('week');
  let anchor = $state(new Date());

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = fmt(new Date());

  function startOfWeek(d: Date): Date {
    const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    c.setDate(c.getDate() - c.getDay());
    return c;
  }

  const days = $derived.by(() => {
    const out: Date[] = [];
    if (mode === 'week') {
      const start = startOfWeek(anchor);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        out.push(d);
      }
    } else {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const start = startOfWeek(first);
      for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        out.push(d);
      }
    }
    return out;
  });

  const title = $derived.by(() => {
    if (mode === 'week') {
      const s = days[0];
      const e = days[6];
      if (!s || !e) return '';
      return `${MONTHS[s.getMonth()]?.slice(0, 3)} ${s.getDate()} – ${MONTHS[e.getMonth()]?.slice(0, 3)} ${e.getDate()}, ${e.getFullYear()}`;
    }
    return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  });

  function shift(dir: number) {
    const c = new Date(anchor);
    if (mode === 'week') c.setDate(c.getDate() + dir * 7);
    else c.setMonth(c.getMonth() + dir);
    anchor = c;
  }

  function entryFor(dateStr: string, slot: MealSlot): MealPlanEntry | undefined {
    return store.plan.find((e) => e.date === dateStr && e.slot === slot);
  }
  function entryName(e: MealPlanEntry): string {
    if (e.dishId) return store.dishById(e.dishId)?.name ?? 'dish';
    if (e.menuId) return store.menuById(e.menuId)?.name || 'menu';
    return '—';
  }
  function dayLabelFor(d: Date): string | undefined {
    return store.dayLabels.find((dl) => dl.weekday === d.getDay())?.label;
  }

  // ── Slot editor ──
  let editing = $state<{ date: string; slot: MealSlot; entry?: MealPlanEntry } | null>(null);
  let kind = $state<'dish' | 'menu'>('dish');
  let targetId = $state('');

  function openSlot(dateStr: string, slot: MealSlot) {
    const entry = entryFor(dateStr, slot);
    editing = { date: dateStr, slot, entry };
    if (entry?.menuId) {
      kind = 'menu';
      targetId = entry.menuId;
    } else {
      kind = 'dish';
      targetId = entry?.dishId ?? '';
    }
  }

  async function saveSlot() {
    if (!editing || !targetId) return;
    const dishId = kind === 'dish' ? targetId : null;
    const menuId = kind === 'menu' ? targetId : null;
    if (editing.entry) await store.editEntry(editing.entry.id, { dishId, menuId });
    else await store.addEntry({ date: editing.date, slot: editing.slot, dishId, menuId, notes: '' });
    if (store.online) editing = null;
  }
  async function clearSlot() {
    if (editing?.entry) await store.removeEntry(editing.entry.id);
    if (store.online) editing = null;
  }
</script>

<div class="toolbar">
  <h2>Meal Plan</h2>
  <div class="spacer"></div>
  <button onclick={() => (anchor = new Date())}>Today</button>
  <button onclick={() => shift(-1)} aria-label="previous">‹</button>
  <strong style="min-width:13ch;text-align:center">{title}</strong>
  <button onclick={() => shift(1)} aria-label="next">›</button>
  <button class:primary={mode === 'week'} onclick={() => (mode = 'week')}>Week</button>
  <button class:primary={mode === 'month'} onclick={() => (mode = 'month')}>Month</button>
</div>

<div class="cal-head">
  {#each WEEKDAYS as w (w)}<div>{w}</div>{/each}
</div>

<div class="cal-grid {mode}">
  {#each days as d (fmt(d))}
    {@const ds = fmt(d)}
    {@const inMonth = mode === 'week' || d.getMonth() === anchor.getMonth()}
    {@const dl = dayLabelFor(d)}
    <div class="day" class:dim={!inMonth} class:today={ds === todayStr}>
      <div class="dnum">
        <span>{d.getDate()}</span>
        {#if dl}<span class="daylabel">{dl}</span>{/if}
      </div>
      {#each SLOTS as slot (slot)}
        {@const e = entryFor(ds, slot)}
        <button class="slot" class:filled={!!e} onclick={() => openSlot(ds, slot)}>
          {#if e}
            <span>{entryName(e)}</span>
          {:else}
            <span class="tag">{slot}</span>
          {/if}
          <span class="tag">{slot[0]?.toUpperCase()}</span>
        </button>
      {/each}
    </div>
  {/each}
</div>

{#if editing}
  <Modal title={`${editing.slot} · ${editing.date}`} onclose={() => (editing = null)}>
    <label class="field">
      <span>Assign a…</span>
      <select bind:value={kind} onchange={() => (targetId = '')}>
        <option value="dish">Dish</option>
        <option value="menu">Menu</option>
      </select>
    </label>
    <label class="field">
      <span>{kind === 'dish' ? 'Dish' : 'Menu'}</span>
      <select bind:value={targetId}>
        <option value="">— choose —</option>
        {#if kind === 'dish'}
          {#each store.dishes as d (d.id)}<option value={d.id}>{d.name}</option>{/each}
        {:else}
          {#each store.menus as m (m.id)}<option value={m.id}>{m.name || 'Unnamed menu'}</option>{/each}
        {/if}
      </select>
    </label>
    {#if (kind === 'dish' && store.dishes.length === 0) || (kind === 'menu' && store.menus.length === 0)}
      <p class="meta">Nothing to pick yet — create {kind === 'dish' ? 'a dish' : 'a menu'} first.</p>
    {/if}
    <div class="modal-actions">
      {#if editing.entry}<button class="ghost danger" onclick={clearSlot}>Clear</button>{/if}
      <button class="ghost" onclick={() => (editing = null)}>Cancel</button>
      <button class="primary" onclick={saveSlot} disabled={!targetId}>Save</button>
    </div>
  </Modal>
{/if}
