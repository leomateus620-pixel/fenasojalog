

# Corrigir Mapa Leaflet no Menu Transportes

## Diagnóstico

O mapa Leaflet não renderiza corretamente porque é inicializado enquanto seu container ainda está animando (transição `maxHeight: 0 → 450px` no Dynamic Island). Quando o Leaflet calcula o tamanho dos tiles, o container tem dimensões incorretas — resultando em tiles cinzas, mapa deslocado ou parcialmente renderizado.

## Causa raiz

No `TransportDynamicIsland.tsx`, o mapa está dentro de um `div` com transição CSS de `maxHeight`. O Leaflet inicializa via `useEffect` antes da animação terminar, capturando dimensões erradas. Não há chamada a `map.invalidateSize()` após o container se estabilizar.

## Solução

Adicionar `invalidateSize()` no `DriverLocationMap.tsx` com dois mecanismos:

1. **Timer após montagem** — chamar `invalidateSize()` com delay de 600ms (após a animação de 500ms do Dynamic Island terminar)
2. **ResizeObserver** — observar o container do mapa e chamar `invalidateSize()` sempre que suas dimensões mudarem

### Alteração em `src/components/DriverLocationMap.tsx`

No `useEffect` principal (linha 25-110), após criar o mapa, adicionar:

```typescript
// Após L.map(...) ser criado:
setTimeout(() => {
  mapInstanceRef.current?.invalidateSize();
}, 600);
```

E no `useEffect` de cleanup (linha 112-122), adicionar um `ResizeObserver`:

```typescript
useEffect(() => {
  const container = mapRef.current;
  if (!container) return;

  const observer = new ResizeObserver(() => {
    mapInstanceRef.current?.invalidateSize();
  });
  observer.observe(container);

  return () => {
    observer.disconnect();
    mapInstanceRef.current?.remove();
    mapInstanceRef.current = null;
    markerRef.current = null;
    circleRef.current = null;
    polylineRef.current = null;
    destMarkerRef.current = null;
  };
}, []);
```

### Arquivo
- `src/components/DriverLocationMap.tsx` — adicionar `invalidateSize()` com timer + ResizeObserver

### Riscos
- Nenhum — `invalidateSize()` é idempotente e sem efeitos colaterais, apenas recalcula dimensões internas do Leaflet

