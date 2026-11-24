import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Crosshair,
  GraduationCap,
  Landmark,
  Lock,
  MessageCircleHeart,
  Scale,
  ShieldCheck,
  Siren,
} from 'lucide-react';
import { RbacRole, WarModuleId } from '../types/lex';
import { ROLE_META } from '../data/mockCases';
import { HeroAnimation3D } from './HeroAnimation3D';

interface HomeScreenProps {
  hasActiveSession?: boolean;
  onOpenUserHome?: () => void;
  onGoLogin: (options?: {
    preselectedRole?: RbacRole;
    preselectedModule?: WarModuleId;
  }) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  hasActiveSession = false,
  onOpenUserHome,
  onGoLogin,
}) => {
  const roleCards: {
    role: RbacRole;
    icon: React.FC<{ className?: string }>;
    accent: string;
  }[] = [
    { role: 'escritorio', icon: Building2, accent: 'text-amber-400' },
    { role: 'autonomo', icon: Briefcase, accent: 'text-blue-400' },
    { role: 'estudante', icon: GraduationCap, accent: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#060B14] text-slate-100 flex flex-col justify-between">
      {/* Top Bar Contract: 3 zonas limpas, single-line */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#060B14]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-lg tracking-wider text-white">
              LEX<span className="text-amber-400">RAMON</span>
            </span>
          </a>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400"
          >
            <a
              href="#modulos-core"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Módulos
            </a>
            <a
              href="#perfis-acesso"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Perfis de Acesso
            </a>
            <a
              href="#jornada-defesa"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Jornada Penal
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                hasActiveSession && onOpenUserHome
                  ? onOpenUserHome()
                  : onGoLogin()
              }
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>
                {hasActiveSession ? 'Minha Homepage' : 'Entrar no Sistema'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero 3D Imersivo (Animação 3D Three.js ao vivo sem mapa interativo) */}
        <section className="relative overflow-hidden border-b border-slate-800/80 min-h-[560px] lg:min-h-[640px] flex items-center">
          <HeroAnimation3D />

          {/* Gradiente medido para contraste WCAG sobre o canvas 3D */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#060B14] via-[#060B14]/82 to-[#060B14]/35 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060B14] to-transparent pointer-events-none"
          />

          <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="max-w-2xl space-y-6">
              <p className="text-xs font-semibold tracking-wide text-amber-400">
                Protocolo Estreito de Defesa Criminal · Sigilo & Controle RBAC
              </p>

              <h1
                className="font-display text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                Automação estratégica para{' '}
                <span className="text-amber-400">Advocacia Criminal</span> de
                Alta Performance.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                Da leitura emergencial do APF na Central de Flagrantes às
                Alegações Finais Orais em AIJ e recursos no STJ/STF — com
                homepage dedicada e sub-telas adaptadas às permissões de cada
                perfil profissional.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    hasActiveSession && onOpenUserHome
                      ? onOpenUserHome()
                      : onGoLogin()
                  }
                  className="min-h-[48px] px-7 py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-blue-600/20"
                >
                  <span>
                    {hasActiveSession
                      ? 'Acessar Homepage do Usuário'
                      : 'Acessar Plataforma'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#perfis-acesso"
                  className="min-h-[48px] px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#0C1424]/95 hover:bg-[#131D33] text-slate-200 border border-slate-800 transition-colors whitespace-nowrap flex items-center justify-center"
                >
                  Ver Permissões por Perfil
                </a>
              </div>

              {/* Prova quantitativa contígua */}
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg text-xs">
                <div>
                  <div className="font-mono-tabular text-base sm:text-lg font-bold text-white">
                    4m 20s
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400">
                    Preparo Custódia
                  </div>
                </div>
                <div>
                  <div className="font-mono-tabular text-base sm:text-lg font-bold text-amber-400">
                    3 Perfis
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400">
                    Escopo RBAC
                  </div>
                </div>
                <div>
                  <div className="font-mono-tabular text-base sm:text-lg font-bold text-emerald-400">
                    100% E2E
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400">
                    Anti-Alucinação
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção: Perfis & Permissões de Acesso (RBAC) */}
        <section
          id="perfis-acesso"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8"
        >
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <p className="text-xs font-semibold text-amber-400">
                Controle de Acesso por Alçada Profissional
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                Cada usuário acessa sua própria Homepage e Sub-telas
              </h2>
              <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
                Selecione qualquer perfil abaixo para abrir a tela de login já
                configurada com as respectivas permissões operacionais.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {roleCards.map(({ role, icon: Icon, accent }) => {
                const meta = ROLE_META[role];
                return (
                  <div
                    key={role}
                    className="rounded-2xl border border-slate-800 bg-[#0B111E] p-6 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <Icon className={`w-5 h-5 ${accent}`} />
                        <span className="font-mono-tabular text-[11px] text-slate-400">
                          {meta.shortLabel}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white">
                          {meta.label}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          {meta.description}
                        </p>
                      </div>

                      <div className="divide-y divide-slate-800/80 border-t border-slate-800/80 text-xs">
                        {meta.permissionMatrix.slice(0, 4).map((perm) => (
                          <div
                            key={perm.label}
                            className="py-2.5 flex items-start gap-2"
                          >
                            {perm.allowed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                            )}
                            <span
                              className={
                                perm.allowed
                                  ? 'text-slate-200'
                                  : 'text-slate-500'
                              }
                            >
                              {perm.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onGoLogin({ preselectedRole: role })}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-100 flex items-center justify-between transition-colors"
                    >
                      <span>Entrar como {meta.shortLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Preview Operacional dos Módulos (Assimetria Limpa) */}
        <section
          id="modulos-core"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-[#0B111E] overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono-tabular text-slate-400">
                lexramon.app · war-room · comarca-natal-rn
              </span>
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Protocolo de Defesa Ativo · Sigilo E2E</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {/* Destaque Principal: Módulo 01 */}
              <button
                type="button"
                onClick={() => onGoLogin({ preselectedModule: 'custodia' })}
                className="md:col-span-5 p-6 text-left hover:bg-slate-900/50 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-400">
                    01. Urgência · Central de Flagrantes
                  </span>
                  <Siren className="w-4 h-4 text-red-400" />
                </div>
                <h2 className="font-display text-xl font-bold text-white">
                  Custódia em 30 Segundos
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Leitura rápida do APF, roteiro de perguntas com blindagem de
                  mérito, árvore dinâmica (Cenário A vs. B) e pedidos em cascata
                  (Arts. 318 e 319 CPP).
                </p>
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 pt-1">
                  <span>Abrir fluxo de custódia</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Módulos 02, 03 e 04 */}
              <div className="md:col-span-7 divide-y divide-slate-800">
                <button
                  type="button"
                  onClick={() => onGoLogin({ preselectedModule: 'aij' })}
                  className="w-full p-5 text-left hover:bg-slate-900/50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-amber-400">
                      02. Combate em Audiência
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      AIJ, Cadeia de Custódia & Alegações Orais
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Auditoria de contradições policiais (Art. 158-A CPP) e
                      memoriais orais instantâneos (Art. 403, §3º CPP).
                    </p>
                  </div>
                  <Crosshair className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                </button>

                <button
                  type="button"
                  onClick={() => onGoLogin({ preselectedModule: 'tribunais' })}
                  className="w-full p-5 text-left hover:bg-slate-900/50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-blue-400">
                      03. Tribunais Superiores & SEEU
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Filtro Anti-Súmula 7 STJ & Execução Penal
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Revaloração jurídica para REsp/HC e calculadora de frações
                      do Art. 112 da LEP (16% a 70%) com análise de indulto.
                    </p>
                  </div>
                  <Landmark className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
                </button>

                <button
                  type="button"
                  onClick={() => onGoLogin({ preselectedModule: 'tradutor' })}
                  className="w-full p-5 text-left hover:bg-slate-900/50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-emerald-400">
                      04. Relacionamento & Sala de Audiência
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Tradutor WhatsApp & Modo Fórum
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Tradução acolhedora para familiares e teleprompter de alto
                      contraste com validação OAB obrigatória.
                    </p>
                  </div>
                  <MessageCircleHeart className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Jornada Ponta-a-Ponta */}
        <section
          id="jornada-defesa"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20"
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Jornada Ponta-a-Ponta da Defesa Criminal
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Da lavratura do flagrante à sustentação nos tribunais
                superiores sem fricção cognitiva.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0B111E] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
              <div className="p-5 space-y-1.5">
                <span className="font-mono-tabular text-xs font-semibold text-red-400">
                  01 · Hora Zero
                </span>
                <h3 className="text-sm font-bold text-white">
                  Flagrante & Custódia
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload do APF no celular a caminho do Fórum e roteiro pronto em
                  30 segundos.
                </p>
              </div>
              <div className="p-5 space-y-1.5">
                <span className="font-mono-tabular text-xs font-semibold text-amber-400">
                  02 · Instrução
                </span>
                <h3 className="text-sm font-bold text-white">
                  Auditoria & AIJ
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cruzamento de contradições policiais e geração de Memoriais
                  Orais ao vivo.
                </p>
              </div>
              <div className="p-5 space-y-1.5">
                <span className="font-mono-tabular text-xs font-semibold text-blue-400">
                  03 · Tribunais
                </span>
                <h3 className="text-sm font-bold text-white">
                  STJ / STF & SEEU
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Blindagem contra Súmula 7/STJ e cálculo de progressão de
                  regime e indulto.
                </p>
              </div>
              <div className="p-5 space-y-1.5">
                <span className="font-mono-tabular text-xs font-semibold text-emerald-400">
                  04 · Entrega
                </span>
                <h3 className="text-sm font-bold text-white">
                  Modo Fórum & Família
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sustentação em teleprompter escuro e atualização clara para a
                  família.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        LexRamon · Ecossistema Inteligente de Advocacia Criminal · Sigilo
        Profissional & LGPD Criminal
      </footer>
    </div>
  );
};
