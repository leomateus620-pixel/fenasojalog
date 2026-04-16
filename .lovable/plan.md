

## Diagnóstico

**Causa do erro:** A política `cmf_insert` (e `cmm_insert`) exige role `admin/gestor/operador`. Mas `fenasojalog2026@hotmail.com` tem role `leitura` + capability `mobility_access`. Quando ele tenta inserir em `committee_mobility_forms`, o RLS bloqueia com "new row violates row-level security policy".

A capability `mobility_access` foi criada para liberar a navegação no frontend, mas as políticas RLS das tabelas de mobilidade nunca foram atualizadas para reconhecê-la.

**Dados do usuário (confirmados no banco):**
- user_id: `745e22a1-aefd-4a68-8f1a-30b14b97c9b5`
- org_id: `985888b8-155f-4bbe-b6b9-6bef2893d99b`
- role: `leitura` + capability `mobility_access`

**Comissão Serviços (confirmada):**
- committee_id: `c8d2aec0-e8bc-47c1-ae92-0843f1fb6570`
- president: Valtair Dorneles

## Correções

### 1. Migration SQL — corrigir RLS para aceitar capability `mobility_access`

Atualizar políticas INSERT/UPDATE de `committee_mobility_forms` e `committee_mobility_members` para também permitir quando `has_capability(auth.uid(), org_id, 'mobility_access')` retornar `true`:

```sql
DROP POLICY "cmf_insert" ON public.committee_mobility_forms;
CREATE POLICY "cmf_insert" ON public.committee_mobility_forms FOR INSERT
  WITH CHECK (
    public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor','operador')
    OR public.has_capability(auth.uid(), org_id, 'mobility_access')
  );

DROP POLICY "cmf_update" ON public.committee_mobility_forms;
CREATE POLICY "cmf_update" ON public.committee_mobility_forms FOR UPDATE
  USING (
    public.get_user_org_role(auth.uid(), org_id) IN ('admin','gestor','operador')
    OR public.has_capability(auth.uid(), org_id, 'mobility_access')
  );

-- Mesmo tratamento para committee_mobility_members (insert/update)
```

Manter DELETE restrito a admin/gestor (segurança preservada).

### 2. Pré-cadastrar a solicitação completa de Valtair (na mesma migration)

Inserir um `committee_mobility_forms` para a comissão "Serviços" e os 6 integrantes em `committee_mobility_members`, depois rodar `sync_internal_mobility_form()` para popular `mobility_authorizations`. Dados extraídos dos anexos:

**Cabeçalho:**
- Comissão: Serviços (Presidente: Valtair Dorneles)
- Responsável Operacional: ALEXANDRE BARBOSA
- Telefone: 55992016989
- E-mail: VALTAIR190@GMAIL.COM
- Carro Elétrico: ✅ | Patinete: ❌

**6 Integrantes (todos com Carro Elétrico ✅, QR Gratuito ❌, função SERVIÇOS, observação "CARRINHOS DE TRANSPORTE DE RESIDUOS LIXO"):**

| # | Nome | CPF |
|---|---|---|
| 1 | JOSE EDUARDO MUCHA | 00911028048 |
| 2 | GIUSEPPE FRANCESCO MARTINS GER | 02718327030 |
| 3 | ANTILHO FAGUNDES NETO | 00879183071 |
| 4 | ARLEN ANTUNES | 87714051000 |
| 5 | CARLOS EDUARDO ANGST | 82026233049 |
| 6 | ROBSON NORBERTO SEGAT | 01179189035 |

`submitted_by_user_id`: `745e22a1-aefd-4a68-8f1a-30b14b97c9b5` (Valtair)
`org_id`: `985888b8-155f-4bbe-b6b9-6bef2893d99b`
`committee_id`: `c8d2aec0-e8bc-47c1-ae92-0843f1fb6570`

Após inserir, executar `SELECT public.sync_internal_mobility_form('<form_id>');` para gerar 6 autorizações em `mobility_authorizations` (tipo `carro_eletrico`).

## Arquivos
- **Nova migration SQL** com: 4 políticas atualizadas + INSERT do form + INSERT dos 6 membros + chamada de sync.

## Resultado
- Valtair (e qualquer usuário com `mobility_access`) consegue enviar solicitações sem erro de RLS.
- A solicitação dele já estará cadastrada e sincronizada com Carrinhos Elétricos quando logar de novo.
- Segurança preservada: DELETE continua restrito a admin/gestor; outros módulos não afetados.

