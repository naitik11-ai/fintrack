import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Edit2, Trash2, RotateCcw,
  TrendingUp, TrendingDown, ChevronUp, ChevronDown, ChevronsUpDown, Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { Transaction, CATEGORIES, Category, CATEGORY_COLORS } from '../types';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatRelativeDate } from '../lib/utils';

type SortField = 'date' | 'amount' | 'category';
type SortDir   = 'asc'  | 'desc';

interface Props { onEdit: (tx: Transaction) => void; }

export default function TransactionList({ onEdit }: Props) {
  const { transactions, deleteTransaction, restoreTransaction } = useApp();

  const [search,         setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [typeFilter,     setTypeFilter]     = useState<'all' | 'expense' | 'income'>('all');
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [sortField,      setSortField]      = useState<SortField>('date');
  const [sortDir,        setSortDir]        = useState<SortDir>('desc');
  const [showFilters,    setShowFilters]    = useState(false);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const filtered = useMemo(() => {
    let r = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)    ||
        t.paymentMethod.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'All') r = r.filter(t => t.category === categoryFilter);
    if (typeFilter     !== 'all') r = r.filter(t => t.type === typeFilter);
    if (dateFrom)                 r = r.filter(t => t.date >= dateFrom);
    if (dateTo)                   r = r.filter(t => t.date <= dateTo);
    r.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date')     cmp = a.date.localeCompare(b.date);
      if (sortField === 'amount')   cmp = a.amount - b.amount;
      if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [transactions, search, categoryFilter, typeFilter, dateFrom, dateTo, sortField, sortDir]);

  function handleDelete(tx: Transaction) {
    deleteTransaction(tx.id);
    toast('Transaction deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          restoreTransaction(tx);
          toast.success('Transaction restored!');
        },
      },
      duration: 5000,
    });
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-muted-custom" />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-accent" />
      : <ChevronDown size={13} className="text-accent" />;
  }

  const activeCount = [
    categoryFilter !== 'All', typeFilter !== 'all', !!dateFrom, !!dateTo,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">

      {/* Search + Filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-custom" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`btn-secondary flex items-center gap-2 relative ${showFilters ? 'border-accent/40 text-accent' : ''}`}
        >
          <Filter size={14} />
          Filters
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card grid grid-cols-2 md:grid-cols-4 gap-3 py-3">
              <div>
                <label className="label">Category</label>
                <select className="select-field" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Type</label>
                <select className="select-field" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
                  <option value="all">All Types</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="label">From</label>
                <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">To</label>
                <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              {activeCount > 0 && (
                <div className="col-span-full">
                  <button
                    onClick={() => { setCategoryFilter('All'); setTypeFilter('all'); setDateFrom(''); setDateTo(''); }}
                    className="text-xs text-muted-custom hover:text-primary flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw size={11} /> Clear all filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Count */}
      <p className="text-xs text-muted-custom">
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card text-center py-14">
          <p className="text-secondary text-sm">No transactions found</p>
          <p className="text-muted-custom text-xs mt-1">Try adjusting filters or add a new transaction</p>
        </motion.div>
      ) : (
        <div className="card overflow-hidden p-0">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-surface-2 border-b border-border text-xs font-medium text-secondary">
            <button onClick={() => handleSort('date')} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              Description / Date <SortIcon field="date" />
            </button>
            <button onClick={() => handleSort('category')} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              Category <SortIcon field="category" />
            </button>
            <span>Method</span>
            <button onClick={() => handleSort('amount')} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              Amount <SortIcon field="amount" />
            </button>
            <span>Actions</span>
          </div>

          <div className="divide-y" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
            <AnimatePresence initial={false}>
              {filtered.map(tx => (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="table-row"
                >
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                        style={{ background: `${CATEGORY_COLORS[tx.category]}20`, color: CATEGORY_COLORS[tx.category] }}>
                        {tx.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-custom">{formatRelativeDate(tx.date)}</span>
                          {tx.tags.map(tag => (
                            <span key={tag} className="tag text-[10px]"><Tag size={8} />{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="badge text-xs" style={{
                      background: `${CATEGORY_COLORS[tx.category]}18`,
                      color: CATEGORY_COLORS[tx.category],
                      border: `1px solid ${CATEGORY_COLORS[tx.category]}30`,
                    }}>{tx.category}</span>
                    <span className="text-xs text-secondary">{tx.paymentMethod}</span>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(tx)}
                        className="p-1.5 rounded hover:bg-surface-3 text-muted-custom hover:text-primary transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(tx)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-custom hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile row */}
                  <div className="md:hidden flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${CATEGORY_COLORS[tx.category]}20`, color: CATEGORY_COLORS[tx.category] }}>
                      {tx.type === 'income' ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{tx.description}</p>
                      <div className="flex items-center flex-wrap gap-1.5 mt-0.5 min-w-0">
                        <span className="badge text-[10px] truncate max-w-full" style={{
                          background: `${CATEGORY_COLORS[tx.category]}18`,
                          color: CATEGORY_COLORS[tx.category],
                          border: `1px solid ${CATEGORY_COLORS[tx.category]}30`,
                        }}>{tx.category}</span>
                        <span className="text-[10px] text-muted-custom whitespace-nowrap">{formatRelativeDate(tx.date)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <button onClick={() => onEdit(tx)} className="p-1 rounded hover:bg-surface-3 text-muted-custom transition-colors">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(tx)} className="p-1 rounded hover:bg-red-500/10 text-muted-custom hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
