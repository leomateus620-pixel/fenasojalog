import { useAppStore, TransportStatus, Transport } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, Plus, Check, Clock, X, Phone, Mail, Pencil, Briefcase, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const statusConfig: Record<TransportStatus, { label: string; icon: typeof Check; class: string }> = {
  scheduled: { label: 'Agendado', icon: Clock, class: 'bg-info/10 text-info' },
  in_progress: { label: 'Em andamento', icon: MapPin, class: 'bg-accent/10 text-accent' },
  completed: { label: 'Concluído', icon: Check, class: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelado', icon: X, class: 'bg-destructive/10 text-destructive' },
};

export default function TransportsPage() {
  const { transports, team, vehicles, addTransport, updateTransport } = useAppStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ guestName: '', guestPhone: '', guestEmail: '', guestRole: '', guestAgenda: '', from: '', to: '', dateTime: '', vehicleId: '', driverId: '', isVIP: false, notes: '' });

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [editForm, setEditForm] = useState({ guestName: '', guestPhone: '', guestEmail: '', guestRole: '', guestAgenda: '', from: '', to: '', dateTime: '', vehicleId: '', driverId: '', isVIP: false, notes: '', status: 'scheduled' as TransportStatus });

  const openEdit = (t: Transport) => {
    setEditId(t.id);
    setEditForm({
      guestName: t.guestName, guestPhone: t.guestPhone || '', guestEmail: t.guestEmail || '',
      guestRole: t.guestRole || '', guestAgenda: t.guestAgenda || '',
      from: t.from, to: t.to, dateTime: t.dateTime,
      vehicleId: t.vehicleId || '', driverId: t.driverId || '',
      isVIP: t.isVIP || false, notes: t.notes || '', status: t.status,
    });
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (!editForm.guestName || !editForm.from || !editForm.to) return;
    updateTransport(editId, {
      guestName: editForm.guestName, guestPhone: editForm.guestPhone || undefined,
      guestEmail: editForm.guestEmail || undefined, guestRole: editForm.guestRole || undefined,
      guestAgenda: editForm.guestAgenda || undefined,
      from: editForm.from, to: editForm.to, dateTime: editForm.dateTime,
      vehicleId: editForm.vehicleId || undefined, driverId: editForm.driverId || undefined,
      isVIP: editForm.isVIP, notes: editForm.notes || undefined, status: editForm.status,
    });
    setEditOpen(false);
  };

  const handleAdd = () => {
    if (!form.guestName || !form.from || !form.to || !form.dateTime) return;
    addTransport({
      id: `t${Date.now()}`, ...form, status: 'scheduled',
      vehicleId: form.vehicleId || undefined, driverId: form.driverId || undefined,
      guestPhone: form.guestPhone || undefined, guestEmail: form.guestEmail || undefined,
      guestRole: form.guestRole || undefined, guestAgenda: form.guestAgenda || undefined,
      notes: form.notes || undefined,
    });
    setForm({ guestName: '', guestPhone: '', guestEmail: '', guestRole: '', guestAgenda: '', from: '', to: '', dateTime: '', vehicleId: '', driverId: '', isVIP: false, notes: '' });
    setOpen(false);
  };

  const cycleStatus = (id: string, current: TransportStatus) => {
    const order: TransportStatus[] = ['scheduled', 'in_progress', 'completed'];
    const idx = order.indexOf(current);
    if (idx < order.length - 1) updateTransport(id, { status: order[idx + 1] });
  };

  const sorted = [...transports].sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  const TransportFormFields = ({ data, setData }: { data: typeof form; setData: (d: typeof form) => void }) => (
    <div className="space-y-3">
      <Input placeholder="Nome do passageiro" value={data.guestName} onChange={(e) => setData({ ...data, guestName: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Celular / WhatsApp" value={data.guestPhone} onChange={(e) => setData({ ...data, guestPhone: e.target.value })} />
        <Input placeholder="E-mail" type="email" value={data.guestEmail} onChange={(e) => setData({ ...data, guestEmail: e.target.value })} />
      </div>
      <Input placeholder="Cargo / Função profissional" value={data.guestRole} onChange={(e) => setData({ ...data, guestRole: e.target.value })} />
      <Textarea placeholder="Agenda do passageiro no evento (compromissos, horários...)" value={data.guestAgenda} onChange={(e) => setData({ ...data, guestAgenda: e.target.value })} className="min-h-[60px]" />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Origem" value={data.from} onChange={(e) => setData({ ...data, from: e.target.value })} />
        <Input placeholder="Destino" value={data.to} onChange={(e) => setData({ ...data, to: e.target.value })} />
      </div>
      <Input type="datetime-local" value={data.dateTime} onChange={(e) => setData({ ...data, dateTime: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Select value={data.vehicleId} onValueChange={(v) => setData({ ...data, vehicleId: v })}>
          <SelectTrigger><SelectValue placeholder="Veículo" /></SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={data.driverId} onValueChange={(v) => setData({ ...data, driverId: v })}>
          <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            {team.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name} - {m.role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input placeholder="Observações" value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={data.isVIP} onChange={(e) => setData({ ...data, isVIP: e.target.checked })} className="rounded" />
        Convidado VIP
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transportes</h1>
          <p className="text-sm text-muted-foreground mt-1">Buscar e levar convidados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Transporte</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Agendar Transporte</DialogTitle></DialogHeader>
            <TransportFormFields data={form} setData={setForm} />
            <Button onClick={handleAdd} className="w-full">Agendar</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Transporte</DialogTitle></DialogHeader>
          <TransportFormFields data={editForm} setData={(d) => setEditForm({ ...d, status: editForm.status })} />
          <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as TransportStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleEditSave} className="w-full">Salvar</Button>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {sorted.map((t) => {
          const sc = statusConfig[t.status];
          const Icon = sc.icon;
          const driver = team.find((m) => m.id === t.driverId);
          const vehicle = vehicles.find((v) => v.id === t.vehicleId);
          const dt = new Date(t.dateTime);

          return (
            <div key={t.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', sc.class)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {t.isVIP && <AlertTriangle className="w-3.5 h-3.5 text-accent shrink-0" />}
                    <p className="text-sm font-semibold truncate">{t.guestName}</p>
                    {t.guestRole && <Badge variant="secondary" className="text-[10px] shrink-0">{t.guestRole}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.from} → {t.to}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                    {vehicle && <span>🚗 {vehicle.name}</span>}
                    {driver && <span>👤 {driver.name.split(' ')[0]}</span>}
                    {t.guestPhone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{t.guestPhone}</span>}
                    {t.guestEmail && <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" />{t.guestEmail}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono font-medium">{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[10px] text-muted-foreground">{dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                </div>
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {t.status !== 'completed' && t.status !== 'cancelled' && (
                  <button onClick={() => cycleStatus(t.id, t.status)} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors shrink-0">
                    {t.status === 'scheduled' ? 'Iniciar' : 'Concluir'}
                  </button>
                )}
                {t.status === 'completed' && <Badge variant="secondary" className="shrink-0">✓</Badge>}
              </div>
              {t.guestAgenda && (
                <div className="mt-2 ml-14 text-xs text-muted-foreground p-2 rounded-lg bg-muted/50 flex items-start gap-1.5">
                  <CalendarDays className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{t.guestAgenda}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
