import {
  AgendaDeadlineItem,
  CaseRecord,
  ClientRecord,
  ForumDocument,
  GovernanceConfig,
  KnowledgeBaseItem,
  LegalNewsItem,
  RbacRole,
  RolePermissionItem,
  RolePermissions,
  TeamMember,
} from '../types/lex';

export interface RoleMetadata {
  label: string;
  shortLabel: string;
  badge: string;
  homeTitle: string;
  homeSubtitle: string;
  description: string;
  loginContext: string;
  defaultUser: {
    name: string;
    email: string;
    oab: string;
  };
  permissions: RolePermissions;
  permissionMatrix: RolePermissionItem[];
  canValidate: boolean;
  canEditGovernance: boolean;
}

export const ROLE_META: Record<RbacRole, RoleMetadata> = {
  escritorio: {
    label: 'Sócio Fundador · Dr. Ramon Ribeiro',
    shortLabel: 'Dr. Ramon Ribeiro',
    badge: 'Perfil: Sócio Fundador · Acesso Integral',
    homeTitle: 'Central do Sócio & Coordenação Criminal',
    homeSubtitle:
      'Controle integral da War Room, Dossiês Vivos, Doutor LEX, delegação de flagrantes e assinatura OAB.',
    description:
      'War Room compartilhada, delegação de casos, governança do Doutor LEX, gestão de equipe e validação OAB definitiva.',
    loginContext:
      'Acesso Total: Libera Painel de Controle, Gestão de Equipe/RBAC, Visão Geral, War Room (Dossiês Vivos 1–7) e Assinatura OAB.',
    defaultUser: {
      name: 'Dr. Ramon Ribeiro',
      email: 'ramon@ramonribeiro.adv.br',
      oab: 'OAB/RN 14.820',
    },
    permissions: {
      canValidate: true,
      canEditGovernance: true,
      canViewControlPanel: true,
      canViewOverview: true,
      canManageTeam: true,
      canCreateCase: true,
      canExportProtocol: true,
    },
    permissionMatrix: [
      {
        label: 'Dossiê Vivo (7 Abas · Ficha, Áudio, Timeline & Doutor LEX)',
        allowed: true,
        detail: 'Auditoria de contradições, teses e respostas em tempo real.',
      },
      {
        label: 'Modo Fórum (Kit Estático) & Exportação Autenticada SHA-256',
        allowed: true,
        detail: 'Aprovação final, impressão PDF oficial e descarga HTML autenticada.',
      },
      {
        label: 'Governança de IA & Regras de Comarca (RN / CE)',
        allowed: true,
        detail: 'Edição de vocativos, postura garantista e travas LGPD.',
      },
      {
        label: 'Gestão de Equipe & Delegação RBAC',
        allowed: true,
        detail: 'Controle de acessos de advogados e estagiários da banca.',
      },
      {
        label: 'Indicadores Estratégicos (Visão Geral)',
        allowed: true,
        detail: 'Métricas de liberdade, audiências na semana e prazos fatais.',
      },
    ],
    canValidate: true,
    canEditGovernance: true,
  },
  autonomo: {
    label: 'Sócia · Dra. Jéssica (RN & CE)',
    shortLabel: 'Dra. Jéssica',
    badge: 'Perfil: Sócia · Atuação RN & CE',
    homeTitle: 'Central da Sócia · Atuação Estratégica RN & CE',
    homeSubtitle:
      'Fluxo completo para audiências de custódia, AIJ, leis extravagantes, SEEU e atendimento humanizado às famílias.',
    description:
      'Atuação plena com assinatura OAB própria, Dossiês Vivos, Doutor LEX e exportação autenticada.',
    loginContext:
      'Acesso Pleno Advogada: Libera War Room (Dossiês Vivos 1–7), Governança Pessoal, Visão Geral, Modo Fórum e Assinatura OAB.',
    defaultUser: {
      name: 'Dra. Jéssica',
      email: 'jessica@ramonribeiro.adv.br',
      oab: 'OAB/RN 19.410',
    },
    permissions: {
      canValidate: true,
      canEditGovernance: true,
      canViewControlPanel: true,
      canViewOverview: true,
      canManageTeam: false,
      canCreateCase: true,
      canExportProtocol: true,
    },
    permissionMatrix: [
      {
        label: 'Dossiê Vivo (7 Abas · Ficha, Áudio, Timeline & Doutor LEX)',
        allowed: true,
        detail: 'Operação integral em audiência, AIJ e recursos superiores.',
      },
      {
        label: 'Modo Fórum (Kit Estático) & Exportação Autenticada SHA-256',
        allowed: true,
        detail: 'Assinatura OAB própria e exportação PDF/HTML autenticada.',
      },
      {
        label: 'Governança Pessoal da IA',
        allowed: true,
        detail: 'Personalização de vocativo, comarca e filtros.',
      },
      {
        label: 'Indicadores & Agenda Forense (RN / CE)',
        allowed: true,
        detail: 'Acompanhamento de prazos fatais e respostas às famílias.',
      },
      {
        label: 'Gestão Multi-Equipe & Delegação',
        allowed: false,
        detail: 'Disponível exclusivamente para a Coordenação / Sócio Fundador.',
      },
    ],
    canValidate: true,
    canEditGovernance: true,
  },
  estudante: {
    label: 'Estudante / Estagiário(a) / OAB',
    shortLabel: 'Estagiário',
    badge: 'Perfil: Estagiário · Acesso Supervisionado',
    homeTitle: 'Estação de Prática Supervisionada & Simulador',
    homeSubtitle:
      'Triagem de APF, análise preliminar no Dossiê Vivo e treino no Kit Estruturado do Modo Fórum com envio para revisão OAB.',
    description:
      'Acesso supervisionado para triagem de APF, minutas em rascunho e solicitação de revisão ao advogado orientador.',
    loginContext:
      'Acesso Supervisionado: Libera Triagem APF, War Room em rascunho e Modo Fórum; bloqueia Assinatura OAB, Exportação Oficial e Governança.',
    defaultUser: {
      name: 'Lucas Henrique Silva',
      email: 'lucas.estagio@ramonribeiro.adv.br',
      oab: 'OAB/RN 4.192-E',
    },
    permissions: {
      canValidate: false,
      canEditGovernance: false,
      canViewControlPanel: false,
      canViewOverview: false,
      canManageTeam: false,
      canCreateCase: true,
      canExportProtocol: false,
    },
    permissionMatrix: [
      {
        label: 'War Room em Modo Rascunho & Simulação',
        allowed: true,
        detail: 'Montagem de roteiros, linha do tempo, AIJ e cálculos SEEU.',
      },
      {
        label: 'Triagem & Cadastro de APF (Novo Assistido)',
        allowed: true,
        detail: 'Leitura preliminar e organização de fatos para os sócios.',
      },
      {
        label: 'Modo Fórum (Treino Oral & Solicitação de Revisão)',
        allowed: true,
        detail: 'Kit estático de audiência e envio da minuta para assinatura OAB.',
      },
      {
        label: 'Assinatura OAB & Exportação Oficial Autenticada',
        allowed: false,
        detail: 'Restrito a advogado(a) com inscrição OAB definitiva.',
      },
      {
        label: 'Painel de Governança, Equipe & Métricas Executivas',
        allowed: false,
        detail: 'Restrito à coordenação do escritório e sócios.',
      },
    ],
    canValidate: false,
    canEditGovernance: false,
  },
};

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Dr. Ramon Ribeiro',
    email: 'ramon@ramonribeiro.adv.br',
    oab: 'OAB/RN 14.820',
    role: 'escritorio',
    active: true,
    specialty: 'Custódia, Tribunal do Júri & Tribunais Superiores (RN/CE)',
  },
  {
    id: 'tm-2',
    name: 'Dra. Jéssica',
    email: 'jessica@ramonribeiro.adv.br',
    oab: 'OAB/RN 19.410',
    role: 'autonomo',
    active: true,
    specialty: 'Leis Extravagantes, AIJ & Execução Penal SEEU (RN/CE)',
  },
  {
    id: 'tm-3',
    name: 'Dr. Eduardo Paiva',
    email: 'eduardo@ramonribeiro.adv.br',
    oab: 'OAB/RN 20.114',
    role: 'autonomo',
    active: true,
    specialty: 'Plantão de Flagrantes & Habeas Corpus',
  },
  {
    id: 'tm-4',
    name: 'Lucas Henrique Silva',
    email: 'lucas.estagio@ramonribeiro.adv.br',
    oab: 'OAB/RN 4.192-E',
    role: 'estudante',
    active: true,
    specialty: 'Triagem de APF, Pesquisas TJRN/TJCE & Minutas',
  },
];

export const DEFAULT_GOVERNANCE: GovernanceConfig = {
  vocativoPadrao:
    'Meritíssimo Juiz de Direito do Núcleo de Controle de Flagrantes da Comarca de Natal/RN',
  posturaCombativa: 'garantista',
  comarcaPadrao: 'Comarca de Natal/RN',
  bloqueioAlucinacao: true,
  protecaoSilencio: true,
  anonimizacaoLgpd: true,
};

export const INITIAL_CASES: CaseRecord[] = [
  {
    id: 'case-01',
    assistido: 'Carlos Eduardo Silva',
    cpf: '***.482.914-**',
    processo: '0812943-22.2026.8.20.0001',
    varaComarca: 'Núcleo de Flagrantes · Natal/RN',
    imputacao: 'Art. 33, caput, Lei 11.343/06 (Tráfico)',
    situacao: 'Preso em Flagrante',
    urgency: 'critica',
    proximoAto: 'Audiência de Custódia',
    prazoLabel: 'Hoje · 14:00',
    defaultModule: 'custodia',
    assignedTo: 'Dr. Ramon Ribeiro',
    prisonUnit: 'Central de Flagrantes · Zona Sul Natal/RN',
    residenceProof: 'Rua Monte Rei, 142 · Felipe Camarão, Natal/RN (Comprovante anexado)',
    occupation: 'Técnico de Refrigeração (CTPS assinada há 4 anos)',
    children: '2 filhos menores (4 e 7 anos) · Dependente único',
    antecedents: 'Primário, sem antecedentes criminais (CAC negativo)',
    familyContact: 'Maria Silva (Esposa) · (84) 99912-0011',
    resumoFatos:
      'Preso no bairro Felipe Camarão. PM alega "atitude suspeita" na rua e entrou na casa sem mandado, sem autorização por escrito e sem câmera corporal (bodycam). Família entregou CTPS e certidões dos filhos.',
    prepCliente: [
      'Orientar o assistido a manter o direito ao silêncio quanto ao mérito da suposta apreensão (não discutir propriedade de objetos).',
      'Focar respostas exclusivamente na dinâmica ilegal da invasão de domicílio e em eventuais agressões físicas (Resolução CNJ 213).',
      'Confirmar diante do juiz o emprego lícito (Técnico de Refrigeração) e a dependência direta dos dois filhos de 4 e 7 anos.',
    ],
    vulnerabilities: [
      'Ministério Público tende a invocar "crime permanente" para tentar validar ingresso domiciliar.',
      'Rebater imediatamente com Tema 280/STF (RE 603.616) e HC 598.051/STJ: ausência de fundadas razões prévias documentadas.',
      'Ausência absoluta de termo de consentimento assinado ou gravação por câmera corporal.',
    ],
    strategyA:
      'MP opina pela liberdade provisória: acatar o parecer, requerer dispensa de fiança (hipossuficiência) e ajustar eventuais cautelares do Art. 319 CPP ao turno laboral do assistido.',
    strategyB:
      'MP pede conversão em Prisão Preventiva: sustentar Relaxamento da Prisão (Art. 310, I CPP) por violação de domicílio (Tema 280 STF) -> Subsidiariamente Liberdade Provisória (Art. 319 CPP) -> Subsidiariamente Prisão Domiciliar (Art. 318 CPP · 2 filhos menores).',
    forumQuestionsClient: [
      'A guarnição policial apresentou mandado judicial ou pediu permissão escrita/filmada antes de entrar em sua casa?',
      'Você estava trabalhando no dia? Qual seu cargo, empresa e quanto tempo tem de carteira assinada?',
      'Seus dois filhos menores (4 e 7 anos) dependem exclusivamente do seu sustento e cuidados diários?',
      'Houve agressão física ou psicológica entre a abordagem e a chegada à Central de Flagrantes?',
    ],
    forumQuestionsWitness: [
      'Sr. Policial, o BO registra abordagem às 14h20 e apresentação na Delegacia apenas às 16h35. Onde a guarnição permaneceu com o custodiado durante esses 50 minutos sem justificativa?',
      'Qual elemento objetivo prévio existia antes do ingresso na residência, além de suposto "nervosismo ao ver a viatura"?',
      'Por que a viatura não acionou câmeras corporais nem colheu assinatura do morador no termo de entrada?',
    ],
    oralStatement: `Excelentíssimo(a) Juiz(a) de Direito do Núcleo de Controle de Flagrantes de Natal/RN, cumprimento Vossa Excelência e o ilustre membro do Ministério Público.

1. PRELIMINAR DE NULIDADE — VIOLAÇÃO DE DOMICÍLIO (TEMA 280 STF / HC 598.051 STJ)
Requer-se o imediato RELAXAMENTO DA PRISÃO EM FLAGRANTE. O próprio APF evidencia ingresso domiciliar sem mandado, sem gravação e fundado em mero subjetivismo ("nervosismo"), além de hiato injustificado de 50 minutos entre a abordagem e a apresentação na delegacia, contaminando a prova por derivação (Art. 157, §1º CPP).

2. AUSÊNCIA DE PERICULUM LIBERTATIS & ART. 318 CPP
Carlos Eduardo é primário, possui CTPS assinada há 4 anos, residência fixa e dois filhos menores de 4 e 7 anos que dele dependem diretamente.

3. PEDIDOS EM CASCATA
1º) Relaxamento da prisão ilegal (Art. 5º, LXV, CF);
2º) Liberdade Provisória sem fiança ou com cautelares mínimas do Art. 319 CPP;
3º) Prisão Domiciliar (Art. 318 CPP / HC Coletivo 143.641 STF).`,
    familyWhatsappMsg:
      'Olá, Maria! Aqui é da equipe do escritório Ramon Ribeiro & Jéssica. Já analisamos todo o Auto de Prisão do Carlos Eduardo, separamos a carteira de trabalho e as certidões das crianças e identificamos falhas graves na entrada da polícia sem mandado e diferença de horário no BO. Nossa defesa está pronta para pedir o relaxamento da prisão hoje às 14h na Audiência de Custódia. Assim que terminar a audiência, mandamos notícias imediatas!',
    forensicTimeline: [
      {
        id: 'ft-1',
        date: '25/11/2026',
        time: '14:20',
        type: 'police',
        title: 'Abordagem Policial (Versão PM no BO)',
        description:
          'Guarnição relatou no BO que avistou o acusado em "atitude suspeita" na calçada e entrou na residência sem mandado às 14h20.',
        source: 'Boletim de Ocorrência PMRN nº 4421',
        contradiction: false,
      },
      {
        id: 'ft-2',
        date: '25/11/2026',
        time: '15:10',
        type: 'defense',
        title: 'Divergência Cronológica Detectada (Áudio Testemunha)',
        description:
          'Esposa e vizinhos relatam e enviam áudio confirmando que a PM entrou às 13h30 (50 minutos antes do registro oficial no BO) e não portava mandado.',
        source: 'Áudio Entrevista Familiar + WhatsApp',
        contradiction: true,
        contradictionNote:
          'HIATO DE 50 MINUTOS INJUSTIFICADO + INGRESSO SEM MANDADO (TEMA 280 STF): Contradição frontal com o horário da apresentação na Delegacia.',
      },
      {
        id: 'ft-3',
        date: '25/11/2026',
        time: '16:35',
        type: 'police',
        title: 'Lavratura do APF na Delegacia de Plantão',
        description:
          'Auto lavrado pela autoridade policial por Art. 33 da Lei 11.343/06 sem termo de consentimento do morador e sem registro de câmera corporal.',
        source: 'APF PJe 0812943-22.2026',
        contradiction: false,
      },
      {
        id: 'ft-4',
        date: '26/11/2026',
        time: '14:00',
        type: 'judicial',
        title: 'Audiência de Custódia — Núcleo de Natal/RN',
        description:
          'Sustentação oral estruturada: Relaxamento (Tema 280 STF) + Liberdade Provisória + Subsidiário Art. 318 CPP.',
        source: 'Pauta TJRN',
        contradiction: false,
      },
    ],
    createdAt: '2026-11-23T06:10:00Z',
  },
  {
    id: 'case-02',
    assistido: 'Marcos Vinícius Lima',
    cpf: '***.702.114-**',
    processo: '0807312-18.2025.8.20.0001',
    varaComarca: '13ª Vara Criminal · Natal/RN',
    imputacao: 'Art. 157, §2º, II, CP c/c Art. 2º Lei 12.850/13 (ORCRIM)',
    situacao: 'Preventiva',
    urgency: 'critica',
    proximoAto: 'AIJ & Memoriais Orais',
    prazoLabel: 'Contradições Mapeadas',
    defaultModule: 'aij',
    assignedTo: 'Dra. Jéssica',
    prisonUnit: 'CDP Parnamirim/RN',
    residenceProof: 'Av. Ayrton Senna, 890 · Capim Macio, Natal/RN',
    occupation: 'Comerciante Autônomo · Microempreendedor Individual',
    children: '1 filho (9 anos)',
    antecedents: 'Sem condenações transitadas em julgado',
    familyContact: 'Carla Lima (Esposa) · (84) 98744-9012',
    resumoFatos:
      'PM Cb. Silva afirmou no IP que visualizou troca de objetos a 50m; em juízo admitiu que era noite, rua sem iluminação e não houve campana prévia. Lacre do celular rompido sem certidão (quebra da cadeia de custódia, Art. 158-A CPP) e reconhecimento fotográfico irregular (Art. 226 CPP).',
    prepCliente: [
      'Confirmar em interrogatório apenas o álibi comercial e a ausência de vínculo associativo estável (afastar Art. 2º da Lei 12.850/13).',
      'Impugnar expressamente o reconhecimento fotográfico isolado feito na delegacia sem observância do Art. 226 CPP.',
    ],
    vulnerabilities: [
      'Acusação baseada em relatório de extração de celular sem código hash nem termo de abertura de lacre.',
      'Contradição direta entre o depoimento policial no inquérito e a confissão de baixa visibilidade em audiência.',
    ],
    strategyA:
      'Caso o MP peça diligência complementar, opor-se à conversão do julgamento em diligência e requerer imediata absolvição por insuficiência probatória (Art. 386, VII CPP).',
    strategyB:
      'Alegações Finais Orais (Art. 403, §3º CPP): 1º) Nulidade do reconhecimento (Art. 226 CPP / HC 598.886 STJ) e da prova digital (Art. 158-A CPP); 2º) Absolvição por contradição policial (Art. 386, II e VII CPP); 3º) Desclassificação / revogação imediata da preventiva.',
    forumQuestionsClient: [
      'Na delegacia, quantas fotografias foram exibidas à vítima ou testemunha na ocasião do reconhecimento?',
      'O seu aparelho celular foi colocado em envelope lacrado e numerado na sua presença no momento da apreensão?',
    ],
    forumQuestionsWitness: [
      'Sr. Policial, no inquérito o senhor declarou visibilidade nítida a 50 metros. Hoje confirma que a via estava sem iluminação pública às 22h15 e sem campana prévia?',
      'Quem rompeu o lacre do aparelho celular antes da perícia no ITEP, e onde consta a certidão com código hash SHA-256?',
    ],
    oralStatement: `Meritíssimo Juiz de Direito da 13ª Vara Criminal de Natal/RN, cumprimento Vossa Excelência e o ilustre representante do Ministério Público.

1. NULIDADE ABSOLUTA — CADEIA DE CUSTÓDIA (ART. 158-A CPP) E RECONHECIMENTO (ART. 226 CPP)
O aparelho celular apreendido teve seu lacre violado sem lavratura de termo circunstanciado nem preservação de código hash, tornando imprestável qualquer extração digital. Da mesma forma, o reconhecimento fotográfico isolado viola o Art. 226 do CPP e o precedente vinculante do STJ (HC 598.886).

2. CONTRADIÇÃO POLICIAL INSANÁVEL & IN DUBIO PRO REO
A testemunha policial contradisse o próprio inquérito ao admitir escuridão na via e ausência de campana prévia.

3. PEDIDOS FINAIS ORAIS (ART. 403, §3º CPP)
Requer a ABSOLVIÇÃO nos termos do Art. 386, II e VII do CPP, com expedição imediata de alvará de soltura.`,
    familyWhatsappMsg:
      'Olá, Carla! Equipe Dr. Ramon Ribeiro & Dra. Jéssica passando para atualizar sobre o processo do Marcos Vinícius. Mapeamos todas as contradições do depoimento policial e a quebra de lacre do celular sem certidão (Art. 158-A CPP). Nossos memoriais orais já estão estruturados para pedir a nulidade da prova e absolvição na audiência. Seguimos firmes!',
    forensicTimeline: [
      {
        id: 'ft-21',
        date: '14/09/2026',
        time: '22:15',
        type: 'police',
        title: 'Apreensão de Celular & Reconhecimento Fotográfico',
        description:
          'Auto de apreensão sem numeração de lacre e reconhecimento realizado via tela de celular na delegacia.',
        source: 'IP Delegacia Especializada',
        contradiction: true,
        contradictionNote:
          'QUEBRA DE CADEIA DE CUSTÓDIA (ART. 158-A CPP) + VÍCIO ART. 226 CPP: Lacre rompido sem certidão nem hash e reconhecimento fotográfico sem alinhamento.',
      },
      {
        id: 'ft-22',
        date: '10/10/2026',
        time: '15:00',
        type: 'defense',
        title: 'Resposta à Acusação Protocolada (Dra. Jéssica)',
        description:
          'Arguida inépcia quanto à Lei 12.850/13 e desentranhamento da prova digital.',
        source: 'PJe TJRN',
        contradiction: false,
      },
      {
        id: 'ft-23',
        date: '27/11/2026',
        time: '09:30',
        type: 'judicial',
        title: 'AIJ & Memoriais Orais na 13ª Vara Criminal',
        description:
          'Oitiva das testemunhas e sustentação oral com base nas contradições mapeadas.',
        source: 'Pauta 13ª Vara Natal/RN',
        contradiction: false,
      },
    ],
    createdAt: '2026-11-21T14:20:00Z',
  },
  {
    id: 'case-03',
    assistido: 'Fernanda Costa Oliveira',
    cpf: '***.931.503-**',
    processo: '7001829-11.2023.8.20.0001',
    varaComarca: 'VEP SEEU · Natal/RN & STJ',
    imputacao: 'Execução Penal · Art. 155, §4º CP & HC STJ (Art. 112 LEP)',
    situacao: 'Regime Fechado (SEEU)',
    urgency: 'alta',
    proximoAto: 'Progressão 16% + Prisão Domiciliar',
    prazoLabel: 'Requisito Implementado',
    defaultModule: 'tribunais',
    assignedTo: 'Dra. Jéssica',
    prisonUnit: 'Complexo Penal João Chaves · Natal/RN',
    residenceProof: 'Rua São José, 54 · Lagoa Nova, Natal/RN (Residência da Avó)',
    occupation: 'Auxiliar Administrativa · Cursos profissionalizantes no presídio',
    children: '1 filha menor (3 anos) sob cuidados da avó materna idosa',
    antecedents: 'Primária · Bom comportamento carcerário atestado',
    familyContact: 'Dona Lúcia (Mãe) · (84) 99620-3318',
    resumoFatos:
      'Reeducanda primária condenada a 5 anos e 4 meses por delito sem violência ou grave ameaça (fração legal de 16% no Art. 112, I, LEP). Possui 142 dias remidos por trabalho/estudo homologados e filha de 3 anos de idade (Art. 318 CPP / HC Coletivo 143.641 STF).',
    prepCliente: [
      'Confirmar junto à família a juntada da certidão de nascimento atualizada da filha (3 anos) e declaração médica da avó.',
      'Requerer retificação imediata do cálculo SEEU com cômputo dos 142 dias remidos antes da verificação da fração de 16%.',
    ],
    vulnerabilities: [
      'Atraso administrativo na homologação dos atestados de remição no sistema SEEU.',
      'Necessidade de prequestionamento explícito no TJRN para eventual HC substitutivo no STJ sem esbarrar na Súmula 7/STJ.',
    ],
    strategyA:
      'Juízo da VEP homologa os 142 dias remidos e defere progressão imediata ao Semiaberto Harmonizado com tornozeleira eletrônica ou trabalho externo.',
    strategyB:
      'Agravo em Execução + HC ao STJ: sustentar cumprimento objetivo de 16% (Art. 112, I, LEP) + imprescindibilidade materna da filha de 3 anos (Art. 318-A CPP e HC 143.641 STF) como matéria puramente de direito (sem reexame Súmula 7/STJ).',
    forumQuestionsClient: [
      'Quantos meses de trabalho e cursos já foram certificados pela direção da unidade prisional?',
      'A certidão de nascimento da sua filha de 3 anos e o comprovante de residência estão atualizados no processo?',
    ],
    forumQuestionsWitness: [
      'Questionamento técnico à SEAP: confirmar a inexistência de falta grave nos últimos 12 meses e a soma integral dos dias trabalhados.',
    ],
    oralStatement: `Excelentíssimo(a) Desembargador(a) / Juiz(a) da Vara de Execuções Penais,

1. IMPLEMENTO DO REQUISITO OBJETIVO (ART. 112, I, LEP — FRAÇÃO 16%)
A reeducanda Fernanda Costa Oliveira é primária, com delito sem violência ou grave ameaça, possuindo 142 dias remidos por trabalho e estudo. Somada a remição como pena efetivamente cumprida (Art. 128 LEP), o requisito objetivo de 16% já se encontra implementado.

2. PROTEÇÃO À PRIMEIRA INFÂNCIA — FILHA DE 3 ANOS (ART. 318 CPP / HC 143.641 STF)
Subsidiariamente, impõe-se a concessão de prisão domiciliar humanitária ou regime aberto/semiaberto harmonizado para assistência direta à filha menor de 3 anos. Pede deferimento.`,
    familyWhatsappMsg:
      'Olá, Dona Lúcia! Aqui é do escritório Dr. Ramon Ribeiro & Dra. Jéssica. Conferimos o cálculo da Fernanda no SEEU: com os 142 dias remidos pelo trabalho dela, ela já atingiu o tempo necessário para a progressão (16%). Além disso, já incluímos o pedido de prisão domiciliar por causa da filhinha de 3 anos. Vamos protocolar o requerimento prioritário hoje!',
    forensicTimeline: [
      {
        id: 'ft-31',
        date: '12/11/2026',
        time: '11:40',
        type: 'defense',
        title: 'Auditoria de Atestado de Pena SEEU (Dra. Jéssica)',
        description:
          'Constatados 142 dias remidos pendentes de atualização automática no cálculo de progressão (16%).',
        source: 'SEEU TJRN',
        contradiction: true,
        contradictionNote:
          'ERRO DE CÁLCULO NO SEEU: Sistema deixou de abater os 142 dias remidos antes da verificação da fração de 16% (Art. 128 LEP).',
      },
      {
        id: 'ft-32',
        date: '25/11/2026',
        time: '16:00',
        type: 'judicial',
        title: 'Protocolo Pedido de Progressão + Art. 318 CPP',
        description:
          'Requerimento de progressão imediata e domiciliar pela filha de 3 anos.',
        source: 'VEP Natal/RN',
        contradiction: false,
      },
    ],
    createdAt: '2026-11-12T11:40:00Z',
  },
  {
    id: 'case-04',
    assistido: 'Rafael Ferreira Lima (R.F.L.)',
    cpf: '***.931.503-**',
    processo: '0004519-90.2026.8.06.0001',
    varaComarca: 'Vara de Custódia · Fortaleza/CE (TJCE)',
    imputacao: 'Art. 2º, Lei 12.850/13 (ORCRIM)',
    situacao: 'Preventiva',
    urgency: 'alta',
    proximoAto: 'Sustentação / Súmula 7 STJ',
    prazoLabel: 'Sustentação Pronta',
    defaultModule: 'tribunais',
    assignedTo: 'Dr. Ramon Ribeiro',
    prisonUnit: 'CPPL II · Itaitinga/CE',
    residenceProof: 'Rua Pereira Filgueiras, 1120 · Aldeota, Fortaleza/CE',
    occupation: 'Motorista de Aplicativo',
    children: 'Sem filhos menores declarados',
    antecedents: 'Primário',
    familyContact: 'Patrícia Lima (Irmã) · (85) 99710-8840',
    resumoFatos:
      'Extração de dados telemáticos de aparelho celular apreendido em Fortaleza/CE sem lacre numerado e sem certidão de hash SHA-256 (quebra da cadeia de custódia, Art. 158-A e seguintes do CPP).',
    createdAt: '2026-11-19T09:15:00Z',
  },
  {
    id: 'case-05',
    assistido: 'Antônio Bezerra Maia (A.B.M.)',
    cpf: '***.219.883-**',
    processo: '0241890-55.2026.8.06.0112',
    varaComarca: '2ª Vara Criminal · Juazeiro do Norte/CE',
    imputacao: 'Art. 14, Lei 10.826/03 (Estatuto do Desarmamento)',
    situacao: 'Liberdade Provisória',
    urgency: 'alta',
    proximoAto: 'Resposta à Acusação (Art. 396 CPP)',
    prazoLabel: 'Prazo: 48h',
    defaultModule: 'aij',
    assignedTo: 'Dra. Jéssica',
    prisonUnit: 'Liberdade Provisória · Sem recolhimento',
    residenceProof: 'Rua São Pedro, 410 · Centro, Juazeiro do Norte/CE',
    occupation: 'Representante Comercial',
    children: 'Sem filhos menores',
    antecedents: 'Primário',
    familyContact: 'Sebastiana Maia (Cônjuge) · (88) 99801-1200',
    resumoFatos:
      'Busca veicular realizada em blitz sem fundada suspeita objetiva (Art. 244 CPP e jurisprudência do STJ). Ausência de laudo definitivo de potencialidade lesiva até a denúncia.',
    createdAt: '2026-11-24T10:30:00Z',
  },
];

export const INITIAL_FORUM_DOC: ForumDocument = {
  id: 'doc-initial-01',
  caseId: 'case-01',
  assistido: 'Carlos Eduardo Silva',
  moduleId: 'custodia',
  title: 'Sustentação Oral — Audiência de Custódia (Cenário B)',
  subtitle: 'Núcleo de Controle de Flagrantes · Natal/RN · Tema 280 STF',
  content: `"Excelentíssimo(a) Juiz(a) de Direito do Núcleo de Controle de Flagrantes da Comarca de Natal/RN, cumprimento Vossa Excelência e o ilustre representante do Ministério Público."

[PRELIMINAR DE NULIDADE — ART. 240 CPP & TEMA 280 STF / HC 598.051 STJ]
A defesa requer, preliminarmente, o RELAXAMENTO DA PRISÃO EM FLAGRANTE. Conforme consta no próprio APF, não houve investigação prévia ou fundadas razões que justificassem a violação de domicílio, além de divergência cronológica de 50 minutos no BO. A mera alegação de "nervosismo ao ver a viatura" não autoriza o ingresso forçado, contaminando todas as provas obtidas por derivação (Teoria dos Frutos da Árvore Envenenada).

[AUSÊNCIA DE PERICULUM LIBERTATIS — ART. 312 & ART. 318 CPP]
Subsidiariamente, caso superada a nulidade, o requerente é primário, possui ocupação lícita comprovada (CTPS assinada há 4 anos) e residência fixa em Natal/RN, além de dois filhos menores (4 e 7 anos) que dele dependem diretamente.

[PEDIDOS EM CASCATA]
1º Principal: Relaxamento da prisão ilegal por violação de domicílio (Art. 5º, LXV, CF);
2º Subsidiário: Liberdade Provisória sem fiança ou com cautelares do Art. 319 do CPP;
3º Subsidiário: Prisão Domiciliar (Art. 318 CPP / HC Coletivo 143.641 STF).`,
  status: 'rascunho',
  updatedAt: '2026-11-23T06:45:00Z',
};

export const SAMPLE_APF_PRESETS = [
  {
    id: 'preset-apf-1',
    label: 'APF_0812943-22.2026_NUCLEO_NATAL.pdf (14 págs)',
    assistido: 'Lucas Gabriel Ferreira',
    processo: '0821044-12.2026.8.20.0001',
    varaComarca: 'Núcleo de Flagrantes · Natal/RN',
    imputacao: 'Art. 33, caput, Lei 11.343/06',
    situacao: 'Preso em Flagrante' as const,
    resumoFatos:
      'Cliente primário, técnico de refrigeração com CTPS assinada, pai de 2 crianças (4 e 7 anos). Policiais ingressaram na residência sem mandado e sem gravação por câmera corporal, alegando apenas denúncia anônima.',
  },
  {
    id: 'preset-apf-2',
    label: 'AIJ_0809112-77_13VARA_NATAL.pdf (22 págs)',
    assistido: 'Thiago Alves Nogueira',
    processo: '0809112-77.2026.8.20.0001',
    varaComarca: '13ª Vara Criminal · Natal/RN',
    imputacao: 'Art. 157, §2º, I e II, CP',
    situacao: 'Preventiva' as const,
    resumoFatos:
      'Vítima não reconheceu o acusado no local dos fatos; reconhecimento posterior realizado por fotografia isolada no aplicativo da delegacia sem alinhamento de pessoas semelhantes (violação ao Art. 226 CPP).',
  },
];

export const INITIAL_LEGAL_NEWS: LegalNewsItem[] = [
  {
    id: 'news-01',
    title: 'STJ (HC 598.051) e Tema 280/STF invalidam ingresso domiciliar baseado em "atitude suspeita"',
    summary:
      'Sexta Turma reiterou que fuga ou nervosismo diante de viatura, sem termo escrito ou câmera corporal documentando consentimento livre, contamina provas derivadas.',
    tribunal: 'STJ',
    category: 'Extravagantes',
    statuteRef: 'Tema 280 STF · HC 598.051/STJ · Art. 240 CPP',
    publishedAt: 'Hoje · 09:40',
    impactLevel: 'alto',
  },
  {
    id: 'news-02',
    title: 'STF (HC 143.641) e Art. 318 CPP ampliam prisão domiciliar para pais/mães de menores e PcD',
    summary:
      'Precedente vinculante impõe substituição da prisão preventiva por domiciliar quando comprovados filhos menores de 12 anos, gestação ou dependente PcD.',
    tribunal: 'STF',
    category: 'Jurisprudência',
    statuteRef: 'HC 143.641 STF · Art. 318 CPP · TJRN',
    publishedAt: 'Hoje · 08:15',
    impactLevel: 'alto',
  },
  {
    id: 'news-03',
    title: 'TJCE e STJ anulam reconhecimento fotográfico informal e exigem hash íntegro (Art. 158-A e 226 CPP)',
    summary:
      'Reconhecimento por WhatsApp/tela sem alinhamento viola o Art. 226 CPP; extração de celular sem lacre nem hash SHA-256 enseja desentranhamento imediato.',
    tribunal: 'TJCE',
    category: 'Jurisprudência',
    statuteRef: 'Art. 158-A CPP · Art. 226 CPP · Lei 12.850/13',
    publishedAt: 'Ontem · 17:30',
    impactLevel: 'alto',
  },
  {
    id: 'news-04',
    title: '13ª Vara Criminal de Natal & TJRN uniformizam protocolo prévio para Custódia e AIJ',
    summary:
      'Peticionamento prioritário até 2h antes da audiência com juntada digital de comprovante de residência, CTPS e certidões de nascimento para Art. 318 CPP.',
    tribunal: 'TJRN',
    category: 'Plantão & Normas',
    statuteRef: 'Resolução CNJ 213 · Art. 310 CPP · Art. 403 §3º',
    publishedAt: '23/11 · 15:10',
    impactLevel: 'medio',
  },
  {
    id: 'news-05',
    title: 'SEEU RN/CE: mutirão automatizado de remição por estudo e trabalho antes da fração do Art. 112 LEP',
    summary:
      'Varas de Execuções Penais de Natal e Fortaleza uniformizam cômputo de dias remidos antes da verificação objetiva de progressão de regime.',
    tribunal: 'TJRN',
    category: 'Execução Penal',
    statuteRef: 'Art. 112 & Art. 126 Lei 7.210/84 (LEP)',
    publishedAt: '22/11 · 11:00',
    impactLevel: 'medio',
  },
];

export const INITIAL_AGENDA_DEADLINES: AgendaDeadlineItem[] = [
  {
    id: 'ag-01',
    title: 'Audiência de Custódia — Carlos Eduardo Silva (Flagrante Art. 33)',
    caseRef: '0812943-22.2026.8.20.0001',
    assistido: 'Carlos Eduardo Silva',
    tribunal: 'TJRN',
    comarca: 'Núcleo de Flagrantes · Natal/RN',
    dateLabel: 'Hoje',
    timeLabel: '14:00',
    kind: 'audiencia',
    urgency: 'critica',
    responsible: 'Ramon',
    completed: false,
  },
  {
    id: 'ag-02',
    title: 'Prazo Fatal — Resposta à Acusação (Art. 14 Lei 10.826/03)',
    caseRef: '0241890-55.2026.8.06.0112',
    assistido: 'Antônio Bezerra Maia',
    tribunal: 'TJCE',
    comarca: '2ª Vara Criminal · Juazeiro do Norte/CE',
    dateLabel: 'Amanhã',
    timeLabel: '18:00',
    kind: 'prazo_fatal',
    urgency: 'critica',
    responsible: 'Jéssica',
    completed: false,
  },
  {
    id: 'ag-03',
    title: 'AIJ & Memoriais Orais — Marcos Vinícius Lima (13ª Vara Natal)',
    caseRef: '0807312-18.2025.8.20.0001',
    assistido: 'Marcos Vinícius Lima',
    tribunal: 'TJRN',
    comarca: '13ª Vara Criminal · Natal/RN',
    dateLabel: '27/11',
    timeLabel: '09:30',
    kind: 'audiencia',
    urgency: 'alta',
    responsible: 'Jéssica',
    completed: false,
  },
  {
    id: 'ag-04',
    title: 'Sustentação Oral HC Cadeia de Custódia (ORCRIM)',
    caseRef: '0004519-90.2026.8.06.0001',
    assistido: 'Rafael Ferreira Lima',
    tribunal: 'TJCE',
    comarca: '2ª Câmara Criminal · Fortaleza/CE',
    dateLabel: '29/11',
    timeLabel: '10:00',
    kind: 'sustentacao',
    urgency: 'alta',
    responsible: 'Ramon',
    completed: false,
  },
  {
    id: 'ag-05',
    title: 'Protocolo Pedido de Progressão Art. 112 LEP (16%) — Fernanda Costa',
    caseRef: '7001829-11.2023.8.20.0001',
    assistido: 'Fernanda Costa Oliveira',
    tribunal: 'TJRN',
    comarca: 'VEP SEEU · Natal/RN',
    dateLabel: '30/11',
    timeLabel: '17:00',
    kind: 'prazo_fatal',
    urgency: 'monitorada',
    responsible: 'Jéssica',
    completed: false,
  },
];

export const INITIAL_CLIENTS: ClientRecord[] = [
  {
    id: 'cli-01',
    name: 'Carlos Eduardo Silva',
    cpfMasked: '***.482.914-**',
    phoneWhatsapp: '(84) 99914-2201',
    familyContact: 'Maria Silva (Esposa) · (84) 99912-0011',
    comarca: 'Natal/RN',
    tribunal: 'TJRN',
    custodyStatus: 'Preso em Flagrante',
    prisonUnit: 'Central de Flagrantes · Zona Sul Natal/RN',
    imputationSummary: 'Art. 33, caput, Lei 11.343/06 (Lei de Drogas)',
    caseId: 'case-01',
    assignedLawyer: 'Dr. Ramon Ribeiro',
    createdAt: '2026-11-23T06:10:00Z',
    importantPoints: [
      {
        id: 'pt-01',
        category: 'nulidade',
        title: 'Ingresso em domicílio sem mandado + hiato de 50 min no BO',
        detail:
          'Guarnição justificou entrada apenas por "nervosismo ao avistar a viatura" e registrou abordagem 50 minutos depois do horário confirmado pela família (Tema 280 STF / HC 598.051 STJ).',
        pinned: true,
      },
      {
        id: 'pt-02',
        category: 'vinculo_licito',
        title: 'CTPS assinada (4 anos) + 2 filhos menores (4 e 7 anos)',
        detail:
          'Técnico de refrigeração com comprovante de residência em Felipe Camarão e certidões anexadas para pedido subsidiário de Art. 318 CPP.',
        pinned: true,
      },
      {
        id: 'pt-03',
        category: 'estrategia',
        title: 'Desclassificação / Redutor Art. 33 §4º',
        detail:
          'Réu primário, sem antecedentes e sem vínculo com organização criminosa.',
        pinned: false,
      },
    ],
    timeline: [
      {
        id: 'tl-01',
        date: '25/11/2026 · 14:20',
        stage: 'Abordagem / APF',
        title: 'Prisão em flagrante sem mandado no bairro Felipe Camarão',
        description:
          'PM ingressou na residência após suposto nervosismo; nenhum registro em câmera corporal foi juntado ao APF.',
        importance: 'critico',
        responsible: 'Plantão Natal/RN',
      },
      {
        id: 'tl-02',
        date: '25/11/2026 · 15:10',
        stage: 'Atendimento',
        title: 'Entrevista familiar & áudio confirmando diferença de 50 min no BO',
        description:
          'Família entregou CTPS, comprovante de endereço, certidões dos dois filhos menores e áudio anexado ao Cérebro Doutor LEX.',
        importance: 'critico',
        responsible: 'Dr. Ramon Ribeiro',
      },
      {
        id: 'tl-03',
        date: '26/11/2026 · 14:00',
        stage: 'Custódia',
        title: 'Audiência de Custódia no Núcleo de Natal/RN',
        description:
          'Sustentação oral estruturada no Cenário B (relaxamento por violação de domicílio + liberdade provisória + Art. 318 CPP).',
        importance: 'critico',
        responsible: 'Dr. Ramon Ribeiro',
      },
    ],
  },
  {
    id: 'cli-02',
    name: 'Marcos Vinícius Lima',
    cpfMasked: '***.702.114-**',
    phoneWhatsapp: '(84) 98842-1099',
    familyContact: 'Carla Lima (Esposa) · (84) 98744-9012',
    comarca: 'Natal/RN',
    tribunal: 'TJRN',
    custodyStatus: 'Prisão Preventiva',
    prisonUnit: 'CDP Parnamirim/RN',
    imputationSummary: 'Art. 157, §2º, II, CP c/c Art. 2º Lei 12.850/13',
    caseId: 'case-02',
    assignedLawyer: 'Dra. Jéssica',
    createdAt: '2026-11-18T11:00:00Z',
    importantPoints: [
      {
        id: 'pt-04',
        category: 'prova',
        title: 'Contradição direta do PM condutor em juízo',
        detail:
          'No IP afirmou visão nítida a 50m; na AIJ confessou rua escura e ausência de campana prévia.',
        pinned: true,
      },
      {
        id: 'pt-05',
        category: 'nulidade',
        title: 'Quebra da cadeia de custódia digital (Art. 158-A CPP) + Art. 226',
        detail:
          'Lacre do aparelho celular foi rompido na delegacia sem lavratura de termo circunstanciado nem cálculo de hash.',
        pinned: true,
      },
    ],
    timeline: [
      {
        id: 'tl-04',
        date: '14/09/2026 · 22:15',
        stage: 'Inquérito',
        title: 'Apreensão de celular sem lacre numerado e reconhecimento fotográfico',
        description:
          'Auto de apreensão omitiu número de série e código de integridade do dispositivo.',
        importance: 'critico',
        responsible: 'Delegacia Especializada',
      },
      {
        id: 'tl-05',
        date: '10/10/2026 · 15:00',
        stage: 'Denúncia',
        title: 'Recebimento da denúncia na 13ª Vara Criminal de Natal/RN',
        description:
          'Apresentada Resposta à Acusação arguindo inépcia parcial e ilicitude da prova digital.',
        importance: 'importante',
        responsible: 'Dra. Jéssica',
      },
      {
        id: 'tl-06',
        date: '27/11/2026 · 09:30',
        stage: 'AIJ / Instrução',
        title: 'Audiência de Instrução e Julgamento + Memoriais Orais',
        description:
          'Roteiro de reperguntas e memoriais do Art. 403 §3º CPP prontos para sustentação.',
        importance: 'critico',
        responsible: 'Dra. Jéssica',
      },
    ],
  },
  {
    id: 'cli-03',
    name: 'Fernanda Costa Oliveira',
    cpfMasked: '***.931.503-**',
    phoneWhatsapp: '(84) 99620-3318',
    familyContact: 'Dona Lúcia (Mãe) · (84) 99620-3318',
    comarca: 'Natal/RN',
    tribunal: 'TJRN',
    custodyStatus: 'Regime Fechado (SEEU)',
    prisonUnit: 'Complexo Penal João Chaves · Natal/RN',
    imputationSummary: 'Execução Penal Art. 155, §4º CP · Art. 112, I, LEP (16%)',
    caseId: 'case-03',
    assignedLawyer: 'Dra. Jéssica',
    createdAt: '2026-11-12T11:40:00Z',
    importantPoints: [
      {
        id: 'pt-06',
        category: 'vinculo_licito',
        title: '142 dias remidos + Filha menor de 3 anos (Art. 318 CPP)',
        detail:
          'Soma da remição implementa requisito objetivo de 16% no Art. 112, I, LEP; tutela da primeira infância fundamenta prisão domiciliar.',
        pinned: true,
      },
      {
        id: 'pt-07',
        category: 'risco',
        title: 'Evitar Súmula 7/STJ no HC substitutivo',
        detail:
          'Matéria exclusivamente jurídica baseada na certidão de pena do SEEU e certidão de nascimento.',
        pinned: true,
      },
    ],
    timeline: [
      {
        id: 'tl-07',
        date: '12/11/2026 · 11:40',
        stage: 'Execução SEEU',
        title: 'Auditoria SEEU identificou 142 dias remidos não abatidos',
        description:
          'Cálculo defensivo demonstra requisito objetivo de 16% cumprido.',
        importance: 'critico',
        responsible: 'Dra. Jéssica',
      },
      {
        id: 'tl-08',
        date: '30/11/2026 · 17:00',
        stage: 'Execução SEEU',
        title: 'Protocolo Pedido de Progressão + Prisão Domiciliar',
        description:
          'Petição conjunta Art. 112 LEP e Art. 318-A CPP encaminhada à VEP.',
        importance: 'critico',
        responsible: 'Dra. Jéssica',
      },
    ],
  },
  {
    id: 'cli-04',
    name: 'Rafael Ferreira Lima (R.F.L.)',
    cpfMasked: '***.931.503-**',
    phoneWhatsapp: '(85) 99620-3318',
    familyContact: 'Patrícia Lima (Irmã) · (85) 99710-8840',
    comarca: 'Fortaleza/CE',
    tribunal: 'TJCE',
    custodyStatus: 'Prisão Preventiva',
    prisonUnit: 'CPPL II · Itaitinga/CE',
    imputationSummary: 'Art. 2º, Lei 12.850/13 (ORCRIM)',
    caseId: 'case-04',
    assignedLawyer: 'Dr. Ramon Ribeiro',
    createdAt: '2026-11-19T09:15:00Z',
    importantPoints: [
      {
        id: 'pt-08',
        category: 'nulidade',
        title: 'Ausência de hash SHA-256 no espelhamento (TJCE)',
        detail:
          'Extração telemática sem cadeia de custódia auditável viola precedentes das Câmaras Criminais do TJCE e da 6ª Turma do STJ.',
        pinned: true,
      },
    ],
    timeline: [
      {
        id: 'tl-09',
        date: '29/11/2026 · 10:00',
        stage: 'Recurso / STJ',
        title: 'Sustentação Oral de HC na 2ª Câmara Criminal do TJCE',
        description:
          'Pedido de desentranhamento das provas digitais e revogação da preventiva.',
        importance: 'critico',
        responsible: 'Dr. Ramon Ribeiro',
      },
    ],
  },
];

export const INITIAL_KNOWLEDGE_ITEMS: KnowledgeBaseItem[] = [
  {
    id: 'kb-01',
    title: 'Dossiê Tema 280 STF & HC 598.051 STJ — Busca Domiciliar (RN/CE)',
    kind: 'documento',
    mimeType: 'application/pdf',
    fileName: 'dossie_tema280_busca_domiciliar_rn_ce.pdf',
    sizeBytes: 428600,
    clientId: 'cli-01',
    caseId: 'case-01',
    tags: ['Busca Domiciliar', 'Tema 280 STF', 'Art. 240 CPP', 'TJRN'],
    summary:
      'Compilado de teses e precedentes vinculantes sobre ilicitude de ingresso residencial sem mandado baseado apenas em nervosismo ou denúncia anônima.',
    transcriptOrExtract:
      '1. Ônus probatório do Estado quanto ao consentimento livre e esclarecido (HC 598.051/SP). 2. Exigência de fundadas razões prévias documentadas antes da entrada (RE 603.616 / Tema 280 STF). 3. Contaminação por derivação de toda apreensão subsequente (Art. 157, §1º CPP).',
    keyPoints: [
      'Consentimento do morador deve ser documentado por escrito ou vídeo.',
      'Nervosismo ou fuga diante de viatura não configuram fundada razão.',
      'Aplica-se diretamente ao relaxamento do flagrante no Art. 310, I, CPP.',
    ],
    legalRefs: ['Tema 280 STF', 'HC 598.051/STJ', 'Art. 240 CPP', 'Art. 5º, XI, CF'],
    createdAt: '2026-11-23T07:00:00Z',
    addedBy: 'Dr. Ramon Ribeiro',
  },
  {
    id: 'kb-02',
    title: 'Áudio Parlatório Carlos Eduardo — Relato da Abordagem e Vínculos (Natal/RN)',
    kind: 'audio',
    mimeType: 'audio/mp3',
    fileName: 'parlatorio_carlos_eduardo_natal_2511.mp3',
    sizeBytes: 1843200,
    clientId: 'cli-01',
    caseId: 'case-01',
    tags: ['Áudio Parlatório', 'Hiato 50 min BO', 'Filhos Menores', 'Natal/RN'],
    summary:
      'Transcrição do relato do custodiado e familiares sobre o horário real da abordagem (13h30 vs 14h20 no BO), ausência de mandado e dependência de dois filhos menores.',
    transcriptOrExtract:
      '[00:04] Dr. Ramon Ribeiro: "A que horas a guarnição entrou?" [00:09] Relato Familiar: "Eram 13h30 quando arrombaram o portão sem mostrar mandado nem ligar câmera. Meus dois filhos de 4 e 7 anos viram tudo; ele tinha acabado de chegar do serviço de refrigeração."',
    keyPoints: [
      'Divergência de 50 minutos entre o horário real (13h30) e o BO (14h20).',
      'Presença da esposa e dos dois filhos menores (4 e 7 anos) durante o ingresso.',
      'CTPS assinada há 4 anos comprovando vínculo lícito.',
    ],
    legalRefs: ['Art. 318 CPP', 'HC Coletivo 143.641 STF', 'Resolução CNJ 213'],
    createdAt: '2026-11-23T08:40:00Z',
    addedBy: 'Dr. Ramon Ribeiro',
  },
  {
    id: 'kb-03',
    title: 'Guia Cadeia de Custódia Digital & Leis Extravagantes (RN/CE)',
    kind: 'documento',
    mimeType: 'text/plain',
    fileName: 'guia_cadeia_custodia_extravagantes_rn_ce.txt',
    sizeBytes: 94200,
    clientId: 'cli-02',
    caseId: 'case-02',
    tags: ['Art. 158-A CPP', 'Lei 12.850/13', 'Art. 226 CPP', 'TJRN/TJCE'],
    summary:
      'Checklist defensivo para impugnação de provas digitais sem hash SHA-256 e reconhecimento fotográfico irregular em processos de roubo e ORCRIM.',
    transcriptOrExtract:
      'Exigir a sequência de vestígios do Art. 158-B do CPP: reconhecimento, isolamento, fixação, coleta, acondicionamento com lacre numerado, transporte e preservação de hash criptográfico na extração, além do procedimento formal do Art. 226 CPP.',
    keyPoints: [
      'Ausência de lacre numerado e hash invalida prints isolados de WhatsApp.',
      'Reconhecimento fotográfico sem alinhamento viola o Art. 226 CPP (HC 598.886 STJ).',
      'Art. 244 CPP exige fundada suspeita objetiva para busca pessoal e veicular.',
    ],
    legalRefs: ['Art. 158-A a 158-F CPP', 'Lei 12.850/13', 'Art. 226 CPP'],
    createdAt: '2026-11-24T11:15:00Z',
    addedBy: 'Dra. Jéssica',
  },
];
