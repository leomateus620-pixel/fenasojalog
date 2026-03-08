

## Plano: Adicionar informações de Hotel, Voo, Motorista, Veículo e Hóspede no card de transporte

### Problema
Ao implementar a Dynamic Island, as informações detalhadas que antes apareciam no card (hotel, voo, veículo, motorista, hóspede) foram removidas. Elas precisam voltar ao card principal, abaixo da Dynamic Island.

### Mudanças em `src/pages/TransportsPage.tsx`

Adicionar uma seção de **info chips/badges** entre a Dynamic Island (linha 1006) e os Actions (linha 1007), contendo:

1. **Motorista** — se `driver` existir, mostrar nome com ícone 👤
2. **Veículo** — se `vehicle` existir, mostrar placa + modelo com ícone 🚙
3. **Hóspede + Hotel** — se `guest` existir, mostrar nome e `hotel_nome` com ícone 🏨
4. **Info do Voo** (se `titulo === 'Aeroporto'`) — mostrar `voo_cidade`, `voo_numero` com ícone ✈️
5. **KM Retirada** — se `km_retirada` existir
6. **Observações** — se `t.observacoes` existir, texto truncado

Layout: chips compactos em `flex flex-wrap gap-1.5`, estilo `bg-muted/40 text-muted-foreground text-[11px] px-2 py-1 rounded-full`, consistente com o visual Liquid Glass do card.

### Resultado
- Todas as informações essenciais visíveis no card sem precisar expandir a Dynamic Island ou abrir detalhes
- Layout compacto com chips que não ocupam espaço excessivo
- Consistente com o padrão visual existente

