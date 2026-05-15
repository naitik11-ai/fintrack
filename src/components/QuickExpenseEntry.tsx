import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { NewTransaction, PAYMENT_METHODS, Transaction } from '../types';
import { useApp } from '../contexts/AppContext';
import { getTodayDate } from '../lib/utils';
import { localCategorize } from '../lib/categorize';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_FORM: Omit<NewTransaction, 'date'> = {
  amount: 0,
  description: '',
  category: 'Other',
  paymentMethod: 'UPI',
  type: 'expense',
  tags: [],
};

function formatHistoryKey(tx: Transaction) {
  return `${tx.description}|${tx.category}|${tx.paymentMethod}`;
}

export default function QuickExpenseEntry({ isOpen, onClose }: Props) {
  const { transactions, addTransaction } = useApp();
  const amountRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Omit<NewTransaction, 'date'>>(DEFAULT_FORM);
  const [listening, setListening] = useState(false);

  const expenseHistory = useMemo(
    () => transactions.filter(tx => tx.type === 'expense'),
    [transactions]
  );

  const recentTemplates = useMemo(() => {
    const seen = new Set<string>();
    return expenseHistory
      .slice(0, 12)
      .filter(tx => {
        const key = formatHistoryKey(tx);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }, [expenseHistory]);

  const matchedHistory = useMemo(() => {
    const query = form.description.trim().toLowerCase();
    if (!query) return [] as Transaction[];
    return expenseHistory.filter(tx =>
      tx.description.toLowerCase().includes(query) ||
      tx.category.toLowerCase().includes(query)
    ).slice(0, 3);
  }, [expenseHistory, form.description]);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => amountRef.current?.focus(), 100);
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('keydown', handle);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (form.description.length <= 3) return;
    const localGuess = localCategorize(form.description);
    if (localGuess !== 'Other') {
      setForm(current => ({ ...current, category: localGuess }));
    }
  }, [form.description]);

  const voiceAvailable = Boolean(SpeechRecognition);

  function handleVoiceCapture() {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = event => {
      const text = event.results[0]?.[0]?.transcript;
      if (text) {
        setForm(current => ({ ...current, description: text }));
        toast.success('Voice recorded. Tap enter to add.');
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  function buildTransaction(): NewTransaction {
    return {
      ...form,
      date: getTodayDate(),
    };
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.amount || form.amount <= 0) {
      toast.error('Enter an amount');
      amountRef.current?.focus();
      return;
    }
    if (!form.description.trim()) {
      toast.error('Add a description');
      return;
    }
    const payload = buildTransaction();
    addTransaction(payload);
    toast.success('Expense captured instantly');
    resetForm();
    onClose();
  }

  function applyTemplate(tx: Transaction) {
    setForm({
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      paymentMethod: tx.paymentMethod,
      type: 'expense',
      tags: tx.tags,
    });
    setTimeout(() => amountRef.current?.focus(), 50);
  }

  function repeatTransaction(tx: Transaction) {
    const payload: NewTransaction = {
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      paymentMethod: tx.paymentMethod,
      type: 'expense',
      tags: tx.tags,
      date: getTodayDate(),
    };
    addTransaction(payload);
    toast.success('Repeated transaction added');
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={event => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            className="quick-entry-panel glass w-full max-w-xl rounded-3xl border border-white/20 p-5 shadow-2xl shadow-black/20"
            initial={{ y: 32, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-accent-light font-semibold">Quick Expense</p>
                <h2 className="mt-2 text-xl font-semibold text-primary">Add in under 5 seconds</h2>
                <p className="text-sm text-muted-custom mt-1 max-w-md">Start typing and hit Enter. Category fills automatically, and your past receipts appear as you type.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-2xl text-muted-custom hover:text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
                <label className="input-group">
                  <span className="label">Amount</span>
                  <input
                    ref={amountRef}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    className="input-field text-2xl font-semibold pl-3"
                    placeholder="0.00"
                    value={form.amount ? String(form.amount) : ''}
                    onChange={e => {
                      const sanitized = e.target.value.replace(/[^0-9.]/g, '');
                      setForm(curr => ({ ...curr, amount: parseFloat(sanitized) || 0 }));
                    }}
                  />
                </label>
                <label className="input-group">
                  <span className="label">Payment</span>
                  <select
                    className="select-field"
                    value={form.paymentMethod}
                    onChange={e => setForm(curr => ({ ...curr, paymentMethod: e.target.value as any }))}
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="input-group">
                <span className="label">Description</span>
                <div className="relative">
                  <input
                    type="text"
                    className="input-field pr-12"
                    placeholder="e.g. Swiggy dinner, Uber ride..."
                    value={form.description}
                    onChange={e => setForm(curr => ({ ...curr, description: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={handleVoiceCapture}
                    disabled={!voiceAvailable}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-custom hover:text-primary transition-colors"
                    aria-label="Voice input"
                  >
                    <Mic size={18} className={listening ? 'animate-pulse text-accent-light' : ''} />
                  </button>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="label">Category</p>
                  <div className="rounded-2xl border border-white/10 bg-surface-2 px-4 py-3 text-sm text-primary">
                    {form.category}
                  </div>
                </div>
                <div>
                  <p className="label">Date</p>
                  <div className="rounded-2xl border border-white/10 bg-surface-2 px-4 py-3 text-sm text-primary">
                    {getTodayDate()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-secondary font-semibold">Recent quick templates</p>
                  <span className="text-xs text-muted-custom">Tap to reuse</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentTemplates.length > 0 ? recentTemplates.map(tx => (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => applyTemplate(tx)}
                      className="tag border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      {tx.description} · {tx.paymentMethod}
                    </button>
                  )) : (
                    <p className="text-sm text-muted-custom">No recent templates yet. Add one now.</p>
                  )}
                </div>
              </div>

              {matchedHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-secondary font-semibold">Matching history</p>
                    <span className="text-xs text-muted-custom">Tap to repeat</span>
                  </div>
                  <div className="grid gap-2">
                    {matchedHistory.map(tx => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => repeatTransaction(tx)}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface-2 px-4 py-3 text-left hover:border-accent/30"
                      >
                        <div>
                          <p className="font-medium text-primary truncate">{tx.description}</p>
                          <p className="text-xs text-muted-custom">{tx.category} · {tx.paymentMethod}</p>
                        </div>
                        <span className="font-semibold text-primary">₹{tx.amount.toFixed(0)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Zap size={18} /> Save Fast
                </button>
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
