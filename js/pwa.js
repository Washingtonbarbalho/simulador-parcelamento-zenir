// Lógica do PWA (Progressive Web App) - pwa.js
// Registra o Service Worker para habilitar funcionalidades offline.

function getBasePath() {
    const pathSegments = window.location.pathname.split('/');
    if (pathSegments.length >= 2 && window.location.hostname.includes('github.io')) {
        return '/' + pathSegments[1] + '/';
    }
    return '/';
}

window.APP_BASE_PATH = getBasePath();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(window.APP_BASE_PATH + 'service-worker.js', {
            scope: window.APP_BASE_PATH
        })
        .then((registration) => {
            console.log('Service Worker registrado com sucesso:', registration.scope);
        })
        .catch((error) => {
            console.log('Falha ao registrar o Service Worker:', error);
        });
    });
}
