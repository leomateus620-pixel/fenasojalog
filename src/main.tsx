import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const RECOVERY_KEY = 'fenasoja-recovery-attempted';
const RELOAD_KEY = 'fenasoja-sw-reloaded';

async function nukeCachesAndReload() {
  if (sessionStorage.getItem(RECOVERY_KEY)) return;
  sessionStorage.setItem(RECOVERY_KEY, '1');
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {}
  window.location.reload();
}

function isChunkError(msg?: string) {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return (
    m.includes('chunkloaderror') ||
    m.includes('failed to fetch dynamically imported module') ||
    m.includes('importing a module script failed') ||
    m.includes("loading chunk") ||
    m.includes("loading css chunk")
  );
}

window.addEventListener('error', (e) => {
  if (isChunkError(e?.message) || isChunkError(String((e as any)?.error))) {
    nukeCachesAndReload();
  }
});
window.addEventListener('unhandledrejection', (e) => {
  const reason: any = e?.reason;
  const msg = typeof reason === 'string' ? reason : reason?.message;
  if (isChunkError(msg)) nukeCachesAndReload();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // When a new SW is found, ask it to take over immediately
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            sw.postMessage('SKIP_WAITING');
          }
        });
      });
    }).catch(() => {});

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
