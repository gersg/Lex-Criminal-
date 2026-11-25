import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import {
  INITIAL_AGENDA_DEADLINES,
  INITIAL_CASES,
  INITIAL_CLIENTS,
  INITIAL_KNOWLEDGE_ITEMS,
  INITIAL_LEGAL_NEWS,
  ROLE_META,
} from '../src/data/mockCases';
import {
  AgendaDeadlineItem,
  AgentFocusArea,
  CaseRecord,
  ClientImportantPoint,
  ClientRecord,
  ClientTimelineEvent,
  JurisdictionRegion,
  KnowledgeBaseItem,
  KnowledgeItemKind,
  LegalNewsItem,
} from '../src/types/lex';
import {
  buildInitialDemoAccounts,
  hashPasswordSha256,
  normalizeIdentifier,
  normalizeOabKey,
} from '../src/utils/authHelpers';

const VALID_JURISDICTIONS: JurisdictionRegion[] = [
  'RN',
  'CE',
  'RN_CE',
  'STJ_STF',
];

const VALID_FOCUS_AREAS: AgentFocusArea[] = [
  'geral',
  'custodia',
  'extravagantes',
  'rn_ce',
  'execucao_seeu',
];

const ALLOWED_DOC_MIMES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const ALLOWED_AUDIO_MIMES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
]);

const MAX_BASE64_LENGTH = 20 * 1024 * 1024; // ~15 MB binary

function buildCriminalAgentSystemInstruction(
  jurisdiction: JurisdictionRegion,
  focusArea: AgentFocusArea
): string {
  const jurisdictionLabel =
    jurisdiction === 'RN'
      ? 'Rio Grande do Norte (TJRN: Natal, Mossoró, Parnamirim, Núcleo de Controle de Flagrantes e VEP/SEEU-RN)'
      : jurisdiction === 'CE'
      ? 'Ceará (TJCE: Fortaleza, Juazeiro do Norte, Caucaia, Sobral, Vara de Audiências de Custódia de Fortaleza e Câmaras Criminais do TJCE)'
      : jurisdiction === 'STJ_STF'
      ? 'Tribunais Superiores (STJ 5ª/6ª Turmas e STF, com filtro rigoroso Anti-Súmula 7/STJ e Temas de Repercussão Geral)'
      : 'Eixo Integrado RN & CE (TJRN e TJCE, comparando fluxos de PJe/SEEU, plantões de flagrante e jurisprudência criminal regional)';

  const focusDirective =
    focusArea === 'custodia'
      ? 'Foco prioritário em Audiência de Custódia (Art. 310 CPP, Resolução CNJ 213, violação de domicílio Tema 280 STF / HC 598.051 STJ, cautelares Art. 319 e domiciliar Art. 318).'
      : focusArea === 'extravagantes'
      ? 'Foco prioritário em Leis Penais Extravagantes: Drogas (Lei 11.343/06, Art. 28 vs 33, §4º privilegiado), ORCRIM (Lei 12.850/13), Desarmamento (Lei 10.826/03), Maria da Penha (Lei 11.340/06), Lavagem (Lei 9.613/98), Abuso de Autoridade (Lei 13.869/19) e Trânsito (CTB).'
      : focusArea === 'execucao_seeu'
      ? 'Foco prioritário em Execução Penal no SEEU (Lei 7.210/84 - LEP, Art. 112 frações 16% a 70%, remição Art. 126, detração Art. 42 CP, livramento condicional e indulto).'
      : focusArea === 'rn_ce'
      ? 'Foco prioritário nas particularidades forenses de Rio Grande do Norte (TJRN) e Ceará (TJCE): competência territorial, fluxos do PJe/SEEU, núcleos de custódia de Natal e Fortaleza e precedentes locais.'
      : 'Atuação abrangente em Direito Penal, Processo Penal, Leis Extravagantes e Prática Criminal nos Estados do RN e CE.';

  return [
    'Você é o Doutor LEX, Cérebro Jurídico Criminalista PhD da banca LexRamon (Dr. Ramon Ribeiro e Dra. Jéssica).',
    'Responda sempre em Português do Brasil técnico, objetivo, garantista e estruturado para uso imediato por advogados criminalistas.',
    `Jurisdição prioritária desta consulta: ${jurisdictionLabel}.`,
    `Eixo técnico selecionado: ${focusDirective}`,
    'Diretrizes obrigatórias:',
    '1. Quando houver documentos ou áudios transcritos na Base de Conhecimento do Advogado, Linha do Tempo Forense ou Pontos Importantes do Cliente fornecidos no prompt, utilize-os explicitamente (citando o nome do documento/áudio ou contradição cronológica), cruzando divergências e vínculos.',
    '2. Cite dispositivos exatos do CP, CPP (ex.: Arts. 158-A a 158-F cadeia de custódia, Art. 226 reconhecimento, Art. 240 busca domiciliar, Arts. 310-319 prisão/liberdade, Art. 318 prisão domiciliar para pais/mães de filhos menores, Art. 403 §3º memoriais) e Leis Extravagantes aplicáveis.',
    '3. Nunca invente números de julgados ou precedentes fictícios. Quando citar súmulas ou temas consolidados (ex.: Tema 280 STF, Súmula 7 STJ, HC 598.051 STJ, HC 143.641 STF), aplique-os com precisão ao caso narrado.',
    '4. Organize a resposta em blocos curtos e acionáveis: (a) Enquadramento & Achados na Base/Cliente, (b) Teses Defensivas & Nulidades, (c) Particularidades RN / CE / Tribunais Superiores e (d) Próximos Passos / Pedidos em Cascata.',
  ].join('\n');
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseGeminiError(err: unknown): { status: number; code: string; message: string } {
  const message =
    err instanceof Error ? err.message : 'Falha na comunicação com o Gemini.';
  const status =
    message.includes('403') || message.includes('PERMISSION_DENIED')
      ? 403
      : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
      ? 429
      : message.includes('400') || message.includes('INVALID_ARGUMENT')
      ? 400
      : 502;
  return {
    status,
    code:
      status === 429
        ? 'QUOTA_EXCEEDED'
        : status === 403
        ? 'PERMISSION_DENIED'
        : 'UPSTREAM_GEMINI_ERROR',
    message,
  };
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // In-memory simulated backend database state
  const state: {
    cases: CaseRecord[];
    clients: ClientRecord[];
    knowledgeBase: KnowledgeBaseItem[];
    news: LegalNewsItem[];
    agenda: AgendaDeadlineItem[];
  } = {
    cases: [...INITIAL_CASES],
    clients: INITIAL_CLIENTS.map((c) => ({
      ...c,
      importantPoints: [...c.importantPoints],
      timeline: [...c.timeline],
    })),
    knowledgeBase: [...INITIAL_KNOWLEDGE_ITEMS],
    news: [...INITIAL_LEGAL_NEWS],
    agenda: [...INITIAL_AGENDA_DEADLINES],
  };

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: 'lexramon-backend-simulado',
      regions: ['TJRN', 'TJCE', 'STJ', 'STF'],
      agentModel: 'gemini-4-hydrogen',
      transcribeModel: 'gemini-3.5-transcribe',
      geminiConfigured: Boolean(getGeminiClient()),
      counts: {
        clients: state.clients.length,
        knowledge: state.knowledgeBase.length,
        cases: state.cases.length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Simulated Auth endpoint supporting Ramon, Jéssica & RBAC personas
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const identifier =
        typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
      const password =
        typeof req.body?.password === 'string' ? req.body.password : '';

      if (!identifier || password.length < 6) {
        res.status(400).json({
          error: 'Informe e-mail/OAB e senha com no mínimo 6 caracteres.',
        });
        return;
      }

      const accounts = await buildInitialDemoAccounts();
      const directory = [...accounts];

      const query = normalizeIdentifier(identifier);
      const oabQuery = normalizeOabKey(identifier);
      const matched = directory.find((acc) => {
        const accEmail = normalizeIdentifier(acc.email);
        const accOab = normalizeIdentifier(acc.oab);
        const accOabKey = normalizeOabKey(acc.oab);
        const firstName = acc.name.toLowerCase().includes('ramon')
          ? 'ramon'
          : acc.name.toLowerCase().includes('jéssica') ||
            acc.name.toLowerCase().includes('jessica')
          ? 'jessica'
          : '';
        return (
          accEmail === query ||
          accOab === query ||
          (firstName && query === firstName) ||
          (oabQuery.length >= 4 && accOabKey.endsWith(oabQuery))
        );
      });

      if (!matched) {
        res.status(401).json({
          error: 'Credenciais não encontradas no diretório simulado.',
        });
        return;
      }

      const candidateHash = await hashPasswordSha256(password, matched.salt);
      if (candidateHash !== matched.passwordHash) {
        res.status(401).json({ error: 'Senha inválida.' });
        return;
      }

      res.json({
        authenticated: true,
        source: 'mock-backend',
        user: {
          name: matched.name,
          email: matched.email,
          oab: matched.oab,
          role: matched.role,
          comarca: matched.comarca,
          permissions: ROLE_META[matched.role].permissions,
        },
      });
    } catch {
      res.status(500).json({ error: 'Erro interno na autenticação simulada.' });
    }
  });

  // Simulated Dashboard Snapshot (metrics + cases + clients + knowledge + news + agenda)
  app.get('/api/dashboard', (_req: Request, res: Response) => {
    const urgentDeadlines = state.agenda.filter(
      (a) => !a.completed && (a.urgency === 'critica' || a.urgency === 'alta')
    ).length;

    res.json({
      source: 'mock-backend',
      syncedAt: new Date().toISOString(),
      metrics: {
        activeCases: state.cases.length,
        urgentDeadlines,
        liberationRate: '78,4%',
        avgCustodyPrep: '4m 20s',
        jurisdictions: ['TJRN (RN)', 'TJCE (CE)', 'STJ / STF'],
        totalClients: state.clients.length,
        knowledgeCount: state.knowledgeBase.length,
      },
      cases: state.cases,
      clients: state.clients,
      knowledge: state.knowledgeBase,
      news: state.news,
      agenda: state.agenda,
    });
  });

  // ---------------------------------------------------------------------------
  // CADASTRO DE CLIENTES, LINHA DO TEMPO & PONTOS IMPORTANTES
  // ---------------------------------------------------------------------------
  app.get('/api/clients', (_req: Request, res: Response) => {
    res.json({ source: 'mock-backend', items: state.clients });
  });

  app.post('/api/clients', (req: Request, res: Response) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const phoneWhatsapp =
      typeof req.body?.phoneWhatsapp === 'string'
        ? req.body.phoneWhatsapp.trim()
        : '';
    const comarca =
      typeof req.body?.comarca === 'string' && req.body.comarca.trim()
        ? req.body.comarca.trim()
        : 'Natal/RN';
    const tribunalRaw =
      typeof req.body?.tribunal === 'string'
        ? req.body.tribunal.toUpperCase()
        : 'TJRN';
    const tribunal: 'TJRN' | 'TJCE' | 'STJ' =
      tribunalRaw === 'TJCE' || tribunalRaw === 'STJ' ? tribunalRaw : 'TJRN';

    if (name.length < 3) {
      res
        .status(400)
        .json({ error: 'Informe o nome completo do cliente (mínimo 3 caracteres).' });
      return;
    }

    const custodyStatusRaw =
      typeof req.body?.custodyStatus === 'string'
        ? req.body.custodyStatus
        : 'Preso em Flagrante';
    const validStatuses: ClientRecord['custodyStatus'][] = [
      'Preso em Flagrante',
      'Prisão Preventiva',
      'Liberdade Provisória',
      'Regime Fechado (SEEU)',
      'Em Liberdade',
    ];
    const custodyStatus: ClientRecord['custodyStatus'] = validStatuses.includes(
      custodyStatusRaw as ClientRecord['custodyStatus']
    )
      ? (custodyStatusRaw as ClientRecord['custodyStatus'])
      : 'Preso em Flagrante';

    const assignedLawyer: ClientRecord['assignedLawyer'] =
      typeof req.body?.assignedLawyer === 'string' &&
      req.body.assignedLawyer.includes('Jéssica')
        ? 'Dra. Jéssica'
        : 'Dr. Ramon Ribeiro';

    const initialPointTitle =
      typeof req.body?.initialPointTitle === 'string'
        ? req.body.initialPointTitle.trim()
        : '';
    const initialPointDetail =
      typeof req.body?.initialPointDetail === 'string'
        ? req.body.initialPointDetail.trim()
        : '';

    const nowFormatted = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    const created: ClientRecord = {
      id: `cli-${Date.now()}`,
      name: name.slice(0, 120),
      cpfMasked:
        typeof req.body?.cpfMasked === 'string' && req.body.cpfMasked.trim()
          ? req.body.cpfMasked.trim().slice(0, 24)
          : undefined,
      phoneWhatsapp: phoneWhatsapp.slice(0, 40) || 'Não informado',
      familyContact:
        typeof req.body?.familyContact === 'string' && req.body.familyContact.trim()
          ? req.body.familyContact.trim().slice(0, 100)
          : 'A confirmar com familiar',
      comarca: comarca.slice(0, 80),
      tribunal,
      custodyStatus,
      prisonUnit:
        typeof req.body?.prisonUnit === 'string' && req.body.prisonUnit.trim()
          ? req.body.prisonUnit.trim().slice(0, 100)
          : undefined,
      imputationSummary:
        typeof req.body?.imputationSummary === 'string' &&
        req.body.imputationSummary.trim()
          ? req.body.imputationSummary.trim().slice(0, 140)
          : 'Tipificação em análise inicial',
      assignedLawyer,
      importantPoints: initialPointTitle
        ? [
            {
              id: `pt-${Date.now()}`,
              category: 'estrategia',
              title: initialPointTitle.slice(0, 120),
              detail:
                initialPointDetail.slice(0, 500) ||
                'Registrado na abertura do cadastro do cliente.',
              pinned: true,
            },
          ]
        : [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: nowFormatted,
          stage: 'Atendimento',
          title: 'Abertura da Ficha Criminal & Triagem Inicial',
          description:
            typeof req.body?.initialTimelineDesc === 'string' &&
            req.body.initialTimelineDesc.trim()
              ? req.body.initialTimelineDesc.trim().slice(0, 500)
              : `Cliente cadastrado sob responsabilidade de ${assignedLawyer} (${tribunal} · ${comarca}).`,
          importance:
            custodyStatus === 'Preso em Flagrante' ||
            custodyStatus === 'Prisão Preventiva'
              ? 'critico'
              : 'importante',
          responsible: assignedLawyer,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    state.clients = [created, ...state.clients];
    res.status(201).json({ source: 'mock-backend', item: created });
  });

  app.post('/api/clients/:id/timeline', (req: Request, res: Response) => {
    const { id } = req.params;
    const client = state.clients.find((c) => c.id === id);
    if (!client) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    if (title.length < 3) {
      res
        .status(400)
        .json({ error: 'Informe um título para o marco da linha do tempo.' });
      return;
    }

    const validStages: ClientTimelineEvent['stage'][] = [
      'Abordagem / APF',
      'Custódia',
      'Inquérito',
      'Denúncia',
      'AIJ / Instrução',
      'Sentença',
      'Recurso / STJ',
      'Execução SEEU',
      'Atendimento',
    ];
    const stage: ClientTimelineEvent['stage'] = validStages.includes(
      req.body?.stage
    )
      ? req.body.stage
      : 'Atendimento';
    const importance: ClientTimelineEvent['importance'] =
      req.body?.importance === 'critico' || req.body?.importance === 'rotina'
        ? req.body.importance
        : 'importante';

    const eventItem: ClientTimelineEvent = {
      id: `tl-${Date.now()}`,
      date:
        typeof req.body?.date === 'string' && req.body.date.trim()
          ? req.body.date.trim().slice(0, 32)
          : new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date()),
      stage,
      title: title.slice(0, 140),
      description: description.slice(0, 600) || 'Anotação de acompanhamento.',
      importance,
      responsible:
        typeof req.body?.responsible === 'string' && req.body.responsible.trim()
          ? req.body.responsible.trim().slice(0, 80)
          : client.assignedLawyer,
    };

    client.timeline = [eventItem, ...client.timeline];
    res.status(201).json({ source: 'mock-backend', item: eventItem, client });
  });

  app.post('/api/clients/:id/points', (req: Request, res: Response) => {
    const { id } = req.params;
    const client = state.clients.find((c) => c.id === id);
    if (!client) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const detail = typeof req.body?.detail === 'string' ? req.body.detail.trim() : '';
    if (title.length < 3) {
      res
        .status(400)
        .json({ error: 'Informe um título para o ponto importante.' });
      return;
    }

    const validCategories: ClientImportantPoint['category'][] = [
      'nulidade',
      'prova',
      'vinculo_licito',
      'risco',
      'estrategia',
    ];
    const category: ClientImportantPoint['category'] = validCategories.includes(
      req.body?.category
    )
      ? req.body.category
      : 'estrategia';

    const point: ClientImportantPoint = {
      id: `pt-${Date.now()}`,
      category,
      title: title.slice(0, 120),
      detail: detail.slice(0, 600) || 'Ponto crítico destacado pela defesa.',
      pinned: req.body?.pinned !== false,
    };

    client.importantPoints = [point, ...client.importantPoints];
    res.status(201).json({ source: 'mock-backend', item: point, client });
  });

  app.patch(
    '/api/clients/:id/points/:pointId/toggle',
    (req: Request, res: Response) => {
      const { id, pointId } = req.params;
      const client = state.clients.find((c) => c.id === id);
      if (!client) {
        res.status(404).json({ error: 'Cliente não encontrado.' });
        return;
      }
      const point = client.importantPoints.find((p) => p.id === pointId);
      if (!point) {
        res.status(404).json({ error: 'Ponto importante não encontrado.' });
        return;
      }
      point.pinned = !point.pinned;
      res.json({ source: 'mock-backend', item: point, client });
    }
  );

  // ---------------------------------------------------------------------------
  // BASE DE CONHECIMENTO IA (DOCUMENTOS & ÁUDIOS MULTIMODAIS)
  // ---------------------------------------------------------------------------
  app.get('/api/knowledge', (req: Request, res: Response) => {
    const clientId =
      typeof req.query.clientId === 'string' ? req.query.clientId.trim() : '';
    const caseId =
      typeof req.query.caseId === 'string' ? req.query.caseId.trim() : '';
    let items = state.knowledgeBase;
    if (clientId) {
      items = items.filter((k) => k.clientId === clientId || !k.clientId);
    } else if (caseId) {
      items = items.filter((k) => k.caseId === caseId || !k.caseId);
    }
    res.json({ source: 'mock-backend', items });
  });

  app.post('/api/knowledge/ingest', async (req: Request, res: Response) => {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const kindRaw = req.body?.kind;
    const kind: KnowledgeItemKind = kindRaw === 'audio' ? 'audio' : 'documento';
    const mimeType =
      typeof req.body?.mimeType === 'string'
        ? req.body.mimeType.trim().toLowerCase()
        : kind === 'audio'
        ? 'audio/webm'
        : 'text/plain';
    const fileName =
      typeof req.body?.fileName === 'string' && req.body.fileName.trim()
        ? req.body.fileName.trim().slice(0, 120)
        : kind === 'audio'
        ? 'audio_juridico.webm'
        : 'documento_juridico.txt';
    const base64Data =
      typeof req.body?.base64Data === 'string' ? req.body.base64Data.trim() : '';
    const textContent =
      typeof req.body?.textContent === 'string' ? req.body.textContent.trim() : '';
    const clientId =
      typeof req.body?.clientId === 'string' && req.body.clientId.trim()
        ? req.body.clientId.trim()
        : undefined;
    const caseId =
      typeof req.body?.caseId === 'string' && req.body.caseId.trim()
        ? req.body.caseId.trim()
        : undefined;
    const addedBy =
      typeof req.body?.addedBy === 'string' && req.body.addedBy.trim()
        ? req.body.addedBy.trim().slice(0, 80)
        : 'Dr. Ramon Ribeiro';

    if (title.length < 3) {
      res
        .status(400)
        .json({ error: 'Informe um título com pelo menos 3 caracteres.' });
      return;
    }

    if (!base64Data && textContent.length < 10) {
      res.status(400).json({
        error:
          'Envie um arquivo (PDF, texto, imagem ou áudio) ou cole o conteúdo textual (mínimo 10 caracteres).',
      });
      return;
    }

    if (base64Data.length > MAX_BASE64_LENGTH) {
      res.status(400).json({
        error: 'O arquivo excedeu o limite máximo de 15 MB por envio.',
      });
      return;
    }

    const baseMime = mimeType.split(';')[0].trim();
    if (kind === 'audio' && !ALLOWED_AUDIO_MIMES.has(baseMime)) {
      res.status(400).json({
        error: `Formato de áudio não suportado (${baseMime}). Use MP3, WAV, OGG, M4A ou WEBM.`,
      });
      return;
    }
    if (
      kind === 'documento' &&
      base64Data &&
      !ALLOWED_DOC_MIMES.has(baseMime)
    ) {
      res.status(400).json({
        error: `Formato de documento não suportado para leitura multimodal (${baseMime}). Envie PDF, TXT, Markdown, JSON ou imagem (PNG/JPG/WEBP).`,
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        code: 'GEMINI_KEY_UNAVAILABLE',
        error:
          'A indexação multimodal de documentos e áudios requer a variável GEMINI_API_KEY configurada em Settings > Secrets.',
      });
      return;
    }

    try {
      let rawExtractedText = textContent;

      if (kind === 'audio') {
        if (!base64Data) {
          res
            .status(400)
            .json({ error: 'Dados de áudio inválidos para transcrição.' });
          return;
        }
        const transcribeResp = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: baseMime,
                  data: base64Data,
                },
              },
              {
                text: 'Transcreva fielmente este áudio criminalista em Português do Brasil, identificando falantes quando perceptível e preservando nomes, endereços, horários, objetos apreendidos e fatos jurídicos.',
              },
            ],
          },
        });
        rawExtractedText = (transcribeResp.text ?? '').trim();
        if (!rawExtractedText) {
          res.status(502).json({
            error: 'Não foi possível extrair transcrição válida deste áudio.',
          });
          return;
        }
      }

      const indexingSchema = {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description:
              'Resumo executivo jurídico em Português (2 a 3 frases) sobre o conteúdo indexado.',
          },
          transcriptOrExtract: {
            type: Type.STRING,
            description:
              'Extrato técnico consolidado dos trechos fáticos e jurídicos mais relevantes.',
          },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              'Lista de 3 a 5 pontos importantes, nulidades, contradições ou vínculos lícitos identificados.',
          },
          legalRefs: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              'Artigos do CP/CPP, Leis Extravagantes, Súmulas ou jurisprudência RN/CE/STJ relacionados.',
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Até 4 tags curtas para busca.',
          },
        },
      };

      const analysisContents =
        kind === 'audio' || !base64Data
          ? `Analise e indexe este conteúdo jurídico criminal para a base de conhecimento da banca LexRamon (RN/CE).\nTÍTULO: ${title}\nCONTEÚDO:\n${rawExtractedText.slice(0, 18000)}`
          : {
              parts: [
                {
                  inlineData: {
                    mimeType: baseMime,
                    data: base64Data,
                  },
                },
                {
                  text: `Extraia o conteúdo jurídico relevante deste documento ("${title}") para a base de conhecimento criminal da banca LexRamon (CP, CPP, Leis Extravagantes, TJRN e TJCE).`,
                },
              ],
            };

      const analysisResp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: analysisContents,
        config: {
          systemInstruction:
            'Você é um indexador jurídico criminal especialista em Direito Penal, Processo Penal, Leis Extravagantes, TJRN e TJCE. Extraia exclusivamente informações presentes no material enviado, sem inventar fatos.',
          responseMimeType: 'application/json',
          responseSchema: indexingSchema,
        },
      });

      const parsed = JSON.parse((analysisResp.text ?? '{}').trim()) as {
        summary?: string;
        transcriptOrExtract?: string;
        keyPoints?: string[];
        legalRefs?: string[];
        tags?: string[];
      };

      const sizeBytes = base64Data
        ? Math.round((base64Data.length * 3) / 4)
        : Buffer.byteLength(textContent, 'utf8');

      const newItem: KnowledgeBaseItem = {
        id: `kb-${Date.now()}`,
        title: title.slice(0, 140),
        kind,
        mimeType: baseMime,
        fileName,
        sizeBytes,
        clientId,
        caseId,
        tags:
          Array.isArray(parsed.tags) && parsed.tags.length > 0
            ? parsed.tags.slice(0, 4)
            : [kind === 'audio' ? 'Áudio' : 'Documento', 'Base IA'],
        summary:
          parsed.summary?.trim() ||
          'Material jurídico indexado na base de conhecimento do escritório.',
        transcriptOrExtract:
          kind === 'audio'
            ? rawExtractedText
            : parsed.transcriptOrExtract?.trim() ||
              rawExtractedText.slice(0, 2500),
        keyPoints:
          Array.isArray(parsed.keyPoints) && parsed.keyPoints.length > 0
            ? parsed.keyPoints.slice(0, 6)
            : ['Conteúdo indexado e pronto para consulta interativa.'],
        legalRefs:
          Array.isArray(parsed.legalRefs) && parsed.legalRefs.length > 0
            ? parsed.legalRefs.slice(0, 6)
            : ['CPP', 'CP'],
        createdAt: new Date().toISOString(),
        addedBy,
      };

      state.knowledgeBase = [newItem, ...state.knowledgeBase];
      res.status(201).json({ source: 'mock-backend', item: newItem });
    } catch (err: unknown) {
      const { status, code, message } = parseGeminiError(err);
      res.status(status).json({
        code,
        error: `Falha ao processar material na Base de Conhecimento IA: ${message}`,
      });
    }
  });

  app.delete('/api/knowledge/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const before = state.knowledgeBase.length;
    state.knowledgeBase = state.knowledgeBase.filter((k) => k.id !== id);
    if (state.knowledgeBase.length === before) {
      res.status(404).json({ error: 'Item não encontrado na base de conhecimento.' });
      return;
    }
    res.json({ source: 'mock-backend', deletedId: id });
  });

  // ---------------------------------------------------------------------------
  // NOTÍCIAS, AGENDA & CASOS
  // ---------------------------------------------------------------------------
  app.get('/api/news', (req: Request, res: Response) => {
    const tribunal =
      typeof req.query.tribunal === 'string'
        ? req.query.tribunal.toUpperCase()
        : 'ALL';
    const items =
      tribunal === 'ALL'
        ? state.news
        : state.news.filter((n) => n.tribunal === tribunal);
    res.json({ source: 'mock-backend', items });
  });

  app.get('/api/agenda', (_req: Request, res: Response) => {
    res.json({ source: 'mock-backend', items: state.agenda });
  });

  app.post('/api/agenda', (req: Request, res: Response) => {
    const title =
      typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const assistido =
      typeof req.body?.assistido === 'string'
        ? req.body.assistido.trim()
        : 'Assistido sem sigla';
    const comarca =
      typeof req.body?.comarca === 'string'
        ? req.body.comarca.trim()
        : 'Comarca de Natal/RN';
    const tribunalRaw =
      typeof req.body?.tribunal === 'string'
        ? req.body.tribunal.toUpperCase()
        : 'TJRN';
    const tribunal: 'TJRN' | 'TJCE' | 'STJ' =
      tribunalRaw === 'TJCE' || tribunalRaw === 'STJ' ? tribunalRaw : 'TJRN';
    const dateLabel =
      typeof req.body?.dateLabel === 'string' && req.body.dateLabel.trim()
        ? req.body.dateLabel.trim()
        : 'Hoje';
    const timeLabel =
      typeof req.body?.timeLabel === 'string' && req.body.timeLabel.trim()
        ? req.body.timeLabel.trim()
        : '16:00';
    const kindRaw = typeof req.body?.kind === 'string' ? req.body.kind : 'prazo_fatal';
    const kind: AgendaDeadlineItem['kind'] =
      kindRaw === 'audiencia' ||
      kindRaw === 'sustentacao' ||
      kindRaw === 'diligencia'
        ? kindRaw
        : 'prazo_fatal';
    const responsibleRaw =
      typeof req.body?.responsible === 'string' ? req.body.responsible : 'Ramon';
    const responsible: AgendaDeadlineItem['responsible'] =
      responsibleRaw === 'Jéssica' || responsibleRaw === 'Equipe'
        ? responsibleRaw
        : 'Ramon';

    if (title.length < 4) {
      res
        .status(400)
        .json({ error: 'Informe um título com pelo menos 4 caracteres.' });
      return;
    }

    const newItem: AgendaDeadlineItem = {
      id: `ag-${Date.now()}`,
      title: title.slice(0, 140),
      caseRef:
        typeof req.body?.caseRef === 'string' && req.body.caseRef.trim()
          ? req.body.caseRef.trim().slice(0, 40)
          : '0800000-00.2026.8.20.0001',
      assistido: assistido.slice(0, 80),
      tribunal,
      comarca: comarca.slice(0, 80),
      dateLabel: dateLabel.slice(0, 24),
      timeLabel: timeLabel.slice(0, 16),
      kind,
      urgency: kind === 'prazo_fatal' || kind === 'audiencia' ? 'critica' : 'alta',
      responsible,
      completed: false,
    };

    state.agenda = [newItem, ...state.agenda];
    res.status(201).json({ source: 'mock-backend', item: newItem });
  });

  app.patch('/api/agenda/:id/toggle', (req: Request, res: Response) => {
    const { id } = req.params;
    const found = state.agenda.find((a) => a.id === id);
    if (!found) {
      res.status(404).json({ error: 'Compromisso/prazo não encontrado.' });
      return;
    }
    found.completed = !found.completed;
    res.json({ source: 'mock-backend', item: found });
  });

  app.post('/api/cases', (req: Request, res: Response) => {
    const assistido =
      typeof req.body?.assistido === 'string' ? req.body.assistido.trim() : '';
    const imputacao =
      typeof req.body?.imputacao === 'string' ? req.body.imputacao.trim() : '';
    if (!assistido || !imputacao) {
      res.status(400).json({ error: 'Assistido e imputação são obrigatórios.' });
      return;
    }
    const assignedTo =
      typeof req.body?.assignedTo === 'string' && req.body.assignedTo.trim()
        ? req.body.assignedTo.trim()
        : 'Dr. Ramon Ribeiro';
    const childrenVal =
      typeof req.body?.children === 'string'
        ? req.body.children.slice(0, 140)
        : undefined;
    const summaryVal =
      typeof req.body?.resumoFatos === 'string'
        ? req.body.resumoFatos.slice(0, 1200)
        : '';
    const varaVal =
      typeof req.body?.varaComarca === 'string' && req.body.varaComarca.trim()
        ? req.body.varaComarca.trim()
        : 'Núcleo de Flagrantes · Natal/RN';
    const hasDomiciliar = Boolean(
      childrenVal &&
        /sim|filh|menor|crianç|gestant|pcd|defici[eê]nc|dependente/i.test(
          childrenVal
        )
    );

    const created: CaseRecord = {
      id: `case-${Date.now()}`,
      assistido: assistido.slice(0, 100),
      processo:
        typeof req.body?.processo === 'string' && req.body.processo.trim()
          ? req.body.processo.trim()
          : '0800000-00.2026.8.20.0001',
      varaComarca: varaVal,
      imputacao: imputacao.slice(0, 120),
      situacao:
        typeof req.body?.situacao === 'string' &&
        [
          'Preso em Flagrante',
          'Preventiva',
          'Liberdade Provisória',
          'Regime Fechado (SEEU)',
        ].includes(req.body.situacao)
          ? (req.body.situacao as CaseRecord['situacao'])
          : 'Preso em Flagrante',
      urgency: 'alta',
      proximoAto: 'Análise Inicial / Custódia',
      prazoLabel: 'Urgente · Hoje',
      defaultModule: 'custodia',
      resumoFatos: summaryVal,
      assignedTo,
      cpf: typeof req.body?.cpf === 'string' ? req.body.cpf.slice(0, 24) : undefined,
      prisonUnit:
        typeof req.body?.prisonUnit === 'string' && req.body.prisonUnit.trim()
          ? req.body.prisonUnit.trim().slice(0, 120)
          : undefined,
      residenceProof:
        typeof req.body?.residenceProof === 'string' &&
        req.body.residenceProof.trim()
          ? req.body.residenceProof.trim().slice(0, 160)
          : undefined,
      occupation:
        typeof req.body?.occupation === 'string'
          ? req.body.occupation.slice(0, 120)
          : undefined,
      children: childrenVal,
      antecedents:
        typeof req.body?.antecedents === 'string'
          ? req.body.antecedents.slice(0, 120)
          : 'Primário / Em verificação',
      familyContact:
        typeof req.body?.familyContact === 'string'
          ? req.body.familyContact.slice(0, 120)
          : undefined,
      forensicTimeline: [
        {
          id: `ftl-${Date.now()}`,
          date: 'Hoje',
          time: 'Registro Inicial',
          type: 'police',
          title: 'Fato / Abertura do Procedimento Criminal',
          description: summaryVal || 'Síntese fática inicial registrada.',
          source: 'APF / Ficha Inicial',
          contradiction:
            /mandado|invas[aã]o|sem autoriza/i.test(summaryVal),
          contradictionNote: /mandado|invas[aã]o|sem autoriza/i.test(summaryVal)
            ? 'ALERTA DOUTOR LEX: Possível nulidade por ingresso domiciliar sem mandado (Tema 280 STF / HC 598.051 STJ).'
            : undefined,
        },
      ],
      prepCliente: [
        '1. Manter a tranquilidade e responder apenas às perguntas técnicas alinhadas com a Defesa.',
        '2. Confirmar ocupação lícita, residência fixa e vínculos familiares.',
      ],
      vulnerabilities: [
        'Necessidade de comprovação documental imediata de residência e trabalho para afastar requisitos do Art. 312 CPP.',
      ],
      strategyA:
        'Caso o Ministério Público manifeste-se pela liberdade provisória: requerer o acolhimento imediato sem fiança (Art. 350 CPP).',
      strategyB: `Sustentação combativa pelo relaxamento da prisão por nulidades probatórias e liberdade provisória (Art. 312 CPP)${
        hasDomiciliar
          ? ', com pedido subsidiário de Prisão Domiciliar (Art. 318 CPP) diante dos filhos menores'
          : ' ou cautelares diversas do Art. 319 CPP'
      }.`,
      forumQuestionsClient: [
        'O senhor confirma sua residência fixa e ocupação lícita?',
        'Como ocorreu exatamente a abordagem policial e houve ingresso sem mandado ou autorização?',
      ],
      forumQuestionsWitness: [
        'Sr. Policial, quais foram as fundadas razões prévias documentadas que motivaram a abordagem?',
      ],
      oralStatement: `Excelentíssimo(a) Senhor(a) Doutor(a) Juiz(a) de Direito da ${varaVal}, ilustre representante do Ministério Público.\n\nA Defesa técnica de ${assistido.toUpperCase()} requer a concessão da liberdade ao assistido diante da ausência dos requisitos da prisão preventiva (Art. 312 CPP)${
        hasDomiciliar
          ? ', bem como a aplicação subsidiária da prisão domiciliar prevista no Art. 318 CPP'
          : ''
      }.`,
      familyWhatsappMsg: `Olá! Aqui é da equipe do Dr. Ramon Ribeiro e da Dra. Jéssica. Já abrimos o Dossiê Vivo de ${assistido} e estamos atuando no caso (${varaVal}).`,
      createdAt: new Date().toISOString(),
    };
    state.cases = [created, ...state.cases];
    res.status(201).json({ source: 'mock-backend', item: created });
  });

  app.patch('/api/cases/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = state.cases.findIndex((c) => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Dossiê não encontrado.' });
      return;
    }

    const current = state.cases[idx];
    const allowedStringFields = [
      'assistido',
      'processo',
      'varaComarca',
      'imputacao',
      'resumoFatos',
      'assignedTo',
      'cpf',
      'prisonUnit',
      'residenceProof',
      'occupation',
      'children',
      'antecedents',
      'familyContact',
      'strategyA',
      'strategyB',
      'oralStatement',
      'familyWhatsappMsg',
    ] as const;

    const updated: CaseRecord = { ...current };
    for (const field of allowedStringFields) {
      if (typeof req.body?.[field] === 'string') {
        (updated as unknown as Record<string, unknown>)[field] =
          req.body[field].trim();
      }
    }

    if (
      typeof req.body?.situacao === 'string' &&
      [
        'Preso em Flagrante',
        'Preventiva',
        'Liberdade Provisória',
        'Regime Fechado (SEEU)',
      ].includes(req.body.situacao)
    ) {
      updated.situacao = req.body.situacao;
    }

    if (Array.isArray(req.body?.forensicTimeline)) {
      updated.forensicTimeline = req.body.forensicTimeline;
    }
    if (Array.isArray(req.body?.prepCliente)) {
      updated.prepCliente = req.body.prepCliente;
    }
    if (Array.isArray(req.body?.vulnerabilities)) {
      updated.vulnerabilities = req.body.vulnerabilities;
    }
    if (Array.isArray(req.body?.forumQuestionsClient)) {
      updated.forumQuestionsClient = req.body.forumQuestionsClient;
    }
    if (Array.isArray(req.body?.forumQuestionsWitness)) {
      updated.forumQuestionsWitness = req.body.forumQuestionsWitness;
    }

    state.cases[idx] = updated;
    res.json({ source: 'mock-backend', item: updated });
  });

  // ---------------------------------------------------------------------------
  // AGENTE CRIMINALISTA IA (MOTOR COM BASE DE DOCUMENTOS, ÁUDIOS & HISTÓRICO)
  // ---------------------------------------------------------------------------
  app.post('/api/agent/criminal', async (req: Request, res: Response) => {
    const prompt =
      typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    const jurisdictionRaw = req.body?.jurisdiction as JurisdictionRegion;
    const focusRaw = req.body?.focusArea as AgentFocusArea;
    const caseContext =
      typeof req.body?.caseContext === 'string'
        ? req.body.caseContext.trim().slice(0, 1500)
        : '';
    const caseId =
      typeof req.body?.caseId === 'string' ? req.body.caseId.trim() : '';
    const clientId =
      typeof req.body?.clientId === 'string' ? req.body.clientId.trim() : '';
    const selectedIds = Array.isArray(req.body?.selectedKnowledgeIds)
      ? (req.body.selectedKnowledgeIds as unknown[]).filter(
          (id): id is string => typeof id === 'string'
        )
      : null;
    const history = Array.isArray(req.body?.history)
      ? (req.body.history as unknown[])
          .filter(
            (h): h is { role: 'user' | 'model'; text: string } =>
              Boolean(h) &&
              typeof h === 'object' &&
              ((h as { role?: unknown }).role === 'user' ||
                (h as { role?: unknown }).role === 'model') &&
              typeof (h as { text?: unknown }).text === 'string'
          )
          .slice(-6)
      : [];

    if (!prompt || prompt.length < 5) {
      res.status(400).json({
        error:
          'Descreva a dúvida jurídica, tese ou fato processual (mínimo 5 caracteres).',
      });
      return;
    }

    if (prompt.length > 4000) {
      res.status(400).json({
        error: 'A consulta excedeu o limite máximo de 4.000 caracteres.',
      });
      return;
    }

    const jurisdiction: JurisdictionRegion = VALID_JURISDICTIONS.includes(
      jurisdictionRaw
    )
      ? jurisdictionRaw
      : 'RN_CE';

    const focusArea: AgentFocusArea = VALID_FOCUS_AREAS.includes(focusRaw)
      ? focusRaw
      : 'geral';

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        code: 'GEMINI_KEY_UNAVAILABLE',
        error:
          'O Agente Criminalista IA requer a variável GEMINI_API_KEY configurada no painel Settings > Secrets do ambiente.',
      });
      return;
    }

    // Retrieve knowledge items selected by lawyer or matched to client/case
    const groundedKnowledge =
      selectedIds !== null
        ? state.knowledgeBase.filter((k) => selectedIds.includes(k.id))
        : state.knowledgeBase
            .filter(
              (k) =>
                (!clientId || k.clientId === clientId || !k.clientId) &&
                (!caseId || k.caseId === caseId || !k.caseId)
            )
            .slice(0, 4);

    const knowledgeBlock =
      groundedKnowledge.length > 0
        ? [
            'BASE DE CONHECIMENTO DO ADVOGADO (DOCUMENTOS & ÁUDIOS INDEXADOS):',
            ...groundedKnowledge.map(
              (k, idx) =>
                `[${idx + 1}] (${k.kind.toUpperCase()}) ${k.title}\nResumo: ${k.summary}\nPontos-chave: ${k.keyPoints.join(' | ')}\nExtrato/Transcrição: ${k.transcriptOrExtract.slice(0, 1200)}`
            ),
          ].join('\n\n')
        : '';

    const matchedCase = caseId
      ? state.cases.find((c) => c.id === caseId)
      : undefined;

    const caseDossierBlock = matchedCase
      ? [
          `DOSSIÊ VIVO ATIVO (${matchedCase.assistido} · ${matchedCase.varaComarca}):`,
          `Processo: ${matchedCase.processo} | Situação: ${matchedCase.situacao} | Imputação: ${matchedCase.imputacao}`,
          matchedCase.prisonUnit ? `Unidade Prisional: ${matchedCase.prisonUnit}` : '',
          matchedCase.residenceProof ? `Endereço / Residência: ${matchedCase.residenceProof}` : '',
          matchedCase.occupation ? `Vínculos/Ocupação: ${matchedCase.occupation}` : '',
          matchedCase.children ? `Filhos/Dependentes (Art. 318 CPP): ${matchedCase.children}` : '',
          matchedCase.antecedents ? `Antecedentes: ${matchedCase.antecedents}` : '',
          `Síntese Fática: ${matchedCase.resumoFatos}`,
          matchedCase.forensicTimeline && matchedCase.forensicTimeline.length > 0
            ? `Linha do Tempo Forense & Contradições:\n${matchedCase.forensicTimeline
                .map(
                  (t) =>
                    `- [${t.date} ${t.time} | ${t.type.toUpperCase()}] ${t.title}: ${t.description}${
                      t.contradiction && t.contradictionNote
                        ? ` >> CONTRADIÇÃO DETECTADA: ${t.contradictionNote}`
                        : ''
                    }`
                )
                .join('\n')}`
            : '',
          matchedCase.vulnerabilities && matchedCase.vulnerabilities.length > 0
            ? `Pontos de Risco / MP: ${matchedCase.vulnerabilities.join(' | ')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

    const matchedClient = clientId
      ? state.clients.find((c) => c.id === clientId)
      : undefined;

    const clientBlock = matchedClient
      ? [
          `FICHA DO CLIENTE (${matchedClient.name} · ${matchedClient.tribunal} · ${matchedClient.comarca}):`,
          `Situação: ${matchedClient.custodyStatus} | Imputação: ${matchedClient.imputationSummary}`,
          `Pontos Importantes: ${matchedClient.importantPoints
            .map((p) => `[${p.category}] ${p.title}: ${p.detail}`)
            .join(' ; ')}`,
          `Linha do Tempo Recente: ${matchedClient.timeline
            .slice(0, 4)
            .map((t) => `${t.date} (${t.stage}) - ${t.title}: ${t.description}`)
            .join(' | ')}`,
        ].join('\n')
      : '';

    const historyBlock =
      history.length > 0
        ? [
            'HISTÓRICO RECENTE DA INTERAÇÃO:',
            ...history.map(
              (turn) =>
                `${turn.role === 'user' ? 'ADVOGADO' : 'DOUTOR LEX'}: ${turn.text.slice(0, 800)}`
            ),
          ].join('\n')
        : '';

    const combinedPrompt = [
      knowledgeBlock,
      caseDossierBlock,
      clientBlock,
      caseContext ? `CONTEXTO ADICIONAL DO CASO ATIVO:\n${caseContext}` : '',
      historyBlock,
      `CONSULTA ATUAL DO(A) ADVOGADO(A):\n${prompt}`,
    ]
      .filter(Boolean)
      .join('\n\n---\n\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: combinedPrompt,
        config: {
          systemInstruction: buildCriminalAgentSystemInstruction(
            jurisdiction,
            focusArea
          ),
        },
      });

      const answer = (response.text ?? '').trim();
      if (!answer) {
        res.status(502).json({
          error: 'O agente não retornou texto válido para esta consulta.',
        });
        return;
      }

      res.json({
        answer,
        model: 'gemini-4-hydrogen',
        jurisdiction,
        focusArea,
        usedKnowledgeTitles: groundedKnowledge.map((k) => k.title),
        generatedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const { status, code, message } = parseGeminiError(err);
      res.status(status).json({
        code,
        error: `Não foi possível obter parecer do Agente Criminalista: ${message}`,
      });
    }
  });

  return app;
}
