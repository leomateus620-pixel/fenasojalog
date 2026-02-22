

# Plano de Melhorias - Fenasoja Logistica

Este plano abrange todas as solicitações em uma implementacao integrada.

---

## 1. Corrigir criacao de organizacao (bloqueio atual)

O sistema esta travado na tela "Criar Organizacao" porque o INSERT falha por causa do RLS.

**Solucao:** Criar funcao RPC `create_org_with_member` (SECURITY DEFINER) que atomicamente cria a org e adiciona o usuario como admin. Atualizar `useCurrentOrg.ts` para usar essa RPC. Remover a tela de "Criar Organizacao" da exibicao (conforme solicitado - "desabilitar esse item").

---

## 2. Carrinhos Eletricos - novos campos

Adicionar campos a tabela `electric_carts`:
- `comissao` (text) - para qual comissao o carrinho esta cedido
- Ja existem campos de `responsavel_user_id`, `retirada_em` e `devolucao_em`

Atualizar a pagina `ElectricCartsPage.tsx`:
- Exibir campo "Comissao" no formulario de retirada e nos cards
- Exibir data/horario de retirada e devolucao de forma mais visivel nos cards
- Adicionar campo comissao no formulario de edicao

---

## 3. Transportes - filtros e historico

Atualizar `TransportsPage.tsx`:
- Adicionar barra de filtros no topo: por motorista/responsavel, por status (pendente, em andamento, concluido, cancelado)
- Por padrao, ocultar transportes concluidos/cancelados da listagem principal
- Adicionar campo de pesquisa para buscar historico por dia e por veiculo
- Botao "Mostrar Historico" que revela os concluidos com filtro de data

---

## 4. Dashboard - renomear cards e adicionar navegacao

Alterar `Dashboard.tsx`:
- "Veiculos Disponiveis" -> "Veiculos Botolli Disponiveis"
- "Carrinhos em Uso" -> "Carrinhos Eletricos Disponiveis" (mostrando disponiveis ao inves de em uso)
- Cada StatCard ao ser clicado navega para a pagina correspondente:
  - Veiculos Botolli -> `/vehicles`
  - Carrinhos Eletricos -> `/electric-carts`
  - Transportes Ativos -> `/transports`
  - Tarefas Pendentes -> `/checklist`

Atualizar `StatCard.tsx` para aceitar prop `onClick` ou `href`.

---

## 5. Cadastro de membros - e-mail e senha integrado

O cadastro na pagina de Equipe ja possui campos de e-mail e senha. Vou garantir que:
- Os campos sejam obrigatorios (ja estao presentes)
- A edge function `create-user` funcione corretamente com a permissao do admin

---

## 6. Google Cloud (Google OAuth Login)

Habilitar login com Google na aplicacao:
- Configurar o provider Google OAuth via conector
- Adicionar botao "Entrar com Google" na `LoginPage.tsx`
- Atualizar o fluxo de autenticacao

---

## Detalhes Tecnicos

### Migracao SQL
```sql
-- 1. Funcao atomica para criar org
CREATE OR REPLACE FUNCTION public.create_org_with_member(org_nome text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_org_id uuid;
  caller_id uuid := auth.uid();
  caller_name text;
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT COALESCE(raw_user_meta_data->>'full_name', email)
    INTO caller_name FROM auth.users WHERE id = caller_id;
  INSERT INTO organizations (nome) VALUES (org_nome) RETURNING id INTO new_org_id;
  INSERT INTO org_members (org_id, user_id, role, nome_exibicao)
    VALUES (new_org_id, caller_id, 'admin', caller_name);
  RETURN new_org_id;
END; $$;

-- 2. Novo campo comissao em electric_carts
ALTER TABLE public.electric_carts ADD COLUMN IF NOT EXISTS comissao text;
```

### Arquivos modificados
- `src/hooks/useCurrentOrg.ts` - usar RPC `create_org_with_member`
- `src/components/OrgGuard.tsx` - remover exibicao de CreateOrgPage (pular direto)
- `src/pages/ElectricCartsPage.tsx` - campo comissao, exibir datas
- `src/hooks/useElectricCarts.ts` - incluir comissao na retirada
- `src/pages/TransportsPage.tsx` - filtros por responsavel/status, pesquisa historico
- `src/pages/Dashboard.tsx` - renomear labels, adicionar onClick com navegacao
- `src/components/StatCard.tsx` - aceitar prop onClick
- `src/pages/LoginPage.tsx` - botao Google OAuth

### Ordem de execucao
1. Migracao SQL (create_org_with_member + campo comissao)
2. Corrigir useCurrentOrg + OrgGuard
3. Atualizar ElectricCartsPage
4. Atualizar TransportsPage com filtros
5. Atualizar Dashboard + StatCard
6. Configurar Google OAuth + LoginPage

