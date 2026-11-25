import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AgendaDeadlineItem,
  AppView,
  CaseRecord,
  ClientRecord,
  ControlPanelSubTab,
  DashboardSnapshot,
  ForumDocument,
  GovernanceConfig,
  JurisdictionRegion,
  KnowledgeBaseItem,
  LegalNewsItem,
  UserSession,
  WarModuleId,
  WarRoomTabId,
} from '../types/lex';
import {
  INITIAL_AGENDA_DEADLINES,
  INITIAL_CLIENTS,
  INITIAL_KNOWLEDGE_ITEMS,
  INITIAL_LEGAL_NEWS,
  ROLE_META,
} from '../data/mockCases';
import {
  CriminalFlowMap3D,
  CriminalJusticeStageId,
} from './CriminalFlowMap3D';
import { CriminalAgentPanel } from './CriminalAgentPanel';
import { ClientRegistryPanel } from './ClientRegistryPanel';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  Crosshair,
  FileText,
  Gavel,
  Landmark,
  Layers,
  Lock,
  MessageCircleHeart,
  Newspaper,
  Plus,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

export type UserHomeSubScreen =
  | 'modulos'
  | 'clientes'
  | 'agenda'
  | 'casos'
  | 'documentos'
  | 'metricas';

interface UserHomeScreenProps {
  session: UserSession;
  cases: CaseRecord[];
  clients?: ClientRecord[];
  knowledgeItems?: KnowledgeBaseItem[];
  onClientsChange?: React.Dispatch<React.SetStateAction<ClientRecord[]>>;
  onKnowledgeChange?: React.Dispatch<React.SetStateAction<KnowledgeBaseItem[]>>;
  forumDocs: ForumDocument[];
  governance: GovernanceConfig;
  whatsappCount: number;
  initialStageId?: CriminalJusticeStageId;
  onNavigate: (view: AppView) => void;
  onCreateCase?: (newCase: CaseRecord, openDirectly: boolean) => void;
  onOpenWarRoom: (
    caseId: string,
    moduleId: WarModuleId,
    tabId?: WarRoomTabId
  ) => void;
  onOpenControlSubTab: (tab: ControlPanelSubTab) => void;
  onSelectForumDoc: (docId: string) => void;
  onValidateDoc: (docId: string) => void;
  onRequestReview: (docId: string) => void;
  onSendToForum?: (doc: Omit<ForumDocument, 'id' | 'status' | 'updatedAt'>) => void;
  onNotify?: (msg: string) => void;
}

export const UserHomeScreen: React.FC<UserHomeScreenProps> = ({
  session,
  cases,
  clients: externalClients,
  knowledgeItems: externalKnowledge,
  onClientsChange,
  onKnowledgeChange,
  forumDocs,
  governance,
  whatsappCount,
  initialStageId = 'custodia',
  onNavigate,
  onCreateCase,
  onOpenWarRoom,
  onOpenControlSubTab,
  onSelectForumDoc,
  onValidateDoc,
  onRequestReview,
  onSendToForum,
  onNotify,
}) => {
  const [activeSubScreen, setActiveSubScreen] =
    useState<UserHomeSubScreen>('modulos');
  const [caseSearch, setCaseSearch] = useState('');
  const [caseFilter, setCaseFilter] = useState<'todos' | 'critica' | 'monitorada'>(
    'todos'
  );
  const [casePartnerFilter, setCasePartnerFilter] = useState<
    'todos' | 'Dr. Ramon Ribeiro' | 'Dra. Jéssica'
  >('todos');
  const [agendaPartnerFilter, setAgendaPartnerFilter] = useState<
    'todos' | 'Ramon' | 'Jéssica'
  >('todos');
  const [docFilter, setDocFilter] = useState<
    'todos' | 'pendentes' | 'validado'
  >('todos');
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const [intakeName, setIntakeName] = useState('');
  const [intakeCpf, setIntakeCpf] = useState('');
  const [intakePrisonUnit, setIntakePrisonUnit] = useState('');
  const [intakeProcess, setIntakeProcess] = useState('');
  const [intakeVara, setIntakeVara] = useState('13ª Vara Criminal · Natal/RN');
  const [intakeImputacao, setIntakeImputacao] = useState('');
  const [intakeSituacao, setIntakeSituacao] =
    useState<CaseRecord['situacao']>('Preso em Flagrante');
  const [intakeAssignedTo, setIntakeAssignedTo] = useState<
    'Dr. Ramon Ribeiro' | 'Dra. Jéssica'
  >(session.name.includes('Jéssica') ? 'Dra. Jéssica' : 'Dr. Ramon Ribeiro');
  const [intakeChildren, setIntakeChildren] = useState('Não informado');
  const [intakeResidence, setIntakeResidence] = useState('');
  const [intakeSummary, setIntakeSummary] = useState('');
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);

  const [localClients, setLocalClients] =
    useState<ClientRecord[]>(INITIAL_CLIENTS);
  const clientsList = externalClients ?? localClients;
  const setClientsList: React.Dispatch<React.SetStateAction<ClientRecord[]>> =
    onClientsChange ?? setLocalClients;

  const [selectedClientId, setSelectedClientId] = useState<string>(
    INITIAL_CLIENTS[0]?.id ?? 'cli-01'
  );
  const [localKnowledge, setLocalKnowledge] = useState<KnowledgeBaseItem[]>(
    INITIAL_KNOWLEDGE_ITEMS
  );
  const knowledgeList = externalKnowledge ?? localKnowledge;
  const setKnowledgeList: React.Dispatch<
    React.SetStateAction<KnowledgeBaseItem[]>
  > = onKnowledgeChange ?? setLocalKnowledge;

  const [newsList, setNewsList] = useState<LegalNewsItem[]>(INITIAL_LEGAL_NEWS);
  const [agendaList, setAgendaList] = useState<AgendaDeadlineItem[]>(
    INITIAL_AGENDA_DEADLINES
  );
  const [backendSyncedAt, setBackendSyncedAt] = useState<string | null>(null);
  const [tribunalFilter, setTribunalFilter] = useState<
    'ALL' | 'TJRN' | 'TJCE' | 'STJ' | 'STF'
  >('ALL');
  const [showNewDeadlineForm, setShowNewDeadlineForm] = useState(false);
  const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
  const [newDeadlineAssistido, setNewDeadlineAssistido] = useState('');
  const [newDeadlineTribunal, setNewDeadlineTribunal] = useState<
    'TJRN' | 'TJCE' | 'STJ'
  >('TJRN');
  const [newDeadlineDate, setNewDeadlineDate] = useState('Hoje · 17:00');
  const [agentPromptDraft, setAgentPromptDraft] = useState<string | undefined>(
    undefined
  );
  const [agentJurisdictionDraft, setAgentJurisdictionDraft] =
    useState<JurisdictionRegion>('RN_CE');
  const agentSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) return;
        const data = (await res.json()) as DashboardSnapshot;
        if (!cancelled) {
          if (Array.isArray(data.clients) && data.clients.length > 0) {
            setClientsList(data.clients);
          }
          if (Array.isArray(data.knowledge) && data.knowledge.length > 0) {
            setKnowledgeList(data.knowledge);
          }
          if (Array.isArray(data.news) && data.news.length > 0) {
            setNewsList(data.news);
          }
          if (Array.isArray(data.agenda) && data.agenda.length > 0) {
            setAgendaList(data.agenda);
          }
          setBackendSyncedAt(data.syncedAt);
        }
      } catch {
        // Mantém estado local inicial caso o backend esteja reiniciando
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleDeadline = async (itemId: string) => {
    setAgendaList((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
    try {
      const res = await fetch(`/api/agenda/${itemId}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        onNotify?.('Status do prazo atualizado na agenda');
      }
    } catch {}
  };

  const handleCreateDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeadlineTitle.trim().length < 4) return;
    const [datePart, timePart] = newDeadlineDate.split('·').map((s) => s.trim());

    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDeadlineTitle.trim(),
          assistido: newDeadlineAssistido.trim() || 'Assistido sem sigla',
          tribunal: newDeadlineTribunal,
          comarca:
            newDeadlineTribunal === 'TJCE'
              ? 'Fortaleza/CE'
              : newDeadlineTribunal === 'STJ'
              ? 'Brasília/DF (STJ)'
              : 'Natal/RN',
          dateLabel: datePart || 'Hoje',
          timeLabel: timePart || '17:00',
          kind: 'prazo_fatal',
          responsible: session.name.includes('Jéssica') ? 'Jéssica' : 'Ramon',
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { item: AgendaDeadlineItem };
        setAgendaList((prev) => [data.item, ...prev]);
        setNewDeadlineTitle('');
        setNewDeadlineAssistido('');
        setShowNewDeadlineForm(false);
        onNotify?.('Novo prazo cadastrado na agenda do escritório');
      }
    } catch {}
  };

  const intakeHasArt318 =
    /sim|filh|menor|crianç|gestant|pcd|defici[eê]nc|dependente/i.test(
      intakeChildren
    );

  const handleModalCreateCase = async (
    e: React.FormEvent,
    openDirectly: boolean
  ) => {
    e.preventDefault();
    if (!intakeName.trim() || !intakeImputacao.trim()) return;
    setIntakeSubmitting(true);
    const fallbackCase: CaseRecord = {
      id: `case-${Date.now()}`,
      assistido: intakeName.trim(),
      cpf: intakeCpf.trim() || undefined,
      prisonUnit: intakePrisonUnit.trim() || undefined,
      residenceProof: intakeResidence.trim() || undefined,
      processo: intakeProcess.trim() || '0800000-00.2026.8.20.0001',
      varaComarca: intakeVara.trim() || '13ª Vara Criminal · Natal/RN',
      imputacao: intakeImputacao.trim(),
      situacao: intakeSituacao,
      urgency:
        intakeSituacao === 'Preso em Flagrante' ||
        intakeSituacao === 'Preventiva'
          ? 'critica'
          : 'alta',
      proximoAto: 'Audiência / Análise Inicial',
      prazoLabel: 'Urgente · Hoje',
      defaultModule:
        intakeSituacao === 'Preso em Flagrante' ? 'custodia' : 'aij',
      assignedTo: intakeAssignedTo,
      children: intakeChildren,
      resumoFatos:
        intakeSummary.trim() ||
        'Assistido cadastrado no Dossiê Vivo para análise estratégica imediata.',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackCase),
      });
      if (res.ok) {
        const data = (await res.json()) as { item?: CaseRecord };
        if (data.item) {
          onCreateCase?.(data.item, openDirectly);
          setIntakeModalOpen(false);
          setIntakeName('');
          setIntakeCpf('');
          setIntakePrisonUnit('');
          setIntakeProcess('');
          setIntakeImputacao('');
          setIntakeResidence('');
          setIntakeSummary('');
          setIntakeSubmitting(false);
          return;
        }
      }
    } catch {}

    onCreateCase?.(fallbackCase, openDirectly);
    setIntakeModalOpen(false);
    setIntakeSubmitting(false);
  };

  const handleAnalyzeNewsWithAgent = (item: LegalNewsItem) => {
    const jur: JurisdictionRegion =
      item.tribunal === 'TJRN'
        ? 'RN'
        : item.tribunal === 'TJCE'
        ? 'CE'
        : 'STJ_STF';
    setAgentJurisdictionDraft(jur);
    setAgentPromptDraft(
      `Analise o impacto prático desta atualização (${item.tribunal} · ${item.statuteRef}): "${item.title} — ${item.summary}". Como aplicar na defesa criminal no RN e CE?`
    );
    setActiveSubScreen('modulos');
    window.setTimeout(() => {
      agentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleConsultAgentWithClient = (client: ClientRecord) => {
    setSelectedClientId(client.id);
    const jur: JurisdictionRegion =
      client.tribunal === 'TJRN'
        ? 'RN'
        : client.tribunal === 'TJCE'
        ? 'CE'
        : 'STJ_STF';
    setAgentJurisdictionDraft(jur);
    setAgentPromptDraft(
      `Com base na linha do tempo, nos pontos importantes de ${client.name} e nos documentos/áudios da base, estruture as teses defensivas prioritárias e os próximos passos.`
    );
    setActiveSubScreen('modulos');
    window.setTimeout(() => {
      agentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 90);
  };

  const selectedClient = useMemo(
    () =>
      clientsList.find((c) => c.id === selectedClientId) ?? clientsList[0],
    [clientsList, selectedClientId]
  );

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
      const matchesPartner =
        casePartnerFilter === 'todos'
          ? true
          : c.assignedTo === casePartnerFilter;
      return matchesQuery && matchesFilter && matchesPartner;
    });
  }, [cases, caseSearch, caseFilter, casePartnerFilter]);

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
          title: 'Modo Fórum · Leitura Estática',
          subtitle: perms.canValidate
            ? 'Kit de audiência, edição e assinatura OAB'
            : 'Leitura de audiência e solicitação de revisão OAB',
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

  const openDeadlines = useMemo(
    () => agendaList.filter((a) => !a.completed),
    [agendaList]
  );

  const filteredNews = useMemo(() => {
    if (tribunalFilter === 'ALL') return newsList;
    return newsList.filter((n) => n.tribunal === tribunalFilter);
  }, [newsList, tribunalFilter]);

  const filteredAgenda = useMemo(() => {
    return agendaList.filter((a) => {
      const matchesTribunal =
        tribunalFilter === 'ALL' || tribunalFilter === 'STF'
          ? true
          : a.tribunal === tribunalFilter;
      const matchesPartner =
        agendaPartnerFilter === 'todos'
          ? true
          : a.responsible === agendaPartnerFilter;
      return matchesTribunal && matchesPartner;
    });
  }, [agendaList, tribunalFilter, agendaPartnerFilter]);

  const subScreenTabs: {
    id: UserHomeSubScreen;
    label: string;
    mobileLabel: string;
    count?: number | string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'modulos',
      label: 'Dashboard & Doutor LEX',
      mobileLabel: 'Dashboard',
      icon: Layers,
    },
    {
      id: 'clientes',
      label: 'Clientes & Linha do Tempo',
      mobileLabel: 'Clientes',
      count: clientsList.length,
      icon: Users,
    },
    {
      id: 'agenda',
      label: 'Notícias, Agenda & Prazos',
      mobileLabel: 'Agenda',
      count: openDeadlines.length,
      icon: CalendarClock,
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
      label: 'Modo Fórum',
      mobileLabel: 'Fórum',
      count: forumDocs.length,
      icon: FileText,
    },
    {
      id: 'metricas',
      label: 'Métricas',
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
            {backendSyncedAt && (
              <span className="font-mono-tabular text-[11px] text-emerald-400">
                · Backend ativo (RN/CE)
              </span>
            )}
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
            onClick={() =>
              onOpenWarRoom(cases[0]?.id ?? 'case-01', 'custodia')
            }
            className="min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Siren className="w-4 h-4 shrink-0" />
            <span>War Room</span>
          </button>

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
            className="col-span-2 sm:col-span-1 min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>
              {session.role === 'estudante' ? 'Triagem APF' : 'Novo Assistido'}
            </span>
          </button>
        </div>
      </section>

      {/* Navegação Interna das Sub-telas da Homepage (Touch-First 44px+) */}
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
          SUB-TELA 1: DASHBOARD, MAPA 3D, AGENTE IA & MÓDULOS
      ==================================================================== */}
      {activeSubScreen === 'modulos' && (
        <div className="space-y-6">
          {/* KPIs Executivos do Escritório (2x2 mobile, 4 colunas desktop) */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-px">
            <button
              type="button"
              onClick={() => setActiveSubScreen('casos')}
              className="bg-[#0B111E] hover:bg-[#101829] p-4 text-left transition-colors min-h-[82px]"
            >
              <span className="text-[11px] text-slate-400 block">
                Dossiês Ativos no Escritório
              </span>
              <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-white mt-0.5 block">
                {cases.length}
              </span>
              <span className="text-[11px] text-red-400">
                {urgentCases.length} urgentes RN/CE →
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubScreen('agenda')}
              className="bg-[#0B111E] hover:bg-[#101829] p-4 text-left transition-colors min-h-[82px]"
            >
              <span className="text-[11px] text-slate-400 block">
                Audiências Agendadas na Semana
              </span>
              <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-amber-400 mt-0.5 block">
                {String(
                  agendaList.filter(
                    (a) => !a.completed && a.kind === 'audiencia'
                  ).length || 4
                ).padStart(2, '0')}
              </span>
              <span className="text-[11px] text-slate-400">
                TJRN & TJCE →
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubScreen('metricas')}
              className="bg-[#0B111E] hover:bg-[#101829] p-4 text-left transition-colors min-h-[82px]"
            >
              <span className="text-[11px] text-slate-400 block">
                Taxa de Alvarás / Liberdade
              </span>
              <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5 block">
                84,6%
              </span>
              <span className="text-[11px] text-slate-400">
                Alvarás & Cautelares →
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubScreen('agenda')}
              className="bg-[#0B111E] hover:bg-[#101829] p-4 text-left transition-colors min-h-[82px]"
            >
              <span className="text-[11px] text-slate-400 block">
                Prazos Fatais (48h)
              </span>
              <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-blue-400 mt-0.5 block">
                {openDeadlines.length}
              </span>
              <span className="text-[11px] text-slate-400">
                {perms.canValidate ? 'Assinatura OAB ativa' : 'Supervisionado'}
              </span>
            </button>
          </div>

          {/* Filtro por Sócio Responsável + Abertura Direta na War Room */}
          <section className="rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Dossiês Vivos por Sócio Responsável ({filteredCases.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filtre por atuação ou abra qualquer dossiê diretamente na War Room.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060B14] border border-slate-800">
                  {(
                    [
                      { id: 'todos', label: 'Todos' },
                      { id: 'Dr. Ramon Ribeiro', label: 'Dr. Ramon Ribeiro' },
                      { id: 'Dra. Jéssica', label: 'Dra. Jéssica' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCasePartnerFilter(p.id)}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        casePartnerFilter === p.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {perms.canCreateCase && (
                  <button
                    type="button"
                    onClick={() => setIntakeModalOpen(true)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Cadastro Rápido (Modal)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-800/80">
              {filteredCases.slice(0, 4).map((c) => {
                const has318 = Boolean(
                  c.children &&
                    /sim|filh|menor|crianç|gestant|pcd|defici[eê]nc|dependente/i.test(
                      c.children
                    )
                );
                return (
                  <div
                    key={c.id}
                    className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <span className="font-bold text-white">{c.assistido}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono-tabular text-xs text-amber-400">
                          {c.situacao}
                        </span>
                        {has318 && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-[11px] font-semibold text-amber-300">
                              Alerta Art. 318 CPP
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2">
                        <span className="font-mono-tabular">{c.processo}</span>
                        <span>·</span>
                        <span>{c.varaComarca}</span>
                        {c.assignedTo && (
                          <>
                            <span>·</span>
                            <span className="text-blue-300">{c.assignedTo}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenWarRoom(c.id, c.defaultModule, 'ficha')}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <span>Abrir na War Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

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

          {/* Radar Rápido do Dashboard: Agenda/Prazos + Notícias Penais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Próximos Prazos & Audiências (RN / CE)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubScreen('agenda')}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  Abrir Agenda →
                </button>
              </div>
              <div className="divide-y divide-slate-800/80">
                {agendaList.slice(0, 3).map((ag) => (
                  <div
                    key={ag.id}
                    className="py-2.5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div
                        className={`font-semibold truncate ${
                          ag.completed
                            ? 'line-through text-slate-500'
                            : 'text-slate-100'
                        }`}
                      >
                        {ag.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {ag.tribunal} · {ag.comarca} · Resp.: {ag.responsible}
                      </div>
                    </div>
                    <span className="font-mono-tabular text-[11px] text-amber-400 shrink-0">
                      {ag.dateLabel} {ag.timeLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">
                    Notícias & Atualizações Penais
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubScreen('agenda')}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  Ver todas →
                </button>
              </div>
              <div className="divide-y divide-slate-800/80">
                {newsList.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.tribunal} · {item.statuteRef}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAnalyzeNewsWithAgent(item)}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 shrink-0"
                    >
                      Consultar IA
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mapa Arquitetônico 3D Interativo do Fluxo Criminal */}
          <CriminalFlowMap3D
            cases={cases}
            forumDocs={forumDocs}
            rolePermissions={perms}
            initialStageId={initialStageId}
            onNavigateToStage={handleNavigateFrom3DMap}
            onOpenControlGovernance={() => onOpenControlSubTab('governanca')}
          />

          {/* Cérebro Jurídico IA (Documentos, Áudios & Interação) */}
          <div ref={agentSectionRef}>
            <CriminalAgentPanel
              activeCase={cases[0]}
              activeClient={selectedClient}
              knowledgeItems={knowledgeList}
              onKnowledgeAdded={(item) =>
                setKnowledgeList((prev) => [item, ...prev])
              }
              onKnowledgeRemoved={(id) =>
                setKnowledgeList((prev) => prev.filter((k) => k.id !== id))
              }
              initialPrompt={agentPromptDraft}
              initialJurisdiction={agentJurisdictionDraft}
              onSendToForum={onSendToForum}
              onNotify={onNotify}
            />
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-TELA: CADASTRO DE CLIENTES, LINHA DO TEMPO & PONTOS IMPORTANTES
      ==================================================================== */}
      {activeSubScreen === 'clientes' && (
        <ClientRegistryPanel
          clients={clientsList}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
          onClientCreated={(created) =>
            setClientsList((prev) => [created, ...prev])
          }
          onClientUpdated={(updated) =>
            setClientsList((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            )
          }
          onConsultAgentWithClient={handleConsultAgentWithClient}
          onOpenWarRoom={onOpenWarRoom}
          onNotify={onNotify}
        />
      )}

      {/* ===================================================================
          SUB-TELA 2: NOTÍCIAS, ATUALIZAÇÕES, AGENDA & PRAZOS (RN & CE)
      ==================================================================== */}
      {activeSubScreen === 'agenda' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Agenda Forense, Prazos Fatais & Atualizações Penais
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoramento integrado para TJRN (RN), TJCE (CE), STJ e STF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060B14] border border-slate-800">
                {(
                  [
                    { id: 'todos', label: 'Todos Sócios' },
                    { id: 'Ramon', label: 'Dr. Ramon' },
                    { id: 'Jéssica', label: 'Dra. Jéssica' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAgendaPartnerFilter(p.id)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      agendaPartnerFilter === p.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060B14] border border-slate-800 overflow-x-auto no-scrollbar">
                {(['ALL', 'TJRN', 'TJCE', 'STJ', 'STF'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTribunalFilter(t)}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      tribunalFilter === t
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'ALL' ? 'Todos' : t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Coluna Agenda & Prazos */}
            <section className="lg:col-span-6 rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    Agenda & Prazos ({openDeadlines.length} em aberto)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewDeadlineForm((s) => !s)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Prazo</span>
                </button>
              </div>

              {showNewDeadlineForm && (
                <form
                  onSubmit={handleCreateDeadline}
                  className="p-4 bg-[#060B14] border-b border-slate-800 space-y-3"
                >
                  <input
                    type="text"
                    value={newDeadlineTitle}
                    onChange={(e) => setNewDeadlineTitle(e.target.value)}
                    placeholder="Ex.: Memoriais Art. 403 §3º — 7ª Vara Natal"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#0B111E] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newDeadlineAssistido}
                      onChange={(e) => setNewDeadlineAssistido(e.target.value)}
                      placeholder="Assistido (sigla)"
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-[#0B111E] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={newDeadlineTribunal}
                      onChange={(e) =>
                        setNewDeadlineTribunal(
                          e.target.value as 'TJRN' | 'TJCE' | 'STJ'
                        )
                      }
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-[#0B111E] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="TJRN">TJRN (RN)</option>
                      <option value="TJCE">TJCE (CE)</option>
                      <option value="STJ">STJ</option>
                    </select>
                    <input
                      type="text"
                      value={newDeadlineDate}
                      onChange={(e) => setNewDeadlineDate(e.target.value)}
                      placeholder="Hoje · 17:00"
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-[#0B111E] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewDeadlineForm(false)}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="min-h-[38px] px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
                    >
                      Salvar na Agenda
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-slate-800/80">
                {filteredAgenda.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-start justify-between gap-3 hover:bg-slate-900/40 transition-colors"
                  >
                    <label className="flex items-start gap-3 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleDeadline(item.id)}
                        className="mt-1 w-4 h-4 accent-emerald-500 rounded shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div
                          className={`text-xs sm:text-sm font-bold ${
                            item.completed
                              ? 'line-through text-slate-500'
                              : 'text-white'
                          }`}
                        >
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-2">
                          <span className="font-mono-tabular text-blue-400">
                            {item.tribunal}
                          </span>
                          <span>·</span>
                          <span>{item.comarca}</span>
                          <span>·</span>
                          <span>Resp.: {item.responsible}</span>
                        </div>
                      </div>
                    </label>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono-tabular text-xs font-bold block ${
                          item.completed
                            ? 'text-slate-500'
                            : item.urgency === 'critica'
                            ? 'text-red-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {item.dateLabel}
                      </span>
                      <span className="font-mono-tabular text-[11px] text-slate-400">
                        {item.timeLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Coluna Notícias & Atualizações */}
            <section className="lg:col-span-6 rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">
                    Notícias & Atualizações Criminais ({filteredNews.length})
                  </h4>
                </div>
                <span className="text-[11px] font-mono-tabular text-slate-400">
                  CP · Extravagantes · RN/CE
                </span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {filteredNews.map((item) => (
                  <article key={item.id} className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular font-bold text-amber-400">
                          {item.tribunal}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-blue-300 font-semibold">
                          {item.category}
                        </span>
                      </div>
                      <span className="font-mono-tabular text-slate-500">
                        {item.publishedAt}
                      </span>
                    </div>

                    <h5 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {item.title}
                    </h5>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono-tabular text-[11px] text-slate-500">
                        {item.statuteRef}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAnalyzeNewsWithAgent(item)}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#060B14] hover:bg-[#131D33] border border-slate-800 hover:border-blue-500/40 text-[11px] font-semibold text-blue-300 flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Analisar com Agente IA</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
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

            <div className="flex flex-col lg:flex-row gap-2.5">
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
                    { id: 'Dr. Ramon Ribeiro', label: 'Dr. Ramon' },
                    { id: 'Dra. Jéssica', label: 'Dra. Jéssica' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCasePartnerFilter(p.id)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      casePartnerFilter === p.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060B14] border border-slate-800 overflow-x-auto no-scrollbar shrink-0">
                {(
                  [
                    { id: 'todos', label: 'Todas Urgências' },
                    { id: 'critica', label: 'Urgentes' },
                    { id: 'monitorada', label: 'Execução' },
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
                  setCasePartnerFilter('todos');
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
                  className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors"
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
                          <span className="text-blue-300">Resp.: {c.assignedTo}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenWarRoom(c.id, c.defaultModule, 'agente_lex')}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-blue-500/40 text-xs font-semibold text-blue-300 flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Doutor LEX</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenWarRoom(c.id, c.defaultModule, 'ficha')}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <span>Abrir Dossiê Vivo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
                  ? 'Revise minutas, abra o painel de leitura estática ou assine com sua OAB.'
                  : 'Abra minutas para preparação de audiência ou solicite revisão ao advogado responsável.'}
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
                      <span>Abrir Modo Fórum</span>
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

      {/* Modal de Cadastro Completo de Novo Assistido (Art. 318 CPP) */}
      {intakeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cadastro Completo de Novo Assistido"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <form
            onSubmit={(e) => handleModalCreateCase(e, true)}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0B111E] border border-slate-800 shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Cadastro Completo de Novo Assistido
                </h3>
                <p className="text-xs text-slate-400">
                  Qualificação civil, unidade prisional, PJe/SEEU e gatilho automático Art. 318 CPP.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIntakeModalOpen(false)}
                aria-label="Fechar modal"
                className="min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-300">
                    Nome Completo do Assistido *
                  </span>
                  <input
                    type="text"
                    required
                    value={intakeName}
                    onChange={(e) => setIntakeName(e.target.value)}
                    placeholder="Ex.: Lucas Gabriel Ferreira"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-300">
                    CPF (Mascarado / LGPD)
                  </span>
                  <input
                    type="text"
                    value={intakeCpf}
                    onChange={(e) => setIntakeCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm font-mono-tabular text-white focus:outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-300">
                    Nº do Processo (PJe / SEEU)
                  </span>
                  <input
                    type="text"
                    value={intakeProcess}
                    onChange={(e) => setIntakeProcess(e.target.value)}
                    placeholder="0800000-00.2026.8.20.0001"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm font-mono-tabular text-white focus:outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-300">
                    Vara Criminal / Comarca
                  </span>
                  <input
                    type="text"
                    value={intakeVara}
                    onChange={(e) => setIntakeVara(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-300">
                    Unidade Prisional
                  </span>
                  <input
                    type="text"
                    value={intakePrisonUnit}
                    onChange={(e) => setIntakePrisonUnit(e.target.value)}
                    placeholder="Ex.: Central de Flagrantes / CDP Parnamirim"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-300">
                    Tipificação / Imputação *
                  </span>
                  <input
                    type="text"
                    required
                    value={intakeImputacao}
                    onChange={(e) => setIntakeImputacao(e.target.value)}
                    placeholder="Ex.: Art. 33, Lei 11.343/06"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-300">
                    Situação Cautelar
                  </span>
                  <select
                    value={intakeSituacao}
                    onChange={(e) =>
                      setIntakeSituacao(
                        e.target.value as CaseRecord['situacao']
                      )
                    }
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Preso em Flagrante">Preso em Flagrante</option>
                    <option value="Preventiva">Preventiva</option>
                    <option value="Liberdade Provisória">Liberdade Provisória</option>
                    <option value="Regime Fechado (SEEU)">Regime Fechado (SEEU)</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-300">
                    Sócio Responsável
                  </span>
                  <select
                    value={intakeAssignedTo}
                    onChange={(e) =>
                      setIntakeAssignedTo(
                        e.target.value as 'Dr. Ramon Ribeiro' | 'Dra. Jéssica'
                      )
                    }
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Dr. Ramon Ribeiro">Dr. Ramon Ribeiro</option>
                    <option value="Dra. Jéssica">Dra. Jéssica</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-300">
                    Art. 318 CPP (Filhos &lt; 12 / Gestação / PcD)
                  </span>
                  <select
                    value={intakeChildren}
                    onChange={(e) => setIntakeChildren(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Não informado">Não informado / Não possui</option>
                    <option value="Sim (1 filho menor de 12 anos)">
                      Sim · 1 filho &lt; 12 anos
                    </option>
                    <option value="Sim (2 filhos menores de 12 anos)">
                      Sim · 2 filhos &lt; 12 anos
                    </option>
                    <option value="Gestante / Lactante (Art. 318, IV)">
                      Gestante / Lactante
                    </option>
                    <option value="Dependente PcD (Art. 318, III/V)">
                      Dependente PcD
                    </option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-300">
                    Endereço / Comprovante de Residência
                  </span>
                  <input
                    type="text"
                    value={intakeResidence}
                    onChange={(e) => setIntakeResidence(e.target.value)}
                    placeholder="Endereço e comprovante"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              {intakeHasArt318 && (
                <div
                  role="status"
                  className="rounded-xl bg-amber-950/35 border border-amber-500/45 p-3.5 flex items-start gap-2.5 text-xs"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block">
                      Alerta Prioritário · Prisão Domiciliar (Art. 318 CPP)
                    </span>
                    <span className="text-slate-200">
                      Critério identificado ({intakeChildren}). Pedido prioritário
                      de substituição domiciliar será habilitado na War Room.
                    </span>
                  </div>
                </div>
              )}

              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-300">
                  Síntese Fática Inicial
                </span>
                <textarea
                  rows={3}
                  value={intakeSummary}
                  onChange={(e) => setIntakeSummary(e.target.value)}
                  placeholder="Circunstâncias da prisão, eventuais nulidades e vínculos..."
                  className="w-full p-3 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </label>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIntakeModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={intakeSubmitting}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {intakeSubmitting
                      ? 'Cadastrando...'
                      : 'Cadastrar e Abrir na War Room'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
