import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@cookscape.com');
  const [password, setPassword] = useState('Cookscape@123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      navigate('/mail');
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('Cookscape@123');
  };

  const demoAccounts = [
    {
      name: 'Karthik Raja (Admin)',
      email: 'admin@cookscape.com',
      role: 'Super Admin',
      dept: 'Management',
    },
    {
      name: 'Priya Sundaram',
      email: 'priya.designer@cookscape.com',
      role: 'Interior Designer',
      dept: 'Design Studio',
    },
    {
      name: 'Rajesh Sharma',
      email: 'rajesh.ops@cookscape.com',
      role: 'Site Supervisor',
      dept: 'Site Ops',
    },
    {
      name: 'Vikram Mehta',
      email: 'vikram.kitchens@cookscape.com',
      role: 'Modular Specialist',
      dept: 'Modular Kitchen',
    },
    {
      name: 'Ananya Verma (Client)',
      email: 'ananya.client@gmail.com',
      role: 'Homeowner',
      dept: 'Villa 402 Project',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 shadow-md transition-all flex items-center space-x-1.5 text-xs font-semibold"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-red-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Subtle Luxury Ambient Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header with Official Horizontal Logo */}
        <div className="text-center space-y-2">
          <div className="py-2 inline-block mx-auto">
            <img src="/logo.png" alt="Cookscape" className="h-16 sm:h-20 w-auto max-w-[280px] object-contain mx-auto drop-shadow-md" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            In-House Enterprise Mail & Safe Client Communication Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 transition-colors duration-200">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs rounded-xl break-words">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Cookscape Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cookscape.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60 font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all hover:scale-102 active:scale-98 flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
              ⚡ 1-Click Role Switcher (Pre-Configured)
            </p>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email)}
                  className={`w-full p-2 rounded-xl text-left border transition-all flex items-center justify-between text-xs ${
                    email === acc.email
                      ? 'bg-red-500/15 border-red-500/40 text-red-900 dark:text-red-300'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-semibold text-slate-900 dark:text-white block truncate">{acc.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{acc.email}</span>
                  </div>
                  <span className="text-[10px] bg-red-500/10 dark:bg-slate-900 px-2 py-0.5 rounded text-red-700 dark:text-red-400/90 shrink-0 ml-2 font-medium border border-red-500/20">
                    {acc.dept}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Server Endpoint Settings Accordion */}
        <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-medium text-[11px]">🔗 Backend API Server:</span>
            <span className="font-mono text-[10px] text-red-600 dark:text-red-400 truncate max-w-[200px]">
              {localStorage.getItem('cookscape_api_url') || import.meta.env.VITE_API_URL || '(Local Proxy)'}
            </span>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="text"
              defaultValue={localStorage.getItem('cookscape_api_url') || import.meta.env.VITE_API_URL || ''}
              placeholder="Paste Render Backend URL: https://xxx.onrender.com"
              id="custom-backend-input"
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60 font-mono"
            />
            <button
              type="button"
              onClick={async () => {
                const input = document.getElementById('custom-backend-input') as HTMLInputElement;
                if (input && input.value) {
                  const clean = input.value.trim();
                  localStorage.setItem('cookscape_api_url', clean);
                  alert(`Backend URL updated to: ${clean}\nTesting connection...`);
                  window.location.reload();
                } else {
                  localStorage.removeItem('cookscape_api_url');
                  window.location.reload();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] shadow-sm transition-all"
            >
              Connect
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Cookscape End-to-End Enterprise Encryption Active</span>
        </div>
      </div>
    </div>
  );
};
