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
