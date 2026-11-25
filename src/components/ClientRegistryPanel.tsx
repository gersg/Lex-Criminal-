import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Pin,
  PinOff,
  Plus,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  ClientImportantPoint,
  ClientRecord,
  ClientTimelineEvent,
  WarModuleId,
} from '../types/lex';

interface ClientRegistryPanelProps {
  clients: ClientRecord[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  onClientCreated: (client: ClientRecord) => void;
  onClientUpdated: (client: ClientRecord) => void;
  onConsultAgentWithClient: (client: ClientRecord) => void;
  onOpenWarRoom?: (caseId: string, moduleId: WarModuleId) => void;
  onNotify?: (msg: string) => void;
}

const POINT_CATEGORY_META: Record<
  ClientImportantPoint['category'],
  { label: string; badgeClass: string }
> = {
  nulidade: {
    label: 'Nulidade',
    badgeClass: 'bg-red-950/60 border-red-500/40 text-red-300',
  },
  prova: {
    label: 'Prova / Perícia',
    badgeClass: 'bg-blue-950/60 border-blue-500/40 text-blue-300',
  },
  vinculo_licito: {
    label: 'Vínculo Lícito',
    badgeClass: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
  },
  risco: {
    label: 'Ponto de Risco',
    badgeClass: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
  },
  estrategia: {
    label: 'Estratégia',
    badgeClass: 'bg-slate-800/80 border-slate-600/60 text-slate-200',
  },
};

const TIMELINE_STAGES: ClientTimelineEvent['stage'][] = [
  'Abordagem / APF',
  'Atendimento',
  'Custódia',
  'Inquérito',
  'Denúncia',
  'AIJ / Instrução',
  'Sentença',
  'Recurso / STJ',
  'Execução SEEU',
];

export const ClientRegistryPanel: React.FC<ClientRegistryPanelProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onClientCreated,
  onClientUpdated,
  onConsultAgentWithClient,
  onOpenWarRoom,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState<
    'todos' | 'presos' | 'TJRN' | 'TJCE'
  >('todos');

  // New Client form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newFamily, setNewFamily] = useState('');
  const [newTribunal, setNewTribunal] = useState<'TJRN' | 'TJCE' | 'STJ'>('TJRN');
  const [newComarca, setNewComarca] = useState('Natal/RN');
  const [newStatus, setNewStatus] =
    useState<ClientRecord['custodyStatus']>('Preso em Flagrante');
  const [newPrisonUnit, setNewPrisonUnit] = useState('');
  const [newImputation, setNewImputation] = useState('');
  const [newLawyer, setNewLawyer] = useState<ClientRecord['assignedLawyer']>(
    'Dr. Ramon Ribeiro'
  );
  const [newPointTitle, setNewPointTitle] = useState('');
  const [newPointDetail, setNewPointDetail] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  // Add Important Point form
  const [showPointForm, setShowPointForm] = useState(false);
  const [pointCategory, setPointCategory] =
    useState<ClientImportantPoint['category']>('nulidade');
  const [pointTitle, setPointTitle] = useState('');
  const [pointDetail, setPointDetail] = useState('');

  // Add Timeline Event form
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [tlStage, setTlStage] =
    useState<ClientTimelineEvent['stage']>('Atendimento');
  const [tlImportance, setTlImportance] =
    useState<ClientTimelineEvent['importance']>('importante');
  const [tlTitle, setTlTitle] = useState('');
  const [tlDate, setTlDate] = useState('');
  const [tlDesc, setTlDesc] = useState('');

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.comarca.toLowerCase().includes(q) ||
        c.imputationSummary.toLowerCase().includes(q) ||
        c.importantPoints.some((p) => p.title.toLowerCase().includes(q));
      const matchesScope =
        filterScope === 'todos'
          ? true
          : filterScope === 'presos'
          ? c.custodyStatus === 'Preso em Flagrante' ||
            c.custodyStatus === 'Prisão Preventiva' ||
            c.custodyStatus === 'Regime Fechado (SEEU)'
          : c.tribunal === filterScope;
      return matchesQuery && matchesScope;
    });
  }, [clients, search, filterScope]);

  const activeClient = useMemo(
    () =>
      clients.find((c) => c.id === selectedClientId) ??
      filteredClients[0] ??
      clients[0],
    [clients, filteredClients, selectedClientId]
  );

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 3) {
      onNotify?.('Informe o nome completo do cliente.');
      return;
    }
    setSavingClient(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          phoneWhatsapp: newWhatsapp.trim(),
          familyContact: newFamily.trim(),
          tribunal: newTribunal,
          comarca: newComarca.trim(),
          custodyStatus: newStatus,
          prisonUnit: newPrisonUnit.trim(),
          imputationSummary: newImputation.trim(),
          assignedLawyer: newLawyer,
          initialPointTitle: newPointTitle.trim(),
          initialPointDetail: newPointDetail.trim(),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { item: ClientRecord };
        onClientCreated(data.item);
        onSelectClient(data.item.id);
        setShowNewClientForm(false);
        setNewName('');
        setNewWhatsapp('');
        setNewFamily('');
        setNewPrisonUnit('');
        setNewImputation('');
        setNewPointTitle('');
        setNewPointDetail('');
        onNotify?.(`Cliente "${data.item.name}" cadastrado com linha do tempo`);
      }
    } finally {
      setSavingClient(false);
    }
  };

  const handleAddPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || pointTitle.trim().length < 3) return;
    const res = await fetch(`/api/clients/${activeClient.id}/points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: pointCategory,
        title: pointTitle.trim(),
        detail: pointDetail.trim(),
        pinned: true,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { client: ClientRecord };
      onClientUpdated(data.client);
      setPointTitle('');
      setPointDetail('');
      setShowPointForm(false);
      onNotify?.('Ponto importante fixado na ficha do cliente');
    }
  };

  const handleTogglePinPoint = async (pointId: string) => {
    if (!activeClient) return;
    const res = await fetch(
      `/api/clients/${activeClient.id}/points/${pointId}/toggle`,
      { method: 'PATCH' }
    );
    if (res.ok) {
      const data = (await res.json()) as { client: ClientRecord };
      onClientUpdated(data.client);
    }
  };

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || tlTitle.trim().length < 3) return;
    const res = await fetch(`/api/clients/${activeClient.id}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: tlStage,
        importance: tlImportance,
        title: tlTitle.trim(),
        date: tlDate.trim(),
        description: tlDesc.trim(),
        responsible: activeClient.assignedLawyer,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { client: ClientRecord };
      onClientUpdated(data.client);
      setTlTitle('');
      setTlDate('');
      setTlDesc('');
      setShowTimelineForm(false);
      onNotify?.('Marco registrado na linha do tempo do cliente');
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho & Botão de Novo Cliente */}
      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Cadastro de Clientes · Linha do Tempo & Pontos Importantes</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dossiê criminal completo com marcos cronológicos, pontos críticos fixados e integração direta com o Cérebro IA.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewClientForm((prev) => !prev)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showNewClientForm ? 'Fechar Cadastro' : 'Novo Cliente'}</span>
        </button>
      </div>

      {/* Formulário de Cadastro de Novo Cliente */}
      {showNewClientForm && (
        <form
          onSubmit={handleCreateClient}
          className="rounded-2xl bg-[#0B111E] border border-amber-500/35 p-4 sm:p-6 space-y-4"
        >
          <h4 className="text-xs sm:text-sm font-bold text-amber-400">
            Cadastrar Novo Cliente na Banca (RN / CE)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">Nome Completo *</span>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex.: Francisco das Chagas Souza"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">WhatsApp do Cliente</span>
              <input
                type="text"
                value={newWhatsapp}
                onChange={(e) => setNewWhatsapp(e.target.value)}
                placeholder="(84) 99900-0000"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">Contato Familiar</span>
              <input
                type="text"
                value={newFamily}
                onChange={(e) => setNewFamily(e.target.value)}
                placeholder="Nome, parentesco e telefone"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">Tribunal</span>
              <select
                value={newTribunal}
                onChange={(e) =>
                  setNewTribunal(e.target.value as 'TJRN' | 'TJCE' | 'STJ')
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="TJRN">TJRN (Rio Grande do Norte)</option>
                <option value="TJCE">TJCE (Ceará)</option>
                <option value="STJ">STJ (Brasília)</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">Comarca</span>
              <input
                type="text"
                value={newComarca}
                onChange={(e) => setNewComarca(e.target.value)}
                placeholder="Ex.: Mossoró/RN ou Fortaleza/CE"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">Situação Cautelar</span>
              <select
                value={newStatus}
                onChange={(e) =>
                  setNewStatus(e.target.value as ClientRecord['custodyStatus'])
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Preso em Flagrante">Preso em Flagrante</option>
                <option value="Prisão Preventiva">Prisão Preventiva</option>
                <option value="Liberdade Provisória">Liberdade Provisória</option>
                <option value="Regime Fechado (SEEU)">Regime Fechado (SEEU)</option>
                <option value="Em Liberdade">Em Liberdade</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">
                Unidade Prisional / Local
              </span>
              <input
                type="text"
                value={newPrisonUnit}
                onChange={(e) => setNewPrisonUnit(e.target.value)}
                placeholder="Ex.: CDP Parnamirim / CPPL Itaitinga"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">
                Tipificação / Imputação
              </span>
              <input
                type="text"
                value={newImputation}
                onChange={(e) => setNewImputation(e.target.value)}
                placeholder="Ex.: Art. 33 Lei 11.343/06"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">
                Advogado Responsável
              </span>
              <select
                value={newLawyer}
                onChange={(e) =>
                  setNewLawyer(e.target.value as ClientRecord['assignedLawyer'])
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Dr. Ramon Ribeiro">Dr. Ramon Ribeiro</option>
                <option value="Dra. Jéssica">Dra. Jéssica</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">
                Ponto Importante Inicial (Opcional)
              </span>
              <input
                type="text"
                value={newPointTitle}
                onChange={(e) => setNewPointTitle(e.target.value)}
                placeholder="Ex.: Busca domiciliar sem mandado e sem bodycam"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] text-slate-400">
                Detalhe do Ponto Importante
              </span>
              <input
                type="text"
                value={newPointDetail}
                onChange={(e) => setNewPointDetail(e.target.value)}
                placeholder="Provas, testemunhas, CTPS ou nulidades iniciais..."
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewClientForm(false)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingClient}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
            >
              {savingClient ? 'Salvando...' : 'Salvar Ficha do Cliente'}
            </button>
          </div>
        </form>
      )}

      {/* Layout Principal: Lista de Clientes (4 cols) + Ficha com Pontos e Linha do Tempo (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Lista Esquerda */}
        <aside className="lg:col-span-4 rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente, comarca ou tese..."
                className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#060B14] border border-slate-800">
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'presos', label: 'Presos' },
                  { id: 'TJRN', label: 'TJRN' },
                  { id: 'TJCE', label: 'TJCE' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterScope(tab.id)}
                  className={`min-h-[34px] px-1.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    filterScope === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[640px] overflow-y-auto custom-scroll">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum cliente encontrado para o filtro atual.
              </div>
            ) : (
              filteredClients.map((c) => {
                const isSelected = activeClient?.id === c.id;
                const isCustodyUrgent =
                  c.custodyStatus === 'Preso em Flagrante' ||
                  c.custodyStatus === 'Prisão Preventiva';
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectClient(c.id)}
                    className={`w-full p-4 text-left transition-colors space-y-1.5 ${
                      isSelected
                        ? 'bg-[#131D33] border-r-2 border-amber-400'
                        : 'hover:bg-slate-900/45'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                        {c.name}
                      </span>
                      <span
                        className={`font-mono-tabular text-[10px] font-bold shrink-0 ${
                          isCustodyUrgent ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {c.tribunal}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate">
                      {c.imputationSummary}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span
                        className={
                          isCustodyUrgent ? 'text-amber-400' : 'text-slate-400'
                        }
                      >
                        {c.custodyStatus}
                      </span>
                      <span className="font-mono-tabular text-slate-500">
                        {c.importantPoints.length} pts · {c.timeline.length}{' '}
                        marcos
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Ficha Detalhada Direita */}
        {activeClient && (
          <div className="lg:col-span-8 space-y-5">
            {/* Cartão Resumo do Cliente */}
            <section className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono-tabular font-bold text-blue-400">
                      {activeClient.tribunal} · {activeClient.comarca}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-amber-400 font-semibold">
                      {activeClient.custodyStatus}
                    </span>
                  </div>
                  <h4 className="font-display text-lg sm:text-xl font-bold text-white">
                    {activeClient.name}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {activeClient.imputationSummary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onConsultAgentWithClient(activeClient)}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Consultar Cérebro IA</span>
                  </button>

                  {activeClient.caseId && onOpenWarRoom && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenWarRoom(activeClient.caseId!, 'custodia')
                      }
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-semibold text-amber-400 flex items-center gap-1.5 transition-colors"
                    >
                      <span>War Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="p-3 rounded-xl bg-[#060B14] border border-slate-800/90 space-y-0.5">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp / Família</span>
                  </span>
                  <div className="font-semibold text-slate-100">
                    {activeClient.phoneWhatsapp}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {activeClient.familyContact}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#060B14] border border-slate-800/90 space-y-0.5">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Unidade / Localização</span>
                  </span>
                  <div className="font-semibold text-slate-100">
                    {activeClient.prisonUnit || activeClient.comarca}
                  </div>
                  {activeClient.cpfMasked && (
                    <div className="font-mono-tabular text-[11px] text-slate-400">
                      CPF {activeClient.cpfMasked}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-[#060B14] border border-slate-800/90 space-y-0.5">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>Advogado Responsável</span>
                  </span>
                  <div className="font-semibold text-slate-100">
                    {activeClient.assignedLawyer}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Banca LexRamon · Sigilo Ativo
                  </div>
                </div>
              </div>
            </section>

            {/* PONTOS IMPORTANTES DO CLIENTE */}
            <section className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>
                      Pontos Importantes & Teses Fixadas (
                      {activeClient.importantPoints.length})
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Nulidades, vínculos lícitos e alertas que alimentam automaticamente as respostas do Cérebro IA.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPointForm((p) => !p)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-semibold text-amber-400 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Ponto</span>
                </button>
              </div>

              {showPointForm && (
                <form
                  onSubmit={handleAddPoint}
                  className="p-3.5 rounded-xl bg-[#060B14] border border-slate-800 space-y-2.5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={pointCategory}
                      onChange={(e) =>
                        setPointCategory(
                          e.target.value as ClientImportantPoint['category']
                        )
                      }
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                    >
                      <option value="nulidade">Nulidade</option>
                      <option value="prova">Prova / Perícia</option>
                      <option value="vinculo_licito">Vínculo Lícito</option>
                      <option value="risco">Ponto de Risco</option>
                      <option value="estrategia">Estratégia</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={pointTitle}
                      onChange={(e) => setPointTitle(e.target.value)}
                      placeholder="Título curto do ponto importante..."
                      className="sm:col-span-2 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={pointDetail}
                    onChange={(e) => setPointDetail(e.target.value)}
                    placeholder="Detalhe fático, artigo violado ou documento comprobatório..."
                    className="w-full px-3 py-2 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPointForm(false)}
                      className="min-h-[36px] px-3 py-1 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="min-h-[36px] px-4 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold"
                    >
                      Fixar Ponto
                    </button>
                  </div>
                </form>
              )}

              {activeClient.importantPoints.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-400">
                  Nenhum ponto importante cadastrado ainda para este cliente.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeClient.importantPoints.map((pt) => {
                    const meta = POINT_CATEGORY_META[pt.category];
                    return (
                      <div
                        key={pt.id}
                        className={`p-3.5 rounded-xl border space-y-2 ${
                          pt.pinned
                            ? 'bg-[#0E1627] border-amber-500/35'
                            : 'bg-[#060B14] border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePinPoint(pt.id)}
                            title={
                              pt.pinned
                                ? 'Desafixar destaque'
                                : 'Fixar como prioridade'
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            {pt.pinned ? (
                              <Pin className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <PinOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <h5 className="text-xs sm:text-sm font-bold text-white leading-snug">
                          {pt.title}
                        </h5>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {pt.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* LINHA DO TEMPO COMPLETA */}
            <section className="rounded-2xl bg-[#0B111E] border border-slate-800 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-blue-400" />
                    <span>
                      Linha do Tempo do Cliente ({activeClient.timeline.length}{' '}
                      marcos)
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Histórico cronológico completo da abordagem policial à execução penal.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTimelineForm((t) => !t)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Marco</span>
                </button>
              </div>

              {showTimelineForm && (
                <form
                  onSubmit={handleAddTimelineEvent}
                  className="p-3.5 rounded-xl bg-[#060B14] border border-slate-800 space-y-2.5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={tlStage}
                      onChange={(e) =>
                        setTlStage(
                          e.target.value as ClientTimelineEvent['stage']
                        )
                      }
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                    >
                      {TIMELINE_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <select
                      value={tlImportance}
                      onChange={(e) =>
                        setTlImportance(
                          e.target.value as ClientTimelineEvent['importance']
                        )
                      }
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                    >
                      <option value="critico">Marco Crítico</option>
                      <option value="importante">Importante</option>
                      <option value="rotina">Acompanhamento</option>
                    </select>
                    <input
                      type="text"
                      value={tlDate}
                      onChange={(e) => setTlDate(e.target.value)}
                      placeholder="Data/hora (opcional, ex.: 26/11 · 15:00)"
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={tlTitle}
                    onChange={(e) => setTlTitle(e.target.value)}
                    placeholder="Título do acontecimento (ex.: Juntada de CTPS e Áudio do Parlatório)"
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                  />
                  <textarea
                    rows={2}
                    value={tlDesc}
                    onChange={(e) => setTlDesc(e.target.value)}
                    placeholder="Descrição detalhada do ato processual, decisão ou diligência..."
                    className="w-full px-3 py-2 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTimelineForm(false)}
                      className="min-h-[36px] px-3 py-1 rounded-lg bg-[#0B111E] border border-slate-800 text-xs text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="min-h-[36px] px-4 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold"
                    >
                      Adicionar à Linha do Tempo
                    </button>
                  </div>
                </form>
              )}

              <ol className="relative space-y-4 pl-6 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {activeClient.timeline.map((ev) => {
                  const Icon =
                    ev.importance === 'critico'
                      ? AlertTriangle
                      : ev.importance === 'importante'
                      ? ShieldCheck
                      : CheckCircle2;
                  const dotColor =
                    ev.importance === 'critico'
                      ? 'bg-red-500/20 border-red-400 text-red-400'
                      : ev.importance === 'importante'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                      : 'bg-blue-500/20 border-blue-400 text-blue-400';

                  return (
                    <li
                      key={ev.id}
                      className="relative rounded-xl bg-[#060B14] border border-slate-800 p-3.5 sm:p-4 space-y-1.5"
                    >
                      <span
                        className={`absolute -left-6 top-4 w-5 h-5 rounded-full border flex items-center justify-center ${dotColor}`}
                      >
                        <Icon className="w-3 h-3" />
                      </span>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tabular font-bold text-blue-400">
                            {ev.stage}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400">{ev.responsible}</span>
                        </div>
                        <span className="font-mono-tabular text-amber-400">
                          {ev.date}
                        </span>
                      </div>

                      <h5 className="text-xs sm:text-sm font-bold text-white">
                        {ev.title}
                      </h5>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {ev.description}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
