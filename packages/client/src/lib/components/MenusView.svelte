<script lang="ts">
  import type { Menu, MenuCreate } from '@nostimos/shared';
  import { store } from '../store.svelte.js';
  import Modal from './Modal.svelte';

  let showForm = $state(false);
  let editing = $state<Menu | null>(null);

  const blank = (): MenuCreate => ({ name: '', dishIds: [], notes: '' });
  let form = $state<MenuCreate>(blank());

  function openNew() {
    editing = null;
    form = blank();
    showForm = true;
  }
  function openEdit(m: Menu) {
    editing = m;
    form = { name: m.name, dishIds: [...m.dishIds], notes: m.notes };
    showForm = true;
  }
  function toggle(id: string) {
    form.dishIds = form.dishIds.includes(id) ? form.dishIds.filter((x) => x !== id) : [...form.dishIds, id];
  }
  async function save() {
    if (editing) await store.editMenu(editing.id, form);
    else await store.addMenu(form);
    if (store.online) showForm = false;
  }
</script>

<div class="toolbar">
  <h2>Menus</h2>
  <span class="meta">{store.menus.length} menus</span>
  <div class="spacer"></div>
  <button class="primary" onclick={openNew}>+ New menu</button>
</div>

{#if store.menus.length === 0}
  <div class="empty">No menus yet. A menu (optionally named, e.g. "Sunday Roast") bundles one or more dishes.</div>
{:else}
  <div class="grid">
    {#each store.menus as m (m.id)}
      <div class="card">
        <h3>{m.name || 'Unnamed menu'}</h3>
        <div class="row">
          {#each m.dishIds as did (did)}<span class="chip muted">{store.dishById(did)?.name ?? '—'}</span>{/each}
        </div>
        {#if m.notes}<div class="meta">{m.notes}</div>{/if}
        <div class="actions">
          <button class="ghost" onclick={() => openEdit(m)}>Edit</button>
          <button class="ghost danger" onclick={() => confirm('Delete this menu?') && store.removeMenu(m.id)}>Delete</button>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if showForm}
  <Modal title={editing ? 'Edit menu' : 'New menu'} onclose={() => (showForm = false)}>
    <label class="field"><span>Name (optional)</span><input bind:value={form.name} placeholder="Sunday Roast" /></label>
    <div class="field"><span>Dishes</span></div>
    {#if store.dishes.length === 0}
      <p class="meta">No dishes yet — add some in the Dishes tab.</p>
    {:else}
      <div class="checks">
        {#each store.dishes as d (d.id)}
          <label><input type="checkbox" checked={form.dishIds.includes(d.id)} onchange={() => toggle(d.id)} />{d.name}</label>
        {/each}
      </div>
    {/if}
    <label class="field" style="margin-top:0.75rem"><span>Notes</span><textarea rows="2" bind:value={form.notes}></textarea></label>
    <div class="modal-actions">
      <button class="ghost" onclick={() => (showForm = false)}>Cancel</button>
      <button class="primary" onclick={save}>Save</button>
    </div>
  </Modal>
{/if}
