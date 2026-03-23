

# Plano: Corrigir menu de detalhes do veículo (esticado/cortado) + visual premium

## Problema
O dialog de detalhes do veículo (`VehicleDetailContent`) contém muito conteudo (metricas, PDF, upload documento, retirada/devoluçao, abas de utilizaçao e combustivel). No mobile o conteudo estoura o viewport e fica cortado/inacessivel. No desktop tambem fica excessivamente longo.

## Soluçao

### 1. Trocar Dialog por Drawer no mobile, manter Dialog no desktop
**Arquivo:** `src/pages/VehiclesPage.tsx` (linhas 420-443)

- Usar `useIsMobile()` para detectar plataforma
- **Mobile**: usar `Drawer` (desliza de baixo) com `max-h-[85dvh]` e scroll interno — resolve o problema de corte
- **Desktop**: manter `Dialog` com `max-h-[85vh]` e scroll interno ajustado

### 2. Reorganizar VehicleDetailContent para ser mais compacto
**Arquivo:** `src/pages/VehiclesPage.tsx` (linhas 601-980)

- Metricas no topo: manter grid 3 colunas mas com padding reduzido
- Seçao de documento: collapsar por padrao, mostrar apenas se já tem doc ou se clicar "Adicionar"
- Seçoes retirada/devoluçao e tabs: manter mas com espaçamento otimizado
- Aplicar visual liquid glass premium consistente em todas as seçoes internas

### 3. Aplicar visual liquid glass premium ao menu
- Header do dialog/drawer com titulo + badge status mais destacado
- Metricas com glass cards refinados
- Botoes e tabs com visual premium atualizado
- Bordas, sombras e fundos alinhados com a paleta Fenasoja

## Arquivos a editar
1. `src/pages/VehiclesPage.tsx` — dialog de detalhes (drawer no mobile + visual premium)

