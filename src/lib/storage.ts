import { Transaction, NewTransaction } from '../types';

const TRANSACTIONS_KEY = 'fintrack_transactions';
const PROFILE_KEY = 'fintrack_profile';

export interface LocalProfile {
  displayName: string;
  monthlyBudget: number;
  currency: string;
}

// ---------- Profile ----------
export function loadProfile(): LocalProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { displayName: 'You', monthlyBudget: 50000, currency: 'INR' };
}

export function saveProfile(profile: LocalProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ---------- Transactions ----------
export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveTransactions(txs: Transaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function addTransactionLocal(txs: Transaction[], data: NewTransaction): Transaction[] {
  const tx: Transaction = {
    ...data,
    id: generateId(),
    userId: 'local',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const next = [tx, ...txs];
  saveTransactions(next);
  return next;
}

export function updateTransactionLocal(
  txs: Transaction[],
  id: string,
  data: Partial<NewTransaction>
): Transaction[] {
  const next = txs.map(t =>
    t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t
  );
  saveTransactions(next);
  return next;
}

export function deleteTransactionLocal(txs: Transaction[], id: string): Transaction[] {
  const next = txs.filter(t => t.id !== id);
  saveTransactions(next);
  return next;
}

export function restoreTransactionLocal(txs: Transaction[], tx: Transaction): Transaction[] {
  const next = [tx, ...txs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  saveTransactions(next);
  return next;
}
