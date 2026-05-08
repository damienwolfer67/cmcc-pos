// pwa.js — enregistrement du service worker et gestion de l'installation.
// Le SW n'est enregistré qu'en HTTP/HTTPS : ouvert via file:// (double-clic),
// l'app fonctionne pareil mais sans cache hors ligne géré par le SW.
(function () {
  'use strict';
  const CMCC = (window.CMCC = window.CMCC || {});

  let _deferredPrompt = null;
  const _installListeners = new Set();

  function onInstallAvailable(fn) {
    _installListeners.add(fn);
    if (_deferredPrompt) fn(true);
    return () => _installListeners.delete(fn);
  }
  function notify(b) { for (const fn of _installListeners) fn(b); }

  function registerServiceWorker() {
    const proto = location.protocol;
    if (proto !== 'http:' && proto !== 'https:') return;       // file:// → skip
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('Service worker registration failed', err);
      });
    });
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      _deferredPrompt = e;
      notify(true);
    });
    window.addEventListener('appinstalled', () => {
      _deferredPrompt = null;
      notify(false);
    });
  }

  async function promptInstall() {
    if (!_deferredPrompt) return false;
    _deferredPrompt.prompt();
    const choice = await _deferredPrompt.userChoice;
    _deferredPrompt = null;
    notify(false);
    return choice && choice.outcome === 'accepted';
  }

  CMCC.pwa = { registerServiceWorker, onInstallAvailable, promptInstall };
})();
