// Polyfill requestIdleCallback — Safari (iOS/macOS) no la implementa
if (typeof window !== 'undefined' && !window.requestIdleCallback) {
  window.requestIdleCallback = function(cb, options) {
    var start = Date.now();
    return setTimeout(function() {
      cb({
        didTimeout: false,
        timeRemaining: function() { return Math.max(0, 50 - (Date.now() - start)); }
      });
    }, (options && options.timeout) ? Math.min(options.timeout, 1) : 1);
  };
  window.cancelIdleCallback = function(id) { clearTimeout(id); };
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { getPublicPageData, seedPublicQueries } from '@/lib/publicPageData'
import { queryClientInstance } from '@/lib/query-client'

// Fonts and styles arrive in the HTML stylesheet before its first paint.
import './fonts.css'

import './globals.css'
import '@/index.css'

import './i18n';

// Capacitor: en nativo, inicia el listener de deep-links y persiste la sesión
// de Supabase con @capacitor/preferences. En web es no-op.
import { initDeepLinkAuth } from '@/lib/deepLinkAuth';
initDeepLinkAuth();

// Capacitor iOS: StatusBar por defecto en Style.Dark (texto oscuro sobre
// fondo claro) porque la mayor parte de las pantallas usan fondo blanco.
// Las pantallas con hero azul (dashboard) pueden cambiarlo localmente.
import { setStatusBarStyle } from '@/lib/native';
setStatusBarStyle('dark');

// Capacitor: en nativo, registra el dispositivo con APNs/FCM y guarda el
// token en sessionStorage para que el frontend pueda sincronizarlo con
// OneSignal o con tu backend cuando el usuario inicie sesión. En web es no-op.
import { initPushNotifications, isNative } from '@/lib/native';
if (isNative()) {
  // Diferimos un tick para no bloquear el primer paint.
  setTimeout(() => {
    initPushNotifications({
      onToken: (token) => {
        try { sessionStorage.setItem('apns_token', token); } catch (_) { /* noop */ }
      },
      onMessage: (notif) => {
        // Toast nativo opcional — por ahora, log y dejar que iOS muestre la notificación.
        console.log('[push] received:', notif?.title, notif?.body);
      },
    });
  }, 800);
}

// ── Dark mode: sync with system preference ──────────────────────────────────
const applyColorScheme = (dark) => {
  document.documentElement.classList.toggle('dark', dark);
};
const mq = window.matchMedia('(prefers-color-scheme: dark)');
applyColorScheme(mq.matches);
mq.addEventListener('change', e => applyColorScheme(e.matches));

// Microsoft Clarity: heatmaps de clic, scrollmaps y session recordings.
// Gratis para siempre, sin coste por tráfico. Necesita VITE_CLARITY_PROJECT_ID
// en Vercel env. Si falta, no se carga (no rompe nada).
// Se carga DIFERIDO tras el primer paint para no penalizar el LCP.
const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;
if (CLARITY_PROJECT_ID && typeof window !== 'undefined') {
  const loadClarity = () => {
    if (window.clarity) return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
  };
  // Tras la primera interacción O 4s tras carga — lo que ocurra primero.
  // Así no entra en el LCP y se asegura registro completo de sesión.
  ['click', 'touchstart', 'scroll', 'keydown'].forEach((e) =>
    window.addEventListener(e, loadClarity, { once: true, passive: true }),
  );
  setTimeout(loadClarity, 4000);
}

// Registrar Service Worker diferido (no bloquea renderizado).
// `updateViaCache: 'none'` evita que el navegador cachee el propio sw.js, así
// el SW nuevo se detecta en cada carga y no quedamos atascados en uno antiguo.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // Forzar comprobación de actualización en cada arranque.
        reg.update().catch(() => {});
      })
      .catch(() => {});
  });
}

const root = document.getElementById('root');
const publicData = getPublicPageData();
const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const hasMatchingSSR = publicData.path === pathname && root.dataset.ssr === 'true';
if (hasMatchingSSR) seedPublicQueries(queryClientInstance, publicData);
const application = <App />;
if (hasMatchingSSR) {
  ReactDOM.hydrateRoot(root, application, {
    onRecoverableError(error) { console.error('[hydration]', error); },
  });
} else {
  ReactDOM.createRoot(root).render(application);
}

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}
