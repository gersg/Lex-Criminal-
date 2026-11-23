import { CaseRecord } from '../types/lex';

export interface CustodiaInput {
  cenario: 'A' | 'B';
  semMandado: boolean;
  semAudioVideo: boolean;
  primarioResidenciaFixa: boolean;
  integridadeViolada: boolean;
}

export function generateCustodiaDraft(
  caso: CaseRecord,
  input: CustodiaInput
): { title: string; subtitle: string; content: string } {
  const isCenarioB = input.cenario === 'B';
  const nulidades: string[] = [];
  if (input.semMandado) {
    nulidades.push(
      'ingresso domiciliar sem mandado judicial e sem fundadas razões prévias (Tema 280 STF — RE 603.616)'
    );
  }
  if (input.semAudioVideo) {
    nulidades.push(
      'ausência de documentação escrita ou registro audiovisual do suposto consentimento do morador (HC 598.051/SP — STJ)'
    );
  }
  if (input.integridadeViolada) {
    nulidades.push(
      'indícios de violência ou violação à integridade física durante a abordagem, exigindo encaminhamento imediato ao ITEP/IML e comunicação ao MP'
    );
  }

  const nulidadeTexto =
    nulidades.length > 0
      ? nulidades.map((n, i) => `  ${i + 1}) ${n};`).join('\n')
      : '  1) Ausência de situação flagrancial típica nos termos do Art. 302 do CPP;';

  const content = isCenarioB
    ? `EXCELENTÍSSIMO(A) SENHOR(A) JUIZ(A) DE DIREITO — ${caso.varaComarca.toUpperCase()}
Processo/APF nº ${caso.processo} · Assistido: ${caso.assistido}

1. PRELIMINAR DE ILICITUDE E RELAXAMENTO DA PRISÃO (ART. 310, I, CPP)
Excelência, em contraposição ao requerimento ministerial de conversão em prisão preventiva, a Defesa Técnica destaca vícios insanáveis no Auto de Prisão em Flagrante referente à imputação de ${caso.imputacao}:
${nulidadeTexto}

Nos termos do Tema 280 de Repercussão Geral do STF e do paradigma vinculante firmado no HC 598.051/SP (6ª Turma do STJ), o ônus de comprovar a legalidade da busca sem mandado incumbe exclusivamente aos agentes estatais. A dúvida ou ausência de prova audiovisual resolve-se em favor da inviolabilidade domiciliar (Art. 5º, XI, CF).

2. SÍNTESE DO CONTEXTO FÁTICO
${caso.resumoFatos}

3. INSUBSISTÊNCIA DO PERICULUM LIBERTATIS (ART. 312 E 315, §2º, CPP)
A gravidade abstrata do delito não autoriza a custódia cautelar automática. ${
        input.primarioResidenciaFixa
          ? 'O custodiado é primário, possui residência fixa comprovada e vínculos familiares sólidos na comarca.'
          : 'Não há demonstração de contemporaneidade ou risco concreto à instrução processual.'
      }

4. REQUERIMENTOS FINAIS
a) O RELAXAMENTO IMEDIATO da prisão em flagrante pela ilicitude originária (Art. 5º, LXV, CF);
b) Subsidiariamente, a concessão de LIBERDADE PROVISÓRIA com ou sem medidas cautelares diversas do Art. 319 do CPP.`
    : `EXCELENTÍSSIMO(A) SENHOR(A) JUIZ(A) DE DIREITO — ${caso.varaComarca.toUpperCase()}
Processo/APF nº ${caso.processo} · Assistido: ${caso.assistido}

1. ADESÃO À MANIFESTAÇÃO MINISTERIAL FAVORÁVEL (CENÁRIO A)
Excelência, a Defesa Técnica acompanha a manifestação do Ministério Público pela desnecessidade de custódia cautelar extrema no presente feito (${caso.imputacao}).

2. CONTEXTO FÁTICO E CONDIÇÕES PESSOAIS
${caso.resumoFatos}
${
  input.primarioResidenciaFixa
    ? 'Restam comprovadas a primariedade técnica, residência fixa e ausência de periculosidade concreta.'
    : 'As circunstâncias do fato demonstram plena adequação das cautelares alternativas.'
}

3. REQUERIMENTOS
Requer a imediata expedição de ALVARÁ DE SOLTURA, com homologação da liberdade provisória mediante termo de comparecimento aos atos processuais (Art. 319, I, CPP), dispensando-se fiança diante da hipossuficiência ou proporcionalidade.`;

  return {
    title: `Sustentação Oral — Custódia (${isCenarioB ? 'Cenário B · Combativo' : 'Cenário A · Consensual'})`,
    subtitle: `${caso.varaComarca} · ${caso.assistido}`,
    content,
  };
}

export function generateAijDraft(
  caso: CaseRecord,
  focusPoints: {
    contradicaoAbordagem: boolean;
    cadeiaCustodia: boolean;
    reconhecimento226: boolean;
  }
): { title: string; subtitle: string; content: string } {
  const perguntas: string[] = [
    '1. [Contexto Inicial] Qual era exatamente a distância, o horário e a luminosidade no momento em que a equipe avistou o acusado?',
    '2. [Registro Audiovisual] A viatura ou os agentes portavam câmeras corporais (bodycams) ou registraram a abordagem em áudio/vídeo?',
  ];

  if (focusPoints.contradicaoAbordagem) {
    perguntas.push(
      '3. [Fundadas Razões] Antes da abordagem pessoal ou ingresso, qual elemento objetivo e concreto indicava crime em andamento além de eventual denúncia anônima?'
    );
  }
  if (focusPoints.cadeiaCustodia) {
    perguntas.push(
      '4. [Cadeia de Custódia — Art. 158-A CPP] Quem realizou o acondicionamento do material, qual o número do lacre utilizado no local e quem manteve a custódia até a entrega na central?'
    );
  }
  if (focusPoints.reconhecimento226) {
    perguntas.push(
      '5. [Reconhecimento — Art. 226 CPP] Foi exibida fotografia isolada do acusado à vítima antes do reconhecimento formal? Havia outras pessoas de características semelhantes lado a lado?'
    );
  }

  const content = `ROTEIRO DE AUDIÊNCIA DE INSTRUÇÃO E JULGAMENTO (AIJ) & ALEGAÇÕES ORAIS
Juízo: ${caso.varaComarca} · Processo: ${caso.processo}
Assistido: ${caso.assistido} · Imputação: ${caso.imputacao}

PARTE I — PERGUNTAS ESTRATÉGICAS ÀS TESTEMUNHAS / POLICIAIS
${perguntas.join('\n')}

PARTE II — ALEGAÇÕES FINAIS ORAIS (ART. 403, §3º, CPP)
Excelência, encerrada a instrução criminal, impõe-se a improcedência da pretensão punitiva estatal.

1. PRELIMINAR DE NULIDADE PROBATÓRIA
A prova produzida em juízo não supriu as irregularidades da fase inquisitorial descritas nos autos:
"${caso.resumoFatos}"
${
  focusPoints.reconhecimento226
    ? 'O reconhecimento em desconformidade com o Art. 226 do CPP, conforme jurisprudência consolidada do STJ (HC 598.886), é inválido e não serve de lastro exclusivo à condenação.'
    : ''
}
${
  focusPoints.cadeiaCustodia
    ? 'Ademais, a ausência de preservação rigorosa dos vestígios viola os Arts. 158-A a 158-F do CPP, comprometendo a confiabilidade da prova pericial.'
    : ''
}

2. MÉRITO E IN DUBIO PRO REO (ART. 386, VII, CPP)
Os depoimentos colhidos sob o crivo do contraditório limitaram-se a reproduzir suposições policiais sem prova judicial independente e segura. Diante da dúvida razoável, a absolvição é medida de rigor.

3. REQUERIMENTOS
Requer a Defesa a ABSOLVIÇÃO de ${caso.assistido} com fundamento no Art. 386, incisos II, V ou VII do CPP, com imediata expedição de alvará de soltura.`;

  return {
    title: 'Roteiro AIJ & Alegações Finais Orais (Art. 403, §3º CPP)',
    subtitle: `${caso.varaComarca} · ${caso.assistido}`,
    content,
  };
}

export function generateTribunaisDraft(
  caso: CaseRecord,
  teses: {
    art158a: boolean;
    art226: boolean;
    orcrim: boolean;
    desproporcionalidade: boolean;
  }
): { title: string; subtitle: string; content: string } {
  const blocos: string[] = [];

  if (teses.art158a) {
    blocos.push(`• QUEBRA DA CADEIA DE CUSTÓDIA (ART. 158-A E SEGUINTES DO CPP)
Não há registro cronológico de coleta, lacre numerado, nem comprovação de integridade (código hash) de eventual prova digital ou física apreendida, impondo o desentranhamento do acervo contaminado.`);
  }
  if (teses.art226) {
    blocos.push(`• NULIDADE DO RECONHECIMENTO PESSOAL/FOTOGRÁFICO (ART. 226 CPP)
O procedimento legal previsto no Art. 226 do CPP constitui garantia mínima contra erros judiciários, não mera recomendação, conforme orientação pacífica das Turmas Criminais do STJ.`);
  }
  if (teses.orcrim) {
    blocos.push(`• AUSÊNCIA DE ELEMENTOS CONCRETOS DE ORCRIM (LEI 12.850/13)
A peça acusatória e o decreto cautelar não demonstram divisão estruturada de tarefas, estabilidade associativa nem liderança, restringindo-se a imputações genéricas.`);
  }
  if (teses.desproporcionalidade) {
    blocos.push(`• DESPROPORCIONALIDADE DA PRISÃO CAUTELAR (ART. 282, §6º, CPP)
A prisão preventiva é a ultima ratio do sistema cautelar, devendo ser substituída por medidas do Art. 319 do CPP quando não evidenciada insuficiência das cautelares diversas.`);
  }

  const content = `MEMORIAIS / RAZÕES DE HABEAS CORPUS — TRIBUNAIS SUPERIORES (STJ / STF)
Feito de Origem: ${caso.processo} · ${caso.varaComarca}
Paciente: ${caso.assistido} · Imputação: ${caso.imputacao}

1. OBJETO DA IMPETRAÇÃO E CONSTRANGIMENTO ILEGAL
Submete-se à apreciação desta Corte Superior flagrante constrangimento ilegal decorrente de decisão que manteve a constrição cautelar / validou provas obtidas em violação direta a normas processuais cogentes.
Contexto fático: ${caso.resumoFatos}

2. TESES JURÍDICAS VINCULANTES
${blocos.length > 0 ? blocos.join('\n\n') : '• Violação frontal aos princípios da legalidade estrita e presunção de inocência (Art. 5º, LVII, CF).'}

3. PEDIDO LIMINAR E DE MÉRITO
Requer-se a concessão da ordem, inclusive em caráter liminar, para declarar a ilicitude das provas questionadas e determinar o imediato relaxamento ou revogação da prisão preventiva do Paciente ${caso.assistido}.`;

  return {
    title: 'Razões de Habeas Corpus / Recurso Especial (STJ & STF)',
    subtitle: `${caso.assistido} · ${caso.processo}`,
    content,
  };
}

export interface SeeuCalculationResult {
  totalDays: number;
  requiredDays: number;
  servedDays: number;
  remittedDays: number;
  effectiveDays: number;
  remainingDays: number;
  progressPercent: number;
  projectedDateStr: string;
  isEligibleNow: boolean;
}

export function calculateSeeuProgression(params: {
  years: number;
  months: number;
  fractionPercent: number;
  startDateStr: string;
  detractionDays: number;
  remittedDays: number;
}): SeeuCalculationResult {
  const totalDays = Math.max(1, params.years * 365 + params.months * 30);
  const requiredDays = Math.ceil((totalDays * params.fractionPercent) / 100);

  const startMs = Date.parse(params.startDateStr);
  const baseDate = Number.isNaN(startMs) ? new Date() : new Date(startMs);
  const now = new Date();
  const elapsedDays = Math.max(
    0,
    Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const effectiveDays = elapsedDays + params.detractionDays + params.remittedDays;
  const remainingDays = Math.max(0, requiredDays - effectiveDays);
  const progressPercent = Math.min(
    100,
    Math.round((effectiveDays / Math.max(1, requiredDays)) * 100)
  );

  const projected = new Date(now.getTime() + remainingDays * 24 * 60 * 60 * 1000);
  const projectedDateStr = projected.toLocaleDateString('pt-BR');

  return {
    totalDays,
    requiredDays,
    servedDays: elapsedDays,
    remittedDays: params.remittedDays,
    effectiveDays,
    remainingDays,
    progressPercent,
    projectedDateStr,
    isEligibleNow: remainingDays === 0,
  };
}

export function generateSeeuDraft(
  caso: CaseRecord,
  fractionPercent: number,
  calc: SeeuCalculationResult
): { title: string; subtitle: string; content: string } {
  const content = `EXCELENTÍSSIMO(A) SENHOR(A) JUIZ(A) DE DIREITO DA VARA DE EXECUÇÕES PENAIS
Execução Penal (SEEU) nº ${caso.processo} · Reeducando: ${caso.assistido}

1. REQUERIMENTO DE PROGRESSÃO DE REGIME PRISIONAL (ART. 112 DA LEP)
A Defesa Técnica vem requerer a retificação do atestado de pena e a consequente PROGRESSÃO DE REGIME para o regime menos gravoso, com fundamento no Art. 112 da Lei de Execução Penal.

2. DEMONSTRATIVO OBJETIVO DO LAPSO TEMPORAL (FRAÇÃO: ${fractionPercent}%)
• Pena total unificada: ${calc.totalDays} dias
• Fração legal aplicável (Art. 112 LEP): ${fractionPercent}% (${calc.requiredDays} dias exigidos)
• Tempo cumprido + detração: ${calc.servedDays} dias efetivos em cumprimento
• Dias remidos homologados / pleiteados: ${calc.remittedDays} dias
• Total computado até a presente data: ${calc.effectiveDays} dias (${calc.progressPercent}% do requisito objetivo)
• Previsão do requisito objetivo: ${calc.isEligibleNow ? 'REQUISITO JÁ IMPLEMENTADO' : `${calc.projectedDateStr} (restam ${calc.remainingDays} dias)`}

3. REQUISITO SUBJETIVO
O reeducando ostenta atestado de boa conduta carcerária emitido pela direção do estabelecimento prisional, sem falta grave pendente de homologação.

4. PEDIDO
Requer a imediata atualização do cálculo no sistema SEEU e o deferimento da progressão de regime em favor de ${caso.assistido}.`;

  return {
    title: `Requerimento de Progressão SEEU (${fractionPercent}% · Art. 112 LEP)`,
    subtitle: `${caso.assistido} · ${caso.processo}`,
    content,
  };
}

export function generateWhatsappMessage(
  caso: CaseRecord,
  situacaoAtualizacao: string,
  proximosPassos: string
): string {
  return `Olá, tudo bem? Aqui é da equipe jurídica responsável pela defesa de *${caso.assistido}* (Processo nº ${caso.processo} — ${caso.varaComarca}).

*Atualização do caso:*
${situacaoAtualizacao}

*Próximos passos da Defesa:*
${proximosPassos}

Seguimos acompanhando cada movimentação com total atenção e transparência. Qualquer dúvida ou documento familiar (comprovante de residência ou trabalho lícito), pode enviar por aqui.`;
}
