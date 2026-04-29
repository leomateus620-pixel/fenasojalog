Diagnóstico confirmado

Do I know what the issue is? Sim.

O transporte iniciado agora está em `em_andamento`, tem coordenadas de origem/destino, mas:

1. Não existe linha de localização ao vivo para ele em `transport_locations`.
2. A rota salva (`rota_polyline`) está vazia para esse e outros transportes ativos/pendentes.
3. O início da viagem foi feito por um usuário diferente do motorista designado. O código atual tenta ativar o GPS no navegador de quem clicou em “Iniciar”, mas o hook de segurança bloqueia a publicação porque esse usuário não é o motorista do transporte. Resultado: o card fica em “Obtendo localização...” e nenhuma posição real chega ao mapa.
4. Quando ainda não há GPS ao vivo, o mapa usa o destino como ponto inicial e destino ao mesmo tempo. Por isso a rota visual não aparece corretamente; ele centraliza no aeroporto/cidade de destino em vez de desenhar Santa Rosa → Destino.
5. A função de início tenta buscar a rota por backend, mas a chamada interna à função de rotas usa credencial de serviço em um endpoint que valida usuário autenticado. Isso falha silenciosamente e deixa `rota_polyline` nulo.

Plano de correção

1. Corrigir a ativação do GPS no frontend
   - Em `TransportsPage.tsx`, só ligar o rastreamento local se o usuário logado for exatamente o motorista designado do transporte.
   - Se um operador/admin iniciar a viagem de outro motorista, mostrar feedback correto: viagem iniciada, aguardando o motorista abrir o app.
   - Manter o auto-resume: quando o motorista designado abrir/recarregar o app e tiver transporte ativo, o GPS inicia automaticamente.

2. Tornar a gravação da localização robusta e atômica
   - Criar uma função segura no banco para publicar localização (`publish_transport_location`), validando no servidor:
     - usuário autenticado;
     - usuário é o motorista designado do transporte;
     - transporte está em fase ativa (`em_andamento`, `em_retorno` ou `chegou_destino`);
     - usuário pertence à organização do transporte.
   - Essa função fará `insert ... on conflict (transport_id) do update`, eliminando conflito de “linha fantasma” e evitando o fluxo frágil atual de update/delete/insert no cliente.
   - Ajustar `useLocationTracking.ts` para chamar essa função em vez de escrever diretamente em `transport_locations`.
   - Reforçar as políticas da tabela para impedir que qualquer membro da organização publique localização em transporte que não é dele.

3. Corrigir a visualização da rota quando ainda não há GPS ao vivo
   - Em `TransportDynamicIsland.tsx`, criar `originCoords` usando `origem_lat/origem_lng` com fallback Santa Rosa.
   - Enquanto não existe localização ao vivo, renderizar a rota de `originCoords` até `destCoords`, não destino → destino.
   - Assim, mesmo antes do motorista abrir o app, o card mostra Santa Rosa → Santo Ângelo/Chapecó/etc. corretamente.
   - Depois que o GPS chegar, o mapa muda para motorista atual → destino em tempo real.

4. Corrigir a geração de rota no backend para próximos inícios
   - Em `transport-lifecycle`, ajustar o backfill de rota para chamar a função de rotas com o token do usuário autenticado que iniciou a ação, não com credencial de serviço.
   - Adicionar logs controlados para quando a rota não puder ser gerada, evitando falhas silenciosas.
   - Garantir que novos transportes iniciados recebam, no mínimo, coordenadas válidas; e, quando a API de mapas responder, `rota_polyline`, distância e duração.

5. Reparar dados atuais para todos os transportes
   - Limpar localizações antigas de transportes concluídos/cancelados/pendentes, mantendo apenas linhas de viagens realmente ativas.
   - Backfill de coordenadas faltantes para ativos e pendentes com destinos conhecidos:
     - Santa Rosa como origem padrão;
     - Aeroporto de Santo Ângelo;
     - Aeroporto de Chapecó;
     - Aeroporto de Passo Fundo;
     - Aeroporto de Porto Alegre.
   - Para rotas faltantes, preencher polylines reais quando possível usando a função de rotas; se a API não retornar rota, deixar o frontend com fallback visual Santa Rosa → Destino para não quebrar a navegação.

6. Validação end-to-end
   - Conferir no banco se os transportes ativos/pendentes não estão mais com coordenadas críticas vazias.
   - Conferir se não restam linhas fantasmas em `transport_locations` para viagens inativas.
   - Testar o fluxo esperado:

```text
Operador inicia viagem de outro motorista
  -> status vira Em trânsito
  -> mapa mostra rota Santa Rosa -> Destino
  -> mensagem: aguardando motorista abrir o app

Motorista designado abre o app
  -> rastreamento inicia automaticamente
  -> localização é publicada no backend
  -> operador vê marcador Ao vivo
  -> rota passa a ser Motorista atual -> Destino
```

Arquivos/áreas que serão alterados

- `src/hooks/useLocationTracking.ts`
- `src/pages/TransportsPage.tsx`
- `src/components/TransportDynamicIsland.tsx`
- `supabase/functions/transport-lifecycle/index.ts`
- Nova migration para função segura de localização, limpeza de fantasmas e backfill de dados atuais

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>