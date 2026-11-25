import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { createApp } from '../server/app';
import {
  calculateSeeuProgression,
  generateCustodiaStrategyOutput,
} from '../src/utils/legalGenerators';
import {
  isValidStoredSession,
  normalizeOabKey,
} from '../src/utils/authHelpers';
import { DEFAULT_GOVERNANCE, INITIAL_CASES, ROLE_META } from '../src/data/mockCases';

describe('LexRamon Backend Simulado & API do Agente Criminalista', () => {
  let server: http.Server;
  let baseUrl = '';
  const prevGeminiKey = process.env.GEMINI_API_KEY;

  before(async () => {
    delete process.env.GEMINI_API_KEY;
    const app = createApp();
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => {
      server.once('listening', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    if (prevGeminiKey !== undefined) {
      process.env.GEMINI_API_KEY = prevGeminiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('GET /api/health retorna serviço operacional com regiões TJRN, TJCE, STJ e STF', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = (await res.json()) as {
      ok: boolean;
      regions: string[];
      agentModel: string;
    };
    assert.equal(data.ok, true);
    assert.ok(data.regions.includes('TJRN'));
    assert.ok(data.regions.includes('TJCE'));
    assert.equal(data.agentModel, 'gemini-4-hydrogen');
  });

  it('POST /api/auth/login autentica Dr. Ramon e Dra. Jéssica com redirecionamento RBAC', async () => {
    const ramonRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ramon',
        password: 'LexRamon@2026',
      }),
    });
    assert.equal(ramonRes.status, 200);
    const ramonData = (await ramonRes.json()) as {
      authenticated: boolean;
      user: { name: string; role: string; oab: string };
    };
    assert.equal(ramonData.authenticated, true);
    assert.match(ramonData.user.name, /Ramon/i);
    assert.equal(ramonData.user.role, 'escritorio');
    assert.match(ramonData.user.oab, /RN/i);

    const jessicaRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'jessica@ramonribeiro.adv.br',
        password: 'LexRamon@2026',
      }),
    });
    assert.equal(jessicaRes.status, 200);
    const jessicaData = (await jessicaRes.json()) as {
      authenticated: boolean;
      user: { name: string; role: string; oab: string };
    };
    assert.equal(jessicaData.authenticated, true);
    assert.match(jessicaData.user.name, /Jéssica/i);
    assert.equal(jessicaData.user.role, 'autonomo');
    assert.match(jessicaData.user.oab, /RN/i);
  });

  it('POST /api/auth/login bloqueia senha incorreta com HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ramon',
        password: 'SenhaIncorreta999',
      }),
    });
    assert.equal(res.status, 401);
  });

  it('GET /api/dashboard e /api/news retornam métricas, casos RN/CE, notícias e agenda', async () => {
    const dashRes = await fetch(`${baseUrl}/api/dashboard`);
    assert.equal(dashRes.status, 200);
    const dash = (await dashRes.json()) as {
      metrics: { activeCases: number; jurisdictions: string[] };
      cases: unknown[];
      news: unknown[];
      agenda: unknown[];
    };
    assert.ok(dash.metrics.activeCases >= 4);
    assert.ok(dash.news.length >= 3);
    assert.ok(dash.agenda.length >= 3);

    const ceRes = await fetch(`${baseUrl}/api/news?tribunal=TJCE`);
    assert.equal(ceRes.status, 200);
    const ceData = (await ceRes.json()) as { items: { tribunal: string }[] };
    assert.ok(ceData.items.length >= 1);
    assert.ok(ceData.items.every((item) => item.tribunal === 'TJCE'));
  });

  it('POST /api/agenda cria prazo e PATCH /api/agenda/:id/toggle alterna conclusão', async () => {
    const createRes = await fetch(`${baseUrl}/api/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Protocolar HC Preventivo TJCE',
        assistido: 'A.S.M.',
        tribunal: 'TJCE',
        comarca: 'Fortaleza/CE',
        dateLabel: 'Amanhã',
        timeLabel: '10:30',
        kind: 'prazo_fatal',
        responsible: 'Jéssica',
      }),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as {
      item: { id: string; completed: boolean; tribunal: string };
    };
    assert.equal(created.item.completed, false);
    assert.equal(created.item.tribunal, 'TJCE');

    const toggleRes = await fetch(
      `${baseUrl}/api/agenda/${created.item.id}/toggle`,
      { method: 'PATCH' }
    );
    assert.equal(toggleRes.status, 200);
    const toggled = (await toggleRes.json()) as {
      item: { completed: boolean };
    };
    assert.equal(toggled.item.completed, true);
  });

  it('POST /api/cases valida campos obrigatórios e cadastra novo caso', async () => {
    const badRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assistido: '' }),
    });
    assert.equal(badRes.status, 400);

    const okRes = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assistido: 'R.T.B.',
        imputacao: 'Art. 33 da Lei 11.343/06',
        varaComarca: 'Fortaleza/CE',
        prisonUnit: 'CPPL II · Itaitinga/CE',
        residenceProof: 'Rua Costa Barros, 200 · Fortaleza/CE',
        children: 'Dependente PcD (Art. 318 CPP)',
      }),
    });
    assert.equal(okRes.status, 201);
    const createdCase = (await okRes.json()) as {
      item: {
        id: string;
        assistido: string;
        prisonUnit?: string;
        residenceProof?: string;
        strategyB?: string;
      };
    };
    assert.equal(createdCase.item.prisonUnit, 'CPPL II · Itaitinga/CE');
    assert.match(createdCase.item.strategyB ?? '', /Art\. 318 CPP/i);

    const patchRes = await fetch(`${baseUrl}/api/cases/${createdCase.item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        children: 'Sim (1 filho menor de 5 anos)',
        prisonUnit: 'CDP Parnamirim/RN',
        forensicTimeline: [
          {
            id: 'tl-test-1',
            date: '2026-11-25',
            time: '14:15',
            type: 'defense',
            title: 'Juntada Certidão de Nascimento (Art. 318 CPP)',
            description: 'Comprovação de filho menor para substituição domiciliar.',
            source: 'Defesa Técnica',
          },
        ],
      }),
    });
    assert.equal(patchRes.status, 200);
    const patched = (await patchRes.json()) as {
      item: { children: string; prisonUnit?: string; forensicTimeline: unknown[] };
    };
    assert.match(patched.item.children, /filho menor/i);
    assert.equal(patched.item.prisonUnit, 'CDP Parnamirim/RN');
    assert.equal(patched.item.forensicTimeline.length, 1);
  });

  it('POST /api/agent/criminal valida entrada curta (400) e reporta ausência de GEMINI_API_KEY sem fallback falso (503)', async () => {
    const shortRes = await fetch(`${baseUrl}/api/agent/criminal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'oi' }),
    });
    assert.equal(shortRes.status, 400);

    const noKeyRes = await fetch(`${baseUrl}/api/agent/criminal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Analisar nulidade por busca domiciliar sem mandado no TJRN.',
        jurisdiction: 'RN',
        focusArea: 'extravagantes',
      }),
    });
    assert.equal(noKeyRes.status, 503);
    const body = (await noKeyRes.json()) as { code: string; error: string };
    assert.equal(body.code, 'GEMINI_KEY_UNAVAILABLE');
    assert.match(body.error, /GEMINI_API_KEY/);
  });

  it('Cadastro de Clientes (/api/clients) gerencia ficha, pontos importantes e linha do tempo', async () => {
    const listRes = await fetch(`${baseUrl}/api/clients`);
    assert.equal(listRes.status, 200);
    const listData = (await listRes.json()) as { items: unknown[] };
    assert.ok(listData.items.length >= 4);

    const createRes = await fetch(`${baseUrl}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Eduardo Lima',
        phoneWhatsapp: '(84) 99911-2233',
        tribunal: 'TJRN',
        comarca: 'Mossoró/RN',
        custodyStatus: 'Preso em Flagrante',
        imputationSummary: 'Art. 33 Lei 11.343/06',
        assignedLawyer: 'Dr. Ramon Ribeiro',
        initialPointTitle: 'Ausência de bodycam na abordagem',
        initialPointDetail: 'Testemunha presencial confirma ingresso sem autorização.',
      }),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as {
      item: {
        id: string;
        importantPoints: { id: string; pinned: boolean }[];
        timeline: unknown[];
      };
    };
    assert.equal(created.item.importantPoints.length, 1);
    assert.equal(created.item.timeline.length, 1);

    const pointRes = await fetch(
      `${baseUrl}/api/clients/${created.item.id}/points`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'vinculo_licito',
          title: 'CTPS e residência fixa em Mossoró',
          detail: 'Comprovantes anexados ao dossiê.',
        }),
      }
    );
    assert.equal(pointRes.status, 201);
    const ptData = (await pointRes.json()) as { item: { id: string; pinned: boolean } };
    assert.equal(ptData.item.pinned, true);

    const togglePtRes = await fetch(
      `${baseUrl}/api/clients/${created.item.id}/points/${ptData.item.id}/toggle`,
      { method: 'PATCH' }
    );
    assert.equal(togglePtRes.status, 200);
    const toggledPt = (await togglePtRes.json()) as { item: { pinned: boolean } };
    assert.equal(toggledPt.item.pinned, false);

    const tlRes = await fetch(
      `${baseUrl}/api/clients/${created.item.id}/timeline`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'Custódia',
          importance: 'critico',
          title: 'Audiência de Custódia realizada em Mossoró/RN',
          description: 'Concedida liberdade provisória com cautelares do Art. 319 CPP.',
        }),
      }
    );
    assert.equal(tlRes.status, 201);
    const tlData = (await tlRes.json()) as { client: { timeline: unknown[] } };
    assert.equal(tlData.client.timeline.length, 2);
  });

  it('Base de Conhecimento IA (/api/knowledge) lista itens, valida MIME/conteúdo e exige GEMINI_API_KEY sem fallback falso', async () => {
    const listRes = await fetch(`${baseUrl}/api/knowledge`);
    assert.equal(listRes.status, 200);
    const listData = (await listRes.json()) as { items: { id: string }[] };
    assert.ok(listData.items.length >= 3);

    const badMimeRes = await fetch(`${baseUrl}/api/knowledge/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Arquivo executável inválido',
        kind: 'documento',
        mimeType: 'application/x-msdownload',
        base64Data: 'AAAA',
      }),
    });
    assert.equal(badMimeRes.status, 400);

    const noKeyAudioRes = await fetch(`${baseUrl}/api/knowledge/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Áudio Parlatório Teste',
        kind: 'audio',
        mimeType: 'audio/mp3',
        fileName: 'parlatorio.mp3',
        base64Data: 'SUQzAwAAAAAA',
      }),
    });
    assert.equal(noKeyAudioRes.status, 503);

    const delRes = await fetch(`${baseUrl}/api/knowledge/${listData.items[0].id}`, {
      method: 'DELETE',
    });
    assert.equal(delRes.status, 200);
  });
});

describe('Motores Jurídicos & Regras RBAC (Unitários)', () => {
  it('calculateSeeuProgression calcula corretamente fração de 16%, detração e remição', () => {
    const result = calculateSeeuProgression({
      years: 5,
      months: 0,
      fractionPercent: 16,
      startDateStr: '2025-01-01',
      detractionDays: 30,
      remittedDays: 60,
    });
    assert.equal(result.totalDays, 1825);
    assert.equal(result.requiredDays, 292);
    assert.ok(result.effectiveDays >= 90);
    assert.ok(result.remainingDays < result.requiredDays);
  });

  it('generateCustodiaStrategyOutput gera pedidos em cascata e tese Tema 280 STF no Cenário B', () => {
    const output = generateCustodiaStrategyOutput(
      INITIAL_CASES[0],
      {
        cenario: 'B',
        notasParlatorio: 'Ingresso sem mandado em residência em Natal/RN.',
        invasaoDomiciliar: true,
        filhosMenores: true,
        semAudioVideo: true,
      },
      DEFAULT_GOVERNANCE
    );
    assert.equal(output.pedidosCascata.length, 3);
    assert.match(output.sustentacao, /Tema 280 STF/i);
    assert.match(output.sustentacao, /HC 598\.051\/SP/i);
  });

  it('isValidStoredSession, normalizeOabKey e RBAC protegem alçadas entre Ramon e Estágio', () => {
    assert.equal(normalizeOabKey('OAB/RN 14.820'), 'oabrn14820');
    assert.equal(
      isValidStoredSession({
        name: 'Dr. Ramon Ribeiro',
        email: 'ramon@ramonribeiro.adv.br',
        oab: 'OAB/RN 14.820',
        role: 'escritorio',
        lgpdAccepted: true,
        authenticatedAt: new Date().toISOString(),
      }),
      true
    );
    assert.equal(isValidStoredSession({ role: 'invalido' }), false);
    assert.equal(ROLE_META.escritorio.permissions.canValidate, true);
    assert.equal(ROLE_META.autonomo.permissions.canValidate, true);
    assert.equal(ROLE_META.estudante.permissions.canValidate, false);
  });
});
