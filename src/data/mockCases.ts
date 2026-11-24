import {
  CaseRecord,
  ForumDocument,
  GovernanceConfig,
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
  // Flat convenience aliases
  canValidate: boolean;
  canEditGovernance: boolean;
}

export const ROLE_META: Record<RbacRole, RoleMetadata> = {
  escritorio: {
    label: 'Escritório Criminal (Full Ops)',
    shortLabel: 'Escritório',
    badge: 'Perfil: Escritório Criminal · Acesso Integral',
    homeTitle: 'Central do Sócio & Coordenação Criminal',
    homeSubtitle:
      'Controle completo da War Room, delegação de flagrantes, governança da IA e validação OAB da equipe.',
    description:
      'War Room compartilhada, delegação de casos, governança de IA, gestão de equipe e validação OAB definitiva.',
    loginContext:
      'Acesso Total: Libera Painel de Controle, Gestão de Equipe/RBAC, Visão Geral, War Room (M1–M4) e Assinatura OAB.',
    defaultUser: {
      name: 'Dr. Ramon Medeiros',
      email: 'ramon@medeirosadvocacia.com.br',
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
        label: 'War Room Completa (Custódia, AIJ, STJ/STF, WhatsApp)',
        allowed: true,
        detail: 'Geração de teses, pedidos e memoriais orais em tempo real.',
      },
      {
        label: 'Validação & Assinatura OAB (Modo Fórum)',
        allowed: true,
        detail: 'Aprovação final e exportação .TXT para protocolo PJe/SEEU.',
      },
      {
        label: 'Governança de IA & Regras de Comarca',
        allowed: true,
        detail: 'Edição de vocativos, postura garantista e travas LGPD.',
      },
      {
        label: 'Gestão de Equipe & Delegação RBAC',
        allowed: true,
        detail: 'Controle de acessos de advogados e estagiários do escritório.',
      },
      {
        label: 'Indicadores Estratégicos (Visão Geral)',
        allowed: true,
        detail: 'Métricas de liberdade, tempo de preparo e produtividade.',
      },
    ],
    canValidate: true,
    canEditGovernance: true,
  },
  autonomo: {
    label: 'Advogado(a) Autônomo(a)',
    shortLabel: 'Autônomo',
    badge: 'Perfil: Advogado(a) Autônomo(a) · Plantão Solo',
    homeTitle: 'Central do Advogado · Plantão Criminal Ágil',
    homeSubtitle:
      'Fluxo direto para audiências de custódia, AIJ, recursos superiores e atendimento rápido às famílias.',
    description:
      'Atuação solo com assinatura OAB própria, governança pessoal, War Room completa e tradutor de WhatsApp.',
    loginContext:
      'Modo Plantão Solo: Libera War Room (M1–M4), Governança Pessoal, Visão Geral e Assinatura OAB (sem gestão multi-equipe).',
    defaultUser: {
      name: 'Dra. Camila Vasconcelos',
      email: 'camila@vasconcelospenal.adv.br',
      oab: 'OAB/RN 18.405',
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
        label: 'War Room Completa (Custódia, AIJ, STJ/STF, WhatsApp)',
        allowed: true,
        detail: 'Operação integral em audiência e recursos superiores.',
      },
      {
        label: 'Validação & Assinatura OAB (Modo Fórum)',
        allowed: true,
        detail: 'Assinatura profissional própria e exportação PJe/SEEU.',
      },
      {
        label: 'Governança Pessoal da IA',
        allowed: true,
        detail: 'Personalização de vocativo, comarca e filtros.',
      },
      {
        label: 'Indicadores Pessoais (Visão Geral)',
        allowed: true,
        detail: 'Acompanhamento de casos e respostas às famílias.',
      },
      {
        label: 'Gestão Multi-Equipe & Delegação',
        allowed: false,
        detail: 'Disponível exclusivamente no perfil Escritório Criminal.',
      },
    ],
    canValidate: true,
    canEditGovernance: true,
  },
  estudante: {
    label: 'Estudante / Estagiário(a) / OAB',
    shortLabel: 'Estudante',
    badge: 'Perfil: Estudante / Estagiário · Acesso Supervisionado',
    homeTitle: 'Estação de Prática Supervisionada & Simulador',
    homeSubtitle:
      'Triagem de APF, elaboração de rascunhos na War Room e treino de sustentação no teleprompter com envio para revisão.',
    description:
      'Acesso supervisionado para triagem de APF, elaboração de minutas em rascunho e envio ao advogado orientador.',
    loginContext:
      'Acesso Restrito Supervisionado: Libera Triagem APF, Rascunhos na War Room e Teleprompter; bloqueia Assinatura OAB, Exportação Oficial e Governança.',
    defaultUser: {
      name: 'Lucas Henrique Silva',
      email: 'lucas.estagio@medeirosadvocacia.com.br',
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
        detail: 'Montagem de roteiros, AIJ, cálculos SEEU e minutas.',
      },
      {
        label: 'Triagem & Cadastro de APF (Novo Assistido)',
        allowed: true,
        detail: 'Leitura preliminar e organização de fatos para a banca.',
      },
      {
        label: 'Modo Fórum (Treino Oral & Solicitação de Revisão)',
        allowed: true,
        detail: 'Uso do teleprompter e envio da minuta para revisão OAB.',
      },
      {
        label: 'Assinatura OAB & Exportação Oficial PJe/SEEU',
        allowed: false,
        detail: 'Restrito a advogado(a) com inscrição OAB definitiva.',
      },
      {
        label: 'Painel de Governança, Equipe & Métricas Executivas',
        allowed: false,
        detail: 'Restrito à coordenação do escritório e advogados.',
      },
    ],
    canValidate: false,
    canEditGovernance: false,
  },
};

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Dr. Ramon Medeiros',
    email: 'ramon@medeirosadvocacia.com.br',
    oab: 'OAB/RN 14.820',
    role: 'escritorio',
    active: true,
    specialty: 'Tribunal do Júri, Custódia & Tribunais Superiores',
  },
  {
    id: 'tm-2',
    name: 'Dra. Camila Vasconcelos',
    email: 'camila@medeirosadvocacia.com.br',
    oab: 'OAB/RN 18.405',
    role: 'autonomo',
    active: true,
    specialty: 'Audiências de Instrução (AIJ) & Execução Penal (SEEU)',
  },
  {
    id: 'tm-3',
    name: 'Dr. Eduardo Paiva',
    email: 'eduardo@medeirosadvocacia.com.br',
    oab: 'OAB/RN 20.114',
    role: 'autonomo',
    active: true,
    specialty: 'Plantão de Flagrantes & Habeas Corpus',
  },
  {
    id: 'tm-4',
    name: 'Lucas Henrique Silva',
    email: 'lucas.estagio@medeirosadvocacia.com.br',
    oab: 'OAB/RN 4.192-E',
    role: 'estudante',
    active: true,
    specialty: 'Triagem de APF, Pesquisas STJ & Minutas Supervisionadas',
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
    assistido: 'J.C.S. (Flagrante Art. 33)',
    processo: '0812943-22.2026.8.20.0001',
    varaComarca: 'Núcleo de Flagrantes · Natal/RN',
    imputacao: 'Art. 33, caput, Lei 11.343/06',
    situacao: 'Preso em Flagrante',
    urgency: 'critica',
    proximoAto: 'Audiência de Custódia',
    prazoLabel: 'Hoje · 14:00',
    defaultModule: 'custodia',
    assignedTo: 'Dr. Ramon Medeiros',
    resumoFatos:
      'Cliente primário, técnico de refrigeração com CTPS assinada, pai de 2 crianças (4 e 7 anos). Relata que a PM ingressou no quintal e arrombou a porta sem mandado judicial e sem fundadas razões prévias, alegando apenas "nervosismo ao ver a viatura".',
    createdAt: '2026-11-23T06:10:00Z',
  },
  {
    id: 'case-02',
    assistido: 'M.A.O. (Operação Horizonte)',
    processo: '0807312-18.2025.8.20.0001',
    varaComarca: '7ª Vara Criminal · Natal/RN',
    imputacao: 'Art. 157, §2º, II, Código Penal',
    situacao: 'Preventiva',
    urgency: 'critica',
    proximoAto: 'AIJ & Memoriais Orais',
    prazoLabel: 'Contradições Mapeadas',
    defaultModule: 'aij',
    assignedTo: 'Dra. Camila Vasconcelos',
    resumoFatos:
      'PM Cb. Silva afirmou no IP que visualizou troca de objetos a 50m; em juízo admitiu que era noite, rua sem iluminação e não houve campana prévia. Lacre do celular rompido sem certidão (quebra da cadeia de custódia).',
    createdAt: '2026-11-21T14:20:00Z',
  },
  {
    id: 'case-03',
    assistido: 'R.F.L. (HC Nulidade Busca)',
    processo: '0004519-90.2026.3.00.0000',
    varaComarca: '6ª Turma · STJ (Originário TJRN)',
    imputacao: 'Art. 2º, Lei 12.850/13 (ORCRIM)',
    situacao: 'Preventiva',
    urgency: 'alta',
    proximoAto: 'Sustentação / Súmula 7 STJ',
    prazoLabel: 'Sustentação Pronta',
    defaultModule: 'tribunais',
    assignedTo: 'Dr. Ramon Medeiros',
    resumoFatos:
      'Extração de dados telemáticos de aparelho celular apreendido sem lacre numerado e sem certidão de hash SHA-256 (quebra da cadeia de custódia, Art. 158-A e seguintes do CPP).',
    createdAt: '2026-11-19T09:15:00Z',
  },
  {
    id: 'case-04',
    assistido: 'J.H.A. (Execução SEEU)',
    processo: '7001829-11.2023.8.20.0001',
    varaComarca: 'Vara de Execuções Penais · SEEU/RN',
    imputacao: 'Execução de Pena · Art. 155, §4º, CP',
    situacao: 'Regime Fechado (SEEU)',
    urgency: 'monitorada',
    proximoAto: 'Progressão para Semiaberto',
    prazoLabel: 'Em 9 dias',
    defaultModule: 'tribunais',
    assignedTo: 'Lucas Henrique Silva',
    resumoFatos:
      'Reeducando primário condenado a 5 anos e 4 meses (furto qualificado, sem violência ou grave ameaça). Possui 142 dias remidos por trabalho homologados e atestado de boa conduta carcerária.',
    createdAt: '2026-11-12T11:40:00Z',
  },
];

export const INITIAL_FORUM_DOC: ForumDocument = {
  id: 'doc-initial-01',
  caseId: 'case-01',
  assistido: 'J.C.S. (Flagrante Art. 33)',
  moduleId: 'custodia',
  title: 'Sustentação Oral — Audiência de Custódia (Cenário B)',
  subtitle: 'Núcleo de Controle de Flagrantes · Natal/RN · Tema 280 STF',
  content: `"Excelentíssimo(a) Juiz(a) de Direito do Núcleo de Controle de Flagrantes da Comarca de Natal/RN, cumprimento Vossa Excelência e o ilustre representante do Ministério Público."

[PRELIMINAR DE NULIDADE — ART. 240 CPP & TEMA 280 STF / HC 598.051 STJ]
A defesa requer, preliminarmente, o RELAXAMENTO DA PRISÃO EM FLAGRANTE. Conforme consta no próprio APF, não houve investigação prévia ou fundadas razões que justificassem a violação de domicílio. A mera alegação de "nervosismo ao ver a viatura" não autoriza o ingresso forçado, contaminando todas as provas obtidas por derivação (Teoria dos Frutos da Árvore Envenenada).

[AUSÊNCIA DE PERICULUM LIBERTATIS — ART. 312 CPP]
Subsidiariamente, caso superada a nulidade, o requerente é primário, possui ocupação lícita comprovada (CTPS assinada) e residência fixa em Natal/RN, além de dois filhos menores (4 e 7 anos). A gravidade abstrata do delito não supre a ausência de contemporaneidade exigida pelo Art. 312 do CPP.

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
    label: 'AIJ_0809112-77_7VARA_NATAL.pdf (22 págs)',
    assistido: 'Thiago Alves Nogueira',
    processo: '0809112-77.2026.8.20.0001',
    varaComarca: '7ª Vara Criminal · Natal/RN',
    imputacao: 'Art. 157, §2º, I e II, CP',
    situacao: 'Preventiva' as const,
    resumoFatos:
      'Vítima não reconheceu o acusado no local dos fatos; reconhecimento posterior realizado por fotografia isolada no aplicativo da delegacia sem alinhamento de pessoas semelhantes (violação ao Art. 226 CPP).',
  },
];
