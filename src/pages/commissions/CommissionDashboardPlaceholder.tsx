import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Database,
  FileText,
  Info,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getModuleRoute,
  statusClasses,
  statusLabels,
  type CommissionMenuItem,
  type CommissionModule,
} from '@/modules/commissions/commissionRegistry';

interface CommissionDashboardPlaceholderProps {
  module: CommissionModule;
}

interface ScopeListCardProps {
  title: string;
  items?: string[];
  icon: LucideIcon;
  tone?: 'default' | 'gold' | 'red';
}

function getActiveMenu(module: CommissionModule, pathname: string) {
  const relative = pathname.replace(module.basePath, '').replace(/^\/+/, '');
  const currentPath = relative || 'dashboard';
  return module.menus.find((item) => item.path === currentPath) ?? module.menus[0];
}

function ScopeListCard({ title, items, icon: Icon, tone = 'default' }: ScopeListCardProps) {
  if (!items?.length) return null;

  return (
    <div className="liquid-glass-card rounded-xl p-4 md:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            tone === 'red' ? 'bg-red-500/10 text-red-600 dark:text-red-300' : 'bg-gold/15 text-gold'
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getScopeSections(activeMenu: CommissionMenuItem) {
  return [
    { title: 'Atividades principais', items: activeMenu.activities, icon: ListChecks },
    { title: 'Tarefas previstas', items: activeMenu.tasks, icon: ClipboardList },
    { title: 'Dados que serão registrados', items: activeMenu.dataInputs, icon: Database },
    { title: 'Saídas esperadas', items: activeMenu.outputs, icon: Workflow },
    { title: 'Indicadores futuros', items: activeMenu.indicators, icon: BarChart3 },
    { title: 'Relatórios esperados', items: activeMenu.reports, icon: FileText },
    { title: 'Responsáveis prováveis', items: activeMenu.responsibleProfiles, icon: UsersRound },
    { title: 'Fluxo de status', items: activeMenu.statusFlow, icon: Workflow },
    { title: 'Regras de prioridade', items: activeMenu.priorityRules, icon: AlertTriangle },
    { title: 'Observações', items: activeMenu.notes, icon: Info },
    { title: 'Melhorias futuras', items: activeMenu.futureEnhancements, icon: Sparkles },
  ];
}

export default function CommissionDashboardPlaceholder({ module }: CommissionDashboardPlaceholderProps) {
  const location = useLocation();
  const activeMenu = getActiveMenu(module, location.pathname);
  const ModuleIcon = module.icon;
  const ActiveIcon = activeMenu.icon;
  const scopeSections = getScopeSections(activeMenu);
  const filledSections = scopeSections.filter((section) => section.items?.length);

  const expectedMetrics = [
    { label: 'Áreas do módulo', value: module.menus.length, icon: Sparkles },
    { label: 'Seções de escopo', value: filledSections.length + (activeMenu.objective ? 1 : 0), icon: ClipboardList },
    { label: 'Relatórios esperados', value: activeMenu.reports?.length ?? 0, icon: FileText },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <section className="premium-surface gold-accent overflow-hidden rounded-xl p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', statusClasses[module.status])}>
                {statusLabels[module.status]}
              </span>
              {module.sensitive && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Sensível
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ModuleIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Módulo</p>
                <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                  {module.name}
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              {module.description}
            </p>
          </div>

          <div className="rounded-xl border border-border/45 bg-card/60 p-4 lg:min-w-72">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <ActiveIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Área atual</p>
                <h2 className="font-bold text-foreground">{activeMenu.label}</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{activeMenu.description}</p>
          </div>
        </div>

        {module.sensitive && (
          <div className="mt-5 flex gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-800 dark:text-red-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              Módulo sensível: requer validação e permissões específicas. Nenhum dado financeiro real foi implementado nesta etapa.
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {expectedMetrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="liquid-glass-card rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-black text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-4">
          {activeMenu.objective && (
            <div className="liquid-glass-card rounded-xl p-4 md:p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Objetivo</p>
                  <h2 className="text-lg font-bold text-foreground">Objetivo do menu</h2>
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{activeMenu.objective}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {scopeSections.map((section) => (
              <ScopeListCard
                key={section.title}
                title={section.title}
                items={section.items}
                icon={section.icon}
                tone={section.title === 'Regras de prioridade' ? 'red' : 'default'}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="liquid-glass-card rounded-xl p-4 md:p-5">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Estrutura</p>
              <h2 className="text-xl font-bold text-foreground">Menus do módulo</h2>
            </div>
            <div className="grid gap-3">
              {module.menus.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu.path === item.path;

                return (
                  <Link
                    key={item.path}
                    to={getModuleRoute(module, item.path)}
                    className={cn(
                      'group rounded-xl border p-3 transition focus-ring',
                      isActive
                        ? 'border-gold/35 bg-gold/10'
                        : 'border-border/50 bg-card/45 hover:border-gold/30 hover:bg-card/80'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{item.label}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="liquid-glass-card rounded-xl p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Próximos passos</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li className="flex gap-2">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                Validar responsáveis, regras de acesso e fonte oficial dos dados antes de criar registros reais.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                Transformar cada fluxo em CRUD somente depois que o escopo operacional estiver aprovado.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                Conectar indicadores reais ao painel administrativo quando houver dados confiáveis.
              </li>
            </ul>
          </div>

          <div className="liquid-glass-card rounded-xl p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Governança</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              O conteúdo desta tela vem do registry do módulo. Ele delimita o que será implementado no futuro sem criar tabelas,
              formulários funcionais ou dados operacionais fictícios.
            </p>
            <Button asChild className="mt-4 w-full rounded-xl">
              <Link to="/admin/geral">Acompanhar no admin</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
