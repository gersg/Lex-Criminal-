import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppView,
  CaseRecord,
  ClientRecord,
  ControlPanelSubTab,
  DashboardSnapshot,
  ForumDocument,
  GovernanceConfig,
  KnowledgeBaseItem,
  RbacRole,
  TeamMember,
  UserSession,
  WarModuleId,
  WarRoomTabId,
} from './types/lex';
import {
  DEFAULT_GOVERNANCE,
  INITIAL_CASES,
  INITIAL_CLIENTS,
  INITIAL_FORUM_DOC,
  INITIAL_KNOWLEDGE_ITEMS,
  INITIAL_TEAM,
  ROLE_META,
} from './data/mockCases';
import { HomeScreen } from './components/HomeScreen';
import { AuthScreen } from './components/AuthScreen';
import { UserHomeScreen } from './components/UserHomeScreen';
import { UserProfileScreen } from './components/UserProfileScreen';
import { WarRoomScreen } from './components/WarRoomScreen';
import { ControlPanelScreen } from './components/ControlPanelScreen';
import { OverviewScreen } from './components/OverviewScreen';
import { NewClientScreen } from './components/NewClientScreen';
import { ForumModeScreen } from './components/ForumModeScreen';
import { CriminalJusticeStageId } from './components/CriminalFlowMap3D';
import { isValidStoredSession } from './utils/authHelpers';
import {
  ArrowLeft,
  Gavel,
  Home,
  Landmark,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Menu,
  MessageCircleHeart,
  Mic,
  Scale,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';

const STORAGE_KEYS = {
  session: 'lexramon_session_v4',
  cases: 'lexramon_cases_v4',
  docs: 'lexramon_docs_v4',
  governance: 'lexramon_gov_v4',
  team: 'lexramon_team_v4',
};

const VIEW_TO_HASH: Record<AppView, string> = {
  'user-home': '#/homepage-usuario',
  'war-room': '#/war-room',
  'painel-controle': '#/painel-controle',
  'visao-geral': '#/visao-geral',
  'novo-assistido': '#/novo-assistido',
  'modo-forum': '#/modo-forum',
  'perfil-usuario': '#/perfil-usuario',
};

const HASH_TO_VIEW: Record<string, AppView> = {
  '#/homepage-usuario': 'user-home',
  '#/war-room': 'war-room',
  '#/painel-controle': 'painel-controle',
  '#/visao-geral': 'visao-geral',
  '#/novo-assistido': 'novo-assistido',
  '#/modo-forum': 'modo-forum',
  '#/perfil-usuario': 'perfil-usuario',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadValidatedSession(): UserSession | null {
  const candidate = loadFromStorage<unknown>(STORAGE_KEYS.session, null);
  if (isValidStoredSession(candidate)) {
    return candidate as UserSession;
  }
  try {
    localStorage.removeItem(STORAGE_KEYS.session);
  } catch {}
  return null;
}

function syncUrlHash(hash: string) {
  if (typeof window === 'undefined') return;
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() =>
    loadValidatedSession()
  );
  const [publicScreen, setPublicScreen] = useState<'home' | 'login'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#/login') {
      return 'login';
    }
    return 'home';
  });
  const [viewingPublicHome, setViewingPublicHome] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#/') {
      return true;
    }
    return false;
  });
  const [loginPreselectedRole, setLoginPreselectedRole] =
    useState<RbacRole>('escritorio');
  const [postLoginStageId, setPostLoginStageId] = useState<
    CriminalJusticeStageId | undefined
  >(undefined);
  const [postLoginView, setPostLoginView] = useState<AppView>('user-home');

  const [cases, setCases] = useState<CaseRecord[]>(() =>
    loadFromStorage<CaseRecord[]>(STORAGE_KEYS.cases, INITIAL_CASES)
  );
  const [clientsList, setClientsList] = useState<ClientRecord[]>(INITIAL_CLIENTS);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeBaseItem[]>(
    INITIAL_KNOWLEDGE_ITEMS
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() =>
    loadFromStorage<TeamMember[]>(STORAGE_KEYS.team, INITIAL_TEAM)
  );
  const [forumDocs, setForumDocs] = useState<ForumDocument[]>(() =>
    loadFromStorage<ForumDocument[]>(STORAGE_KEYS.docs, [INITIAL_FORUM_DOC])
  );
  const [governance, setGovernance] = useState<GovernanceConfig>(() =>
    loadFromStorage<GovernanceConfig>(STORAGE_KEYS.governance, DEFAULT_GOVERNANCE)
  );

  const [activeView, setActiveView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const matched = HASH_TO_VIEW[window.location.hash];
      if (matched) return matched;
    }
    return 'user-home';
  });
  const [controlSubTab, setControlSubTab] =
    useState<ControlPanelSubTab>('governanca');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    () => cases[0]?.id ?? INITIAL_CASES[0].id
  );
  const [activeModule, setActiveModule] = useState<WarModuleId>('custodia');
  const [activeWarRoomTab, setActiveWarRoomTab] =
    useState<WarRoomTabId>('ficha');
  const [activeForumDocId, setActiveForumDocId] = useState<string>(
    () => forumDocs[0]?.id ?? INITIAL_FORUM_DOC.id
  );
  const [whatsappCount, setWhatsappCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  }, []);

  // Persist workspace state (respeitando preferência de dispositivo compartilhado)
  useEffect(() => {
    try {
      if (session && session.rememberSession !== false) {
        localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEYS.session);
      }
    } catch {}
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.cases, JSON.stringify(cases));
    } catch {}
  }, [cases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.team, JSON.stringify(teamMembers));
    } catch {}
  }, [teamMembers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.docs, JSON.stringify(forumDocs));
    } catch {}
  }, [forumDocs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.governance, JSON.stringify(governance));
    } catch {}
  }, [governance]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) return;
        const data = (await res.json()) as DashboardSnapshot;
        if (cancelled) return;
        if (Array.isArray(data.clients) && data.clients.length > 0) {
          setClientsList(data.clients);
        }
        if (Array.isArray(data.knowledge) && data.knowledge.length > 0) {
          setKnowledgeList(data.knowledge);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Guarded URL Hash Sync (Browser Back/Forward + Deep-Link Protection)
  useEffect(() => {
    const applyHashRoute = () => {
      const hash = window.location.hash;

      if (!session) {
        const protectedView = HASH_TO_VIEW[hash];
        if (protectedView) {
          setPostLoginView(protectedView);
          setPublicScreen('login');
          syncUrlHash('#/login');
          return;
        }
        if (hash === '#/login') {
          setPublicScreen('login');
        } else {
          setPublicScreen('home');
        }
        return;
      }

      // Usuário autenticado
      if (hash === '#/login') {
        setViewingPublicHome(false);
        setActiveView('user-home');
        syncUrlHash('#/homepage-usuario');
        return;
      }
      if (hash === '#/') {
        setViewingPublicHome(true);
        return;
      }
      const targetView = HASH_TO_VIEW[hash];
      if (targetView) {
        setViewingPublicHome(false);
        setActiveView(targetView);
        return;
      }
      // Padrão para sessão ativa: Homepage do Usuário
      setViewingPublicHome(false);
      setActiveView('user-home');
      syncUrlHash('#/homepage-usuario');
    };

    applyHashRoute();
    window.addEventListener('hashchange', applyHashRoute);
    return () => window.removeEventListener('hashchange', applyHashRoute);
  }, [session]);

  // Workspace navigation helpers
  const navigateTo = useCallback((view: AppView) => {
    setViewingPublicHome(false);
    setActiveView(view);
    setMobileMenuOpen(false);
    syncUrlHash(VIEW_TO_HASH[view]);
    window.scrollTo(0, 0);
  }, []);

  const handleGoLogin = (options?: {
    preselectedRole?: RbacRole;
    preselectedModule?: WarModuleId;
  }) => {
    if (session) {
      if (options?.preselectedModule) {
        setPostLoginStageId(options.preselectedModule);
      }
      navigateTo('user-home');
      return;
    }
    if (options?.preselectedRole) {
      setLoginPreselectedRole(options.preselectedRole);
    }
    if (options?.preselectedModule) {
      setActiveModule(options.preselectedModule);
      setPostLoginStageId(options.preselectedModule);
    } else {
      setPostLoginStageId(undefined);
    }
    setPostLoginView('user-home');
    setPublicScreen('login');
    syncUrlHash('#/login');
    window.scrollTo(0, 0);
  };

  const handleAuthenticate = (newSession: UserSession) => {
    const perms = ROLE_META[newSession.role].permissions;
    let destinationView: AppView = postLoginView || 'user-home';
    if (destinationView === 'painel-controle' && !perms.canViewControlPanel) {
      destinationView = 'user-home';
    } else if (destinationView === 'visao-geral' && !perms.canViewOverview) {
      destinationView = 'user-home';
    } else if (destinationView === 'novo-assistido' && !perms.canCreateCase) {
      destinationView = 'user-home';
    }

    setSession(newSession);
    if (newSession.comarca && newSession.comarca.trim()) {
      setGovernance((prev) => ({
        ...prev,
        comarcaPadrao: newSession.comarca!.trim(),
      }));
    }
    setPublicScreen('home');
    setViewingPublicHome(false);
    setMobileMenuOpen(false);
    setActiveView(destinationView);
    setPostLoginView('user-home');
    syncUrlHash(VIEW_TO_HASH[destinationView]);
    window.scrollTo(0, 0);
    showToast(
      `Bem-vindo(a), ${newSession.name} · Perfil ${ROLE_META[newSession.role].shortLabel}`
    );
  };

  const handleLogout = () => {
    setSession(null);
    setPublicScreen('home');
    setViewingPublicHome(false);
    setActiveView('user-home');
    setPostLoginView('user-home');
    setPostLoginStageId(undefined);
    setMobileMenuOpen(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.session);
    } catch {}
    syncUrlHash('#/');
    window.scrollTo(0, 0);
    showToast('Sessão encerrada com segurança');
  };

  const handleSwitchRole = (role: RbacRole) => {
    if (!session) return;
    const defaultPersona = ROLE_META[role].defaultUser;
    setSession({
      ...session,
      role,
      name: defaultPersona.name,
      email: defaultPersona.email,
      oab: defaultPersona.oab,
    });
    const perms = ROLE_META[role].permissions;
    if (activeView === 'painel-controle' && !perms.canViewControlPanel) {
      setActiveView('user-home');
    } else if (activeView === 'visao-geral' && !perms.canViewOverview) {
      setActiveView('user-home');
    }
    showToast(`Perfil alternado para: ${ROLE_META[role].shortLabel}`);
  };

  const handleOpenWarRoom = (
    caseId: string,
    moduleId: WarModuleId,
    tabId?: WarRoomTabId
  ) => {
    setSelectedCaseId(caseId);
    setActiveModule(moduleId);
    setActiveWarRoomTab(tabId ?? 'preparo');
    navigateTo('war-room');
  };

  const handleOpenControlSubTab = (tab: ControlPanelSubTab) => {
    setControlSubTab(tab);
    navigateTo('painel-controle');
  };

  const handleSaveNewCase = (newCase: CaseRecord, openDirectly: boolean) => {
    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
    setActiveModule(newCase.defaultModule);
    setActiveWarRoomTab('ficha');
    showToast(`Assistido "${newCase.assistido}" cadastrado com sucesso`);
    if (openDirectly) {
      navigateTo('war-room');
    } else if (session && ROLE_META[session.role].permissions.canViewControlPanel) {
      navigateTo('painel-controle');
    } else {
      navigateTo('user-home');
    }
  };

  const handleUpdateCase = (updated: CaseRecord) => {
    setCases((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleAssignCase = (caseId: string, assigneeName: string) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, assignedTo: assigneeName } : c))
    );
    showToast(`Caso delegado para ${assigneeName}`);
  };

  const handleUpdateTeamMember = (
    memberId: string,
    patch: Partial<Pick<TeamMember, 'role' | 'active'>>
  ) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, ...patch } : m))
    );
    showToast('Permissões da equipe atualizadas');
  };

  const handleSendToForum = (
    draft: Omit<ForumDocument, 'id' | 'status' | 'updatedAt'>
  ) => {
    const newDoc: ForumDocument = {
      ...draft,
      id: `doc-${Date.now()}`,
      status: 'rascunho',
      updatedAt: new Date().toISOString(),
    };
    setForumDocs((prev) => [newDoc, ...prev]);
    setActiveForumDocId(newDoc.id);
    showToast('Peça enviada ao Modo Fórum para revisão e sustentação');
    navigateTo('modo-forum');
  };

  const handleUpdateDocContent = (docId: string, content: string) => {
    setForumDocs((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, content, updatedAt: new Date().toISOString() } : d
      )
    );
  };

  const handleValidateDoc = (docId: string) => {
    if (!session || !ROLE_META[session.role].permissions.canValidate) {
      showToast('Validação final requer perfil Escritório ou Advogado');
      return;
    }
    const nowIso = new Date().toISOString();
    setForumDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'validado',
              validatedBy: session.name,
              validatedOab: session.oab,
              validatedAt: nowIso,
              updatedAt: nowIso,
            }
          : d
      )
    );
    showToast(`Peça validada e assinada por ${session.name} (${session.oab})`);
  };

  const handleRequestReview = (docId: string) => {
    if (!session) return;
    const nowIso = new Date().toISOString();
    setForumDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'revisao_solicitada',
              reviewRequestedBy: `${session.name} (${session.oab})`,
              updatedAt: nowIso,
            }
          : d
      )
    );
    showToast('Solicitação de revisão OAB enviada ao advogado responsável');
  };

  // ---------------------------------------------------------------------------
  // RENDER: Public Screens (Homepage com Animação 3D & Login Segmentado)
  // ---------------------------------------------------------------------------
  if (!session || viewingPublicHome) {
    return (
      <>
        {!session && publicScreen === 'login' ? (
          <AuthScreen
            initialRole={loginPreselectedRole}
            onAuthenticate={handleAuthenticate}
            onBackHome={() => {
              setPublicScreen('home');
              syncUrlHash('#/');
              window.scrollTo(0, 0);
            }}
          />
        ) : (
          <HomeScreen
            hasActiveSession={Boolean(session)}
            onOpenUserHome={() => navigateTo('user-home')}
            onGoLogin={handleGoLogin}
          />
        )}
        <ToastBanner message={toastMsg} />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Logged-in Workspace (Homepage do Usuário + Sub-telas por Permissão)
  // ---------------------------------------------------------------------------
  const perms = ROLE_META[session.role].permissions;

  const allNavItems: {
    id: AppView;
    label: string;
    icon: React.FC<{ className?: string }>;
    allowed: boolean;
  }[] = [
    {
      id: 'user-home',
      label: 'Homepage do Usuário',
      icon: Home,
      allowed: true,
    },
    {
      id: 'war-room',
      label: 'War Room',
      icon: Siren,
      allowed: true,
    },
    {
      id: 'painel-controle',
      label: 'Painel de Controle',
      icon: SlidersHorizontal,
      allowed: perms.canViewControlPanel,
    },
    {
      id: 'visao-geral',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      allowed: perms.canViewOverview,
    },
    {
      id: 'novo-assistido',
      label:
        session.role === 'estudante'
          ? 'Triagem APF (Estudo)'
          : 'Novo Assistido (APF)',
      icon: UserPlus,
      allowed: perms.canCreateCase,
    },
    {
      id: 'modo-forum',
      label: 'Modo Fórum',
      icon: Gavel,
      allowed: true,
    },
    {
      id: 'perfil-usuario',
      label: 'Minha Conta & Permissões',
      icon: UserCheck,
      allowed: true,
    },
  ];

  const visibleNav = allNavItems.filter((item) => item.allowed);

  const topbarTitles: Record<AppView, string> = {
    'user-home': `Homepage · ${ROLE_META[session.role].shortLabel}`,
    'war-room': 'War Room · Dossiê Vivo Caso a Caso',
    'painel-controle': 'Painel de Controle · Governança & Equipe',
    'visao-geral': 'Visão Geral · Métricas & Jornada',
    'novo-assistido': 'Novo Assistido · Leitura de APF',
    'modo-forum': 'Modo Fórum · Leitura Estática & Curadoria OAB',
    'perfil-usuario': 'Minha Conta · Permissões RBAC',
  };

  const isViewPermitted =
    (activeView !== 'painel-controle' || perms.canViewControlPanel) &&
    (activeView !== 'visao-geral' || perms.canViewOverview);

  return (
    <div className="min-h-screen w-full bg-[#060B14] text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex w-64 shrink-0 flex-col justify-between bg-[#0C1424] border-r border-slate-800/80 p-3">
        <div className="space-y-5">
          {/* Header Sidebar */}
          <div className="h-12 px-2 flex items-center justify-between border-b border-slate-800/80 pb-3">
            <button
              type="button"
              onClick={() => navigateTo('user-home')}
              className="flex items-center gap-2.5 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-base text-white">
                LEX<span className="text-amber-400">RAMON</span>
              </span>
            </button>
            <span className="font-mono-tabular text-[11px] text-blue-400">
              {ROLE_META[session.role].shortLabel}
            </span>
          </div>

          {/* Navegação filtrada por permissão */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-500">
              Navegação & Sub-telas
            </div>
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors whitespace-nowrap ${
                    isActive
                      ? item.id === 'war-room'
                        ? 'bg-red-600/15 text-white border border-red-500/40'
                        : 'bg-blue-600/15 text-white border border-blue-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-[#131D33]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      item.id === 'war-room'
                        ? 'text-red-400'
                        : isActive
                        ? 'text-blue-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Atalhos Rápidos das Sub-telas War Room */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-500">
              Sub-telas War Room
            </div>
            <button
              type="button"
              onClick={() => handleOpenWarRoom(selectedCaseId, 'aij')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#131D33] transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>AIJ & Memoriais Orais</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenWarRoom(selectedCaseId, 'tribunais')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#131D33] transition-colors"
            >
              <Landmark className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>STJ/STF & Execução Penal</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenWarRoom(selectedCaseId, 'tradutor')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#131D33] transition-colors"
            >
              <MessageCircleHeart className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Tradutor WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Bottom Session & Role Switcher */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <button
            type="button"
            onClick={() => navigateTo('perfil-usuario')}
            className="w-full px-2 py-1.5 rounded-xl hover:bg-[#131D33] text-left transition-colors space-y-0.5"
          >
            <div className="text-xs font-semibold text-slate-100 truncate">
              {session.name}
            </div>
            <div className="font-mono-tabular text-[11px] text-amber-400">
              {session.oab} · {ROLE_META[session.role].shortLabel}
            </div>
          </button>

          <div className="space-y-1 px-1">
            <span className="text-[10px] font-medium text-slate-500 block px-1">
              Alternar Nível de Acesso
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['escritorio', 'autonomo', 'estudante'] as RbacRole[]).map(
                (r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSwitchRole(r)}
                    className={`py-1 px-1 rounded-md text-[10px] font-semibold transition-colors ${
                      session.role === r
                        ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40'
                        : 'bg-[#060B14] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ROLE_META[r].shortLabel}
                  </button>
                )
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Sair para Homepage</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0C1424] border-r border-slate-800 p-4 flex flex-col justify-between z-50">
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-base text-white">
                  LEX<span className="text-amber-400">RAMON</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {visibleNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                        isActive
                          ? 'bg-blue-600/20 text-white border border-blue-500/40'
                          : 'text-slate-300 hover:bg-[#131D33]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-medium text-slate-400 block px-1">
                  Alternar Perfil RBAC
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['escritorio', 'autonomo', 'estudante'] as RbacRole[]).map(
                    (r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          handleSwitchRole(r);
                          setMobileMenuOpen(false);
                        }}
                        className={`min-h-[40px] px-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                          session.role === r
                            ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40'
                            : 'bg-[#060B14] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {ROLE_META[r].shortLabel}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="text-xs text-slate-200 font-semibold truncate">
                {session.name} · {session.oab}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full min-h-[44px] py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-300 flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair para Homepage</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Contextual (52px no mobile para respeitar 15% sticky cap) */}
        <header className="no-print sticky top-0 z-30 h-[52px] lg:h-14 shrink-0 px-3 sm:px-6 border-b border-slate-800/80 bg-[#0C1424]/95 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-h-[44px] min-w-[44px] -ml-1 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-900"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xs sm:text-base font-bold text-white truncate">
              {topbarTitles[activeView]}
            </h1>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>{governance.comarcaPadrao}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {session.role !== 'estudante' && (
              <div className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-[#060B14] border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSwitchRole('escritorio')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    session.role === 'escritorio'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dr. Ramon
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchRole('autonomo')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    session.role === 'autonomo'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dra. Jéssica
                </button>
              </div>
            )}

            {activeView !== 'user-home' && (
              <button
                type="button"
                onClick={() => navigateTo('user-home')}
                className="hidden sm:flex min-h-[38px] px-3 py-1.5 rounded-lg bg-[#060B14] border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>Homepage</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigateTo('perfil-usuario')}
              aria-label="Minha Conta e Permissões"
              className="lg:hidden min-h-[40px] min-w-[40px] px-2.5 rounded-lg bg-[#060B14] border border-slate-800 text-[11px] font-mono-tabular font-semibold text-blue-400 flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateTo('novo-assistido')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {session.role === 'estudante'
                  ? 'Triagem APF'
                  : 'Novo Assistido'}
              </span>
            </button>
          </div>
        </header>

        {/* Active Screen Viewport (Espaço inferior extra no mobile para Bottom Tab Bar) */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {!isViewPermitted ? (
              <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto">
                <Lock className="w-8 h-8 text-amber-400 mx-auto" />
                <h2 className="font-display text-xl font-bold text-white">
                  Sub-tela Restrita para o Perfil{' '}
                  {ROLE_META[session.role].shortLabel}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Esta área administrativa requer alçada de Advogado(a) ou
                  Escritório Criminal. Retorne à sua Homepage para acessar os
                  módulos habilitados.
                </p>
                <button
                  type="button"
                  onClick={() => navigateTo('user-home')}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Ir para Homepage do Usuário</span>
                </button>
              </div>
            ) : (
              <>
                {activeView === 'user-home' && (
                  <UserHomeScreen
                    session={session}
                    cases={cases}
                    clients={clientsList}
                    knowledgeItems={knowledgeList}
                    onClientsChange={setClientsList}
                    onKnowledgeChange={setKnowledgeList}
                    forumDocs={forumDocs}
                    governance={governance}
                    whatsappCount={whatsappCount}
                    initialStageId={postLoginStageId}
                    onNavigate={navigateTo}
                    onCreateCase={handleSaveNewCase}
                    onOpenWarRoom={handleOpenWarRoom}
                    onOpenControlSubTab={handleOpenControlSubTab}
                    onSelectForumDoc={setActiveForumDocId}
                    onValidateDoc={handleValidateDoc}
                    onRequestReview={handleRequestReview}
                    onSendToForum={handleSendToForum}
                    onNotify={showToast}
                  />
                )}

                {activeView === 'war-room' && (
                  <WarRoomScreen
                    session={session}
                    cases={cases}
                    clients={clientsList}
                    knowledgeItems={knowledgeList}
                    selectedCaseId={selectedCaseId}
                    activeModule={activeModule}
                    activeTab={activeWarRoomTab}
                    governance={governance}
                    userRole={session.role}
                    onSelectCase={setSelectedCaseId}
                    onSelectModule={setActiveModule}
                    onSelectTab={setActiveWarRoomTab}
                    onUpdateCase={handleUpdateCase}
                    onKnowledgeAdded={(item) =>
                      setKnowledgeList((prev) => [item, ...prev])
                    }
                    onKnowledgeRemoved={(id) =>
                      setKnowledgeList((prev) =>
                        prev.filter((k) => k.id !== id)
                      )
                    }
                    onSendToForum={handleSendToForum}
                    onWhatsappGenerated={() => setWhatsappCount((c) => c + 1)}
                    onNotify={showToast}
                  />
                )}

                {activeView === 'painel-controle' && (
                  <ControlPanelScreen
                    session={session}
                    cases={cases}
                    teamMembers={teamMembers}
                    governance={governance}
                    activeSubTab={controlSubTab}
                    onChangeSubTab={setControlSubTab}
                    onUpdateGovernance={setGovernance}
                    onAssignCase={handleAssignCase}
                    onUpdateTeamMember={handleUpdateTeamMember}
                    onOpenWarRoom={handleOpenWarRoom}
                    onOpenNewClient={() => navigateTo('novo-assistido')}
                    onNotify={showToast}
                  />
                )}

                {activeView === 'visao-geral' && (
                  <OverviewScreen
                    cases={cases}
                    forumDocs={forumDocs}
                    whatsappCount={whatsappCount}
                    onJumpToWarModule={(mod) =>
                      handleOpenWarRoom(selectedCaseId, mod)
                    }
                  />
                )}

                {activeView === 'novo-assistido' && (
                  <NewClientScreen
                    onSaveCase={handleSaveNewCase}
                    onBack={() => navigateTo('user-home')}
                  />
                )}

                {activeView === 'modo-forum' && (
                  <ForumModeScreen
                    session={session}
                    documents={forumDocs}
                    activeDocId={activeForumDocId}
                    onSelectDoc={setActiveForumDocId}
                    onUpdateDocContent={handleUpdateDocContent}
                    onValidateDoc={handleValidateDoc}
                    onRequestReview={handleRequestReview}
                    onNotify={showToast}
                  />
                )}

                {activeView === 'perfil-usuario' && (
                  <UserProfileScreen
                    session={session}
                    onUpdateSession={setSession}
                    onSwitchRole={handleSwitchRole}
                    onLogout={handleLogout}
                    onNotify={showToast}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Fixed Thumb-Zone Bottom Tab Bar (Mobile-First < 1024px) */}
      <nav
        aria-label="Navegação rápida mobile"
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 h-15 pb-safe bg-[#0C1424]/95 border-t border-slate-800 grid grid-cols-4 items-center"
      >
        {(
          [
            { id: 'user-home' as AppView, label: 'Início', icon: Home },
            { id: 'war-room' as AppView, label: 'War Room', icon: Siren },
            { id: 'modo-forum' as AppView, label: 'Fórum', icon: Gavel },
            perms.canViewControlPanel
              ? {
                  id: 'painel-controle' as AppView,
                  label: 'Painel',
                  icon: SlidersHorizontal,
                }
              : {
                  id: 'novo-assistido' as AppView,
                  label: 'Triagem',
                  icon: UserPlus,
                },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateTo(tab.id)}
              className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                active
                  ? tab.id === 'war-room'
                    ? 'text-red-400'
                    : 'text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <ToastBanner message={toastMsg} />
    </div>
  );
}

function ToastBanner({ message }: { message: string | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 lg:bottom-5 left-4 right-4 sm:left-auto sm:right-5 z-50 px-4 py-2.5 rounded-xl bg-[#0C1424] border border-emerald-500/45 text-xs font-medium text-emerald-300 shadow-2xl flex items-center gap-2 pointer-events-none transition-opacity duration-200 ${
        message ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="truncate">{message ?? ''}</span>
    </div>
  );
}
