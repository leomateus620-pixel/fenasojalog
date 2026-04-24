

## Agenda v2 — Cores refinadas, 3D mais marcante e horários idênticos a Transportes

### Diagnóstico

**1. Bug de horários (crítico)**
Hoje, ao montar os cards da Agenda em `AgendaPage.tsx` (linhas 154-173), o sistema usa apenas:
- `inicio_em: t.inicio_em`
- `fim_em: t.fim_em || t.inicio_em`

Já o `TransportCard` da página `/transportes` exibe:
- **Saída** = `t.horario_saida || rawTime(t.inicio_em)`
- **Retorno** = `t.fim_em` ou estimado por `inicio_em + (duracao_estimada_min || preset por título)` via `formatReturnTime()`
- Para Aeroporto: também mostra **Horário Voo** (`voo_checkin`) / **Desembarque** (`voo_chegada`)

Resultado: um transporte com `horario_saida = "08:30"` mas `inicio_em = 07:30` aparece **07:30** na Agenda e **08:30** em Transportes. E quando `fim_em` é `null`, a Agenda mostra o mesmo horário de início no campo de fim, enquanto Transportes mostra um retorno calculado. **Inconsistência total.**

**2. Cores e 3D (cosméticos)**
- Os gradientes atuais (`from-primary/15 via-card/65 to-gold/10`) ficam apagados sobre o fundo do app — falta saturação institucional
- A barra lateral por turno usa as mesmas tonalidades verde/dourado nos 3 turnos — não diferencia visualmente manhã/tarde/noite com força
- O tilt 3D máximo (±6°) é discreto demais para "causar boa impressão"
- Não há sombra projetada no chão (drop shadow) que reforce o efeito de levitação
- Os chips de dia (header) ainda usam o glass básico genérico, sem casar com o resto

### O que vai ser entregue

#### 1. Corrigir horários do merge (crítico — `src/pages/AgendaPage.tsx`)
Substituir o bloco de transformação de transportes pela mesma lógica usada em `TransportCard`:

```ts
// helper inline reutilizando a regra do TransportCard
const ESTIMATED_DUR: Record<string, number> = {
  Aeroporto: 120, Hotel: 45, Parque: 30, Centro: 40, 'Escolta Policial': 90, Outros: 60,
};

const computeAgendaTimes = (t) => {
  // Saída exibida = horario_saida (texto HH:MM) sobreposto a inicio_em (data),
  // mantendo a data de inicio_em mas usando o horário declarado quando existir.
  const saidaIso = t.horario_saida
    ? mergeDateAndTimeSP(t.inicio_em, t.horario_saida)
    : t.inicio_em;

  const fimIso = t.fim_em
    ? t.fim_em
    : new Date(new Date(saidaIso).getTime() +
        ((t.duracao_estimada_min || ESTIMATED_DUR[t.titulo] || 60) * 60000)
      ).toISOString();

  return { saidaIso, fimIso };
};
```

- `mergeDateAndTimeSP(iso, "HH:MM")` é uma função utilitária pequena que pega o **dia** de `inicio_em` em SP e injeta o horário do campo `horario_saida`, preservando offset `-03:00` (segue padrão `padrao-fuso-horario-sp`)
- O objeto enriquecido também passa a carregar `_voo: { checkin, chegada, cidade, numero }` e `_horarioSaidaText: t.horario_saida` para o detail dialog usar
- Critério verificável: abrir `/agenda` e `/transportes` lado a lado → cada transporte mostra **exatamente** os mesmos horários de Saída e Retorno

#### 2. Detail dialog mostra os mesmos horários ricos (`AgendaItemDetailDialog.tsx`)
- Bloco "Início → Fim" agora exibe os horários corrigidos
- Para transportes do tipo **Aeroporto**, adicionar uma faixa extra acima do bloco de horário com:
  - **Horário do Voo** (badge dourado destacado) quando `_voo.checkin` existir
  - **Desembarque** (badge azul) quando `_voo.chegada` existir
  - Cidade + número do voo como sublinha
- Mantém duração calculada com base nos horários efetivos

#### 3. Refinar cores e 3D nos cards (`AgendaItemCard3D.tsx`)
Sem alterar `index.css` — usa apenas tokens do projeto (`--primary`, `--gold`, `--card`, `--success`, `--info`):

- **Base mais saturada**: trocar `from-primary/15 via-card/65 to-gold/10` por gradiente em camada dupla:
  - Camada 1: `bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.28),transparent_55%)]`
  - Camada 2: `bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--gold)/0.22),transparent_60%)]`
  - Sobre uma base sólida `bg-card/55` com `backdrop-blur-2xl`
- **Diferenciação real por turno** na barra lateral e na cor do glow:
  - Manhã: dourado quente `from-gold via-gold/80 to-[hsl(40_95%_60%)]` (toque de âmbar)
  - Tarde: laranja-verde `from-[hsl(28_90%_55%)] via-gold/70 to-primary/70`
  - Noite: verde profundo + violeta `from-primary via-primary/80 to-[hsl(220_55%_45%)]`
- **Tilt mais expressivo**: máx ±10° (em vez de ±6°), com `transition-transform duration-200 ease-out`
- **Drop shadow projetado** que segue o tilt: `filter: drop-shadow(0 12px 18px hsl(var(--primary)/0.35))` no hover
- **Bloco de hora flutuante** sobe para `translateZ(28px)` no hover (mais "saltado")
- **Borda viva** com `inset 0 0 0 1px hsl(var(--gold)/0.18)` permanente + anel pulsante extra quando `isCurrent`
- **Reflexo superior** mais visível — gradiente `via-gold/55` em vez de `via-gold/40`
- Continua respeitando `prefers-reduced-motion` (sem tilt, sem shimmer, sem drop-shadow animado)

#### 4. Chips de dias coerentes com o novo card
- Trocar `bg-white/10 backdrop-blur-lg` (genérico) por chips com mesma assinatura visual:
  - Inativo: `bg-card/50 border-white/10` + reflexo dourado superior
  - Ativo: gradiente `from-primary via-primary/90 to-primary/80` + glow `shadow-[0_0_20px_hsl(var(--primary)/0.4)]`
  - Hoje (não-ativo): ponto dourado pulsante em vez do ponto opaco atual
- Sutil scale-in escalonado na primeira renderização

#### 5. Cabeçalhos de turno (`ShiftSectionHeader`)
- Ícone do turno ganha fundo gradiente que combina com a barra lateral do card daquele turno (consistência visual por turno)
- Linha divisória usa o mesmo gradiente

### Arquivos

| Arquivo | Mudança |
|---|---|
| `src/pages/AgendaPage.tsx` | Adicionar `computeAgendaTimes()` + helper `mergeDateAndTimeSP()`, reescrever o `.map()` de transportes para enviar horários corretos e meta de voo. Atualizar visual dos chips de data. |
| `src/components/agenda/AgendaItemCard3D.tsx` | Refinar gradientes, intensificar tilt (±10°), adicionar drop-shadow no hover, diferenciar turnos por cor real, alinhar `ShiftSectionHeader` ao novo esquema. |
| `src/components/agenda/AgendaItemDetailDialog.tsx` | Mostrar horários corrigidos; adicionar bloco "Horário do Voo / Desembarque" para transportes Aeroporto. |
| `src/lib/utils.ts` | (Pequeno) Exportar `mergeDateAndTimeSP(iso, hhmm)` reutilizável — segue padrão `padrao-fuso-horario-sp`. |

### Critério de aceite

1. Comparando `/agenda` ↔ `/transportes` para o mesmo transporte: **horários idênticos** de Saída e Retorno (incluindo casos com `horario_saida` declarado e casos sem `fim_em`)
2. Transportes Aeroporto exibem "Horário do Voo" no detail dialog quando `voo_checkin` existir
3. Cards visivelmente mais "premium": cores mais ricas, 3D perceptível, turnos diferenciados (manhã quente, tarde híbrida, noite profunda)
4. Chips de dia consistentes com o novo card
5. Zero alteração em banco, RLS, hooks ou outros módulos
6. `prefers-reduced-motion` continua respeitado

