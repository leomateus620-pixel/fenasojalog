

## Diagnóstico: PDF da Rede Hoteleira "sumindo"

### Onde fica o PDF
O Dashboard tem o card **"Rede Hoteleira"** (linha 263 em `src/pages/Dashboard.tsx`) que abre o arquivo estático:
```tsx
onClick={() => window.open('/docs/rede-hoteleira.pdf', '_blank')}
```

O arquivo vive em `public/docs/rede-hoteleira.pdf` (181 KB, presente no momento).

### Por que "some" do sistema
Arquivos colocados em `public/` são **estáticos do bundle do app**, não são armazenados em banco/storage. Toda vez que o PDF é "atualizado", ele substitui o anterior no bundle. Possíveis causas do desaparecimento percebido:

1. **Cache do navegador / Service Worker** — o `public/sw.js` faz cache do app shell. Quando o PDF é trocado mantendo o mesmo nome (`rede-hoteleira.pdf`), o SW pode continuar servindo a versão antiga em cache (ou falhar se o cache foi invalidado).
2. **Reverts de versão** — se o projeto foi restaurado para uma versão anterior, o arquivo na pasta `public/docs/` foi sobrescrito pelo PDF antigo daquela versão.
3. **Não há armazenamento persistente fora do bundle**: o PDF não está em Lovable Cloud Storage, então qualquer rebuild substitui o arquivo pelo que estiver no repositório.

### Solução

**1. Substituir o PDF estático**
Copiar o novo arquivo enviado (`user-uploads://Rede_Hoteleira_5-3.pdf`) sobre `public/docs/rede-hoteleira.pdf`.

**2. Forçar invalidação do cache** (resolve "sumiço" futuro)
Alterar o link no Dashboard para incluir um query string com a versão do arquivo, evitando cache do SW/navegador:
```tsx
onClick={() => window.open('/docs/rede-hoteleira.pdf?v=2026-04-20', '_blank')}
```
Sempre que o PDF for atualizado, basta bumpar o `v=` para forçar re-fetch.

**3. (Opcional, recomendado) Migrar para Cloud Storage no futuro**
Para evitar que o arquivo dependa de rebuilds/restores, criar um bucket público `public-docs` e fazer upload do PDF lá. Aí o link aponta para a URL pública do bucket e o arquivo persiste independente do código. **Não incluído nesta entrega** — apenas recomendação para o futuro.

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `public/docs/rede-hoteleira.pdf` | Substituído pelo novo PDF enviado |
| `src/pages/Dashboard.tsx` | Adicionar `?v=YYYY-MM-DD` ao URL para cache busting |

### Critério de aceite
1. Clicar no card "Rede Hoteleira" no Dashboard abre o **novo PDF** (com as informações atualizadas).
2. Após nova atualização, basta trocar o arquivo + bumpar o `?v=` para o usuário ver imediatamente.

