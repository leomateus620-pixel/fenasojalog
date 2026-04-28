import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type CartStatusFilter = 'all' | 'disponivel' | 'em_uso';

interface Props {
  search: string;
  onSearch: (v: string) => void;
  status: CartStatusFilter;
  onStatus: (s: CartStatusFilter) => void;
  counts: { all: number; disponivel: number; em_uso: number };
}

const OPTIONS: { key: CartStatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'disponivel', label: 'Disponíveis' },
  { key: 'em_uso', label: 'Em uso' },
];

export default function ElectricCartsFilters({ search, onSearch, status, onStatus, counts }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar por código ou nome..."
          className="pl-9 pr-9 h-11 rounded-xl"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div
        className={cn(
          'inline-flex items-center p-1 rounded-xl border border-border/40',
          'bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-xl shadow-inner gap-1'
        )}
      >
        {OPTIONS.map((o) => {
          const active = status === o.key;
          const count = counts[o.key];
          return (
            <button
              key={o.key}
              onClick={() => onStatus(o.key)}
              className={cn(
                'px-3 sm:px-4 h-9 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              {o.label}
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                  active ? 'bg-primary-foreground/20' : 'bg-muted/60'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
