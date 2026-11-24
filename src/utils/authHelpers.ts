import { RbacRole } from '../types/lex';
import { ROLE_META } from '../data/mockCases';

export interface StoredAccountRecord {
  id: string;
  name: string;
  email: string;
  oab: string;
  role: RbacRole;
  comarca: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

export interface PasswordStrength {
  score: number;
  label: 'Fraca' | 'Razoável' | 'Forte' | 'Blindada';
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

export function generateSaltHex(bytes = 12): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i += 1) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPasswordSha256(
  password: string,
  salt: string
): Promise<string> {
  const payload = `${salt}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, '0')
    ).join('');
  }
  // Fallback apenas caso SubtleCrypto não esteja disponível em ambiente restrito
  let hash = 5381;
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
}

export function generateSixDigitOtp(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const num = 100000 + (arr[0] % 900000);
    return String(num);
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-ZÀ-Ý]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9À-ÿ\s]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const label: PasswordStrength['label'] =
    score <= 1
      ? 'Fraca'
      : score === 2
      ? 'Razoável'
      : score === 3
      ? 'Forte'
      : 'Blindada';
  return { score, label, checks };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function maskEmailForDisplay(email: string): string {
  const trimmed = email.trim();
  const [local, domain] = trimmed.split('@');
  if (!local || !domain) return trimmed;
  if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(5, local.length - 2))}@${domain}`;
}

export function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeOabKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isValidStoredSession(value: unknown): value is {
  name: string;
  email: string;
  oab: string;
  role: RbacRole;
  lgpdAccepted: boolean;
  authenticatedAt: string;
} {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const validRoles: RbacRole[] = ['escritorio', 'autonomo', 'estudante'];
  return (
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.email === 'string' &&
    candidate.email.trim().length > 0 &&
    typeof candidate.oab === 'string' &&
    candidate.oab.trim().length > 0 &&
    typeof candidate.role === 'string' &&
    validRoles.includes(candidate.role as RbacRole) &&
    candidate.lgpdAccepted === true
  );
}

export const DEMO_ACCESS_KEY_HINT = 'LexRamon@2026';

export async function buildInitialDemoAccounts(): Promise<
  StoredAccountRecord[]
> {
  const roles: RbacRole[] = ['escritorio', 'autonomo', 'estudante'];
  const accounts: StoredAccountRecord[] = [];
  for (const r of roles) {
    const user = ROLE_META[r].defaultUser;
    const salt = `lex_${r}_salt_2026`;
    const passwordHash = await hashPasswordSha256(DEMO_ACCESS_KEY_HINT, salt);
    accounts.push({
      id: `acc-${r}`,
      name: user.name,
      email: user.email,
      oab: user.oab,
      role: r,
      comarca: 'Comarca de Natal/RN',
      salt,
      passwordHash,
      createdAt: '2026-11-23T06:00:00.000Z',
    });
  }
  return accounts;
}
