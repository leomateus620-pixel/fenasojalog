

## Normalizar nomes de hotéis no filtro de Hóspedes

### Diagnóstico
O campo `hotel_nome` é texto livre. O `useMemo` de `hotelOptions` agrupa por valor **exato** (`counts.set(name, ...)`), então variações como:
- `Imigrante's` vs `Imigrantes` vs `imigrante's`
- Espaços extras no início/fim
- Apóstrofo curvo `'` (U+2019) vs reto `'` (U+0027)
- Diferenças de capitalização

…geram entradas separadas no select. Por isso o "Imigrante's" aparece 3 vezes.

### Solução em duas camadas

**1. Normalização no agrupamento do filtro** (`src/pages/GuestsPage.tsx`)

Criar um helper `normalizeHotelName(raw)` que:
- Faz `trim()`
- Colapsa espaços múltiplos (`\s+` → ` `)
- Substitui apóstrofo curvo `'` por reto `'`
- Aplica **Title Case** consistente (ex: `IMIGRANTES` → `Imigrantes`, `imigrante's` → `Imigrante's`)

Usar uma chave normalizada no `Map`, mas exibir o nome formatado. Isso unifica as 3 variações em **uma única opção** no select com a soma correta da contagem (ex: `Imigrante's (3)`).

A filtragem passa a comparar a forma normalizada também:
```ts
return guests.filter(g => normalizeHotelName(g.hotel_nome) === hotelFilter);
```

**2. Normalização ao salvar (preventivo)** — aplicada no `create` e `update` da página

Ao cadastrar/editar um hóspede, normalizar `hotel_nome` antes de gravar, garantindo que novos registros nunca criem variações fantasmas.

### Fluxo
1. Lista atual já agrupa as 3 variações em uma só linha do select com soma correta
2. Novos cadastros gravam o nome já normalizado
3. Sem migração no banco — registros antigos continuam com o texto original mas são agrupados em runtime

### Critério de aceite
1. "Imigrante's" aparece **uma única vez** no filtro com a contagem somada
2. Selecionar essa opção mostra todos os hóspedes das 3 variações
3. Novos hóspedes salvam o nome do hotel normalizado
4. Sem perda de dados existentes

### Arquivo
| Arquivo | Mudança |
|---|---|
| `src/pages/GuestsPage.tsx` | Adiciona helper `normalizeHotelName`, usa no `useMemo` de opções e no filtro, aplica em `handleAdd`/`handleEdit` antes de gravar |

