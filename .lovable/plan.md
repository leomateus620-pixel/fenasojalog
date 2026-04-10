

# Auto-detecção de origem + Busca de destino premium

## Resumo

Duas melhorias no formulário de criação de transporte:
1. **Origem automática**: Detectar cidade do usuário via geolocalização + Google Reverse Geocoding
2. **Destino "Outros"**: Substituir dropdown inline por um modal/drawer dedicado com busca de lugares — UX premium, responsivo

## Alterações

### 1. Edge function `places-autocomplete` — adicionar modo `reverse-geocode`

Adicionar suporte a um segundo modo na mesma edge function:
- `{ mode: "reverse", lat: number, lng: number }` → chama Google Geocoding API reversa → retorna `{ city: string, address: string }`
- Mantém o modo existente de busca (`{ query: string }`) intacto

### 2. Novo componente `src/components/transport/PlacesSearchDialog.tsx`

Modal dedicado para busca de destino com design premium:
- **Mobile**: Drawer (vaul) que sobe do fundo, ocupando ~85% da tela
- **Desktop**: Dialog centralizado (max-w-lg)
- Header com título "Buscar Destino" e botão fechar
- Campo de busca grande com ícone, auto-focus
- Lista de resultados com ícones MapPin, nome em destaque, endereço secundário, cidade como badge
- Estado vazio com ilustração/texto "Digite para buscar..."
- Loading com skeleton/spinner
- Ao selecionar → fecha e retorna o `PlaceResult`

### 3. Atualizar `src/components/transport/TransportForm.tsx`

**Origem automática:**
- Adicionar `useEffect` no mount que pede `navigator.geolocation.getCurrentPosition`
- Com as coordenadas, chamar `places-autocomplete` com `mode: "reverse"` 
- Preencher `data.origem` com a cidade retornada (se o campo estiver vazio)
- Mostrar ícone de localização 📍 e estado de loading no campo de origem
- Botão de "redetectar" ao lado do input de origem

**Destino "Outros":**
- Substituir o `PlacesAutocomplete` inline por um botão que abre o `PlacesSearchDialog`
- Quando um lugar é selecionado, preencher `destino`, `destino_lat`, `destino_lng`, `_selectedPlaceName`
- Exibir o local selecionado como um chip/card elegante abaixo do botão (com ícone MapPin + nome + cidade)

### 4. Atualizar `src/components/transport/PlacesAutocomplete.tsx`

Manter o componente existente mas refatorar para ser usado internamente pelo `PlacesSearchDialog` (reutilizar a lógica de busca).

## Fluxo do usuário

```text
ORIGEM:
1. Abre "Novo Transporte"
2. Campo "Origem" já aparece com spinner "Detectando..."
3. Em ~1s preenche automaticamente: "SANTA ROSA" (baseado no GPS)
4. Usuário pode editar manualmente se quiser

DESTINO (Outros):
1. Seleciona "Outros" no título
2. Aparece botão "Buscar destino..." em vez de input inline
3. Clica → abre modal/drawer com campo de busca grande
4. Digita "Ijuí" → resultados aparecem com design limpo
5. Seleciona → modal fecha, chip com "Ijuí, RS" aparece no form
6. Distância é calculada automaticamente via Google Routes
```

## Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/places-autocomplete/index.ts` | Adicionar modo `reverse` geocoding |
| `src/components/transport/PlacesSearchDialog.tsx` | Novo — modal/drawer premium de busca |
| `src/components/transport/TransportForm.tsx` | Auto-detecção origem + botão para abrir dialog de destino |
| `src/components/transport/PlacesAutocomplete.tsx` | Refatorar para reutilização interna |

