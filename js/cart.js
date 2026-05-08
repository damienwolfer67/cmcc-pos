// cart.js — état du panier en centimes entiers (évite les artefacts flottants).
(function () {
  'use strict';
  const CMCC = (window.CMCC = window.CMCC || {});

  const _items = new Map();   // id -> { product, qty }
  const _listeners = new Set();

  function priceCents(p) { return Math.round(Number(p) * 100); }

  function totalCents() {
    let t = 0;
    for (const { product, qty } of _items.values()) t += priceCents(product.price) * qty;
    return t;
  }

  function count() {
    let n = 0;
    for (const { qty } of _items.values()) n += qty;
    return n;
  }

  function snapshot() {
    return {
      lines: [..._items.values()].map(({ product, qty }) => ({
        product, qty,
        lineTotalCents: priceCents(product.price) * qty,
      })),
      totalCents: totalCents(),
      count: count(),
    };
  }

  function notify() { for (const fn of _listeners) fn(snapshot()); }

  function onCartChange(fn) { _listeners.add(fn); return () => _listeners.delete(fn); }

  function quantityOf(id) { return _items.has(id) ? _items.get(id).qty : 0; }

  function add(product, delta) {
    delta = (typeof delta === 'number') ? delta : 1;
    const cur = _items.get(product.id);
    const next = (cur ? cur.qty : 0) + delta;
    if (next <= 0) _items.delete(product.id);
    else _items.set(product.id, { product, qty: next });
    notify();
  }

  function clear() { _items.clear(); notify(); }

  function formatEUR(cents) {
    return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }

  CMCC.cart = {
    onCartChange, snapshot, quantityOf, add, clear,
    totalCents, count, priceCents, formatEUR,
  };
})();
