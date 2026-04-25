import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from '@/App.jsx'
import './globals.css'
import '@/index.css'

import './i18n';

// ── Dark mode: sync with system preference ──────────────────────────────────
const applyColorScheme = (dark) => {
  document.documentElement.classList.toggle('dark', dark);
};
const mq = window.matchMedia('(prefers-color-scheme: dark)');
applyColorScheme(mq.matches);
mq.addEventListener('change', e => applyColorScheme(e.matches));

// Registrar Service Worker diferido (no bloquea renderizado)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <HelmetProvider>
    <App />
  </HelmetProvider>
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}