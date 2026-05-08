// catalog.js — chargement et persistance du catalogue de produits.
//
// Ordre de résolution au démarrage :
//   1. localStorage 'cmcc.catalog' (édité par l'admin)
//   2. fetch local ./products.json (servi par le SW en cache-first si HTTP)
//   3. données embarquées dans products-data.js (toujours dispo, marche en file://)
(function () {
  'use strict';
  const CMCC = (window.CMCC = window.CMCC || {});

  const LS_KEY = 'cmcc.catalog';
  let _catalog = null;
  const _listeners = new Set();

  function notify() { for (const fn of _listeners) fn(_catalog); }
  function onCatalogChange(fn) { _listeners.add(fn); return () => _listeners.delete(fn); }

  function getCatalog()   { return _catalog; }
  function getProducts()  { return _catalog ? _catalog.products   : []; }
  function getCategories(){ return _catalog ? _catalog.categories : []; }

  async function loadCatalog() {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      try { _catalog = JSON.parse(stored); notify(); return _catalog; }
      catch (_) { localStorage.removeItem(LS_KEY); }
    }
    // Tente le fichier local. fetch est bloqué en file:// → on attrape l'erreur.
    try {
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        const res = await fetch('./products.json', { cache: 'default' });
        if (res.ok) {
          _catalog = await res.json();
          saveCatalog();
          notify();
          return _catalog;
        }
      }
    } catch (_) { /* fallback */ }
    // Fallback embarqué.
    _catalog = JSON.parse(JSON.stringify(window.CMCC_DEFAULT_CATALOG));
    saveCatalog();
    notify();
    return _catalog;
  }

  async function refreshFromRemote() {
    const url = (window.CMCC_CONFIG && window.CMCC_CONFIG.REMOTE_URL) || './products.json';
    const sep = url.includes('?') ? '&' : '?';
    const fullUrl = url + sep + 'refresh=' + Date.now();
    const res = await fetch(fullUrl, { cache: 'reload', mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    _catalog = data;
    saveCatalog();
    notify();
    return _catalog;
  }

  function saveCatalog() {
    if (_catalog) localStorage.setItem(LS_KEY, JSON.stringify(_catalog));
  }

  function upsertProduct(product) {
    if (!_catalog) return;
    const i = _catalog.products.findIndex(p => p.id === product.id);
    if (i >= 0) _catalog.products[i] = Object.assign({}, _catalog.products[i], product);
    else _catalog.products.push(product);
    saveCatalog();
    notify();
  }

  function deleteProduct(id) {
    if (!_catalog) return;
    _catalog.products = _catalog.products.filter(p => p.id !== id);
    saveCatalog();
    notify();
  }

  function generateId(name) {
    const base = String(name).normalize('NFD').replace(/\p{M}/gu, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'produit';
    let id = base, n = 1;
    while (_catalog.products.some(p => p.id === id)) { id = base + '-' + (++n); }
    return id;
  }

  CMCC.catalog = {
    onCatalogChange, getCatalog, getProducts, getCategories,
    loadCatalog, refreshFromRemote, upsertProduct, deleteProduct, generateId,
  };
})();
