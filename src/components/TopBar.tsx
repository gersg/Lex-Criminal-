import React from 'react';
import { STAGES } from '../data/stages';
import {
  Compass,
  LayoutDashboard,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface TopBarProps {
  currentStage: number;
  isAutoPlay: boolean;
  audioEnabled: boolean;
  isDrawerCollapsed: boolean;
  onSelectStage: (stageId: number) => void;
  onToggleAutoPlay: () => void;
  onToggleAudio: () => void;
  onToggleDrawer: () => void;
  onResetCamera: () => void;
  onBackToWorkspace: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentStage,
  isAutoPlay,
  audioEnabled,
  isDrawerCollapsed,
  onSelectStage,
  onToggleAutoPlay,
  onToggleAudio,
  onToggleDrawer,
  onResetCamera,
  onBackToWorkspace,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
      {/* Brand Wordmark */}
      <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-xl bg-[#0B111E]/94 border border-amber-500/25 shadow-xl">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-display font-extrabold text-sm shrink-0">
          LR
        </div>
        <div className="flex items-baseline gap-2.5 whitespace-nowrap shrink-0">
          <h1 className="font-display font-bold text-base sm:text-lg tracking-wider text-amber-400">
            LEXRAMON
          </h1>
          <span className="hidden sm:inline text-xs text-slate-400">
            Arquitetura Criminal 3D
          </span>
        </div>
      </div>

      {/* Segmented Stage Stepper */}
      <nav
        aria-label="Etapas da arquitetura"
        className="pointer-events-auto order-3 xl:order-2 w-full xl:w-auto flex items-center justify-start xl:justify-center overflow-x-auto"
      >
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0B111E]/94 border border-slate-800 shadow-xl">
          {STAGES.map((stage) => {
            const active = currentStage === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onSelectStage(stage.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <span className="font-mono-tabular text-[11px] opacity-80">
                  {stage.id}.
                </span>
                <span>{stage.stepLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Action Controls */}
      <div className="pointer-events-auto order-2 xl:order-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleAutoPlay}
          title="Alternar Tour Automático"
          className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            isAutoPlay
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
              : 'bg-[#0B111E]/94 border-slate-800 text-slate-200 hover:border-amber-500/40'
          }`}
        >
          {isAutoPlay ? (
            <Pause className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Play className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden md:inline">
            {isAutoPlay ? 'Pausar Tour' : 'Tour Guiado'}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleAudio}
          title={audioEnabled ? 'Silenciar áudio' : 'Ativar feedback sonoro'}
          className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 bg-[#0B111E]/94 border border-slate-800 text-slate-200 hover:border-amber-500/40 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {audioEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden md:inline">Áudio</span>
        </button>

        <button
          type="button"
          onClick={onResetCamera}
          title="Restaurar visão panorâmica 3D"
          className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 bg-[#0B111E]/94 border border-slate-800 text-slate-200 hover:border-amber-500/40 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Visão Geral</span>
        </button>

        <button
          type="button"
          onClick={onToggleDrawer}
          title={isDrawerCollapsed ? 'Mostrar painel narrativo (H)' : 'Modo Cinema: ocultar painel (H)'}
          className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 bg-[#0B111E]/94 border border-slate-800 text-slate-200 hover:border-amber-500/40 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {isDrawerCollapsed ? (
            <PanelRightOpen className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <PanelRightClose className="w-3.5 h-3.5 text-slate-300" />
          )}
          <span className="hidden sm:inline">
            {isDrawerCollapsed ? 'Painel' : 'Ocultar'}
          </span>
        </button>

        <button
          type="button"
          onClick={onBackToWorkspace}
          className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>App Funcional</span>
        </button>
      </div>
    </header>
  );
};
