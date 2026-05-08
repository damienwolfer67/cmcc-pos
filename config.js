// Configuration de la caisse CMCC.
//
// REMOTE_URL : URL absolue du products.json centralisé sur GitHub Pages.
//   - Utilisée UNIQUEMENT par le bouton "Réinitialiser depuis le serveur" (admin).
//   - Le démarrage utilise toujours le fichier local ./products.json (servi
//     par le service worker, donc disponible hors ligne).
//   - GitHub Pages sert tout en HTTPS et autorise CORS par défaut sur les
//     fichiers statiques : aucun setup à faire côté serveur.
window.CMCC_CONFIG = {
  REMOTE_URL: 'https://damienwolfer67.github.io/cmcc-pos/products.json',
  CACHE_VERSION: 'cmcc-v2-2026.1',
  DEFAULT_PIN: '1005',
};
