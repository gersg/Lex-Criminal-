import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crosshair,
  ExternalLink,
  Landmark,
  Lock,
  MessageCircle,
  MessageCircleHeart,
  Scale,
  ShieldCheck,
  Siren,
  Sparkles,
  X,
} from 'lucide-react';
import { RbacRole, WarModuleId } from '../types/lex';
import { ROLE_META } from '../data/mockCases';
import { HeroAnimation3D } from './HeroAnimation3D';

interface CarouselSlide {
  id: string;
  step: string;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  accentText: string;
  accentBorder: string;
  ctaLabel: string;
  targetModule: WarModuleId;
}

const PRESENTATION_SLIDES: CarouselSlide[] = [
  {
    id: 'slide-dossie',
    step: '01 / 05',
    badge: 'Pilar 01 · Ingestão Multimodal',
    title: 'Ingestão Multimodal & Dossiê Vivo',
    description:
      'Centralize PDFs com OCR, áudios de parlatório e entrevistas familiares com linha do tempo probatória, detector automático de contradições e alerta Art. 318 CPP.',
    highlights: [
      'Ficha criminal viva e compartilhada (Dr. Ramon & Dra. Jéssica)',
      'Transcrição fiel de áudios e leitura de PDFs com OCR',
      'Gatilho automático de Prisão Domiciliar (Art. 318 CPP)',
    ],
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/35',
    ctaLabel: 'Acessar Dossiê Vivo',
    targetModule: 'custodia',
  },
  {
    id: 'slide-custodia',
    step: '02 / 05',
    badge: 'Pilar 02 · Central de Flagrantes',
    title: 'Custódia em 30s (Central de Flagrantes)',
    description:
      'Leitura imediata do APF, roteiro de perguntas com blindagem de mérito, árvore dinâmica (Cenário A vs. B) e pedidos em cascata com Tema 280 STF e HC 598.051 STJ.',
    highlights: [
      'Identificação imediata de ingresso domiciliar ilegal',
      'Estratégia bifurcada conforme manifestação do MP',
      'Pedidos em cascata: Relaxamento, Liberdade e Art. 318 CPP',
    ],
    accentText: 'text-red-400',
    accentBorder: 'border-red-500/35',
    ctaLabel: 'Explorar Custódia em 30s',
    targetModule: 'custodia',
  },
  {
    id: 'slide-aij',
    step: '03 / 05',
    badge: 'Pilar 03 · 13ª Vara Criminal & AIJ',
    title: 'Instrução Criminal & Alegações Orais (13ª Vara Criminal)',
    description:
      'Confronto paralelo entre narrativa policial e prova judicial, auditoria de cadeia de custódia (Art. 158-A CPP), reconhecimento (Art. 226 CPP) e Agente Doutor LEX.',
    highlights: [
      'Linha do tempo em duas trilhas (Policial vs. Judicial)',
      'Agente Doutor LEX ancorado nos áudios e PDFs do caso',
      'Memoriais e Alegações Finais Orais (Art. 403, §3º CPP)',
    ],
    accentText: 'text-blue-400',
    accentBorder: 'border-blue-500/35',
    ctaLabel: 'Abrir Instrução & Doutor LEX',
    targetModule: 'aij',
  },
  {
    id: 'slide-tribunais',
    step: '04 / 05',
    badge: 'Pilar 04 · Tribunais Superiores',
    title: 'Tribunais Superiores (STJ / STF & ORCRIM)',
    description:
      'Filtro rigoroso Anti-Súmula 7/STJ para REsp e Habeas Corpus em casos da Lei 12.850/13 e Lei de Drogas, além de calculadora completa do SEEU (Art. 112 LEP).',
    highlights: [
      'Revaloração jurídica livre de reexame fático (Súmula 7)',
      'Teses de atipicidade e quebra de cadeia digital (ORCRIM)',
      'Cálculo SEEU Art. 112 LEP (16% a 70%) com detração/remição',
    ],
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/35',
    ctaLabel: 'Acessar STJ / STF & SEEU',
    targetModule: 'tribunais',
  },
  {
    id: 'slide-forum',
    step: '05 / 05',
    badge: 'Pilar 05 · Sala de Audiência',
    title: 'Modo Fórum & Certificação SHA-256',
    description:
      'Kit estático de alto contraste para leitura em mesa de audiência (sem teleprompter), com resumo humanizado para família e exportação com Hash SHA-256 e selo ICP-Brasil/OAB.',
    highlights: [
      'Modo Fórum estático com A-/A+ e checklist de quesitos',
      'Resumo acolhedor para envio no WhatsApp da família',
      'Papel timbrado Ramon Ribeiro & Jéssica com Hash SHA-256',
    ],
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/35',
    ctaLabel: 'Conhecer Modo Fórum & Exportação',
    targetModule: 'tradutor',
  },
];

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
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [waRegion, setWaRegion] = useState<'RN' | 'CE'>('RN');
  const [waUrgency, setWaUrgency] = useState<
    | 'Flagrante'
    | 'Audiência de Custódia'
    | 'Acompanhamento em Delegacia'
    | 'Habeas Corpus'
  >('Flagrante');
  const [waDetails, setWaDetails] = useState('');
  const [waCopied, setWaCopied] = useState(false);

  useEffect(() => {
    if (carouselPaused) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % PRESENTATION_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [carouselPaused]);

  const roleCards: {
    role: RbacRole;
    icon: React.FC<{ className?: string }>;
    accent: string;
    displayTitle: string;
  }[] = [
    {
      role: 'escritorio',
      icon: Building2,
      accent: 'text-amber-400',
      displayTitle: 'Dr. Ramon Ribeiro · Sócio Fundador',
    },
    {
      role: 'autonomo',
      icon: Briefcase,
      accent: 'text-blue-400',
      displayTitle: 'Dra. Jéssica · Sócia RN & CE',
    },
  ];

  const whatsappMessage = `Olá, Plantão Criminal LexRamon (${
    waRegion === 'RN' ? 'Natal/RN · TJRN' : 'Fortaleza/CE · TJCE'
  }). Solicito atendimento urgente para: ${waUrgency}.${
    waDetails.trim() ? ` Resumo: ${waDetails.trim()}` : ''
  }`;
  const whatsappHref = `https://wa.me/5584999990000?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const handleCopyWhatsapp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setWaCopied(true);
      window.setTimeout(() => setWaCopied(false), 2000);
    } catch {}
  };

  const slide = PRESENTATION_SLIDES[activeSlide];

  return (
    <div className="min-h-screen w-full bg-[#060B14] text-slate-100 flex flex-col justify-between">
      {/* Top Bar Contract: 3 zonas limpas, single-line */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#060B14]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-display font-extrabold text-sm tracking-wider shrink-0">
              LR
            </div>
            <div className="leading-tight">
              <span className="font-display font-bold text-base sm:text-lg tracking-wider text-white block">
                LEX<span className="text-amber-400">RAMON</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400">
                Dr. Ramon Ribeiro &amp; Dra. Jéssica
              </span>
            </div>
          </a>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400"
          >
            <a
              href="#apresentacao-carrossel"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Apresentação
            </a>
            <a
              href="#perfis-acesso"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Ramon & Jéssica
            </a>
            <a
              href="#modulos-core"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Módulos
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setWhatsappOpen(true)}
              className="min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">WhatsApp 24h</span>
            </button>

            <button
              type="button"
              onClick={() =>
                hasActiveSession && onOpenUserHome
                  ? onOpenUserHome()
                  : onGoLogin()
              }
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {hasActiveSession ? 'Minha Homepage' : 'Acesso Restrito'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero 3D Imersivo (Animação 3D Three.js ao vivo) */}
        <section className="relative overflow-hidden border-b border-slate-800/80 min-h-[540px] lg:min-h-[620px] flex items-center">
          <HeroAnimation3D />

          {/* Gradiente medido para contraste WCAG sobre o canvas 3D */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#060B14] via-[#060B14]/84 to-[#060B14]/35 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060B14] to-transparent pointer-events-none"
          />

          <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-14 lg:py-22">
            <div className="max-w-2xl space-y-6">
              <p className="text-xs font-semibold tracking-wide text-amber-400">
                Exclusivo · Dr. Ramon Ribeiro &amp; Dra. Jéssica · RN &amp; CE (TJRN · TJCE)
              </p>

              <h1
                className="font-display text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                Inteligência Forense{' '}
                <span className="text-amber-400">e Defesa Criminal</span> de
                Alta Performance.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                Do flagrante no Núcleo de Garantias às sustentações no STJ e
                STF. Dossiê Vivo caso a caso, leitura multimodal de áudios e
                documentos, linha do tempo com detector de contradições e
                Agente Doutor LEX para atuação no RN e CE.
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

                <button
                  type="button"
                  onClick={() => setWhatsappOpen(true)}
                  className="min-h-[48px] px-6 py-3.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Plantão WhatsApp 24h</span>
                </button>
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
                    RN · CE
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400">
                    TJRN, TJCE & STJ
                  </div>
                </div>
                <div>
                  <div className="font-mono-tabular text-base sm:text-lg font-bold text-emerald-400">
                    Agente IA
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400">
                    Extravagantes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Carrossel de Apresentação Interativo */}
        <section
          id="apresentacao-carrossel"
          onMouseEnter={() => setCarouselPaused(true)}
          onMouseLeave={() => setCarouselPaused(false)}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-6"
        >
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apresentação Guiada da Plataforma</span>
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                  Conheça o Fluxo Estratégico LexRamon
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide(
                      (prev) =>
                        (prev - 1 + PRESENTATION_SLIDES.length) %
                        PRESENTATION_SLIDES.length
                    )
                  }
                  aria-label="Slide anterior"
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-[#0B111E] hover:bg-[#131D33] border border-slate-800 flex items-center justify-center text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono-tabular text-xs text-slate-400 px-2">
                  {slide.step}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide(
                      (prev) => (prev + 1) % PRESENTATION_SLIDES.length
                    )
                  }
                  aria-label="Próximo slide"
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-[#0B111E] hover:bg-[#131D33] border border-slate-800 flex items-center justify-center text-slate-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className={`rounded-2xl border ${slide.accentBorder} bg-[#0B111E] p-6 sm:p-8 transition-all duration-300`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <span
                    className={`inline-block font-mono-tabular text-xs font-semibold ${slide.accentText}`}
                  >
                    {slide.badge}
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white leading-snug">
                    {slide.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {slide.description}
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        onGoLogin({ preselectedModule: slide.targetModule })
                      }
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                      <span>{slide.ctaLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setWhatsappOpen(true)}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Falar com Plantão</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-xl bg-[#060B14] border border-slate-800 p-4 sm:p-5 space-y-3">
                  <span className="text-[11px] font-mono-tabular text-slate-400 block">
                    Pilares Operacionais da Etapa
                  </span>
                  <ul className="space-y-2.5">
                    {slide.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200"
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${slide.accentText}`}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Indicadores de Slide */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PRESENTATION_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`min-h-[40px] px-3 py-2 rounded-xl text-left text-xs transition-colors border ${
                      idx === activeSlide
                        ? 'bg-[#101829] border-amber-500/50 text-white font-semibold'
                        : 'bg-[#060B14] border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-mono-tabular text-[10px] text-amber-400 block">
                      {s.step}
                    </span>
                    <span className="truncate block">{s.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Faixa dos 4 Pilares Arquitetura LexRamon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="rounded-2xl bg-[#0B111E] border border-amber-500/30 p-4 space-y-1.5">
                <span className="font-mono-tabular text-[11px] font-semibold text-amber-400 block">
                  Dossiê Vivo Caso a Caso
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Histórico unificado desde o APF na delegacia até recursos no
                  STJ e STF.
                </p>
              </div>
              <div className="rounded-2xl bg-[#0B111E] border border-red-500/30 p-4 space-y-1.5">
                <span className="font-mono-tabular text-[11px] font-semibold text-red-400 block">
                  Linha do Tempo Forense
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cruzamento automático entre fatos policiais e judiciais com
                  alerta de contradições.
                </p>
              </div>
              <div className="rounded-2xl bg-[#0B111E] border border-blue-500/30 p-4 space-y-1.5">
                <span className="font-mono-tabular text-[11px] font-semibold text-blue-400 block">
                  Agente Doutor LEX
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Especialista em Direito Penal, Leis Extravagantes e
                  jurisprudência TJRN/TJCE/STJ.
                </p>
              </div>
              <div className="rounded-2xl bg-[#0B111E] border border-emerald-500/30 p-4 space-y-1.5">
                <span className="font-mono-tabular text-[11px] font-semibold text-emerald-400 block">
                  Autenticação SHA-256
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Documentos exportados com timbre Ramon Ribeiro &amp; Jéssica,
                  carimbo e hash único.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção: Acesso Exclusivo dos Sócios (Dr. Ramon Ribeiro & Dra. Jéssica) */}
        <section
          id="perfis-acesso"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8"
        >
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <p className="text-xs font-semibold text-amber-400">
                Portal Interno Exclusivo dos Sócios
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                Acesso Direto · Dr. Ramon Ribeiro &amp; Dra. Jéssica
              </h2>
              <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
                Dossiês Vivos, anotações internas e responsabilidades sincronizadas
                em tempo real para atuação na Central de Flagrantes, 13ª Vara
                Criminal de Natal/RN, TJCE, STJ e STF.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {roleCards.map(({ role, icon: Icon, accent, displayTitle }) => {
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
                          {meta.defaultUser.oab}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white">
                          {displayTitle}
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
                      <span>Entrar como {meta.defaultUser.name.split(' ').slice(0, 2).join(' ')}</span>
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
                      Tradução acolhedora para familiares e modo leitura estática
                      de audiência com validação OAB obrigatória.
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
                  Kit estático de audiência e atualização clara para a família.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        LexRamon · Advocacia Criminal RN & CE (TJRN · TJCE) · Sigilo
        Profissional & LGPD Criminal
      </footer>

      {/* Modal CTA WhatsApp Plantão 24h (Sem window.open) */}
      {whatsappOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Atendimento Plantão WhatsApp 24h"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0B111E] border border-emerald-500/40 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Plantão Criminal WhatsApp 24h
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Equipe Dr. Ramon & Dra. Jéssica · RN & CE
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappOpen(false)}
                aria-label="Fechar janela do WhatsApp"
                className="min-h-[40px] min-w-[40px] rounded-xl text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(['RN', 'CE'] as const).map((uf) => (
                  <button
                    key={uf}
                    type="button"
                    onClick={() => setWaRegion(uf)}
                    className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      waRegion === uf
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-[#060B14] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {uf === 'RN' ? 'Rio Grande do Norte (TJRN)' : 'Ceará (TJCE)'}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-300 block">
                  Natureza da Urgência
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      'Flagrante',
                      'Audiência de Custódia',
                      'Acompanhamento em Delegacia',
                      'Habeas Corpus',
                    ] as const
                  ).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setWaUrgency(u)}
                      className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                        waUrgency === u
                          ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                          : 'bg-[#060B14] border-slate-800 text-slate-400'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-300">
                  Resumo breve (opcional)
                </span>
                <textarea
                  rows={2}
                  value={waDetails}
                  onChange={(e) => setWaDetails(e.target.value)}
                  placeholder="Ex.: Prisão agora em Natal/Fortaleza, audiência de custódia amanhã..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </label>

              <div className="p-3 rounded-xl bg-[#060B14] border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {whatsappMessage}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyWhatsapp}
                  className="sm:col-span-5 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                >
                  {waCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mensagem copiada</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar texto</span>
                    </>
                  )}
                </button>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:col-span-7 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Iniciar Atendimento no WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
