// app.js — bootstrap, navigation entre vues, branchement DOM <-> stores.
(function () {
  'use strict';
  const CMCC = (window.CMCC = window.CMCC || {});
  const { catalog, cart, checkout, admin, pwa } = CMCC;

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ---------- Démarrage ----------
  admin.applyHighContrastFromStorage();
  pwa.registerServiceWorker();

  (async function bootstrap() {
    try { await catalog.loadCatalog(); }
    catch (err) {
      console.error('Catalogue introuvable', err);
      announce('Impossible de charger les produits.');
    }
    renderCategories();
    renderProducts();
    renderCart();
    renderCartBar();
    bindUI();
    bindProductsContainer();
    catalog.onCatalogChange(() => { renderCategories(); renderProducts(); renderCart(); renderCartBar(); });
    cart.onCartChange(() => { renderCart(); renderCartBar(); refreshProductBadges(); });
    checkout.onCheckoutChange(renderCheckout);
    pwa.onInstallAvailable((available) => {
      const btn = $('#btn-install');
      if (btn) btn.hidden = !available;
    });
  })();

  // ---------- Vues ----------
  let _currentCategory = null;

  function showView(name) {
    ['view-pos', 'view-checkout', 'view-admin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = (id !== 'view-' + name);
    });
    const bar = $('#cartbar');
    bar.hidden = (name !== 'pos');
    if (name !== 'pos') closeCartDrawer();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ---------- Catégories ----------
  function renderCategories() {
    const root = $('#cats');
    const cats = catalog.getCategories();
    if (!cats.length) { root.innerHTML = ''; return; }
    if (!_currentCategory || (_currentCategory !== 'all' && !cats.find(c => c.id === _currentCategory))) {
      _currentCategory = 'all';
    }
    const items = [{ id: 'all', label: 'Tout' }].concat(cats);
    root.innerHTML = items.map(c =>
      '<button type="button" class="cat" data-cat="' + c.id + '" aria-pressed="' + (c.id === _currentCategory) + '">' +
      escapeHtml(c.label) + '</button>'
    ).join('');
    $$('.cat', root).forEach(b => b.addEventListener('click', () => {
      _currentCategory = b.dataset.cat;
      renderCategories();
      renderProducts();
    }));
  }

  // ---------- Produits ----------
  // La grille est reconstruite seulement quand la catégorie ou le catalogue
  // change. Les variations de quantité du panier sont reflétées en place
  // via refreshProductBadges() — sans toucher aux écouteurs d'événements,
  // qui sont posés une seule fois sur le conteneur (délégation).
  function renderProducts() {
    const root = $('#products');
    let products = catalog.getProducts();
    if (_currentCategory && _currentCategory !== 'all') {
      products = products.filter(p => p.category === _currentCategory);
    }
    if (!products.length) {
      root.innerHTML = '<p class="muted" style="padding:20px;">Aucun produit dans cette catégorie.</p>';
      return;
    }
    root.innerHTML = products.map(productCard).join('');
  }

  function productCard(p) {
    const qty = cart.quantityOf(p.id);
    const priceTxt = cart.formatEUR(Math.round(p.price * 100));
    return (
      '<div class="product' + (qty > 0 ? ' product--active' : '') + '" role="button" tabindex="0"' +
      ' data-id="' + p.id + '"' +
      ' aria-label="' + escapeHtml(ariaLabelFor(p, qty, priceTxt)) + '">' +
        (qty > 0 ? stepperHTML(p, qty) : '') +
        '<span class="product__emoji" aria-hidden="true">' + (p.emoji || '🍽️') + '</span>' +
        '<span class="product__name">' + escapeHtml(p.name) + '</span>' +
        '<span class="product__price">' + priceTxt + '</span>' +
      '</div>'
    );
  }

  function stepperHTML(p, qty) {
    return (
      '<span class="product__stepper" role="group" aria-label="Quantité de ' + escapeHtml(p.name) + '">' +
        '<button type="button" data-act="dec" aria-label="Retirer un ' + escapeHtml(p.name) + '">−</button>' +
        '<span class="product__stepper-qty" aria-hidden="true">' + qty + '</span>' +
        '<button type="button" data-act="inc" aria-label="Ajouter un ' + escapeHtml(p.name) + '">+</button>' +
      '</span>'
    );
  }

  function ariaLabelFor(p, qty, priceTxt) {
    return p.name + ', ' + priceTxt + (qty ? ', ' + qty + ' dans le panier' : '');
  }

  // Mise à jour en place : ne reconstruit pas la grille, ne touche pas
  // aux nœuds que l'utilisateur est en train de cliquer.
  function refreshProductBadges() {
    const root = $('#products');
    $$('.product', root).forEach(card => {
      const p = catalog.getProducts().find(x => x.id === card.dataset.id);
      if (!p) return;
      const qty = cart.quantityOf(p.id);
      card.classList.toggle('product--active', qty > 0);
      const priceTxt = cart.formatEUR(Math.round(p.price * 100));
      card.setAttribute('aria-label', ariaLabelFor(p, qty, priceTxt));

      const existing = card.querySelector('.product__stepper');
      if (qty > 0) {
        if (existing) {
          existing.querySelector('.product__stepper-qty').textContent = qty;
        } else {
          card.insertAdjacentHTML('afterbegin', stepperHTML(p, qty));
        }
      } else if (existing) {
        existing.remove();
      }
    });
  }

  // Une seule liaison déléguée sur #products, posée à l'init et conservée
  // pour toute la durée de l'app. Survit aux re-rendus de la grille.
  function bindProductsContainer() {
    const root = $('#products');

    root.addEventListener('click', (e) => {
      const card = e.target.closest('.product'); if (!card) return;
      const p = catalog.getProducts().find(x => x.id === card.dataset.id);
      if (!p) return;
      if (e.target.closest('[data-act="dec"]')) { cart.add(p, -1); return; }
      if (e.target.closest('[data-act="inc"]')) { cart.add(p, +1); return; }
      if (e.target.closest('.product__stepper')) return;
      cart.add(p, 1);
      announce(p.name + ' ajouté. Panier : ' + cart.formatEUR(cart.totalCents()) + '.');
    });

    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.product'); if (!card) return;
      // On ignore Enter/Space ciblé sur les boutons stepper (ils sont natifs).
      if (e.target !== card) return;
      e.preventDefault();
      const p = catalog.getProducts().find(x => x.id === card.dataset.id);
      if (p) { cart.add(p, 1); announce(p.name + ' ajouté.'); }
    });
  }

  // ---------- Cart bar ----------
  function renderCartBar() {
    const snap = cart.snapshot();
    $('#cart-count').textContent = snap.count;
    $('#cart-total').textContent = cart.formatEUR(snap.totalCents);
    $('#btn-pay').disabled = snap.count === 0;
    $('#btn-cart-clear').disabled = snap.count === 0;
  }

  function clearCartConfirm() {
    if (cart.snapshot().count === 0) return;
    if (!confirm('Vider le panier ?')) return;
    cart.clear();
    closeCartDrawer();
    announce('Panier vidé.');
  }

  // ---------- Cart drawer ----------
  function renderCart() {
    const root = $('#cartlines');
    const snap = cart.snapshot();
    if (!snap.lines.length) {
      root.innerHTML = '<li class="muted" style="padding:14px 4px;">Le panier est vide.</li>';
      return;
    }
    root.innerHTML = snap.lines.map(({ product, qty, lineTotalCents }) => (
      '<li class="cartline" data-id="' + product.id + '">' +
        '<span class="cartline__emoji" aria-hidden="true">' + (product.emoji || '🍽️') + '</span>' +
        '<span class="cartline__name">' +
          escapeHtml(product.name) +
          '<small>' + cart.formatEUR(Math.round(product.price * 100)) + ' × ' + qty + '</small>' +
        '</span>' +
        '<span class="cartline__qty">' +
          '<button type="button" data-act="dec" aria-label="Retirer un ' + escapeHtml(product.name) + '">−</button>' +
          '<span aria-hidden="true">' + qty + '</span>' +
          '<button type="button" data-act="inc" aria-label="Ajouter un ' + escapeHtml(product.name) + '">+</button>' +
        '</span>' +
        '<span class="cartline__total">' + cart.formatEUR(lineTotalCents) + '</span>' +
      '</li>'
    )).join('');
    $$('.cartline', root).forEach(li => {
      li.querySelector('[data-act="inc"]').addEventListener('click', () => {
        const p = catalog.getProducts().find(x => x.id === li.dataset.id);
        if (p) cart.add(p, +1);
      });
      li.querySelector('[data-act="dec"]').addEventListener('click', () => {
        const p = catalog.getProducts().find(x => x.id === li.dataset.id);
        if (p) cart.add(p, -1);
      });
    });
  }

  function openCartDrawer() {
    $('#cartdrawer').hidden = false;
    $('#btn-cart-toggle').setAttribute('aria-expanded', 'true');
  }
  function closeCartDrawer() {
    $('#cartdrawer').hidden = true;
    $('#btn-cart-toggle').setAttribute('aria-expanded', 'false');
  }
  function toggleCartDrawer() {
    if ($('#cartdrawer').hidden) openCartDrawer(); else closeCartDrawer();
  }

  // ---------- Checkout ----------
  function renderCheckout({ totalCents, receivedCents, changeCents }) {
    $('#checkout-total').textContent    = cart.formatEUR(totalCents);
    $('#checkout-received').textContent = cart.formatEUR(receivedCents);

    const changeEl = $('#checkout-change');
    const wrap     = $('#checkout-change-wrap');
    if (changeCents >= 0) {
      changeEl.textContent = cart.formatEUR(changeCents);
      changeEl.classList.add('checkout__amount--ok');
      changeEl.classList.remove('checkout__amount--warn');
      wrap.classList.add('checkout__change--ok');
      wrap.classList.remove('checkout__change--warn');
      wrap.querySelector('.checkout__label').textContent = 'À rendre';
    } else {
      changeEl.textContent = cart.formatEUR(Math.abs(changeCents));
      changeEl.classList.add('checkout__amount--warn');
      changeEl.classList.remove('checkout__amount--ok');
      wrap.classList.add('checkout__change--warn');
      wrap.classList.remove('checkout__change--ok');
      wrap.querySelector('.checkout__label').textContent = 'Manque';
    }

    const disabled = (totalCents === 0) || (changeCents < 0);
    $('#btn-validate-checkout').disabled = disabled;
    $('#btn-validate-checkout-desktop').disabled = disabled;
  }

  // ---------- Admin ----------
  let _pinBuffer = '';

  function renderPinDots() {
    $$('.pindot').forEach((d, i) => d.dataset.on = i < _pinBuffer.length ? '1' : '');
  }

  function tryPin(d) {
    if (d === 'clear') { _pinBuffer = ''; renderPinDots(); $('#pinerror').textContent = ''; return; }
    if (d === 'back')  { _pinBuffer = _pinBuffer.slice(0, -1); renderPinDots(); return; }
    if (_pinBuffer.length >= 4) return;
    _pinBuffer += d;
    renderPinDots();
    if (_pinBuffer.length === 4) {
      if (_pinBuffer === admin.getPin()) {
        _pinBuffer = '';
        renderPinDots();
        $('#pinerror').textContent = '';
        unlockAdmin();
      } else {
        $('#pinerror').textContent = 'Code incorrect';
        _pinBuffer = '';
        setTimeout(renderPinDots, 250);
      }
    }
  }

  function unlockAdmin() {
    $('#admin-locked').hidden = true;
    $('#admin-unlocked').hidden = false;
    renderAdminList();
    $('#toggle-hc').checked = admin.isHighContrast();
    $('#version-info').textContent = 'Catalogue version : ' + admin.getVersion();
  }

  function lockAdmin() {
    $('#admin-locked').hidden = false;
    $('#admin-unlocked').hidden = true;
    _pinBuffer = '';
    renderPinDots();
  }

  function renderAdminList() {
    const root = $('#adminlist');
    const items = admin.listProducts();
    if (!items.length) { root.innerHTML = '<p class="muted">Aucun produit. Ajoute-en avec le bouton ci-dessous.</p>'; return; }
    root.innerHTML = items.map(p => (
      '<button type="button" class="adminitem" data-id="' + p.id + '">' +
        '<span class="adminitem__emoji" aria-hidden="true">' + (p.emoji || '🍽️') + '</span>' +
        '<span class="adminitem__name">' +
          escapeHtml(p.name) +
          '<small>' + escapeHtml(categoryLabel(p.category)) + '</small>' +
        '</span>' +
        '<span class="adminitem__price">' + cart.formatEUR(Math.round(p.price * 100)) + '</span>' +
      '</button>'
    )).join('');
    $$('.adminitem', root).forEach(b => b.addEventListener('click', () => openProductDialog(b.dataset.id)));
  }

  function categoryLabel(id) {
    const c = catalog.getCategories().find(c => c.id === id);
    return c ? c.label : id;
  }

  function openProductDialog(id) {
    const dlg = $('#product-dialog');
    const form = $('#product-form');
    const p = id ? admin.listProducts().find(x => x.id === id) : null;
    $('#product-dialog-title').textContent = p ? 'Modifier le produit' : 'Nouveau produit';
    form.elements.id.value    = (p && p.id) || '';
    form.elements.name.value  = (p && p.name) || '';
    form.elements.price.value = p ? p.price : '';
    form.elements.emoji.value = (p && p.emoji) || '🍽️';

    const cats = catalog.getCategories();
    $('#product-category').innerHTML = cats.map(c =>
      '<option value="' + c.id + '"' + (c.id === ((p && p.category) || (cats[0] && cats[0].id)) ? ' selected' : '') + '>' +
      escapeHtml(c.label) + '</option>'
    ).join('');

    $('#btn-delete-product').hidden = !p;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }

  // ---------- Bindings ----------
  function bindUI() {
    $('#btn-admin').addEventListener('click', () => { showView('admin'); lockAdmin(); });
    $('#btn-back-admin').addEventListener('click', () => showView('pos'));
    $('#btn-back-pos').addEventListener('click', () => showView('pos'));

    $('#btn-cart-toggle').addEventListener('click', toggleCartDrawer);
    $('#btn-cart-clear').addEventListener('click', clearCartConfirm);
    $('#btn-clear-cart').addEventListener('click', clearCartConfirm);
    $('#btn-pay').addEventListener('click', () => {
      if (cart.snapshot().count === 0) return;
      checkout.reset();
      showView('checkout');
      const total = cart.totalCents();
      renderCheckout({ totalCents: total, receivedCents: 0, changeCents: -total });
    });

    $('#numpad').addEventListener('click', e => {
      const k = e.target.closest('.numkey'); if (!k) return;
      const key = k.dataset.key;
      if (key === 'clear') checkout.pressClear();
      else if (key === 'back') checkout.pressBack();
      else checkout.pressDigit(key);
    });
    $('#btn-cancel-checkout').addEventListener('click', () => showView('pos'));
    $('#btn-validate-checkout').addEventListener('click', () => {
      cart.clear();
      checkout.reset();
      showView('pos');
      announce('Vente validée. Panier vidé.');
    });
    // Boutons desktop (doublons pour layout tablette/desktop)
    $('#btn-cancel-checkout-desktop').addEventListener('click', () => showView('pos'));
    $('#btn-validate-checkout-desktop').addEventListener('click', () => {
      cart.clear();
      checkout.reset();
      showView('pos');
      announce('Vente validée. Panier vidé.');
    });

    $('#numpad-admin').addEventListener('click', e => {
      const k = e.target.closest('.numkey'); if (!k) return;
      tryPin(k.dataset.pin);
    });

    $('#toggle-hc').addEventListener('change', e => admin.setHighContrast(e.target.checked));
    $('#btn-add-product').addEventListener('click', () => openProductDialog(null));
    $('#btn-save-pin').addEventListener('click', () => {
      const v = $('#new-pin').value;
      if (!/^\d{4}$/.test(v)) { alert('Le PIN doit contenir 4 chiffres.'); return; }
      admin.setPin(v);
      $('#new-pin').value = '';
      alert('Code PIN mis à jour.');
    });
    $('#btn-refresh').addEventListener('click', async () => {
      if (!confirm('Re-télécharger la liste officielle et écraser les modifications locales ?')) return;
      try {
        await admin.refreshFromRemote();
        renderAdminList();
        $('#version-info').textContent = 'Catalogue version : ' + admin.getVersion();
        alert('Catalogue rechargé.');
      } catch (err) {
        alert('Erreur : ' + err.message + '\n\nVérifie que l\'URL distante est correcte et accessible (CORS).');
      }
    });
    $('#btn-install').addEventListener('click', () => pwa.promptInstall());

    const dlg = $('#product-dialog');
    $('#product-form').addEventListener('submit', e => {
      e.preventDefault();
      const form = e.currentTarget;
      admin.saveProduct({
        id:       form.elements.id.value || null,
        name:     form.elements.name.value,
        price:    form.elements.price.value,
        emoji:    form.elements.emoji.value,
        category: form.elements.category.value,
      });
      dlg.close && dlg.close('save');
      dlg.removeAttribute('open');
      renderAdminList();
    });
    $('#btn-cancel-product').addEventListener('click', () => {
      dlg.close && dlg.close('cancel');
      dlg.removeAttribute('open');
    });
    $('#btn-delete-product').addEventListener('click', () => {
      const id = $('#product-form').elements.id.value;
      if (!id) return;
      if (!confirm('Supprimer ce produit ?')) return;
      admin.removeProduct(id);
      dlg.close && dlg.close('delete');
      dlg.removeAttribute('open');
      renderAdminList();
    });
  }

  // ---------- Utils ----------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
    ));
  }

  function announce(msg) {
    const el = $('#aria-status');
    if (!el) return;
    el.textContent = '';
    setTimeout(() => { el.textContent = msg; }, 30);
  }
})();
