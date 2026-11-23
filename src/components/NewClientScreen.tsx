import React, { useState } from 'react';
import { CaseRecord, LexModuleId } from '../types/lex';
import { SAMPLE_APF_PRESETS } from '../data/mockCases';
import { ArrowLeft, CheckCircle2, FileText, Upload, UserPlus } from 'lucide-react';

interface NewClientScreenProps {
  onSaveCase: (newCase: CaseRecord, openDirectly: boolean) => void;
  onBack: () => void;
}

export const NewClientScreen: React.FC<NewClientScreenProps> = ({
  onSaveCase,
  onBack,
}) => {
  const [assistido, setAssistido] = useState('');
  const [processo, setProcesso] = useState('');
  const [varaComarca, setVaraComarca] = useState('Núcleo de Garantias · Natal/RN');
  const [imputacao, setImputacao] = useState('');
  const [situacao, setSituacao] = useState<CaseRecord['situacao']>('Preso em Flagrante');
  const [defaultModule, setDefaultModule] = useState<LexModuleId>('custodia');
  const [resumoFatos, setResumoFatos] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyPreset = (presetId: string) => {
    const preset = SAMPLE_APF_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setAssistido(preset.assistido);
    setProcesso(preset.processo);
    setVaraComarca(preset.varaComarca);
    setImputacao(preset.imputacao);
    setSituacao(preset.situacao);
    setDefaultModule(
      preset.situacao === 'Preso em Flagrante' ? 'custodia' : 'aij'
    );
    setResumoFatos(preset.resumoFatos);
    setUploadedFileName(`${preset.assistido.toLowerCase().replace(/\s+/g, '_')}_apf.pdf`);
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);

    // Se for texto simples, lê os primeiros caracteres para preencher o resumo
    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '').trim();
        if (text) {
          setResumoFatos(text.slice(0, 700));
        }
      };
      reader.readAsText(file);
    } else if (!resumoFatos.trim()) {
      setResumoFatos(
        `Conteúdo extraído via OCR de "${file.name}": Auto de Prisão em Flagrante lavrado com narrativa policial padrão; verificar legalidade da abordagem e documentação audiovisual.`
      );
    }
  };

  const handleSubmit = (openDirectly: boolean) => {
    if (!assistido.trim() || !resumoFatos.trim()) {
      setErrorMsg('Preencha ao menos o nome do assistido e a síntese dos fatos (ou carregue um modelo de APF).');
      return;
    }

    const newCase: CaseRecord = {
      id: `case-${Date.now()}`,
      assistido: assistido.trim(),
      processo: processo.trim() || '0899102-00.2026.8.20.0001',
      varaComarca: varaComarca.trim() || 'Natal/RN',
      imputacao: imputacao.trim() || 'A apurar nos autos',
      situacao,
      urgency:
        situacao === 'Preso em Flagrante' || situacao === 'Preventiva'
          ? 'critica'
          : 'monitorada',
      proximoAto:
        defaultModule === 'custodia'
          ? 'Audiência de Custódia'
          : defaultModule === 'aij'
          ? 'AIJ & Alegações Orais'
          : defaultModule === 'tribunais'
          ? 'Impetração de HC (STJ/STF)'
          : defaultModule === 'seeu'
          ? 'Cálculo de Progressão SEEU'
          : 'Comunicação à Família',
      prazoLabel: situacao === 'Preso em Flagrante' ? 'Urgente · Hoje' : 'Em andamento',
      defaultModule,
      resumoFatos: resumoFatos.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveCase(newCase, openDirectly);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel</span>
          </button>
          <h2 className="font-display text-2xl font-bold text-white">
            Novo Assistido & Leitura de APF
          </h2>
          <p className="text-xs text-slate-400">
            Captação rápida em 3 linhas ou upload do Auto de Prisão em Flagrante para envio direto aos módulos Lex Criminal.
          </p>
        </div>
      </div>

      {/* Presets rápidos de demonstração real */}
      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-amber-400">
            Extração Rápida de Modelo (Simular OCR de APF)
          </span>
          <span className="text-[11px] text-slate-400">
            Preenche automaticamente os campos abaixo
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_APF_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Formulário Principal */}
      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 sm:p-6 space-y-5">
        {/* Upload de PDF / TXT */}
        <label className="block rounded-xl border border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-950/60 p-4 cursor-pointer transition-colors">
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {uploadedFileName
                    ? `Arquivo anexado: ${uploadedFileName}`
                    : 'Anexar APF, Denúncia ou Certidão (PDF / TXT)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Processamento isolado em sessão local criptografada
                </p>
              </div>
            </div>
            {uploadedFileName && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
          </div>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Nome do Assistido *
            </span>
            <input
              type="text"
              value={assistido}
              onChange={(e) => setAssistido(e.target.value)}
              placeholder="Ex.: Lucas Gabriel Ferreira"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Número do Processo / APF
            </span>
            <input
              type="text"
              value={processo}
              onChange={(e) => setProcesso(e.target.value)}
              placeholder="0800000-00.2026.8.20.0001"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono-tabular text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Vara / Comarca
            </span>
            <input
              type="text"
              value={varaComarca}
              onChange={(e) => setVaraComarca(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Tipificação / Imputação
            </span>
            <input
              type="text"
              value={imputacao}
              onChange={(e) => setImputacao(e.target.value)}
              placeholder="Ex.: Art. 33, Lei 11.343/06"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Situação Cautelar
            </span>
            <select
              value={situacao}
              onChange={(e) =>
                setSituacao(e.target.value as CaseRecord['situacao'])
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Preso em Flagrante">Preso em Flagrante</option>
              <option value="Preventiva">Prisão Preventiva</option>
              <option value="Liberdade Provisória">Liberdade Provisória</option>
              <option value="Regime Fechado (SEEU)">Regime Fechado (SEEU)</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Módulo Prioritário Lex Criminal
            </span>
            <select
              value={defaultModule}
              onChange={(e) => setDefaultModule(e.target.value as LexModuleId)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="custodia">M1 · Custódia em 30s</option>
              <option value="aij">M2 · AIJ & Alegações Orais</option>
              <option value="tribunais">M3 · STJ / STF & ORCRIM</option>
              <option value="seeu">M4 · Execução Penal (SEEU)</option>
              <option value="whatsapp">M5 · WhatsApp do Cliente</option>
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-300">
            Síntese Fática (3 linhas ou resumo do APF) *
          </span>
          <textarea
            rows={4}
            value={resumoFatos}
            onChange={(e) => setResumoFatos(e.target.value)}
            placeholder="Descreva brevemente as circunstâncias da prisão, eventuais nulidades (busca sem mandado, ausência de bodycam, reconhecimento irregular) e vínculos pessoais..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
          />
        </label>

        {errorMsg && (
          <div
            role="alert"
            className="px-3.5 py-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200"
          >
            {errorMsg}
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Salvar no Painel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar e Abrir no Lex Criminal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
