import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ListChecks, Settings, Sun, Moon, TrendingUp, Plus, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';
import TransactionForm from './TransactionForm';
import QuickExpenseEntry from './QuickExpenseEntry';

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ListChecks },
  { to: '/settings',     label: 'Settings',     icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showForm,    setShowForm]    = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer

  return (
    <div className="min-h-screen bg-background flex">

      {/* ═══ Desktop Sidebar (md+) ═══ */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 fixed top-0 left-0 bottom-0 bg-surface border-r border-border z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center shadow-md shadow-accent/20 shrink-0">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-primary text-sm leading-none truncate">FinTrack</h1>
            <p className="text-[10px] text-muted-custom mt-0.5 truncate">Personal Finance Tracker</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={17} className="shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Add Transaction */}
        <div className="px-3 pb-3 shrink-0">
          <button onClick={() => setShowForm(true)}
            className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus size={15} /> Add Transaction
          </button>
        </div>

        {/* Theme toggle */}
        <div className="border-t border-border p-3 shrink-0">
          <button onClick={toggleTheme} className="nav-item w-full text-left">
            {theme === 'dark' ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* ═══ Mobile Header ═══ */}
      <header className="mobile-header md:hidden fixed top-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4 h-14 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="font-display font-bold text-primary text-sm">FinTrack</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-surface-2 text-muted-custom hover:text-primary transition-colors">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 text-accent font-semibold text-sm border border-accent/25 hover:bg-accent/25 transition-colors">
            <Plus size={15} /> Add
          </button>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 md:ml-60 min-h-screen min-w-0
                       pt-14 md:pt-0
                       pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px))] md:pb-0
                       overflow-x-hidden">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* ═══ Mobile Bottom Nav ═══ */}
      <nav className="bottom-nav md:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
        {/* Floating Add FAB */}
        <button onClick={() => setShowForm(true)} className="bottom-nav-item">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center -mt-5 shadow-lg shadow-accent/35 border-4 border-background">
            <Plus size={20} className="text-white" />
          </div>
          <span className="mt-0.5">Add</span>
        </button>
      </nav>

      <button
        onClick={() => setShowQuickEntry(true)}
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2 rounded-full bg-gradient-to-br from-accent to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-accent/25 hover:shadow-accent/40 transition-all"
      >
        <Plus size={16} /> Add Expense
      </button>

      {/* Transaction Form */}
      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}
      <QuickExpenseEntry isOpen={showQuickEntry} onClose={() => setShowQuickEntry(false)} />
    </div>
  );
}
