# Caisse CMCC

Point de vente simple et hors ligne pour l'association **Coup de main, coup de cœur**.

Application PWA (Progressive Web App) conçue pour les événements (buvette, restauration). Fonctionne sur téléphone et tablette, sans connexion internet une fois installée.

## 🚀 Installation

### Sur iPhone / iPad

1. Ouvre Safari et va sur : **https://damienwolfer67.github.io/cmcc-pos/**
2. Tape le bouton **Partager** 📤 (en bas de l'écran)
3. Tape **« Sur l'écran d'accueil »**
4. Tape **« Ajouter »**

L'app apparaît sur ton écran d'accueil comme une application native. Elle fonctionne hors ligne après la première ouverture.

### Sur Android

1. Ouvre Chrome et va sur : **https://damienwolfer67.github.io/cmcc-pos/**
2. Tape le menu ⋮ (en haut à droite)
3. Tape **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**

## 📱 Utilisation

### Encaisser un client

1. Sélectionne les produits en tapant dessus (le badge affiche la quantité)
2. Ajuste avec **−** ou **+** si besoin
3. Tape **« Encaisser »** dans la barre du bas
4. Saisis le montant reçu avec le clavier numérique
5. Le rendu de monnaie s'affiche (vert si ok, rouge s'il manque)
6. Tape **« Valider »** pour finaliser la vente

### Modifier les prix (Admin)

1. Tape sur ⚙️ (en haut à droite)
2. Entre le code PIN : **1005**
3. Tu peux :
   - Ajouter / Modifier / Supprimer des produits
   - Changer le code PIN
   - Activer le mode **haut contraste** (pour malvoyants)
   - **Réinitialiser depuis le serveur** (recharge les prix officiels)

## 🔄 Mises à jour

### Mettre à jour l'application

Si une nouvelle version est disponible :

1. **Ferme complètement l'app** (glisse vers le haut + swipe sur l'icône)
2. **Rouvre l'app** → elle se met à jour automatiquement

Si ça ne marche pas :
1. Supprime l'icône de l'écran d'accueil
2. Réinstalle depuis Safari/Chrome

### Modifier les prix pour tout le monde

1. Modifie le fichier `products.json` avec les nouveaux prix
2. Push sur GitHub
3. Sur chaque caisse : Admin → **« Réinitialiser depuis le serveur »**

## 🛠️ Développement

### Lancer en local

```bash
python3 -m http.server 8000
# Ouvre http://localhost:8000
```

### Structure du projet

```
cmcc-pos/
├── index.html              # Page unique (3 vues : caisse / paiement / admin)
├── config.js               # Configuration (URL distante, PIN, version cache)
├── products.json           # Catalogue des produits (tarifs officiels)
├── manifest.webmanifest    # Métadonnées PWA
├── sw.js                   # Service Worker (cache hors ligne)
├── css/
│   └── styles.css          # Styles avec support haut contraste
├── js/
│   ├── app.js              # Orchestration
│   ├── catalog.js          # Gestion du catalogue
│   ├── cart.js             # Panier
│   ├── checkout.js         # Paiement
│   ├── admin.js            # Administration
│   ├── pwa.js              # Enregistrement Service Worker
│   └── products-data.js    # Catalogue embarqué (fallback)
└── assets/                 # Logos et icônes
```

### Publier une nouvelle version

1. Modifie le code
2. **Bump le numéro de cache** dans `config.js` ET `sw.js` :
   ```js
   CACHE_VERSION: 'cmcc-vX-2026.X'
   ```
3. Commit et push :
   ```bash
   git add .
   git commit -m "Description des changements"
   git push
   ```

GitHub Pages déploie automatiquement.

## 📋 Tarifs

Les tarifs actuels sont définis dans `products.json` (version 2026.1) :

- **Boissons** : Bière/panaché (2,50€), Picon bière (3€), Soft/eau (1,50€), Café/tisane (1€)
- **Alimentation** : Knacks/saucisse/merguez (5€ avec salade pdt, 3€ avec pain), Fromage/salades (5€), Pâtisserie (3€), Gâteau/cake (1€), Bretzel (1€)

## 🎨 Accessibilité

- Grosses cibles tactiles (≥ 64px)
- Contraste élevé (WCAG AAA)
- Mode **haut contraste** activable
- Emojis pour reconnaissance rapide des produits
- Annonces ARIA pour lecteurs d'écran

## 📄 Licence

Application développée pour l'association **Coup de main, coup de cœur**.

---

_Besoin d'aide ? Contacte l'administrateur de l'association._
