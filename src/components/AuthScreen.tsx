import React, { useState } from 'react';
import { RbacRole, UserSession } from '../types/lex';
import { ROLE_META } from '../data/mockCases';
import { ArrowRight, Box, KeyRound, Lock, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onAuthenticate: (session: UserSession) => void;
  onOpen3DPreview: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticate,
  onOpen3DPreview,
}) => {
  const [name, setName] = useState('Dr. Ramon Medeiros');
  const [oab, setOab] = useState('OAB/RN 14.820');
  const [mfaCode, setMfaCode] = useState('482910');
  const [role, setRole] = useState<RbacRole>('socio');
  const [lgpdAccepted, setLgpdAccepted] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !oab.trim()) {
      setErrorMsg('Informe o nome completo e a inscrição OAB.');
      return;
    }
    if (mfaCode.trim().length < 6) {
      setErrorMsg('Informe o token de verificação OAB com 6 dígitos.');
      return;
    }
    if (!lgpdAccepted) {
      setErrorMsg('Confirme a política de sigilo profissional e LGPD Criminal.');
      return;
    }
    setErrorMsg(null);
    onAuthenticate({
      name: name.trim(),
      oab: oab.trim().toUpperCase(),
      role,
      lgpdAccepted,
      authenticatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#070B14] text-slate-100 flex flex-col justify-between px-4 py-6 sm:px-8">
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-display font-extrabold text-sm shrink-0">
            LR
          </div>
          <span className="font-display font-bold text-lg tracking-wider text-amber-400 whitespace-nowrap">
            LEXRAMON
          </span>
        </div>

        <button
          type="button"
          onClick={onOpen3DPreview}
          className="px-4 py-2 rounded-xl bg-[#0B111E] border border-slate-800 hover:border-amber-500/45 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Box className="w-3.5 h-3.5 text-amber-400" />
          <span>Explorar Arquitetura 3D</span>
        </button>
      </header>

      {/* Main Centered Split */}
      <main className="max-w-5xl w-full mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left: Authoritative Context */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wide text-amber-400">
              Advocacia Criminal de Alta Performance · Sigilo E2E
            </p>
            <h1
              className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Acesso Seguro ao Núcleo Jurídico LexRamon
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
              Ambiente fechado com controle de permissões por inscrição OAB. Autos de prisão em flagrante, quebras de sigilo e teses defensivas permanecem isolados e nunca alimentam modelos públicos.
            </p>
          </div>

          <div className="divide-y divide-slate-800/80 border-t border-b border-slate-800/80">
            <div className="py-3.5 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h2 className="text-xs font-semibold text-slate-100">
                  Isolamento Zero-Retention & LGPD Criminal
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dados sensíveis de assistidos e peças criminais processados em sessão criptografada.
                </p>
              </div>
            </div>
            <div className="py-3.5 flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h2 className="text-xs font-semibold text-slate-100">
                  Governança RBAC (Sócio · Advogado · Estagiário)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Apenas advogados habilitados validam e assinam manifestações no Modo Fórum.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Authentication Form */}
        <div className="lg:col-span-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-[#0B111E] border border-slate-800 p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Autenticação Profissional
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecione o perfil RBAC para iniciar a sessão
                </p>
              </div>
              <KeyRound className="w-5 h-5 text-amber-400 shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-300">
                  Nome do Profissional
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="Dr(a). Nome Completo"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-300">
                  Inscrição OAB / UF
                </span>
                <input
                  type="text"
                  value={oab}
                  onChange={(e) => setOab(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono-tabular text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="OAB/RN 00.000"
                />
              </label>
            </div>

            {/* RBAC Profile Selector */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-300 block">
                Nível de Acesso (RBAC)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['socio', 'advogado', 'estagiario'] as RbacRole[]).map((r) => {
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                        active
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/40'
                      }`}
                    >
                      {ROLE_META[r].shortLabel}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
                {ROLE_META[role].description}
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Token MFA (6 dígitos)
              </span>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono-tabular tracking-widest text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="000000"
              />
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={lgpdAccepted}
                onChange={(e) => setLgpdAccepted(e.target.checked)}
                className="mt-0.5 accent-amber-500 rounded"
              />
              <span className="text-xs text-slate-400 leading-snug">
                Confirmo o termo de sigilo profissional (Art. 7º, II do Estatuto da OAB) e política de isolamento LGPD Criminal.
              </span>
            </label>

            {errorMsg && (
              <div
                role="alert"
                className="px-3.5 py-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200"
              >
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 transition-colors"
            >
              <span>Acessar Painel Executivo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-4 border-t border-slate-900">
        <span>LexRamon · Advocacia Criminal de Alta Performance</span>
        <span>Sigilo Profissional & Criptografia Ponta a Ponta</span>
      </footer>
    </div>
  );
};
