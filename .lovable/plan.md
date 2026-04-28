## Diagnóstico

Os documentos PDF dos veículos retornam **"Object not found"** porque há dois problemas sobrepostos:

1. **Valores legados no banco**: a coluna `vehicles.documento_url` contém URLs **públicas completas** no formato:
   ```
   https://fidagsspejekripwkczr.supabase.co/storage/v1/object/public/vehicle-documents/<org>/<vehicle>/<arquivo>.pdf
   ```
   Mas o bucket `vehicle-documents` é **privado** (Is Public: No). Essas URLs públicas sempre falham com "Object not found".

2. **Função `getDocumentUrl` (em `src/hooks/useVehicles.ts`)** repassa o valor cru de `documento_url` direto para `supabase.storage.from('vehicle-documents').createSignedUrl(storagePath, 3600)`. Quando o valor é uma URL completa (não um caminho), o Supabase tenta procurar um objeto chamado literalmente `"https://..."` e devolve "Object not found".

Ou seja: mesmo arquivos que existem no bucket não conseguem ser abertos porque nunca convertemos a URL completa de volta no caminho `<org>/<vehicle>/<arquivo>.pdf`.

Já existe esse mesmo padrão de extração funcionando bem em `src/components/expenses/ExpenseDocumentPreview.tsx` (`extractPath`).

## Correção proposta

### 1. `src/hooks/useVehicles.ts` — robustecer `getDocumentUrl`

- Adicionar helper `extractVehicleDocPath(stored)` que aceita:
  - Caminho puro (`<org>/<id>/<arquivo>.pdf`) → usa direto.
  - URL pública (`/object/public/vehicle-documents/<path>`) → extrai o `<path>`.
  - URL assinada (`/object/sign/vehicle-documents/<path>?token=...`) → extrai o `<path>`.
- Gerar a URL assinada (1h) a partir do caminho extraído.
- Se o `createSignedUrl` falhar (objeto inexistente de verdade), lançar erro amigável: *"Documento não encontrado no storage. Faça o upload novamente."*

### 2. `src/hooks/useVehicles.ts` — padronizar gravação em `uploadDocument`

- Continuar gravando **somente o caminho** (`<org>/<vehicle>/<timestamp>.<ext>`), como já faz hoje. Nada muda aqui, só fica documentado que o padrão correto é caminho puro.

### 3. `src/pages/VehiclesPage.tsx` — abrir/baixar com fallback

- Manter o botão **"Ver documento PDF"** chamando `getDocumentUrl` (agora corrigido) e abrindo em nova aba.
- Adicionar um pequeno botão **"Baixar"** ao lado, que usa o mesmo signed URL com `download` no anchor para forçar download (útil em mobile/desktop).
- Em caso de erro, exibir o toast amigável retornado pelo hook.

### 4. (Opcional, recomendado) Migração de dados

Há 5 registros com `documento_url` armazenado como URL pública completa. Para limpar a base e evitar dependência da extração no client, criar uma migração SQL que reescreve esses valores para o caminho puro:

```sql
UPDATE public.vehicles
SET documento_url = regexp_replace(
  documento_url,
  '^https?://[^/]+/storage/v1/object/(?:public|sign|authenticated)/vehicle-documents/',
  ''
)
WHERE documento_url ~ '^https?://.*/vehicle-documents/';

-- Remove querystring residual de signed URLs antigas, se houver
UPDATE public.vehicles
SET documento_url = split_part(documento_url, '?', 1)
WHERE documento_url LIKE '%?%';
```

Mesmo após a migração, a extração no client é mantida como blindagem para qualquer registro futuro que entre fora do padrão.

## Arquivos a alterar

- `src/hooks/useVehicles.ts` — helper `extractVehicleDocPath`, `getDocumentUrl` resiliente, mensagens de erro amigáveis.
- `src/pages/VehiclesPage.tsx` — botão **Baixar** ao lado de **Ver documento PDF**, ambos usando o signed URL corrigido.
- Nova migração SQL — normaliza `documento_url` dos 5 registros legados para caminho puro.

## Validação

1. Abrir `/vehicles`, escolher um veículo com documento legado (ex.: TQZ8B35) → "Ver documento PDF" abre o PDF; "Baixar" salva o arquivo.
2. Substituir o documento de um veículo → o novo registro grava caminho puro; abrir/baixar continuam funcionando.
3. Subir um documento em um veículo sem PDF → mesmo fluxo funciona.
4. Forçar um caminho inválido → toast amigável "Documento não encontrado no storage. Faça o upload novamente."
