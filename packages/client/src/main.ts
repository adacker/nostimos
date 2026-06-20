// CONTRACT:C1-APP.1.0
// Client entrypoint: mounts the root Svelte component.
import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app mount point not found');

export default mount(App, { target });
