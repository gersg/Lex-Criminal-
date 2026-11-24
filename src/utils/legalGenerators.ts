import { CaseRecord, GovernanceConfig } from '../types/lex';

export interface CustodiaInput {
  cenario: 'A' | 'B';
  notasParlatorio: string;
  invasaoDomiciliar: boolean;
  filhosMenores: boolean;
  semAudioVideo: boolean;
}

export function generateCustodiaStrategyOutput(
  caso: CaseRecord,
  input: CustodiaInput,
  gov: GovernanceConfig
): {
  perguntas: string[];
  sustentacao: string;
  pedidosCascata: { nivel: string; texto: string }[];
} {
  const perguntas = [
    `Raízes Lícitas: "Qual sua ocupação lícita atual, endereço fixo em ${gov.comarcaPadrao} e quem depende financeiramente do senhor?"`,
    'Dinâmica da Abordagem (Blindagem de Mérito): "Onde exatamente o senhor estava quando a guarnição chegou? Houve autorização escrita ou filmada para entrada na residência?"',
    'Integridade Física (Resolução CNJ 213): "Sofreu alguma agressão física, ameaça ou coação entre a abordagem e a chegada a este Núcleo?"',
  ];

  const notasResumo = input.notasParlatorio.trim() || caso.resumoFatos;
  const isGarantista = gov.posturaCombativa === 'garantista';

  if (input.cenario === 'A') {
    return {
      perguntas,
      sustentacao: `[CENÁRIO A · CELERIDADE E CONSONÂNCIA]
"${gov.vocativoPadrao}, cumprimento Vossa Excelência e o ilustre representante do Ministério Público."

Diante da manifestação ministerial favorável à concessão da liberdade provisória em favor de ${caso.assistido}, a defesa ratifica integralmente o parecer pela restituição imediata do status libertatis.

Conforme os elementos colhidos (${notasResumo}), requer-se apenas que eventuais medidas cautelares do Art. 319 do CPP sejam adequadas ao horário laboral do custodiado, sem prejuízo de seu sustento familiar. Pede deferimento.`,
      pedidosCascata: [
        {
          nivel: '1º Principal',
          texto: 'Homologação da liberdade provisória sem fiança, em consonância com o MP.',
        },
        {
          nivel: '2º Subsidiário',
          texto: 'Adequação das cautelares do Art. 319 CPP ao turno de trabalho do assistido.',
        },
        {
          nivel: '3º Garantia',
          texto: 'Expedição imediata de Alvará de Soltura clausulado em audiência.',
        },
      ],
    };
  }

  const preliminares: string[] = [];
  if (input.invasaoDomiciliar) {
    preliminares.push(
      'violação de domicílio sem mandado judicial e sem fundadas razões prévias (Art. 240 CPP e Tema 280 STF — RE 603.616)'
    );
  }
  if (input.semAudioVideo) {
    preliminares.push(
      'ausência de termo escrito ou registro audiovisual da diligência, descumprindo o ônus probatório estatal firmado no HC 598.051/SP (STJ)'
    );
  }

  const preliminarTexto =
    preliminares.length > 0
      ? `A defesa requer, preliminarmente, o RELAXAMENTO DA PRISÃO EM FLAGRANTE diante de ${preliminares.join(
          ' e '
        )}. A mera alegação subjetiva de "atitude suspeita" ou "nervosismo" contamina todas as provas obtidas por derivação (Teoria dos Frutos da Árvore Envenenada).`
      : 'A defesa requer o relaxamento da prisão por ausência de hipótese flagrancial típica nos termos do Art. 302 do CPP.';

  const sustentacao = `[CENÁRIO B · ${isGarantista ? 'GARANTISTA COMBATIVO' : 'PRAGMÁTICO CAUTELAR'}]
"${gov.vocativoPadrao}, cumprimento Vossa Excelência e o ilustre representante do Ministério Público."

1. PRELIMINAR DE NULIDADE PROBATÓRIA (ART. 310, I, CPP)
${preliminarTexto}

2. INSUBSISTÊNCIA DO PERICULUM LIBERTATIS (ART. 312 CPP)
Subsidiariamente, caso superada a preliminar, constata-se nos autos: "${notasResumo}". A gravidade abstrata do delito (${caso.imputacao}) não supre a ausência de contemporaneidade nem de perigo concreto exigidos pelo Art. 312 e Art. 315, §2º do CPP.${
    input.filhosMenores
      ? ' Ademais, o custodiado é responsável por filhos menores de 12 anos, atraindo a incidência do Art. 318 do CPP e do HC Coletivo 143.641/STF.'
      : ''
  }

3. PEDIDOS EM CASCATA
Requer o relaxamento imediato do flagrante; subsidiariamente, liberdade provisória com cautelares do Art. 319 do CPP; e, no limite, substituição por prisão domiciliar.`;

  return {
    perguntas,
    sustentacao,
    pedidosCascata: [
      {
        nivel: '1º Principal',
        texto:
          'Relaxamento da prisão ilegal por violação de domicílio (Art. 5º, LXV, CF).',
      },
      {
        nivel: '2º Subsidiário',
        texto:
          'Liberdade Provisória sem fiança ou com cautelares do Art. 319 do CPP.',
      },
      {
        nivel: '3º Subsidiário',
        texto: input.filhosMenores
          ? 'Prisão Domiciliar (Art. 318 CPP / HC Coletivo 143.641 STF — imprescindibilidade aos filhos).'
          : 'Substituição cautelar proporcional e expedição de contramandado.',
      },
    ],
  };
}

export function generateAijOralOutput(
  caso: CaseRecord,
  varaSelecionada: string,
  contradicoes: string,
  opcoes: { cadeia158a: boolean; reconhecimento226: boolean }
): { title: string; subtitle: string; content: string } {
  const blocosNulidade: string[] = [];
  if (opcoes.cadeia158a) {
    blocosNulidade.push(
      'DA QUEBRA DA CADEIA DE CUSTÓDIA (ARTS. 158-A A 158-F DO CPP): A prova digital/vestigial carreada padece de nulidade, uma vez que o material apreendido não observou a rastreabilidade de lacre e integridade (código hash), impossibilitando aferir sua mesmidade.'
    );
  }
  if (opcoes.reconhecimento226) {
    blocosNulidade.push(
      'DO VÍCIO DE RECONHECIMENTO (ART. 226 DO CPP): A identificação realizada sem observância do alinhamento formal de pessoas semelhantes viola garantia cogente reconhecida pelo STJ (HC 598.886), não podendo sustentar condenação.'
    );
  }

  const content = `"Meritíssimo Juiz de Direito da ${varaSelecionada}, cumprimento Vossa Excelência, o ilustre representante do Ministério Público, os servidores desta serventia e os presentes."
Processo nº ${caso.processo} · Assistido: ${caso.assistido}

1. SÍNTESE PROBATÓRIA COLHIDA EM AUDIÊNCIA
Excelência, a instrução criminal realizada nesta data sepultou a tese acusatória quanto à imputação de ${caso.imputacao}. Como restou evidente nos depoimentos colhidos sob o crivo do contraditório:
"${contradicoes.trim() || caso.resumoFatos}"

2. PRELIMINARES DE NULIDADE E INSUFICIÊNCIA PROBATÓRIA
${
  blocosNulidade.length > 0
    ? blocosNulidade.join('\n\n')
    : 'A prova produzida exclusivamente na fase policial não foi confirmada por elementos judiciais independentes (Art. 155 CPP).'
}

3. MÉRITO — IN DUBIO PRO REO (ART. 386, II E VII, CPP)
Diante das contradições entre o inquérito e a oitiva judicial, instala-se dúvida razoável insuperável que impõe a absolvição.

4. PEDIDOS FINAIS ORAIS (ART. 403, §3º, CPP)
Requer a defesa:
a) Preliminarmente, o reconhecimento da ilicitude da prova contaminada;
b) No mérito, a ABSOLVIÇÃO de ${caso.assistido} nos termos do Art. 386, incisos II e VII, do CPP;
c) Subsidiariamente, a desclassificação, fixação da pena-base no mínimo legal, substituição por restritivas de direitos (Art. 44 CP) e o direito de recorrer em liberdade.`;

  return {
    title: `Memoriais Orais AIJ — ${varaSelecionada}`,
    subtitle: `${caso.assistido} · Art. 403, §3º CPP`,
    content,
  };
}

export function generateAntiSumula7Output(
  caso: CaseRecord,
  violacoes: {
    art158a: boolean;
    art240: boolean;
    art226: boolean;
    orcrim: boolean;
  },
  trechoAcordao: string
): { status: string; title: string; subtitle: string; content: string } {
  const dispositivos: string[] = [];
  if (violacoes.art158a) dispositivos.push('Art. 158-A a 158-F do CPP');
  if (violacoes.art240) dispositivos.push('Art. 240 e 244 do CPP (Tema 280 STF)');
  if (violacoes.art226) dispositivos.push('Art. 226 do CPP (HC 598.886 STJ)');
  if (violacoes.orcrim) dispositivos.push('Art. 2º da Lei 12.850/13');

  const temFatoProibido =
    /reexaminar provas|rediscutir depoimento|fatos não provados/i.test(
      trechoAcordao
    );

  const dispTexto =
    dispositivos.length > 0 ? dispositivos.join(', ') : 'Art. 312 e 315 do CPP';

  const content = `PRELIMINAR DE ADMISSIBILIDADE — AFASTAMENTO DA SÚMULA 7/STJ & PRÉ-QUESTIONAMENTO
Processo de Origem: ${caso.processo} · Paciente/Recorrente: ${caso.assistido}
Dispositivos Violados: ${dispTexto}

1. DISTINÇÃO ENTRE REEXAME FÁTICO E REVALORAÇÃO JURÍDICA
Não se busca nesta Corte Superior o revolvimento do acervo fático-probatório (óbice da Súmula 7/STJ), mas a estrita REVALORAÇÃO JURÍDICA da moldura fática expressamente delineada no v. acórdão recorrido.

2. MOLDURA FÁTICA INCONTROVERSA EXTRAÍDA DO ACÓRDÃO
"${trechoAcordao.trim() || caso.resumoFatos}"

3. VIOLAÇÃO DIRETA À LEGISLAÇÃO FEDERAL (PRÉ-QUESTIONAMENTO EXPLÍCITO)
A premissa fática registrada pelo Tribunal de origem — incontroversa nos autos — evidencia contrariedade frontal aos dispositivos federais prequestionados (${dispTexto}), autorizando o conhecimento e provimento do recurso especial / habeas corpus substitutivo para declarar a nulidade da prova e revogar a constrição cautelar.`;

  return {
    status: temFatoProibido
      ? 'Atenção: evite expressões de reexame fático; texto ajustado para revaloração jurídica.'
      : `Pré-questionado · Violação Federal: ${dispTexto}`,
    title: 'Razões STJ/STF — Blindagem Anti-Súmula 7',
    subtitle: `${caso.assistido} · ${dispTexto}`,
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
  indultoStatus: string;
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

  const indultoStatus =
    params.fractionPercent <= 20 && progressPercent >= 25
      ? 'Elegível (Comutação 1/5)'
      : params.fractionPercent >= 40
      ? 'Vedado (Fração Hedionda)'
      : 'Em análise de requisito objetivo';

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
    indultoStatus,
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
• Previsão do requisito objetivo: ${
    calc.isEligibleNow
      ? 'REQUISITO JÁ IMPLEMENTADO'
      : `${calc.projectedDateStr} (restam ${calc.remainingDays} dias)`
  }
• Análise de Indulto / Comutação: ${calc.indultoStatus}

3. PEDIDO
Requer a imediata atualização do cálculo no sistema SEEU e o deferimento da progressão de regime em favor de ${caso.assistido}.`;

  return {
    title: `Requerimento de Progressão SEEU (${fractionPercent}% · Art. 112 LEP)`,
    subtitle: `${caso.assistido} · ${caso.processo}`,
    content,
  };
}

export function generateHumanizedWhatsapp(
  caso: CaseRecord,
  technicalText: string
): string {
  const lower = technicalText.toLowerCase();
  const isAlvara =
    lower.includes('alvará') ||
    lower.includes('liberdade provisória') ||
    lower.includes('relaxamento');
  const isProgressao =
    lower.includes('progressão') ||
    lower.includes('semiaberto') ||
    lower.includes('seeu');

  if (isAlvara) {
    return `Olá! Tenho uma atualização muito importante sobre o caso de ${caso.assistido}.

Acabamos de acompanhar a decisão favorável no processo (${caso.processo}): o Juiz concedeu a liberdade provisória e determinou a expedição do Alvará de Soltura.

Ele responderá ao processo em liberdade, cumprindo apenas compromissos simples determinados pelo juízo (como comparecimento periódico e atualização de endereço). Nossa equipe já está acompanhando o cumprimento do alvará junto à unidade para que a soltura ocorra o quanto antes. Qualquer novidade, aviso imediatamente!`;
  }

  if (isProgressao) {
    return `Olá! Passando para atualizar vocês com clareza sobre a execução penal de ${caso.assistido} (${caso.processo}).

Já conferimos o cálculo atualizado de cumprimento de pena e dias remidos por trabalho/estudo, e protocolamos o pedido de progressão para o regime menos gravoso no sistema SEEU.

Agora o pedido segue para parecer do Ministério Público e decisão do Juiz da Execução Penal. Seguimos acompanhando diariamente e avisamos assim que houver movimentação!`;
  }

  return `Olá! Passando para atualizar vocês sobre o andamento de ${caso.assistido} (${caso.processo} — ${caso.varaComarca}) com total transparência.

Analisamos a última movimentação registrada nos autos ("${technicalText
    .trim()
    .slice(0, 95)}...") e já adotamos as providências técnicas cabíveis em defesa dos direitos dele.

Nossa equipe segue monitorando o processo passo a passo. Caso precisem enviar algum comprovante de residência ou trabalho lícito atualizado, podem encaminhar por aqui.`;
}
