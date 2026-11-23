export interface StageItem {
  iconName:
    | 'shield'
    | 'gauge'
    | 'brain'
    | 'gavel'
    | 'id-card'
    | 'lock'
    | 'users'
    | 'chart'
    | 'bell'
    | 'user-plus'
    | 'cpu'
    | 'stopwatch'
    | 'landmark'
    | 'scale'
    | 'calculator'
    | 'tablet'
    | 'user-check'
    | 'database';
  accentColor: string;
  title: string;
  desc: string;
}

export interface StageData {
  id: number;
  stepLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  cameraTarget: { x: number; y: number; z: number };
  cameraSpherical: { radius: number; theta: number; phi: number };
  items: StageItem[];
}

export interface Node3DConfig {
  id: string;
  stage: number;
  label: string;
  shortDesc: string;
  iconName: StageItem['iconName'];
  x: number;
  y: number;
  z: number;
  color: number;
  size: number;
  isHub?: boolean;
}

export interface RbacProfile {
  id: 'socio' | 'advogado' | 'estagiario';
  label: string;
  statusText: string;
  permissions: string;
}

export interface PanelAlert {
  id: string;
  title: string;
  tone: 'crimson' | 'amber' | 'emerald';
  detail: string;
}

export interface RagThesis {
  id: string;
  label: string;
  court: string;
  summary: string;
}

export const STAGES: StageData[] = [
  {
    id: 0,
    stepLabel: 'Visão Geral',
    badge: 'Arquitetura Completa',
    title: 'Ecossistema LexRamon 3D',
    subtitle: 'Do Flagrante aos Tribunais Superiores em Alta Performance',
    description:
      'Uma arquitetura jurídica guiada por contexto projetada para eliminar respostas genéricas e atuar com precisão cirúrgica na advocacia criminal.',
    cameraTarget: { x: 0, y: 0.4, z: 0 },
    cameraSpherical: { radius: 24.5, theta: 0.05, phi: 1.12 },
    items: [
      {
        iconName: 'shield',
        accentColor: 'text-amber-400',
        title: '1. Camada de Blindagem & Acesso',
        desc: 'Autenticação OAB, criptografia E2E e conformidade LGPD Criminal.',
      },
      {
        iconName: 'gauge',
        accentColor: 'text-sky-400',
        title: '2. Painel de Controle Executivo',
        desc: 'Visão estratégica, prazos críticos, novo assistido e hub Lex Criminal.',
      },
      {
        iconName: 'brain',
        accentColor: 'text-purple-400',
        title: '3. Motor IA (AGENTS.md) & 5 Módulos',
        desc: 'Custódia 30s, AIJ 13ª Vara Natal, STJ/STF, Execução SEEU e WhatsApp.',
      },
      {
        iconName: 'gavel',
        accentColor: 'text-emerald-400',
        title: '4. Execução em Ato (Modo Fórum)',
        desc: 'Teleprompter de alto contraste com cronômetro e revisão humana.',
      },
    ],
  },
  {
    id: 1,
    stepLabel: 'Acesso & LGPD',
    badge: 'Etapa 01 · Segurança & Acesso',
    title: 'Tela Inicial, Autenticação & RBAC',
    subtitle: '06_SECURITY.md · Sigilo Profissional da OAB & LGPD Criminal',
    description:
      'A porta de entrada protege o sigilo inviolável entre advogado e cliente. Nenhum auto de prisão ou dado sensível alimenta modelos públicos de IA.',
    cameraTarget: { x: -7.5, y: 1.4, z: 0 },
    cameraSpherical: { radius: 13.5, theta: 0.22, phi: 1.16 },
    items: [
      {
        iconName: 'id-card',
        accentColor: 'text-amber-400',
        title: 'Login & Validação OAB',
        desc: 'Autenticação multifator vinculada à inscrição profissional do escritório.',
      },
      {
        iconName: 'lock',
        accentColor: 'text-emerald-400',
        title: 'Criptografia Ponta a Ponta (E2E)',
        desc: 'Isolamento total de documentos (APFs, quebras de sigilo e relatórios).',
      },
      {
        iconName: 'users',
        accentColor: 'text-sky-400',
        title: 'Controle de Permissão (RBAC)',
        desc: 'Níveis granulares para Sócio, Advogado Associado e Estagiário.',
      },
    ],
  },
  {
    id: 2,
    stepLabel: 'Painel',
    badge: 'Etapa 02 · Comando Central',
    title: 'Painel de Controle Executivo',
    subtitle: 'Dashboard Estratégico para Tomada de Decisão Imediata',
    description:
      'Após a autenticação, o advogado visualiza o centro de comando do escritório, priorizando urgências de réus presos e o acesso imediato aos fluxos criminais.',
    cameraTarget: { x: -2.7, y: 1.0, z: 0 },
    cameraSpherical: { radius: 13.5, theta: 0.14, phi: 1.16 },
    items: [
      {
        iconName: 'chart',
        accentColor: 'text-amber-400',
        title: 'Visão Estratégica',
        desc: 'Indicadores do escritório, taxa de liberdade provisória e banco de teses vencedoras.',
      },
      {
        iconName: 'bell',
        accentColor: 'text-red-400',
        title: 'Prazos e Urgências',
        desc: 'Radar prioritário: Central de Flagrantes, AIJs marcadas e vencimentos SEEU.',
      },
      {
        iconName: 'user-plus',
        accentColor: 'text-emerald-400',
        title: 'Novo Assistido',
        desc: 'Captação rápida (3 linhas + upload de APF/PDF) com OCR automático.',
      },
      {
        iconName: 'cpu',
        accentColor: 'text-sky-400',
        title: 'Lex Criminal',
        desc: 'Acesso direto aos 5 módulos especializados de inteligência jurídica.',
      },
    ],
  },
  {
    id: 3,
    stepLabel: 'Lex Criminal',
    badge: 'Etapa 03 · Cérebro & Módulos',
    title: 'Lex Criminal & Motor AGENTS.md',
    subtitle: '01_PRD.md + 07_AGENTS.md · Inteligência na Prática Forense',
    description:
      'O núcleo jurídico cruza os autos enviados com o tom de voz elegante e combativo do escritório e a jurisprudência vinculante do STF e STJ.',
    cameraTarget: { x: 2.5, y: 1.0, z: 0 },
    cameraSpherical: { radius: 14.0, theta: -0.1, phi: 1.15 },
    items: [
      {
        iconName: 'stopwatch',
        accentColor: 'text-amber-400',
        title: 'M1. Custódia em 30s (Núcleo de Garantias)',
        desc: 'Perguntas preliminares + Cenário A (MP favorável) e Cenário B (Tema 280 STF / HC 598.051 STJ).',
      },
      {
        iconName: 'landmark',
        accentColor: 'text-sky-400',
        title: 'M2. AIJ & Alegações Orais (13ª Vara Natal/RN)',
        desc: 'Perguntas para policiais/testemunhas + Alegações Finais Orais (Art. 403, §3º CPP).',
      },
      {
        iconName: 'scale',
        accentColor: 'text-purple-400',
        title: 'M3. Tribunais Superiores & ORCRIM',
        desc: 'HCs e Recursos (STJ/STF), Cadeia de Custódia (Art. 158-A) e Reconhecimento (Art. 226 CPP).',
      },
      {
        iconName: 'calculator',
        accentColor: 'text-emerald-400',
        title: 'M4. Execução Penal & M5. WhatsApp',
        desc: 'Cálculo SEEU (Art. 112 LEP: 16% a 70%) + Tradução acolhedora para a família.',
      },
    ],
  },
  {
    id: 4,
    stepLabel: 'Modo Fórum',
    badge: 'Etapa 04 · Execução em Ato',
    title: 'Modo Fórum, Validação & Entrega',
    subtitle: '02_DESIGN_SYSTEM.md + 05_DATABASE.md · Sala de Audiência',
    description:
      'Na hora da sustentação oral diante do juiz, a interface se transforma em um teleprompter escuro de alto contraste, com revisão final do advogado e registro criptografado.',
    cameraTarget: { x: 7.4, y: 1.0, z: 0 },
    cameraSpherical: { radius: 13.5, theta: -0.22, phi: 1.16 },
    items: [
      {
        iconName: 'tablet',
        accentColor: 'text-amber-400',
        title: 'Modo Fórum / Teleprompter',
        desc: 'Leitura confortável no celular/tablet com ajuste de fonte (A+/A-) e cronômetro.',
      },
      {
        iconName: 'user-check',
        accentColor: 'text-emerald-400',
        title: 'Validação Humana Obrigatória',
        desc: 'Curadoria final do advogado antes de qualquer protocolo ou manifestação.',
      },
      {
        iconName: 'database',
        accentColor: 'text-sky-400',
        title: 'Histórico & Exportação Multicanal',
        desc: 'Salvo no banco criptografado e pronto para PJe, SEEU ou WhatsApp do cliente.',
      },
    ],
  },
];

export const NODES_3D: Node3DConfig[] = [
  // Etapa 1: Acesso & Segurança (Esquerda)
  {
    id: 'login',
    stage: 1,
    label: 'Login & Token OAB',
    shortDesc: 'Autenticação MFA com registro OAB',
    iconName: 'id-card',
    x: -7.5,
    y: 3.1,
    z: 0,
    color: 0xd97706,
    size: 0.92,
    isHub: true,
  },
  {
    id: 'crypto',
    stage: 1,
    label: 'Criptografia E2E & LGPD',
    shortDesc: 'Isolamento zero-retention dos autos',
    iconName: 'shield',
    x: -7.5,
    y: 1.1,
    z: 1.6,
    color: 0xf59e0b,
    size: 0.84,
  },
  {
    id: 'rbac',
    stage: 1,
    label: 'Permissões RBAC',
    shortDesc: 'Sócio, Associado e Estagiário',
    iconName: 'lock',
    x: -7.5,
    y: -0.9,
    z: -1.3,
    color: 0xb45309,
    size: 0.8,
  },

  // Etapa 2: Painel de Controle (Centro-Esquerda)
  {
    id: 'dash',
    stage: 2,
    label: 'Painel de Controle',
    shortDesc: 'Centro de comando executivo',
    iconName: 'gauge',
    x: -2.7,
    y: 2.7,
    z: 0,
    color: 0xf59e0b,
    size: 1.08,
    isHub: true,
  },
  {
    id: 'estrategia',
    stage: 2,
    label: 'Visão Estratégica',
    shortDesc: 'Indicadores de liberdade & teses',
    iconName: 'chart',
    x: -3.1,
    y: 0.4,
    z: 2.2,
    color: 0x38bdf8,
    size: 0.76,
  },
  {
    id: 'prazos',
    stage: 2,
    label: 'Prazos & Urgências',
    shortDesc: 'Custódias, AIJs e vencimentos SEEU',
    iconName: 'bell',
    x: -2.3,
    y: 0.4,
    z: -2.2,
    color: 0xef4444,
    size: 0.76,
  },
  {
    id: 'assistido',
    stage: 2,
    label: 'Novo Assistido (APF)',
    shortDesc: 'Captação em 3 linhas + OCR de APF',
    iconName: 'user-plus',
    x: -2.7,
    y: -1.6,
    z: 0.8,
    color: 0x10b981,
    size: 0.82,
  },

  // Etapa 3: Módulos Lex Criminal & Cérebro IA (Centro-Direita)
  {
    id: 'brain',
    stage: 3,
    label: 'Cérebro IA (AGENTS.md)',
    shortDesc: 'Motor contextual forense & RAG',
    iconName: 'brain',
    x: 2.5,
    y: 2.9,
    z: 0,
    color: 0xa855f7,
    size: 1.2,
    isHub: true,
  },
  {
    id: 'm1',
    stage: 3,
    label: 'Custódia em 30s',
    shortDesc: 'Núcleo de Garantias · Cenários A/B',
    iconName: 'stopwatch',
    x: 1.8,
    y: 0.5,
    z: 2.6,
    color: 0xf59e0b,
    size: 0.74,
  },
  {
    id: 'm2',
    stage: 3,
    label: 'AIJ & Alegações Orais',
    shortDesc: '13ª Vara Natal/RN · Art. 403 §3º CPP',
    iconName: 'landmark',
    x: 3.3,
    y: 0.5,
    z: 1.3,
    color: 0x38bdf8,
    size: 0.74,
  },
  {
    id: 'm3',
    stage: 3,
    label: 'STJ / STF & ORCRIM',
    shortDesc: 'Arts. 158-A e 226 CPP · HCs',
    iconName: 'scale',
    x: 3.3,
    y: 0.5,
    z: -1.3,
    color: 0xc084fc,
    size: 0.74,
  },
  {
    id: 'm4',
    stage: 3,
    label: 'Execução Penal (SEEU)',
    shortDesc: 'Progressão Art. 112 LEP (16% a 70%)',
    iconName: 'calculator',
    x: 1.8,
    y: 0.5,
    z: -2.6,
    color: 0x10b981,
    size: 0.74,
  },
  {
    id: 'm5',
    stage: 3,
    label: 'WhatsApp do Cliente',
    shortDesc: 'Comunicação clara à família',
    iconName: 'users',
    x: 2.5,
    y: -1.7,
    z: 0,
    color: 0x22c55e,
    size: 0.78,
  },

  // Etapa 4: Execução em Ato & Entrega (Direita)
  {
    id: 'forum',
    stage: 4,
    label: 'Modo Fórum / Teleprompter',
    shortDesc: 'Leitura em audiência + cronômetro',
    iconName: 'tablet',
    x: 7.4,
    y: 2.7,
    z: 1.1,
    color: 0xfbbf24,
    size: 1.0,
    isHub: true,
  },
  {
    id: 'review',
    stage: 4,
    label: 'Validação Humana',
    shortDesc: 'Revisão obrigatória do advogado',
    iconName: 'user-check',
    x: 7.4,
    y: 0.5,
    z: -1.2,
    color: 0x10b981,
    size: 0.85,
  },
  {
    id: 'db',
    stage: 4,
    label: 'Banco Criptografado & Export',
    shortDesc: 'PJe, SEEU e auditoria segura',
    iconName: 'database',
    x: 7.4,
    y: -1.6,
    z: 0.5,
    color: 0x38bdf8,
    size: 0.85,
  },
];

export const CONNECTIONS: [string, string][] = [
  ['login', 'crypto'],
  ['crypto', 'rbac'],
  ['login', 'dash'],
  ['rbac', 'dash'],
  ['dash', 'estrategia'],
  ['dash', 'prazos'],
  ['dash', 'assistido'],
  ['dash', 'brain'],
  ['assistido', 'brain'],
  ['brain', 'm1'],
  ['brain', 'm2'],
  ['brain', 'm3'],
  ['brain', 'm4'],
  ['brain', 'm5'],
  ['m1', 'forum'],
  ['m2', 'forum'],
  ['m3', 'forum'],
  ['m4', 'review'],
  ['m5', 'review'],
  ['forum', 'review'],
  ['review', 'db'],
];

export const RBAC_PROFILES: RbacProfile[] = [
  {
    id: 'socio',
    label: 'Sócio',
    statusText: 'SÓCIO · ACESSO TOTAL & ASSINATURA',
    permissions:
      'Autorizado a protocolar HCs, gerenciar chaves E2E, auditar todos os assistidos e aprovar minutas finais.',
  },
  {
    id: 'advogado',
    label: 'Advogado',
    statusText: 'ADVOGADO · AUDIÊNCIAS & MINUTAS',
    permissions:
      'Acesso completo ao Modo Fórum, perguntas de AIJ, cálculo SEEU e geração de peças vinculadas aos casos atribuídos.',
  },
  {
    id: 'estagiario',
    label: 'Estagiário',
    statusText: 'ESTAGIÁRIO · TRIAGEM & RASCUNHO',
    permissions:
      'Captação inicial de APFs (Novo Assistido) e preparação de rascunhos sujeitos à validação obrigatória de advogado.',
  },
];

export const PANEL_ALERTS: PanelAlert[] = [
  {
    id: 'custodia',
    title: '2 Custódias Hoje',
    tone: 'crimson',
    detail: 'Núcleo de Garantias · APFs com checklist de nulidades (Tema 280 STF) prontos para sustentação.',
  },
  {
    id: 'aij',
    title: 'AIJ 13ª Vara · 14h',
    tone: 'amber',
    detail: 'Roteiro de inquirição de policiais e alegações orais (Art. 403, §3º CPP) carregado no Modo Fórum.',
  },
];

export const RAG_THESES: RagThesis[] = [
  {
    id: 'tema280',
    label: 'Tema 280 STF',
    court: 'STF · Inviolabilidade Domiciliar',
    summary:
      'Exige fundadas razões prévias e justificáveis a posteriori para ingresso sem mandado (RE 603.616). Base central no Cenário B de Custódia.',
  },
  {
    id: 'hc598051',
    label: 'HC 598.051 STJ',
    court: 'STJ · 6ª Turma',
    summary:
      'Ônus da prova da validade do consentimento do morador pertence ao Estado, devendo ser documentado por escrito e/ou registro audiovisual.',
  },
  {
    id: 'art158a',
    label: 'Art. 158-A CPP',
    court: 'Pacote Anticrime · Cadeia de Custódia',
    summary:
      'Rastreabilidade obrigatória de vestígios digitais e físicos da coleta ao descarte; quebra de cadeia gera inadmissibilidade ou perda de força probatória.',
  },
  {
    id: 'art112lep',
    label: 'Art. 112 LEP',
    court: 'Execução Penal · SEEU',
    summary:
      'Frações progressivas de 16% a 70% conforme primariedade, violência/grave ameaça e hediondez, evitando aplicação retroativa gravosa.',
  },
];
