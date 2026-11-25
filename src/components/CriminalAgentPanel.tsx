import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileAudio,
  FileText,
  Gavel,
  Loader2,
  MapPin,
  Mic,
  Plus,
  RotateCcw,
  Scale,
  Send,
  Sparkles,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AgentChatTurn,
  AgentFocusArea,
  CaseRecord,
  ClientRecord,
  CriminalAgentResponse,
  ForumDocument,
  JurisdictionRegion,
  KnowledgeBaseItem,
  KnowledgeItemKind,
} from '../types/lex';
import { INITIAL_KNOWLEDGE_ITEMS } from '../data/mockCases';

interface CriminalAgentPanelProps {
  activeCase?: CaseRecord;
  activeClient?: ClientRecord;
  knowledgeItems?: KnowledgeBaseItem[];
  onKnowledgeAdded?: (item: KnowledgeBaseItem) => void;
  onKnowledgeRemoved?: (id: string) => void;
  initialPrompt?: string;
  initialJurisdiction?: JurisdictionRegion;
  initialHistory?: AgentChatTurn[];
  onHistoryChange?: (turns: AgentChatTurn[]) => void;
  hideKnowledgeSidebar?: boolean;
  onSaveToOralStatement?: (text: string) => void;
  onSendToForum?: (
    draft: Omit<ForumDocument, 'id' | 'status' | 'updatedAt'>
  ) => void;
  onNotify?: (msg: string) => void;
  compact?: boolean;
}

const QUICK_PROMPTS: {
  label: string;
  jurisdiction: JurisdictionRegion;
  focusArea: AgentFocusArea;
  prompt: string;
}[] = [
  {
    label: 'Analisar Nulidades do Dossiê',
    jurisdiction: 'RN_CE',
    focusArea: 'custodia',
    prompt:
      'Cruze a linha do tempo forense, os documentos/áudios indexados e os Pontos Importantes deste dossiê. Liste as contradições fáticas, nulidades absolutas/relativas (Art. 158-A, Art. 226, Art. 240 CPP, Tema 280 STF) e pedidos em cascata.',
  },
  {
    label: 'Perguntas aos Policiais / Testemunhas',
    jurisdiction: 'RN_CE',
    focusArea: 'custodia',
    prompt:
      'Elabore perguntas objetivas de contradita e cross-examination para os policiais condutores e testemunhas de acusação em audiência (AIJ/Custódia), focando nas divergências de horário, iluminação, câmera corporal e cadeia de custódia.',
  },
  {
    label: 'Teses em Leis Extravagantes',
    jurisdiction: 'RN_CE',
    focusArea: 'extravagantes',
    prompt:
      'Estruture teses defensivas avançadas em Leis Extravagantes (Lei 11.343/06 Art. 33 §4º, Lei 12.850/13, Estatuto do Desarmamento, LEP/SEEU) com jurisprudência atualizada do STJ, STF, TJRN e TJCE aplicável ao caso.',
  },
  {
    label: 'Gerar Mensagem para Família',
    jurisdiction: 'RN_CE',
    focusArea: 'geral',
    prompt:
      'Redija uma mensagem humana, clara, sem juridiquês e acolhedora para enviar via WhatsApp aos familiares do(a) assistido(a), explicando a situação atual do processo e os próximos passos da defesa.',
  },
];

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? '');
      const commaIdx = raw.indexOf(',');
      resolve(commaIdx >= 0 ? raw.slice(commaIdx + 1) : raw);
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo local.'));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CriminalAgentPanel: React.FC<CriminalAgentPanelProps> = ({
  activeCase,
  activeClient,
  knowledgeItems: externalKnowledge,
  onKnowledgeAdded,
  onKnowledgeRemoved,
  initialPrompt,
  initialJurisdiction = 'RN_CE',
  initialHistory,
  onHistoryChange,
  hideKnowledgeSidebar = false,
  onSaveToOralStatement,
  onSendToForum,
  onNotify,
  compact = false,
}) => {
  const [jurisdiction, setJurisdiction] =
    useState<JurisdictionRegion>(initialJurisdiction);
  const [focusArea, setFocusArea] = useState<AgentFocusArea>('geral');
  const [prompt, setPrompt] = useState(
    initialPrompt ??
      'Analise os documentos, áudios e a linha do tempo do dossiê para indicar nulidades prioritárias e teses defensivas (CP, Extravagantes, TJRN/TJCE).'
  );
  const [attachCase, setAttachCase] = useState(Boolean(activeCase));
  const [attachClient, setAttachClient] = useState(Boolean(activeClient));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<AgentChatTurn[]>(
    () => initialHistory ?? activeCase?.chatHistory ?? []
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Knowledge Base state (synced with prop or local fallback)
  const [localKnowledge, setLocalKnowledge] = useState<KnowledgeBaseItem[]>(
    externalKnowledge ?? INITIAL_KNOWLEDGE_ITEMS
  );
  const items = externalKnowledge ?? localKnowledge;

  const [selectedKbIds, setSelectedKbIds] = useState<string[]>(() =>
    (externalKnowledge ?? INITIAL_KNOWLEDGE_ITEMS).map((k) => k.id)
  );
  const [expandedKbId, setExpandedKbId] = useState<string | null>(null);

  // Multimodal Ingest state (Document / Audio / Live Microphone)
  const [showIngestForm, setShowIngestForm] = useState(false);
  const [ingestKind, setIngestKind] = useState<KnowledgeItemKind>('documento');
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestText, setIngestText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    fileName: string;
    mimeType: string;
    base64Data?: string;
    textContent?: string;
  } | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);

  // Live audio recording via MediaRecorder
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    setJurisdiction(initialJurisdiction);
  }, [initialJurisdiction]);

  useEffect(() => {
    if (activeClient) {
      setAttachClient(true);
    }
  }, [activeClient]);

  useEffect(() => {
    setAttachCase(Boolean(activeCase));
    setChatHistory(initialHistory ?? activeCase?.chatHistory ?? []);
    setErrorMsg(null);
  }, [activeCase?.id]);

  useEffect(() => {
    if (!externalKnowledge) {
      (async () => {
        try {
          const res = await fetch('/api/knowledge');
          if (!res.ok) return;
          const data = (await res.json()) as { items: KnowledgeBaseItem[] };
          if (Array.isArray(data.items)) {
            setLocalKnowledge(data.items);
            setSelectedKbIds(data.items.map((k) => k.id));
          }
        } catch {}
      })();
    }
  }, [externalKnowledge]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const toggleKnowledgeSelection = (id: string) => {
    setSelectedKbIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIngestError(null);

    if (!ingestTitle.trim()) {
      setIngestTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    }

    const isAudio =
      file.type.startsWith('audio/') ||
      /\.(mp3|wav|ogg|webm|m4a|aac|flac)$/i.test(file.name);
    if (isAudio) {
      setIngestKind('audio');
    } else {
      setIngestKind('documento');
    }

    const isPlainText =
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      /\.(txt|md|csv|json)$/i.test(file.name);

    if (isPlainText && !isAudio) {
      const txt = await file.text();
      setSelectedFile({
        fileName: file.name,
        mimeType: file.type || 'text/plain',
        textContent: txt,
      });
      setIngestText(txt.slice(0, 6000));
    } else {
      const b64 = await fileToBase64(file);
      const fallbackMime = isAudio ? 'audio/mp3' : 'application/pdf';
      setSelectedFile({
        fileName: file.name,
        mimeType: file.type || fallbackMime,
        base64Data: b64,
      });
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    try {
      setIngestError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const base64Data = await fileToBase64(blob);
        const fileName = `gravacao_parlatorio_${Date.now()}.${
          mimeType.includes('webm') ? 'webm' : 'm4a'
        }`;
        setIngestKind('audio');
        if (!ingestTitle.trim()) {
          setIngestTitle(
            activeClient
              ? `Áudio Parlatório · ${activeClient.name.split(' ')[0]}`
              : 'Gravação de Voz Jurídica'
          );
        }
        setSelectedFile({
          fileName,
          mimeType,
          base64Data,
        });
        onNotify?.('Áudio capturado! Clique em "Indexar no Cérebro IA" para transcrever.');
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingSec(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSec((s) => s + 1);
      }, 1000);
    } catch {
      setIngestError(
        'Não foi possível acessar o microfone. Você também pode enviar um arquivo MP3, WAV, M4A ou OGG.'
      );
    }
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngestError(null);
    if (ingestTitle.trim().length < 3) {
      setIngestError('Informe um título identificador (mínimo 3 caracteres).');
      return;
    }

    if (!selectedFile?.base64Data && ingestText.trim().length < 10) {
      setIngestError(
        'Anexe um arquivo (PDF, imagem, áudio), grave um áudio ou cole o texto do documento.'
      );
      return;
    }

    setIsIngesting(true);
    try {
      const res = await fetch('/api/knowledge/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ingestTitle.trim(),
          kind: ingestKind,
          mimeType:
            selectedFile?.mimeType ??
            (ingestKind === 'audio' ? 'audio/webm' : 'text/plain'),
          fileName:
            selectedFile?.fileName ??
            (ingestKind === 'audio' ? 'audio_nota.webm' : 'nota_juridica.txt'),
          base64Data: selectedFile?.base64Data,
          textContent: selectedFile?.textContent ?? ingestText.trim(),
          clientId: activeClient?.id,
          caseId: activeCase?.id,
        }),
      });

      const payload = (await res.json()) as {
        item?: KnowledgeBaseItem;
        error?: string;
      };

      if (!res.ok || !payload.item) {
        setIngestError(
          payload.error || 'Erro ao indexar material na Base de Conhecimento.'
        );
        return;
      }

      const created = payload.item;
      if (onKnowledgeAdded) {
        onKnowledgeAdded(created);
      } else {
        setLocalKnowledge((prev) => [created, ...prev]);
      }
      setSelectedKbIds((prev) => [created.id, ...prev]);
      setExpandedKbId(created.id);
      setIngestTitle('');
      setIngestText('');
      setSelectedFile(null);
      setShowIngestForm(false);
      onNotify?.(
        created.kind === 'audio'
          ? 'Áudio transcrito e incorporado ao Cérebro IA'
          : 'Documento analisado e incorporado ao Cérebro IA'
      );
    } catch {
      setIngestError('Falha de rede ao enviar material para o Cérebro IA.');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onKnowledgeRemoved) {
          onKnowledgeRemoved(id);
        } else {
          setLocalKnowledge((prev) => prev.filter((k) => k.id !== id));
        }
        setSelectedKbIds((prev) => prev.filter((item) => item !== id));
        onNotify?.('Item removido da Base de Conhecimento');
      }
    } catch {}
  };

  const handleSubmitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 5) {
      setErrorMsg('Digite pelo menos 5 caracteres para consultar o Cérebro IA.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    const userTurn: AgentChatTurn = {
      id: `turn-u-${Date.now()}`,
      role: 'user',
      text: cleanPrompt,
      createdAt: new Date().toISOString(),
    };

    try {
      const caseContext =
        attachCase && activeCase
          ? `${activeCase.assistido} | Processo: ${activeCase.processo} | Vara/Comarca: ${activeCase.varaComarca} | Imputação: ${activeCase.imputacao} | Situação: ${activeCase.situacao} | Fatos: ${activeCase.resumoFatos}`
          : '';

      const res = await fetch('/api/agent/criminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          jurisdiction,
          focusArea,
          caseId: attachCase && activeCase ? activeCase.id : undefined,
          caseContext,
          clientId: attachClient && activeClient ? activeClient.id : undefined,
          selectedKnowledgeIds: selectedKbIds,
          history: chatHistory.map((h) => ({ role: h.role, text: h.text })),
        }),
      });

      const payload = (await res.json()) as Partial<CriminalAgentResponse> & {
        error?: string;
      };

      if (!res.ok) {
        setErrorMsg(
          payload.error ||
            'Não foi possível obter retorno do Doutor LEX.'
        );
        return;
      }

      if (payload.answer) {
        const modelTurn: AgentChatTurn = {
          id: `turn-m-${Date.now()}`,
          role: 'model',
          text: payload.answer,
          usedKnowledgeTitles: payload.usedKnowledgeTitles,
          createdAt: payload.generatedAt ?? new Date().toISOString(),
        };
        const updatedTurns = [...chatHistory, userTurn, modelTurn];
        setChatHistory(updatedTurns);
        onHistoryChange?.(updatedTurns);
        setPrompt('');
        onNotify?.('Parecer do Doutor LEX gerado com base no dossiê');
      }
    } catch {
      setErrorMsg(
        'Falha de conexão com o backend do Doutor LEX (/api/agent/criminal).'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      onNotify?.('Texto copiado para a área de transferência');
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  return (
    <section className="rounded-2xl bg-[#0B111E] border border-blue-500/30 overflow-hidden">
      {/* Cabeçalho do Motor / Doutor LEX */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-[#0E1627]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Doutor LEX · PhD em Direito Criminal & Leis Extravagantes
            </h3>
            <p className="text-[11px] text-slate-400">
              Cruzamento automático de dossiê, documentos e áudios do caso (CP, Extravagantes, TJRN/TJCE/STJ)
            </p>
          </div>
        </div>

        <span className="font-mono-tabular text-[11px] px-2.5 py-1 rounded-lg bg-[#060B14] border border-slate-800 text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>{selectedKbIds.length} fontes indexadas</span>
        </span>
      </div>

      <div
        className={`p-4 sm:p-5 grid grid-cols-1 ${
          hideKnowledgeSidebar ? '' : 'xl:grid-cols-12'
        } gap-5 items-start`}
      >
        {/* ===================================================================
            COLUNA 1 (5 cols): BASE DE CONHECIMENTO (DOCUMENTOS & ÁUDIOS)
        ==================================================================== */}
        {!hideKnowledgeSidebar && (
        <div className="xl:col-span-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Base de Conhecimento ({items.length})
            </h4>
            <button
              type="button"
              onClick={() => setShowIngestForm((s) => !s)}
              className="min-h-[36px] px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showIngestForm ? 'Fechar Envio' : 'Add Doc / Áudio'}</span>
            </button>
          </div>

          {showIngestForm && (
            <form
              onSubmit={handleIngestSubmit}
              className="p-3.5 rounded-xl bg-[#060B14] border border-amber-500/35 space-y-3"
            >
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIngestKind('documento')}
                  className={`min-h-[36px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border ${
                    ingestKind === 'documento'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#0B111E] text-slate-400 border-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Documento (PDF/TXT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIngestKind('audio')}
                  className={`min-h-[36px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border ${
                    ingestKind === 'audio'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-[#0B111E] text-slate-400 border-slate-800'
                  }`}
                >
                  <FileAudio className="w-3.5 h-3.5" />
                  <span>Áudio / Voz</span>
                </button>
              </div>

              <input
                type="text"
                value={ingestTitle}
                onChange={(e) => setIngestTitle(e.target.value)}
                placeholder={
                  ingestKind === 'audio'
                    ? 'Ex.: Áudio Parlatório ou Oitiva Testemunha'
                    : 'Ex.: APF Natal/RN ou Acórdão TJCE'
                }
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex-1 min-h-[40px] px-3 py-2 rounded-lg bg-[#0B111E] hover:bg-[#131D33] border border-dashed border-slate-700 cursor-pointer text-xs text-slate-200 flex items-center justify-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {selectedFile
                      ? selectedFile.fileName
                      : ingestKind === 'audio'
                      ? 'Selecionar Áudio (MP3, WAV, M4A, OGG)'
                      : 'Selecionar Arquivo (PDF, TXT, PNG/JPG)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp,.mp3,.wav,.ogg,.webm,.m4a,.aac"
                    onChange={handleFilePick}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                    isRecording
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-[#0B111E] hover:bg-[#131D33] text-amber-300 border-slate-700'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Parar ({recordingSec}s)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Gravar Voz</span>
                    </>
                  )}
                </button>
              </div>

              {ingestKind === 'documento' && (
                <textarea
                  rows={3}
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  placeholder="Ou cole aqui trechos do APF, denúncia, acórdão ou anotações do caso..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              )}

              {ingestError && (
                <div
                  role="alert"
                  className="p-2.5 rounded-lg bg-red-950/50 border border-red-500/40 text-[11px] text-red-200"
                >
                  {ingestError}
                </div>
              )}

              <button
                type="submit"
                disabled={isIngesting}
                className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                {isIngesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {ingestKind === 'audio'
                        ? 'Transcrevendo áudio e indexando...'
                        : 'Analisando documento no Cérebro IA...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Brain className="w-3.5 h-3.5" />
                    <span>Indexar no Cérebro IA</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Lista de Documentos & Áudios na Base */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scroll pr-1">
            {items.map((kb) => {
              const checked = selectedKbIds.includes(kb.id);
              const expanded = expandedKbId === kb.id;
              return (
                <div
                  key={kb.id}
                  className={`rounded-xl border transition-colors ${
                    checked
                      ? 'bg-[#0E1627] border-blue-500/40'
                      : 'bg-[#060B14] border-slate-800/90 opacity-75'
                  }`}
                >
                  <div className="p-3 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleKnowledgeSelection(kb.id)}
                      aria-label={`Ativar fonte ${kb.title}`}
                      className="mt-1 w-4 h-4 accent-blue-500 rounded shrink-0 cursor-pointer"
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            kb.kind === 'audio'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-blue-500/15 text-blue-300'
                          }`}
                        >
                          {kb.kind === 'audio' ? (
                            <FileAudio className="w-3 h-3" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          <span>
                            {kb.kind === 'audio' ? 'ÁUDIO' : 'DOCUMENTO'}
                          </span>
                        </span>

                        <span className="font-mono-tabular text-[10px] text-slate-500">
                          {formatBytes(kb.sizeBytes)}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-white leading-snug">
                        {kb.title}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {kb.summary}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedKbId(expanded ? null : kb.id)
                          }
                          className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          {expanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Ocultar extrato</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Ver transcrição e pontos</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteKnowledge(kb.id)}
                          title="Remover da base"
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {expanded && (
                    <div className="px-3 pb-3 pt-2 border-t border-slate-800/80 space-y-2 text-[11px]">
                      <div>
                        <span className="font-semibold text-amber-400 block mb-1">
                          Pontos-Chave Indexados:
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                          {kb.keyPoints.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-300 block mb-1">
                          {kb.kind === 'audio'
                            ? 'Transcrição:'
                            : 'Extrato do Documento:'}
                        </span>
                        <p className="p-2 rounded-lg bg-[#060B14] border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {kb.transcriptOrExtract}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* ===================================================================
            COLUNA 2 (7 cols): INTERAÇÃO COM O DOUTOR LEX (CONVERSA & PARECER)
        ==================================================================== */}
        <div className={hideKnowledgeSidebar ? 'space-y-4' : 'xl:col-span-7 space-y-4'}>
          {/* Filtros de Jurisdição e Especialidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-400" />
                <span>Jurisdição de Atuação</span>
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'RN', label: 'TJRN (RN)' },
                    { id: 'CE', label: 'TJCE (CE)' },
                    { id: 'RN_CE', label: 'RN & CE' },
                    { id: 'STJ_STF', label: 'STJ / STF' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setJurisdiction(item.id)}
                    className={`min-h-[38px] px-2 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                      jurisdiction === item.id
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-[#060B14] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Scale className="w-3 h-3 text-amber-400" />
                <span>Eixo Temático</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {(
                  [
                    { id: 'geral', label: 'Geral' },
                    { id: 'custodia', label: 'Custódia' },
                    { id: 'extravagantes', label: 'Extravag.' },
                    { id: 'rn_ce', label: 'RN / CE' },
                    { id: 'execucao_seeu', label: 'SEEU/LEP' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFocusArea(item.id)}
                    className={`min-h-[38px] px-2 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                      focusArea === item.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-[#060B14] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prompts Rápidos */}
          {!compact && (
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  type="button"
                  onClick={() => {
                    setJurisdiction(qp.jurisdiction);
                    setFocusArea(qp.focusArea);
                    setPrompt(qp.prompt);
                  }}
                  className="min-h-[34px] px-3 py-1 rounded-lg bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-[11px] text-slate-300 transition-colors"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          )}

          {/* Histórico Conversacional com o Cérebro IA */}
          {chatHistory.length > 0 && (
            <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scroll pr-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  Interação Ativa ({Math.ceil(chatHistory.length / 2)} troca(s))
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setChatHistory([]);
                    onHistoryChange?.([]);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar conversa</span>
                </button>
              </div>

              {chatHistory.map((turn) =>
                turn.role === 'user' ? (
                  <div
                    key={turn.id}
                    className="ml-6 rounded-xl bg-[#131D33] border border-blue-500/30 p-3 text-xs text-slate-100"
                  >
                    <span className="text-[10px] font-bold text-blue-400 block mb-1">
                      ADVOGADO(A)
                    </span>
                    {turn.text}
                  </div>
                ) : (
                  <div
                    key={turn.id}
                    className="rounded-xl bg-[#060B14] border border-slate-800 p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5" />
                        <span>DOUTOR LEX · PARECER CRIMINALISTA</span>
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(turn.id, turn.text)}
                          className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#0B111E] hover:bg-[#131D33] border border-slate-800 text-[11px] text-slate-200 flex items-center gap-1"
                        >
                          {copiedId === turn.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>
                            {copiedId === turn.id ? 'Copiado' : 'Copiar'}
                          </span>
                        </button>

                        {onSaveToOralStatement && (
                          <button
                            type="button"
                            onClick={() => onSaveToOralStatement(turn.text)}
                            className="min-h-[32px] px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Salvar na Sustentação</span>
                          </button>
                        )}

                        {onSendToForum && (
                          <button
                            type="button"
                            onClick={() =>
                              onSendToForum({
                                caseId: activeCase?.id ?? 'case-01',
                                assistido:
                                  activeClient?.name ??
                                  activeCase?.assistido ??
                                  'Parecer Doutor LEX',
                                moduleId:
                                  focusArea === 'custodia'
                                    ? 'custodia'
                                    : focusArea === 'execucao_seeu'
                                    ? 'tribunais'
                                    : 'aij',
                                title: `Parecer Doutor LEX (${jurisdiction})`,
                                subtitle: `Dossiê Vivo · ${focusArea}`,
                                content: turn.text,
                              })
                            }
                            className="min-h-[32px] px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center gap-1"
                          >
                            <Gavel className="w-3 h-3" />
                            <span>Modo Fórum</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {turn.usedKnowledgeTitles &&
                      turn.usedKnowledgeTitles.length > 0 && (
                        <div className="text-[10px] text-slate-400">
                          Fontes consultadas:{' '}
                          <span className="text-blue-300">
                            {turn.usedKnowledgeTitles.join(' · ')}
                          </span>
                        </div>
                      )}

                    <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {turn.text}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Formulário de Interação */}
          <form onSubmit={handleSubmitChat} className="space-y-3">
            <textarea
              rows={compact ? 3 : 4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pergunte ao Doutor LEX sobre o dossiê, documentos e áudios anexados, contradições de depoimentos, Leis Extravagantes ou teses no RN/CE..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500 leading-relaxed"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                {activeClient && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachClient}
                      onChange={(e) => setAttachClient(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>
                      Cliente:{' '}
                      <strong className="text-amber-300">
                        {activeClient.name}
                      </strong>
                    </span>
                  </label>
                )}

                {activeCase && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachCase}
                      onChange={(e) => setAttachCase(e.target.checked)}
                      className="w-4 h-4 accent-blue-500 rounded"
                    />
                    <span>
                      Caso:{' '}
                      <strong className="text-white">
                        {activeCase.assistido}
                      </strong>
                    </span>
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Consultando Doutor LEX...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {chatHistory.length > 0
                        ? 'Continuar Interação'
                        : 'Consultar Doutor LEX'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-950/45 border border-red-500/40 text-xs text-red-200 leading-relaxed"
            >
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
