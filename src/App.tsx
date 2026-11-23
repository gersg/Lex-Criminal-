import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppView,
  CaseRecord,
  ForumDocument,
  LexModuleId,
  RbacRole,
  UserSession,
} from './types/lex';
import { INITIAL_CASES, INITIAL_FORUM_DOC, ROLE_META } from './data/mockCases';
import { STAGES } from './data/stages';
import { AuthScreen } from './components/AuthScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { NewClientScreen } from './components/NewClientScreen';
import { LexCriminalScreen } from './components/LexCriminalScreen';
import { ForumModeScreen } from './components/ForumModeScreen';
import { LexScene3D } from './components/LexScene3D';
import { TopBar } from './components/TopBar';
import { NarrativeDrawer } from './components/NarrativeDrawer';
import { playInteractionPing, playStageChime } from './utils/audio';
import {
  Box,
  Brain,
  Gavel,
  LayoutDashboard,
  LogOut,
  Menu,
  Mouse,
  Pointer,
  Search,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';

const STORAGE_KEYS = {
  session: 'lexramon_session_v1',
  cases: 'lexramon_cases_v1',
  docs: 'lexramon_docs_v1',
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

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() =>
    loadFromStorage<UserSession | null>(STORAGE_KEYS.session, null)
  );
  const [cases, setCases] = useState<CaseRecord[]>(() =>
    loadFromStorage<CaseRecord[]>(STORAGE_KEYS.cases, INITIAL_CASES)
  );
  const [forumDocs, setForumDocs] = useState<ForumDocument[]>(() =>
    loadFromStorage<ForumDocument[]>(STORAGE_KEYS.docs, [INITIAL_FORUM_DOC])
  );

  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    () => cases[0]?.id ?? INITIAL_CASES[0].id
  );
  const [activeModule, setActiveModule] = useState<LexModuleId>('custodia');
  const [activeForumDocId, setActiveForumDocId] = useState<string>(
    () => forumDocs[0]?.id ?? INITIAL_FORUM_DOC.id
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // 3D Architecture Explorer states
  const [show3DMode, setShow3DMode] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState<boolean>(false);
  const [cameraResetSignal, setCameraResetSignal] = useState<number>(0);

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

  // Persist workspace data
  useEffect(() => {
    try {
      if (session) {
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
      localStorage.setItem(STORAGE_KEYS.docs, JSON.stringify(forumDocs));
    } catch {}
  }, [forumDocs]);

  // Workspace navigation helpers
  const navigateTo = useCallback((view: AppView) => {
    setShow3DMode(view === 'arquitetura-3d');
    if (view !== 'arquitetura-3d') {
      setActiveView(view);
      setIsAutoPlay(false);
    }
    setMobileMenuOpen(false);
  }, []);

  const handleAuthenticate = (newSession: UserSession) => {
    setSession(newSession);
    setShow3DMode(false);
    setActiveView('dashboard');
    showToast(
      `Sessão iniciada: ${newSession.name} (${ROLE_META[newSession.role].shortLabel})`
    );
  };

  const handleLogout = () => {
    setSession(null);
    setShow3DMode(false);
    setMobileMenuOpen(false);
    showToast('Sessão encerrada com segurança');
  };

  const handleSwitchRole = (role: RbacRole) => {
    if (!session) return;
    setSession({ ...session, role });
    showToast(`Perfil RBAC alternado para: ${ROLE_META[role].label}`);
  };

  const handleOpenModuleFromCase = (caseId: string, moduleId: LexModuleId) => {
    setSelectedCaseId(caseId);
    setActiveModule(moduleId);
    navigateTo('lex-criminal');
  };

  const handleSaveNewCase = (newCase: CaseRecord, openDirectly: boolean) => {
    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
    setActiveModule(newCase.defaultModule);
    showToast(`Assistido "${newCase.assistido}" cadastrado com sucesso`);
    navigateTo(openDirectly ? 'lex-criminal' : 'dashboard');
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
    if (!session || !ROLE_META[session.role].canValidate) {
      showToast('Aprovação final exige perfil Advogado ou Sócio');
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

  // 3D Mode controls
  const goToStage = useCallback(
    (index: number, nodeId: string | null = null) => {
      const clamped = Math.max(0, Math.min(STAGES.length - 1, index));
      setCurrentStage(clamped);
      setSelectedNodeId(nodeId);
      playStageChime(clamped, audioEnabled);
    },
    [audioEnabled]
  );

  const handleNextStage = useCallback(() => {
    setCurrentStage((prev) => {
      const next = prev >= STAGES.length - 1 ? 0 : prev + 1;
      playStageChime(next, audioEnabled);
      return next;
    });
    setSelectedNodeId(null);
  }, [audioEnabled]);

  const handlePrevStage = useCallback(() => {
    setCurrentStage((prev) => {
      if (prev <= 0) return 0;
      const next = prev - 1;
      playStageChime(next, audioEnabled);
      return next;
    });
    setSelectedNodeId(null);
  }, [audioEnabled]);

  const handleSelectNode = useCallback(
    (stageId: number, nodeId: string, label: string) => {
      setIsAutoPlay(false);
      goToStage(stageId, nodeId);
      setIsDrawerCollapsed(false);
      showToast(`Foco: ${label}`);
    },
    [goToStage, showToast]
  );

  const handleOpenFunctionalFrom3D = useCallback(
    (stageId: number) => {
      setIsAutoPlay(false);
      setShow3DMode(false);
      if (stageId === 1) {
        // Abre tela de acesso / RBAC
        setSession(null);
        return;
      }
      if (!session) {
        // Garante acesso imediato caso estivesse explorando 3D antes de logar
        setSession({
          name: 'Dr. Ramon Medeiros',
          oab: 'OAB/RN 14.820',
          role: 'socio',
          lgpdAccepted: true,
          authenticatedAt: new Date().toISOString(),
        });
      }
      if (stageId === 3) setActiveView('lex-criminal');
      else if (stageId === 4) setActiveView('modo-forum');
      else setActiveView('dashboard');
    },
    [session]
  );

  useEffect(() => {
    if (!show3DMode || !isAutoPlay) return;
    const id = window.setInterval(() => {
      setCurrentStage((prev) => {
        const next = prev >= STAGES.length - 1 ? 0 : prev + 1;
        playStageChime(next, audioEnabled);
        return next;
      });
      setSelectedNodeId(null);
    }, 6000);
    return () => window.clearInterval(id);
  }, [show3DMode, isAutoPlay, audioEnabled]);

  useEffect(() => {
    if (!show3DMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        setIsAutoPlay(false);
        handleNextStage();
      } else if (e.key === 'ArrowLeft') {
        setIsAutoPlay(false);
        handlePrevStage();
      } else if (e.key === 'h' || e.key === 'H') {
        setIsDrawerCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [show3DMode, handleNextStage, handlePrevStage]);

  // ---------------------------------------------------------------------------
  // RENDER: 3D Architecture Explorer View
  // ---------------------------------------------------------------------------
  if (show3DMode) {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#070B14] text-slate-100">
        <LexScene3D
          currentStage={currentStage}
          selectedNodeId={selectedNodeId}
          isDrawerCollapsed={isDrawerCollapsed}
          cameraResetSignal={cameraResetSignal}
          onSelectNode={handleSelectNode}
        />

        <TopBar
          currentStage={currentStage}
          isAutoPlay={isAutoPlay}
          audioEnabled={audioEnabled}
          isDrawerCollapsed={isDrawerCollapsed}
          onSelectStage={(id) => {
            setIsAutoPlay(false);
            goToStage(id);
          }}
          onToggleAutoPlay={() => {
            setIsAutoPlay((prev) => {
              const next = !prev;
              showToast(
                next
                  ? 'Tour guiado automático iniciado (6s por etapa)'
                  : 'Tour automático pausado'
              );
              if (next && currentStage === 0) goToStage(1);
              return next;
            });
          }}
          onToggleAudio={() => {
            setAudioEnabled((prev) => {
              const next = !prev;
              if (next) {
                playStageChime(currentStage, true);
                showToast('Feedback sonoro executivo ativado');
              } else {
                showToast('Áudio silenciado');
              }
              return next;
            });
          }}
          onToggleDrawer={() => setIsDrawerCollapsed((c) => !c)}
          onResetCamera={() => {
            setIsAutoPlay(false);
            setSelectedNodeId(null);
            setCurrentStage(0);
            setCameraResetSignal((c) => c + 1);
            playStageChime(0, audioEnabled);
            showToast('Visão panorâmica restaurada');
          }}
          onBackToWorkspace={() => {
            setIsAutoPlay(false);
            setShow3DMode(false);
          }}
        />

        <NarrativeDrawer
          currentStage={currentStage}
          selectedNodeId={selectedNodeId}
          isCollapsed={isDrawerCollapsed}
          audioEnabled={audioEnabled}
          onPrevStage={() => {
            setIsAutoPlay(false);
            handlePrevStage();
          }}
          onNextStage={() => {
            setIsAutoPlay(false);
            handleNextStage();
          }}
          onSelectStage={(id) => {
            setIsAutoPlay(false);
            goToStage(id);
          }}
          onToggleCollapse={() => setIsDrawerCollapsed((c) => !c)}
          onNotify={(msg, freq) => {
            if (freq) playInteractionPing(audioEnabled, freq);
            showToast(msg);
          }}
          onOpenFunctionalScreen={handleOpenFunctionalFrom3D}
        />

        <div className="fixed bottom-5 left-6 z-20 hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-[#0B111E]/90 border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
          <span className="flex items-center gap-1.5">
            <Mouse className="w-3.5 h-3.5 text-amber-400" />
            Arraste para orbitar
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            Scroll para zoom
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="flex items-center gap-1.5">
            <Pointer className="w-3.5 h-3.5 text-amber-400" />
            Clique nos cristais 3D
          </span>
        </div>

        <ToastBanner message={toastMsg} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Screen 1 — OAB Authentication & LGPD Gateway
  // ---------------------------------------------------------------------------
  if (!session) {
    return (
      <>
        <AuthScreen
          onAuthenticate={handleAuthenticate}
          onOpen3DPreview={() => setShow3DMode(true)}
        />
        <ToastBanner message={toastMsg} />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Functional Legal Workspace (Screens 2, 2B, 3, 4)
  // ---------------------------------------------------------------------------
  const navItems: {
    id: AppView;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Painel Executivo', icon: LayoutDashboard },
    { id: 'novo-assistido', label: 'Novo Assistido', icon: UserPlus },
    { id: 'lex-criminal', label: 'Lex Criminal', icon: Brain },
    { id: 'modo-forum', label: 'Modo Fórum', icon: Gavel },
    { id: 'arquitetura-3d', label: 'Arquitetura 3D', icon: Box },
  ];

  const activeTitle =
    navItems.find((n) => n.id === activeView)?.label ?? 'Painel Executivo';

  return (
    <div className="min-h-screen w-full bg-[#070B14] text-slate-100 flex">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between bg-[#090E1A] border-r border-slate-800/80 p-4">
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-display font-extrabold text-sm shrink-0">
              LR
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-wider text-amber-400 block leading-none">
                LEXRAMON
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Advocacia Criminal
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav aria-label="Menu principal" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-slate-950' : 'text-amber-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom RBAC Session & Role Switcher */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="px-2 space-y-0.5">
            <div className="text-xs font-semibold text-slate-100 truncate">
              {session.name}
            </div>
            <div className="font-mono-tabular text-[11px] text-amber-400">
              {session.oab} · {ROLE_META[session.role].shortLabel}
            </div>
          </div>

          {/* Troca rápida de perfil RBAC para testar governança */}
          <div className="space-y-1 px-1">
            <span className="text-[10px] font-medium text-slate-500 block px-1">
              Simular Perfil RBAC
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['socio', 'advogado', 'estagiario'] as RbacRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSwitchRole(r)}
                  className={`py-1 px-1.5 rounded-md text-[10px] font-semibold transition-colors ${
                    session.role === r
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ROLE_META[r].shortLabel}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#090E1A] border-r border-slate-800 p-4 flex flex-col justify-between z-50">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-base text-amber-400">
                  LEXRAMON
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="text-xs text-slate-200 font-semibold">
                {session.name} · {session.oab}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Breadcrumb Bar (Strict Top Bar Contract) */}
        <header className="h-14 shrink-0 border-b border-slate-800/80 bg-[#070B14] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:bg-slate-900"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="text-slate-400">LexRamon</span>
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-slate-100 truncate">
                {activeTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('arquitetura-3d')}
              className="px-3 py-1.5 rounded-lg bg-[#0B111E] border border-slate-800 hover:border-amber-500/40 text-xs font-medium text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <Box className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Mapa 3D</span>
            </button>
          </div>
        </header>

        {/* Active Screen Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeView === 'dashboard' && (
              <DashboardScreen
                session={session}
                cases={cases}
                forumDocs={forumDocs}
                onOpenModule={handleOpenModuleFromCase}
                onOpenNewClient={() => navigateTo('novo-assistido')}
                onOpenForumDoc={(doc) => {
                  setActiveForumDocId(doc.id);
                  navigateTo('modo-forum');
                }}
              />
            )}

            {activeView === 'novo-assistido' && (
              <NewClientScreen
                onSaveCase={handleSaveNewCase}
                onBack={() => navigateTo('dashboard')}
              />
            )}

            {activeView === 'lex-criminal' && (
              <LexCriminalScreen
                cases={cases}
                selectedCaseId={selectedCaseId}
                activeModule={activeModule}
                onSelectCase={setSelectedCaseId}
                onSelectModule={setActiveModule}
                onSendToForum={handleSendToForum}
                onNotify={showToast}
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
                onNotify={showToast}
              />
            )}
          </div>
        </main>
      </div>

      <ToastBanner message={toastMsg} />
    </div>
  );
}

function ToastBanner({ message }: { message: string | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#0B111E] border border-amber-500/45 text-xs font-medium text-amber-300 shadow-2xl flex items-center gap-2 pointer-events-none transition-opacity duration-200 ${
        message ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
      <span>{message ?? ''}</span>
    </div>
  );
}
