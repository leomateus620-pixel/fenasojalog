

## Remover "QR Gratuito" do módulo Mobilidade

### Diagnóstico
A funcionalidade "QR Gratuito" aparece em 6 pontos da UI dos menus **Mobilidade**, **Patinetes** e **Carrinhos Elétricos**. Vamos retirar todas as menções visuais e exportadas, mantendo a coluna `qr_access_free` no banco intacta (sem migração destrutiva — preserva histórico e evita risco a registros existentes).

### Mudanças

**1. `src/components/mobility/MobilityAdminPanel.tsx`** (Painel principal)
- Remover o `StatCard` "QR Gratuito" (o card destacado no print)
- Reduzir grid de stats de 5 para 4 colunas (`grid-cols-2 md:grid-cols-4`)
- Remover ícone `QrCode` ao lado do nome na tabela
- Remover coluna "QR Gratuito" do CSV exportado
- Limpar import `QrCode` do lucide-react e o cálculo `stats.qr`

**2. `src/components/mobility/AuthorizationsTab.tsx`** (abas Autorizados em Patinetes e Carrinhos)
- Remover coluna "QR" da tabela (header + célula com Badge)
- Resultado: tabela vai de 7 para 6 colunas

**3. `src/components/mobility/EditMemberDialog.tsx`** (Dialog de edição)
- Remover checkbox "QR Gratuito" do bloco de modais
- Remover state `qrAccessFree` / `setQrAccessFree`
- Remover do payload de `updateMember` (envia sempre `false` por compatibilidade ou omite)

**4. `src/components/mobility/MobilityForm.tsx`** (formulário público de solicitação)
- Remover `qr_access_free` do `emptyMember()` e do payload submetido

**5. `src/components/mobility/MobilityMemberRow.tsx`** (linha do form público)
- Remover checkbox "QR Gratuito" e a prop relacionada

**6. `src/lib/generateMobilityAuthorizationsExport.ts`** (exportações)
- **CSV:** remover coluna "QR Gratuito" do header e da linha
- **PDF:** remover métrica "QR Gratuito" do bloco de stats da capa, remover coluna "QR Grátis" da tabela de resumo por comissão, remover coluna "QR" das tabelas detalhadas
- Remover cálculo `totalQrFree` e o acumulador `qrFree` por comissão

**7. `src/hooks/useMobilityMembers.ts`** (tipagem)
- Manter `qr_access_free` opcional na interface (compatibilidade com banco) mas não exigir no payload

### Banco de dados
**Sem migração.** A coluna `qr_access_free` permanece em `committee_mobility_members` e `mobility_authorizations` com `DEFAULT false`, garantindo que novos registros não dependam mais desse dado. Se no futuro for necessário remover de vez, fazemos numa migração separada.

### Critério de aceite
1. Card "QR GRATUITO" sumiu do Painel de Mobilidade (grid agora com 4 cards)
2. Coluna/badge "QR" não aparece mais nas abas Autorizados de Patinetes nem de Carrinhos Elétricos
3. Checkbox "QR Gratuito" sumiu do formulário público e do dialog de edição
4. CSV e PDF exportados não contêm mais nenhuma menção a "QR Gratuito"
5. Sem regressão em criar/editar/aprovar solicitações
6. Ícone `QrCode` removido dos imports não utilizados

### Arquivos
| Arquivo | Mudança |
|---|---|
| `src/components/mobility/MobilityAdminPanel.tsx` | Remove StatCard, ícone na tabela, coluna do CSV |
| `src/components/mobility/AuthorizationsTab.tsx` | Remove coluna QR da tabela |
| `src/components/mobility/EditMemberDialog.tsx` | Remove checkbox e state |
| `src/components/mobility/MobilityForm.tsx` | Remove campo do payload |
| `src/components/mobility/MobilityMemberRow.tsx` | Remove checkbox |
| `src/lib/generateMobilityAuthorizationsExport.ts` | Remove colunas/métricas QR de CSV e PDF |

