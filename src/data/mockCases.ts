import { CaseRecord, ForumDocument, RbacRole } from '../types/lex';

export const ROLE_META: Record<
  RbacRole,
  {
    label: string;
    shortLabel: string;
    canValidate: boolean;
    canAuditAll: boolean;
    description: string;
  }
> = {
  socio: {
    label: 'Sócio Administrador',
    shortLabel: 'Sócio',
    canValidate: true,
    canAuditAll: true,
    description:
      'Acesso irrestrito: validação final de peças, assinatura OAB, auditoria E2E e gestão do escritório.',
  },
  advogado: {
    label: 'Advogado Associado',
    shortLabel: 'Advogado',
    canValidate: true,
    canAuditAll: false,
    description:
      'Atuação em audiências (Modo Fórum), validação de minutas criminais, cálculo SEEU e atendimento.',
  },
  estagiario: {
    label: 'Estagiário Jurídico',
    shortLabel: 'Estagiário',
    canValidate: false,
    canAuditAll: false,
    description:
      'Captação de assistidos (OCR de APF) e elaboração de rascunhos. Validação final exige Advogado ou Sócio.',
  },
};

export const INITIAL_CASES: CaseRecord[] = [
  {
    id: 'case-01',
    assistido: 'Marcos Vinícius Medeiros',
    processo: '0814920-44.2026.8.20.0001',
    varaComarca: 'Núcleo de Garantias · Natal/RN',
    imputacao: 'Art. 33, caput, Lei 11.343/06',
    situacao: 'Preso em Flagrante',
    urgency: 'critica',
    proximoAto: 'Audiência de Custódia',
    prazoLabel: 'Hoje · 10:30',
    defaultModule: 'custodia',
    resumoFatos:
      'Abordagem em via pública seguida de ingresso domiciliar sem mandado judicial e sem autorização escrita do morador; apreensão de pequena quantidade de substância e ausência de registro audiovisual da diligência.',
    createdAt: '2026-11-23T06:10:00Z',
  },
  {
    id: 'case-02',
    assistido: 'Carlos Eduardo Bezerra',
    processo: '0807312-18.2025.8.20.0001',
    varaComarca: '13ª Vara Criminal · Natal/RN',
    imputacao: 'Art. 157, §2º, II, Código Penal',
    situacao: 'Preventiva',
    urgency: 'critica',
    proximoAto: 'AIJ & Alegações Orais',
    prazoLabel: 'Hoje · 14:00',
    defaultModule: 'aij',
    resumoFatos:
      'Reconhecimento fotográfico realizado em delegacia sem observância do procedimento formal do Art. 226 do CPP. Testemunha presencial relatou baixa luminosidade e divergência quanto às vestimentas.',
    createdAt: '2026-11-21T14:20:00Z',
  },
  {
    id: 'case-03',
    assistido: 'Rafael Dantas Cavalcanti',
    processo: '0004519-90.2026.3.00.0000',
    varaComarca: 'STJ · 6ª Turma (Originário TJRN)',
    imputacao: 'Art. 2º, Lei 12.850/13 (ORCRIM)',
    situacao: 'Preventiva',
    urgency: 'alta',
    proximoAto: 'Habeas Corpus / Quebra de Cadeia',
    prazoLabel: 'Amanhã · 18:00',
    defaultModule: 'tribunais',
    resumoFatos:
      'Extração de dados telemáticos de aparelho celular apreendido sem lacre numerado e sem certidão de hash SHA-256 (quebra da cadeia de custódia, Art. 158-A e seguintes do CPP).',
    createdAt: '2026-11-19T09:15:00Z',
  },
  {
    id: 'case-04',
    assistido: 'José Henrique Albuquerque',
    processo: '7001829-11.2023.8.20.0001',
    varaComarca: 'Vara de Execuções Penais · SEEU/RN',
    imputacao: 'Execução de Pena · Art. 155, §4º, CP',
    situacao: 'Regime Fechado (SEEU)',
    urgency: 'monitorada',
    proximoAto: 'Progressão para Semiaberto',
    prazoLabel: 'Em 9 dias',
    defaultModule: 'seeu',
    resumoFatos:
      'Reeducando primário condenado a 5 anos e 4 meses (furto qualificado, sem violência ou grave ameaça). Possui 142 dias remidos por trabalho homologados e atestado de boa conduta carcerária.',
    createdAt: '2026-11-12T11:40:00Z',
  },
];

export const INITIAL_FORUM_DOC: ForumDocument = {
  id: 'doc-initial-01',
  caseId: 'case-01',
  assistido: 'Marcos Vinícius Medeiros',
  moduleId: 'custodia',
  title: 'Sustentação Oral — Audiência de Custódia (Cenário B)',
  subtitle: 'Núcleo de Garantias · Natal/RN · Tema 280 STF & HC 598.051 STJ',
  content: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DO NÚCLEO DE GARANTIAS DA COMARCA DE NATAL/RN

1. SÍNTESE FÁTICA E REQUERIMENTO PRELIMINAR
Trata-se de Auto de Prisão em Flagrante lavrado em desfavor de Marcos Vinícius Medeiros. Conforme se extrai dos próprios depoimentos dos agentes condutores, não houve mandado judicial prévio, tampouco consentimento documental ou audiovisual que legitimasse o ingresso na residência.

2. ILICITUDE PROBATÓRIA — TEMA 280 STF E HC 598.051 STJ
O Supremo Tribunal Federal, ao julgar o RE 603.616 (Tema 280), fixou a tese vinculante de que a entrada forçada em domicílio sem mandado judicial só é lícita quando amparada em fundadas razões, devidamente justificadas a posteriori.
Ademais, na esteira do HC 598.051/SP (6ª Turma do STJ), o ônus da prova quanto à legitimidade da diligência e à eventual autorização do morador recai integralmente sobre o Estado-acusação. Ausente registro audiovisual ou termo assinado, impõe-se o reconhecimento da nulidade das provas colhidas.

3. AUSÊNCIA DOS REQUISITOS DO ART. 312 DO CPP
Subsidiariamente, caso superada a preliminar de relaxamento, verifica-se a completa ausência de contemporaneidade e periculum libertatis concreto, possuindo o custodiado residência fixa e ocupação lícita.

4. PEDIDOS
Diante do exposto, requer a Defesa:
a) O RELAXAMENTO IMEDIATO da prisão em flagrante (Art. 5º, LXV, CF e Art. 310, I, CPP), ante a ilicitude da busca domiciliar;
b) Subsidiariamente, a concessão de LIBERDADE PROVISÓRIA sem fiança ou, no limite, aplicação de medidas cautelares diversas do Art. 319 do CPP.`,
  status: 'rascunho',
  updatedAt: '2026-11-23T06:45:00Z',
};

export const SAMPLE_APF_PRESETS = [
  {
    id: 'preset-apf-1',
    label: 'APF Tráfico · Busca Domiciliar (Natal/RN)',
    assistido: 'Lucas Gabriel Ferreira',
    processo: '0821044-12.2026.8.20.0001',
    varaComarca: 'Núcleo de Garantias · Natal/RN',
    imputacao: 'Art. 33, caput, Lei 11.343/06',
    situacao: 'Preso em Flagrante' as const,
    resumoFatos:
      'Policiamento ostensivo alegou atitude suspeita após denúncia anônima. Ingresso no imóvel sem mandado e sem gravação por câmera corporal. Apreendidos 18g de substância e R$ 140,00. Primário, com carteira assinada.',
  },
  {
    id: 'preset-apf-2',
    label: 'AIJ Roubo · Reconhecimento Art. 226 CPP',
    assistido: 'Thiago Alves Nogueira',
    processo: '0809112-77.2026.8.20.0001',
    varaComarca: '13ª Vara Criminal · Natal/RN',
    imputacao: 'Art. 157, §2º, I e II, CP',
    situacao: 'Preventiva' as const,
    resumoFatos:
      'Vítima não reconheceu o acusado no local dos fatos; reconhecimento posterior realizado por fotografia isolada no aplicativo da delegacia sem alinhamento de pessoas semelhantes (violação ao Art. 226 CPP).',
  },
];
