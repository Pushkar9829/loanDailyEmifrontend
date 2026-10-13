// Service-worker registration, update hand-off and the install prompt, exposed as window events
// so React components can subscribe without a global store.
let waiting = null;
let installEvent = null;

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const offer = (w) => {
        waiting = w;
        window.dispatchEvent(new Event('kp:update-ready'));
      };
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
        });
      });
      // Check for a new deploy every 30 minutes while the app is open.
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    } catch {
      /* SW is an enhancement only */
    }
  });
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}

export const hasUpdate = () => !!waiting;
export const applyUpdate = () => waiting?.postMessage('SKIP_WAITING');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  window.dispatchEvent(new Event('kp:installable'));
});
window.addEventListener('appinstalled', () => {
  installEvent = null;
  window.dispatchEvent(new Event('kp:installable'));
});

export const canInstall = () => !!installEvent;
export async function promptInstall() {
  if (!installEvent) return false;
  installEvent.prompt();
  const choice = await installEvent.userChoice.catch(() => null);
  installEvent = null;
  window.dispatchEvent(new Event('kp:installable'));
  return choice?.outcome === 'accepted';
}
