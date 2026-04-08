

# Corrigir diálogos de Hóspedes cortando o cabeçalho

## Problema

Os diálogos "Cadastrar Hóspede" e "Editar Hóspede" têm muitos campos (nome, telefone, email, hotel, check-in, check-out, observações). O `DialogContent` usa `max-h-[min(90dvh,52rem)]` com `overflow-hidden`, então quando o conteúdo excede a altura máxima, o cabeçalho é cortado por cima e o botão fica oculto por baixo.

## Solução

Reestruturar os diálogos para manter header e botão sempre visíveis, com apenas os campos do formulário rolando internamente.

## Alterações

### `src/pages/GuestsPage.tsx`

- Envolver `<GuestFormFields>` em um `<div>` com `overflow-y-auto flex-1 -mx-6 px-6` para criar scroll interno apenas nos campos
- Mover o `<Button>` de ação para fora da área scrollável, fixando-o no rodapé do dialog
- Adicionar `className="flex flex-col max-h-[80dvh]"` no `DialogContent` para garantir que o layout flex funcione corretamente em mobile
- Aplicar separador visual sutil (border-top) antes do botão de ação quando há scroll

### Design aprimorado (mantendo cores do tema)

- Header: adicionar ícone `Hotel` dourado ao lado do título para identidade visual
- Campos: adicionar labels mais claras com cor `text-foreground/80`
- Botão: manter `rounded-xl h-11` com `bg-primary` conforme padrão do projeto
- Scroll area: usar `scrollbar-thin` para scrollbar elegante

| Arquivo | Ação |
|---|---|
| `src/pages/GuestsPage.tsx` | Reestruturar diálogos com scroll interno e header/footer fixos |

