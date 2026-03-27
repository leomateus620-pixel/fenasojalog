

# Exibir Rota Completa: Partida → Destino → Retorno

## O que muda

Atualmente a rota é exibida como `Origem → Destino` (ex: "Santa Rosa → Prefeito Mantei"). O usuário quer o formato completo `Partida → Destino → Retorno` (ex: "Santa Rosa → Prefeito Mantei → Santa Rosa"), mostrando que o motorista volta à origem.

## Implementação

### 1. `src/components/TransportDynamicIsland.tsx`

Atualizar 3 locais onde a rota é exibida:

- **Linha 162** (cancelado): `{t.origem} → {t.destino}` → `{t.origem} → {t.destino} → {t.origem}`
- **Linhas 207-211** (expandido): Adicionar terceiro span com `→ {t.origem}` após destino
- **Linha 436** (mapa fullscreen): sem mudança (já usa labels separados)

### 2. `src/components/transport/TransportCard.tsx`

- **Linha 68**: `${t.origem} → ${t.destino}` → `${t.origem} → ${t.destino} → ${t.origem}`

### 3. `src/components/transport/TransportDetailView.tsx`

Verificar e atualizar qualquer exibição de rota no mesmo padrão.

## Arquivos alterados
1. `src/components/TransportDynamicIsland.tsx` — rota completa com retorno
2. `src/components/transport/TransportCard.tsx` — fallback de título com retorno
3. `src/components/transport/TransportDetailView.tsx` — se houver exibição de rota

