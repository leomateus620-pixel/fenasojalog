

## Plano: Reformulação Visual da Agenda — Liquid Glass Premium

---

### Auditoria

| Componente | Estado |
|---|---|
| Tabela `events` | Completa (titulo, descricao, inicio_em, fim_em, local, tipo_tag, responsavel_user_id) |
| Hook `useEvents` | Funcional (CRUD + audit log + isLoading) |
| `useOrgMembers` / `useCommissions` | Funcionais |
| Utils (rawTime, todaySP, rawDay, rawWeekday, rawMonthShort) | Disponíveis |

A página atual usa `Tabs` genérico para navegação por dias, cards básicos com `bg-card`, e não utiliza `isLoading` (sem skeleton). Toda a lógica de dados já funciona — este é um redesign puramente visual/UX.

### Sem alterações no banco
Tabela `events` já tem todos os campos necessários.

---

### Implementação: Reescrita de `src/pages/AgendaPage.tsx`

**1. Header premium**
- Título "Programação da Feira" com subtítulo translúcido
- Botão "Novo Evento" com visual glass (`bg-white/12 backdrop-blur-xl`)

**2. Seletor de dias horizontal**
- Substituir `Tabs/TabsList` por chips horizontais com scroll (`overflow-x-auto snap-x`)
- Cada chip mostra: dia da semana abreviado + dia numérico + mês
- Chip ativo com `bg-primary text-white`, inativos com `bg-white/10 backdrop-blur`
- "Hoje" destacado com dot indicator
- Estado controlado via `useState` em vez de `Tabs`

**3. Agrupamento por turno**
- Eventos do dia divididos em 3 seções: Manhã (antes 12h), Tarde (12h-18h), Noite (após 18h)
- Label discreto para cada seção (só aparece se tiver eventos)

**4. Cards de evento Liquid Glass**
- `bg-white/10 backdrop-blur-xl border border-white/15`
- Layout: horário à esquerda (font-mono bold) | separador | conteúdo à direita
- Título em `font-semibold`, descrição em `text-muted-foreground`
- Badges de categoria com vidro translúcido
- Ícones discretos para local, responsável, comissão
- Hover: `hover:bg-white/15 hover:shadow-lg`
- Touch: `active:scale-[0.98]`
- Animação de entrada suave

**5. Empty state premium**
- Ícone CalendarDays translúcido + mensagem elegante
- Botão para criar evento

**6. Loading state**
- Skeleton com estilo glass (3 blocos animados)

**7. Modal de criação/edição**
- Visual glass no `DialogContent` (`bg-white/10 backdrop-blur-2xl`)
- Inputs com estilo translúcido
- Melhor espaçamento e hierarquia

**8. Indicador de evento atual**
- Se o horário atual está entre `inicio_em` e `fim_em`, o card recebe borda verde pulsante (`ring-2 ring-primary/50 animate-pulse`)

**9. Responsividade**
- Mobile: chips de dia em scroll horizontal, cards full-width, touch-friendly
- Desktop: chips em linha, cards com mais respiro, layout mais amplo

### Arquivo modificado
- `src/pages/AgendaPage.tsx` — Reescrita completa

