import React, { useMemo, useState } from 'react';
import {
  AppView,
  CaseRecord,
  ControlPanelSubTab,
  ForumDocument,
  GovernanceConfig,
  UserSession,
  WarModuleId,
} from '../types/lex';
import { ROLE_META } from '../data/mockCases';
import {
  CriminalFlowMap3D,
  CriminalJusticeStageId,
} from './CriminalFlowMap3D';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Crosshair,
  FileText,
  Gavel,
  Landmark,
  Layers,
  Lock,
  MessageCircleHeart,
  Search,
  Send,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

export type UserHomeSubScreen = 'modulos' | 'casos' | 'documentos' | 'metricas';

interface UserHomeScreenProps {
  session: UserSession;
  cases: CaseRecord[];
  forumDocs: ForumDocument[];
  governance: GovernanceConfig;
  whatsappCount: number;
  initialStageId?: CriminalJusticeStageId;
  onNavigate: (view: AppView) => void;
  onOpenWarRoom: (caseId: string, moduleId: WarModuleId) => void;
  onOpenControlSubTab: (tab: ControlPanelSubTab) => void;
  onSelectForumDoc: (docId: string) => void;
  onValidateDoc: (docId: string) => void;
  onRequestReview: (docId: string) => void;
}

export const UserHomeScreen: React.FC<UserHomeScreenProps> = ({
  session,
  cases,
  forumDocs,
  governance,
  whatsappCount,
  initialStageId = 'custodia',
  onNavigate,
  onOpenWarRoom,
  onOpenControlSubTab,
  onSelectForumDoc,
  onValidateDoc,
  onRequestReview,
}) => {
  const [activeSubScreen, setActiveSubScreen] =
    useState<UserHomeSubScreen>('modulos');
  const [caseSearch, setCaseSearch] = useState('');
  const [caseFilter, setCaseFilter] = useState<'todos' | 'critica' | 'monitorada'>(
    'todos'
  );
  const [docFilter, setDocFilter] = useState<
    'todos' | 'pendentes' | 'validado'
  >('todos');

  const roleMeta = ROLE_META[session.role];
  const perms = roleMeta.permissions;

  const handleNavigateFrom3DMap = (stageId: CriminalJusticeStageId) => {
    if (stageId === 'apf') {
      if (perms.canCreateCase) onNavigate('novo-assistido');
      return;
    }
    if (stageId === 'forum') {
      onNavigate('modo-forum');
      return;
    }
    if (stageId === 'custodia') {
      const targetCase =
        cases.find(
          (c) =>
            c.defaultModule === 'custodia' ||
            c.situacao === 'Preso em Flagrante'
        ) ?? cases[0];
      onOpenWarRoom(targetCase?.id ?? 'case-01', 'custodia');
      return;
    }
    if (stageId === 'aij') {
      const targetCase =
        cases.find((c) => c.defaultModule === 'aij') ?? cases[1] ?? cases[0];
      onOpenWarRoom(targetCase?.id ?? 'case-01', 'aij');
      return;
    }
    if (stageId === 'tribunais') {
      const targetCase =
        cases.find((c) => c.defaultModule === 'tribunais') ??
        cases[2] ??
        cases[0];
      onOpenWarRoom(targetCase?.id ?? 'case-01', 'tribunais');
      return;
    }
    onOpenWarRoom(cases[0]?.id ?? 'case-01', 'tradutor');
  };

  const urgentCases = useMemo(
    () => cases.filter((c) => c.urgency === 'critica' || c.urgency === 'alta'),
    [cases]
  );
  const validatedDocs = useMemo(
    () => forumDocs.filter((d) => d.status === 'validado'),
    [forumDocs]
  );
  const pendingDocs = useMemo(
    () => forumDocs.filter((d) => d.status !== 'validado'),
    [forumDocs]
  );
  const reviewRequestedDocs = useMemo(
    () => forumDocs.filter((d) => d.status === 'revisao_solicitada'),
    [forumDocs]
  );

  const filteredCases = useMemo(() => {
    const q = caseSearch.trim().toLowerCase();
    return cases.filter((c) => {
      const matchesQuery =
        !q ||
        c.assistido.toLowerCase().includes(q) ||
        c.processo.toLowerCase().includes(q) ||
        c.varaComarca.toLowerCase().includes(q) ||
        c.imputacao.toLowerCase().includes(q);
      const matchesFilter =
        caseFilter === 'todos'
          ? true
          : caseFilter === 'critica'
          ? c.urgency === 'critica' || c.urgency === 'alta'
          : c.urgency === 'monitorada';
      return matchesQuery && matchesFilter;
    });
  }, [cases, caseSearch, caseFilter]);

  const filteredDocs = useMemo(() => {
    return forumDocs.filter((doc) => {
      if (docFilter === 'validado') return doc.status === 'validado';
      if (docFilter === 'pendentes') return doc.status !== 'validado';
      return true;
    });
  }, [forumDocs, docFilter]);

  // Organização estruturada dos módulos operacionais por categoria
  const operationalGroups: {
    groupTitle: string;
    groupDesc: string;
    items: {
      id: string;
      title: string;
      subtitle: string;
      badge: string;
      icon: React.FC<{ className?: string }>;
      accent: string;
      allowed: boolean;
      restrictedReason?: string;
      onClick: () => void;
    }[];
  }[] = [
    {
      groupTitle: '01. Operação Criminal & Audiência (War Room)',
      groupDesc: 'Atuação direta da hora zero do flagrante aos tribunais superiores.',
      items: [
        {
          id: 'mod-custodia',
          title: 'Central de Flagrantes (M1)',
          subtitle:
            session.role === 'estudante'
              ? 'Rascunho de flagrante e roteiro de parlatório'
              : 'Sustentação oral e árvore Cenário A / B',
          badge: 'Hora Zero',
          icon: Siren,
          accent: 'text-red-400',
          allowed: true,
          onClick: () => onOpenWarRoom(cases[0]?.id ?? 'case-01', 'custodia'),
        },
        {
          id: 'mod-aij',
          title: 'AIJ & Cadeia de Custódia (M2)',
          subtitle: 'Contradições policiais e Art. 403 §3º CPP',
          badge: 'Audiência',
          icon: Crosshair,
          accent: 'text-amber-400',
          allowed: true,
          onClick: () =>
            onOpenWarRoom(cases[1]?.id ?? cases[0]?.id ?? 'case-01', 'aij'),
        },
        {
          id: 'mod-tribunais',
          title: 'STJ/STF & Execução SEEU (M3)',
          subtitle: 'Filtro Anti-Súmula 7 e calculadora Art. 112 LEP',
          badge: 'Recursal',
          icon: Landmark,
          accent: 'text-blue-400',
          allowed: true,
          onClick: () =>
            onOpenWarRoom(cases[2]?.id ?? cases[0]?.id ?? 'case-01', 'tribunais'),
        },
        {
          id: 'mod-tradutor',
          title: 'Tradutor WhatsApp Família (M4)',
          subtitle: 'Tradução acolhedora de andamentos PJe/SEEU',
          badge: 'Relacionamento',
          icon: MessageCircleHeart,
          accent: 'text-emerald-400',
          allowed: true,
          onClick: () => onOpenWarRoom(cases[0]?.id ?? 'case-01', 'tradutor'),
        },
      ],
    },
    {
      groupTitle: '02. Fluxo de Fórum, Captação & Governança',
      groupDesc: 'Sub-telas administrativas e de entrega conforme sua alçada RBAC.',
      items: [
        {
          id: 'mod-forum',
          title: 'Modo Fórum · Teleprompter',
          subtitle: perms.canValidate
            ? 'Sustentação oral, edição e assinatura OAB'
            : 'Treino oral e solicitação de revisão OAB',
          badge: `${forumDocs.length} peça(s)`,
          icon: Gavel,
          accent: 'text-amber-400',
          allowed: true,
          onClick: () => onNavigate('modo-forum'),
        },
        {
          id: 'mod-apf',
          title:
            session.role === 'estudante'
              ? 'Triagem de APF (Estudo)'
              : 'Novo Assistido & APF',
          subtitle: 'Captação em 3 linhas e leitura automática de auto',
          badge: 'Entrada',
          icon: UserPlus,
          accent: 'text-sky-400',
          allowed: perms.canCreateCase,
          onClick: () => onNavigate('novo-assistido'),
        },
        {
          id: 'mod-gov',
          title: 'Governança & Regras da IA',
          subtitle: 'Vocativos, postura garantista e travas LGPD',
          badge: perms.canViewControlPanel ? 'Liberado' : 'Restrito',
          icon: SlidersHorizontal,
          accent: 'text-blue-400',
          allowed: perms.canViewControlPanel,
          restrictedReason: 'Exclusivo para Escritório e Advogado(a)',
          onClick: () => onOpenControlSubTab('governanca'),
        },
        {
          id: 'mod-equipe',
          title: 'Equipe & Permissões RBAC',
          subtitle: 'Delegação de casos e gestão de alçadas',
          badge: perms.canManageTeam ? 'Full Ops' : 'Restrito',
          icon: Users,
          accent: 'text-amber-400',
          allowed: perms.canManageTeam,
          restrictedReason: 'Exclusivo do perfil Escritório Criminal',
          onClick: () => onOpenControlSubTab('equipe'),
        },
      ],
    },
  ];

  const subScreenTabs: {
    id: UserHomeSubScreen;
    label: string;
    mobileLabel: string;
    count?: number | string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'modulos',
      label: 'Módulos Operacionais',
      mobileLabel: 'Módulos',
      count: 8,
      icon: Layers,
    },
    {
      id: 'casos',
      label: 'Casos Ativos',
      mobileLabel: 'Casos',
      count: cases.length,
      icon: Briefcase,
    },
    {
      id: 'documentos',
      label: 'Documentos de Fórum',
      mobileLabel: 'Fórum',
      count: forumDocs.length,
      icon: FileText,
    },
    {
      id: 'metricas',
      label: 'Métricas de Desempenho',
      mobileLabel: 'Métricas',
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Cabeçalho Mobile-First da Homepage do Usuário */}
      <section className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-amber-400">
              {roleMeta.shortLabel}
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="font-mono-tabular text-slate-400">
              {session.oab}
            </span>
            <span aria-hidden="true" className="text-slate-600 hidden sm:inline">
              ·
            </span>
            <span className="font-mono-tabular text-slate-400 hidden sm:inline">
              {governance.comarcaPadrao}
            </span>
          </div>

          <h2 className="font-display text-xl sm:text-3xl font-bold text-white leading-tight">
            Olá, {session.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {roleMeta.homeSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('perfil-usuario')}
            className="min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Permissões</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('novo-assistido')}
            className="min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>
              {session.role === 'estudante' ? 'Triagem APF' : 'Novo Assistido'}
            </span>
          </button>
        </div>
      </section>

      {/* Navegação Interna das 4 Sub-telas da Homepage (Touch-First 44px+) */}
      <nav
        aria-label="Sub-telas da Homepage do Usuário"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-[#0B111E] border border-slate-800"
      >
        {subScreenTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubScreen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubScreen(tab.id)}
              className={`min-h-[44px] flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#131D33]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">{tab.mobileLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`font-mono-tabular text-[11px] ${
                    active ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ===================================================================
          SUB-TELA 1: MÓDULOS OPERACIONAIS
      ==================================================================== */}
      {activeSubScreen === 'modulos' && (
        <div className="space-y-6">
          {/* Mapa Arquitetônico 3D Interativo do Fluxo Criminal */}
          <CriminalFlowMap3D
            cases={cases}
            forumDocs={forumDocs}
            rolePermissions={perms}
            initialStageId={initialStageId}
            onNavigateToStage={handleNavigateFrom3DMap}
            onOpenControlGovernance={() => onOpenControlSubTab('governanca')}
          />

          {/* Atalhos Rápidos de Resumo (2x2 no mobile, 4 colunas no desktop) */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-px">
            <button
              type="button"
              onClick={() => setActiveSubScreen('casos')}
              className="bg-[#0B111E] hover:bg-[#101829] p-4 text-left transition-colors min-h-[82px]"
            >
              <span className="text-[11px] text-slate-400 block">
                Casos Prioritários
              </span>
              <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-red-400 mt-0.5 block">
                {urgentCases.length}
              </span>
              <span className="text-[11px] text-slate-400">
                Ver fila ativa →
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubScreen('documentos')}
              className="bg-[#0B111E] hover:bg-[#101829] p-4 text-left transition-colors min-h-[82px]"
            >
              <span className="text-[11px] text-slate-400 block">
                {perms.canValidate ? 'Peças Pendentes' : 'Minutas em Rascunho'}
              </span>
              <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-amber-400 mt-0.5 block">
                {pendingDocs.length}
              </span>
              <span className="text-[11px] text-slate-400">
                Abrir documentos →
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubScreen('metricas')}
              className="bg-[#0B111E] hover:bg-[#101829] p-4 text-left transition-colors min-h-[82px]"
            >
              <span className="text-[11px] text-slate-400 block">
                Preparo Custódia
              </span>
              <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-white mt-0.5 block">
                4m 20s
              </span>
              <span className="text-[11px] text-emerald-400">
                Ver métricas →
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('perfil-usuario')}
              className="bg-[#0B111E] hover:bg-[#101829] p-4 text-left transition-colors min-h-[82px]"
            >
              <span className="text-[11px] text-slate-400 block">
                Alçada RBAC
              </span>
              <span className="font-mono-tabular text-base sm:text-lg font-bold text-blue-400 mt-1 block truncate">
                {roleMeta.shortLabel}
              </span>
              <span className="text-[11px] text-slate-400">
                {perms.canValidate ? 'Assinatura OAB ativa' : 'Supervisionado'}
              </span>
            </button>
          </div>

          {/* Grupos de Módulos Operacionais */}
          {operationalGroups.map((group) => (
            <section key={group.groupTitle} className="space-y-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {group.groupTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{group.groupDesc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!item.allowed}
                      onClick={item.onClick}
                      className={`min-h-[124px] p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-colors ${
                        item.allowed
                          ? 'bg-[#0B111E] border-slate-800 hover:border-amber-500/45 active:scale-[0.99]'
                          : 'bg-[#080D17] border-slate-900 opacity-65 cursor-not-allowed'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              item.allowed ? item.accent : 'text-slate-500'
                            }`}
                          />
                          <span className="font-mono-tabular text-[11px] text-slate-400 flex items-center gap-1">
                            {!item.allowed && (
                              <Lock className="w-3 h-3 text-slate-500" />
                            )}
                            <span>{item.badge}</span>
                          </span>
                        </div>
                        <div className="font-bold text-sm text-white leading-snug">
                          {item.title}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {item.allowed
                            ? item.subtitle
                            : item.restrictedReason ?? 'Acesso restrito'}
                        </p>
                      </div>

                      <div
                        className={`text-xs font-semibold flex items-center gap-1.5 ${
                          item.allowed ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      >
                        <span>
                          {item.allowed ? 'Abrir módulo' : 'Bloqueado (RBAC)'}
                        </span>
                        {item.allowed && <ArrowRight className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ===================================================================
          SUB-TELA 2: CASOS ATIVOS (Mobile-First Tap List + Busca/Filtro)
      ==================================================================== */}
      {activeSubScreen === 'casos' && (
        <section className="rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Casos Ativos & Pauta Criminal ({filteredCases.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toque em qualquer caso para abrir diretamente no módulo
                  adequado da War Room.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('novo-assistido')}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar Caso</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  placeholder="Buscar por assistido, processo ou comarca..."
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060B14] border border-slate-800 overflow-x-auto no-scrollbar shrink-0">
                {(
                  [
                    { id: 'todos', label: 'Todos' },
                    { id: 'critica', label: 'Urgentes' },
                    { id: 'monitorada', label: 'Execução / Outros' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCaseFilter(f.id)}
                    className={`min-h-[40px] flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      caseFilter === f.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredCases.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-slate-400">
                Nenhum processo encontrado para os filtros atuais.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCaseSearch('');
                  setCaseFilter('todos');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs font-semibold text-slate-200"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <span className="font-bold text-white">{c.assistido}</span>
                      <span className="text-slate-600">·</span>
                      <span
                        className={`font-mono-tabular text-xs font-semibold ${
                          c.urgency === 'critica'
                            ? 'text-red-400'
                            : c.urgency === 'alta'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {c.prazoLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-mono-tabular">{c.processo}</span>
                      <span>·</span>
                      <span>{c.varaComarca}</span>
                      <span>·</span>
                      <span className="text-slate-300">{c.proximoAto}</span>
                      {c.assignedTo && (
                        <>
                          <span>·</span>
                          <span>Resp.: {c.assignedTo}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenWarRoom(c.id, c.defaultModule)}
                      className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 hover:border-amber-500/45 text-xs font-semibold text-slate-100 flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <span>Abrir na War Room</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===================================================================
          SUB-TELA 3: DOCUMENTOS DE FÓRUM (Curadoria & Teleprompter)
      ==================================================================== */}
      {activeSubScreen === 'documentos' && (
        <section className="rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Documentos & Sustentações do Modo Fórum ({filteredDocs.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {perms.canValidate
                  ? 'Revise minutas, abra o teleprompter de audiência ou assine com sua OAB.'
                  : 'Abra minutas para treino no teleprompter ou solicite revisão ao advogado responsável.'}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060B14] border border-slate-800 overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'pendentes', label: 'Pendentes' },
                  { id: 'validado', label: 'Validados' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDocFilter(tab.id)}
                  className={`min-h-[40px] flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    docFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="p-8 text-center text-xs sm:text-sm text-slate-400">
              Nenhuma peça encontrada neste filtro. Gere novas peças na War
              Room.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          doc.status === 'validado'
                            ? 'text-emerald-400'
                            : doc.status === 'revisao_solicitada'
                            ? 'text-blue-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {doc.status === 'validado'
                          ? `Validado OAB (${doc.validatedOab})`
                          : doc.status === 'revisao_solicitada'
                          ? 'Revisão Solicitada'
                          : 'Rascunho Pendente'}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{doc.assistido}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {doc.title}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2 max-w-2xl">
                      {doc.subtitle} — {doc.content.slice(0, 140)}...
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectForumDoc(doc.id);
                        onNavigate('modo-forum');
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-semibold text-slate-100 flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Gavel className="w-3.5 h-3.5 text-amber-400" />
                      <span>Abrir Teleprompter</span>
                    </button>

                    {doc.status !== 'validado' &&
                      (perms.canValidate ? (
                        <button
                          type="button"
                          onClick={() => onValidateDoc(doc.id)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Assinar OAB</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={doc.status === 'revisao_solicitada'}
                          onClick={() => onRequestReview(doc.id)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {doc.status === 'revisao_solicitada'
                              ? 'Revisão Solicitada'
                              : 'Solicitar Revisão'}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===================================================================
          SUB-TELA 4: MÉTRICAS DE DESEMPENHO (Adaptada por Permissão)
      ==================================================================== */}
      {activeSubScreen === 'metricas' && (
        <div className="space-y-5">
          {perms.canViewOverview ? (
            <>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-px">
                <div className="bg-[#0B111E] p-4 sm:p-5">
                  <span className="text-[11px] sm:text-xs text-slate-400">
                    Tempo Médio Custódia
                  </span>
                  <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-white mt-1.5">
                    4m 20s
                  </div>
                  <span className="text-[11px] sm:text-xs text-emerald-400 mt-1 block">
                    88% mais rápido
                  </span>
                </div>

                <div className="bg-[#0B111E] p-4 sm:p-5">
                  <span className="text-[11px] sm:text-xs text-slate-400">
                    Taxa de Liberdade
                  </span>
                  <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-blue-400 mt-1.5">
                    78,4%
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-400 mt-1 block truncate">
                    {governance.comarcaPadrao}
                  </span>
                </div>

                <div className="bg-[#0B111E] p-4 sm:p-5">
                  <span className="text-[11px] sm:text-xs text-slate-400">
                    Peças Validadas OAB
                  </span>
                  <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-amber-400 mt-1.5">
                    {validatedDocs.length} / {forumDocs.length}
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-400 mt-1 block">
                    Curadoria Modo Fórum
                  </span>
                </div>

                <div className="bg-[#0B111E] p-4 sm:p-5">
                  <span className="text-[11px] sm:text-xs text-slate-400">
                    WhatsApp Família
                  </span>
                  <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-emerald-400 mt-1.5">
                    {412 + whatsappCount}
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-400 mt-1 block">
                    Mensagens claras
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Distribuição Operacional da Carteira
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Proporção de demandas por urgência e estágio processual.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('visao-geral')}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-semibold text-blue-400 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Abrir Painel Executivo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    {
                      label: 'Flagrantes & Preventivas (Urgência Alta/Crítica)',
                      count: urgentCases.length,
                      total: Math.max(1, cases.length),
                      bar: 'bg-red-500',
                    },
                    {
                      label: 'Peças Validadas para Protocolo OAB',
                      count: validatedDocs.length,
                      total: Math.max(1, forumDocs.length),
                      bar: 'bg-emerald-500',
                    },
                    {
                      label: 'Aguardando Revisão / Assinatura',
                      count: pendingDocs.length,
                      total: Math.max(1, forumDocs.length),
                      bar: 'bg-amber-500',
                    },
                  ].map((row) => {
                    const pct = Math.round((row.count / row.total) * 100);
                    return (
                      <div key={row.label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">{row.label}</span>
                          <span className="font-mono-tabular text-slate-200 font-semibold">
                            {row.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#060B14] overflow-hidden">
                          <div
                            className={`h-full ${row.bar} transition-all duration-300`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Visão de Desempenho Supervisionada para Perfil Estudante / Estagiário */
            <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 sm:p-6 space-y-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Desempenho em Prática Supervisionada
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Indicadores financeiros e taxas globais do escritório são
                    restritos a advogados e sócios. Acompanhe abaixo seu
                    progresso de triagens e minutas preparadas.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#060B14] border border-slate-800 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
                <div className="p-4">
                  <span className="text-xs text-slate-400">
                    Casos em Estudo / Triagem
                  </span>
                  <div className="font-mono-tabular text-2xl font-bold text-white mt-1">
                    {cases.length}
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs text-slate-400">
                    Revisões OAB Solicitadas
                  </span>
                  <div className="font-mono-tabular text-2xl font-bold text-blue-400 mt-1">
                    {reviewRequestedDocs.length}
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs text-slate-400">
                    Minutas Aprovadas pelo Orientador
                  </span>
                  <div className="font-mono-tabular text-2xl font-bold text-emerald-400 mt-1">
                    {validatedDocs.length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
