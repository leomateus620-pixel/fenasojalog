

## Diagnóstico

No mobile, o `PlacesSearchDialog` usa `Drawer` com `max-h-[90dvh]`. Quando o teclado iOS abre (~40% da tela), o drawer ocupa 90dvh do viewport **original** e o teclado empurra o layout — mas como o input fica no **topo** do drawer e os resultados abaixo, o teclado cobre exatamente a área de resultados. Além disso, o usuário vê apenas o estado vazio ("Buscar destino" centralizado) porque a área de resultados é empurrada para fora da viewport visível.

## Correção

**Arquivo único**: `src/components/transport/PlacesSearchDialog.tsx`

### Ajustes no `DrawerContent` (mobile)

1. **Altura reduzida e controlada pelo teclado**: trocar `max-h-[90dvh]` por `h-[85dvh]` com `height: 100svh` fallback — `svh` (small viewport height) considera o teclado aberto no iOS, diferente de `dvh`.

2. **Input fixo no topo (sticky)**: envolver o input em `sticky top-0 z-10 bg-background pt-2 pb-3` para que ele permaneça visível mesmo ao rolar, e o usuário veja o que digita.

3. **Área de resultados com scroll próprio e padding inferior generoso**: adicionar `pb-[env(safe-area-inset-bottom)]` + `pb-24` para garantir que os resultados não fiquem escondidos atrás do teclado, e o usuário possa rolar para vê-los.

4. **Reduzir o estado vazio**: o ícone "Buscar destino" com círculo grande (py-10) está ocupando muito espaço quando não há busca. Reduzir para py-4 e ícone menor (w-10 h-10) — assim os primeiros resultados aparecem imediatamente ao digitar.

5. **Auto-scroll ao digitar**: quando `results` muda, rolar o container para o topo garantindo que o primeiro resultado seja visível.

6. **Focus delay aumentado**: de 200ms para 350ms para permitir a animação do drawer completar antes do teclado abrir (evita jump).

### Estrutura final (mobile)

```text
DrawerContent h-[85dvh] max-h-[85svh] flex flex-col
├── DrawerHeader (shrink-0, compacto)
├── Input sticky top-0 (sempre visível)
└── Results (flex-1, overflow-y-auto, pb-24 + safe-area)
    ├── Empty state compacto (py-4)
    ├── Loading skeletons
    └── Lista de resultados
```

### Sem alterações em

- Desktop (`Dialog`) — funciona bem.
- Lógica de busca, debounce, AbortController — mantidos.
- Demais componentes do fluxo de transporte.

## Resultado

- Input sempre visível acima do teclado.
- Resultados roláveis dentro do espaço disponível acima do teclado.
- Estado vazio mais compacto, liberando espaço para resultados.
- `svh` respeita o teclado aberto no iOS Safari.
- Sem regressão no desktop nem em outros fluxos.

