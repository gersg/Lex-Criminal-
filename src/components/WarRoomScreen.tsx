import React, { useEffect, useMemo, useState } from 'react';
import {
  CaseRecord,
  ForumDocument,
  GovernanceConfig,
  RbacRole,
  WarModuleId,
} from '../types/lex';
import {
  calculateSeeuProgression,
  generateAntiSumula7Output,
  generateAijOralOutput,
  generateCustodiaStrategyOutput,
  generateHumanizedWhatsapp,
  generateSeeuDraft,
} from '../utils/legalGenerators';
import {
  Calculator,
  Check,
  Copy,
  Crosshair,
  FileUp,
  Gavel,
  GitBranch,
  HelpCircle,
  Landmark,
  MessageCircleHeart,
  Mic,
  ShieldCheck,
  Siren,
  Sparkles,
  UploadCloud,
  Zap,
} from 'lucide-react';

interface WarRoomScreenProps {
  cases: CaseRecord[];
  selectedCaseId: string;
  activeModule: WarModuleId;
  governance: GovernanceConfig;
  userRole?: RbacRole;
  onSelectCase: (caseId: string) => void;
  onSelectModule: (moduleId: WarModuleId) => void;
  onSendToForum: (doc: Omit<ForumDocument, 'id' | 'status' | 'updatedAt'>) => void;
  onWhatsappGenerated: () => void;
  onNotify: (msg: string) => void;
}

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

export const WarRoomScreen: React.FC<WarRoomScreenProps> = ({
  cases,
  selectedCaseId,
  activeModule,
  governance,
  userRole = 'escritorio',
  onSelectCase,
  onSelectModule,
  onSendToForum,
  onWhatsappGenerated,
  onNotify,
}) => {
  const activeCase = useMemo(
    () => cases.find((c) => c.id === selectedCaseId) ?? cases[0],
    [cases, selectedCaseId]
  );

  // Módulo 1: Custódia states
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

  // Módulo 2: AIJ states
  const [aijVara, setAijVara] = useState(
    '7ª Vara Criminal da Comarca de Natal/RN'
  );
  const [aijNotes, setAijNotes] = useState(
    'PM Cb. Silva afirmou no IP que visualizou troca de objetos a 50m; em juízo admitiu que era noite, rua sem iluminação e não houve campana prévia. Lacre do celular rompido sem certidão (quebra da cadeia de custódia).'
  );
  const [cadeia158a, setCadeia158a] = useState(true);
  const [reconhecimento226, setReconhecimento226] = useState(false);

  // Módulo 3: Tribunais Superiores & Execução Penal states
  const [tribSubTab, setTribSubTab] = useState<'sumula7' | 'seeu'>('sumula7');
  const [violArt158a, setViolArt158a] = useState(true);
  const [violArt240, setViolArt240] = useState(true);
  const [violArt226, setViolArt226] = useState(false);
  const [violOrcrim, setViolOrcrim] = useState(false);
  const [trechoAcordao, setTrechoAcordao] = useState(
    'O acórdão recorrido registrou expressamente que os policiais ingressaram na residência sem mandado e sem autorização filmada, fundamentando a licitude apenas em nervosismo prévio.'
  );

  // SEEU states
  const [years, setYears] = useState(5);
  const [months, setMonths] = useState(4);
  const [fractionPercent, setFractionPercent] = useState(16);
  const [startDateStr, setStartDateStr] = useState('2025-11-01');
  const [detractionDays, setDetractionDays] = useState(45);
  const [remittedDays, setRemittedDays] = useState(142);

  // Módulo 4: Tradutor Humano WhatsApp states
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

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (activeCase) {
      setCustodiaNotes(activeCase.resumoFatos);
    }
  }, [activeCase]);

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

  const handleApfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setApfLabel(`${file.name} carregado`);
    onNotify(`APF "${file.name}" processado na sessão criptografada`);
  };

  if (!activeCase) {
    return (
      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-8 text-center text-sm text-slate-400">
        Nenhum caso ativo. Cadastre um novo assistido para operar a War Room.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da War Room + Seletor de Caso Ativo */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-amber-400">
            War Room · Operação em Tempo Real · {governance.comarcaPadrao}
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
            Centro de Combate Criminal
          </h2>
          {userRole === 'estudante' && (
            <p className="text-xs text-blue-300 mt-1">
              Modo Simulador Supervisionado: as peças enviadas ao Modo Fórum
              ficarão em rascunho aguardando validação OAB.
            </p>
          )}
        </div>

        <label className="block w-full sm:w-80 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">
            Caso / Assistido em Foco
          </span>
          <select
            value={activeCase.id}
            onChange={(e) => onSelectCase(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#0B111E] border border-slate-800 text-xs font-medium text-slate-100 focus:outline-none focus:border-blue-500"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.assistido} · {c.situacao}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Seletor dos 4 Módulos Operacionais */}
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
                <span className={`text-[10px] sm:text-[11px] font-semibold truncate ${mod.accentText}`}>
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

      {/* ===================================================================
          MÓDULO 01: CENTRAL DE FLAGRANTES & CUSTÓDIA
      ==================================================================== */}
      {activeModule === 'custodia' && custodiaOutput && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Input APF & Notas */}
          <div className="xl:col-span-5 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileUp className="w-4 h-4 text-red-400" />
                <span>1. Input do Flagrante (APF)</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setApfLabel('APF_0812943-22.2026_NUCLEO_NATAL.pdf (14 págs) processado');
                  setCustodiaNotes(
                    'Cliente primário, técnico de refrigeração com CTPS assinada, pai de 2 crianças (4 e 7 anos). Relata que a PM ingressou no quintal e arrombou a porta sem mandado judicial e sem fundadas razões prévias, alegando apenas "nervosismo ao ver a viatura".'
                  );
                  onNotify('Dados do APF cruzados com as notas do parlatório');
                }}
                className="text-xs text-blue-400 hover:underline"
              >
                Carregar Caso Exemplo
              </button>
            </div>

            <label className="block border border-dashed border-slate-700 hover:border-blue-500/70 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#060B14]">
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleApfFile}
                className="hidden"
              />
              <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-200">
                Enviar PDF do APF / BO ou clicar para anexar
              </p>
              <p className="text-[11px] text-emerald-400 font-mono-tabular mt-1">
                {apfLabel}
              </p>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300 block">
                Notas do Atendimento Preliminar (Parlatório)
              </span>
              <textarea
                rows={4}
                value={custodiaNotes}
                onChange={(e) => setCustodiaNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </label>

            <div className="space-y-2">
              <label className="min-h-[44px] flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={invasaoDomiciliar}
                  onChange={() => setInvasaoDomiciliar((v) => !v)}
                  className="accent-blue-500 w-4 h-4 shrink-0"
                />
                <span>Invasão Domiciliar (Art. 240 CPP / Tema 280 STF)</span>
              </label>
              <label className="min-h-[44px] flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={semAudioVideo}
                  onChange={() => setSemAudioVideo((v) => !v)}
                  className="accent-blue-500 w-4 h-4 shrink-0"
                />
                <span>Sem registro audiovisual / termo (HC 598.051 STJ)</span>
              </label>
              <label className="min-h-[44px] flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs cursor-pointer">
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
                onNotify('Roteiro, Árvore de Sustentação e Pedidos em Cascata atualizados')
              }
              className="w-full min-h-[44px] py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Atualizar Estratégia de Custódia</span>
            </button>
          </div>

          {/* Coluna Direita: Roteiro, Árvore A/B e Pedidos em Cascata */}
          <div className="xl:col-span-7 space-y-4">
            {/* 1. Roteiro de Perguntas ao Custodiado */}
            <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>
                    1. Roteiro de Perguntas ao Custodiado (Blindagem de Mérito)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard('perguntas', custodiaOutput.perguntas.join('\n'))
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center gap-1"
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

            {/* 2. Árvore de Sustentação Oral Dinâmica (Cenário A / B) */}
            <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" />
                  <span>2. Árvore de Sustentação Oral Dinâmica</span>
                </span>

                <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto rounded-xl bg-[#060B14] p-1 border border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={() => setCenario('A')}
                    className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      cenario === 'A'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="sm:hidden">Cenário A · Favorável</span>
                    <span className="hidden sm:inline">Cenário A: MP Favorável</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCenario('B')}
                    className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      cenario === 'B'
                        ? 'bg-red-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="sm:hidden">Cenário B · Preventiva</span>
                    <span className="hidden sm:inline">Cenário B: MP Pede Preventiva</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {custodiaOutput.sustentacao}
              </div>

              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard('sustentacao', custodiaOutput.sustentacao)
                  }
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copiar Sustentação</span>
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
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>Enviar para Modo Fórum</span>
                </button>
              </div>
            </div>

            {/* 3. Estrutura de Pedidos em Cascata */}
            <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
              <span className="text-xs font-bold text-amber-400 block">
                3. Estrutura de Pedidos em Cascata
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 rounded-xl bg-[#060B14] border border-slate-800 text-xs">
                {custodiaOutput.pedidosCascata.map((ped) => (
                  <div key={ped.nivel} className="p-3.5 space-y-1">
                    <div className="font-bold text-white">{ped.nivel}</div>
                    <div className="text-slate-400 leading-relaxed">
                      {ped.texto}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MÓDULO 02: AIJ & ALEGAÇÕES FINAIS ORAIS
      ==================================================================== */}
      {activeModule === 'aij' && aijOutput && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span>Auditoria de Autos & Ocorrências na AIJ</span>
            </h3>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Vara Criminal (Endereçamento Automático)
              </span>
              <select
                value={aijVara}
                onChange={(e) => setAijVara(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="7ª Vara Criminal da Comarca de Natal/RN">
                  7ª Vara Criminal da Comarca de Natal/RN
                </option>
                <option value="12ª Vara Criminal da Comarca de Natal/RN">
                  12ª Vara Criminal da Comarca de Natal/RN
                </option>
                <option value="13ª Vara Criminal da Comarca de Natal/RN">
                  13ª Vara Criminal da Comarca de Natal/RN
                </option>
                <option value="2ª Vara Criminal da Comarca de Parnamirim/RN">
                  2ª Vara Criminal da Comarca de Parnamirim/RN
                </option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Contradições Colhidas na Audiência (Tempo Real)
              </span>
              <textarea
                rows={4}
                value={aijNotes}
                onChange={(e) => setAijNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500"
              />
            </label>

            <div className="space-y-2">
              <label className="min-h-[44px] flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={cadeia158a}
                  onChange={() => setCadeia158a((v) => !v)}
                  className="accent-amber-500 w-4 h-4 shrink-0"
                />
                <span>Quebra da Cadeia de Custódia (Art. 158-A CPP)</span>
              </label>
              <label className="min-h-[44px] flex items-center gap-2.5 p-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={reconhecimento226}
                  onChange={() => setReconhecimento226((v) => !v)}
                  className="accent-amber-500 w-4 h-4 shrink-0"
                />
                <span>Vício de Reconhecimento (Art. 226 CPP)</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() =>
                onNotify(`Alegações Finais Orais atualizadas para ${aijVara}`)
              }
              className="w-full min-h-[44px] py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>Gerar Alegações Finais Orais (Art. 403, §3º CPP)</span>
            </button>
          </div>

          <div className="xl:col-span-7 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">{aijOutput.title}</h3>
                <p className="text-xs text-slate-400">{aijOutput.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard('aij', aijOutput.content)}
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copiar Texto</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
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
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Abrir Memoriais no Modo Fórum</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MÓDULO 03: TRIBUNAIS SUPERIORES (ANTI-SÚMULA 7) & EXECUÇÃO PENAL
      ==================================================================== */}
      {activeModule === 'tribunais' && sumula7Output && seeuDraft && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto p-1 rounded-xl bg-[#0B111E] border border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => setTribSubTab('sumula7')}
              className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tribSubTab === 'sumula7'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden">Anti-Súmula 7 STJ</span>
              <span className="hidden sm:inline">
                Filtro Anti-Súmula 7 STJ & Pré-Questionamento
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTribSubTab('seeu')}
              className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tribSubTab === 'seeu'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden">Cálculo SEEU (LEP)</span>
              <span className="hidden sm:inline">
                Calculadora SEEU (Art. 112 LEP) & Indulto
              </span>
            </button>
          </div>

          {tribSubTab === 'sumula7' ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-5 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Dispositivos Federais & Moldura Fática</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {[
                    {
                      checked: violArt158a,
                      toggle: () => setViolArt158a((v) => !v),
                      label: 'Art. 158-A a 158-F CPP (Quebra de Cadeia de Custódia)',
                    },
                    {
                      checked: violArt240,
                      toggle: () => setViolArt240((v) => !v),
                      label: 'Art. 240/244 CPP (Busca Sem Mandado · Tema 280 STF)',
                    },
                    {
                      checked: violArt226,
                      toggle: () => setViolArt226((v) => !v),
                      label: 'Art. 226 CPP (Reconhecimento Irregular · STJ)',
                    },
                    {
                      checked: violOrcrim,
                      toggle: () => setViolOrcrim((v) => !v),
                      label: 'Lei 12.850/13 (Atipicidade de ORCRIM)',
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
                      <span className="text-slate-200">{item.label}</span>
                    </label>
                  ))}
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-300">
                    Trecho Incontroverso do Acórdão Recorrido
                  </span>
                  <textarea
                    rows={4}
                    value={trechoAcordao}
                    onChange={(e) => setTrechoAcordao(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </label>
              </div>

              <div className="xl:col-span-7 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {sumula7Output.title}
                    </h3>
                    <p className="text-xs text-emerald-400 font-mono-tabular mt-0.5">
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

                <div className="p-4 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {sumula7Output.content}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onSendToForum({
                        caseId: activeCase.id,
                        assistido: activeCase.assistido,
                        moduleId: 'tribunais',
                        title: sumula7Output.title,
                        subtitle: sumula7Output.subtitle,
                        content: sumula7Output.content,
                      })
                    }
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Enviar para Modo Fórum</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-5 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Calculadora de Execução Penal & Indulto</span>
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
                      className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs font-mono-tabular text-white"
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
                      className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs font-mono-tabular text-white"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-[11px] text-slate-400">
                    Fração Legal (Art. 112 LEP)
                  </span>
                  <select
                    value={fractionPercent}
                    onChange={(e) => setFractionPercent(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs text-white"
                  >
                    {LEP_FRACTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <label className="block space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400">Data-Base</span>
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="w-full min-h-[44px] px-2.5 py-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs font-mono-tabular text-white"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] text-slate-400">Detração (d)</span>
                    <input
                      type="number"
                      min={0}
                      value={detractionDays}
                      onChange={(e) =>
                        setDetractionDays(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full min-h-[44px] px-2.5 py-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs font-mono-tabular text-white"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] text-slate-400">Remição (d)</span>
                    <input
                      type="number"
                      min={0}
                      value={remittedDays}
                      onChange={(e) =>
                        setRemittedDays(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full min-h-[44px] px-2.5 py-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs font-mono-tabular text-white"
                    />
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
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
                    <span className="font-mono-tabular font-semibold text-emerald-400">
                      {seeuCalc.effectiveDays} dias ({seeuCalc.progressPercent}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Previsão Progressão</span>
                    <span className="font-mono-tabular font-bold text-amber-400">
                      {seeuCalc.isEligibleNow
                        ? 'Requisito Implementado'
                        : `${seeuCalc.projectedDateStr} (-${seeuCalc.remainingDays}d)`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Decreto de Indulto</span>
                    <span className="font-mono-tabular text-emerald-400">
                      {seeuCalc.indultoStatus}
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
                    <p className="text-xs text-slate-400">{seeuDraft.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('seeu', seeuDraft.content)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copiar</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {seeuDraft.content}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onSendToForum({
                        caseId: activeCase.id,
                        assistido: activeCase.assistido,
                        moduleId: 'tribunais',
                        title: seeuDraft.title,
                        subtitle: seeuDraft.subtitle,
                        content: seeuDraft.content,
                      })
                    }
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Enviar para Modo Fórum</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          MÓDULO 04: EXPEDIENTE RÁPIDO & TRADUTOR HUMANO WHATSAPP
      ==================================================================== */}
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
              className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Humanizar para WhatsApp da Família</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <MessageCircleHeart className="w-4 h-4" />
                  <span>Mensagem Pronta (Tom Acolhedor & Claro)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => copyToClipboard('wa', tradutorOutput)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
                >
                  {copiedKey === 'wa' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Copiar WhatsApp</span>
                </button>
              </div>

              <textarea
                rows={9}
                value={tradutorOutput}
                onChange={(e) => setTradutorOutput(e.target.value)}
                className="w-full p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs sm:text-sm text-slate-100 leading-relaxed focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
