import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Mail,
  MessageSquare,
  ShieldCheck,
  FileText,
  Users,
  Settings,
  LogOut,
  PenSquare,
  Sparkles,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useMail } from '../../context/MailContext.js';
import { useTheme } from '../../context/ThemeContext.js';

export const Navbar: React.FC = () => {
  const { user, logout, onlineUserIds } = useAuth();
  const { counts, openCompose, searchQuery, setSearchQuery } = useMail();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  const isOnline = onlineUserIds.includes(user.id);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-4 flex items-center justify-between select-none z-30 relative shadow-sm transition-colors duration-200">
      {/* Brand Logo & Workspace Title */}
      <div className="flex items-center space-x-3">
        <div 
          onClick={() => navigate('/mail')}
          className="flex items-center space-x-2.5 cursor-pointer group select-none py-1"
          title="Cookscape Workspace"
        >
          <img 
            src="/logo.png" 
            alt="Cookscape" 
            className="h-9 sm:h-10 w-auto max-w-[200px] object-contain drop-shadow-sm group-hover:scale-102 transition-transform duration-200" 
          />
          <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#006039]/15 text-[#006039] dark:text-emerald-400 border border-[#006039]/30 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </span>
        </div>
      </div>

      {/* Global Navigation Tabs */}
      <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
        <NavLink
          to="/mail"
          className={({ isActive }) =>
            `flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`
          }
        >
          <Mail className="w-4 h-4" />
          <span className="hidden md:inline">Mailbox</span>
          {counts.inboxUnread > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {counts.inboxUnread}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`
          }
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden md:inline">Chat & Rooms</span>
        </NavLink>

        <NavLink
          to="/templates"
          className={({ isActive }) =>
            `flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`
          }
        >
          <FileText className="w-4 h-4" />
          <span className="hidden md:inline">Templates</span>
        </NavLink>

        <NavLink
          to="/contacts"
          className={({ isActive }) =>
            `flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`
          }
        >
          <Users className="w-4 h-4" />
          <span className="hidden md:inline">Directory</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/20'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-red-500/30'
              }`
            }
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      {/* Right User Bar, Theme Toggle & Search */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Quick Search */}
        <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 w-44 focus-within:w-56 focus-within:border-red-500/50 transition-all">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails, designs..."
            className="bg-transparent border-none outline-none w-full text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* 🌓 Dark / Light Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-red-400 hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-300 hover:border-red-500/30 transition-all shadow-sm flex items-center justify-center"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 text-left"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-red-800 text-white font-bold flex items-center justify-center text-xs shadow-inner">
                {user.name.charAt(0)}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                  isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                }`}
              />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                <span className="truncate max-w-[120px]">{user.name}</span>
                {isAdmin && <ShieldCheck className="w-3 h-3 text-red-600 dark:text-red-400" />}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]">{user.email}</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-200">{user.name}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">{user.email}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 bg-red-500/15 text-red-700 dark:text-red-300 rounded font-medium">
                      {user.department}
                    </span>
                    <span className="text-slate-500">{user.designation}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account & Signature Settings</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigate('/admin');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>Admin Control Center</span>
                  </button>
                )}

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-red-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                    <span>Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">
                    {theme}
                  </span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1 pt-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
