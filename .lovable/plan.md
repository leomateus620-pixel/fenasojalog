

## Plano: Reformulação do Módulo Transportes — Liquid Glass + Google Maps

---

### Auditoria do Estado Atual

| Componente | Estado | Observação |
|---|---|---|
| Tabela `transports` | Funcional | Campos completos, sem necessidade de novas colunas (já tem `inicio_em`, `fim_em`, `status`, `km_retirada`, `km_devolucao`) |
| Tabela `transport_locations` | Funcional | Rastreamento em tempo real já persiste no banco |
| Hook `useTransports` | Correto | CRUD real com audit log |
| Hook `useLocationTracking` | Correto | Geolocalização real + realtime via Supabase |
| Edge function `estimate-return` | Funcional | Google Routes API v2 com TRAFFIC_AWARE |
| `DriverLocationMap` (Leaflet) | Funcional | Exibe posição do motorista em tempo real |
| Fluxo de status | Funcional | pendente → em_andamento → concluído (com finalização via modal) |
| Finalização | Funcional | Salva KM, cria vehicle_usage, atualiza odômetro |

**Não há dados mockados no fluxo principal.** Há um mapa hardcoded `estimatedDurationMin` usado como fallback para retorno estimado — será substituído por `fim_em` real ou chamada à API.

**O que falta:**
1. Visual Liquid Glass (cards usam estilo básico)
2. Mini mapa estático da rota em cada card (não existe)
3. Distância/ETA real exibida no card (parcialmente — só no live tracking)
4. Colunas para persistir distância estimada e duração no transporte

---

### Plano de Implementação

#### 1. Migração de Banco

Adicionar colunas à tabela `transports` para persistir dados de rota:
- `distancia_estimada_km` (numeric, nullable) — distância da rota via Google Maps
- `duracao_estimada_min` (integer, nullable) — tempo estimado em minutos
- `inicio_real_em` (timestamptz, nullable) — quando o motorista realmente iniciou
- `fim_real_em` (timestamptz, nullable) — quando realmente finalizou

Isso permite histórico auditável de previsão vs execução.

#### 2. Atualizar Edge Function `estimate-return`

Expandir para aceitar coordenadas de origem/destino arbitrárias (não só destinos fixos). Adicionar retorno de polyline codificado para renderização de rota no mapa. Adicionar um novo modo `ROUTE_PREVIEW` que aceita nomes de cidades/locais e retorna rota + polyline + distância + duração.

#### 3. Reestilização Liquid Glass (`src/pages/TransportsPage.tsx`)

Reescrever a página completa com:
- Header premium com título, contadores de status (em_andamento / pendentes) e botão "Novo" translúcido
- Cards com estilo `liquid-glass-card`: `bg-white/10 backdrop-blur-xl border-white/15`
- Badges de status com cores translúcidas refinadas
- Tipografia otimizada para mobile: horários em `font-mono`, títulos em `font-semibold`
- Melhor hierarquia visual: status → horário → rota → info → ações
- Cards de ação com `active:scale-[0.97]` para feedback tátil
- Filtros com visual glass
- Loading skeletons premium
- Empty states elegantes

#### 4. Mini Mapa na Card

Para cada transporte, renderizar um mini mapa estático usando Google Maps Static API:
- Mostra marcadores de origem e destino
- Para transportes `em_andamento` com localização ativa: mapa interativo Leaflet (já existe) com posição real
- Para transportes `pendente/concluido`: imagem estática com markers
- A imagem é gerada via URL do Static Maps API (não requer JS pesado)
- Lazy loading: só carrega quando visível (IntersectionObserver)

#### 5. ETA e Distância no Card

Ao criar/editar um transporte, chamar a edge function para obter distância e duração estimadas, e persistir na tabela. Exibir no card:
- `📏 45 km • ⏱ 38 min` abaixo da rota
- Para transportes em andamento com localização: ETA dinâmico (já funciona)

#### 6. Fluxo Aprimorado de Início/Finalização

**Iniciar viagem:**
- Salvar `inicio_real_em = now()` no banco
- Mudar status para `em_andamento`
- Ativar rastreamento de localização
- Toast com confirmação

**Finalizar viagem:**
- Abrir modal de conclusão (já existe)
- Salvar `fim_real_em = now()`
- Calcular duração real = `fim_real_em - inicio_real_em`
- Salvar KM, criar vehicle_usage (já funciona)
- Parar rastreamento (já funciona)

#### 7. Histórico Visual

Na modal de detalhes, adicionar seção "Histórico da Viagem" mostrando:
- Previsão vs Execução (distância estimada vs KM rodados, duração estimada vs real)
- Timeline visual: criado → iniciado → concluído com timestamps

#### 8. `DriverLocationMap` Aprimorado

Adicionar ao mapa Leaflet (para transports em_andamento):
- Linha de rota planejada (polyline decodificado da edge function)
- Marcador de destino além do marcador de posição atual
- Visual glass no container do mapa

---

### Arquivos a Modificar

1. **Migração SQL** — Adicionar 4 colunas à tabela `transports`
2. **`supabase/functions/estimate-return/index.ts`** — Expandir para aceitar rotas arbitrárias e retornar polyline
3. **`src/pages/TransportsPage.tsx`** — Reescrita completa: Liquid Glass, mini mapa, ETA/distância, fluxo aprimorado
4. **`src/components/DriverLocationMap.tsx`** — Adicionar polyline de rota e marcador de destino

### Sem alterações em:
- Hooks (useTransports, useLocationTracking — já funcionais)
- Outras tabelas
- Outras páginas

