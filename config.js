// Configuration de la caisse CMCC.
//
// REMOTE_URL : URL HTTP(S) absolue du products.json centralisé.
//   - Utilisée UNIQUEMENT par le bouton "Réinitialiser depuis le serveur" (admin).
//   - Le démarrage utilise toujours le fichier local ./products.json (servi
//     par le service worker, donc disponible hors ligne).
//   - Le serveur qui héberge ce JSON doit autoriser CORS si l'URL est sur un
//     domaine différent de l'app (header `Access-Control-Allow-Origin: *`).
//
// Exemple :
//   REMOTE_URL: 'http://exemple.fr/cmcc/products.json'
window.CMCC_CONFIG = {
  REMOTE_URL: 'http://exemple.fr/cmcc/products.json',
  CACHE_VERSION: 'cmcc-v1-2026.1',
  DEFAULT_PIN: '0000',
};
