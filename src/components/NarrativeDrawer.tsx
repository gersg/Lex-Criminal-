import React, { useEffect, useState } from 'react';
import {
  NODES_3D,
  PANEL_ALERTS,
  RAG_THESES,
  RBAC_PROFILES,
  RbacProfile,
  STAGES,
  StageItem,
} from '../data/stages';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Brain,
  Calculator,
  ChartPie,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  Flame,
  Gavel,
  Gauge,
  IdCard,
  KeyRound,
  Landmark,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Scale,
  Shield,
  Tablet,
  Timer,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

interface NarrativeDrawerProps {
  currentStage: number;
  selectedNodeId: string | null;
  isCollapsed: boolean;
  audioEnabled: boolean;
  onPrevStage: () => void;
  onNextStage: () => void;
  onSelectStage: (stageId: number) => void;
  onToggleCollapse: () => void;
  onNotify: (msg: string, pingFreq?: number) => void;
  onOpenFunctionalScreen: (stageId: number) => void;
}

function renderItemIcon(iconName: StageItem['iconName'], colorClass: string) {
  const cls = `w-4 h-4 ${colorClass} shrink-0`;
  switch (iconName) {
    case 'shield':
      return <Shield className={cls} />;
    case 'gauge':
      return <Gauge className={cls} />;
    case 'brain':
      return <Brain className={cls} />;
    case 'gavel':
      return <Gavel className={cls} />;
    case 'id-card':
      return <IdCard className={cls} />;
    case 'lock':
      return <Lock className={cls} />;
    case 'users':
      return <Users className={cls} />;
    case 'chart':
      return <ChartPie className={cls} />;
    case 'bell':
      return <Bell className={cls} />;
    case 'user-plus':
      return <UserPlus className={cls} />;
    case 'cpu':
      return <Cpu className={cls} />;
    case 'stopwatch':
      return <Timer className={cls} />;
    case 'landmark':
      return <Landmark className={cls} />;
    case 'scale':
      return <Scale className={cls} />;
    case 'calculator':
      return <Calculator className={cls} />;
    case 'tablet':
      return <Tablet className={cls} />;
    case 'user-check':
      return <UserCheck className={cls} />;
    case 'database':
      return <Database className={cls} />;
    default:
      return <Shield className={cls} />;
  }
}

export const NarrativeDrawer: React.FC<NarrativeDrawerProps> = ({
  currentStage,
  selectedNodeId,
  isCollapsed,
  onPrevStage,
  onNextStage,
  onSelectStage,
  onToggleCollapse,
  onNotify,
  onOpenFunctionalScreen,
}) => {
  const stage = STAGES[currentStage] ?? STAGES[0];
  const selectedNode = selectedNodeId
    ? NODES_3D.find((n) => n.id === selectedNodeId)
    : null;

  // Interactive Stage 1: RBAC simulator
  const [rbacId, setRbacId] = useState<RbacProfile['id']>('socio');
  const activeRbac =
    RBAC_PROFILES.find((p) => p.id === rbacId) ?? RBAC_PROFILES[0];

  // Interactive Stage 2: Urgent dashboard alerts
  const [activeAlertId, setActiveAlertId] = useState<string>('custodia');
  const activeAlert =
    PANEL_ALERTS.find((a) => a.id === activeAlertId) ?? PANEL_ALERTS[0];

  // Interactive Stage 3: RAG legal theses
  const [activeThesisId, setActiveThesisId] = useState<string>('tema280');
  const activeThesis =
    RAG_THESES.find((t) => t.id === activeThesisId) ?? RAG_THESES[0];

  // Interactive Stage 4: Modo Fórum Oral Argument Timer & Teleprompter Font Scale
  const [timerSeconds, setTimerSeconds] = useState(900);
  const [timerRunning, setTimerRunning] = useState(false);
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          onNotify('Tempo de sustentação oral encerrado', 880);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, onNotify]);

  const formattedTime = `${String(Math.floor(timerSeconds / 60)).padStart(
    2,
    '0'
  )}:${String(timerSeconds % 60).padStart(2, '0')}`;

  const progressPct = ((currentStage + 1) / STAGES.length) * 100;

  const nextLabel =
    currentStage === 0
      ? 'Iniciar Tour'
      : currentStage === STAGES.length - 1
      ? 'Reiniciar'
      : 'Próxima Etapa';

  if (isCollapsed) {
    return (
      <div className="fixed bottom-5 right-5 z-20">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="px-4 py-2.5 rounded-xl bg-[#0B111E]/95 border border-amber-500/35 text-xs font-semibold text-amber-300 shadow-2xl flex items-center gap-2 hover:border-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <ChevronUp className="w-4 h-4 text-amber-400" />
          <span>Expandir Roteiro · 0{currentStage + 1}/0{STAGES.length}</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Narrativa guiada da etapa"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:top-20 md:w-[410px] z-20 rounded-2xl bg-[#0B111E]/94 border border-amber-500/25 shadow-2xl flex flex-col justify-between max-h-[54vh] md:max-h-none transition-transform duration-300"
    >
      {/* Conteúdo Principal Rolável */}
      <div className="p-5 sm:p-6 overflow-y-auto custom-scroll space-y-4">
        {/* Metadados da Etapa (sem pílulas estáticas) */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold tracking-wide text-amber-400">
            {stage.badge}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="font-mono-tabular text-slate-400">
              0{currentStage + 1} / 0{STAGES.length}
            </span>
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Recolher painel (H)"
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Título & Subtítulo */}
        <div className="space-y-1">
          <h2
            className="font-display text-xl sm:text-2xl font-bold text-white leading-tight"
            style={{ textWrap: 'balance' }}
          >
            {stage.title}
          </h2>
          <p className="text-xs font-medium text-amber-400/90">
            {stage.subtitle}
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {stage.description}
        </p>

        {/* Destaque sutil caso um nó 3D específico tenha sido clicado */}
        {selectedNode && selectedNode.stage === currentStage && (
          <div className="py-2.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs flex items-center justify-between gap-2">
            <div>
              <span className="text-amber-300 font-semibold">
                {selectedNode.label}
              </span>
              <span className="text-slate-400 mx-1.5">·</span>
              <span className="text-slate-300">{selectedNode.shortDesc}</span>
            </div>
          </div>
        )}

        {/* Lista Estruturada de Recursos (Separadores hairline sem cards aninhados) */}
        <div className="divide-y divide-slate-800/80 border-t border-b border-slate-800/80">
          {stage.items.map((item) => (
            <div key={item.title} className="py-3 flex items-start gap-3">
              <div className="mt-0.5">
                {renderItemIcon(item.iconName, item.accentColor)}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-slate-100">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Widget Interativo Contextual da Etapa */}
        <div className="pt-1 space-y-2.5">
          {currentStage === 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200">
                  Núcleo Jurídico Integrado
                </span>
                <span className="font-mono-tabular text-emerald-400">
                  Zero Treinamento Público
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Clique em qualquer cristal 3D da cena ou utilize os atalhos de etapa para inspecionar o fluxo do APF aos tribunais superiores.
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                {STAGES.slice(1).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectStage(s.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-left text-[11px] text-slate-200 transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">{s.stepLabel}</span>
                    <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStage === 1 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Simular Validação RBAC
                </span>
                <span className="text-[10px] font-mono-tabular text-emerald-400 truncate">
                  {activeRbac.statusText}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {RBAC_PROFILES.map((profile) => {
                  const active = profile.id === rbacId;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        setRbacId(profile.id);
                        onNotify(`Perfil simulado: ${profile.statusText}`, 783.99);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-colors ${
                        active
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/35'
                      }`}
                    >
                      {profile.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {activeRbac.permissions}
              </p>
            </div>
          )}

          {currentStage === 2 && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-200">
                Radar de Urgências do Painel
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PANEL_ALERTS.map((alert) => {
                  const selected = alert.id === activeAlertId;
                  const toneStyle =
                    alert.tone === 'crimson'
                      ? selected
                        ? 'bg-red-950/60 border-red-500/60 text-red-200'
                        : 'bg-red-950/30 border-red-500/25 text-red-300'
                      : selected
                      ? 'bg-amber-950/50 border-amber-500/60 text-amber-200'
                      : 'bg-amber-950/25 border-amber-500/25 text-amber-300';

                  return (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => {
                        setActiveAlertId(alert.id);
                        onNotify(`Briefing: ${alert.title}`, 698.46);
                      }}
                      className={`p-2 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-colors text-left ${toneStyle}`}
                    >
                      {alert.tone === 'crimson' ? (
                        <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      ) : (
                        <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="truncate">{alert.title}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {activeAlert.detail}
              </p>
            </div>
          )}

          {currentStage === 3 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-purple-300">
                  Teses Ativas no RAG Jurídico
                </span>
                <span className="font-mono-tabular text-slate-400">
                  {activeThesis.court}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {RAG_THESES.map((thesis) => {
                  const selected = thesis.id === activeThesisId;
                  return (
                    <button
                      key={thesis.id}
                      type="button"
                      onClick={() => {
                        setActiveThesisId(thesis.id);
                        onNotify(`Tese selecionada: ${thesis.label}`, 740);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-colors ${
                        selected
                          ? 'bg-purple-500/20 border-purple-400/60 text-purple-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-purple-400/35'
                      }`}
                    >
                      {thesis.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {activeThesis.summary}
              </p>
            </div>
          )}

          {currentStage === 4 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold text-amber-400">
                    Cronômetro de Sustentação Oral
                  </div>
                  <div className="font-mono-tabular text-xl font-bold text-white">
                    {formattedTime}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning((r) => !r);
                      onNotify(
                        timerRunning
                          ? 'Cronômetro pausado'
                          : 'Cronômetro de sustentação iniciado',
                        880
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {timerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>{timerSeconds < 900 ? 'Retomar' : 'Iniciar'}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSeconds(900);
                    }}
                    title="Resetar cronômetro (15:00)"
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mini Teleprompter Preview */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Prévia do Modo Fórum</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFontScale((s) => (s === 'lg' ? 'md' : 'sm'))
                      }
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[10px]"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFontScale((s) => (s === 'sm' ? 'md' : 'lg'))
                      }
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[10px]"
                    >
                      A+
                    </button>
                  </div>
                </div>
                <p
                  className={`text-slate-200 leading-relaxed transition-all ${
                    fontScale === 'sm'
                      ? 'text-[11px]'
                      : fontScale === 'lg'
                      ? 'text-sm font-medium'
                      : 'text-xs'
                  }`}
                >
                  “Excelência, requer-se o relaxamento da prisão em flagrante ante a ilicitude probatória (Tema 280 STF), com aplicação subsidiária de medidas cautelares diversas.”
                </p>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenFunctionalScreen(currentStage)}
          className="w-full mt-3 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/35 text-xs font-semibold text-amber-300 flex items-center justify-center gap-2 transition-colors"
        >
          <span>
            {currentStage === 1
              ? 'Abrir Tela de Acesso & RBAC'
              : currentStage === 2
              ? 'Abrir Painel Executivo'
              : currentStage === 3
              ? 'Abrir Módulos Lex Criminal'
              : currentStage === 4
              ? 'Abrir Modo Fórum'
              : 'Abrir Aplicativo Funcional'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Rodapé de Navegação Guiada */}
      <div className="px-5 py-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevStage}
          disabled={currentStage === 0}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </button>

        <div
          className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <button
          type="button"
          onClick={onNextStage}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/15 transition-colors whitespace-nowrap shrink-0"
        >
          <span>{nextLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
