import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import ExpenseCard from '@/components/expenses/ExpenseCard';
import ReimbursementList from '@/components/expenses/ReimbursementList';
import { Plus, Receipt, Banknote, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusFilters = [
  { value: '', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'pendente_comprovante', label: 'Sem comprovante' },
  { value: 'pendente_validacao', label: 'Em validação' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'ressarcimento_solicitado', label: 'Ressarcimento' },
  { value: 'ressarcido', label: 'Ressarcido' },
];

export default function ExpensesPage() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const {
    expenses, reimbursements, stats, isLoading, loadingReimb,
    create, uploadDocument, addDocument,
    changeStatus, updateReimbursement,
  } = useExpenses(statusFilter ? { status: statusFilter } : undefined);

  // Auto-open create dialog from query param
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCreate = async (data: Record<string, any>, file?: File) => {
    setIsSubmitting(true);
    try {
      const result = await create.mutateAsync(data);

      if (file && result?.id) {
        const fileUrl = await uploadDocument(file, result.id);
        await addDocument.mutateAsync({
          expense_id: result.id,
          file_url: fileUrl,
          file_type: file.type.startsWith('image') ? 'image' : 'pdf',
          extraction_status: 'pendente',
        });
      }

      setCreateOpen(false);
      toast.success('Despesa registrada com sucesso');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar despesa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveReimb = async (id: string) => {
    try {
      await updateReimbursement.mutateAsync({
        id,
        status: 'aprovado',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        approved_amount: reimbursements.find((r: any) => r.id === id)?.requested_amount,
      });
      toast.success('Ressarcimento aprovado');
    } catch { toast.error('Erro ao aprovar'); }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const reimb = reimbursements.find((r: any) => r.id === id);
      await updateReimbursement.mutateAsync({
        id,
        status: 'pago',
        paid_by: user?.id,
        paid_at: new Date().toISOString(),
        paid_amount: reimb?.approved_amount || reimb?.requested_amount,
      });
      toast.success('Ressarcimento pago');
    } catch { toast.error('Erro ao marcar pagamento'); }
  };

  const handleRejectReimb = async (id: string) => {
    try {
      await updateReimbursement.mutateAsync({ id, status: 'recusado' });
      toast.success('Ressarcimento recusado');
    } catch { toast.error('Erro ao recusar'); }
  };

  const CreateFormContent = (
    <ExpenseForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
  );

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Despesas & Ressarcimentos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats.total} despesas • R$ {stats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Nova
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="liquid-glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{stats.pendingReceipt}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Sem comprovante</p>
        </div>
        <div className="liquid-glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{stats.pendingValidation}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Em validação</p>
        </div>
        <div className="liquid-glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-accent">{stats.pendingReimbursement}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Ressarc. pendente</p>
        </div>
        <div className="liquid-glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-success">
            R$ {stats.reimbursedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">Ressarcido</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lancamentos" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="lancamentos" className="flex-1 gap-1.5 text-xs">
            <Receipt className="w-3.5 h-3.5" /> Lançamentos
          </TabsTrigger>
          <TabsTrigger value="ressarcimentos" className="flex-1 gap-1.5 text-xs">
            <Banknote className="w-3.5 h-3.5" /> Ressarcimentos
            {stats.pendingReimbursement > 0 && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 ml-1">{stats.pendingReimbursement}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos">
          {/* Status filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
            {statusFilters.map(sf => (
              <button
                key={sf.value}
                onClick={() => setStatusFilter(sf.value)}
                className={cn(
                  'whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0',
                  statusFilter === sf.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}
              >
                {sf.label}
              </button>
            ))}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />)}
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="w-10 h-10 mb-3 opacity-25" />
              <p className="text-sm font-medium">Nenhuma despesa encontrada</p>
              <p className="text-xs mt-1">Registre sua primeira despesa usando o botão acima.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((e: any) => (
                <ExpenseCard key={e.id} expense={e} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ressarcimentos">
          <ReimbursementList
            reimbursements={reimbursements}
            isLoading={loadingReimb}
            onApprove={handleApproveReimb}
            onMarkPaid={handleMarkPaid}
            onReject={handleRejectReimb}
            canApprove={true}
          />
        </TabsContent>
      </Tabs>

      {/* FAB mobile */}
      {isMobile && (
        <button
          onClick={() => setCreateOpen(true)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Nova despesa"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Create Dialog/Drawer */}
      {isMobile ? (
        <Drawer open={createOpen} onOpenChange={setCreateOpen}>
          <DrawerContent className="max-h-[92dvh] flex flex-col">
            <DrawerHeader>
              <DrawerTitle>Registrar Despesa</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 flex-1 overflow-y-auto">
              {CreateFormContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Despesa</DialogTitle>
            </DialogHeader>
            {CreateFormContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
