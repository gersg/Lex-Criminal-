export type RbacRole = 'escritorio' | 'autonomo' | 'estudante';

export type AppView =
  | 'user-home'
  | 'war-room'
  | 'painel-controle'
  | 'visao-geral'
  | 'novo-assistido'
  | 'modo-forum'
  | 'perfil-usuario';

export type WarModuleId = 'custodia' | 'aij' | 'tribunais' | 'tradutor';

export type WarRoomTabId =
  | 'ficha'
  | 'audio_docs'
  | 'timeline'
  | 'agente_lex'
  | 'preparo'
  | 'modo_forum'
  | 'exportacao';

export type ControlPanelSubTab = 'governanca' | 'processos' | 'equipe';

export type CaseUrgency = 'critica' | 'alta' | 'monitorada';

export interface RolePermissionItem {
  label: string;
  allowed: boolean;
  detail: string;
}

export interface RolePermissions {
  canValidate: boolean;
  canEditGovernance: boolean;
  canViewControlPanel: boolean;
  canViewOverview: boolean;
  canManageTeam: boolean;
  canCreateCase: boolean;
  canExportProtocol: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  oab: string;
  role: RbacRole;
  active: boolean;
  specialty: string;
}

export interface UserSession {
  name: string;
  email: string;
  oab: string;
  role: RbacRole;
  comarca?: string;
  rememberSession?: boolean;
  lgpdAccepted: boolean;
  authenticatedAt: string;
}

export interface GovernanceConfig {
  vocativoPadrao: string;
  posturaCombativa: 'garantista' | 'pragmatico';
  comarcaPadrao: string;
  bloqueioAlucinacao: boolean;
  protecaoSilencio: boolean;
  anonimizacaoLgpd: boolean;
}

export interface ForensicTimelineEvent {
  id: string;
  date: string;
  time: string;
  type: 'police' | 'defense' | 'judicial';
  title: string;
  description: string;
  source: string;
  contradiction?: boolean;
  contradictionNote?: string;
}

export interface CaseRecord {
  id: string;
  assistido: string;
  processo: string;
  varaComarca: string;
  imputacao: string;
  situacao:
    | 'Preso em Flagrante'
    | 'Preventiva'
    | 'Liberdade Provisória'
    | 'Regime Fechado (SEEU)';
  urgency: CaseUrgency;
  proximoAto: string;
  prazoLabel: string;
  defaultModule: WarModuleId;
  resumoFatos: string;
  assignedTo?: string;
  createdAt: string;
  // Campos forenses estendidos do Dossiê Vivo Caso a Caso
  cpf?: string;
  prisonUnit?: string;
  residenceProof?: string;
  occupation?: string;
  children?: string;
  antecedents?: string;
  familyContact?: string;
  prepCliente?: string[];
  vulnerabilities?: string[];
  strategyA?: string;
  strategyB?: string;
  forumQuestionsClient?: string[];
  forumQuestionsWitness?: string[];
  oralStatement?: string;
  familyWhatsappMsg?: string;
  forensicTimeline?: ForensicTimelineEvent[];
  chatHistory?: AgentChatTurn[];
}

export interface ForumDocument {
  id: string;
  caseId: string;
  assistido: string;
  moduleId: WarModuleId;
  title: string;
  subtitle: string;
  content: string;
  status: 'rascunho' | 'revisao_solicitada' | 'validado';
  validatedBy?: string;
  validatedOab?: string;
  validatedAt?: string;
  reviewRequestedBy?: string;
  updatedAt: string;
}

export type JurisdictionRegion = 'RN' | 'CE' | 'RN_CE' | 'STJ_STF';

export type AgentFocusArea =
  | 'geral'
  | 'custodia'
  | 'extravagantes'
  | 'rn_ce'
  | 'execucao_seeu';

export interface LegalNewsItem {
  id: string;
  title: string;
  summary: string;
  tribunal: 'TJRN' | 'TJCE' | 'STJ' | 'STF';
  category: 'Extravagantes' | 'Jurisprudência' | 'Plantão & Normas' | 'Execução Penal';
  statuteRef: string;
  publishedAt: string;
  impactLevel: 'alto' | 'medio';
}

export interface AgendaDeadlineItem {
  id: string;
  title: string;
  caseRef: string;
  assistido: string;
  tribunal: 'TJRN' | 'TJCE' | 'STJ';
  comarca: string;
  dateLabel: string;
  timeLabel: string;
  kind: 'audiencia' | 'prazo_fatal' | 'sustentacao' | 'diligencia';
  urgency: CaseUrgency;
  responsible: 'Ramon' | 'Jéssica' | 'Equipe';
  completed: boolean;
}

export interface CriminalAgentResponse {
  answer: string;
  model: string;
  jurisdiction: JurisdictionRegion;
  focusArea: AgentFocusArea;
  usedKnowledgeTitles?: string[];
  generatedAt: string;
}

export type KnowledgeItemKind = 'documento' | 'audio';

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  kind: KnowledgeItemKind;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  clientId?: string;
  caseId?: string;
  tags: string[];
  summary: string;
  transcriptOrExtract: string;
  keyPoints: string[];
  legalRefs: string[];
  createdAt: string;
  addedBy: string;
}

export interface AgentChatTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  usedKnowledgeTitles?: string[];
  createdAt: string;
}

export interface ClientTimelineEvent {
  id: string;
  date: string;
  stage:
    | 'Abordagem / APF'
    | 'Custódia'
    | 'Inquérito'
    | 'Denúncia'
    | 'AIJ / Instrução'
    | 'Sentença'
    | 'Recurso / STJ'
    | 'Execução SEEU'
    | 'Atendimento';
  title: string;
  description: string;
  importance: 'critico' | 'importante' | 'rotina';
  responsible: string;
}

export interface ClientImportantPoint {
  id: string;
  category: 'nulidade' | 'prova' | 'vinculo_licito' | 'risco' | 'estrategia';
  title: string;
  detail: string;
  pinned: boolean;
}

export interface ClientRecord {
  id: string;
  name: string;
  cpfMasked?: string;
  phoneWhatsapp: string;
  familyContact: string;
  comarca: string;
  tribunal: 'TJRN' | 'TJCE' | 'STJ';
  custodyStatus:
    | 'Preso em Flagrante'
    | 'Prisão Preventiva'
    | 'Liberdade Provisória'
    | 'Regime Fechado (SEEU)'
    | 'Em Liberdade';
  prisonUnit?: string;
  imputationSummary: string;
  caseId?: string;
  assignedLawyer: 'Dr. Ramon Ribeiro' | 'Dra. Jéssica';
  importantPoints: ClientImportantPoint[];
  timeline: ClientTimelineEvent[];
  createdAt: string;
}

export interface DashboardSnapshot {
  source: 'mock-backend';
  syncedAt: string;
  metrics: {
    activeCases: number;
    urgentDeadlines: number;
    liberationRate: string;
    avgCustodyPrep: string;
    jurisdictions: string[];
    totalClients?: number;
    knowledgeCount?: number;
  };
  cases: CaseRecord[];
  clients?: ClientRecord[];
  knowledge?: KnowledgeBaseItem[];
  news: LegalNewsItem[];
  agenda: AgendaDeadlineItem[];
}
