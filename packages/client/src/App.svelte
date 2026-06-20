<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './lib/store.svelte.js';
  import PlanView from './lib/components/PlanView.svelte';
  import RecipesView from './lib/components/RecipesView.svelte';
  import DishesView from './lib/components/DishesView.svelte';
  import MenusView from './lib/components/MenusView.svelte';
  import SettingsView from './lib/components/SettingsView.svelte';

  type Tab = 'plan' | 'recipes' | 'dishes' | 'menus' | 'settings';
  let tab = $state<Tab>('plan');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'plan', label: 'Plan' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'dishes', label: 'Dishes' },
    { id: 'menus', label: 'Menus' },
    { id: 'settings', label: 'Settings' },
  ];

  onMount(() => {
    void store.refresh();
  });
</script>

<div class="app">
  <header class="top">
    <h1><span class="brand">Nostimos</span> · Family Meals</h1>
    <div class="sync">
      <span class="dot" class:off={!store.online}></span>
      {#if store.syncing}
        syncing…
      {:else if store.online}
        synced
      {:else}
        offline (showing cached)
      {/if}
      <button class="ghost" onclick={() => store.refresh()} disabled={store.syncing} title="Refresh from server">↻</button>
    </div>
  </header>

  <nav class="tabs">
    {#each tabs as t (t.id)}
      <button class:active={tab === t.id} onclick={() => (tab = t.id)}>{t.label}</button>
    {/each}
  </nav>

  {#if store.lastError && !store.online}
    <div class="banner">Can't reach the server — {store.lastError}. Changes need a connection to sync.</div>
  {/if}

  {#if tab === 'plan'}
    <PlanView />
  {:else if tab === 'recipes'}
    <RecipesView />
  {:else if tab === 'dishes'}
    <DishesView />
  {:else if tab === 'menus'}
    <MenusView />
  {:else}
    <SettingsView />
  {/if}
</div>
