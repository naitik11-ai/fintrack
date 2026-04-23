import { useState } from 'react';
import { motion } from 'framer-motion';
import { ListChecks, Plus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Transaction } from '../types';
import TransactionList from '../components/TransactionList';
import TransactionForm from '../components/TransactionForm';

export default function TransactionsPage() {
  const { transactions } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editTx,   setEditTx]   = useState<Transaction | null>(null);

  function handleEdit(tx: Transaction) {
    setEditTx(tx);
    setShowForm(true);
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <ListChecks size={18} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary font-display">Transactions</h2>
            <p className="text-xs text-muted-custom">{transactions.length} total records</p>
          </div>
        </div>
        <button
          id="transactions-add-btn"
          onClick={() => { setEditTx(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </button>
      </motion.div>

      {/* Transaction list */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <TransactionList onEdit={handleEdit} />
      </motion.div>

      {/* Form modal */}
      {showForm && (
        <TransactionForm
          editTransaction={editTx}
          onClose={() => { setShowForm(false); setEditTx(null); }}
        />
      )}
    </div>
  );
}
