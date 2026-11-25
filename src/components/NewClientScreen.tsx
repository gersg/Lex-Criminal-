import React, { useState } from 'react';
import { CaseRecord, WarModuleId } from '../types/lex';
import { SAMPLE_APF_PRESETS } from '../data/mockCases';
import { ArrowLeft, CheckCircle2, FileText, ShieldAlert, Upload, UserPlus } from 'lucide-react';

interface NewClientScreenProps {
  onSaveCase: (newCase: CaseRecord, openDirectly: boolean) => void;
  onBack: () => void;
}

export const NewClientScreen: React.FC<NewClientScreenProps> = ({
  onSaveCase,
  onBack,
}) => {
  const [assistido, setAssistido] = useState('');
  const [cpf, setCpf] = useState('');
  const [processo, setProcesso] = useState('');
  const [varaComarca, setVaraComarca] = useState('13ª Vara Criminal · Natal/RN');
  const [prisonUnit, setPrisonUnit] = useState('');
  const [residenceProof, setResidenceProof] = useState('');
  const [imputacao, setImputacao] = useState('');
  const [situacao, setSituacao] = useState<CaseRecord['situacao']>('Preso em Flagrante');
  const [defaultModule, setDefaultModule] = useState<WarModuleId>('custodia');
  const [assignedTo, setAssignedTo] = useState<'Dr. Ramon Ribeiro' | 'Dra. Jéssica'>(
    'Dr. Ramon Ribeiro'
  );
  const [occupation, setOccupation] = useState('');
  const [children, setChildren] = useState('Não informado');
  const [familyContact, setFamilyContact] = useState('');
  const [resumoFatos, setResumoFatos] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasArt318Trigger =
    /sim|filh|menor|crianç|gestant|pcd|defici[eê]nc|dependente/i.test(children);

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

  const handleSubmit = async (openDirectly: boolean) => {
    if (!assistido.trim() || !resumoFatos.trim()) {
      setErrorMsg('Preencha ao menos o nome do assistido e a síntese dos fatos (ou carregue um modelo de APF).');
      return;
    }

    const cleanName = assistido.trim();
    const cleanVara = varaComarca.trim() || 'Natal/RN';
    const cleanImputacao = imputacao.trim() || 'A apurar nos autos';
    const todayStr = new Date().toISOString().slice(0, 10);

    const draftCase: CaseRecord = {
      id: `case-${Date.now()}`,
      assistido: cleanName,
      cpf: cpf.trim() || undefined,
      processo: processo.trim() || '0899102-00.2026.8.20.0001',
      varaComarca: cleanVara,
      prisonUnit: prisonUnit.trim() || undefined,
      residenceProof: residenceProof.trim() || undefined,
      imputacao: cleanImputacao,
      situacao,
      urgency:
        situacao === 'Preso em Flagrante' || situacao === 'Preventiva'
          ? 'critica'
          : 'monitorada',
      proximoAto:
        defaultModule === 'custodia'
          ? 'Audiência de Custódia'
          : defaultModule === 'aij'
          ? 'AIJ & Memoriais Orais'
          : defaultModule === 'tribunais'
          ? 'STJ/STF & Execução'
          : 'Comunicação à Família',
      prazoLabel: situacao === 'Preso em Flagrante' ? 'Urgente · Hoje' : 'Em andamento',
      defaultModule,
      resumoFatos: resumoFatos.trim(),
      assignedTo,
      occupation: occupation.trim() || 'A comprovar nos autos',
      children,
      antecedents: 'Primário (FAC pendente de juntada)',
      familyContact: familyContact.trim() || 'Contato familiar em triagem',
      createdAt: new Date().toISOString(),
      prepCliente: [
        'Orientar sobre o direito constitucional ao silêncio parcial (Art. 5º, LXIII, CF) quanto ao mérito.',
        'Recolher comprovantes de residência, CTPS/MEI e certidões de nascimento de filhos menores.',
      ],
      vulnerabilities: [
        'Verificar cumprimento do Art. 240 CPP e ausência de registro em câmera corporal (HC 598.051 STJ).',
        'Auditar cadeia de custódia de apreensões conforme Art. 158-A a 158-F do CPP.',
      ],
      strategyA:
        'Acolhimento pelo MP de liberdade provisória ou relaxamento: pugnar pela expedição imediata de alvará sem fiança.',
      strategyB:
        'Pedido ministerial de preventiva: sustentar nulidade da abordagem/ingresso domiciliar e ausência de contemporaneidade (Art. 312 CPP), requerendo cautelares do Art. 319.',
      forumQuestionsClient: [
        'Qual foi exatamente a abordagem inicial e se houve ingresso sem mandado ou autorização gravada?',
        'Houve apresentação de advogado ou contato familiar autorizado na delegacia?',
      ],
      forumQuestionsWitness: [
        'A guarnição portava câmera corporal ativa durante toda a diligência?',
        'Qual foi o critério objetivo prévio antes da abordagem ou entrada no imóvel?',
      ],
      oralStatement: `Excelência, em relação ao assistido ${cleanName} (${cleanVara}), requer a defesa o reconhecimento das ilegalidades procedimentais apontadas nos autos e a aplicação prioritária da liberdade ou cautelares diversas do Art. 319 do CPP.`,
      familyWhatsappMsg: `Olá! Aqui é da equipe do escritório Ramon Ribeiro & Jéssica. Já assumimos a defesa de ${cleanName} (${cleanVara}) e estamos atuando na análise do processo para buscar a melhor medida imediata. Qualquer novidade avisamos por aqui.`,
      forensicTimeline: [
        {
          id: `tl-${Date.now()}-1`,
          date: todayStr,
          time: '09:00',
          type: 'defense',
          title: 'Captação Inicial & Abertura do Dossiê Vivo',
          description: resumoFatos.trim(),
          source: uploadedFileName ? `Anexo: ${uploadedFileName}` : 'Triagem Inicial LexRamon',
        },
      ],
      chatHistory: [],
    };

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftCase),
      });
      if (res.ok) {
        const data = (await res.json()) as { item?: CaseRecord };
        if (data.item) {
          onSaveCase(data.item, openDirectly);
          return;
        }
      }
    } catch {
      // Fallback para estado local se backend estiver offline em preview estático
    }

    onSaveCase(draftCase, openDirectly);
  };

  return (
    <div className="max-w-4xl space-y-6">
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
            Novo Assistido & Dossiê Vivo
          </h2>
          <p className="text-xs text-slate-400">
            Captação rápida ou upload do Auto de Prisão em Flagrante para abertura imediata nas 7 abas da War Room.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-amber-400">
            Extração Rápida de Modelo (Simular OCR de APF)
          </span>
          <span className="text-[11px] text-slate-400">
            Preenche automaticamente os campos abaixo
          </span>
        </div>
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
          {SAMPLE_APF_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#060B14] border border-slate-800 hover:border-amber-500/50 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors text-left"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-5 sm:p-6 space-y-5">
        <label className="block rounded-xl border border-dashed border-slate-700 hover:border-amber-500/50 bg-[#060B14] p-4 cursor-pointer transition-colors">
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              CPF (Mascarado / LGPD)
            </span>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm font-mono-tabular text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Número do Processo (PJe / SEEU / APF)
            </span>
            <input
              type="text"
              value={processo}
              onChange={(e) => setProcesso(e.target.value)}
              placeholder="0800000-00.2026.8.20.0001"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm font-mono-tabular text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Unidade Prisional / Recolhimento
            </span>
            <input
              type="text"
              value={prisonUnit}
              onChange={(e) => setPrisonUnit(e.target.value)}
              placeholder="Ex.: Central de Flagrantes / CDP Parnamirim / CPPL II"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Preso em Flagrante">Preso em Flagrante</option>
              <option value="Preventiva">Prisão Preventiva</option>
              <option value="Liberdade Provisória">Liberdade Provisória</option>
              <option value="Regime Fechado (SEEU)">Regime Fechado (SEEU)</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Sócio(a) Responsável
            </span>
            <select
              value={assignedTo}
              onChange={(e) =>
                setAssignedTo(e.target.value as 'Dr. Ramon Ribeiro' | 'Dra. Jéssica')
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Dr. Ramon Ribeiro">Dr. Ramon Ribeiro</option>
              <option value="Dra. Jéssica">Dra. Jéssica</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Módulo Prioritário War Room
            </span>
            <select
              value={defaultModule}
              onChange={(e) => setDefaultModule(e.target.value as WarModuleId)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="custodia">M1 · Central de Flagrantes</option>
              <option value="aij">M2 · AIJ & Memoriais Orais</option>
              <option value="tribunais">M3 · STJ / STF & Execução</option>
              <option value="tradutor">M4 · Tradutor WhatsApp</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Filhos &lt; 12 anos, Gestação ou Dependente PcD (Art. 318 CPP)
            </span>
            <select
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Não informado">Não informado / Não possui</option>
              <option value="Sim (1 filho menor de 12 anos)">Sim · 1 filho &lt; 12 anos</option>
              <option value="Sim (2 filhos menores de 12 anos)">Sim · 2 filhos &lt; 12 anos</option>
              <option value="Gestante / Lactante (Art. 318, IV)">Gestante / Lactante (Art. 318, IV CPP)</option>
              <option value="Dependente PcD / Pessoa com Deficiência (Art. 318, III/V)">
                Dependente PcD (Art. 318, III/V CPP)
              </option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Profissão / Vínculo Lícito
            </span>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Ex.: Mecânico · CTPS assinada"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Endereço / Comprovante de Residência
            </span>
            <input
              type="text"
              value={residenceProof}
              onChange={(e) => setResidenceProof(e.target.value)}
              placeholder="Ex.: Rua Monte Rei, 142 · Natal/RN (Comprovante anexado)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-slate-300">
              Contato Familiar (WhatsApp)
            </span>
            <input
              type="text"
              value={familyContact}
              onChange={(e) => setFamilyContact(e.target.value)}
              placeholder="Ex.: Mãe · (84) 99900-0000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </label>
        </div>

        {hasArt318Trigger && (
          <div
            role="status"
            className="rounded-xl bg-amber-950/35 border border-amber-500/45 p-4 flex items-start gap-3"
          >
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-amber-300">
                Gatilho Automático · Prisão Domiciliar Prioritária (Art. 318 do CPP)
              </div>
              <p className="text-slate-200 leading-relaxed">
                Critério legal detectado ({children}). Ao abrir o Dossiê Vivo, a
                defesa já contará com alerta prioritário para substituição da
                preventiva por prisão domiciliar (HC 143.641 STF).
              </p>
            </div>
          </div>
        )}

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

        <div className="pt-2 grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Salvar no Painel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar e Abrir Dossiê Vivo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
