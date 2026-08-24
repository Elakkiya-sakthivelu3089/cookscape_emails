import React, { useState } from 'react';
import { Settings, Shield, KeyRound, Check, FileCode, User, Phone, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [signatureHtml, setSignatureHtml] = useState(user?.signatureHtml || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const success = await updateProfile({ name, phone, signatureHtml });
    setIsSavingProfile(false);
    if (success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordMsg('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.error || 'Failed to change password.');
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-950 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-4xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Employee Settings & Signature</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize your outgoing Cookscape email signature, workspace appearance, and secure your account credentials.
        </p>
      </div>

      {/* Theme Selection Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span>Workspace Appearance & Mode</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select your preferred visual mode for the Cookscape workspace.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border flex items-center space-x-3 transition-all ${
              theme === 'light'
                ? 'bg-red-500/15 border-red-500 text-red-900 font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-600 flex items-center justify-center">
              <Sun className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold">Light Mode</p>
              <p className="text-[10px] text-slate-500">Crisp white & Cookscape crimson</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border flex items-center space-x-3 transition-all ${
              theme === 'dark'
                ? 'bg-red-500/15 border-red-500 text-red-300 font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-red-400 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold">Dark Mode</p>
              <p className="text-[10px] text-slate-500">Obsidian luxury & crimson glow</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Profile & Email Signature */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <User className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Profile & Outgoing Signature</span>
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Company Email</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-red-700 dark:text-red-300/80 font-mono text-xs opacity-80 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98400 00000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>HTML Email Signature</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Auto-appends to sent emails</span>
              </label>
              <textarea
                rows={4}
                value={signatureHtml}
                onChange={(e) => setSignatureHtml(e.target.value)}
                placeholder="<p><strong>Priya Sundaram</strong><br/>Senior Interior Designer</p>"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 font-mono text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60 resize-none"
              />
            </div>

            {/* Signature Preview */}
            {signatureHtml && (
              <div className="p-3 bg-slate-50 dark:bg-white rounded-xl text-slate-900 text-xs shadow-inner border border-slate-200 dark:border-none">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Preview:</span>
                <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all flex items-center justify-center space-x-1.5"
            >
              {profileSuccess ? <Check className="w-4 h-4" /> : null}
              <span>{profileSuccess ? 'Saved!' : isSavingProfile ? 'Saving...' : 'Save Profile & Signature'}</span>
            </button>
          </form>
        </div>

        {/* 2. Change Password */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-emerald-500" />
            <span>Security & Password Update</span>
          </h2>

          {passwordMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs">
              {passwordMsg}
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 rounded-xl text-xs">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">New Password (Min 6 characters)</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
