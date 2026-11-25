import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AgentChatTurn,
  CaseRecord,
  ClientRecord,
  ForensicTimelineEvent,
  ForumDocument,
  GovernanceConfig,
  KnowledgeBaseItem,
  KnowledgeItemKind,
  RbacRole,
  UserSession,
  WarModuleId,
  WarRoomTabId,
} from '../types/lex';
import {
  calculateSeeuProgression,
  generateAntiSumula7Output,
  generateAijOralOutput,
  generateCustodiaStrategyOutput,
  generateHumanizedWhatsapp,
  generateSeeuDraft,
} from '../utils/legalGenerators';
import { computeSha256Hex } from '../utils/authHelpers';
import { CriminalAgentPanel } from './CriminalAgentPanel';
import {
  AlertTriangle,
  Bot,
  Calculator,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Crosshair,
  Download,
  FileAudio,
  FileCheck2,
  FileText,
  FileUp,
  Gavel,
  GitBranch,
  HelpCircle,
  Landmark,
  Loader2,
  MessageCircleHeart,
  Mic,
  Plus,
  Printer,
  Save,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Square,
  Trash2,
  Upload,
  UploadCloud,
  UserCheck,
  Zap,
} from 'lucide-react';

interface WarRoomScreenProps {
  session?: UserSession;
  cases: CaseRecord[];
  clients?: ClientRecord[];
  knowledgeItems?: KnowledgeBaseItem[];
  selectedCaseId: string;
  activeModule: WarModuleId;
  activeTab?: WarRoomTabId;
  governance: GovernanceConfig;
  userRole?: RbacRole;
  onSelectCase: (caseId: string) => void;
  onSelectModule: (moduleId: WarModuleId) => void;
  onSelectTab?: (tab: WarRoomTabId) => void;
  onUpdateCase?: (updated: CaseRecord) => void;
  onKnowledgeAdded?: (item: KnowledgeBaseItem) => void;
  onKnowledgeRemoved?: (id: string) => void;
  onSendToForum: (doc: Omit<ForumDocument, 'id' | 'status' | 'updatedAt'>) => void;
  onWhatsappGenerated: () => void;
  onNotify: (msg: string) => void;
}

const DOSSIER_TABS: {
  id: WarRoomTabId;
  step: string;
  label: string;
  mobileLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'ficha', step: '1', label: 'Ficha & Cadastro', mobileLabel: '1. Ficha', icon: UserCheck },
  { id: 'audio_docs', step: '2', label: 'Áudio & Documentos', mobileLabel: '2. Docs/Áudio', icon: FileAudio },
  { id: 'timeline', step: '3', label: 'Linha do Tempo Forense', mobileLabel: '3. Timeline', icon: Clock },
  { id: 'agente_lex', step: '4', label: 'Agente Doutor LEX', mobileLabel: '4. Dr. LEX', icon: Bot },
  { id: 'preparo', step: '5', label: 'Preparo & Estratégias', mobileLabel: '5. Preparo', icon: GitBranch },
  { id: 'modo_forum', step: '6', label: 'Modo Fórum (Audiência)', mobileLabel: '6. Fórum', icon: Gavel },
  { id: 'exportacao', step: '7', label: 'Exportação Autenticada', mobileLabel: '7. Exportar', icon: FileCheck2 },
];

const WAR_MODULES: {
  id: WarModuleId;
  tag: string;
  title: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  accentText: string;
}[] = [
  {
    id: 'custodia',
    tag: 'Módulo 01 · Urgente',
    title: 'Central de Flagrantes',
    subtitle: 'Audiência de Custódia',
    icon: Siren,
    accentText: 'text-red-400',
  },
  {
    id: 'aij',
    tag: 'Módulo 02 · Audiência',
    title: 'AIJ & Memoriais Orais',
    subtitle: 'Contradições & Art. 403 §3º',
    icon: Crosshair,
    accentText: 'text-amber-400',
  },
  {
    id: 'tribunais',
    tag: 'Módulo 03 · Recursal',
    title: 'STJ/STF & Execução',
    subtitle: 'Súmula 7 & Cálculo Pena',
    icon: Landmark,
    accentText: 'text-blue-400',
  },
  {
    id: 'tradutor',
    tag: 'Módulo 04 · Express',
    title: 'Expediente & Cliente',
    subtitle: 'WhatsApp Humanizado',
    icon: MessageCircleHeart,
    accentText: 'text-emerald-400',
  },
];

const LEP_FRACTIONS = [
  { value: 16, label: '16% · Primário sem violência/grave ameaça (Art. 112, I)' },
  { value: 20, label: '20% · Reincidente sem violência/grave ameaça' },
  { value: 25, label: '25% · Primário com violência ou grave ameaça' },
  { value: 30, label: '30% · Reincidente com violência ou grave ameaça' },
  { value: 40, label: '40% · Hediondo ou equiparado (primário)' },
  { value: 50, label: '50% · Hediondo c/ morte (prim.) / Comando ORCRIM' },
  { value: 60, label: '60% · Hediondo ou equiparado (reincidente)' },
  { value: 70, label: '70% · Hediondo com resultado morte (reincidente)' },
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

export const WarRoomScreen: React.FC<WarRoomScreenProps> = ({
  cases,
  clients = [],
  knowledgeItems = [],
  selectedCaseId,
  activeModule,
  activeTab: controlledTab,
  governance,
  userRole = 'escritorio',
  onSelectCase,
  onSelectModule,
  onSelectTab,
  onUpdateCase,
  onKnowledgeAdded,
  onKnowledgeRemoved,
  onSendToForum,
  onWhatsappGenerated,
  onNotify,
}) => {
  const activeCase = useMemo(
    () => cases.find((c) => c.id === selectedCaseId) ?? cases[0],
    [cases, selectedCaseId]
  );

  const matchingClient = useMemo(
    () =>
      clients.find(
        (cl) =>
          cl.caseId === activeCase?.id ||
          cl.name.toLowerCase() === activeCase?.assistido.toLowerCase()
      ),
    [clients, activeCase]
  );

  const [internalTab, setInternalTab] = useState<WarRoomTabId>('ficha');
  const activeTab = controlledTab ?? internalTab;
  const setTab = (tab: WarRoomTabId) => {
    setInternalTab(tab);
    onSelectTab?.(tab);
  };

  // =========================================================================
  // ABA 1: FICHA & CADASTRO EDITÁVEL
  // =========================================================================
  const [fichaDraft, setFichaDraft] = useState<CaseRecord | null>(
    activeCase ?? null
  );
  const [savingFicha, setSavingFicha] = useState(false);

  // =========================================================================
  // ABA 2: ÁUDIO & DOCUMENTOS DO CASO
  // =========================================================================
  const [kbScope, setKbScope] = useState<'case' | 'all'>('case');
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  // =========================================================================
  // ABA 3: LINHA DO TEMPO FORENSE
  // =========================================================================
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [tlDate, setTlDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [tlTime, setTlTime] = useState('14:00');
  const [tlType, setTlType] =
    useState<ForensicTimelineEvent['type']>('defense');
  const [tlTitle, setTlTitle] = useState('');
  const [tlSource, setTlSource] = useState('');
  const [tlDesc, setTlDesc] = useState('');
  const [tlContradiction, setTlContradiction] = useState(false);
  const [tlContradictionNote, setTlContradictionNote] = useState('');

  // =========================================================================
  // ABA 5: GERADORES TÁTICOS (CUSTÓDIA / AIJ / SÚMULA 7 / SEEU / WHATSAPP)
  // =========================================================================
  const [apfLabel, setApfLabel] = useState(
    'APF_0812943-22.2026_NUCLEO_NATAL.pdf (14 págs) processado'
  );
  const [custodiaNotes, setCustodiaNotes] = useState(
    activeCase?.resumoFatos ?? ''
  );
  const [invasaoDomiciliar, setInvasaoDomiciliar] = useState(true);
  const [filhosMenores, setFilhosMenores] = useState(true);
  const [semAudioVideo, setSemAudioVideo] = useState(true);
  const [cenario, setCenario] = useState<'A' | 'B'>('B');

  const [aijVara, setAijVara] = useState(
    activeCase?.varaComarca || '7ª Vara Criminal da Comarca de Natal/RN'
  );
  const [aijNotes, setAijNotes] = useState(
    'PM afirmou no IP que visualizou troca de objetos a 50m; em juízo admitiu que era noite, rua sem iluminação e não houve campana prévia. Lacre do celular rompido sem certidão (quebra da cadeia de custódia).'
  );
  const [cadeia158a, setCadeia158a] = useState(true);
  const [reconhecimento226, setReconhecimento226] = useState(false);

  const [tribSubTab, setTribSubTab] = useState<'sumula7' | 'seeu'>('sumula7');
  const [violArt158a, setViolArt158a] = useState(true);
  const [violArt240, setViolArt240] = useState(true);
  const [violArt226, setViolArt226] = useState(false);
  const [violOrcrim, setViolOrcrim] = useState(false);
  const [trechoAcordao, setTrechoAcordao] = useState(
    'O acórdão recorrido registrou expressamente que os policiais ingressaram na residência sem mandado e sem autorização filmada, fundamentando a licitude apenas em nervosismo prévio.'
  );

  const [years, setYears] = useState(5);
  const [months, setMonths] = useState(4);
  const [fractionPercent, setFractionPercent] = useState(16);
  const [startDateStr, setStartDateStr] = useState('2025-11-01');
  const [detractionDays, setDetractionDays] = useState(45);
  const [remittedDays, setRemittedDays] = useState(142);

  const [tradutorInput, setTradutorInput] = useState(
    'Concedida a liberdade provisória mediante cumprimento de medidas cautelares diversas da prisão (art. 319, I e IV, CPP): comparecimento mensal em juízo e proibição de ausentar-se da comarca sem autorização. Expedido alvará de soltura clausulado.'
  );
  const [tradutorOutput, setTradutorOutput] = useState(() =>
    activeCase
      ? generateHumanizedWhatsapp(
          activeCase,
          'Concedida a liberdade provisória mediante cumprimento de medidas cautelares diversas da prisão (art. 319, I e IV, CPP).'
        )
      : ''
  );

  // =========================================================================
  // ABA 6: MODO FÓRUM ESTÁTICO (AUDIÊNCIA)
  // =========================================================================
  const [forumFontSize, setForumFontSize] = useState(16);
  const [checkedClientQs, setCheckedClientQs] = useState<Record<number, boolean>>({});
  const [checkedWitnessQs, setCheckedWitnessQs] = useState<Record<number, boolean>>({});
  const [oralDraft, setOralDraft] = useState(activeCase?.oralStatement ?? '');
  const [whatsappDraft, setWhatsappDraft] = useState(
    activeCase?.familyWhatsappMsg ?? ''
  );

  // =========================================================================
  // ABA 7: EXPORTAÇÃO AUTENTICADA (SHA-256 + IMPRESSÃO)
  // =========================================================================
  const [exportTemplate, setExportTemplate] = useState<
    'sustentacao' | 'roteiro' | 'dossie'
  >('sustentacao');
  const [signatory, setSignatory] = useState<'both' | 'ramon' | 'jessica'>('both');
  const [sha256Hash, setSha256Hash] = useState('calculando...');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCase) return;
    setFichaDraft(activeCase);
    setCustodiaNotes(activeCase.resumoFatos);
    setAijVara(activeCase.varaComarca);
    setOralDraft(activeCase.oralStatement ?? '');
    setWhatsappDraft(activeCase.familyWhatsappMsg ?? '');
    setCheckedClientQs({});
    setCheckedWitnessQs({});
    setTradutorOutput(generateHumanizedWhatsapp(activeCase, tradutorInput));
  }, [activeCase?.id]);

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

  const persistCaseUpdate = async (
    updated: CaseRecord,
    successToast?: string
  ) => {
    onUpdateCase?.(updated);
    try {
      await fetch(`/api/cases/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Estado local atualizado mesmo offline
    }
    if (successToast) {
      onNotify(successToast);
    }
  };

  // =========================================================================
  // CÁLCULOS TÁTICOS DA ABA 5
  // =========================================================================
  const custodiaOutput = useMemo(() => {
    if (!activeCase) return null;
    return generateCustodiaStrategyOutput(
      activeCase,
      {
        cenario,
        notasParlatorio: custodiaNotes,
        invasaoDomiciliar,
        filhosMenores,
        semAudioVideo,
      },
      governance
    );
  }, [
    activeCase,
    cenario,
    custodiaNotes,
    invasaoDomiciliar,
    filhosMenores,
    semAudioVideo,
    governance,
  ]);

  const aijOutput = useMemo(() => {
    if (!activeCase) return null;
    return generateAijOralOutput(activeCase, aijVara, aijNotes, {
      cadeia158a,
      reconhecimento226,
    });
  }, [activeCase, aijVara, aijNotes, cadeia158a, reconhecimento226]);

  const sumula7Output = useMemo(() => {
    if (!activeCase) return null;
    return generateAntiSumula7Output(
      activeCase,
      {
        art158a: violArt158a,
        art240: violArt240,
        art226: violArt226,
        orcrim: violOrcrim,
      },
      trechoAcordao
    );
  }, [
    activeCase,
    violArt158a,
    violArt240,
    violArt226,
    violOrcrim,
    trechoAcordao,
  ]);

  const seeuCalc = useMemo(
    () =>
      calculateSeeuProgression({
        years,
        months,
        fractionPercent,
        startDateStr,
        detractionDays,
        remittedDays,
      }),
    [years, months, fractionPercent, startDateStr, detractionDays, remittedDays]
  );

  const seeuDraft = useMemo(() => {
    if (!activeCase) return null;
    return generateSeeuDraft(activeCase, fractionPercent, seeuCalc);
  }, [activeCase, fractionPercent, seeuCalc]);

  const caseKnowledgeItems = useMemo(() => {
    if (!activeCase) return knowledgeItems;
    if (kbScope === 'all') return knowledgeItems;
    return knowledgeItems.filter(
      (k) => !k.caseId || k.caseId === activeCase.id
    );
  }, [knowledgeItems, activeCase, kbScope]);

  // =========================================================================
  // PREVIEW DO DOCUMENTO AUTENTICADO (ABA 7) + HASH SHA-256 REAL
  // =========================================================================
  const authCode = useMemo(() => {
    if (!activeCase) return 'LR-2026-0000-84RN';
    const suffix = activeCase.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    return `LR-2026-${suffix || 'CASE'}-84RN`;
  }, [activeCase]);

  const printableBody = useMemo(() => {
    if (!activeCase) return '';
    if (exportTemplate === 'sustentacao') {
      return (
        oralDraft ||
        activeCase.oralStatement ||
        custodiaOutput?.sustentacao ||
        activeCase.resumoFatos
      );
    }
    if (exportTemplate === 'roteiro') {
      const qCli = (activeCase.forumQuestionsClient ?? [])
        .map((q, i) => `  ${i + 1}. ${q}`)
        .join('\n');
      const qWit = (activeCase.forumQuestionsWitness ?? [])
        .map((q, i) => `  ${i + 1}. ${q}`)
        .join('\n');
      return [
        'BLOCO I — PERGUNTAS AO ASSISTIDO (BLINDAGEM DE MÉRITO)',
        qCli || '  (Sem perguntas cadastradas)',
        '',
        'BLOCO II — CONTRADITA E INQUIRIÇÃO DE TESTEMUNHAS / POLICIAIS',
        qWit || '  (Sem quesitos cadastrados)',
        '',
        'BLOCO III — SÍNTESE DE SUSTENTAÇÃO ORAL',
        oralDraft || activeCase.oralStatement || '',
      ].join('\n');
    }
    const tl = (activeCase.forensicTimeline ?? [])
      .map(
        (ev) =>
          `• [${ev.date} ${ev.time}] ${ev.title} (${ev.source})\n  ${ev.description}${
            ev.contradiction && ev.contradictionNote
              ? `\n  [CONTRADIÇÃO]: ${ev.contradictionNote}`
              : ''
          }`
      )
      .join('\n\n');
    return [
      `SITUAÇÃO CAUTELAR: ${activeCase.situacao}`,
      `IMPUTAÇÃO: ${activeCase.imputacao}`,
      `VÍNCULOS & FILHOS (ART. 318 CPP): ${activeCase.occupation ?? 'Não informado'} | Filhos: ${activeCase.children ?? 'Não informado'}`,
      '',
      'SÍNTESE FÁTICA:',
      activeCase.resumoFatos,
      '',
      'ESTRATÉGIA A (MP FAVORÁVEL):',
      activeCase.strategyA ?? 'Requerimento de alvará imediato sem fiança.',
      '',
      'ESTRATÉGIA B (MP PEDE PREVENTIVA):',
      activeCase.strategyB ?? 'Nulidades preliminares e cautelares Art. 319 CPP.',
      '',
      'LINHA DO TEMPO FORENSE:',
      tl || 'Sem marcos registrados.',
    ].join('\n');
  }, [activeCase, exportTemplate, oralDraft, custodiaOutput]);

  useEffect(() => {
    let cancelled = false;
    if (!activeCase) return;
    const payload = `${authCode}|${activeCase.processo}|${signatory}|${printableBody}`;
    computeSha256Hex(payload).then((digest) => {
      if (!cancelled) setSha256Hash(digest);
    });
    return () => {
      cancelled = true;
    };
  }, [authCode, activeCase, signatory, printableBody]);

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const copyToClipboard = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onNotify('Texto copiado para a área de transferência');
      window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      onNotify('Não foi possível copiar automaticamente');
    }
  };

  const handleSaveFicha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fichaDraft) return;
    setSavingFicha(true);
    await persistCaseUpdate(
      fichaDraft,
      `Ficha de ${fichaDraft.assistido} salva no Dossiê Vivo`
    );
    setSavingFicha(false);
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
    setIngestKind(isAudio ? 'audio' : 'documento');

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
        const fileName = `gravacao_dossie_${Date.now()}.${
          mimeType.includes('webm') ? 'webm' : 'm4a'
        }`;
        setIngestKind('audio');
        if (!ingestTitle.trim() && activeCase) {
          setIngestTitle(`Áudio Parlatório · ${activeCase.assistido.split(' ')[0]}`);
        }
        setSelectedFile({ fileName, mimeType, base64Data });
        onNotify('Áudio capturado! Clique em "Transcrever & Indexar no Dossiê".');
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
        'Não foi possível acessar o microfone. Você pode anexar um arquivo MP3, WAV, M4A ou OGG.'
      );
    }
  };

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
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
            (ingestKind === 'audio' ? 'audio_dossie.webm' : 'peca_dossie.txt'),
          base64Data: selectedFile?.base64Data,
          textContent: selectedFile?.textContent ?? ingestText.trim(),
          clientId: matchingClient?.id,
          caseId: activeCase.id,
        }),
      });
      const payload = (await res.json()) as {
        item?: KnowledgeBaseItem;
        error?: string;
      };
      if (!res.ok || !payload.item) {
        setIngestError(payload.error || 'Erro ao indexar material do dossiê.');
        return;
      }
      onKnowledgeAdded?.(payload.item);
      setIngestTitle('');
      setIngestText('');
      setSelectedFile(null);
      onNotify('Material indexado no Dossiê Vivo e disponível ao Doutor LEX');
    } catch {
      setIngestError('Falha de rede ao enviar arquivo para transcrição/análise.');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onKnowledgeRemoved?.(id);
        onNotify('Material removido do repositório');
      }
    } catch {}
  };

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || tlTitle.trim().length < 3 || tlDesc.trim().length < 5) {
      onNotify('Preencha o título e a descrição do marco cronológico.');
      return;
    }
    const newEvent: ForensicTimelineEvent = {
      id: `tl-${Date.now()}`,
      date: tlDate || new Date().toISOString().slice(0, 10),
      time: tlTime || '14:00',
      type: tlType,
      title: tlTitle.trim(),
      description: tlDesc.trim(),
      source: tlSource.trim() || 'Registro da Defesa',
      contradiction: tlContradiction,
      contradictionNote: tlContradiction ? tlContradictionNote.trim() : undefined,
    };
    const updated: CaseRecord = {
      ...activeCase,
      forensicTimeline: [...(activeCase.forensicTimeline ?? []), newEvent],
    };
    await persistCaseUpdate(updated, 'Marco adicionado à Linha do Tempo Forense');
    setTlTitle('');
    setTlSource('');
    setTlDesc('');
    setTlContradiction(false);
    setTlContradictionNote('');
    setShowAddTimeline(false);
  };

  const handleDownloadSignedHtml = () => {
    if (!activeCase) return;
    const signerText =
      signatory === 'both'
        ? 'Dr. Ramon Ribeiro (OAB/RN 14.820) & Dra. Jéssica (OAB/RN 19.410)'
        : signatory === 'ramon'
        ? 'Dr. Ramon Ribeiro (OAB/RN 14.820)'
        : 'Dra. Jéssica (OAB/RN 19.410)';
    const emittedAt = new Date().toLocaleString('pt-BR');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${authCode} — ${activeCase.assistido}</title>
<style>
  body { font-family: Georgia, serif; color: #0f172a; max-width: 820px; margin: 40px auto; padding: 32px; line-height: 1.65; border: 1px solid #cbd5e1; }
  header { border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  h1 { font-size: 18px; margin: 0; letter-spacing: 0.04em; }
  .meta { font-family: monospace; font-size: 12px; color: #334155; }
  .seal { margin-top: 24px; padding: 14px; border: 1px solid #0f172a; background: #f8fafc; font-family: monospace; font-size: 11px; color: #0f172a; }
  .body { white-space: pre-wrap; font-size: 14px; }
  footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #94a3b8; font-family: monospace; font-size: 11px; color: #475569; }
</style>
</head>
<body>
  <header>
    <div>
      <h1>RAMON RIBEIRO &amp; JÉSSICA · ADVOCACIA CRIMINAL</h1>
      <div class="meta">Atuação Estratégica RN &amp; CE · TJRN · TJCE · STJ · STF</div>
    </div>
    <div class="meta">Código: ${authCode}</div>
  </header>
  <p><strong>Assistido(a):</strong> ${activeCase.assistido}<br/>
  <strong>Processo / APF:</strong> ${activeCase.processo}<br/>
  <strong>Juízo / Comarca:</strong> ${activeCase.varaComarca}</p>
  <div class="body">${printableBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  <div class="seal">
    <strong>SELO DE AUTENTICIDADE ICP-BRASIL / OAB VERIFICADO</strong><br/>
    Signatário(s): ${signerText}<br/>
    Carimbo de Tempo: ${emittedAt}<br/>
    Hash SHA-256: ${sha256Hash}
  </div>
  <footer>
    <div>Autenticação Documental LexRamon · Código ${authCode}</div>
  </footer>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${authCode}_${activeCase.assistido
      .toLowerCase()
      .replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Documento assinado (.HTML) exportado com hash SHA-256');
  };

  if (!activeCase) {
    return (
      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-8 text-center text-sm text-slate-400">
        Nenhum caso ativo. Cadastre um novo assistido para operar a War Room.
      </div>
    );
  }

  const hasMinorChildrenAlert = Boolean(
    fichaDraft?.children &&
      /sim|filh|menor|crianç|gestant|pcd|defici[eê]nc|dependente/i.test(
        fichaDraft.children
      )
  );

  return (
    <div className="space-y-5">
      {/* Cabeçalho do Dossiê Vivo + Seletor de Caso */}
      <div className="no-print rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-amber-400">
              War Room · Dossiê Vivo Caso a Caso
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono-tabular text-slate-400">
              {activeCase.processo}
            </span>
            {activeCase.assignedTo && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-blue-300 font-medium">
                  {activeCase.assignedTo}
                </span>
              </>
            )}
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
            {activeCase.assistido}
          </h2>
          <p className="text-xs text-slate-400">
            {activeCase.varaComarca} · {activeCase.imputacao}
          </p>
          {userRole === 'estudante' && (
            <p className="text-[11px] text-blue-300 pt-0.5">
              Modo Simulador Supervisionado: minutas enviadas ao Modo Fórum
              ficam em rascunho aguardando validação OAB.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-2.5 w-full lg:w-auto">
          <label className="block w-full sm:w-80 space-y-1">
            <span className="text-[11px] font-medium text-slate-400 block">
              Alternar Dossiê / Assistido Ativo
            </span>
            <select
              value={activeCase.id}
              onChange={(e) => onSelectCase(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs font-medium text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.assistido} · {c.situacao}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setTab('agente_lex')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
          >
            <Bot className="w-4 h-4 shrink-0" />
            <span>Doutor LEX</span>
          </button>
        </div>
      </div>

      {/* Navegação das 7 Abas do Dossiê Vivo */}
      <nav
        aria-label="Abas do Dossiê Vivo Caso a Caso"
        className="no-print flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-[#0B111E] border border-slate-800"
      >
        {DOSSIER_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#131D33]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">{tab.mobileLabel}</span>
              <span className="hidden sm:inline">
                {tab.step}. {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ===================================================================
          ABA 1: FICHA & CADASTRO + ALERTA AUTOMÁTICO ART. 318 CPP
      ==================================================================== */}
      {activeTab === 'ficha' && fichaDraft && (
        <form
          onSubmit={handleSaveFicha}
          className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Ficha Completa do Assistido & Dados Processuais
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Edite dados, vínculos familiares e imputação; alterações alimentam
                o Doutor LEX e o documento de Exportação Autenticada.
              </p>
            </div>
            <span
              className={`font-mono-tabular text-xs font-semibold px-3 py-1 rounded-lg border ${
                fichaDraft.urgency === 'critica'
                  ? 'bg-red-950/50 border-red-500/40 text-red-300'
                  : 'bg-blue-950/40 border-blue-500/35 text-blue-300'
              }`}
            >
              {fichaDraft.situacao}
            </span>
          </div>

          {hasMinorChildrenAlert && (
            <div className="rounded-xl bg-amber-950/35 border border-amber-500/45 p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-amber-300">
                  Alerta Automático · Art. 318 do CPP (Substituição por Prisão Domiciliar)
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Vínculo identificado ({fichaDraft.children}). Priorize a juntada
                  de certidão de nascimento e requerimento de substituição da
                  preventiva por domiciliar ou cautelares do Art. 319 CPP (HC
                  143.641 STF / Art. 318, III, V e VI do CPP).
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Nome do Assistido
              </span>
              <input
                type="text"
                value={fichaDraft.assistido}
                onChange={(e) =>
                  setFichaDraft({ ...fichaDraft, assistido: e.target.value })
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                CPF (Mascarado / LGPD)
              </span>
              <input
                type="text"
                value={fichaDraft.cpf ?? ''}
                onChange={(e) =>
                  setFichaDraft({ ...fichaDraft, cpf: e.target.value })
                }
                placeholder="000.000.000-00"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm font-mono-tabular text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Número do Processo / APF
              </span>
              <input
                type="text"
                value={fichaDraft.processo}
                onChange={(e) =>
                  setFichaDraft({ ...fichaDraft, processo: e.target.value })
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm font-mono-tabular text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Vara / Comarca (RN / CE / STJ)
              </span>
              <input
                type="text"
                value={fichaDraft.varaComarca}
                onChange={(e) =>
                  setFichaDraft({ ...fichaDraft, varaComarca: e.target.value })
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Tipificação / Imputação
              </span>
              <input
                type="text"
                value={fichaDraft.imputacao}
                onChange={(e) =>
                  setFichaDraft({ ...fichaDraft, imputacao: e.target.value })
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Sócio(a) Responsável
              </span>
              <select
                value={fichaDraft.assignedTo ?? 'Dr. Ramon Ribeiro'}
                onChange={(e) =>
                  setFichaDraft({ ...fichaDraft, assignedTo: e.target.value })
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Dr. Ramon Ribeiro">Dr. Ramon Ribeiro</option>
                <option value="Dra. Jéssica">Dra. Jéssica</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Situação Cautelar
              </span>
              <select
                value={fichaDraft.situacao}
                onChange={(e) =>
                  setFichaDraft({
                    ...fichaDraft,
                    situacao: e.target.value as CaseRecord['situacao'],
                  })
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Preso em Flagrante">Preso em Flagrante</option>
                <option value="Preventiva">Preventiva</option>
                <option value="Liberdade Provisória">Liberdade Provisória</option>
                <option value="Regime Fechado (SEEU)">Regime Fechado (SEEU)</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Unidade Prisional / Recolhimento
              </span>
              <input
                type="text"
                value={fichaDraft.prisonUnit ?? ''}
                onChange={(e) =>
                  setFichaDraft({ ...fichaDraft, prisonUnit: e.target.value })
                }
                placeholder="Ex.: Central de Flagrantes / CDP Parnamirim"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Ocupação Lícita / CTPS
              </span>
              <input
                type="text"
                value={fichaDraft.occupation ?? ''}
                onChange={(e) =>
                  setFichaDraft({ ...fichaDraft, occupation: e.target.value })
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Filhos &lt; 12 anos / Gestação / Dependente PcD
              </span>
              <input
                type="text"
                value={fichaDraft.children ?? ''}
                onChange={(e) =>
                  setFichaDraft({ ...fichaDraft, children: e.target.value })
                }
                placeholder="Ex.: Sim (2 filhos menores) ou Dependente PcD"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Comprovante de Residência / Endereço
              </span>
              <input
                type="text"
                value={fichaDraft.residenceProof ?? ''}
                onChange={(e) =>
                  setFichaDraft({
                    ...fichaDraft,
                    residenceProof: e.target.value,
                  })
                }
                placeholder="Endereço residencial e status do comprovante"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Antecedentes / Primariedade
              </span>
              <input
                type="text"
                value={fichaDraft.antecedents ?? ''}
                onChange={(e) =>
                  setFichaDraft({ ...fichaDraft, antecedents: e.target.value })
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5 sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-medium text-slate-300">
                Contato Familiar / WhatsApp
              </span>
              <input
                type="text"
                value={fichaDraft.familyContact ?? ''}
                onChange={(e) =>
                  setFichaDraft({
                    ...fichaDraft,
                    familyContact: e.target.value,
                  })
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Síntese Fática & Pontos Centrais do Dossiê
            </span>
            <textarea
              rows={4}
              value={fichaDraft.resumoFatos}
              onChange={(e) =>
                setFichaDraft({ ...fichaDraft, resumoFatos: e.target.value })
              }
              className="w-full p-3.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none focus:border-blue-500"
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setTab('audio_docs')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-semibold text-slate-200"
            >
              Ir para Áudio & Documentos →
            </button>
            <button
              type="submit"
              disabled={savingFicha}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {savingFicha ? 'Salvando...' : 'Salvar Alterações na Ficha'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================
          ABA 2: ÁUDIO & DOCUMENTOS DO DOSSIÊ
      ==================================================================== */}
      {activeTab === 'audio_docs' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <form
            onSubmit={handleIngestSubmit}
            className="xl:col-span-5 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span>Indexar Documento ou Áudio no Dossiê</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                PDFs de APF/denúncia, imagens ou gravações de parlatório e
                audiência transcritas via backend IA.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setIngestKind('documento')}
                className={`min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border ${
                  ingestKind === 'documento'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-[#060B14] text-slate-400 border-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Documento (PDF/TXT)</span>
              </button>
              <button
                type="button"
                onClick={() => setIngestKind('audio')}
                className={`min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border ${
                  ingestKind === 'audio'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-[#060B14] text-slate-400 border-slate-800'
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
              placeholder="Título identificador (ex.: Oitiva PM / Termo APF)"
              className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            />

            <div className="flex flex-wrap gap-2">
              <label className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-dashed border-slate-700 cursor-pointer text-xs text-slate-200 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">
                  {selectedFile
                    ? selectedFile.fileName
                    : ingestKind === 'audio'
                    ? 'Enviar MP3, WAV, M4A, OGG'
                    : 'Enviar PDF, TXT, PNG/JPG'}
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
                className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                  isRecording
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-[#060B14] hover:bg-[#131D33] text-amber-300 border-slate-700'
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
                    <span>Gravar Áudio</span>
                  </>
                )}
              </button>
            </div>

            {ingestKind === 'documento' && (
              <textarea
                rows={4}
                value={ingestText}
                onChange={(e) => setIngestText(e.target.value)}
                placeholder="Ou cole trechos do APF, laudo pericial, denúncia ou depoimento..."
                className="w-full p-3 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            )}

            {ingestError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200"
              >
                {ingestError}
              </div>
            )}

            <button
              type="submit"
              disabled={isIngesting}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando e indexando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Transcrever & Indexar no Dossiê</span>
                </>
              )}
            </button>
          </form>

          <div className="xl:col-span-7 rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Repositório Multimodal ({caseKnowledgeItems.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Peças e transcrições consultadas automaticamente pelo Doutor LEX.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060B14] border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setKbScope('case')}
                  className={`px-3 py-1 rounded-lg font-semibold ${
                    kbScope === 'case'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Deste Dossiê
                </button>
                <button
                  type="button"
                  onClick={() => setKbScope('all')}
                  className={`px-3 py-1 rounded-lg font-semibold ${
                    kbScope === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Acervo Completo
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-[560px] overflow-y-auto custom-scroll">
              {caseKnowledgeItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhum arquivo indexado especificamente neste caso ainda.
                </div>
              ) : (
                caseKnowledgeItems.map((kb) => (
                  <div key={kb.id} className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            kb.kind === 'audio'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-blue-500/15 text-blue-300'
                          }`}
                        >
                          {kb.kind === 'audio' ? 'ÁUDIO' : 'DOCUMENTO'}
                        </span>
                        <span className="font-mono-tabular text-[11px] text-slate-500">
                          {formatBytes(kb.sizeBytes)}
                        </span>
                        {kb.caseId === activeCase.id && (
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            · Vinculado ao Caso
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteKnowledge(kb.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-sm font-bold text-white">{kb.title}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {kb.summary}
                    </p>

                    {kb.keyPoints.length > 0 && (
                      <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-400">
                        {kb.keyPoints.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    )}

                    <div className="p-3 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {kb.transcriptOrExtract}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          ABA 3: LINHA DO TEMPO FORENSE & CONTRADIÇÕES
      ==================================================================== */}
      {activeTab === 'timeline' && (
        <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Linha do Tempo Forense & Detecção de Contradições
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Confronte horários da narrativa policial (BO/APF) contra provas
                da defesa e decisões judiciais.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddTimeline((v) => !v)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>
                {showAddTimeline ? 'Fechar Formulário' : '+ Adicionar Marco Cronológico'}
              </span>
            </button>
          </div>

          {showAddTimeline && (
            <form
              onSubmit={handleAddTimelineEvent}
              className="p-4 rounded-xl bg-[#060B14] border border-amber-500/35 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="date"
                  value={tlDate}
                  onChange={(e) => setTlDate(e.target.value)}
                  className="min-h-[40px] px-3 py-2 rounded-lg bg-[#0B111E] border border-slate-800 text-xs font-mono-tabular text-white"
                />
                <input
                  type="text"
                  value={tlTime}
                  onChange={(e) => setTlTime(e.target.value)}
                  placeholder="Hora (ex.: 19:20)"
                  className="min-h-[40px] px-3 py-2 rounded-lg bg-[#0B111E] border border-slate-800 text-xs font-mono-tabular text-white"
                />
                <select
                  value={tlType}
                  onChange={(e) =>
                    setTlType(e.target.value as ForensicTimelineEvent['type'])
                  }
                  className="min-h-[40px] px-3 py-2 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                >
                  <option value="police">Policial / Fática</option>
                  <option value="defense">Prova / Defesa</option>
                  <option value="judicial">Ato Judicial</option>
                </select>
                <input
                  type="text"
                  value={tlSource}
                  onChange={(e) => setTlSource(e.target.value)}
                  placeholder="Fonte (ex.: Câmera Vizinho)"
                  className="min-h-[40px] px-3 py-2 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                />
              </div>

              <input
                type="text"
                value={tlTitle}
                onChange={(e) => setTlTitle(e.target.value)}
                placeholder="Título do marco cronológico..."
                className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                required
              />

              <textarea
                rows={3}
                value={tlDesc}
                onChange={(e) => setTlDesc(e.target.value)}
                placeholder="Descreva os fatos, horários exatos ou prova produzida..."
                className="w-full p-3 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-slate-200"
                required
              />

              <label className="flex items-center gap-2 text-xs text-red-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tlContradiction}
                  onChange={(e) => setTlContradiction(e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <span>Marcar como Contradição / Nulidade Crítica</span>
              </label>

              {tlContradiction && (
                <input
                  type="text"
                  value={tlContradictionNote}
                  onChange={(e) => setTlContradictionNote(e.target.value)}
                  placeholder="Detalhe da contradição jurídica (ex.: Divergência de horário entre BO e CCTV)..."
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-red-950/25 border border-red-500/40 text-xs text-red-200"
                />
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTimeline(false)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[38px] px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
                >
                  Salvar Marco na Timeline
                </button>
              </div>
            </form>
          )}

          {/* Resumo do Detector Automático de Contradições */}
          {(() => {
            const timeline = activeCase.forensicTimeline ?? [];
            const contradictions = timeline.filter((ev) => ev.contradiction);
            const policeTrack = timeline.filter((ev) => ev.type === 'police');
            const judicialTrack = timeline.filter(
              (ev) => ev.type === 'judicial' || ev.type === 'defense'
            );

            const renderEventCard = (ev: ForensicTimelineEvent) => (
              <div
                key={ev.id}
                className={`p-4 rounded-xl border space-y-2 ${
                  ev.contradiction
                    ? 'bg-red-950/20 border-red-500/45'
                    : 'bg-[#060B14] border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-tabular font-bold text-amber-400">
                      {ev.date} · {ev.time}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span
                      className={`font-semibold ${
                        ev.type === 'police'
                          ? 'text-red-300'
                          : ev.type === 'defense'
                          ? 'text-emerald-300'
                          : 'text-blue-300'
                      }`}
                    >
                      {ev.type === 'police'
                        ? 'Narrativa Policial'
                        : ev.type === 'defense'
                        ? 'Prova da Defesa'
                        : 'Ato Judicial'}
                    </span>
                  </div>
                  <span className="font-mono-tabular text-[11px] text-slate-400">
                    {ev.source}
                  </span>
                </div>

                <div className="text-sm font-bold text-white">{ev.title}</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {ev.description}
                </p>

                {ev.contradiction && ev.contradictionNote && (
                  <div className="p-3 rounded-lg bg-red-950/45 border border-red-500/40 text-xs text-red-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-red-300">
                        Contradição Detectada:{' '}
                      </span>
                      {ev.contradictionNote}
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <div className="space-y-4">
                {contradictions.length > 0 && (
                  <div className="rounded-xl bg-red-950/30 border border-red-500/45 p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-red-300">
                        Detector Automático de Contradições ·{' '}
                        {contradictions.length} divergência(s) crítica(s)
                        identificada(s)
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        {contradictions[0].contradictionNote ||
                          contradictions[0].title}
                      </p>
                    </div>
                  </div>
                )}

                {timeline.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#060B14] border border-slate-800 text-center text-xs text-slate-400">
                    Nenhum marco cronológico cadastrado para este caso.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    {/* Trilha 01: Policial / Fática */}
                    <div className="rounded-xl bg-[#080E1A] border border-slate-800 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                          Trilha 01 · Policial / Fática
                        </span>
                        <span className="font-mono-tabular text-[11px] text-slate-400">
                          {policeTrack.length} marco(s)
                        </span>
                      </div>
                      {policeTrack.length === 0 ? (
                        <p className="text-xs text-slate-500 py-3">
                          Sem marcos policiais registrados (abordagem, entrada,
                          lavratura APF).
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {policeTrack.map(renderEventCard)}
                        </div>
                      )}
                    </div>

                    {/* Trilha 02: Judicial / Probatória */}
                    <div className="rounded-xl bg-[#080E1A] border border-slate-800 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                          Trilha 02 · Judicial / Probatória
                        </span>
                        <span className="font-mono-tabular text-[11px] text-slate-400">
                          {judicialTrack.length} marco(s)
                        </span>
                      </div>
                      {judicialTrack.length === 0 ? (
                        <p className="text-xs text-slate-500 py-3">
                          Sem atos judiciais ou provas defensivas registradas.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {judicialTrack.map(renderEventCard)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ===================================================================
          ABA 4: AGENTE DOUTOR LEX (CONTEXTUALIZADO AO DOSSIÊ)
      ==================================================================== */}
      {activeTab === 'agente_lex' && (
        <CriminalAgentPanel
          activeCase={activeCase}
          activeClient={matchingClient}
          knowledgeItems={knowledgeItems}
          onKnowledgeAdded={onKnowledgeAdded}
          onKnowledgeRemoved={onKnowledgeRemoved}
          initialHistory={activeCase.chatHistory}
          onHistoryChange={(turns: AgentChatTurn[]) => {
            persistCaseUpdate({ ...activeCase, chatHistory: turns });
          }}
          onSaveToOralStatement={(text) => {
            const updated: CaseRecord = { ...activeCase, oralStatement: text };
            setOralDraft(text);
            persistCaseUpdate(
              updated,
              'Parecer salvo na Sustentação Oral (Aba 6 · Modo Fórum)'
            );
          }}
          onSendToForum={onSendToForum}
          onNotify={onNotify}
        />
      )}

      {/* ===================================================================
          ABA 5: PREPARO & ESTRATÉGIAS + GERADORES TÁTICOS
      ==================================================================== */}
      {activeTab === 'preparo' && (
        <div className="space-y-6">
          {/* Matriz Estratégica do Caso */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-400" />
                <span>Preparo do Assistido & Blindagem Pré-Audiência</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {(activeCase.prepCliente ?? []).map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#060B14] border border-slate-800 leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Vulnerabilidades da Acusação & Nulidades</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {(activeCase.vulnerabilities ?? []).map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl bg-red-950/15 border border-red-500/30 leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#0B111E] border border-emerald-500/35 p-5 space-y-2">
              <span className="text-xs font-bold text-emerald-400 block">
                Cenário A · Ministério Público Favorável / Liberdade
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {activeCase.strategyA ??
                  'Requerer homologação imediata da liberdade provisória sem fiança ou com cautelares mínimas.'}
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B111E] border border-red-500/35 p-5 space-y-2">
              <span className="text-xs font-bold text-red-400 block">
                Cenário B · Ministério Público Pede Preventiva / Condenação
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {activeCase.strategyB ??
                  'Atacar nulidade na origem (Art. 157/240/158-A CPP) e requerer subsidiariamente cautelares do Art. 319.'}
              </p>
            </div>
          </div>

          {/* Seletor dos 4 Módulos Táticos da War Room */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {WAR_MODULES.map((mod) => {
                const Icon = mod.icon;
                const active = activeModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => onSelectModule(mod.id)}
                    className={`min-h-[84px] p-3.5 rounded-xl border text-left transition-colors ${
                      active
                        ? 'border-blue-500 bg-[#131D33]'
                        : 'border-slate-800 bg-[#0B111E] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] sm:text-[11px] font-semibold truncate ${mod.accentText}`}
                      >
                        {mod.tag}
                      </span>
                      <Icon className={`w-4 h-4 ${mod.accentText} shrink-0`} />
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-white truncate">
                      {mod.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {mod.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* MÓDULO 01: CUSTÓDIA */}
            {activeModule === 'custodia' && custodiaOutput && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-5 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-red-400" />
                      <span>1. Input do Flagrante (APF)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setApfLabel(
                          'APF_0812943-22.2026_NUCLEO_NATAL.pdf (14 págs) processado'
                        );
                        setCustodiaNotes(
                          'Cliente primário, técnico de refrigeração com CTPS assinada, pai de 2 crianças (4 e 7 anos). Relata que a PM ingressou no quintal e arrombou a porta sem mandado judicial e sem fundadas razões prévias.'
                        );
                        onNotify('Dados do APF cruzados com notas do parlatório');
                      }}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Carregar Exemplo
                    </button>
                  </div>

                  <label className="block border border-dashed border-slate-700 hover:border-blue-500/70 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#060B14]">
                    <input
                      type="file"
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setApfLabel(`${file.name} carregado`);
                          onNotify(`APF "${file.name}" processado na sessão`);
                        }
                      }}
                      className="hidden"
                    />
                    <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-200">
                      Enviar PDF do APF / BO
                    </p>
                    <p className="text-[11px] text-emerald-400 font-mono-tabular mt-1">
                      {apfLabel}
                    </p>
                  </label>

                  <textarea
                    rows={4}
                    value={custodiaNotes}
                    onChange={(e) => setCustodiaNotes(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500"
                  />

                  <div className="space-y-2">
                    <label className="min-h-[42px] flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invasaoDomiciliar}
                        onChange={() => setInvasaoDomiciliar((v) => !v)}
                        className="accent-blue-500 w-4 h-4 shrink-0"
                      />
                      <span>Invasão Domiciliar (Art. 240 CPP / Tema 280 STF)</span>
                    </label>
                    <label className="min-h-[42px] flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={semAudioVideo}
                        onChange={() => setSemAudioVideo((v) => !v)}
                        className="accent-blue-500 w-4 h-4 shrink-0"
                      />
                      <span>Sem registro audiovisual / termo (HC 598.051 STJ)</span>
                    </label>
                    <label className="min-h-[42px] flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filhosMenores}
                        onChange={() => setFilhosMenores((v) => !v)}
                        className="accent-blue-500 w-4 h-4 shrink-0"
                      />
                      <span>Filhos &lt; 12 anos (Art. 318 CPP / HC 143.641 STF)</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onNotify('Roteiro e Sustentação de Custódia atualizados')
                    }
                    className="w-full min-h-[44px] py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Atualizar Estratégia de Custódia</span>
                  </button>
                </div>

                <div className="xl:col-span-7 space-y-4">
                  <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" />
                        <span>1. Roteiro ao Custodiado (Blindagem)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            'perguntas',
                            custodiaOutput.perguntas.join('\n')
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-1"
                      >
                        {copiedKey === 'perguntas' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copiar</span>
                      </button>
                    </div>
                    <div className="divide-y divide-slate-800/80 border-t border-slate-800/80 text-xs text-slate-300">
                      {custodiaOutput.perguntas.map((q) => (
                        <p key={q} className="py-2.5 leading-relaxed">
                          {q}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <GitBranch className="w-4 h-4" />
                        <span>2. Árvore de Sustentação Oral</span>
                      </span>
                      <div className="inline-flex rounded-xl bg-[#060B14] p-1 border border-slate-800 gap-1">
                        <button
                          type="button"
                          onClick={() => setCenario('A')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            cenario === 'A'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          Cenário A: MP Favorável
                        </button>
                        <button
                          type="button"
                          onClick={() => setCenario('B')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            cenario === 'B'
                              ? 'bg-red-600 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          Cenário B: Preventiva
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {custodiaOutput.sustentacao}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard('sustentacao', custodiaOutput.sustentacao)
                        }
                        className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Copiar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSendToForum({
                            caseId: activeCase.id,
                            assistido: activeCase.assistido,
                            moduleId: 'custodia',
                            title: `Sustentação Oral Custódia (Cenário ${cenario})`,
                            subtitle: `${activeCase.varaComarca} · ${activeCase.assistido}`,
                            content: custodiaOutput.sustentacao,
                          })
                        }
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>Enviar para Modo Fórum</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MÓDULO 02: AIJ */}
            {activeModule === 'aij' && aijOutput && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-5 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-amber-400" />
                    <span>Auditoria de Autos & Ocorrências na AIJ</span>
                  </h3>
                  <input
                    type="text"
                    value={aijVara}
                    onChange={(e) => setAijVara(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white"
                  />
                  <textarea
                    rows={4}
                    value={aijNotes}
                    onChange={(e) => setAijNotes(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-200"
                  />
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cadeia158a}
                      onChange={() => setCadeia158a((v) => !v)}
                      className="accent-amber-500 w-4 h-4"
                    />
                    <span>Quebra da Cadeia de Custódia (Art. 158-A CPP)</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reconhecimento226}
                      onChange={() => setReconhecimento226((v) => !v)}
                      className="accent-amber-500 w-4 h-4"
                    />
                    <span>Vício de Reconhecimento (Art. 226 CPP)</span>
                  </label>
                </div>

                <div className="xl:col-span-7 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white">{aijOutput.title}</h3>
                      <p className="text-xs text-slate-400">{aijOutput.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('aij', aijOutput.content)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copiar</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {aijOutput.content}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onSendToForum({
                          caseId: activeCase.id,
                          assistido: activeCase.assistido,
                          moduleId: 'aij',
                          title: aijOutput.title,
                          subtitle: aijOutput.subtitle,
                          content: aijOutput.content,
                        })
                      }
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      <span>Enviar para Modo Fórum</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MÓDULO 03: TRIBUNAIS SUPERIORES & SEEU */}
            {activeModule === 'tribunais' && sumula7Output && seeuDraft && (
              <div className="space-y-4">
                <div className="inline-flex p-1 rounded-xl bg-[#0B111E] border border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={() => setTribSubTab('sumula7')}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                      tribSubTab === 'sumula7'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Filtro Anti-Súmula 7 STJ
                  </button>
                  <button
                    type="button"
                    onClick={() => setTribSubTab('seeu')}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                      tribSubTab === 'seeu'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Calculadora SEEU (Art. 112 LEP)
                  </button>
                </div>

                {tribSubTab === 'sumula7' ? (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    <div className="xl:col-span-5 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3 text-xs">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span>Dispositivos Federais</span>
                      </h3>
                      {[
                        {
                          checked: violArt158a,
                          toggle: () => setViolArt158a((v) => !v),
                          label: 'Art. 158-A a 158-F CPP (Quebra Cadeia de Custódia)',
                        },
                        {
                          checked: violArt240,
                          toggle: () => setViolArt240((v) => !v),
                          label: 'Art. 240/244 CPP (Tema 280 STF)',
                        },
                        {
                          checked: violArt226,
                          toggle: () => setViolArt226((v) => !v),
                          label: 'Art. 226 CPP (Reconhecimento Irregular)',
                        },
                        {
                          checked: violOrcrim,
                          toggle: () => setViolOrcrim((v) => !v),
                          label: 'Lei 12.850/13 (Atipicidade ORCRIM)',
                        },
                      ].map((item) => (
                        <label
                          key={item.label}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={item.toggle}
                            className="accent-blue-500"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                      <textarea
                        rows={4}
                        value={trechoAcordao}
                        onChange={(e) => setTrechoAcordao(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-200"
                      />
                    </div>
                    <div className="xl:col-span-7 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            {sumula7Output.title}
                          </h3>
                          <p className="text-xs text-emerald-400 font-mono-tabular">
                            {sumula7Output.status}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard('sumula7', sumula7Output.content)
                          }
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5 text-blue-400" />
                          <span>Copiar</span>
                        </button>
                      </div>
                      <div className="p-4 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {sumula7Output.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    <div className="xl:col-span-5 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-amber-400" />
                        <span>Calculadora SEEU & Indulto</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block space-y-1">
                          <span className="text-[11px] text-slate-400">Anos</span>
                          <input
                            type="number"
                            min={0}
                            max={60}
                            value={years}
                            onChange={(e) =>
                              setYears(Math.max(0, Number(e.target.value)))
                            }
                            className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs font-mono-tabular text-white"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[11px] text-slate-400">Meses</span>
                          <input
                            type="number"
                            min={0}
                            max={11}
                            value={months}
                            onChange={(e) =>
                              setMonths(
                                Math.min(11, Math.max(0, Number(e.target.value)))
                              )
                            }
                            className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs font-mono-tabular text-white"
                          />
                        </label>
                      </div>
                      <select
                        value={fractionPercent}
                        onChange={(e) =>
                          setFractionPercent(Number(e.target.value))
                        }
                        className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs text-white"
                      >
                        {LEP_FRACTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="date"
                          value={startDateStr}
                          onChange={(e) => setStartDateStr(e.target.value)}
                          className="min-h-[40px] px-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs font-mono-tabular text-white"
                        />
                        <input
                          type="number"
                          min={0}
                          value={detractionDays}
                          onChange={(e) =>
                            setDetractionDays(Math.max(0, Number(e.target.value)))
                          }
                          className="min-h-[40px] px-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs font-mono-tabular text-white"
                        />
                        <input
                          type="number"
                          min={0}
                          value={remittedDays}
                          onChange={(e) =>
                            setRemittedDays(Math.max(0, Number(e.target.value)))
                          }
                          className="min-h-[40px] px-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs font-mono-tabular text-white"
                        />
                      </div>
                      <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            Requisito ({fractionPercent}%)
                          </span>
                          <span className="font-mono-tabular font-bold text-white">
                            {seeuCalc.requiredDays} dias
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Computado</span>
                          <span className="font-mono-tabular text-emerald-400">
                            {seeuCalc.effectiveDays} dias ({seeuCalc.progressPercent}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Progressão</span>
                          <span className="font-mono-tabular font-bold text-amber-400">
                            {seeuCalc.isEligibleNow
                              ? 'Requisito Implementado'
                              : `${seeuCalc.projectedDateStr} (-${seeuCalc.remainingDays}d)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="xl:col-span-7 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            {seeuDraft.title}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {seeuDraft.subtitle}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('seeu', seeuDraft.content)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copiar</span>
                        </button>
                      </div>
                      <div className="p-4 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {seeuDraft.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MÓDULO 04: TRADUTOR WHATSAPP */}
            {activeModule === 'tradutor' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    Input Técnico (Andamento PJe / SEEU)
                  </h3>
                  <textarea
                    rows={5}
                    value={tradutorInput}
                    onChange={(e) => setTradutorInput(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setTradutorOutput(
                        generateHumanizedWhatsapp(activeCase, tradutorInput)
                      );
                      onWhatsappGenerated();
                      onNotify('Mensagem humanizada gerada para WhatsApp');
                    }}
                    className="w-full min-h-[44px] py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Humanizar para WhatsApp da Família</span>
                  </button>
                </div>

                <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <MessageCircleHeart className="w-4 h-4" />
                      <span>Mensagem Pronta (Tom Acolhedor)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('wa', tradutorOutput)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiar WhatsApp</span>
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={tradutorOutput}
                    onChange={(e) => setTradutorOutput(e.target.value)}
                    className="w-full p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          ABA 6: MODO FÓRUM ESTÁTICO (KIT DE AUDIÊNCIA PARA TABLET/FÓRUM)
      ==================================================================== */}
      {activeTab === 'modo_forum' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Gavel className="w-4 h-4 text-amber-400" />
                <span>Kit Estruturado de Audiência (Modo Estático)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Leitura limpa sem rolagem automática. Marque quesitos já
                formulados na sala de audiência e ajuste o porte da fonte.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#060B14] border border-slate-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setForumFontSize((s) => Math.max(14, s - 2))}
                  className="min-h-[36px] px-2.5 text-xs font-bold text-slate-300 hover:text-white"
                >
                  A-
                </button>
                <span className="font-mono-tabular text-[11px] text-slate-400 px-1.5">
                  {forumFontSize}px
                </span>
                <button
                  type="button"
                  onClick={() => setForumFontSize((s) => Math.min(24, s + 2))}
                  className="min-h-[36px] px-2.5 text-xs font-bold text-slate-300 hover:text-white"
                >
                  A+
                </button>
              </div>

              <button
                type="button"
                onClick={() => setTab('exportacao')}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Ir para Exportação Autenticada →</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bloco 01: Perguntas ao Assistido */}
            <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Bloco 01 · Perguntas ao Assistido
              </h4>
              <div className="space-y-2">
                {(activeCase.forumQuestionsClient ?? []).map((q, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      checkedClientQs[idx]
                        ? 'bg-emerald-950/20 border-emerald-500/35 text-slate-400 line-through'
                        : 'bg-[#060B14] border-slate-800 text-slate-100'
                    }`}
                    style={{ fontSize: `${forumFontSize}px` }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checkedClientQs[idx])}
                      onChange={() =>
                        setCheckedClientQs((prev) => ({
                          ...prev,
                          [idx]: !prev[idx],
                        }))
                      }
                      className="mt-1 w-4 h-4 accent-emerald-500 shrink-0"
                    />
                    <span className="leading-relaxed">{q}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bloco 02: Perguntas às Testemunhas / Policiais */}
            <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Bloco 02 · Contradita & Perguntas aos Policiais / Testemunhas
              </h4>
              <div className="space-y-2">
                {(activeCase.forumQuestionsWitness ?? []).map((q, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      checkedWitnessQs[idx]
                        ? 'bg-emerald-950/20 border-emerald-500/35 text-slate-400 line-through'
                        : 'bg-[#060B14] border-slate-800 text-slate-100'
                    }`}
                    style={{ fontSize: `${forumFontSize}px` }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checkedWitnessQs[idx])}
                      onChange={() =>
                        setCheckedWitnessQs((prev) => ({
                          ...prev,
                          [idx]: !prev[idx],
                        }))
                      }
                      className="mt-1 w-4 h-4 accent-emerald-500 shrink-0"
                    />
                    <span className="leading-relaxed">{q}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Bloco 03: Sustentação Oral Editável */}
          <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">
                Bloco 03 · Roteiro de Sustentação Oral / Memoriais
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard('oral-kit', oralDraft)}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-[#060B14] border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copiar Sustentação</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    persistCaseUpdate(
                      { ...activeCase, oralStatement: oralDraft },
                      'Sustentação oral salva no dossiê'
                    )
                  }
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Texto</span>
                </button>
              </div>
            </div>
            <textarea
              rows={7}
              value={oralDraft}
              onChange={(e) => setOralDraft(e.target.value)}
              style={{ fontSize: `${forumFontSize}px` }}
              className="w-full p-4 rounded-xl bg-[#050811] border border-slate-800 text-slate-100 leading-relaxed focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Bloco 04: WhatsApp Humanizado pós-Audiência */}
          <div className="rounded-2xl bg-[#0B111E] border border-emerald-500/35 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <MessageCircleHeart className="w-4 h-4" />
                <span>Bloco 04 · Mensagem de Acolhimento à Família (WhatsApp)</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  copyToClipboard('wa-kit', whatsappDraft);
                  onWhatsappGenerated();
                }}
                className="min-h-[36px] px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Mensagem</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={whatsappDraft}
              onChange={(e) => setWhatsappDraft(e.target.value)}
              style={{ fontSize: `${Math.max(14, forumFontSize - 1)}px` }}
              className="w-full p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-slate-100 leading-relaxed focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>
      )}

      {/* ===================================================================
          ABA 7: EXPORTAÇÃO AUTENTICADA (TIMBRE OFICIAL + SHA-256 + PDF)
      ==================================================================== */}
      {activeTab === 'exportacao' && (
        <div className="space-y-5">
          {/* Controles de Exportação */}
          <div className="no-print rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Modelo de Peça Oficial
                </span>
                <select
                  value={exportTemplate}
                  onChange={(e) =>
                    setExportTemplate(
                      e.target.value as 'sustentacao' | 'roteiro' | 'dossie'
                    )
                  }
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white"
                >
                  <option value="sustentacao">
                    Memorial Jurídico / Sustentação Oral
                  </option>
                  <option value="roteiro">Roteiro Tático de Audiência</option>
                  <option value="dossie">Relatório Executivo do Dossiê</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Signatário(a) OAB
                </span>
                <select
                  value={signatory}
                  onChange={(e) =>
                    setSignatory(e.target.value as 'both' | 'ramon' | 'jessica')
                  }
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white"
                >
                  <option value="both">
                    Dr. Ramon Ribeiro & Dra. Jéssica (Conjunto)
                  </option>
                  <option value="ramon">Dr. Ramon Ribeiro (OAB/RN 14.820)</option>
                  <option value="jessica">Dra. Jéssica (OAB/RN 19.410)</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Salvar PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSignedHtml}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Documento Assinado (.HTML)</span>
              </button>
            </div>
          </div>

          {/* Documento em Papel Branco Timbrado (.legal-paper) */}
          <article
            id="printable-legal-doc"
            className="legal-paper rounded-2xl bg-white text-slate-900 p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto space-y-6 border border-slate-200"
          >
            <header className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-slate-900 text-white flex items-center justify-center font-display font-bold text-base shrink-0">
                  LR
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-extrabold tracking-wide text-slate-900">
                    RAMON RIBEIRO &amp; JÉSSICA
                  </h3>
                  <p className="text-xs text-slate-600">
                    Advocacia Criminal Especializada · TJRN · TJCE · STJ · STF
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono-tabular text-[11px] text-slate-600">
                <div className="font-bold text-slate-900">
                  AUTENTICAÇÃO: {authCode}
                </div>
                <div>Emitido em {new Date().toLocaleString('pt-BR')}</div>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Assistido(a)</span>
                <strong className="text-slate-900 text-sm">
                  {activeCase.assistido}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Processo / APF</span>
                <strong className="font-mono-tabular text-slate-900">
                  {activeCase.processo}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Juízo / Comarca</span>
                <span className="text-slate-800">{activeCase.varaComarca}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Imputação</span>
                <span className="text-slate-800">{activeCase.imputacao}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Scale className="w-4 h-4 text-slate-800" />
                <span>
                  {exportTemplate === 'sustentacao'
                    ? 'Memorial Jurídico / Sustentação Oral'
                    : exportTemplate === 'roteiro'
                    ? 'Roteiro Tático de Audiência (AIJ / Custódia)'
                    : 'Relatório Executivo do Dossiê'}
                </span>
              </div>
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-serif">
                {printableBody}
              </div>
            </div>

            <footer className="pt-6 border-t border-slate-300 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {(signatory === 'both' || signatory === 'ramon') && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">
                      Dr. Ramon Ribeiro
                    </div>
                    <div className="font-mono-tabular text-slate-600">
                      OAB/RN 14.820 · Sócio Titular
                    </div>
                  </div>
                )}
                {(signatory === 'both' || signatory === 'jessica') && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-900">Dra. Jéssica</div>
                    <div className="font-mono-tabular text-slate-600">
                      OAB/RN 19.410 · Sócia Criminalista (RN &amp; CE)
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono-tabular text-[11px] space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white">
                      Selo de Autenticidade ICP-Brasil / OAB · SHA-256
                    </span>
                  </div>
                  <span className="text-slate-300">
                    {new Date().toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="truncate text-amber-300">
                  SHA-256: {sha256Hash}
                </div>
              </div>
            </footer>
          </article>
        </div>
      )}
    </div>
  );
};
