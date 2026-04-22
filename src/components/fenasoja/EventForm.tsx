import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useFenasojaEvents, FENASOJA_RANGE } from '@/hooks/useFenasojaEvents';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { useCommissions } from '@/hooks/useCommissions';
import { toast } from 'sonner';
import { getDateSP, utcToSPLocal, ensureSPOffset } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: any | null;
}

const empty = {
  titulo: '',
  descricao: '',
  inicio_em: '',
  fim_em: '',
  local: '',
  tipo_tag: '',
  responsavel_user_id: 'none',
  commission_id: 'none',
  repetir_diariamente: false,
};

function isInRange(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = getDateSP(dateStr.length === 16 ? dateStr + ':00-03:00' : dateStr);
  return d >= FENASOJA_RANGE.start && d <= FENASOJA_RANGE.end;
}

export default function EventForm({ open, onOpenChange, editing }: EventFormProps) {
  const { create, update } = useFenasojaEvents();
  const { members } = useOrgMembers();
  const { commissions } = useCommissions();

  const [form, setForm] = useState(() => {
    if (editing) {
      return {
        titulo: editing.titulo || '',
        descricao: editing.descricao || '',
        inicio_em: editing.inicio_em ? editing.inicio_em.slice(0, 16) : '',
        fim_em: editing.fim_em ? editing.fim_em.slice(0, 16) : '',
        local: editing.local || '',
        tipo_tag: editing.tipo_tag || '',
        responsavel_user_id: editing.responsavel_user_id || 'none',
        commission_id: editing.commission_id || 'none',
        repetir_diariamente: false,
      };
    }
    return empty;
  });

  const isSubmitting = create.isPending || update.isPending;

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast.error('Informe o título do evento');
      return;
    }
    if (!form.inicio_em || !form.fim_em) {
      toast.error('Defina início e fim');
      return;
    }
    if (!isInRange(form.inicio_em) || !isInRange(form.fim_em)) {
      toast.error('Datas devem estar entre 01/05/2026 e 10/05/2026');
      return;
    }

    const payload = {
      titulo: form.titulo.toUpperCase(),
      descricao: form.descricao || null,
      inicio_em: form.inicio_em,
      fim_em: form.fim_em,
      local: form.local || null,
      tipo_tag: form.tipo_tag || null,
      responsavel_user_id: form.responsavel_user_id !== 'none' ? form.responsavel_user_id : null,
      commission_id: form.commission_id !== 'none' ? form.commission_id : null,
    };

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast.success('Evento atualizado');
      } else if (form.repetir_diariamente) {
        const start = new Date(form.inicio_em);
        const end = new Date(form.fim_em);
        const diffMs = end.getTime() - start.getTime();
        const lastDay = new Date('2026-05-10T23:59:00');
        let count = 0;
        for (let i = 0; ; i++) {
          const newStart = new Date(start.getTime() + i * 86400000);
          if (newStart > lastDay) break;
          const newEnd = new Date(newStart.getTime() + diffMs);
          await create.mutateAsync({
            ...payload,
            inicio_em: newStart.toISOString().slice(0, 16),
            fim_em: newEnd.toISOString().slice(0, 16),
          });
          count++;
        }
        toast.success(`${count} eventos criados`);
      } else {
        await create.mutateAsync(payload);
        toast.success('Evento criado');
      }
      onOpenChange(false);
      setForm(empty);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            {editing ? 'Editar Evento Fenasoja' : 'Novo Evento Fenasoja'}
          </DialogTitle>
          <DialogDescription>
            Programação institucional · 01/05 a 10/05/2026
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="EX: ABERTURA OFICIAL FENASOJA"
              className="uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao">Observações</Label>
            <Textarea
              id="descricao"
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Detalhes, autoridades, contatos…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Início *</Label>
              <DateTimePicker
                value={form.inicio_em}
                onChange={(v) => setForm({ ...form, inicio_em: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fim *</Label>
              <DateTimePicker
                value={form.fim_em}
                onChange={(v) => setForm({ ...form, fim_em: v })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="local">Local</Label>
            <Input
              id="local"
              value={form.local}
              onChange={(e) => setForm({ ...form, local: e.target.value })}
              placeholder="Ex: Etnia Italiana — Parque de Exposições"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Comissão</Label>
              <Select value={form.commission_id} onValueChange={(v) => setForm({ ...form, commission_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {commissions.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Select value={form.responsavel_user_id} onValueChange={(v) => setForm({ ...form, responsavel_user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguém</SelectItem>
                  {members.map((m: any) => (
                    <SelectItem key={m.user_id} value={m.user_id}>{m.nome_exibicao}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tipo_tag">Categoria/Tag</Label>
            <Input
              id="tipo_tag"
              value={form.tipo_tag}
              onChange={(e) => setForm({ ...form, tipo_tag: e.target.value })}
              placeholder="institucional, cerimônia, palestra…"
            />
          </div>

          {!editing && (
            <div className="flex items-center justify-between rounded-xl border border-gold/20 bg-gold/5 px-3 py-2.5">
              <div>
                <Label htmlFor="repetir" className="text-sm font-medium">Repetir diariamente</Label>
                <p className="text-[11px] text-muted-foreground">Cria cópias até 10/05/2026</p>
              </div>
              <Switch
                id="repetir"
                checked={form.repetir_diariamente}
                onCheckedChange={(checked) => setForm({ ...form, repetir_diariamente: checked })}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar evento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
