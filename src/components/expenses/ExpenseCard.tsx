import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Receipt, FileCheck, AlertCircle, Clock, CheckCircle, XCircle, Banknote } from 'lucide-react';

const statusConfig: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  rascunho: { label: 'Rascunho', class: 'bg-muted text-muted-foreground', icon: Clock },
  pendente_comprovante: { label: 'Sem comprovante', class: 'bg-accent/15 text-accent', icon: AlertCircle },
  pendente_validacao: { label: 'Em validação', class: 'bg-primary/15 text-primary', icon: Clock },
  aprovado: { label: 'Aprovado', class: 'bg-success/15 text-success', icon: CheckCircle },
  ressarcimento_solicitado: { label: 'Ressarcimento', class: 'bg-gold/15 text-gold', icon: Banknote },
  ressarcido: { label: 'Ressarcido', class: 'bg-success/15 text-success', icon: CheckCircle },
  recusado: { label: 'Recusado', class: 'bg-destructive/15 text-destructive', icon: XCircle },
  cancelado: { label: 'Cancelado', class: 'bg-muted text-muted-foreground', icon: XCircle },
};

const categoryIcons: Record<string, string> = {
  fuel: '⛽', combustivel: '⛽', pedagio: '🛣️', refeicao: '🍽️', hotel: '🏨',
  estacionamento: '🅿️', manutencao: '🔧', compras: '🛒', outros: '📦',
};

interface ExpenseCardProps {
  expense: any;
  onClick?: () => void;
}

export default function ExpenseCard({ expense, onClick }: ExpenseCardProps) {
  const status = statusConfig[expense.status] || statusConfig.rascunho;
  const StatusIcon = status.icon;
  const categoryName = expense.expense_categories?.name || 'Outros';
  const categoryIcon = categoryIcons[categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] || '📦';
  const hasDoc = expense.expense_documents && expense.expense_documents.length > 0;
  const amount = Number(expense.amount) || 0;

  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 cursor-pointer hover:bg-muted/60 active:scale-[0.98] transition-all"
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
        {categoryIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{expense.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{categoryName}</p>
        {expense.paid_by_name && (
          <p className="text-[10px] text-muted-foreground mt-0.5">Pago por: {expense.paid_by_name}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="text-sm font-bold text-foreground">
          R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <Badge className={cn('text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1', status.class)}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </Badge>
        {hasDoc && (
          <span className="text-[9px] text-success flex items-center gap-0.5">
            <FileCheck className="w-3 h-3" /> Comprovante
          </span>
        )}
      </div>
    </div>
  );
}
