## Análise das inconsistências encontradas

### 1. Os 3 números de KM no sistema — explicação

Após auditoria nas tabelas `vehicles`, `transports` e `fuel_records`:

| Valor | Origem | Como é calculado | Status |
|---|---|---|---|
| **5.811 km** | Dashboard / Odômetro | Soma de `km_final_evento − km_inicial_evento` dos 5 veículos com odômetro registrado (Amarok 3.039 + T-Cross IZT7H43 1.051 + T-Cross TQX7C18 1.168 + UP IZH9J56 282 + UP IXU8B21 271) | ✅ **Oficial — KM real rodado** |
| **5.180 km** | Relatório por veículo (Botolli) | Provável agrupamento por concessionária/marca incluindo estimativas | ⚠️ Intermediário, descartar |
| **4.410 km** (PDF anterior mostrou 4.520) | Soma `distancia_estimada_km` dos 32 transportes | Estimativa Google Maps por viagem registrada, exclui rodagem urbana não cadastrada | ⚠️ Subestimado |

**Conclusão:** O número correto e oficial é **5.811 km** (odômetro físico). A diferença de **1.401 km** entre odômetro e transportes registrados corresponde a **deslocamentos urbanos / suporte operacional não cadastrados como viagem formal** — será apresentado como linha "Uso urbano e operacional" no relatório.

### 2. Combustível — valor correto

Soma real de **todos os 15 abastecimentos** da frota (incluindo Defender 4x4 desde 20/04):

```
R$ 3.337,06   (462,60 litros)
```

O PDF anterior mostrou R$ 2.929,50 porque filtrava apenas 28/04→10/05, excluindo 3 abastecimentos do Defender de 20, 23 e 27/04 que somam R$ 407,56. Ajuste: incluir todos os abastecimentos da operação.
(Valor mencionado pelo usuário R$ 3.377,06 = pequeno erro de digitação; valor real é R$ 3.337,06.)

### 3. Equipe — apenas Logística

Filtrar apenas os 9 integrantes da comissão **LOGÍSTICA, HOTELARIA E TURISMO** (role admin):

1. EDUARDO SANTOS — Presidente Comissão
2. LEONARDO MATEUS STROSCHEIN
3. LUCAS FRANKEN
4. LUIS FERNANDO FURLANETTO
5. MARCELO DE BAIRROS
6. MICAEL ARCANJO BÖCK
7. RICARDO CARPENEDO CAETANO
8. RICARDO EMILIO ZIMMERMANN
9. VLADIMIR ANTÔNIO MADALOSSO DA ROSA

### 4. Outras inconsistências detectadas (serão sinalizadas no PDF)

- 2 transportes urbanos (`Trecho urbano — Santa Rosa`) sem `distancia_estimada_km`
- 2 transportes "Outros" sem KM (em 09/05)
- 1 transporte sem veículo associado (30/04 20:42)
- 1 abastecimento da Amarok com `valor=NULL` (01/05, 31,88 L)
- Veículos sem odômetro: **Defender 4x4** e **Saveiro TQW2A80** (KM estimado por consumo de combustível: Defender ~480 km via 71,87L, Saveiro 0)

## Conteúdo do novo PDF (versão corrigida v2)

1. **Capa institucional** — Fenasoja 2026, comissão Logística, período 28/04–10/05
2. **Resumo Executivo** com números corretos:
   - KM oficial: **5.811 km** (odômetro)
   - Combustível: **R$ 3.337,06** / 462,60 L
   - Custo médio: R$ 0,57/km
   - Transportes: 32 concluídos
   - Hóspedes, carrinhos elétricos, patinetes (mantidos)
3. **Auditoria de KM** — tabela das 3 fontes explicando a divergência
4. **KM por veículo** (Amarok líder com 3.039 km / R$ 755,64)
5. **Combustível detalhado** — 15 abastecimentos, todos os veículos incluindo Defender
6. **Transportes** — gráfico por dia + ranking destinos
7. **Hóspedes** transportados
8. **Carrinhos elétricos & Patinetes** (já corretos)
9. **Equipe de Logística** — apenas os 9 membros
10. **Inconsistências detectadas** (lista acima)
11. **Nota metodológica** explicando hierarquia de fontes

Arquivo: `/mnt/documents/Relatorio_Geral_Operacao_Logistica_Fenasoja_2026_v2.pdf`

---

Posso prosseguir e gerar o PDF v2 com essas correções?