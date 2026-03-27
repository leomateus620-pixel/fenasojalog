

# Corrigir Cálculo de KM por Rotas Reais (Google Routes API)

## Diagnóstico

O sistema já possui a edge function `estimate-return` que chama a Google Routes API para calcular distâncias por rota. Porém, dois problemas impedem o funcionamento:

1. **A Routes API está desabilitada no Google Cloud** — os logs mostram erro 403: "Routes API has not been used in project 193287871715 before or it is disabled". A chave `GOOGLE_MAPS_API_KEY` existe mas a API não está ativada.

2. **Inconsistência ida vs ida+volta** — quando a API funciona, `fetchRoutePreview` retorna `distance_km` de ida (one-way), mas o campo `distancia_estimada_km` deveria armazenar o total ida+volta. O código atual salva `routeData.distance_km` diretamente (one-way) enquanto o fallback `getRoundTripKm()` retorna ida+volta (multiplicado por 2).

## Solução

### 1. Ativar a Google Routes API (ação do usuário)
O usuário precisa acessar o Google Cloud Console e ativar a "Routes API" no projeto associado à chave. Sem isso, todas as chamadas retornam 403.

### 2. Corrigir multiplicação ida+volta no `TransportsPage.tsx`
Quando `fetchRoutePreview` retorna `distance_km` (one-way), multiplicar por 2 para armazenar como ida+volta:

```typescript
distancia_estimada_km: routeData.distance_km 
  ? Math.round(routeData.distance_km * 2) 
  : getRoundTripKm(form.titulo, form.voo_cidade) || null,
```

Aplicar no payload de criação principal (linha ~429) e no return trip (linha ~476).

### 3. Atualizar exibição no `TransportForm.tsx`
Chamar `fetchRoutePreview` ao selecionar título/cidade e mostrar a distância real da API (multiplicada por 2) em vez do mapa estático. Se a API falhar, usar o fallback estático.

### 4. Manter fallback estático em `getRoundTripKm`
Manter os valores estáticos como fallback seguro para quando a API estiver indisponível. Os valores atuais já são baseados em distâncias rodoviárias reais (não linha reta).

## Arquivos alterados
1. `src/pages/TransportsPage.tsx` — multiplicar `distance_km * 2` nos payloads de criação
2. `src/components/transport/TransportForm.tsx` — buscar distância da API ao selecionar destino
3. `src/components/transport/TransportCard.tsx` — sem mudanças (já exibe `distancia_estimada_km` corretamente)

## Pré-requisito
O usuário precisa ativar a **Routes API** no Google Cloud Console: `https://console.developers.google.com/apis/api/routes.googleapis.com/overview?project=193287871715`

