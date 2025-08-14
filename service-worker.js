const CACHE_NAME = "belo-vidro-cache-v2";
const FILES_TO_CACHE = [
    "/belo-vidro-app-interno/index.html",
    "/belo-vidro-app-interno/style.css",
    "/belo-vidro-app-interno/app.js",
    "/belo-vidro-app-interno/manifest.json",
    "/belo-vidro-app-interno/logo.png",
    "/belo-vidro-app-interno/horarios.html"
];

// Instala e salva os arquivos no cache
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Arquivos adicionados ao cache");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// Ativa e remove caches antigos
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log("Removendo cache antigo:", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// Intercepta requisições e evita 404
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) return response;
            return fetch(event.request).catch(() => caches.match("/belo-vidro-app-interno/index.html"));
        })
    );
});
