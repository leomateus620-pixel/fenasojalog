

## Plano: Dynamic Island nos Cards de Transporte

### Conceito
Criar um componente `TransportDynamicIsland` que substitui a barra de rota estática (Row 2, linhas 996-1010) e o `TransportLocationCard` (linhas 1060-1072) por uma cápsula interativa animada com dois estados.

### Estrutura do componente

**Estado reduzido** — Cápsula escura (`bg-foreground/90 backdrop-blur-xl`) com border-radius pill, contendo:
- Rota resumida: `Santa Rosa → Santo Ângelo`
- Status + ETA curto: `Em trânsito • 18 min` ou `Pendente • 08:30`
- Ícone de navegação animado (pulse quando `em_andamento`)
- Altura: ~44px

**Estado expandido** — Mesma cápsula expande com `transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]` para revelar:
- Mapa Leaflet (reutiliza `DriverLocationMap`) com altura 160px
- Linha de rota origem → destino com dots
- ETA, distância, horário previsto de chegada
- Nome do motorista e passageiro
- Botão "Finalizar" (se `em_andamento`)
- Botão "Ver detalhes"
- Altura: ~380px

### Animação
- CSS `transition-all` com cubic-bezier iOS-style no height, border-radius, padding e opacity
- Conteúdo expandido entra com `opacity 0→1` com delay de 150ms (aparece após a expansão iniciar)
- Mapa carrega lazy dentro do expanded state via `Suspense`

### Dados reais consumidos
- `t.origem`, `t.destino`, `t.status` — rota e status
- `t.duracao_estimada_min`, `t.distancia_estimada_km` — métricas planejadas
- `useTransportLocation(t.id)` — posição GPS em tempo real (já implementado)
- `fetchRoutePreview` / `estimate-return` edge function — ETA real via Google Maps
- `t.rota_polyline` — polyline decodificada para o mapa
- `getDestCoords(t)` — coordenadas do destino
- Ação "Finalizar" chama `onCycleStatus` existente

### Adaptação por status
- **Pendente**: mostra rota + horário previsto, sem mapa no expanded (ou mapa estático com rota planejada)
- **Em andamento**: mostra ETA live, mapa com posição real, botão finalizar
- **Concluído**: mostra resumo final, sem mapa
- **Cancelado**: visual discreto, sem expansão

### Integração no TransportCard
- Substituir linhas 996-1010 (route bar) + linhas 1059-1072 (TransportLocationCard) por `<TransportDynamicIsland>`
- O componente recebe todas as props necessárias do card pai
- Manter `TransportLocationCard` como fallback interno do island para quando está expandido

### Arquivo
- **Criar** `src/components/TransportDynamicIsland.tsx`
- **Editar** `src/pages/TransportsPage.tsx` — substituir route bar + location card pelo novo componente

### Visual Liquid Glass
- Cápsula: `bg-foreground/90 text-background` (dark pill) com `backdrop-blur-xl`
- Borda: `border border-white/10`
- Expanded: `bg-foreground/95` com sombra `shadow-2xl`
- Chips internos: `bg-white/10 text-white/80`
- Botões: `bg-white/15 hover:bg-white/25`

