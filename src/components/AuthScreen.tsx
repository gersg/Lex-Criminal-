import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RbacRole, UserSession } from '../types/lex';
import { ROLE_META } from '../data/mockCases';
import {
  buildInitialDemoAccounts,
  DEMO_ACCESS_KEY_HINT,
  evaluatePasswordStrength,
  generateSaltHex,
  generateSixDigitOtp,
  hashPasswordSha256,
  isValidEmail,
  maskEmailForDisplay,
  normalizeIdentifier,
  normalizeOabKey,
  StoredAccountRecord,
} from '../utils/authHelpers';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  MailCheck,
  RefreshCw,
  Scale,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

type AuthMode = 'login' | 'register' | 'recovery';
type LoginStep = 'credentials' | 'two-factor';
type RecoveryStep = 'request' | 'verify-reset' | 'done';

const ACCOUNTS_STORAGE_KEY = 'lexramon_accounts_v2';

interface AuthScreenProps {
  initialRole?: RbacRole;
  onAuthenticate: (session: UserSession) => void;
  onBackHome: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialRole = 'escritorio',
  onAuthenticate,
  onBackHome,
}) => {
  // Contas registradas (armazenando apenas hash SHA-256 + salt, nunca senha em texto puro)
  const [accounts, setAccounts] = useState<StoredAccountRecord[]>([]);
  const [accountsReady, setAccountsReady] = useState(false);

  // Estado principal do fluxo
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<RbacRole>(initialRole);
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('request');

  // Campos de Login
  const [loginIdentifier, setLoginIdentifier] = useState(
    ROLE_META[initialRole].defaultUser.email
  );
  const [loginPassword, setLoginPassword] = useState(DEMO_ACCESS_KEY_HINT);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [lgpdAccepted, setLgpdAccepted] = useState(true);

  // Campos de Cadastro (Criar Conta)
  const [regName, setRegName] = useState('');
  const [regOab, setRegOab] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regComarca, setRegComarca] = useState('Comarca de Natal/RN');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLgpdAccepted, setRegLgpdAccepted] = useState(true);

  // Estado 2FA (Login & Ativação de Conta)
  const [pendingAccount, setPendingAccount] =
    useState<StoredAccountRecord | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const [expectedOtp, setExpectedOtp] = useState<string>(() =>
    generateSixDigitOtp()
  );
  const [resendSeconds, setResendSeconds] = useState<number>(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Campos de Recuperação de Senha
  const [recIdentifier, setRecIdentifier] = useState('');
  const [recTargetAccount, setRecTargetAccount] =
    useState<StoredAccountRecord | null>(null);
  const [recOtpDigits, setRecOtpDigits] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const [recExpectedOtp, setRecExpectedOtp] = useState<string>('');
  const [recNewPassword, setRecNewPassword] = useState('');
  const [recConfirmPassword, setRecConfirmPassword] = useState('');
  const [showRecPassword, setShowRecPassword] = useState(false);

  // Feedback e Processamento
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Inicializa contas padrão + contas salvas pelo usuário
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const demoAccounts = await buildInitialDemoAccounts();
      let savedAccounts: StoredAccountRecord[] = [];
      try {
        const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            savedAccounts = parsed as StoredAccountRecord[];
          }
        }
      } catch {
        savedAccounts = [];
      }

      const merged = [...savedAccounts];
      for (const demo of demoAccounts) {
        if (!merged.some((a) => a.id === demo.id)) {
          merged.push(demo);
        }
      }

      if (!cancelled) {
        setAccounts(merged);
        setAccountsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sincroniza quando initialRole muda externamente
  useEffect(() => {
    setSelectedRole(initialRole);
    setLoginIdentifier(ROLE_META[initialRole].defaultUser.email);
    setLoginPassword(DEMO_ACCESS_KEY_HINT);
    setErrorMsg(null);
  }, [initialRole]);

  // Contador regressivo para reenvio de código 2FA
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const persistCustomAccounts = (list: StoredAccountRecord[]) => {
    try {
      const customOnly = list.filter((a) => !a.id.startsWith('acc-'));
      const modifiedDemo = list.filter(
        (a) =>
          a.id.startsWith('acc-') &&
          a.createdAt !== '2026-11-23T06:00:00.000Z'
      );
      localStorage.setItem(
        ACCOUNTS_STORAGE_KEY,
        JSON.stringify([...customOnly, ...modifiedDemo])
      );
    } catch {
      // Ignora indisponibilidade de armazenamento local
    }
  };

  const handleSelectRole = (nextRole: RbacRole) => {
    setSelectedRole(nextRole);
    setErrorMsg(null);
    setInfoMsg(null);
    if (mode === 'login' && loginStep === 'credentials') {
      setLoginIdentifier(ROLE_META[nextRole].defaultUser.email);
      setLoginPassword(DEMO_ACCESS_KEY_HINT);
    }
  };

  const loadMergedAccounts = async (): Promise<StoredAccountRecord[]> => {
    const demoAccounts = await buildInitialDemoAccounts();
    let savedAccounts: StoredAccountRecord[] = [];
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          savedAccounts = parsed as StoredAccountRecord[];
        }
      }
    } catch {
      savedAccounts = [];
    }

    const merged = [...savedAccounts];
    for (const demo of demoAccounts) {
      if (!merged.some((a) => a.id === demo.id)) {
        merged.push(demo);
      }
    }
    return merged;
  };

  const ensureAccountsLoaded = async (): Promise<StoredAccountRecord[]> => {
    if (accountsReady && accounts.length > 0) return accounts;
    const merged = await loadMergedAccounts();
    setAccounts(merged);
    setAccountsReady(true);
    return merged;
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMsg(null);
    setInfoMsg(null);
    if (nextMode === 'login') {
      setLoginStep('credentials');
    } else if (nextMode === 'recovery') {
      setRecoveryStep('request');
      setRecIdentifier(loginIdentifier);
    }
    window.scrollTo(0, 0);
  };

  const findAccountByIdentifier = (
    rawIdentifier: string,
    sourceAccounts: StoredAccountRecord[] = accounts
  ): StoredAccountRecord | undefined => {
    const query = normalizeIdentifier(rawIdentifier);
    const oabQuery = normalizeOabKey(rawIdentifier);
    if (!query) return undefined;
    return sourceAccounts.find((acc) => {
      const accEmail = normalizeIdentifier(acc.email);
      const accOab = normalizeIdentifier(acc.oab);
      const accOabKey = normalizeOabKey(acc.oab);
      return (
        accEmail === query ||
        accOab === query ||
        (oabQuery.length >= 4 && accOabKey.endsWith(oabQuery))
      );
    });
  };

  // Acesso direto com perfil demonstrativo selecionado (sem pular proteção de contas reais)
  const handleQuickDemoAccess = () => {
    const demoUser = ROLE_META[selectedRole].defaultUser;
    onAuthenticate({
      name: demoUser.name,
      email: demoUser.email,
      oab: demoUser.oab,
      role: selectedRole,
      comarca: 'Comarca de Natal/RN',
      rememberSession,
      lgpdAccepted: true,
      authenticatedAt: new Date().toISOString(),
    });
  };

  // PASSO 1 DO LOGIN: Validar e-mail/OAB + senha e avançar para 2FA
  const handleLoginCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setErrorMsg('Informe seu e-mail institucional ou inscrição OAB.');
      return;
    }
    if (loginPassword.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeList = await ensureAccountsLoaded();
      const account = findAccountByIdentifier(cleanId, activeList);
      if (!account) {
        setErrorMsg(
          'Credenciais não localizadas. Confira o e-mail/OAB ou crie uma conta.'
        );
        return;
      }

      const candidateHash = await hashPasswordSha256(
        loginPassword,
        account.salt
      );
      if (candidateHash !== account.passwordHash) {
        setErrorMsg(
          'Senha incorreta para esta conta. Use "Esqueci minha senha" para redefinir.'
        );
        return;
      }

      const freshOtp = generateSixDigitOtp();
      setPendingAccount(account);
      setSelectedRole(account.role);
      setExpectedOtp(freshOtp);
      setOtpDigits(freshOtp.split(''));
      setResendSeconds(30);
      setLoginStep('two-factor');
      setInfoMsg(
        `Código de verificação enviado para ${maskEmailForDisplay(account.email)}.`
      );
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // PASSO 2 DO LOGIN: Validar token 2FA + termo LGPD e autenticar
  const handleConfirmTwoFactor = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const code = otpDigits.join('');
    if (code.length < 6) {
      setErrorMsg('Digite os 6 dígitos do token de autenticação.');
      return;
    }
    if (code !== expectedOtp) {
      setErrorMsg(
        'Token 2FA inválido ou expirado. Confira os dígitos ou solicite novo envio.'
      );
      return;
    }
    if (!lgpdAccepted) {
      setErrorMsg(
        'Confirme o termo de sigilo profissional (Estatuto da OAB) e LGPD Criminal.'
      );
      return;
    }

    const activeAcc = pendingAccount;
    if (!activeAcc) {
      setLoginStep('credentials');
      return;
    }

    onAuthenticate({
      name: activeAcc.name,
      email: activeAcc.email,
      oab: activeAcc.oab,
      role: activeAcc.role,
      comarca: activeAcc.comarca,
      rememberSession,
      lgpdAccepted: true,
      authenticatedAt: new Date().toISOString(),
    });
  };

  const handleResendOtp = () => {
    if (resendSeconds > 0) return;
    const freshOtp = generateSixDigitOtp();
    setExpectedOtp(freshOtp);
    setOtpDigits(['', '', '', '', '', '']);
    setResendSeconds(30);
    setErrorMsg(null);
    setInfoMsg('Novo código 2FA gerado para sua sessão.');
    otpInputRefs.current[0]?.focus();
  };

  // CADASTRO DE NOVA CONTA
  const regStrength = useMemo(
    () => evaluatePasswordStrength(regPassword),
    [regPassword]
  );

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (regName.trim().length < 3) {
      setErrorMsg('Informe seu nome completo profissional.');
      return;
    }
    if (regOab.trim().length < 4) {
      setErrorMsg(
        'Informe sua inscrição OAB ou registro acadêmico (ex.: OAB/RN 21.400).'
      );
      return;
    }
    if (!isValidEmail(regEmail)) {
      setErrorMsg('Informe um endereço de e-mail institucional válido.');
      return;
    }
    if (
      findAccountByIdentifier(regEmail) ||
      findAccountByIdentifier(regOab)
    ) {
      setErrorMsg(
        'Já existe uma conta cadastrada com este e-mail ou inscrição OAB.'
      );
      return;
    }
    if (regStrength.score < 2 || regPassword.length < 8) {
      setErrorMsg(
        'Defina uma senha com pelo menos 8 caracteres, letras maiúsculas e números.'
      );
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }
    if (!regLgpdAccepted) {
      setErrorMsg(
        'É obrigatório aceitar o termo de sigilo profissional e LGPD Criminal.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const salt = generateSaltHex();
      const passwordHash = await hashPasswordSha256(regPassword, salt);
      const newAccount: StoredAccountRecord = {
        id: `usr-${Date.now()}`,
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        oab: regOab.trim().toUpperCase(),
        role: selectedRole,
        comarca: regComarca.trim() || 'Comarca de Natal/RN',
        salt,
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      const updated = [newAccount, ...accounts];
      setAccounts(updated);
      persistCustomAccounts(updated);

      // Avança automaticamente para ativação 2FA
      const freshOtp = generateSixDigitOtp();
      setPendingAccount(newAccount);
      setExpectedOtp(freshOtp);
      setOtpDigits(freshOtp.split(''));
      setResendSeconds(30);
      setLgpdAccepted(true);
      setMode('login');
      setLoginStep('two-factor');
      setInfoMsg(
        `Conta criada para ${newAccount.name}. Confirme o código 2FA para acessar.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // RECUPERAÇÃO DE SENHA
  const recStrength = useMemo(
    () => evaluatePasswordStrength(recNewPassword),
    [recNewPassword]
  );

  const handleRecoveryRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const target = findAccountByIdentifier(recIdentifier);
    if (!target) {
      setErrorMsg(
        'Nenhuma conta encontrada para este e-mail ou registro OAB.'
      );
      return;
    }

    const freshOtp = generateSixDigitOtp();
    setRecTargetAccount(target);
    setRecExpectedOtp(freshOtp);
    setRecOtpDigits(['', '', '', '', '', '']);
    setRecoveryStep('verify-reset');
    setInfoMsg(
      `Código de recuperação gerado para ${maskEmailForDisplay(target.email)}.`
    );
  };

  const handleRecoveryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const code = recOtpDigits.join('');
    if (code.length < 6 || code !== recExpectedOtp) {
      setErrorMsg('Código de recuperação inválido. Confira os 6 dígitos.');
      return;
    }
    if (recStrength.score < 2 || recNewPassword.length < 8) {
      setErrorMsg(
        'A nova senha precisa ter no mínimo 8 caracteres, maiúscula e número.'
      );
      return;
    }
    if (recNewPassword !== recConfirmPassword) {
      setErrorMsg('A confirmação da nova senha não confere.');
      return;
    }
    if (!recTargetAccount) return;

    setIsSubmitting(true);
    try {
      const nextSalt = generateSaltHex();
      const nextHash = await hashPasswordSha256(recNewPassword, nextSalt);
      const updated = accounts.map((acc) =>
        acc.id === recTargetAccount.id
          ? {
              ...acc,
              salt: nextSalt,
              passwordHash: nextHash,
              createdAt: new Date().toISOString(),
            }
          : acc
      );
      setAccounts(updated);
      persistCustomAccounts(updated);
      setRecoveryStep('done');
      setLoginIdentifier(recTargetAccount.email);
      setLoginPassword('');
      setInfoMsg('Senha redefinida com segurança.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helpers para inputs de 6 dígitos (OTP)
  const updateOtpArray = (
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
    refs?: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric) {
      const copy = [...digits];
      copy[index] = '';
      setDigits(copy);
      return;
    }

    if (numeric.length > 1) {
      const chars = numeric.slice(0, 6).split('');
      const copy = [...digits];
      chars.forEach((ch, offset) => {
        if (index + offset < 6) {
          copy[index + offset] = ch;
        }
      });
      setDigits(copy);
      if (refs) {
        const nextIdx = Math.min(5, index + chars.length);
        refs.current[nextIdx]?.focus();
      }
      return;
    }

    const copy = [...digits];
    copy[index] = numeric;
    setDigits(copy);
    if (refs && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const roleCards: {
    id: RbacRole;
    icon: React.FC<{ className?: string }>;
    tag: string;
    monogram: string;
    personTitle: string;
  }[] = [
    {
      id: 'escritorio',
      icon: Building2,
      tag: 'OAB/RN 14.820',
      monogram: 'RR',
      personTitle: 'Dr. Ramon Ribeiro · Sócio Fundador',
    },
    {
      id: 'autonomo',
      icon: Briefcase,
      tag: 'OAB/RN 19.410',
      monogram: 'DJ',
      personTitle: 'Dra. Jéssica · Sócia RN & CE',
    },
  ];

  const activeMeta = ROLE_META[selectedRole];

  return (
    <div className="min-h-screen w-full bg-[#060B14] text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Navegação Superior Compacta */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackHome}
          className="min-h-[44px] pr-3 text-xs sm:text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Voltar à Homepage</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">
            Autenticação RBAC · OAB RN/CE & Sigilo E2E
          </span>
          <span className="sm:hidden">Sigilo OAB · E2E</span>
        </div>
      </header>

      {/* Container Principal Responsivo (Formulário primeiro no mobile, Split no Desktop) */}
      <main className="w-full max-w-6xl mx-auto my-auto py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-slate-800 bg-[#0B111E] shadow-2xl items-stretch">
          {/* Lado Esquerdo no Desktop / Abaixo no Mobile: Alçadas RBAC & Matriz */}
          <aside className="order-2 lg:order-1 lg:col-span-5 p-5 sm:p-7 bg-[#0E1627] border-t lg:border-t-0 lg:border-r border-slate-800 flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-display font-extrabold text-sm shrink-0">
                  LR
                </div>
                <div>
                  <span className="font-display font-bold text-lg tracking-wider text-white block leading-none">
                    LEX<span className="text-amber-400">RAMON</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Dr. Ramon Ribeiro &amp; Dra. Jéssica
                  </span>
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                  Autenticação Exclusiva dos Sócios
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Selecione o perfil entre Dr. Ramon Ribeiro e Dra. Jéssica para sincronizar dossiês, anotações internas e responsabilidades.
                </p>
              </div>

              <div className="space-y-2.5">
                {roleCards.map(({ id, icon: Icon, tag, monogram, personTitle }) => {
                  const meta = ROLE_META[id];
                  const active = selectedRole === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectRole(id)}
                      className={`w-full min-h-[64px] text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                        active
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-800 bg-[#0B111E] hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg mt-0.5 shrink-0 flex items-center justify-center font-display font-bold text-xs ${
                          active
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        <Icon className="sr-only" />
                        <span>{monogram}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-white truncate">
                            {personTitle}
                          </span>
                          <span className="text-[11px] font-mono-tabular text-blue-400 font-semibold whitespace-nowrap shrink-0">
                            {tag}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {meta.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Matriz de Permissões do Perfil Ativo */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Escopo ativo para {activeMeta.shortLabel}:
                </span>
                <div className="space-y-1.5 text-xs">
                  {activeMeta.permissionMatrix.map((p) => (
                    <div key={p.label} className="flex items-start gap-2">
                      {p.allowed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                      )}
                      <span
                        className={
                          p.allowed ? 'text-slate-200' : 'text-slate-500'
                        }
                      >
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>Isolamento zero-retention</span>
              <span className="font-mono-tabular text-amber-400">
                Natal/RN · TJRN
              </span>
            </div>
          </aside>

          {/* Lado Direito no Desktop / Topo no Mobile: Fluxo Completo de Login */}
          <section className="order-1 lg:order-2 lg:col-span-7 p-5 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-5">
              {/* Abas Principais do Fluxo (Entrar | Criar Conta) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div
                  role="tablist"
                  aria-label="Modo de autenticação"
                  className="grid grid-cols-2 sm:inline-flex p-1 rounded-xl bg-[#060B14] border border-slate-800 gap-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'login'}
                    onClick={() => switchMode('login')}
                    className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      mode === 'login'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'register'}
                    onClick={() => switchMode('register')}
                    className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      mode === 'register'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Criar Conta
                  </button>
                </div>

                <span className="text-[11px] font-mono-tabular text-amber-400">
                  {mode === 'login'
                    ? loginStep === 'credentials'
                      ? 'Etapa 1 de 2 · Credenciais'
                      : 'Etapa 2 de 2 · Verificação 2FA'
                    : mode === 'register'
                    ? 'Cadastro OAB · Ativação 2FA'
                    : 'Recuperação Segura de Senha'}
                </span>
              </div>

              {/* Mensagens Globais de Erro / Sucesso */}
              {errorMsg && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 leading-relaxed"
                >
                  {errorMsg}
                </div>
              )}

              {infoMsg && (
                <div
                  role="status"
                  className="p-3.5 rounded-xl bg-emerald-950/35 border border-emerald-500/40 text-xs text-emerald-200 leading-relaxed flex items-start gap-2.5"
                >
                  <MailCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              {/* ===============================================================
                  MODO 1 · LOGIN · PASSO 1 (CREDENCIAIS)
              ================================================================ */}
              {mode === 'login' && loginStep === 'credentials' && (
                <form
                  onSubmit={handleLoginCredentialsSubmit}
                  className="space-y-4"
                >
                  <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
                      Acessar Plataforma
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Entre com seu e-mail institucional ou inscrição OAB e
                      confirme o segundo fator (2FA).
                    </p>
                  </div>

                  {/* Seleção Direta dos Sócios: Dr. Ramon Ribeiro | Dra. Jéssica */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-slate-400 block">
                      Seleção direta de perfil dos sócios:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { role: 'escritorio' as RbacRole, label: 'Dr. Ramon Ribeiro (RN)' },
                          { role: 'autonomo' as RbacRole, label: 'Dra. Jéssica (CE/RN)' },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.role}
                          type="button"
                          onClick={() => handleSelectRole(item.role)}
                          className={`min-h-[42px] px-3 rounded-xl text-xs font-semibold border transition-colors ${
                            selectedRole === item.role
                              ? 'bg-blue-600/20 border-blue-500/60 text-blue-200'
                              : 'bg-[#060B14] border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-300">
                      E-mail Institucional ou OAB
                    </span>
                    <input
                      type="text"
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="ramon@ramonribeiro.adv.br ou OAB/RN 14.820"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-300">
                        Senha de Acesso
                      </span>
                      <button
                        type="button"
                        onClick={() => switchMode('recovery')}
                        className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((s) => !s)}
                        aria-label={
                          showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'
                        }
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <label className="min-h-[40px] flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberSession}
                        onChange={(e) => setRememberSession(e.target.checked)}
                        className="w-4 h-4 accent-blue-500 rounded shrink-0"
                      />
                      <span className="text-xs text-slate-300">
                        Manter sessão neste dispositivo
                      </span>
                    </label>

                    <span className="text-[11px] font-mono-tabular text-slate-400">
                      Senha demo: {DEMO_ACCESS_KEY_HINT}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full min-h-[48px] py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <span>
                        {isSubmitting
                          ? 'Verificando credenciais...'
                          : 'Continuar para Verificação 2FA'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickDemoAccess}
                      className="w-full min-h-[44px] py-2.5 rounded-xl font-semibold bg-[#060B14] hover:bg-[#131D33] border border-slate-800 hover:border-amber-500/45 text-amber-300 text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <span>
                        Entrar direto na Homepage como{' '}
                        {ROLE_META[selectedRole].shortLabel} (Demo)
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* ===============================================================
                  MODO 1 · LOGIN · PASSO 2 (VERIFICAÇÃO 2FA + SIGILO OAB/LGPD)
              ================================================================ */}
              {mode === 'login' && loginStep === 'two-factor' && pendingAccount && (
                <form onSubmit={handleConfirmTwoFactor} className="space-y-5">
                  <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
                      Confirmação em Duas Etapas (2FA)
                    </h1>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Autenticando{' '}
                      <span className="text-slate-200 font-semibold">
                        {pendingAccount.name}
                      </span>{' '}
                      ({pendingAccount.oab}) ·{' '}
                      {ROLE_META[pendingAccount.role].shortLabel}
                    </p>
                  </div>

                  {/* Aviso claro de código 2FA para validação imediata sem backend SMTP */}
                  <div className="p-3.5 rounded-xl bg-[#060B14] border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-300">
                      Token 2FA gerado para{' '}
                      <span className="font-mono-tabular text-slate-200">
                        {maskEmailForDisplay(pendingAccount.email)}
                      </span>
                    </span>
                    <span className="font-mono-tabular font-bold text-amber-400 tracking-widest">
                      {expectedOtp}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        Código de Verificação (6 dígitos)
                      </span>
                      <button
                        type="button"
                        disabled={resendSeconds > 0}
                        onClick={handleResendOtp}
                        className="min-h-[36px] text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:text-slate-500 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>
                          {resendSeconds > 0
                            ? `Reenviar em 00:${String(resendSeconds).padStart(2, '0')}`
                            : 'Reenviar código'}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-6 gap-2 sm:gap-3">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                          maxLength={6}
                          aria-label={`Dígito ${idx + 1} do código 2FA`}
                          value={digit}
                          onChange={(e) =>
                            updateOtpArray(
                              otpDigits,
                              setOtpDigits,
                              idx,
                              e.target.value,
                              otpInputRefs
                            )
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === 'Backspace' &&
                              !otpDigits[idx] &&
                              idx > 0
                            ) {
                              otpInputRefs.current[idx - 1]?.focus();
                            }
                          }}
                          className="h-12 sm:h-14 w-full rounded-xl bg-[#060B14] border border-slate-800 focus:border-blue-500 focus:outline-none text-center font-mono-tabular text-lg font-bold text-white"
                        />
                      ))}
                    </div>
                  </div>

                  <label className="min-h-[44px] flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={lgpdAccepted}
                      onChange={(e) => setLgpdAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-blue-500 rounded shrink-0"
                    />
                    <span className="text-xs text-slate-300 leading-relaxed">
                      Confirmo o termo de sigilo profissional (Estatuto da OAB)
                      e isolamento LGPD Criminal desta sessão.
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('credentials');
                        setErrorMsg(null);
                        setInfoMsg(null);
                      }}
                      className="sm:col-span-4 min-h-[48px] px-4 py-2.5 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Alterar Conta</span>
                    </button>

                    <button
                      type="submit"
                      className="sm:col-span-8 min-h-[48px] px-5 py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Confirmar e Entrar na Homepage</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* ===============================================================
                  MODO 2 · CRIAR CONTA (CADASTRO COMPLETO + FORÇA DA SENHA)
              ================================================================ */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
                      Cadastrar Nova Conta Profissional
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Escolha sua alçada RBAC e crie suas credenciais para
                      acessar o ambiente.
                    </p>
                  </div>

                  {/* Seletor do Perfil da Nova Conta */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-300 block">
                      Perfil de Acesso (Alçada RBAC)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['escritorio', 'autonomo', 'estudante'] as RbacRole[]).map(
                        (r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedRole(r)}
                            className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                              selectedRole === r
                                ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                                : 'bg-[#060B14] border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {ROLE_META[r].shortLabel}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-300">
                        Nome Completo *
                      </span>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Ex.: Dra. Marina Nóbrega"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-300">
                        Inscrição OAB / Registro *
                      </span>
                      <input
                        type="text"
                        value={regOab}
                        onChange={(e) => setRegOab(e.target.value)}
                        placeholder={
                          selectedRole === 'estudante'
                            ? 'OAB/RN 5.012-E'
                            : 'OAB/RN 22.180'
                        }
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm font-mono-tabular text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-300">
                        E-mail Institucional *
                      </span>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="marina@escritorio.adv.br"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-300">
                        Comarca de Atuação
                      </span>
                      <input
                        type="text"
                        value={regComarca}
                        onChange={(e) => setRegComarca(e.target.value)}
                        placeholder="Comarca de Natal/RN"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-300">
                        Criar Senha *
                      </span>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Mín. 8 caracteres"
                          className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword((s) => !s)}
                          aria-label={
                            showRegPassword
                              ? 'Ocultar senha'
                              : 'Mostrar senha'
                          }
                          className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white"
                        >
                          {showRegPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-300">
                        Confirmar Senha *
                      </span>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </label>
                  </div>

                  {/* Medidor de Força da Senha */}
                  <div className="p-3 rounded-xl bg-[#060B14] border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">
                        Segurança da senha
                      </span>
                      <span
                        className={`font-semibold ${
                          regStrength.score <= 1
                            ? 'text-red-400'
                            : regStrength.score === 2
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {regStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 rounded-full transition-colors ${
                            regStrength.score >= step
                              ? regStrength.score <= 1
                                ? 'bg-red-500'
                                : regStrength.score === 2
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                      <span
                        className={
                          regStrength.checks.minLength
                            ? 'text-emerald-400'
                            : ''
                        }
                      >
                        · 8+ caracteres
                      </span>
                      <span
                        className={
                          regStrength.checks.hasUpper ? 'text-emerald-400' : ''
                        }
                      >
                        · Letra maiúscula
                      </span>
                      <span
                        className={
                          regStrength.checks.hasNumber
                            ? 'text-emerald-400'
                            : ''
                        }
                      >
                        · Número
                      </span>
                      <span
                        className={
                          regStrength.checks.hasSymbol
                            ? 'text-emerald-400'
                            : ''
                        }
                      >
                        · Símbolo
                      </span>
                    </div>
                  </div>

                  <label className="min-h-[44px] flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regLgpdAccepted}
                      onChange={(e) => setRegLgpdAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-blue-500 rounded shrink-0"
                    />
                    <span className="text-xs text-slate-400 leading-relaxed">
                      Aceito o termo de sigilo profissional da OAB e o
                      tratamento de dados sob a LGPD Criminal.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Criando conta...'
                        : 'Criar Conta e Validar 2FA'}
                    </span>
                  </button>
                </form>
              )}

              {/* ===============================================================
                  MODO 3 · RECUPERAÇÃO DE SENHA (3 ETAPAS COMPLETAS)
              ================================================================ */}
              {mode === 'recovery' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
                        Recuperar Senha de Acesso
                      </h1>
                      <p className="text-xs text-slate-400 mt-1">
                        Valide sua identidade com código temporário para definir
                        uma nova senha.
                      </p>
                    </div>
                  </div>

                  {recoveryStep === 'request' && (
                    <form
                      onSubmit={handleRecoveryRequest}
                      className="space-y-4"
                    >
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-slate-300">
                          E-mail Institucional ou Inscrição OAB
                        </span>
                        <input
                          type="text"
                          value={recIdentifier}
                          onChange={(e) => setRecIdentifier(e.target.value)}
                          placeholder="Informe o e-mail ou OAB da conta"
                          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                          required
                        />
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <button
                          type="button"
                          onClick={() => switchMode('login')}
                          className="sm:col-span-4 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-800 text-xs font-semibold text-slate-200"
                        >
                          Voltar ao Login
                        </button>
                        <button
                          type="submit"
                          className="sm:col-span-8 min-h-[48px] px-5 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center justify-center gap-2"
                        >
                          <KeyRound className="w-4 h-4" />
                          <span>Enviar Código de Recuperação</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {recoveryStep === 'verify-reset' && recTargetAccount && (
                    <form onSubmit={handleRecoveryReset} className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-[#060B14] border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-300">
                          Código enviado para{' '}
                          <span className="font-mono-tabular text-slate-200">
                            {maskEmailForDisplay(recTargetAccount.email)}
                          </span>
                        </span>
                        <span className="font-mono-tabular font-bold text-amber-400 tracking-widest">
                          {recExpectedOtp}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-medium text-slate-300 block">
                          Código de Recuperação (6 dígitos)
                        </span>
                        <div className="grid grid-cols-6 gap-2 sm:gap-3">
                          {recOtpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              aria-label={`Dígito ${idx + 1} da recuperação`}
                              value={digit}
                              onChange={(e) =>
                                updateOtpArray(
                                  recOtpDigits,
                                  setRecOtpDigits,
                                  idx,
                                  e.target.value
                                )
                              }
                              className="h-12 w-full rounded-xl bg-[#060B14] border border-slate-800 focus:border-blue-500 focus:outline-none text-center font-mono-tabular text-base font-bold text-white"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-slate-300">
                            Nova Senha
                          </span>
                          <div className="relative">
                            <input
                              type={showRecPassword ? 'text' : 'password'}
                              value={recNewPassword}
                              onChange={(e) =>
                                setRecNewPassword(e.target.value)
                              }
                              placeholder="Mín. 8 caracteres"
                              className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRecPassword((s) => !s)}
                              aria-label="Alternar visibilidade da senha"
                              className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white"
                            >
                              {showRecPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </label>

                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-slate-300">
                            Confirmar Nova Senha
                          </span>
                          <input
                            type={showRecPassword ? 'text' : 'password'}
                            value={recConfirmPassword}
                            onChange={(e) =>
                              setRecConfirmPassword(e.target.value)
                            }
                            placeholder="Repita a nova senha"
                            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                            required
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setRecoveryStep('request')}
                          className="sm:col-span-4 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#060B14] border border-slate-800 text-xs font-semibold text-slate-200"
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="sm:col-span-8 min-h-[48px] px-5 py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm flex items-center justify-center gap-2"
                        >
                          <span>Redefinir Senha</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {recoveryStep === 'done' && (
                    <div className="p-5 rounded-xl bg-[#060B14] border border-emerald-500/40 space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <h2 className="text-sm font-bold text-white">
                            Senha Atualizada com Sucesso
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">
                            Suas novas credenciais já estão ativas. Faça o login
                            com a senha redefinida e confirme o 2FA.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="w-full min-h-[48px] py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center justify-center gap-2"
                      >
                        <span>Ir para Login</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
              {activeMeta.loginContext}
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 pt-2">
        LexRamon · Sigilo Profissional e Controle de Acesso por Perfil
      </footer>
    </div>
  );
};
