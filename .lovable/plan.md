

# Corrigir Mapa de Localização nos Transportes

## Problemas identificados

1. **Dynamic Island começa fechado** — mesmo para viagens "em_andamento", o `expanded` inicia como `false`. O usuário precisa clicar para ver o mapa.
2. **Sem mapa antes da localização chegar** — o mapa só aparece quando `location` não é null (dados do GPS já inseridos no banco). Há um delay entre iniciar a viagem e o GPS retornar a primeira posição.
3. **Sem rota sugerida visual** — quando não há polyline salva, o mapa mostra apenas o ponto do motorista sem rota ao destino.

## Solução

### 1. Auto-expandir Dynamic Island para viagens ativas
No `TransportDynamicIsland.tsx`, iniciar `expanded` como `true` quando `t.status === 'em_andamento'`:

```tsx
const [expanded, setExpanded] = useState(isActive);
```

E adicionar um `useEffect` para expandir automaticamente quando o status mudar para ativo:
```tsx
useEffect(() => {
  if (isActive) setExpanded(true);
}, [isActive]);
```

### 2. Mostrar mapa com destino enquanto localização não chega
Na área do mapa (linha 241-287), quando `isActive` mas `location` é null, mostrar um mapa estático com o destino e uma mensagem "Aguardando GPS...":

```tsx
{isActive && !location && destCoords ? (
  <Suspense fallback={...}>
    <div className="relative">
      <DriverLocationMap
        latitude={destCoords[0]}
        longitude={destCoords[1]}
        className="h-[160px] relative"
        routePolyline={routePolyline}
        destLatLng={destCoords}
        destLabel={t.destino}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-2xl">
        <span className="flex items-center gap-2 bg-card/90 px-3 py-1.5 rounded-full text-xs font-medium">
          <Navigation className="w-3.5 h-3.5 animate-pulse text-accent" />
          Obtendo localização do motorista...
        </span>
      </div>
    </div>
  </Suspense>
) : null}
```

### 3. Gerar rota em linha reta como fallback visual
No `DriverLocationMap.tsx`, quando não há `routePolyline` mas há `destLatLng` e posição do motorista, desenhar uma linha direta (sem polyline da API) entre os dois pontos para dar feedback visual imediato.

## Arquivos alterados
1. `src/components/TransportDynamicIsland.tsx` — auto-expand + mapa fallback enquanto GPS carrega
2. `src/components/DriverLocationMap.tsx` — linha reta fallback quando não há polyline

## Riscos
- Nenhum impacto em lógica de negócio
- O auto-expand não afeta viagens pendentes ou concluídas

