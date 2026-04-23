import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { NewTransaction, CATEGORIES, PAYMENT_METHODS, TAGS, Tag, Category } from '../types';
import { useApp } from '../contexts/AppContext';
import { localCategorize } from '../lib/categorize';
import { getTodayDate } from '../lib/utils';
import type { Transaction } from '../types';

interface Props {
  onClose: () => void;
  editTransaction?: Transaction | null;
}

const DEFAULT: NewTransaction = {
  amount: 0,
  description: '',
  category: 'Other',
  paymentMethod: 'UPI',
  type: 'expense',
  tags: [],
  date: getTodayDate(),
};

export default function TransactionForm({ onClose, editTransaction }: Props) {
  const { addTransaction, updateTransaction } = useApp();
  const amountRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<NewTransaction>(
    editTransaction
      ? {
        amount: editTransaction.amount, description: editTransaction.description,
        category: editTransaction.category, paymentMethod: editTransaction.paymentMethod,
        type: editTransaction.type, tags: editTransaction.tags, date: editTransaction.date
      }
      : DEFAULT
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setTimeout(() => amountRef.current?.focus(), 200); }, []);

  // Auto-categorisation with local fallback
  useEffect(() => {
    if (form.description.length <= 3 || editTransaction) return;

    // Instant local guess based on keywords
    const localGuess = localCategorize(form.description);
    if (localGuess !== 'Other') setForm(f => ({ ...f, category: localGuess }));
  }, [form.description, editTransaction]);

  function toggleTag(t: Tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!form.description.trim()) { toast.error('Enter a description'); return; }
    if (editTransaction) {
      updateTransaction(editTransaction.id, form);
      toast.success('Transaction updated!');
    } else {
      addTransaction(form);
      toast.success('Transaction added!');
    }
    onClose();
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        {/* Drag handle (mobile) */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-primary">
            {editTransaction ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 text-muted-custom hover:text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-surface-2 rounded-lg">
            {(['expense', 'income'] as const).map(type => (
              <button key={type} type="button"
                onClick={() => setForm(f => ({ ...f, type }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all ${form.type === type
                    ? type === 'expense'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-secondary hover:text-primary'
                  }`}>
                {type === 'expense' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="label">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm font-bold">₹</span>
              <input
                ref={amountRef}
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                className="input-field pl-8 text-lg font-bold"
                placeholder="0.00"
                value={form.amount || ''}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9.]/g, '');
                  setForm(f => ({ ...f, amount: parseFloat(v) || 0 }));
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <input type="text" className="input-field"
              placeholder="e.g. Swiggy order, Auto fare..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={100} />
          </div>

          {/* Category + Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label flex items-center gap-1.5">
                Category
              </label>
              <select className="select-field" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment</label>
              <select className="select-field" value={form.paymentMethod}
                onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as any }))}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field"
              value={form.date} max={getTodayDate()}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          {/* Tags */}
          <div>
            <label className="label flex items-center gap-1.5">
              <TagIcon size={12} />Tags
              <span className="text-muted-custom font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`tag cursor-pointer transition-all select-none ${form.tags.includes(tag)
                      ? 'bg-accent/15 text-accent border-accent/30'
                      : 'hover:border-text-muted'
                    }`}>
                  {form.tags.includes(tag) && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              {editTransaction ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
