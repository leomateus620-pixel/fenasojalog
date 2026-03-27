

# Relatório do Sistema Automático — E-mail Diário 7h e 19h

## O que será feito

Criar um fluxo automatizado que gera o Relatório do Sistema 2x ao dia (7:00 e 19:00 BRT) e envia por e-mail para `leomateus620@gmail.com` e `fenasojalog@gmail.com`.

## Pré-requisito: Infraestrutura de E-mail

Para enviar e-mails a partir do sistema, é necessário configurar um domínio de e-mail. Isso será feito automaticamente como primeiro passo — o sistema configurará a infraestrutura de envio de e-mails e criará o template do relatório.

**Sem um domínio de e-mail configurado, não é possível enviar e-mails.** Após a configuração, será necessário aguardar a verificação DNS (pode levar até 72h), mas a estrutura pode ser montada imediatamente.

## Arquitetura

```text
pg_cron (7:00 / 19:00 BRT)
   ↓
Edge Function: send-system-report
   ↓
1. Consulta todas as tabelas (transports, vehicles, guests, events, tasks, etc.)
2. Filtra dados do dia atual
3. Monta relatório HTML estruturado (mesmo conteúdo do PDF)
4. Envia e-mail via send-transactional-email para os 2 destinatários
```

## Implementação

### 1. Configurar infraestrutura de e-mail
- Setup do domínio de e-mail
- Criar template de e-mail `system-report` (React Email)
- Deploy das funções de e-mail

### 2. Criar Edge Function `send-system-report/index.ts`
- Usa cliente admin do Supabase para consultar todas as tabelas
- Coleta dados filtrados pelo dia atual (created_at, updated_at dentro do dia)
- Monta payload resumido com totais por módulo
- Invoca `send-transactional-email` para cada destinatário com o template `system-report`
- Destinatários hardcoded: `leomateus620@gmail.com`, `fenasojalog@gmail.com`

### 3. Agendar com pg_cron
- Criar 2 jobs cron:
  - `send-system-report-morning`: `0 10 * * *` (10:00 UTC = 7:00 BRT)
  - `send-system-report-evening`: `0 22 * * *` (22:00 UTC = 19:00 BRT)
- Cada job faz HTTP POST para a Edge Function

### 4. Teste manual
- Invocar a Edge Function imediatamente após deploy para validar o fluxo

## Template do e-mail (React Email)

O e-mail conterá:
- Título: "Relatório do Sistema — [data]"
- Resumo: total de registros, módulos contemplados
- Tabela por módulo: nome, total de registros, criados, alterados
- Seção de inconsistências (se houver)
- Nota: "Relatório gerado automaticamente às [hora]"

## Arquivos criados/alterados

| Arquivo | Ação |
|---|---|
| `supabase/functions/send-system-report/index.ts` | Criar — edge function de coleta + envio |
| `supabase/functions/_shared/transactional-email-templates/system-report.tsx` | Criar — template do e-mail |
| `supabase/functions/_shared/transactional-email-templates/registry.ts` | Editar — registrar template |
| Infraestrutura de e-mail | Setup automático via ferramentas |
| pg_cron jobs | Inserir via SQL |

## Limitação importante

O PDF não pode ser anexado ao e-mail (Lovable não suporta anexos). O relatório será enviado como **conteúdo HTML no corpo do e-mail**, com a mesma estrutura e dados do PDF. O PDF continua disponível para download manual na página do sistema.

