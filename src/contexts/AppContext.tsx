import React, { createContext, useContext, useState, useCallback } from 'react';
import { Transaction, NewTransaction } from '../types';
import {
  LocalProfile,
  loadProfile, saveProfile,
  loadTransactions,
  addTransactionLocal,
  updateTransactionLocal,
  deleteTransactionLocal,
  restoreTransactionLocal,
} from '../lib/storage';

interface AppContextType {
  transactions: Transaction[];
  profile: LocalProfile;
  addTransaction: (data: NewTransaction) => Transaction;
  updateTransaction: (id: string, data: Partial<NewTransaction>) => void;
  deleteTransaction: (id: string) => void;
  restoreTransaction: (tx: Transaction) => void;
  updateProfile: (data: Partial<LocalProfile>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [profile, setProfile] = useState<LocalProfile>(() => loadProfile());

  const addTransaction = useCallback((data: NewTransaction): Transaction => {
    let created!: Transaction;
    setTransactions(prev => {
      const next = addTransactionLocal(prev, data);
      created = next[0];
      return next;
    });
    return created;
  }, []);

  const updateTransaction = useCallback((id: string, data: Partial<NewTransaction>) => {
    setTransactions(prev => updateTransactionLocal(prev, id, data));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => deleteTransactionLocal(prev, id));
  }, []);

  const restoreTransaction = useCallback((tx: Transaction) => {
    setTransactions(prev => restoreTransactionLocal(prev, tx));
  }, []);

  const updateProfile = useCallback((data: Partial<LocalProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...data };
      saveProfile(next);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      transactions, profile,
      addTransaction, updateTransaction, deleteTransaction,
      restoreTransaction, updateProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
