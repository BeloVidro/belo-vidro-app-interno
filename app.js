// Registra o service worker para o PWA
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registrado!"))
    .catch(err => console.log("Erro ao registrar Service Worker:", err));
}
