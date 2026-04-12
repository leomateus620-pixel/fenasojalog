

# Melhoria Estrutural e Visual — 5 Áreas

## Auditoria — Causas Raiz

1. **Buscar Destino mobile**: O `PlacesSearchDialog` usa `Drawer` com `max-h-[85dvh]` mas o conteúdo interno tem `max-h-[50vh]` fixo nos resultados — com teclado virtual aberto, o espaço é insuficiente. Falta `AbortController` para cancelar requests anteriores.

2. **Sem "Iniciar Transporte"**: O botão único "Agendar Transporte" (linha 814-816 de TransportsPage) sempre cria com status `pendente`. Para iniciar, o usuário precisa criar e depois clicar "Iniciar" no card — dois passos desnecessários.

3. **Delay do Dynamic Island**: Ao criar transporte, `handleAdd` chama `fetchRoutePreview` de forma bloqueante ANTES do `create.mutateAsync` (linhas 411-419). Isso bloqueia todo o submit enquanto espera a Google Routes API. Após salvar, `invalidateAll` invalida 7 queries simultâneas, causando re-render pesado.

4. **Dashboard sem criação**: Não existe nenhum ponto de entrada para criar transporte no Dashboard. O card "Próximos Transportes" só lista e redireciona.

5. **Mapa 2D/Split**: O `FullscreenMapDialog` não permite alternar entre modos — sempre mostra split 50/50 quando `isLive`. Sem controle do usuário para ver apenas um mapa.

---

## Plano de Implementação

### 1. Corrigir PlacesSearchDialog mobile

**Arquivo**: `src/components/transport/PlacesSearchDialog.tsx`

- Trocar `max-h-[50vh]` dos resultados por `flex-1 overflow-y-auto` (adaptar ao espaço real disponível)
- Adicionar `pb-safe` / `pb-8` no Drawer para safe area do mobile
- Adicionar `AbortController` — cancelar request anterior ao digitar
- Aumentar área de toque dos resultados: `min-h-[48px]` + `py-3.5`
- Input com `autoComplete="off"` e `autoCorrect="off"` para evitar autocorrect do teclado
- `DrawerContent` com `className="max-h-[90dvh] flex flex-col"` para melhor uso do espaço
- Container de resultados com `overscroll-contain` para evitar scroll do body

### 2. Botão "Iniciar Transporte"

**Arquivos**: `src/pages/TransportsPage.tsx`, `src/components/transport/TransportForm.tsx`

- Adicionar segundo botão abaixo de "Agendar Transporte": "🚀 Iniciar Transporte"
- Extrair lógica de `handleAdd` para função reutilizável `handleCreate(mode: 'schedule' | 'start_now')`
- Quando `mode = 'start_now'`:
  - Criar transporte normalmente via `create.mutateAsync`
  - Imediatamente chamar `start.mutateAsync({ id: result.id })` para iniciar
  - Ativar tracking: `setTrackingTransportId(result.id)`
  - Fechar dialog e mostrar toast "Viagem iniciada"
- Validar campos obrigatórios (origem, destino, data) antes de ambos
- Desabilitar ambos os botões durante submit (usar `isSubmittingRef`)

### 3. Reduzir delay do Dynamic Island

**Arquivo**: `src/pages/TransportsPage.tsx`

- **Desbloqueio do submit**: Mover `fetchRoutePreview` para DEPOIS do `create.mutateAsync` — criar transporte primeiro, enriquecer depois
- Criar transporte com dados mínimos (sem `distancia_estimada_km`, `duracao_estimada_min`, `rota_polyline`)
- Após criar, fechar dialog IMEDIATAMENTE e disparar enriquecimento em background:
  ```
  create → fechar dialog → toast → background: fetchRoutePreview → update com dados da rota
  ```
- Usar `Promise.allSettled` para route preview + return trip em paralelo
- Invalidação cirúrgica: só invalidar `['transports']` no create, não as 7 queries

**Arquivo**: `src/components/TransportDynamicIsland.tsx`

- Reduzir o throttle de 120s para 30s na primeira chamada (depois volta a 120s)
- Mostrar skeleton/loading state para ETA/distância enquanto calcula

### 4. Dashboard — Criar Transporte

**Arquivo**: `src/pages/Dashboard.tsx`

- Adicionar card "Criar Transporte" na seção de acessos rápidos (ao lado da Rede Hoteleira)
- Ao clicar: `navigate('/transports?action=create')`
- **Arquivo**: `src/pages/TransportsPage.tsx` — ler `searchParams.get('action')` e abrir dialog automaticamente se `action=create`

### 5. Reformulação do FullscreenMapDialog

**Arquivo**: `src/components/transport/FullscreenMapDialog.tsx`

- Adicionar estado `viewMode: 'split' | 'nav' | 'aerial'` (default: `'split'`)
- Controle de toggle no topo: 3 botões pill com ícones (Navegação | Aéreo | Dividido)
- Persistir preferência em `sessionStorage`
- Modo `nav`: NavigationMap3D em tela cheia
- Modo `aerial`: DriverLocationMap em tela cheia
- Modo `split`: layout atual 50/50
- Não destruir/recriar mapas ao trocar — usar `hidden` ou `display:none` para preservar instâncias
- Melhorar visual: gradiente sutil no fundo dos overlays, badges maiores, melhor contraste
- Adicionar label do motorista no overlay quando em modo tela cheia única

---

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `src/components/transport/PlacesSearchDialog.tsx` | Fix mobile, AbortController, UX |
| `src/pages/TransportsPage.tsx` | "Iniciar Transporte", desbloqueio submit, `?action=create` |
| `src/pages/Dashboard.tsx` | Card "Criar Transporte" |
| `src/components/transport/FullscreenMapDialog.tsx` | Toggle 3 modos, visual premium |
| `src/components/TransportDynamicIsland.tsx` | Throttle reduzido, loading states |

