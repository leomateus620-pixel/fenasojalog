# Melhorar visibilidade dos cards — Carrinhos Elétricos

A imagem enviada mostra o card "RESERVADO PRESIDENCIA - G05" praticamente vazio: o título aparece, mas o **nome do retirador, comissão, horários de retirada/devolução e duração** estão muito apagados (cinza claro sobre vidro translúcido) ou nem aparecem em destaque. O objetivo é tornar essas informações cadastradas claramente legíveis sem perder a identidade Liquid Glass.

## O que vai mudar

### 1. Card de carrinho **em uso** (`ElectricCartCard.tsx`)
- **Nome do retirador / parceiro / convidado**: aumentar para `text-base font-bold text-foreground` (hoje `text-sm font-semibold`) e remover o `truncate` agressivo (passar a `break-words` em 2 linhas).
- **Bloco do responsável**: trocar `bg-muted/40` (muito apagado) por `bg-background/70 border-border` com `shadow-inner` mais marcado, garantindo contraste sólido sobre o vidro.
- **Comissão**: badge atual é `text-[10px]` em `secondary` — passar para badge sólido `bg-primary/15 text-primary border-primary/30 text-[11px] font-bold uppercase`.
- **Horário de retirada**: hoje é `text-xs muted` + `text-sm bold`. Ampliar para rótulo `text-[11px] font-semibold uppercase text-muted-foreground` e valor `text-base font-bold text-foreground`. O "há Xmin" passa para badge âmbar discreto ao lado.
- Adicionar (quando existir) **linha extra de telefone** do convidado externo, igual ao ReservationCard.

### 2. Card de **reserva** (`ReservationCard.tsx`) — o do print
- **Nome do responsável**: `text-base font-bold` (hoje `text-sm font-semibold`) e bloco com `bg-background/70` para sair do "fantasma".
- **Comissão / "Convidado / Externo" / "Empresa parceira"**: badges com cor sólida (primary/accent) em vez de `variant="secondary"` translúcido.
- **Período (Retirada / Devolução)**:
  - Rótulos "RETIRADA" / "DEVOLUÇÃO" em `text-[11px] font-bold uppercase text-foreground/80` (hoje `muted-foreground` quase invisível).
  - Data + hora separadas em duas linhas: data em `text-xs text-muted-foreground` e hora em `text-lg font-bold text-foreground` (destaque principal).
  - Backgrounds dos blocos passam de `bg-primary/10` para `bg-primary/15 border-primary/30` com `shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]`.
- **Duração**: chip dedicado `bg-muted/60 border-border px-2 py-1 rounded-md` em vez de texto solto cinza.
- **Observações**: remover `italic` + `muted-foreground` apagado; usar `text-sm text-foreground/80` dentro de um bloco `bg-muted/40 rounded-lg p-2`.

### 3. Ajustes globais de contraste
- Reduzir o `opacity-80` aplicado a reservas concluídas/canceladas para `opacity-90` (ainda diferencia, mas mantém leitura).
- Garantir que nenhum texto principal use `text-muted-foreground` — apenas rótulos auxiliares.

## Arquivos afetados
- `src/components/electric-carts/ElectricCartCard.tsx`
- `src/components/electric-carts/ReservationCard.tsx`

Sem mudanças de dados, schema ou lógica — apenas tipografia, cores e hierarquia visual para destacar o que já está cadastrado.
