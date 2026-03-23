

# Plano: Centralizar e corrigir menu de detalhes do veículo

## Problema
O `DialogContent` no `VehicleDetailModal` usa `overflow-hidden` que anula o `overflow-y-auto` do componente base. O dialog cresce com o conteúdo, ultrapassa o viewport e fica cortado embaixo. Também usa Drawer no mobile, mas o usuário quer centralizado em ambas as plataformas.

## Correção

### Arquivo: `src/pages/VehiclesPage.tsx`

**1. Simplificar `VehicleDetailModal` — usar apenas Dialog (sem Drawer)**
- Remover toda a lógica de `isMobile` e branch de `Drawer`
- Usar apenas `Dialog` com `DialogContent`

**2. Corrigir o DialogContent**
- Trocar `className="sm:max-w-lg p-0 overflow-hidden"` por `className="sm:max-w-lg max-h-[85dvh] p-0 flex flex-col"`
- O `max-h-[85dvh]` limita a altura do dialog
- O `flex flex-col` permite o header fixo e body scrollável

**3. Corpo scrollável interno**
- Header (`DialogHeader`) fica fixo no topo com `shrink-0`
- Body envolto em `div` com `overflow-y-auto flex-1 min-h-0 px-5 pb-5`
- Remover o wrapper antigo de `bodyContent` com `style={{ maxHeight: ... }}`

**4. Visual liquid glass premium**
- `DialogContent`: adicionar `premium-surface` ou `bg-card/95 backdrop-blur-2xl`
- Header com borda inferior sutil `border-b border-border/20`
- Scroll suave com `scroll-smooth`

## Resultado esperado
- Dialog centralizado na tela (desktop e mobile)
- Conteúdo longo scrollável internamente
- Nunca ultrapassa o viewport
- Visual premium consistente

## Arquivos a editar
1. `src/pages/VehiclesPage.tsx` — VehicleDetailModal (linhas 467-539)

