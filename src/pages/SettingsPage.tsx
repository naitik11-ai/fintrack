import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Target, Loader2, User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const { profile, updateProfile, transactions } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [name,   setName]   = useState(profile.displayName);
  const [budget, setBudget] = useState(String(profile.monthlyBudget));
  const [saving, setSaving] = useState(false);

  function handleSave() {
    const amount = parseFloat(budget);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid budget amount');
      return;
    }
    setSaving(true);
    try {
      updateProfile({ displayName: name.trim() || 'You', monthlyBudget: amount });
      toast.success('Settings saved!');
    } catch {
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleClearData() {
    if (!confirm('This will permanently delete ALL your transactions. Continue?')) return;
    localStorage.clear();
    window.location.reload();
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 max-w-2xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 pt-1"
      >
        <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
          <Settings size={18} className="text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary font-display">Settings</h2>
          <p className="text-xs text-muted-custom">Manage your preferences</p>
        </div>
      </motion.div>

      {/* Name */}
      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center gap-2 mb-3">
          <User size={14} className="text-muted-custom" />
          <h3 className="text-sm font-semibold text-primary">Your Name</h3>
        </div>
        <input
          id="display-name-input"
          type="text"
          className="input-field"
          placeholder="What should we call you?"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={40}
        />
      </motion.div>

      {/* Budget */}
      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-2 mb-1">
          <Target size={14} className="text-muted-custom" />
          <h3 className="text-sm font-semibold text-primary">Monthly Budget</h3>
        </div>
        <p className="text-xs text-muted-custom mb-3">
          Sets the spending limit shown on your dashboard.
        </p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-semibold text-sm">₹</span>
          <input
            id="monthly-budget-input"
            type="number"
            inputMode="decimal"
            className="input-field pl-7"
            placeholder="50000"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            min="0"
            step="100"
          />
        </div>
      </motion.div>

      {/* Save */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <button
          id="save-settings-btn"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </motion.div>

      {/* Appearance */}
      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center gap-2 mb-4">
          {theme === 'dark'
            ? <Moon size={14} className="text-muted-custom" />
            : <Sun  size={14} className="text-muted-custom" />}
          <h3 className="text-sm font-semibold text-primary">Appearance</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['dark', 'light'] as const).map(t => (
            <button
              key={t}
              id={`theme-${t}-btn`}
              onClick={() => theme !== t && toggleTheme()}
              className={[
                'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                theme === t
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-border bg-surface-2 text-muted-custom hover:border-text-muted',
              ].join(' ')}
            >
              {t === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              <span className="text-xs font-medium capitalize">{t} Mode</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Data summary */}
      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h3 className="text-sm font-semibold text-primary mb-3">Data Summary</h3>
        <div className="space-y-0 text-sm divide-y" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary">Total transactions</span>
            <span className="font-medium text-primary">{transactions.length}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary">Storage</span>
            <span className="badge badge-blue">Local · Private</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary">App version</span>
            <span className="font-mono text-muted-custom text-xs">v1.0.0</span>
          </div>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div className="card border-danger/20" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="text-sm font-semibold text-danger mb-2">Danger Zone</h3>
        <p className="text-xs text-muted-custom mb-4">
          Permanently delete all local transactions and settings. This cannot be undone.
        </p>
        <button
          id="clear-data-btn"
          onClick={handleClearData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-all text-sm font-medium w-full sm:w-auto justify-center sm:justify-start"
        >
          <Trash2 size={14} /> Clear All Data
        </button>
      </motion.div>
    </div>
  );
}
