

Vou inspecionar os arquivos restantes para entender a estrutura antes de planejar.
<lov-tool-use id="toolu_vrtx_01HnGEu5Ezyz8MdV9MBmMUXa" name="code--view" integration-id="code" data="{\"file_path\": \"supabase/functions/weather-service/index.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_0196qhcEJ8U39CdvUQhVfRra" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/transport/TransportForm.tsx\", \"lines\": \"1-80\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01VfFSGvHHkn5rXbcM5xtCpv" name="code--search_files" integration-id="code" data="{\"query\": \"destino|origem|latitude|longitude\", \"include_patterns\": \"src/components/transport/TransportForm.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01B2ufwg26qvhrkwKDmuzGRW" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/AgendaPage.tsx\", \"lines\": \"1-50\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01AFBPDMkWML9bWsCmcwaEdN" name="code--search_files" integration-id="code" data="{\"query\": \"transport|Transport\", \"include_patterns\": \"src/pages/AgendaPage.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01N5nYJRp2NHUQcobHpGrxp8" name="code--view" integration-id="code" data="{\"file_path\": \"supabase/functions/weather-service/index.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_013B3KyTggLqmHzaWMx1Kh3A" name="code--search_files" integration-id="code" data="{\"query\": \"destino|latitude|longitude|place_id\", \"include_patterns\": \"src/components/transport/TransportForm.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01AxZoCMEXQMYjUtqCxZf67c" name="code--search_files" integration-id="code" data="{\"query\": \"transport|TransportCard|origem|destino\", \"include_patterns\": \"src/pages/AgendaPage.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01BsS57K7E7Ya51PZfoej2Bp" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"src/pages/AgendaPage.tsx\", \"query\": \"_source.*transport|isTransport|event-card|map\\\\(\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01WVZsdMvsXVSyQyLJAvgBP8" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/transport/TransportForm.tsx\", \"lines\": \"1-50, 280-340\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01NmKDdZgGZWzs5oA4mgrUwZ" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/transport/TransportDetailView.tsx\", \"lines\": \"1-30\"}">
</lov-tool-use>
I have enough context. The runtime error is about `_raw` column in `weather_city_cache` — the cache table apparently doesn't have a `_raw` field embedded; the issue is `payload_jsonb: { ...normalized, _raw: { cur, fc } }` is fine for JSONB, BUT then we read `cached.payload_jsonb` and pass it to `persistSnapshot` as `normalized`, which spreads `_raw` into the snapshot insert — that's the bug.

<lov-plan>

## Diagnóstico do erro atual
`Could not find the '_raw' column of 'transport_weather_snapshots'` — quando o cache de cidade é encontrado, retornamos `cached.payload_jsonb` como `normalized`. Esse objeto contém `_raw: { cur, fc }` (que foi salvo lá para dedup), e ao fazer `...normalizedClean` no `persistSnapshot`, o campo `_raw` vai junto e quebra o insert.

## Plano de finalização

### 1. Fix do edge function (`weather-service/index.ts`)
- Em `getOrFetchCityWeather`, ao retornar do cache, separar `_raw` do payload normalizado:
  ```ts
  const { _raw, ...norm } = cached.payload_jsonb;
  return { normalized: norm, raw: _raw ?? null, ... };
  ```
- Garantir também que o destructuring em `persistSnapshot` remova qualquer chave com prefixo `_`.

### 2. Integrar `WeatherPreviewInTransportForm` no `TransportForm.tsx`
- Importar e renderizar logo após o card de KM estimado (linha ~302), passando `address={data.destino || data.voo_cidade}`, `lat={data.destino_lat}`, `lng={data.destino_lng}`.
- Aparece somente quando há destino válido, com debounce já implementado no hook.

### 3. Integrar `TransportWeatherCard` (expanded) no `TransportDetailView.tsx`
- Importar e adicionar uma seção dedicada antes do botão "Gerar PDF" com `<TransportWeatherCard transportId={t.id} expanded />`.

### 4. Integrar `WeatherMiniSummary` na `AgendaPage.tsx`
- Dentro do `items.map` (linha ~371), no card de cada item, quando `e._source === 'transport'`, renderizar `<WeatherMiniSummary transportId={e.id} />` na linha de metadados (próximo ao Badge "Transporte").

### 5. Disparar `sync_transport` ao criar transporte
- No `useTransports` (mutation `create`), após sucesso, chamar `supabase.functions.invoke('weather-service', { body: { action: 'sync_transport', transport_id: novoId } })` em background (fire-and-forget) — assim o card já nasce com clima.

### 6. Agendar `pg_cron` 06h e 18h SP (= 09:00 e 21:00 UTC)
SQL via insert tool (não migration) — habilitar `pg_cron`/`pg_net` se necessário, e:
```sql
select cron.schedule('weather-sync-morning-sp', '0 9 * * *', $$
  select net.http_post(
    url:='https://fidagsspejekripwkczr.supabase.co/functions/v1/weather-service',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY>"}'::jsonb,
    body:='{"action":"sync_batch","scope":"all_active"}'::jsonb
  );
$$);
select cron.schedule('weather-sync-evening-sp', '0 21 * * *', $$ ... $$);
```

### 7. Teste unitário de `weatherRiskScoring`
- Criar `src/test/weatherRiskScoring.test.ts` validando os 4 níveis (favorável, atenção, alerta, crítico) e cada regra (precip, vento, visibilidade, alertas, trovoada, temperatura).

### 8. Teste end-to-end manual
- Verificar formulário (preview ao escolher destino), card de transporte (clima visível), detalhes (seção expandida), agenda (mini summary), e disparar sync_batch manualmente para validar cron.

## Arquivos
| Arquivo | Mudança |
|---|---|
| `supabase/functions/weather-service/index.ts` | Fix `_raw` no cache hit |
| `src/components/transport/TransportForm.tsx` | + `<WeatherPreviewInTransportForm />` |
| `src/components/transport/TransportDetailView.tsx` | + `<TransportWeatherCard expanded />` |
| `src/pages/AgendaPage.tsx` | + `<WeatherMiniSummary />` por transporte |
| `src/hooks/useTransports.ts` | Dispara `sync_transport` após create |
| `src/test/weatherRiskScoring.test.ts` | Cobertura completa do scoring |
| SQL via insert tool | 2 jobs `pg_cron` (09h e 21h UTC) |

## Resultado
Feature 100% concluída: preview no form, clima nos cards, mini-summary na agenda, sync automático manhã/noite + on-create, e cobertura de testes do scoring. Erro `_raw` corrigido.

