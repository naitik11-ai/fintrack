import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Shield, Settings, ChevronRight, Eye, EyeOff, ExternalLink, RotateCcw, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isFirebaseConfigured } from '../lib/firebase';
import { toast } from 'sonner';

// ------------------------------------------------------------------
// Firebase Setup Wizard — shown when no credentials are configured
// ------------------------------------------------------------------
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const EMPTY_CONFIG: FirebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

function SetupWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'intro' | 'paste' | 'manual'>('intro');
  const [config, setConfig] = useState<FirebaseConfig>(EMPTY_CONFIG);
  const [pasteText, setPasteText] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [saving, setSaving] = useState(false);

  // Parse a pasted firebaseConfig JS/JSON object
  function parseConfig(raw: string): FirebaseConfig | null {
    try {
      // Try JSON first
      const cleaned = raw
        .replace(/\/\/.*/g, '')            // strip // comments
        .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // quote bare keys
        .replace(/'/g, '"')               // single → double quotes
        .replace(/,\s*}/g, '}')          // trailing commas
        .replace(/,\s*]/g, ']');
      const match = cleaned.match(/\{[\s\S]+\}/);
      if (!match) return null;
      const parsed = JSON.parse(match[0]);
      if (!parsed.apiKey || !parsed.projectId) return null;
      return {
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || '',
        projectId: parsed.projectId || '',
        storageBucket: parsed.storageBucket || '',
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
      };
    } catch {
      return null;
    }
  }

  function handleParse() {
    const result = parseConfig(pasteText);
    if (result) {
      setConfig(result);
      setStep('manual');
    } else {
      toast.error('Could not parse the config. Try filling the fields manually.');
      setStep('manual');
    }
  }

  function handleSave() {
    if (!config.apiKey || !config.projectId) {
      toast.error('API Key and Project ID are required.');
      return;
    }
    setSaving(true);
    try {
      localStorage.setItem('fintrack_firebase_config', JSON.stringify(config));
      toast.success('Firebase config saved! Reloading...');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      toast.error('Could not save config to localStorage.');
      setSaving(false);
    }
  }

  function clear() {
    localStorage.removeItem('fintrack_firebase_config');
    setConfig(EMPTY_CONFIG);
    setPasteText('');
    setStep('intro');
  }

  const FIELDS: { key: keyof FirebaseConfig; label: string; placeholder: string; sensitive?: boolean }[] = [
    { key: 'apiKey', label: 'API Key', placeholder: 'AIzaSy...', sensitive: true },
    { key: 'authDomain', label: 'Auth Domain', placeholder: 'your-app.firebaseapp.com' },
    { key: 'projectId', label: 'Project ID', placeholder: 'your-project-id' },
    { key: 'storageBucket', label: 'Storage Bucket', placeholder: 'your-app.appspot.com' },
    { key: 'messagingSenderId', label: 'Messaging Sender ID', placeholder: '123456789' },
    { key: 'appId', label: 'App ID', placeholder: '1:123456:web:abc...' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-6 md:p-8 shadow-2xl relative overflow-hidden w-full max-w-lg"
    >
      <div className="absolute top-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--purple)))' }} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <Settings size={18} className="text-accent" />
        </div>
        <div>
          <h2 className="text-base font-bold text-primary font-display">Firebase Setup</h2>
          <p className="text-xs text-muted-custom">One-time configuration</p>
        </div>
        {step !== 'intro' && (
          <button onClick={clear} className="ml-auto p-1.5 rounded-lg hover:bg-surface-3 text-muted-custom hover:text-primary transition-colors" title="Reset">
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 — Intro */}
        {step === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <p className="text-sm text-secondary mb-5 leading-relaxed">
              FinTrack needs your <strong className="text-primary">Firebase project credentials</strong> to enable Google sign-in and store your transactions.
            </p>

            {/* Step list */}
            <div className="space-y-3 mb-6">
              {[
                { n: '1', text: 'Go to console.firebase.google.com and create a project' },
                { n: '2', text: 'Enable Authentication → Google sign-in provider' },
                { n: '3', text: 'Enable Firestore Database' },
                { n: '4', text: 'Go to Project Settings → Add Web App → copy the config' },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
                  <p className="text-xs text-secondary">{text}</p>
                </div>
              ))}
            </div>

            <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-accent mb-6 hover:underline w-fit">
              <ExternalLink size={12} /> Open Firebase Console
            </a>

            <div className="flex gap-3">
              <button onClick={() => setStep('paste')}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                Paste Firebase Config <ChevronRight size={14} />
              </button>
              <button onClick={() => setStep('manual')}
                className="btn-secondary flex items-center justify-center gap-2">
                Manual
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2 — Paste raw config */}
        {step === 'paste' && (
          <motion.div key="paste" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <p className="text-xs text-secondary mb-3">
              Paste the entire <code className="text-accent bg-surface-2 px-1 py-0.5 rounded text-[10px]">firebaseConfig</code> object from your Firebase project settings:
            </p>
            <textarea
              className="input-field min-h-[140px] font-mono text-xs resize-none mb-4"
              placeholder={`const firebaseConfig = {\n  apiKey: "AIza...",\n  authDomain: "...",\n  projectId: "...",\n  ...\n};`}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setStep('intro')} className="btn-secondary">Back</button>
              <button onClick={handleParse} disabled={!pasteText.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                Parse Config <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3 — Manual fields / review */}
        {step === 'manual' && (
          <motion.div key="manual" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <div className="space-y-3 mb-5">
              {FIELDS.map(({ key, label, placeholder, sensitive }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <div className="relative">
                    <input
                      type={sensitive && !showKeys ? 'password' : 'text'}
                      className="input-field pr-8 text-xs font-mono"
                      placeholder={placeholder}
                      value={config[key]}
                      onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
                    />
                    {sensitive && (
                      <button type="button"
                        onClick={() => setShowKeys(s => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-custom hover:text-primary transition-colors">
                        {showKeys ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Firestore rules reminder */}
            <div className="p-3 rounded-lg bg-surface-2 border border-border/50 mb-4">
              <p className="text-[10px] text-muted-custom leading-relaxed">
                <strong className="text-secondary">⚠ Also set Firestore Security Rules:</strong><br />
                In Firebase Console → Firestore → Rules, paste:<br />
                <code className="text-accent text-[10px]">
                  allow read, write: if request.auth != null && request.auth.uid == userId;
                </code>
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('paste')} className="btn-secondary">Back</button>
              <button onClick={handleSave} disabled={saving || !config.apiKey || !config.projectId}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircle2 size={14} />
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Main Login Page
// ------------------------------------------------------------------
export default function Login() {
  const { signInWithGoogle, loading, configError } = useAuth();
  const [showSetup, setShowSetup] = useState(!isFirebaseConfigured);

  // If we have a config error from Firebase (bad key, etc.) also show setup
  const needsSetup = showSetup || (configError && !isFirebaseConfigured);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent)), transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, hsl(var(--purple)), transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem',
          }} />
      </div>

      <AnimatePresence mode="wait">
        {needsSetup ? (
          <motion.div key="setup"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-lg">
            <SetupWizard onDone={() => setShowSetup(false)} />
          </motion.div>
        ) : (
          <motion.div key="login"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-md">
            <div className="card p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1"
                style={{ background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--purple)))' }} />

              {/* Logo */}
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }} className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center shadow-lg shadow-accent/30 mb-4">
                  <TrendingUp size={30} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-primary font-display">FinTrack</h1>
                <p className="text-muted-custom text-sm mt-1">Smart Personal Finance</p>
              </motion.div>

              {/* Features */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="space-y-3 mb-8">
                {[
                  { icon: TrendingUp, text: 'Real-time dashboards & visual analytics' },
                  { icon: Shield, text: 'Secure, private data storage' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={13} className="text-accent" />
                    </div>
                    <p className="text-sm text-secondary">{text}</p>
                  </div>
                ))}
              </motion.div>

              {/* Sign In Button */}
              <motion.button
                id="google-signin-btn"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 border cursor-pointer"
                style={{
                  background: 'hsl(var(--surface-2))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--text-primary))',
                }}
                whileHover={{ translateY: -1, boxShadow: '0 8px 24px hsl(0 0% 0% / 0.2)' }}
                whileTap={{ translateY: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {loading ? 'Connecting...' : 'Continue with Google'}
              </motion.button>

              {/* Reconfigure link */}
              <button onClick={() => setShowSetup(true)}
                className="w-full text-center text-[11px] text-muted-custom hover:text-accent mt-4 transition-colors flex items-center justify-center gap-1">
                <Settings size={10} /> Change Firebase configuration
              </button>

              <p className="text-center text-xs text-muted-custom mt-3">
                Your financial data is encrypted and stored securely.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
