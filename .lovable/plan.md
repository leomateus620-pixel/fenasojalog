

# Substituir "Check-in" por "Horário do Voo" — Labels de Voo

## Escopo

Alterar APENAS os labels visuais relacionados a voo (`voo_checkin`). Os labels de check-in/check-out de hóspedes (`checkin_em`, `checkout_em`) permanecem inalterados.

## Alterações por arquivo

### 1. `src/components/transport/TransportForm.tsx`
- Linha 330: `"Check-in"` → `"Horário do Voo"`
- Linha 383: `"Check-in Voo"` → `"Horário do Voo"`

### 2. `src/components/transport/TransportDetailView.tsx`
- Linha 209: `"Check-in"` → `"Horário do Voo"`

### 3. `src/components/transport/TransportCard.tsx`
- Linha 80: `'Check-in'` → `'Horário Voo'`

### 4. `src/pages/Dashboard.tsx`
- Linha 370: `'Check'` → `'Voo'`
- Linha 410: `"Check"` → `"Voo"`
- Linha 441: `"Check"` → `"Voo"`

### 5. `src/pages/TransportsPage.tsx`
- Linha 783 (PDF template): `"Check-in:"` → `"Horário do Voo:"`

## Não alterar
- `src/pages/GuestsPage.tsx` — "Check-in" e "Check-out" de hóspedes (hotel) ficam como estão
- Nenhum campo de dados (`voo_checkin`) é renomeado — apenas labels de UI
- Nenhuma lógica de cálculo (`isCheckin`, `CHECKIN_BUFFER_MIN`, etc.) é alterada

