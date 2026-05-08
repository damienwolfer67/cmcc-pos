// checkout.js — saisie du montant reçu via clavier numérique custom + calcul du rendu.
// Le montant est stocké en centimes : taper "1" "2" "3" donne 1,23 €.
(function () {
  'use strict';
  const CMCC = (window.CMCC = window.CMCC || {});

  let _receivedCents = 0;
  const _listeners = new Set();

  function notify() {
    const total = CMCC.cart.totalCents();
    const change = _receivedCents - total;
    for (const fn of _listeners) fn({ totalCents: total, receivedCents: _receivedCents, changeCents: change });
  }

  function onCheckoutChange(fn) { _listeners.add(fn); return () => _listeners.delete(fn); }

  function pressDigit(d) {
    if (_receivedCents >= 100000 * 100) return; // garde-fou
    _receivedCents = _receivedCents * 10 + Number(d);
    notify();
  }
  function pressBack()  { _receivedCents = Math.floor(_receivedCents / 10); notify(); }
  function pressClear() { _receivedCents = 0; notify(); }
  function reset()      { pressClear(); }

  CMCC.checkout = { onCheckoutChange, pressDigit, pressBack, pressClear, reset };
})();
