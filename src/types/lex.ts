export type RbacRole = 'socio' | 'advogado' | 'estagiario';

export type AppView =
  | 'dashboard'
  | 'novo-assistido'
  | 'lex-criminal'
  | 'modo-forum'
  | 'arquitetura-3d';

export type LexModuleId =
  | 'custodia'
  | 'aij'
  | 'tribunais'
  | 'seeu'
  | 'whatsapp';

export type CaseUrgency = 'critica' | 'alta' | 'monitorada';

export interface UserSession {
  name: string;
  oab: string;
  role: RbacRole;
  lgpdAccepted: boolean;
  authenticatedAt: string;
}

export interface CaseRecord {
  id: string;
  assistido: string;
  processo: string;
  varaComarca: string;
  imputacao: string;
  situacao: 'Preso em Flagrante' | 'Preventiva' | 'Liberdade Provisória' | 'Regime Fechado (SEEU)';
  urgency: CaseUrgency;
  proximoAto: string;
  prazoLabel: string;
  defaultModule: LexModuleId;
  resumoFatos: string;
  createdAt: string;
}

export interface ForumDocument {
  id: string;
  caseId: string;
  assistido: string;
  moduleId: LexModuleId;
  title: string;
  subtitle: string;
  content: string;
  status: 'rascunho' | 'validado';
  validatedBy?: string;
  validatedOab?: string;
  validatedAt?: string;
  updatedAt: string;
}
