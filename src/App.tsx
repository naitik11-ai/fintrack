import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/"             element={<Dashboard />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/settings"     element={<SettingsPage />} />
              <Route path="*"             element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(222 40% 7%)',
                border: '1px solid hsl(222 25% 20%)',
                color: 'hsl(210 40% 96%)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              },
            }}
            richColors
          />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
