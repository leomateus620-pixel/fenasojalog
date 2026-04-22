

## Filtro por hotel no menu Hóspedes

### Diagnóstico
A página `/guests` lista todos os hóspedes em cards, mas **não tem filtro**. Cada hóspede possui o campo `hotel_nome` (texto livre cadastrado no formulário). Hoje, com vários convidados em hotéis distintos, a operação precisa rolar a lista inteira para encontrar os hóspedes de um hotel específico.

### Solução

**1. Barra de filtros acima do grid de cards** (`src/pages/GuestsPage.tsx`)

Inserir entre o cabeçalho ("Hóspedes / Novo Hóspede") e o grid de cards um bloco `liquid-glass-card` compacto contendo:

- **Select de Hotel** (`Select` do shadcn) com:
  - Opção padrão: **"Todos os hotéis"** (mostra contagem total entre parênteses)
  - Lista dinâmica das opções extraídas via `useMemo` de `guests` — todos os valores únicos não-vazios de `hotel_nome`, ordenados alfabeticamente, cada um com a contagem de hóspedes (ex: `Plaza Hotel (4)`)
  - Opção especial: **"Sem hotel definido"** — quando existirem hóspedes com `hotel_nome` nulo/vazio
- **Badge de contador à direita** mostrando "N de M hóspedes" quando o filtro está ativo
- **Botão "Limpar"** (ícone `X`, ghost) que aparece apenas quando o filtro está ativo, voltando para "Todos os hotéis"

**2. Lógica de filtragem**

```ts
const filteredGuests = useMemo(() => {
  if (hotelFilter === 'all') return guests;
  if (hotelFilter === '__none__') return guests.filter(g => !g.hotel_nome?.trim());
  return guests.filter(g => g.hotel_nome === hotelFilter);
}, [guests, hotelFilter]);
```

Trocar `guests.map(...)` por `filteredGuests.map(...)` no grid e também na verificação `guests.length === 0` (passa a ser `filteredGuests.length === 0`).

**3. Empty state contextual**

Quando o filtro retorna 0 resultados (mas existem hóspedes cadastrados), exibir mensagem específica:
> "Nenhum hóspede no hotel selecionado" + botão "Limpar filtro"

Mantém o empty state atual ("Nenhum hóspede cadastrado") apenas quando `guests.length === 0` de fato.

**4. Persistência da seleção (sessão)**

Salvar o filtro escolhido em `sessionStorage` (`guests:hotel-filter`) para preservar a escolha ao navegar e voltar à página, sem persistir entre sessões/login.

### Estilo visual

Coerente com a identidade Liquid Glass:
- Container do filtro: `liquid-glass-card rounded-xl px-3 py-2 flex items-center gap-3`
- `Select` h-10 rounded-xl com ícone `Hotel` à esquerda do trigger
- Badge contador com `Badge variant="secondary"` em dourado sutil
- Mobile (<640px): filtro empilha em coluna, ocupa largura total

### Fluxo interpretado

1. Usuário acessa **Hóspedes** → vê todos os cards (filtro padrão "Todos")
2. Clica no select → vê lista de hotéis cadastrados com contagem por hotel
3. Seleciona "Hotel Plaza" → grid filtra instantaneamente, badge mostra "4 de 23 hóspedes", botão "Limpar" aparece
4. Cria/edita um hóspede → ao salvar, a lista de hotéis no select recalcula automaticamente (via `useMemo`)
5. Navega para outra página e volta → filtro permanece ativo (sessionStorage)
6. Faz logout → filtro reseta naturalmente

### Arquivos

| Arquivo | Tipo | Mudança |
|---|---|---|
| `src/pages/GuestsPage.tsx` | Edit | Adiciona estado `hotelFilter`, `useMemo` para opções e lista filtrada, barra de filtros com `Select`, persistência em `sessionStorage`, empty state contextual |

Sem migração de banco. Sem novos hooks. Sem impacto em outros módulos (formulário de cadastro, vinculação de transportes etc. continuam funcionando idênticos).

### Critério de aceite

1. Aparece um filtro "Hotel" acima da grid de hóspedes
2. Select lista todos os hotéis distintos extraídos dos hóspedes cadastrados, ordenados alfabeticamente, com contagem por hotel
3. Selecionar um hotel filtra a grid em tempo real
4. Opção "Sem hotel definido" disponível quando aplicável
5. Botão "Limpar" reseta para "Todos os hotéis"
6. Filtro persiste em `sessionStorage` durante a sessão
7. Empty state diferencia "nenhum cadastrado" de "nenhum no filtro atual"
8. Mobile responsivo (filtro empilha em coluna abaixo de 640px)

