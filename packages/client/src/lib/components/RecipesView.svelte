<script lang="ts">
  import type { Recipe, RecipeCreate } from '@nostimos/shared';
  import { store } from '../store.svelte.js';
  import Modal from './Modal.svelte';
  import StarRating from './StarRating.svelte';

  let editing = $state<Recipe | null>(null);
  let showForm = $state(false);
  let importing = $state(false);
  let importText = $state('');

  const blank = (): RecipeCreate => ({ title: '', ingredients: '', steps: '', notes: '', rating: null, sourceUrl: null });
  let form = $state<RecipeCreate>(blank());

  function openNew() {
    editing = null;
    form = blank();
    showForm = true;
  }
  function openEdit(r: Recipe) {
    editing = r;
    form = { title: r.title, ingredients: r.ingredients, steps: r.steps, notes: r.notes, rating: r.rating, sourceUrl: r.sourceUrl };
    showForm = true;
  }

  async function save() {
    if (!form.title.trim()) return;
    const payload: RecipeCreate = { ...form, sourceUrl: form.sourceUrl?.trim() ? form.sourceUrl.trim() : null };
    if (editing) await store.editRecipe(editing.id, payload);
    else await store.addRecipe(payload);
    if (store.online) showForm = false;
  }

  async function onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    importText = await file.text();
  }

  async function runImport() {
    if (!importText.trim()) return;
    await store.importRecipe(importText);
    if (store.online) {
      importing = false;
      importText = '';
    }
  }
</script>

<div class="toolbar">
  <h2>Recipe Book</h2>
  <span class="meta">{store.recipes.length} recipes</span>
  <div class="spacer"></div>
  <button onclick={() => (importing = true)}>Import .txt</button>
  <button class="primary" onclick={openNew}>+ New recipe</button>
</div>

{#if store.recipes.length === 0}
  <div class="empty">No recipes yet. Add one, or import a plain-text recipe.</div>
{:else}
  <div class="grid">
    {#each store.recipes as r (r.id)}
      <div class="card">
        <h3>{r.title}</h3>
        <div class="row">
          <StarRating value={r.rating} readonly />
          {#if r.sourceUrl}<a href={r.sourceUrl} target="_blank" rel="noreferrer" class="meta">inspiration ↗</a>{/if}
        </div>
        {#if r.notes}<div class="meta">{r.notes.slice(0, 120)}{r.notes.length > 120 ? '…' : ''}</div>{/if}
        <div class="actions">
          <button class="ghost" onclick={() => openEdit(r)}>Edit</button>
          <button class="ghost danger" onclick={() => confirm(`Delete "${r.title}"?`) && store.removeRecipe(r.id)}>Delete</button>
        </div>
      </div>
    {/each}
  </div>
{/if}

{#if showForm}
  <Modal title={editing ? 'Edit recipe' : 'New recipe'} onclose={() => (showForm = false)}>
    <label class="field"><span>Title</span><input bind:value={form.title} placeholder="Grandma's moussaka" /></label>
    <label class="field"><span>Ingredients</span><textarea rows="4" bind:value={form.ingredients}></textarea></label>
    <label class="field"><span>Steps</span><textarea rows="5" bind:value={form.steps}></textarea></label>
    <label class="field"><span>Notes</span><textarea rows="2" bind:value={form.notes}></textarea></label>
    <label class="field"><span>Inspiration link</span><input bind:value={form.sourceUrl} placeholder="https://…" /></label>
    <label class="field"
      ><span>Rating</span><StarRating value={form.rating} onchange={(v) => (form.rating = v)} /></label
    >
    <div class="modal-actions">
      <button class="ghost" onclick={() => (showForm = false)}>Cancel</button>
      <button class="primary" onclick={save} disabled={!form.title.trim()}>Save</button>
    </div>
  </Modal>
{/if}

{#if importing}
  <Modal title="Import recipe from text" onclose={() => (importing = false)}>
    <p class="meta">
      Paste a recipe or choose a .txt file. Use lines like <code>Ingredients</code> and <code>Steps</code> as headers; a
      <code>Source:</code> line or a bare URL becomes the inspiration link.
    </p>
    <label class="field"><span>Upload .txt</span><input type="file" accept=".txt,text/plain" onchange={onFile} /></label>
    <label class="field"><span>Or paste text</span><textarea rows="8" bind:value={importText}></textarea></label>
    <div class="modal-actions">
      <button class="ghost" onclick={() => (importing = false)}>Cancel</button>
      <button class="primary" onclick={runImport} disabled={!importText.trim()}>Import</button>
    </div>
  </Modal>
{/if}
