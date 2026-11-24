import React, { useState } from 'react';
import { RbacRole, UserSession } from '../types/lex';
import { ROLE_META } from '../data/mockCases';
import {
  CheckCircle2,
  Lock,
  LogOut,
  Save,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface UserProfileScreenProps {
  session: UserSession;
  onUpdateSession: (next: UserSession) => void;
  onSwitchRole: (role: RbacRole) => void;
  onLogout: () => void;
  onNotify: (msg: string) => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  session,
  onUpdateSession,
  onSwitchRole,
  onLogout,
  onNotify,
}) => {
  const [name, setName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
  const [oab, setOab] = useState(session.oab);

  const meta = ROLE_META[session.role];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      onNotify('Preencha nome e e-mail profissional.');
      return;
    }
    onUpdateSession({
      ...session,
      name: name.trim(),
      email: email.trim(),
      oab: oab.trim().toUpperCase() || session.oab,
    });
    onNotify('Dados cadastrais do usuário atualizados');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className="text-xs font-medium text-amber-400">
          Sub-tela do Usuário · Conta & Controle de Alçada
        </p>
        <h2 className="font-display text-2xl font-bold text-white mt-0.5">
          Minha Conta & Permissões de Acesso
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário de Dados da Sessão */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-6 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Identidade Profissional</span>
            </h3>
            <span className="font-mono-tabular text-[11px] text-emerald-400">
              2FA Ativo
            </span>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">
              Nome Completo
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                Inscrição OAB / Registro
              </span>
              <input
                type="text"
                value={oab}
                onChange={(e) => setOab(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm font-mono-tabular text-white focus:outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">
                E-mail Institucional
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <div className="pt-2 grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#060B14] hover:bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Encerrar Sessão</span>
            </button>

            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>

        {/* Matriz de Permissões Ativas */}
        <div className="lg:col-span-6 rounded-2xl bg-[#0B111E] border border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Matriz de Permissões — {meta.shortLabel}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Recursos habilitados e bloqueios ativos para sua sessão.
            </p>
          </div>

          <div className="divide-y divide-slate-800/80">
            {meta.permissionMatrix.map((perm) => (
              <div key={perm.label} className="py-3 flex items-start gap-3">
                {perm.allowed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <div
                    className={`text-xs font-semibold ${
                      perm.allowed ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {perm.label}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {perm.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Troca Rápida de Perfil para Validação de Permissões */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-medium text-slate-400 block">
              Simular outro nível de permissão:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['escritorio', 'autonomo', 'estudante'] as RbacRole[]).map(
                (r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onSwitchRole(r)}
                    className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                      session.role === r
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                        : 'bg-[#060B14] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {ROLE_META[r].shortLabel}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
