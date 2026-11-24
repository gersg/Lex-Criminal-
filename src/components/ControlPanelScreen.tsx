import React, { useMemo, useState } from 'react';
import {
  CaseRecord,
  ControlPanelSubTab,
  GovernanceConfig,
  RbacRole,
  TeamMember,
  UserSession,
  WarModuleId,
} from '../types/lex';
import { ROLE_META } from '../data/mockCases';
import {
  ArrowUpRight,
  Check,
  ListChecks,
  Lock,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Users,
} from 'lucide-react';

interface ControlPanelScreenProps {
  session: UserSession;
  cases: CaseRecord[];
  teamMembers: TeamMember[];
  governance: GovernanceConfig;
  activeSubTab: ControlPanelSubTab;
  onChangeSubTab: (tab: ControlPanelSubTab) => void;
  onUpdateGovernance: (next: GovernanceConfig) => void;
  onAssignCase: (caseId: string, assigneeName: string) => void;
  onUpdateTeamMember: (
    memberId: string,
    patch: Partial<Pick<TeamMember, 'role' | 'active'>>
  ) => void;
  onOpenWarRoom: (caseId: string, moduleId: WarModuleId) => void;
  onOpenNewClient: () => void;
  onNotify: (msg: string) => void;
}

export const ControlPanelScreen: React.FC<ControlPanelScreenProps> = ({
  session,
  cases,
  teamMembers,
  governance,
  activeSubTab,
  onChangeSubTab,
  onUpdateGovernance,
  onAssignCase,
  onUpdateTeamMember,
  onOpenWarRoom,
  onOpenNewClient,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const perms = ROLE_META[session.role].permissions;
  const canEditGov = perms.canEditGovernance;
  const canManageTeam = perms.canManageTeam;

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter(
      (c) =>
        c.assistido.toLowerCase().includes(q) ||
        c.processo.toLowerCase().includes(q) ||
        c.varaComarca.toLowerCase().includes(q)
    );
  }, [cases, search]);

  const effectiveSubTab: ControlPanelSubTab =
    activeSubTab === 'equipe' && !canManageTeam ? 'governanca' : activeSubTab;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-amber-400">
            Painel de Controle · Sub-telas Administrativas
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
            Governança, Fila de Processos e Alçadas
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenNewClient}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Assistido (APF)</span>
        </button>
      </div>

      {/* Navegação por Sub-telas do Painel de Controle */}
      <div className="flex sm:inline-flex overflow-x-auto no-scrollbar p-1 rounded-xl bg-[#0B111E] border border-slate-800 gap-1">
        <button
          type="button"
          onClick={() => onChangeSubTab('governanca')}
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
            effectiveSubTab === 'governanca'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Governança da IA</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('processos')}
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
            effectiveSubTab === 'processos'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>Fila de Processos ({cases.length})</span>
        </button>

        <button
          type="button"
          disabled={!canManageTeam}
          onClick={() => onChangeSubTab('equipe')}
          className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
            !canManageTeam
              ? 'text-slate-600 cursor-not-allowed'
              : effectiveSubTab === 'equipe'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
          title={
            canManageTeam
              ? 'Gerenciar equipe e permissões RBAC'
              : 'Exclusivo do perfil Escritório Criminal'
          }
        >
          {canManageTeam ? (
            <Users className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
          <span>Equipe & Permissões RBAC</span>
        </button>
      </div>

      {/* SUB-TELA 1: GOVERNANÇA & REGRAS CONTEXTUAIS */}
      {effectiveSubTab === 'governanca' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Governança & Regras Contextuais da Defesa
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Estes parâmetros ajustam automaticamente os vocativos e teses
                  gerados na War Room.
                </p>
              </div>
              <span className="text-xs font-mono-tabular text-emerald-400">
                {canEditGov ? 'Sincronizado' : 'Somente Leitura'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-slate-300 font-medium">
                  Vocativo Padrão de Sustentação
                </span>
                <input
                  type="text"
                  disabled={!canEditGov}
                  value={governance.vocativoPadrao}
                  onChange={(e) =>
                    onUpdateGovernance({
                      ...governance,
                      vocativoPadrao: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-slate-100 disabled:opacity-60 focus:outline-none focus:border-blue-500"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-slate-300 font-medium">
                  Postura Combativa
                </span>
                <select
                  disabled={!canEditGov}
                  value={governance.posturaCombativa}
                  onChange={(e) =>
                    onUpdateGovernance({
                      ...governance,
                      posturaCombativa: e.target
                        .value as GovernanceConfig['posturaCombativa'],
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-slate-100 disabled:opacity-60"
                >
                  <option value="garantista">
                    Garantista Estrito (Nulidades + Mérito)
                  </option>
                  <option value="pragmatico">
                    Pragmático / Acordo ANPP & Cautelares
                  </option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-slate-300 font-medium">
                  Comarca Padrão
                </span>
                <input
                  type="text"
                  disabled={!canEditGov}
                  value={governance.comarcaPadrao}
                  onChange={(e) =>
                    onUpdateGovernance({
                      ...governance,
                      comarcaPadrao: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-slate-100 disabled:opacity-60"
                />
              </label>
            </div>
          </div>

          <div className="lg:col-span-4 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Protocolos de Segurança Ativos</span>
            </h3>

            <div className="divide-y divide-slate-800/80 text-xs">
              {[
                {
                  key: 'bloqueioAlucinacao' as const,
                  label:
                    'Bloqueio de jurisprudência inventada (exige Tema/Súmula real).',
                },
                {
                  key: 'protecaoSilencio' as const,
                  label:
                    'Proteção ao direito ao silêncio no roteiro de custódia.',
                },
                {
                  key: 'anonimizacaoLgpd' as const,
                  label:
                    'Anonimização de CPF/RG e isolamento zero-retention LGPD.',
                },
              ].map((item) => {
                const active = governance[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={!canEditGov}
                    onClick={() => {
                      onUpdateGovernance({
                        ...governance,
                        [item.key]: !active,
                      });
                      onNotify('Protocolo de governança atualizado');
                    }}
                    className="w-full py-3 flex items-start gap-2.5 text-left disabled:opacity-60"
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                    <span className="text-slate-300 leading-snug">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TELA 2: FILA DE PROCESSOS & DELEGAÇÃO */}
      {effectiveSubTab === 'processos' && (
        <section className="rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">
              Operações em Andamento e Delegação
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar caso ou juízo..."
                className="w-full min-h-[44px] pl-8 pr-3 py-2 rounded-lg bg-[#060B14] border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4 sm:px-5">Caso / Assistido</th>
                  <th className="py-3 px-4">Módulo</th>
                  <th className="py-3 px-4 hidden md:table-cell">Juízo</th>
                  {canManageTeam && (
                    <th className="py-3 px-4 hidden lg:table-cell">
                      Responsável
                    </th>
                  )}
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredCases.map((c) => {
                  const modLabel =
                    c.defaultModule === 'custodia'
                      ? 'Custódia'
                      : c.defaultModule === 'aij'
                      ? 'AIJ'
                      : c.defaultModule === 'tribunais'
                      ? 'STJ / SEEU'
                      : 'WhatsApp';

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="font-semibold text-white">
                          {c.assistido}
                        </div>
                        <div className="font-mono-tabular text-[11px] text-slate-400">
                          {c.processo}
                        </div>
                        <div className="text-[11px] text-slate-500 md:hidden mt-0.5">
                          {c.varaComarca}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-amber-400 font-medium whitespace-nowrap">
                        {modLabel}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 hidden md:table-cell">
                        {c.varaComarca}
                      </td>
                      {canManageTeam && (
                        <td className="py-3.5 px-4 hidden lg:table-cell">
                          <select
                            value={c.assignedTo ?? teamMembers[0]?.name ?? ''}
                            onChange={(e) =>
                              onAssignCase(c.id, e.target.value)
                            }
                            className="min-h-[38px] px-2.5 py-1 rounded-lg bg-[#060B14] border border-slate-800 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            {teamMembers.map((m) => (
                              <option key={m.id} value={m.name}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-medium">{c.proximoAto}</span>
                        <span className="block font-mono-tabular text-[11px] text-slate-400">
                          {c.prazoLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenWarRoom(c.id, c.defaultModule)}
                          className="min-h-[40px] px-2.5 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold whitespace-nowrap"
                        >
                          <span>War Room</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SUB-TELA 3: EQUIPE & PERMISSÕES RBAC (Exclusivo Escritório) */}
      {effectiveSubTab === 'equipe' && canManageTeam && (
        <section className="rounded-2xl bg-[#0B111E] border border-slate-800 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Gestão de Equipe & Alçadas de Acesso (RBAC)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina o perfil de permissão e status operacional de cada membro
                do escritório.
              </p>
            </div>
            <span className="font-mono-tabular text-xs text-emerald-400">
              {teamMembers.filter((m) => m.active).length} ativos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4 sm:px-5">Profissional</th>
                  <th className="py-3 px-4 hidden md:table-cell">Área</th>
                  <th className="py-3 px-4">Alçada RBAC</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {teamMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-5">
                      <div className="font-semibold text-white">
                        {member.name}
                      </div>
                      <div className="font-mono-tabular text-[11px] text-slate-400">
                        {member.oab} · {member.email}
                      </div>
                      <div className="text-[11px] text-slate-500 md:hidden mt-0.5">
                        {member.specialty}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 hidden md:table-cell">
                      {member.specialty}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          onUpdateTeamMember(member.id, {
                            role: e.target.value as RbacRole,
                          })
                        }
                        className="min-h-[40px] px-2.5 py-1.5 rounded-lg bg-[#060B14] border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="escritorio">
                          Escritório (Full Ops)
                        </option>
                        <option value="autonomo">Advogado(a) OAB</option>
                        <option value="estudante">
                          Estudante / Estagiário
                        </option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTeamMember(member.id, {
                            active: !member.active,
                          })
                        }
                        className={`min-h-[40px] px-3 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                          member.active
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {member.active ? 'Ativo' : 'Suspenso'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
