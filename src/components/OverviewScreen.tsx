import React from 'react';
import { CaseRecord, ForumDocument, WarModuleId } from '../types/lex';
import { ArrowRight } from 'lucide-react';

interface OverviewScreenProps {
  cases: CaseRecord[];
  forumDocs: ForumDocument[];
  whatsappCount: number;
  onJumpToWarModule: (moduleId: WarModuleId) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  cases,
  forumDocs,
  whatsappCount,
  onJumpToWarModule,
}) => {
  const validatedCount = forumDocs.filter((d) => d.status === 'validado').length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-amber-400">
          Visão Geral · Métricas & Jornada
        </p>
        <h2 className="font-display text-2xl font-bold text-white mt-0.5">
          Indicadores Estratégicos do Escritório
        </h2>
      </div>

      {/* KPIs Executivos em Faixa Única (2x2 no mobile, 4 colunas no desktop) */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-px">
        <div className="bg-[#0B111E] p-4 sm:p-5">
          <span className="text-[11px] sm:text-xs text-slate-400">
            Tempo Médio Preparo Custódia
          </span>
          <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-white mt-1.5">
            4m 20s
          </div>
          <span className="text-[11px] sm:text-xs text-emerald-400 mt-1 block">
            88% mais rápido
          </span>
        </div>

        <div className="bg-[#0B111E] p-4 sm:p-5">
          <span className="text-[11px] sm:text-xs text-slate-400">
            Taxa de Liberdade
          </span>
          <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-blue-400 mt-1.5">
            78,4%
          </div>
          <span className="text-[11px] sm:text-xs text-slate-400 mt-1 block">
            Núcleo Natal/RN
          </span>
        </div>

        <div className="bg-[#0B111E] p-4 sm:p-5">
          <span className="text-[11px] sm:text-xs text-slate-400">
            Casos & Peças Validadas
          </span>
          <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-amber-400 mt-1.5">
            {cases.length} / {validatedCount}
          </div>
          <span className="text-[11px] sm:text-xs text-slate-400 mt-1 block">
            Curadoria OAB
          </span>
        </div>

        <div className="bg-[#0B111E] p-4 sm:p-5">
          <span className="text-[11px] sm:text-xs text-slate-400">
            Mensagens Humanizadas
          </span>
          <div className="font-mono-tabular text-xl sm:text-2xl font-bold text-emerald-400 mt-1.5">
            {412 + whatsappCount}
          </div>
          <span className="text-[11px] sm:text-xs text-slate-400 mt-1 block">
            Atendimento famílias
          </span>
        </div>
      </div>

      {/* Jornada Ponta-a-Ponta */}
      <section className="rounded-2xl bg-[#0B111E] border border-slate-800 p-6 space-y-5">
        <div>
          <h3 className="text-base font-bold text-white">
            Jornada Ponta-a-Ponta da Defesa Criminal
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Selecione qualquer etapa abaixo para abrir diretamente o módulo correspondente na War Room.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              etapa: 'Etapa 01 · Hora Zero',
              title: 'Flagrante & Custódia',
              desc: 'Upload do APF no celular a caminho do Fórum. Roteiro de parlatório e árvore de sustentação prontos em 30 segundos.',
              color: 'text-red-400',
              mod: 'custodia' as WarModuleId,
            },
            {
              etapa: 'Etapa 02 · Instrução',
              title: 'Auditoria & AIJ',
              desc: 'Cruzamento de depoimentos policiais, cadeia de custódia e geração de Alegações Finais Orais ao vivo na sala.',
              color: 'text-amber-400',
              mod: 'aij' as WarModuleId,
            },
            {
              etapa: 'Etapa 03 · Tribunais',
              title: 'STJ / STF & Execução',
              desc: 'Blindagem contra Súmula 7/STJ, pré-questionamento automático e monitoramento de progressão/indulto.',
              color: 'text-blue-400',
              mod: 'tribunais' as WarModuleId,
            },
            {
              etapa: 'Etapa 04 · Relacionamento',
              title: 'Tradução Acolhedora',
              desc: 'Conversão instantânea de despachos complexos em mensagens claras e empáticas para familiares no WhatsApp.',
              color: 'text-emerald-400',
              mod: 'tradutor' as WarModuleId,
            },
          ].map((item) => (
            <button
              key={item.etapa}
              type="button"
              onClick={() => onJumpToWarModule(item.mod)}
              className="p-4 rounded-xl bg-[#060B14] border border-slate-800 hover:border-amber-500/40 text-left flex flex-col justify-between gap-3 transition-colors"
            >
              <div>
                <span className={`text-[11px] font-mono-tabular font-semibold ${item.color}`}>
                  {item.etapa}
                </span>
                <h4 className="font-bold text-white text-sm mt-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                <span>Abrir Módulo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
