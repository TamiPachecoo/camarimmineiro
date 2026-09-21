// ============================================================
// SERVICE WORKER — Camarim Mineiro
// Cache básico do "shell" do app para permitir instalação
// (Add to Home Screen). Dados do Supabase NÃO são armazenados
// aqui — o app sempre busca dados atualizados online.
// ============================================================

const CACHE_NOME = 'camarim-mineiro-v2';
const ARQUIVOS_SHELL = [
  'index.html',
  'clientes.html',
  'agenda.html',
  'financeiro.html',
  'integracoes.html',
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

// ============================================================
// NOTIFICAÇÕES PUSH
// Recebe pushes enviados pela Edge Function `send-notification`
// (novo agendamento / mudança de status) ou `reminder-cron`
// (lembrete de compromisso). O payload é sempre JSON:
// { titulo, corpo, url }
// ============================================================
self.addEventListener('push', (evento) => {
  let dados = { titulo: 'Camarim Mineiro', corpo: 'Você tem uma notificação nova.', url: 'index.html' };
  if (evento.data) {
    try { dados = { ...dados, ...evento.data.json() }; } catch (e) { dados.corpo = evento.data.text(); }
  }
  evento.waitUntil(
    self.registration.showNotification(dados.titulo, {
      body: dados.corpo,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      data: { url: dados.url || 'index.html' },
    })
  );
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const url = evento.notification.data && evento.notification.data.url ? evento.notification.data.url : 'index.html';
  evento.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((listaClientes) => {
      for (const cliente of listaClientes) {
        if (cliente.url.includes(url) && 'focus' in cliente) return cliente.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
