import React, { useMemo, useState } from 'react';
import {
  CaseRecord,
  ForumDocument,
  LexModuleId,
  UserSession,
} from '../types/lex';
import { ROLE_META } from '../data/mockCases';
import {
  ArrowUpRight,
  Bell,
  FileCheck2,
  Gavel,
  Scale,
  Search,
  UserPlus,
} from 'lucide-react';

interface DashboardScreenProps {
  session: UserSession;
  cases: CaseRecord[];
  forumDocs: ForumDocument[];
  onOpenModule: (caseId: string, moduleId: LexModuleId) => void;
  onOpenNewClient: () => void;
  onOpenForumDoc: (doc: ForumDocument) => void;
}

type FilterKey = 'todos' | LexModuleId;

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  session,
  cases,
  forumDocs,
  onOpenModule,
  onOpenNewClient,
  onOpenForumDoc,
}) => {
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState<FilterKey>('todos');

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cases.filter((c) => {
      const matchesFilter =
        filterModule === 'todos' || c.defaultModule === filterModule;
      const matchesSearch =
        !q ||
        c.assistido.toLowerCase().includes(q) ||
        c.processo.toLowerCase().includes(q) ||
        c.varaComarca.toLowerCase().includes(q) ||
        c.imputacao.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [cases, filterModule, search]);

  const criticalCount = cases.filter((c) => c.urgency === 'critica').length;
  const custodiasCount = cases.filter((c) => c.defaultModule === 'custodia').length;
  const validatedCount = forumDocs.filter((d) => d.status === 'validado').length;

  return (
    <div className="space-y-6">
      {/* Header da Tela */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-amber-400">
            Painel Executivo · {ROLE_META[session.role].label}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
            Radar Estratégico & Urgências
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenNewClient}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Assistido (APF)</span>
        </button>
      </div>

      {/* Faixa de KPIs Executivos (Single-elevation strip com separadores hairline) */}
      <div className="rounded-2xl bg-[#0B111E] border border-slate-800 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        <div className="p-5">
          <span className="text-xs text-slate-400">Assistidos Ativos</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-white">
              {cases.length}
            </span>
            <span className="text-xs text-slate-400">em curso</span>
          </div>
        </div>

        <div className="p-5">
          <span className="text-xs text-slate-400">Urgências Críticas Hoje</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-red-400">
              {criticalCount}
            </span>
            <span className="text-xs text-slate-400">réus presos</span>
          </div>
        </div>

        <div className="p-5">
          <span className="text-xs text-slate-400">Custódias no Radar</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-amber-400">
              {custodiasCount}
            </span>
            <span className="text-xs text-slate-400">Núcleo de Garantias</span>
          </div>
        </div>

        <div className="p-5">
          <span className="text-xs text-slate-400">Peças Validadas</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-emerald-400">
              {validatedCount}
            </span>
            <span className="text-xs text-slate-400">
              de {forumDocs.length} no Modo Fórum
            </span>
          </div>
        </div>
      </div>

      {/* Tabela Principal de Casos & Prazos */}
      <section className="rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-sm font-semibold text-white">
              Prazos, Audiências e Fluxos Criminais
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Segmented Filter */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto">
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'custodia', label: 'Custódia' },
                  { id: 'aij', label: 'AIJ' },
                  { id: 'tribunais', label: 'STJ/STF' },
                  { id: 'seeu', label: 'SEEU' },
                ] as { id: FilterKey; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterModule(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    filterModule === tab.id
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar assistido ou processo..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Scale className="w-7 h-7 text-slate-500 mx-auto" />
            <p className="text-sm font-medium text-slate-200">
              Nenhum processo encontrado com os filtros atuais.
            </p>
            <p className="text-xs text-slate-400">
              Limpe a busca ou cadastre um novo assistido com leitura de APF.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilterModule('todos');
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 hover:border-amber-500/40"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] font-semibold text-slate-400">
                  <th className="py-3 px-4 sm:px-5">Assistido & Processo</th>
                  <th className="py-3 px-4 hidden md:table-cell">Vara / Comarca</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Situação</th>
                  <th className="py-3 px-4">Próximo Ato</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredCases.map((c) => {
                  const urgencyColor =
                    c.urgency === 'critica'
                      ? 'text-red-400'
                      : c.urgency === 'alta'
                      ? 'text-amber-400'
                      : 'text-emerald-400';

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-900/55 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="font-semibold text-slate-100">
                          {c.assistido}
                        </div>
                        <div className="font-mono-tabular text-[11px] text-slate-400 mt-0.5">
                          {c.processo} · {c.imputacao}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 hidden md:table-cell">
                        {c.varaComarca}
                      </td>
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <span className={`font-medium ${urgencyColor}`}>
                          {c.situacao}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">
                          {c.proximoAto}
                        </div>
                        <div className="font-mono-tabular text-[11px] text-slate-400">
                          {c.prazoLabel}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenModule(c.id, c.defaultModule)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 hover:border-amber-400 text-xs font-semibold text-amber-300 transition-colors whitespace-nowrap"
                        >
                          <span>Abrir Fluxo</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Histórico Recente do Modo Fórum */}
      <section className="rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              Documentos Recentes & Validação Humana
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono-tabular">
            {forumDocs.length} registro(s)
          </span>
        </div>

        <div className="divide-y divide-slate-800/70">
          {forumDocs.slice(0, 4).map((doc) => (
            <div
              key={doc.id}
              className="px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-900/45 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                  <FileCheck2
                    className={`w-4 h-4 shrink-0 ${
                      doc.status === 'validado'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  />
                  <span className="truncate">{doc.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {doc.assistido} ·{' '}
                  {doc.status === 'validado'
                    ? `Validado por ${doc.validatedBy} (${doc.validatedOab})`
                    : 'Aguardando revisão humana no Modo Fórum'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenForumDoc(doc)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
              >
                Abrir no Modo Fórum
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
