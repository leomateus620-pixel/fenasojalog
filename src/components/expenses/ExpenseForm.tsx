import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useVehicles } from '@/hooks/useVehicles';
import { useTransports } from '@/hooks/useTransports';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseFormProps {
  onSubmit: (data: Record<string, any>, file?: File) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Record<string, any>;
}

const paymentMethods = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'pix', label: 'Pix' },
  { value: 'outro', label: 'Outro' },
];

const pixKeyTypes = [
  { value: 'cpf', label: 'CPF' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'aleatoria', label: 'Chave Aleatória' },
];

export default function ExpenseForm({ onSubmit, isSubmitting, initialData }: ExpenseFormProps) {
  const { categories } = useExpenseCategories();
  const { vehicles } = useVehicles();
  const { transports } = useTransports();
  const { members } = useOrgMembers();

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    expense_date: initialData?.expense_date
      ? new Date(initialData.expense_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    category_id: initialData?.category_id || '',
    payment_method: initialData?.payment_method || 'dinheiro',
    transport_id: initialData?.transport_id || '',
    vehicle_id: initialData?.vehicle_id || '',
    member_user_id: initialData?.member_user_id || '',
    paid_by_name: initialData?.paid_by_name || '',
    paid_by_user_id: initialData?.paid_by_user_id || '',
    pix_key: initialData?.pix_key || '',
    pix_key_type: initialData?.pix_key_type || '',
  });

  const [file, setFile] = useState<File | null>(null);

  const selectedCategory = categories.find((c: any) => c.id === form.category_id);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMemberSelect = (userId: string) => {
    const member = members.find((m: any) => m.user_id === userId);
    setForm(prev => ({
      ...prev,
      paid_by_user_id: userId,
      paid_by_name: member?.nome_exibicao || '',
      member_user_id: userId,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Informe o título da despesa');
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Informe um valor válido');
    if (!form.category_id) return toast.error('Selecione a categoria');

    const payload: Record<string, any> = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      amount: Number(form.amount),
      expense_date: new Date(form.expense_date).toISOString(),
      category_id: form.category_id,
      payment_method: form.payment_method,
      paid_by_name: form.paid_by_name || null,
      paid_by_user_id: form.paid_by_user_id || null,
      member_user_id: form.member_user_id || null,
      transport_id: form.transport_id || null,
      vehicle_id: form.vehicle_id || null,
      pix_key: form.pix_key || null,
      pix_key_type: form.pix_key_type || null,
      status: file ? 'pendente_validacao' : 'pendente_comprovante',
    };

    await onSubmit(payload, file || undefined);
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Título *</Label>
        <Input
          value={form.title}
          onChange={e => handleChange('title', e.target.value)}
          placeholder="Ex: Almoço equipe logística"
        />
      </div>

      {/* Category + Amount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Categoria *</Label>
          <Select value={form.category_id} onValueChange={v => handleChange('category_id', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Valor (R$) *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={e => handleChange('amount', e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Date + Payment */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Data/Hora</Label>
          <Input
            type="datetime-local"
            value={form.expense_date}
            onChange={e => handleChange('expense_date', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Forma de pagamento</Label>
          <Select value={form.payment_method} onValueChange={v => handleChange('payment_method', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {paymentMethods.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Descrição</Label>
        <Textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          placeholder="Detalhes da despesa..."
          rows={2}
        />
      </div>

      {/* Context: Transport, Vehicle */}
      <div className="grid grid-cols-2 gap-3">
        {(selectedCategory?.requires_transport || !selectedCategory) && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Transporte</Label>
            <Select value={form.transport_id} onValueChange={v => handleChange('transport_id', v)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {transports.filter((t: any) => t.status !== 'cancelado').slice(0, 20).map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.titulo || `${t.origem} → ${t.destino}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {(selectedCategory?.requires_vehicle || !selectedCategory) && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Veículo</Label>
            <Select value={form.vehicle_id} onValueChange={v => handleChange('vehicle_id', v)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.placa} — {v.modelo || v.marca || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Who paid */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Quem pagou</Label>
        <Select value={form.paid_by_user_id} onValueChange={handleMemberSelect}>
          <SelectTrigger><SelectValue placeholder="Selecione o membro" /></SelectTrigger>
          <SelectContent>
            {members.filter((m: any) => m.is_active).map((m: any) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.nome_exibicao || 'Membro'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pix info (when someone paid) */}
      {form.paid_by_user_id && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tipo chave Pix</Label>
            <Select value={form.pix_key_type} onValueChange={v => handleChange('pix_key_type', v)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                {pixKeyTypes.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Chave Pix</Label>
            <Input
              value={form.pix_key}
              onChange={e => handleChange('pix_key', e.target.value)}
              placeholder="Chave para ressarcimento"
            />
          </div>
        </div>
      )}

      {/* File upload */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Comprovante / Nota</Label>
        <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border/60 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {file ? file.name : 'Toque para anexar foto ou PDF'}
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Salvar Despesa
      </Button>
    </div>
  );
}
