

# Plano de Implementacao - Admin, Biometria, Localizacao e E-mail Diario

---

## 1. Cadastrar administrador fenasojalog@gmail.com

Criar o usuario administrador diretamente no banco de dados usando a edge function `create-user` ja existente. Como ainda nao ha nenhum admin no sistema, sera necessario:

- Criar o usuario via SQL (usando a API de admin do Supabase na edge function)
- Inserir o papel `admin` na tabela `user_roles`
- Definir uma senha inicial (o admin podera alterar depois)

**Abordagem:** Criar uma edge function temporaria ou usar a funcao `create-user` existente adaptando-a para aceitar a criacao do primeiro admin (bootstrap). Na pratica, vamos inserir o usuario diretamente via SQL admin no backend.

---

## 2. Login com biometria (Passkeys/WebAuthn)

Apos o primeiro login com e-mail e senha, o usuario podera cadastrar sua biometria (impressao digital, Face ID) para logins futuros usando a API WebAuthn do navegador.

**Como funciona:**
- Na tela de login, apos autenticar com sucesso pela primeira vez, aparece um botao "Ativar acesso por biometria"
- O sistema registra uma credencial WebAuthn vinculada ao usuario
- Nas proximas vezes, o usuario ve um botao "Entrar com biometria" na tela de login
- As credenciais sao armazenadas localmente no dispositivo (localStorage para o credential ID, o dispositivo guarda a chave privada)
- Uma tabela `user_passkeys` no banco armazena as chaves publicas vinculadas a cada usuario

**Fluxo:**
1. Login com e-mail/senha -> sucesso -> oferecer cadastro de biometria
2. Proximo acesso -> botao "Entrar com biometria" -> autentica localmente -> valida no backend -> sessao criada

---

## 3. Botao de localizacao em tempo real nos Transportes

Dentro da pagina de Transportes, quando um transporte estiver com status "em andamento", o motorista podera ativar o compartilhamento de localizacao.

**O que sera feito:**
- Adicionar botao "Compartilhar Localizacao" no card de transporte em andamento
- Usar a API `navigator.geolocation.watchPosition` para rastrear a posicao
- Criar tabela `transport_locations` no banco para armazenar latitude, longitude e timestamp
- Ativar Realtime na tabela para que outros usuarios vejam a posicao atualizada
- Mostrar um indicador visual (ponto pulsante + coordenadas) no card do transporte
- Botao para parar o compartilhamento

**Tabela `transport_locations`:**
- id, transport_id, driver_id, latitude, longitude, updated_at
- RLS: motorista pode inserir/atualizar, todos autenticados podem ler

---

## 4. E-mail diario as 20h com agenda do dia seguinte

Enviar automaticamente para cada membro da equipe (que tenha e-mail cadastrado) a sua escala e tarefas do dia seguinte.

**O que sera feito:**
- Criar edge function `send-daily-agenda` que:
  - Busca todos os membros da equipe com e-mail
  - Para cada um, busca escalas e tarefas atribuidas para o dia seguinte
  - Envia e-mail formatado via Resend (servico de e-mail)
- Configurar cron job (pg_cron) para executar as 20h diariamente
- Adicionar campo `email` na interface TeamMember e na pagina de equipe

**Observacao importante:** Para envio de e-mails, sera necessario configurar um servico de e-mail. Usaremos o Resend, que requer uma API key. Tambem sera necessario persistir os dados de equipe e escalas no banco de dados (atualmente estao apenas em memoria local). Esta migracao de dados pode ser feita em uma etapa futura, mas para o e-mail funcionar, os dados precisam estar no banco.

---

## Detalhes Tecnicos

### Banco de Dados - Novas Migracoes

1. **Tabela `user_passkeys`:**
   - id (uuid), user_id (uuid FK), credential_id (text), public_key (text), created_at
   - RLS: usuario so le/insere as proprias passkeys

2. **Tabela `transport_locations`:**
   - id (uuid), transport_id (text), driver_id (uuid), latitude (double precision), longitude (double precision), updated_at (timestamptz)
   - Realtime habilitado
   - RLS: autenticados podem ler, motorista pode inserir/atualizar

3. **Tabela `team_members`:** (para persistir dados da equipe no banco)
   - id (uuid), name (text), role (text), phone (text), email (text), color (text)
   - Necessaria para que a edge function de e-mail tenha acesso aos dados

4. **Tabela `team_schedules`:** (para persistir escalas)
   - id (uuid), member_id (uuid FK), date (date), start_time (time), end_time (time), note (text)

### Edge Functions

1. **`verify-passkey`** - Valida a assinatura WebAuthn e retorna um token de sessao
2. **`send-daily-agenda`** - Busca equipe + escalas + tarefas do dia seguinte, envia e-mail via Resend
3. **`update-location`** - Recebe lat/lng do motorista e atualiza a tabela (alternativa: usar o client Supabase diretamente)

### Arquivos Novos
- `src/components/BiometricSetup.tsx` - Dialog para cadastro de biometria
- `src/hooks/usePasskey.ts` - Hook para WebAuthn (registro e autenticacao)
- `src/components/LocationSharing.tsx` - Componente de compartilhamento de localizacao
- `supabase/functions/verify-passkey/index.ts`
- `supabase/functions/send-daily-agenda/index.ts`

### Arquivos Modificados
- `src/pages/LoginPage.tsx` - Botao "Entrar com biometria"
- `src/pages/TransportsPage.tsx` - Botao de localizacao em tempo real
- `src/pages/TeamPage.tsx` - Campo de e-mail no formulario de membro
- `src/store/useAppStore.ts` - Campo email em TeamMember

### Dependencias Externas
- **Resend API Key** - Necessaria para envio de e-mails. Sera solicitada ao usuario antes de implementar o envio.

### Ordem de Implementacao
1. Criar usuario admin fenasojalog@gmail.com no banco
2. Criar tabelas novas (user_passkeys, transport_locations, team_members, team_schedules)
3. Implementar biometria (WebAuthn) no login
4. Implementar localizacao em tempo real nos transportes
5. Solicitar API key do Resend e implementar envio de e-mail diario
6. Configurar cron job para disparo as 20h

