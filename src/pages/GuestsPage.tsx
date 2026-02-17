import { useAppStore, Guest } from '@/store/useAppStore';
import { Hotel, Plus, Pencil, Trash2, Phone, Mail, MapPin, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function GuestsPage() {
  const { guests, transports, addGuest, updateGuest, removeGuest } = useAppStore();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: '', hotel: '', roomNumber: '', checkinDate: '', checkinTime: '', checkoutDate: '', checkoutTime: '', notes: '', isVIP: false });

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [editForm, setEditForm] = useState({ ...form });

  const handleAdd = () => {
    if (!form.name) return;
    addGuest({
      id: `g${Date.now()}`,
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      role: form.role || undefined,
      hotel: form.hotel || undefined,
      roomNumber: form.roomNumber || undefined,
      checkinDate: form.checkinDate || undefined,
      checkinTime: form.checkinTime || undefined,
      checkoutDate: form.checkoutDate || undefined,
      checkoutTime: form.checkoutTime || undefined,
      notes: form.notes || undefined,
      isVIP: form.isVIP,
    });
    setForm({ name: '', phone: '', email: '', role: '', hotel: '', roomNumber: '', checkinDate: '', checkinTime: '', checkoutDate: '', checkoutTime: '', notes: '', isVIP: false });
    setAddOpen(false);
  };

  const openEdit = (g: Guest) => {
    setEditId(g.id);
    setEditForm({
      name: g.name, phone: g.phone || '', email: g.email || '', role: g.role || '',
      hotel: g.hotel || '', roomNumber: g.roomNumber || '',
      checkinDate: g.checkinDate || '', checkinTime: g.checkinTime || '',
      checkoutDate: g.checkoutDate || '', checkoutTime: g.checkoutTime || '',
      notes: g.notes || '', isVIP: g.isVIP || false,
    });
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editForm.name) return;
    updateGuest(editId, {
      name: editForm.name, phone: editForm.phone || undefined, email: editForm.email || undefined,
      role: editForm.role || undefined, hotel: editForm.hotel || undefined, roomNumber: editForm.roomNumber || undefined,
      checkinDate: editForm.checkinDate || undefined, checkinTime: editForm.checkinTime || undefined,
      checkoutDate: editForm.checkoutDate || undefined, checkoutTime: editForm.checkoutTime || undefined,
      notes: editForm.notes || undefined, isVIP: editForm.isVIP,
    });
    setEditOpen(false);
  };

  const GuestFormFields = ({ data, setData }: { data: typeof form; setData: (d: typeof form) => void }) => (
    <div className="space-y-3">
      <Input placeholder="Nome completo" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Celular / WhatsApp" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} />
        <Input placeholder="E-mail" type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
      </div>
      <Input placeholder="Cargo / Função profissional" value={data.role} onChange={(e) => setData({ ...data, role: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Hotel" value={data.hotel} onChange={(e) => setData({ ...data, hotel: e.target.value })} />
        <Input placeholder="Nº do quarto" value={data.roomNumber} onChange={(e) => setData({ ...data, roomNumber: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Check-in</label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={data.checkinDate} onChange={(e) => setData({ ...data, checkinDate: e.target.value })} />
            <Input type="time" value={data.checkinTime} onChange={(e) => setData({ ...data, checkinTime: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Check-out</label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={data.checkoutDate} onChange={(e) => setData({ ...data, checkoutDate: e.target.value })} />
            <Input type="time" value={data.checkoutTime} onChange={(e) => setData({ ...data, checkoutTime: e.target.value })} />
          </div>
        </div>
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
          <h1 className="text-2xl font-bold tracking-tight">Hóspedes</h1>
          <p className="text-sm text-muted-foreground mt-1">Hospedagem e traslados dos convidados</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Novo Hóspede
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cadastrar Hóspede</DialogTitle></DialogHeader>
          <GuestFormFields data={form} setData={setForm} />
          <Button onClick={handleAdd} className="w-full">Cadastrar</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Hóspede</DialogTitle></DialogHeader>
          <GuestFormFields data={editForm} setData={setEditForm} />
          <Button onClick={handleEdit} className="w-full">Salvar</Button>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {guests.map((g) => {
          const linkedTransports = transports.filter((t) =>
            t.guestName.toLowerCase().includes(g.name.toLowerCase().split(' ')[0])
          );
          return (
            <div key={g.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', g.isVIP ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary')}>
                    <Hotel className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      {g.isVIP && <AlertTriangle className="w-3 h-3 text-accent" />}
                      {g.name}
                    </p>
                    {g.role && <p className="text-xs text-muted-foreground">{g.role}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeGuest(g.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {g.hotel && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                  <Hotel className="w-3 h-3" /> {g.hotel} {g.roomNumber && `· Quarto ${g.roomNumber}`}
                </div>
              )}

              {(g.checkinDate || g.checkoutDate) && (
                <div className="text-xs text-muted-foreground mb-2 p-2 rounded-lg bg-muted/50">
                  {g.checkinDate && <p>Check-in: {new Date(g.checkinDate + 'T00:00').toLocaleDateString('pt-BR')} {g.checkinTime && `às ${g.checkinTime}`}</p>}
                  {g.checkoutDate && <p>Check-out: {new Date(g.checkoutDate + 'T00:00').toLocaleDateString('pt-BR')} {g.checkoutTime && `às ${g.checkoutTime}`}</p>}
                </div>
              )}

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                {g.phone && (
                  <a href={`https://wa.me/55${g.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-success">
                    <Phone className="w-2.5 h-2.5" /> {g.phone}
                  </a>
                )}
                {g.email && <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" /> {g.email}</span>}
              </div>

              {linkedTransports.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Transportes vinculados</p>
                  {linkedTransports.map((t) => (
                    <div key={t.id} className="text-xs text-muted-foreground flex items-center gap-1.5 py-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {t.from} → {t.to} · {new Date(t.dateTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
