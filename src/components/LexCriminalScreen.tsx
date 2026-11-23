import React, { useEffect, useMemo, useState } from 'react';
import { CaseRecord, ForumDocument, LexModuleId } from '../types/lex';
import {
  calculateSeeuProgression,
  generateAijDraft,
  generateCustodiaDraft,
  generateSeeuDraft,
  generateTribunaisDraft,
  generateWhatsappMessage,
} from '../utils/legalGenerators';
import {
  Calculator,
  Check,
  Copy,
  Gavel,
  Landmark,
  MessageSquare,
  Scale,
  Timer,
} from 'lucide-react';

interface LexCriminalScreenProps {
  cases: CaseRecord[];
  selectedCaseId: string;
  activeModule: LexModuleId;
  onSelectCase: (caseId: string) => void;
  onSelectModule: (moduleId: LexModuleId) => void;
  onSendToForum: (doc: Omit<ForumDocument, 'id' | 'status' | 'updatedAt'>) => void;
  onNotify: (msg: string) => void;
}

const MODULE_TABS: {
  id: LexModuleId;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'custodia', label: 'M1 · Custódia 30s', icon: Timer },
  { id: 'aij', label: 'M2 · AIJ & Orais', icon: Landmark },
  { id: 'tribunais', label: 'M3 · STJ / STF', icon: Scale },
  { id: 'seeu', label: 'M4 · SEEU (LEP)', icon: Calculator },
  { id: 'whatsapp', label: 'M5 · WhatsApp', icon: MessageSquare },
];

const LEP_FRACTIONS = [
  { value: 16, label: '16% · Primário sem violência/grave ameaça' },
  { value: 20, label: '20% · Reincidente sem violência/grave ameaça' },
  { value: 25, label: '25% · Primário com violência ou grave ameaça' },
  { value: 30, label: '30% · Reincidente com violência ou grave ameaça' },
  { value: 40, label: '40% · Hediondo ou equiparado (primário)' },
  { value: 50, label: '50% · Hediondo c/ morte (prim.) / Comando ORCRIM' },
  { value: 60, label: '60% · Hediondo ou equiparado (reincidente)' },
  { value: 70, label: '70% · Hediondo com resultado morte (reincidente)' },
];

export const LexCriminalScreen: React.FC<LexCriminalScreenProps> = ({
  cases,
  selectedCaseId,
  activeModule,
  onSelectCase,
  onSelectModule,
  onSendToForum,
  onNotify,
}) => {
  const activeCase = useMemo(
    () => cases.find((c) => c.id === selectedCaseId) ?? cases[0],
    [cases, selectedCaseId]
  );

  // M1 Custódia states
  const [cenario, setCenario] = useState<'A' | 'B'>('B');
  const [semMandado, setSemMandado] = useState(true);
  const [semAudioVideo, setSemAudioVideo] = useState(true);
  const [primarioResidenciaFixa, setPrimarioResidenciaFixa] = useState(true);
  const [integridadeViolada, setIntegridadeViolada] = useState(false);

  // M2 AIJ states
  const [contradicaoAbordagem, setContradicaoAbordagem] = useState(true);
  const [cadeiaCustodia, setCadeiaCustodia] = useState(true);
  const [reconhecimento226, setReconhecimento226] = useState(true);

  // M3 Tribunais states
  const [art158a, setArt158a] = useState(true);
  const [art226, setArt226] = useState(true);
  const [orcrim, setOrcrim] = useState(true);
  const [desproporcionalidade, setDesproporcionalidade] = useState(true);

  // M4 SEEU states
  const [years, setYears] = useState(5);
  const [months, setMonths] = useState(4);
  const [fractionPercent, setFractionPercent] = useState(16);
  const [startDateStr, setStartDateStr] = useState('2025-11-01');
  const [detractionDays, setDetractionDays] = useState(45);
  const [remittedDays, setRemittedDays] = useState(142);

  // M5 WhatsApp states
  const [waUpdate, setWaUpdate] = useState(
    'Protocolamos hoje o pedido fundamentado com os documentos de residência fixa e trabalho lícito, aguardando a apreciação pelo juízo.'
  );
  const [waNext, setWaNext] = useState(
    'Assim que sair a decisão no PJe ou a data da audiência, entraremos em contato imediatamente por aqui.'
  );

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

  const generatedOutput = useMemo(() => {
    if (!activeCase) {
      return { title: '', subtitle: '', content: '' };
    }
    switch (activeModule) {
      case 'custodia':
        return generateCustodiaDraft(activeCase, {
          cenario,
          semMandado,
          semAudioVideo,
          primarioResidenciaFixa,
          integridadeViolada,
        });
      case 'aij':
        return generateAijDraft(activeCase, {
          contradicaoAbordagem,
          cadeiaCustodia,
          reconhecimento226,
        });
      case 'tribunais':
        return generateTribunaisDraft(activeCase, {
          art158a,
          art226,
          orcrim,
          desproporcionalidade,
        });
      case 'seeu':
        return generateSeeuDraft(activeCase, fractionPercent, seeuCalc);
      case 'whatsapp':
        return {
          title: `Informativo WhatsApp · ${activeCase.assistido}`,
          subtitle: 'Comunicação clara e acolhedora para familiares',
          content: generateWhatsappMessage(activeCase, waUpdate, waNext),
        };
    }
  }, [
    activeCase,
    activeModule,
    cenario,
    semMandado,
    semAudioVideo,
    primarioResidenciaFixa,
    integridadeViolada,
    contradicaoAbordagem,
    cadeiaCustodia,
    reconhecimento226,
    art158a,
    art226,
    orcrim,
    desproporcionalidade,
    fractionPercent,
    seeuCalc,
    waUpdate,
    waNext,
  ]);

  const [editableDraft, setEditableDraft] = useState(generatedOutput.content);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditableDraft(generatedOutput.content);
  }, [generatedOutput.content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableDraft);
      setCopied(true);
      onNotify('Texto copiado para a área de transferência');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      onNotify('Selecione o texto no editor para copiar');
    }
  };

  if (!activeCase) {
    return (
      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-8 text-center text-sm text-slate-400">
        Cadastre um assistido para utilizar os módulos Lex Criminal.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + Seletor de Assistido */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-amber-400">
            Lex Criminal · Motor Forense Contextualizado
          </p>
          <h2 className="font-display text-2xl font-bold text-white mt-1">
            Módulos Especializados
          </h2>
        </div>

        <label className="block w-full sm:w-80 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">
            Assistido / Caso Ativo
          </span>
          <select
            value={activeCase.id}
            onChange={(e) => onSelectCase(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B111E] border border-slate-800 text-xs font-medium text-slate-100 focus:outline-none focus:border-amber-500"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.assistido} · {c.situacao}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Navegação dos 5 Módulos */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0B111E] border border-slate-800 overflow-x-auto">
        {MODULE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeModule === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectModule(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Workspace 2 Colunas: Parâmetros do Caso + Minuta Editável */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Coluna Esquerda: Parâmetros Jurídicos do Módulo */}
        <div className="xl:col-span-5 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-5">
          {/* Contexto do Assistido */}
          <div className="pb-4 border-b border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-white">
                {activeCase.assistido}
              </span>
              <span className="font-mono-tabular text-[11px] text-amber-400">
                {activeCase.situacao}
              </span>
            </div>
            <p className="font-mono-tabular text-[11px] text-slate-400">
              {activeCase.processo} · {activeCase.varaComarca}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {activeCase.resumoFatos}
            </p>
          </div>

          {/* Controles Específicos de Cada Módulo */}
          {activeModule === 'custodia' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-200 block">
                  Cenário da Manifestação Ministerial
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCenario('A')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                      cenario === 'A'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold">Cenário A</div>
                    <div className="text-[11px] opacity-80">
                      MP pela liberdade / cautelares
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCenario('B')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                      cenario === 'B'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold">Cenário B</div>
                    <div className="text-[11px] opacity-80">
                      MP pela preventiva (combativo)
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-200 block">
                  Checklist de Nulidades & Garantias
                </span>
                {[
                  {
                    checked: semMandado,
                    toggle: () => setSemMandado((v) => !v),
                    label: 'Busca domiciliar sem mandado (Tema 280 STF)',
                  },
                  {
                    checked: semAudioVideo,
                    toggle: () => setSemAudioVideo((v) => !v),
                    label: 'Ausência de gravação / termo (HC 598.051 STJ)',
                  },
                  {
                    checked: primarioResidenciaFixa,
                    toggle: () => setPrimarioResidenciaFixa((v) => !v),
                    label: 'Primariedade, residência fixa e ocupação lícita',
                  },
                  {
                    checked: integridadeViolada,
                    toggle: () => setIntegridadeViolada((v) => !v),
                    label: 'Relato de abuso / lesão na condução (IML)',
                  },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-start gap-2.5 py-1.5 cursor-pointer text-xs text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={item.toggle}
                      className="mt-0.5 accent-amber-500 rounded"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeModule === 'aij' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-200 block">
                Foco de Inquirição & Alegações Orais (13ª Vara Natal/RN)
              </span>
              {[
                {
                  checked: contradicaoAbordagem,
                  toggle: () => setContradicaoAbordagem((v) => !v),
                  label: 'Contradição nas fundadas razões da abordagem',
                },
                {
                  checked: cadeiaCustodia,
                  toggle: () => setCadeiaCustodia((v) => !v),
                  label: 'Quebra da Cadeia de Custódia (Art. 158-A CPP)',
                },
                {
                  checked: reconhecimento226,
                  toggle: () => setReconhecimento226((v) => !v),
                  label: 'Vício de Reconhecimento (Art. 226 CPP / STJ)',
                },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-start gap-2.5 py-1.5 cursor-pointer text-xs text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={item.toggle}
                    className="mt-0.5 accent-amber-500 rounded"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          )}

          {activeModule === 'tribunais' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-200 block">
                Teses de Corte Superior (STJ / STF & ORCRIM)
              </span>
              {[
                {
                  checked: art158a,
                  toggle: () => setArt158a((v) => !v),
                  label: 'Art. 158-A CPP · Quebra de cadeia / ausência de hash',
                },
                {
                  checked: art226,
                  toggle: () => setArt226((v) => !v),
                  label: 'Art. 226 CPP · Nulidade absoluta de reconhecimento',
                },
                {
                  checked: orcrim,
                  toggle: () => setOrcrim((v) => !v),
                  label: 'Lei 12.850/13 · Ausência de estabilidade/estrutura ORCRIM',
                },
                {
                  checked: desproporcionalidade,
                  toggle: () => setDesproporcionalidade((v) => !v),
                  label: 'Art. 282, §6º CPP · Prisão preventiva desproporcional',
                },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-start gap-2.5 py-1.5 cursor-pointer text-xs text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={item.toggle}
                    className="mt-0.5 accent-amber-500 rounded"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          )}

          {activeModule === 'seeu' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] text-slate-400">Anos de Pena</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={years}
                    onChange={(e) => setYears(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono-tabular text-slate-100"
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
                      setMonths(Math.min(11, Math.max(0, Number(e.target.value))))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono-tabular text-slate-100"
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
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                >
                  {LEP_FRACTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                <label className="block space-y-1">
                  <span className="text-[11px] text-slate-400">Data-Base</span>
                  <input
                    type="date"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono-tabular text-slate-100"
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
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono-tabular text-slate-100"
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
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono-tabular text-slate-100"
                  />
                </label>
              </div>

              {/* Resultado Tabular SEEU */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Requisito ({fractionPercent}%)</span>
                  <span className="font-mono-tabular font-semibold text-white">
                    {seeuCalc.requiredDays} dias
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Computado (Cumprido + Remição)</span>
                  <span className="font-mono-tabular font-semibold text-emerald-400">
                    {seeuCalc.effectiveDays} dias ({seeuCalc.progressPercent}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Previsão da Progressão</span>
                  <span className="font-mono-tabular font-bold text-amber-400">
                    {seeuCalc.isEligibleNow
                      ? 'Requisito Implementado'
                      : `${seeuCalc.projectedDateStr} (-${seeuCalc.remainingDays}d)`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'whatsapp' && (
            <div className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-300">
                  Atualização Processual (linguagem acessível)
                </span>
                <textarea
                  rows={3}
                  value={waUpdate}
                  onChange={(e) => setWaUpdate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 leading-relaxed"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-300">
                  Próximos Passos & Documentos
                </span>
                <textarea
                  rows={2}
                  value={waNext}
                  onChange={(e) => setWaNext(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 leading-relaxed"
                />
              </label>
            </div>
          )}
        </div>

        {/* Coluna Direita: Minuta Gerada & Ações */}
        <div className="xl:col-span-7 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {generatedOutput.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {generatedOutput.subtitle}
                </p>
              </div>
              <span className="text-[11px] text-slate-400">
                Editável antes do envio
              </span>
            </div>

            <textarea
              value={editableDraft}
              onChange={(e) => setEditableDraft(e.target.value)}
              className="w-full flex-1 min-h-[340px] px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-amber-500 resize-y"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>

            {activeModule !== 'whatsapp' && (
              <button
                type="button"
                onClick={() =>
                  onSendToForum({
                    caseId: activeCase.id,
                    assistido: activeCase.assistido,
                    moduleId: activeModule,
                    title: generatedOutput.title,
                    subtitle: generatedOutput.subtitle,
                    content: editableDraft,
                  })
                }
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Enviar para Modo Fórum</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
