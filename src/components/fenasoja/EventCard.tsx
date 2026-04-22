import { Sun, Sunset, Moon, MapPin, User, Pencil, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { rawTime, cn } from '@/lib/utils';

interface EventCardProps {
  event: any;
  responsavelName?: string | null;
  comissaoName?: string | null;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
}

function getShift(iso: string): 'manha' | 'tarde' | 'noite' {
  const h = parseInt(new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo',
  }), 10);
  if (h < 12) return 'manha';
  if (h < 18) return 'tarde';
  return 'noite';
}

const shiftMeta = {
  manha: { label: 'Manhã', icon: Sun },
  tarde: { label: 'Tarde', icon: Sunset },
  noite: { label: 'Noite', icon: Moon },
} as const;

export default function EventCard({ event, responsavelName, comissaoName, canManage, onEdit, onDelete, index = 0 }: EventCardProps) {
  const shift = getShift(event.inicio_em);
  const { label: shiftLabel, icon: ShiftIcon } = shiftMeta[shift];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-gold/15',
        'bg-gradient-to-br from-primary/[0.06] via-card/60 to-transparent',
        'backdrop-blur-2xl shadow-sm',
        'transition-all duration-300 hover:-translate-y-0.5',
        'hover:shadow-[0_0_24px_-8px_hsl(var(--gold)/0.4)]',
        'animate-fade-in',
      )}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      {/* Gold stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-gold via-gold/70 to-gold/30" />

      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 pl-5 sm:pl-6">
        {/* Time column */}
        <div className="flex sm:flex-col sm:items-start sm:min-w-[88px] gap-2 sm:gap-1">
          <div className="flex items-center gap-1.5 text-gold">
            <ShiftIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">{shiftLabel}</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold tabular-nums leading-none text-foreground">
            {rawTime(event.inicio_em)}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            até {rawTime(event.fim_em)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" aria-hidden="true" />
            <h3 className="font-bold text-base sm:text-lg leading-tight uppercase tracking-tight">
              {event.titulo}
            </h3>
            {event.tipo_tag && (
              <Badge variant="secondary" className="text-[10px] bg-gold/15 text-gold border-gold/20 hover:bg-gold/20">
                {event.tipo_tag}
              </Badge>
            )}
          </div>

          {event.local && (
            <div className="flex items-start gap-1.5 text-sm text-foreground/80">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
              <span className="leading-snug">{event.local}</span>
            </div>
          )}

          {(responsavelName || comissaoName) && (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <User className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="leading-snug">
                {responsavelName}
                {responsavelName && comissaoName && <span className="opacity-50"> · </span>}
                {comissaoName}
              </span>
            </div>
          )}

          {event.descricao && (
            <p className="text-sm text-foreground/70 leading-snug whitespace-pre-wrap pt-1 border-t border-border/30 mt-2">
              {event.descricao}
            </p>
          )}

          {canManage && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 gap-1.5">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
