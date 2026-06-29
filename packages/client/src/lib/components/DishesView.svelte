<script lang="ts">
  import type { Dish, DishCreate } from '@nostimos/shared';
  import { store } from '../store.svelte.js';
  import Modal from './Modal.svelte';

  let showForm = $state(false);
  let editing = $state<Dish | null>(null);

  // Cover-image form state: a newly picked file, a "remove" flag, and a preview URL.
  let imageFile = $state<File | null>(null);
  let imageCleared = $state(false);
  let imagePreview = $state<string | null>(null);

  const blank = (): DishCreate => ({ name: '', categoryId: null, labelIds: [], recipeIds: [], notes: '', image: null });
  let form = $state<DishCreate>(blank());

  function resetImage(preview: string | null) {
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    imageFile = null;
    imageCleared = false;
    imagePreview = preview;
  }

  function openNew() {
    editing = null;
    form = blank();
    resetImage(null);
    showForm = true;
  }
  function openEdit(d: Dish) {
    editing = d;
    form = { name: d.name, categoryId: d.categoryId, labelIds: [...d.labelIds], recipeIds: [...d.recipeIds], notes: d.notes, image: d.image };
    resetImage(d.image);
    showForm = true;
  }
  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }
  function onImagePick(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    imageFile = file;
    imageCleared = false;
    imagePreview = URL.createObjectURL(file);
  }
  function removeImage() {
    resetImage(null);
    imageCleared = true;
  }
  async function save() {
    if (!form.name.trim()) return;
    const saved = editing ? await store.editDish(editing.id, form) : await store.addDish(form);
    if (!saved) return; // offline / error — keep the form open
    if (imageFile) await store.setDishImage(saved.id, imageFile);
    else if (imageCleared && editing?.image) await store.clearDishImage(saved.id);
    if (store.online) showForm = false;
  }
</script>

<div class="toolbar">
  <h2>Dishes</h2>
  <span class="meta">{store.dishes.length} dishes</span>
  <div class="spacer"></div>
  <button class="primary" onclick={openNew}>+ New dish</button>
</div>

{#if store.dishes.length === 0}
  <div class="empty">No dishes yet. A dish (e.g. "Tacos al Pastor") groups labels, a category, and one or more recipe options.</div>
{:else}
  <div class="grid">
    {#each store.dishes as d (d.id)}
      <div class="card">
        {#if d.image}
          <img class="cover" src={d.image} alt={d.name} loading="lazy" />
        {/if}
        <h3>{d.name}</h3>
        <div class="row">
          {#if d.categoryId}<span class="chip cat">{store.categoryById(d.categoryId)?.name ?? '—'}</span>{/if}
          {#each d.labelIds as lid (lid)}<span class="chip">{store.labelById(lid)?.name ?? '—'}</span>{/each}
        </div>
        <div class="meta">{d.recipeIds.length} recipe option{d.recipeIds.length === 1 ? '' : 's'}</div>
        <div class="actions">
          <button class="ghost" onclick={() => openEdit(d)}>Edit</button>
          <button class="ghost danger" onclick={() => confirm(`Delete "${d.name}"?`) && store.removeDish(d.id)}>Delete</button>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if showForm}
  <Modal title={editing ? 'Edit dish' : 'New dish'} onclose={() => (showForm = false)}>
    <label class="field"><span>Name</span><input bind:value={form.name} placeholder="Tacos al Pastor" /></label>
    <label class="field">
      <span>Category</span>
      <select bind:value={form.categoryId}>
        <option value={null}>— none —</option>
        {#each store.categories as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
      </select>
    </label>

    <div class="field"><span>Labels (cuisine)</span></div>
    {#if store.labels.length === 0}
      <p class="meta">No labels yet — add some in Settings.</p>
    {:else}
      <div class="checks">
        {#each store.labels as l (l.id)}
          <label
            ><input type="checkbox" checked={form.labelIds.includes(l.id)} onchange={() => (form.labelIds = toggle(form.labelIds, l.id))} />{l.name}</label
          >
        {/each}
      </div>
    {/if}

    <div class="field" style="margin-top:0.75rem"><span>Recipe options</span></div>
    {#if store.recipes.length === 0}
      <p class="meta">No recipes yet — add some in the Recipes tab.</p>
    {:else}
      <div class="checks">
        {#each store.recipes as r (r.id)}
          <label
            ><input type="checkbox" checked={form.recipeIds.includes(r.id)} onchange={() => (form.recipeIds = toggle(form.recipeIds, r.id))} />{r.title}</label
          >
        {/each}
      </div>
    {/if}

    <div class="field" style="margin-top:0.75rem">
      <span>Cover photo</span>
      {#if imagePreview}<img class="preview" src={imagePreview} alt="cover preview" />{/if}
      <div class="row">
        <input type="file" accept="image/*" onchange={onImagePick} />
        {#if imagePreview}<button type="button" class="ghost danger" onclick={removeImage}>Remove photo</button>{/if}
      </div>
    </div>

    <label class="field" style="margin-top:0.75rem"><span>Notes</span><textarea rows="2" bind:value={form.notes}></textarea></label>
    <div class="modal-actions">
      <button class="ghost" onclick={() => (showForm = false)}>Cancel</button>
      <button class="primary" onclick={save} disabled={!form.name.trim()}>Save</button>
    </div>
  </Modal>
{/if}
