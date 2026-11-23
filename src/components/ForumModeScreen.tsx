import React, { useEffect, useRef, useState } from 'react';
import { ForumDocument, UserSession } from '../types/lex';
import { ROLE_META } from '../data/mockCases';
import {
  CheckCircle2,
  Copy,
  Download,
  Lock,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface ForumModeScreenProps {
  session: UserSession;
  documents: ForumDocument[];
  activeDocId: string;
  onSelectDoc: (docId: string) => void;
  onUpdateDocContent: (docId: string, content: string) => void;
  onValidateDoc: (docId: string) => void;
  onNotify: (msg: string) => void;
}

export const ForumModeScreen: React.FC<ForumModeScreenProps> = ({
  session,
  documents,
  activeDocId,
  onSelectDoc,
  onUpdateDocContent,
  onValidateDoc,
  onNotify,
}) => {
  const activeDoc =
    documents.find((d) => d.id === activeDocId) ?? documents[0];

  const [fontSize, setFontSize] = useState<number>(18);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isTeleprompterFocus, setIsTeleprompterFocus] = useState<boolean>(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<0 | 1 | 2>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(900);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const canValidate = ROLE_META[session.role].canValidate;

  // Sustentation timer
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          onNotify('Tempo de sustentação oral encerrado');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, onNotify]);

  // Teleprompter auto-scroll
  useEffect(() => {
    if (autoScrollSpeed === 0 || isEditing) return;
    const id = window.setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += autoScrollSpeed;
      }
    }, 45);
    return () => clearInterval(id);
  }, [autoScrollSpeed, isEditing]);

  const formattedTime = `${String(Math.floor(timerSeconds / 60)).padStart(
    2,
    '0'
  )}:${String(timerSeconds % 60).padStart(2, '0')}`;

  const handleCopy = async () => {
    if (!activeDoc) return;
    try {
      await navigator.clipboard.writeText(activeDoc.content);
      onNotify('Sustentação copiada para área de transferência');
    } catch {
      onNotify('Copie o texto diretamente do modo edição');
    }
  };

  const handleExportTxt = () => {
    if (!activeDoc) return;
    const header = `${activeDoc.title}\n${activeDoc.subtitle}\nStatus: ${
      activeDoc.status === 'validado'
        ? `Validado por ${activeDoc.validatedBy} (${activeDoc.validatedOab})`
        : 'Rascunho'
    }\n----------------------------------------\n\n`;
    const blob = new Blob([header + activeDoc.content], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.assistido
      .toLowerCase()
      .replace(/\s+/g, '_')}_lexramon.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Arquivo .txt exportado para PJe / SEEU');
  };

  if (!activeDoc) {
    return (
      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-8 text-center text-sm text-slate-400">
        Nenhum documento no Modo Fórum. Gere uma peça no Lex Criminal para iniciar.
      </div>
    );
  }

  return (
    <div
      className={
        isTeleprompterFocus
          ? 'fixed inset-0 z-50 bg-[#050811] p-4 sm:p-8 flex flex-col gap-4'
          : 'space-y-5'
      }
    >
      {/* Barra Superior do Modo Fórum */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-amber-400">
            Modo Fórum · Leitura de Alto Contraste & Curadoria OAB
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
            {activeDoc.title}
          </h2>
        </div>

        {/* Seletor de Peça + Foco */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeDoc.id}
            onChange={(e) => onSelectDoc(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0B111E] border border-slate-800 text-xs text-slate-100 max-w-xs focus:outline-none focus:border-amber-500"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.assistido} · {doc.status === 'validado' ? 'Validado' : 'Rascunho'}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsTeleprompterFocus((v) => !v)}
            className="px-3 py-2 rounded-xl bg-[#0B111E] border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            {isTeleprompterFocus ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Sair da Tela Cheia</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Tela Cheia Audiência</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Controles de Teleprompter & Cronômetro */}
      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Cronômetro */}
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block">
              Cronômetro Oral
            </span>
            <span
              className={`font-mono-tabular text-xl font-bold ${
                timerSeconds <= 120 ? 'text-red-400' : 'text-amber-400'
              }`}
            >
              {formattedTime}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
            >
              {timerRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Iniciar</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(900);
              }}
              title="Resetar para 15:00"
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Fonte, Auto-Scroll e Edição */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white"
            >
              A-
            </button>
            <span className="font-mono-tabular text-[11px] text-slate-400 px-1">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(30, s + 2))}
              className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white"
            >
              A+
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <span className="text-[11px] text-slate-400 px-2">Rolagem:</span>
            {([0, 1, 2] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setAutoScrollSpeed(spd)}
                className={`px-2 py-1 rounded text-[11px] font-medium ${
                  autoScrollSpeed === spd
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {spd === 0 ? 'Manual' : spd === 1 ? '1x' : '2x'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsEditing((e) => !e)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isEditing
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isEditing ? 'Concluir Edição' : 'Editar Texto'}
          </button>
        </div>
      </div>

      {/* Área Principal do Teleprompter */}
      <div
        ref={scrollContainerRef}
        className={`rounded-2xl bg-[#050811] border border-slate-800 p-6 sm:p-8 overflow-y-auto custom-scroll ${
          isTeleprompterFocus ? 'flex-1' : 'h-[400px]'
        }`}
      >
        {isEditing ? (
          <textarea
            value={activeDoc.content}
            onChange={(e) => onUpdateDocContent(activeDoc.id, e.target.value)}
            style={{ fontSize: `${fontSize}px` }}
            className="w-full h-full min-h-[320px] bg-transparent text-slate-100 leading-relaxed focus:outline-none resize-none"
          />
        ) : (
          <div
            style={{ fontSize: `${fontSize}px` }}
            className="max-w-3xl mx-auto text-slate-100 leading-relaxed whitespace-pre-wrap font-sans"
          >
            {activeDoc.content}
          </div>
        )}
      </div>

      {/* Barra de Validação Humana Obrigatória (RBAC) & Exportação */}
      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {activeDoc.status === 'validado' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          )}
          <div>
            <div className="text-xs font-semibold text-white">
              {activeDoc.status === 'validado'
                ? `Peça Validada para Protocolo · ${activeDoc.validatedBy} (${activeDoc.validatedOab})`
                : 'Validação Humana Obrigatória Pendente'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeDoc.status === 'validado'
                ? `Registrado em ${new Date(
                    activeDoc.validatedAt ?? activeDoc.updatedAt
                  ).toLocaleString('pt-BR')}`
                : canValidate
                ? `Logado como ${session.name} (${session.oab}). Revise a peça acima antes de liberar para protocolo.`
                : 'Perfil Estagiário: rascunho pronto para revisão. Aprovação final requer Advogado ou Sócio.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            <span>Copiar</span>
          </button>

          <button
            type="button"
            onClick={handleExportTxt}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Exportar .TXT</span>
          </button>

          {activeDoc.status !== 'validado' && (
            <button
              type="button"
              disabled={!canValidate}
              onClick={() => onValidateDoc(activeDoc.id)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {canValidate ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>
                {canValidate
                  ? 'Validar & Assinar OAB'
                  : 'Requer Advogado/Sócio'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
