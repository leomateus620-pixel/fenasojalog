

## Remover documento anexado do veículo DEFENDER 4X4

### Diagnóstico
O veículo **DEFENDER 4X4** (ID `7cfacb28-616f-4dde-9bd9-26682913006f`) tem um PDF anexado por engano no campo `documento_url`:
```
985888b8-155f-4bbe-b6b9-6bef2893d99b/7cfacb28-616f-4dde-9bd9-26682913006f/1776711108918.pdf
```
(bucket privado `vehicle-documents`).

### Solução

**1. Remover arquivo do storage** (`vehicle-documents`):
```
985888b8-155f-4bbe-b6b9-6bef2893d99b/7cfacb28-616f-4dde-9bd9-26682913006f/1776711108918.pdf
```

**2. Limpar referência no banco** via migração:
```sql
UPDATE vehicles
SET documento_url = NULL,
    updated_at = now()
WHERE id = '7cfacb28-616f-4dde-9bd9-26682913006f';
```

### Resultado esperado
- Card do DEFENDER 4X4 deixa de exibir o bloco "Documento do Veículo" com o PDF.
- Aparecerá novamente a opção de anexar um documento limpo.
- Nenhuma alteração de código é necessária.

### Arquivos
| Tipo | Detalhe |
|---|---|
| Storage delete | `vehicle-documents/985888b8.../7cfacb28.../1776711108918.pdf` |
| Migração SQL | `UPDATE vehicles SET documento_url = NULL` para o ID acima |

