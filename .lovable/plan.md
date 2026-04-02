
## Diagnóstico confirmado

Verifiquei o fluxo e o banco para o caso citado:

- O transporte `Aeroporto Santa Rosa → Passo Fundo` está salvo corretamente no banco em `2026-04-29 04:45:00+00`, que corresponde a `29/04 01:45` no horário de Brasília.
- O retorno também existe no banco em `2026-05-01 05:35:00+00`, que corresponde a `01/05 02:35` no horário de Brasília.
- No dia `01/05`, existem mesmo **4 transportes** cadastrados no banco.

Então o problema atual não é o dado salvo, e sim a forma como ele é interpretado e exibido entre os menus.

## Causa raiz encontrada

1. **A Agenda usa chaves de data no formato `YYYY-MM-DD`, mas renderiza essas datas com helpers que fazem `new Date('YYYY-MM-DD')`.**  
   Em JavaScript isso vira meia-noite UTC, e no fuso de Brasília a data pode aparecer como **dia anterior**.  
   Resultado: o item pode estar agrupado em `29/04`, mas o chip/label da Agenda mostra `28/04`.

2. **O menu Transportes ainda filtra por data usando `t.inicio_em.startsWith(filterData)`**, ou seja, compara com a data UTC bruta.  
   Isso mantém uma regra diferente da Agenda e pode gerar divergência entre telas.

3. **A montagem dos itens da Agenda está espalhada entre páginas diferentes**, então cada menu acaba aplicando regras próprias de data, status e descrição.

4. **A Agenda ainda exclui parte dos transportes pelo status** (`concluido` e `cancelado`), o que pode esconder ida, busca ou retorno em alguns cenários.  
   Como você quer que **todos os transportes** apareçam corretamente, essa regra precisa ser revista.

## Plano de correção

### 1. Corrigir a base de datas para “date keys” sem deslocamento
Criar helpers dedicados para:
- converter timestamp para chave São Paulo (`YYYY-MM-DD`)
- formatar chave de data para chip/label sem usar `new Date('YYYY-MM-DD')`
- comparar datas entre Agenda e Transportes com a mesma regra

Isso elimina o erro visual de um transporte de `29/04` aparecer como `28/04`.

### 2. Refatorar a Agenda para usar somente a nova normalização
Na `AgendaPage`:
- manter o agrupamento por data/hora em São Paulo
- trocar os labels dos chips para a nova formatação segura
- garantir que o item do exemplo fique em `29/04`
- garantir que os 4 transportes de `01/05` entrem no mesmo dia correto

### 3. Incluir corretamente todos os transportes relevantes na Agenda
Ajustar a composição da Agenda para incluir corretamente:
- ida / busca do convidado
- retorno
- transportes com hóspedes vinculados
- aeroportos e demais tipos

Também revisar a regra de exclusão por status para que a Agenda não esconda transportes válidos do fluxo logístico.

### 4. Centralizar a infraestrutura compartilhada entre menus
Extrair a lógica de montagem dos itens de agenda para um utilitário/hook compartilhado, usado por:
- `AgendaPage`
- `Dashboard`
- filtros/data do `TransportsPage` quando aplicável

Assim os menus passam a consumir a **mesma fonte derivada**, evitando novas divergências.

### 5. Corrigir o filtro de data do menu Transportes
Substituir a comparação UTC por comparação com a mesma chave São Paulo usada na Agenda.  
Isso garante consistência real entre:
- lista de transportes
- agenda
- dashboard

### 6. Melhorar a descrição dos itens de transporte na Agenda
Padronizar o enriquecimento do item com:
- nomes dos hóspedes vinculados
- rota origem/destino
- distinção mais clara entre ida/busca e retorno

Isso ajuda a conferir visualmente se o transporte do convidado e o retorno estão ambos presentes.

## Arquivos previstos

- `src/lib/utils.ts` ou novo utilitário compartilhado de datas/agenda
- `src/pages/AgendaPage.tsx`
- `src/pages/TransportsPage.tsx`
- `src/pages/Dashboard.tsx`
- opcionalmente um novo hook/utilitário compartilhado, como `src/hooks/useAgendaItems.ts` ou `src/lib/agendaItems.ts`

## Resultado esperado

Após essa correção:

- o transporte de `29/04` deixará de aparecer como `28/04` na Agenda
- os **4 transportes de 01/05** passarão a aparecer corretamente na Agenda
- ida/busca e retorno do convidado serão incluídos corretamente
- Agenda, Transportes e Dashboard passarão a usar a mesma regra de data e a mesma infraestrutura de composição
