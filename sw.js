// ============================================================
// SERVICE WORKER — Camarim Mineiro
// Cache básico do "shell" do app para permitir instalação
// (Add to Home Screen). Dados do Supabase NÃO são armazenados
// aqui — o app sempre busca dados atualizados online.
// ============================================================

const CACHE_NOME = 'camarim-mineiro-v1';
const ARQUIVOS_SHELL = [
  'index.html',
  'clientes.html',
  'agenda.html',
  'financeiro.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE_NOME).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

// Estratégia: network-first para HTML (sempre tenta buscar a versão mais
// nova primeiro), cache-first para o resto. Isso evita mostrar uma versão
// desatualizada do app depois de atualizações.
self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);
  if (url.origin !== location.origin) return; // não interceptar chamadas ao Supabase

  if (evento.request.mode === 'navigate' || evento.request.destination === 'document') {
    evento.respondWith(
      fetch(evento.request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE_NOME).then((cache) => cache.put(evento.request, copia));
          return resposta;
        })
        .catch(() => caches.match(evento.request))
    );
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then((cacheado) => cacheado || fetch(evento.request))
  );
});
