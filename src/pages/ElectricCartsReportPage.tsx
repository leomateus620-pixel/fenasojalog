import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileDown, Search, Clock, Building2, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCartUsageReport, type ReportPeriod } from '@/hooks/useCartUsageReport';
import { useElectricCarts } from '@/hooks/useElectricCarts';
import { generateCartUsagePdf } from '@/lib/generateCartUsagePdf';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  all: 'Todo o período',
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(min: number | null): string {
  if (min == null) return 'Em aberto';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function ElectricCartsReportPage() {
  const [period, setPeriod] = useState<ReportPeriod>('7d');
  const [cartFilter, setCartFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [openOnly, setOpenOnly] = useState(false);

  const { data: sessions = [], isLoading } = useCartUsageReport(period);
  const { carts } = useElectricCarts();

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return sessions.filter((x) => {
      if (cartFilter !== 'all' && x.cart_id !== cartFilter) return false;
      if (openOnly && !x.is_open) return false;
      if (!s) return true;
      const target = `${x.responsavel_nome || ''} ${x.empresa_nome || ''} ${x.cart_codigo} ${x.cart_nome || ''} ${x.comissao || ''}`.toLowerCase();
      return target.includes(s);
    });
  }, [sessions, search, cartFilter, openOnly]);

  const stats = useMemo(() => {
    const totalMin = filtered.reduce((acc, s) => acc + (s.duration_min || 0), 0);
    return {
      total: filtered.length,
      open: filtered.filter((s) => s.is_open).length,
      closed: filtered.filter((s) => !s.is_open).length,
      totalHours: Math.round((totalMin / 60) * 10) / 10,
    };
  }, [filtered]);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('Sem registros para exportar');
      return;
    }
    try {
      generateCartUsagePdf(filtered, PERIOD_LABELS[period]);
      toast.success('PDF gerado');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/electric-carts"
            className="w-10 h-10 rounded-xl border border-border/40 bg-card/60 backdrop-blur-xl flex items-center justify-center hover:bg-muted/50 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Uso de Carrinhos Elétricos</h1>
            <p className="text-sm text-muted-foreground mt-1">Histórico completo de retiradas e devoluções</p>
          </div>
        </div>
        <Button onClick={handleExport} className="h-11 rounded-xl gap-2">
          <FileDown className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Sessões', value: stats.total, color: 'from-primary/20 to-primary/5 text-primary' },
          { label: 'Em aberto', value: stats.open, color: 'from-accent/20 to-accent/5 text-accent' },
          { label: 'Concluídas', value: stats.closed, color: 'from-success/20 to-success/5 text-success' },
          { label: 'Horas totais', value: `${stats.totalHours}h`, color: 'from-info/20 to-info/5 text-info' },
        ].map((s) => (
          <div
            key={s.label}
            className={cn(
              'rounded-2xl border border-border/40 p-4 backdrop-blur-xl',
              'bg-gradient-to-br', s.color,
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
            )}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
        <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
          <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cartFilter} onValueChange={setCartFilter}>
          <SelectTrigger className="w-full sm:w-56 h-11 rounded-xl"><SelectValue placeholder="Carrinho" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os carrinhos</SelectItem>
            {carts.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.codigo}{c.nome ? ` — ${c.nome}` : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar responsável, empresa..."
            className="pl-9 pr-9 h-11 rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button
          variant={openOnly ? 'default' : 'outline'}
          onClick={() => setOpenOnly(!openOnly)}
          className="h-11 rounded-xl"
        >
          {openOnly ? 'Mostrando em aberto' : 'Apenas em aberto'}
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Carregando registros...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border/50 bg-card/30">
          <p className="text-sm text-muted-foreground">Nenhum registro de uso para os filtros selecionados</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((s) => (
            <div
              key={s.id}
              className={cn(
                'rounded-xl border border-border/40 p-3 sm:p-4',
                'bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-xl',
                'shadow-[0_4px_16px_-8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]',
                'transition-all hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.3)]'
              )}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {s.empresa_logo ? (
                    <div className="w-11 h-11 rounded-lg bg-white border flex items-center justify-center overflow-hidden shrink-0">
                      <img src={s.empresa_logo} alt={s.empresa_nome || ''} className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center shrink-0">
                      {s.tipo === 'empresa' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm sm:text-base">
                        {s.tipo === 'empresa' ? (s.empresa_nome || 'Empresa') : (s.responsavel_nome || 'Membro')}
                      </p>
                      {s.is_open ? (
                        <Badge className="text-[10px] bg-accent/20 text-accent border-accent/30 hover:bg-accent/20">Em uso</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Devolvido</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {s.cart_codigo}{s.cart_nome ? ` · ${s.cart_nome}` : ''}
                    </p>
                    {s.comissao && s.tipo === 'interno' && (
                      <Badge variant="outline" className="text-[10px] mt-1">{s.comissao}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="text-[10px]">
                    {formatDuration(s.duration_min)}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-success" />
                  <span className="font-medium text-foreground">Retirada:</span> {formatDateTime(s.retirada_em)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-primary" />
                  <span className="font-medium text-foreground">Devolução:</span> {formatDateTime(s.devolucao_em)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
