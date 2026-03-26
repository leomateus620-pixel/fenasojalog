

# Substituir Atalhos Rápidos por 2 Cards de Acesso Externo

## O que muda

Remover o bloco "Atalhos Rápidos" (linhas 36-47 e 405-422 do Dashboard) e substituir por 2 cards informativos premium.

## Implementação

### 1. Copiar o PDF da Rede Hoteleira
- Copiar `user-uploads://Rede_Hoteleira_1.pdf` para `public/docs/rede-hoteleira.pdf`
- Servido estaticamente, abre em nova aba

### 2. Refatorar `src/pages/Dashboard.tsx`
- Remover array `shortcuts` (linhas 36-47)
- Remover imports não mais usados (`Hotel`, `ClipboardList`, `Settings`, `Bike`)
- Substituir bloco "Atalhos Rápidos" (linhas 405-422) por novo bloco com 2 cards:

**Card 1 — Rede Hoteleira**
- Ícone: `Hotel` (lucide)
- Título: "Rede Hoteleira"
- Subtítulo: "Hotéis da região da Grande Santa Rosa"
- Descrição: "Consulte o PDF com a rede hoteleira disponível para apoio logístico e hospedagem."
- Badge: "PDF"
- Ação: `window.open('/docs/rede-hoteleira.pdf', '_blank')` — abre em nova aba
- Visual: ícone com fundo `bg-primary/10`, badge indicando tipo PDF

**Card 2 — Autorizações de Retirada**
- Ícone: `ClipboardList` (lucide)
- Título: "Autorizações de Retirada"
- Subtítulo: "Veículos e patinetes elétricos"
- Descrição: "Acesse a planilha utilizada pelas comissões para definir os responsáveis autorizados por data e turno."
- Badge: "Planilha"
- Ação: `window.open('https://docs.google.com/spreadsheets/d/1I0ESjrZWvpT5dQZrdTvYnIPtpY8SYJVP33fy4Yt0Cf0/edit?gid=0#gid=0', '_blank', 'noopener,noreferrer')`
- Visual: ícone com fundo `bg-gold/10`, badge indicando tipo Planilha

### 3. Layout dos cards
- Desktop: `grid grid-cols-2 gap-4` (lado a lado)
- Mobile: `grid grid-cols-1 gap-3` (empilhados)
- Cada card: `liquid-glass-card rounded-2xl p-5`, hover com `hover:bg-muted/60`, micro-animação `active:scale-[0.98]`, cursor pointer
- Diferenciação visual: Card 1 usa acento primary (verde), Card 2 usa acento gold (dourado)
- Botão CTA discreto com ícone `ExternalLink` indicando abertura externa

### Arquivos
1. `public/docs/rede-hoteleira.pdf` — copiar asset
2. `src/pages/Dashboard.tsx` — substituir bloco de atalhos

### Riscos
- Nenhum — apenas substitui um bloco visual estático por outro, sem tocar em lógica de negócio

