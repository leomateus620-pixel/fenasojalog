

# Gerar Links de Acesso Público para Todas as Comissões

## Resumo
Criar uma tabela `public_form_links` para armazenar tokens de acesso, uma aba "Links" no painel de mobilidade para gerar e copiar links, uma rota pública isolada `/f/mobilidade/:token`, e uma edge function para resolver tokens sem autenticação.

## Banco de Dados

### Tabela `public_form_links`
- id, org_id, committee_id, committee_name_snapshot, president_name_snapshot
- token_hash (SHA-256 do token), token_hint (últimos 4 chars para identificação)
- is_active (default true), created_at, updated_at
- RLS: select/insert/update/delete apenas para admin/gestor autenticados
- Unique index em `(org_id, committee_id)` para 1 link por comissão

### Edge Function `resolve-public-link`
- Recebe `{ token }`, computa SHA-256, busca na tabela `public_form_links`
- Retorna committee_name, president_name se ativo
- Usa service role key para bypass de RLS
- Não expõe dados internos

## Frontend

### Nova aba "Links" no `MobilityAuthPage.tsx`
- Adicionar terceira tab ao TabsList existente

### Novo componente `MobilityLinksPanel.tsx`
- Botão "Gerar links para todas as comissões" que cria um token aleatório (crypto.randomUUID) por comissão, salva hash SHA-256 no banco
- Tabela listando: comissão, presidente, link (com botão copiar), status ativo/inativo
- Botão individual de copiar link e toggle ativo/inativo

### Novo hook `usePublicFormLinks.ts`
- CRUD autenticado para `public_form_links`
- Mutation para gerar links em batch (todas comissões)

### Rota pública `/f/mobilidade/:token`
- Registrada FORA do AuthGuard/OrgGuard/Layout no `App.tsx`
- Página `PublicMobilityFormPage.tsx` com layout mínimo isolado
- Chama edge function `resolve-public-link` para validar token
- Exibe nome da comissão e presidente
- Por enquanto: exibe apenas confirmação de que o link é válido (formulário público completo será implementado depois)

## Arquivos a criar
| Arquivo | Descrição |
|---|---|
| Migration SQL | Tabela `public_form_links` + RLS |
| `supabase/functions/resolve-public-link/index.ts` | Resolver token |
| `src/components/mobility/MobilityLinksPanel.tsx` | Painel de gestão de links |
| `src/hooks/usePublicFormLinks.ts` | Hook CRUD para links |
| `src/pages/PublicMobilityFormPage.tsx` | Página pública isolada |

## Arquivos a modificar
| Arquivo | Alteração |
|---|---|
| `src/App.tsx` | Rota `/f/mobilidade/:token` fora do AuthGuard |
| `src/pages/MobilityAuthPage.tsx` | Tab "Links" |

