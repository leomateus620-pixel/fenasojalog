## Diagnóstico (end-to-end)

A tela branca em `fenasojalog.com` no Safari/Chrome mobile não é um erro do Dashboard novo em si — é uma falha clássica de **Service Worker servindo o `index.html` em cache que aponta para chunks JS que não existem mais** após o último deploy.

### Por que acontece agora

1. O deploy recente (Dashboard premium + LoginPage WebP) gerou novos hashes em `assets/*.js`.
2. O `public/sw.js` atual tem dois problemas que combinados produzem tela branca:
   - **Pré-cacheia `/index.html`** no `install` (linha 5 do array `STATIC_ASSETS`).
   - O fallback de navegação cai em `caches.match('/index.html')` — o cache antigo retém um HTML que referencia chunks deletados (`-HASHANTIGO.js`). Em conexões mobile lentas ou intermitentes, basta o `fetch` da navegação demorar/falhar para o SW servir o HTML velho → o `<script type="module">` falha em carregar → `#root` fica vazio → tela branca.
3. Não há mecanismo de auto-recuperação no `main.tsx`: nenhum listener de `controllerchange`, nenhum tratamento de `ChunkLoadError` e nenhum prompt de update.
4. A versão do cache (`CACHE_VERSION = '2'`) não foi incrementada após mudanças significativas, então o SW antigo continua governando a página em usuários que já visitaram o site antes.

A captura de tela do usuário (`#root` vazio, sem spinner, sem login) é exatamente esse padrão: o HTML carrega, mas o bundle JS nunca executa.

### Causas secundárias verificadas e descartadas

- `Dashboard.tsx`, `Metric3DCard`, `MetricCardRotator`, `OperationalDynamicIsland`, `useDashboardMetrics` — todos com guardas adequados; não derrubam o app.
- `LoginPage` usa `position: fixed inset-0` + `min-h-[100dvh]` — comportamento já validado e na memória do projeto.
- Não há erros em runtime/console no momento atual (cache nuked do snapshot).

## Mudanças

### 1. `public/sw.js` — reescrita segura

- Remover `/index.html` e `/` do `STATIC_ASSETS` (não pré-cachear shell volátil).
- Bump `CACHE_VERSION` para `'3'` (força purge do cache antigo no `activate`).
- Navegação: **network-first com timeout de 3s**; só usa cache como fallback se realmente offline (sem cache de HTML em erros 4xx/5xx).
- Hashed assets (`/assets/*-[hash].ext`): cache-first como hoje.
- Adicionar handler de mensagem `SKIP_WAITING` para permitir auto-update.
- Em `fetch` de chunks `.js`/`.css` que retornem 404 (chunk antigo morto), responder com `Response` vazio + status 205 para o cliente disparar reload.

### 2. `src/main.tsx` — registro robusto + auto-recuperação

- Manter o registro do SW, mas:
  - Escutar `registration.onupdatefound` → quando novo SW estiver `installed` e `navigator.serviceWorker.controller` existir, postar `SKIP_WAITING` e recarregar uma única vez.
  - Escutar `navigator.serviceWorker.controller` `controllerchange` → `window.location.reload()` (com guard `sessionStorage` para evitar loop).
- Adicionar global `window.addEventListener('error', ...)` que detecta `ChunkLoadError` / `Failed to fetch dynamically imported module` e faz, no máximo 1x por sessão:
  1. `caches.keys().then(ks => ks.forEach(caches.delete))`,
  2. `registrations.forEach(r => r.unregister())`,
  3. `location.reload()`.
- Fazer o mesmo para `unhandledrejection`.

### 3. `index.html` — robustez de carregamento

- Adicionar `<meta name="theme-color" content="#1a2e1a">` (evita flash branco no Safari iOS — barra de URL combina com o app).
- Adicionar fallback visual mínimo dentro de `#root` (spinner CSS puro) que some quando o React monta. Garante que, se o JS demorar, o usuário vê algo (não tela branca).
- Adicionar `<noscript>` com mensagem amigável.

### 4. Validação

- Após as mudanças, abrir o preview no mobile viewport e verificar:
  - Recarrega normalmente.
  - DevTools mobile → Application → Service Workers mostra `fenasoja-v3` ativo.
  - Limpando manualmente o cache e recarregando, app continua funcional.
- Sem alterações de UI do Dashboard, nem de lógica de negócio.

## Arquivos a editar

- `public/sw.js` (reescrita).
- `src/main.tsx` (registro + auto-recovery).
- `index.html` (theme-color + fallback inline + noscript).

Nenhum outro arquivo é tocado. Nenhuma mudança de schema, de auth, de RLS ou de Dashboard.

## Critérios de sucesso

- Usuários que visitaram o site antes do fix conseguem entrar sem precisar limpar cache manualmente (auto-recovery dispara no máximo 1 reload).
- Próximos deploys não causarão mais tela branca: SW não pré-cacheia HTML, e qualquer `ChunkLoadError` aciona limpeza automática.
- Tempo de carregamento e visual do app permanecem idênticos para o usuário.
