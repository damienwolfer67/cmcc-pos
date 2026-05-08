// admin.js — verrouillage par PIN, édition CRUD des produits, préférences.
(function () {
  'use strict';
  const CMCC = (window.CMCC = window.CMCC || {});

  const PIN_KEY = 'cmcc.pin';
  const HC_KEY  = 'cmcc.highContrast';

  function getPin() {
    return localStorage.getItem(PIN_KEY)
      || (window.CMCC_CONFIG && window.CMCC_CONFIG.DEFAULT_PIN)
      || '0000';
  }

  function setPin(p) {
    if (!/^\d{4}$/.test(p)) throw new Error('PIN invalide');
    localStorage.setItem(PIN_KEY, p);
  }

  function isHighContrast() { return localStorage.getItem(HC_KEY) === '1'; }

  function setHighContrast(on) {
    if (on) {
      localStorage.setItem(HC_KEY, '1');
      document.documentElement.dataset.hc = '1';
    } else {
      localStorage.removeItem(HC_KEY);
      delete document.documentElement.dataset.hc;
    }
  }

  function applyHighContrastFromStorage() {
    if (isHighContrast()) document.documentElement.dataset.hc = '1';
  }

  function saveProduct(p) {
    const newId = p.id || CMCC.catalog.generateId(p.name);
    CMCC.catalog.upsertProduct({
      id: newId,
      name: String(p.name).trim(),
      price: Number(p.price),
      emoji: p.emoji || '🍽️',
      category: p.category,
    });
    return newId;
  }

  function getVersion() {
    const c = CMCC.catalog.getCatalog();
    return (c && c.version) || '—';
  }

  CMCC.admin = {
    getPin, setPin,
    isHighContrast, setHighContrast, applyHighContrastFromStorage,
    saveProduct, getVersion,
    listProducts:    () => CMCC.catalog.getProducts(),
    listCategories:  () => CMCC.catalog.getCategories(),
    removeProduct:   (id) => CMCC.catalog.deleteProduct(id),
    refreshFromRemote: () => CMCC.catalog.refreshFromRemote(),
  };
})();
