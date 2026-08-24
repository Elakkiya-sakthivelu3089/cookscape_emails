import React, { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  HardDrive,
  MessageSquare,
  ShieldCheck,
  Building,
  TrendingUp,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { AdminStats } from '../../types/index.js';
import { EmployeeManager } from './EmployeeManager.js';
import { AuditLogViewer } from './AuditLogViewer.js';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'AUDIT' | 'OVERVIEW'>('EMPLOYEES');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard-stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatStorage = (bytesStr: string) => {
    const bytes = Number(bytesStr || 0);
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto transition-colors duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-red-50 dark:from-slate-900 dark:via-slate-900 dark:to-red-950/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md dark:shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-red-500/15 text-red-700 dark:text-red-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-500/30 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Administrator Portal</span>
              </span>
              <span className="text-slate-500 text-xs font-mono">domain: @cookscape.com</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
              Cookscape Workspace Control Center
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Full administrative authority over employee emails, storage allocation, design project chat rooms, and enterprise security compliance.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'EMPLOYEES'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Employees & Mailboxes</span>
            </button>
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'AUDIT'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Inboxes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/40 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Employee Inboxes</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-serif">{stats?.activeUsers || 0}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active @cookscape.com mailboxes</p>
          </div>
        </div>

        {/* Total Emails Sent */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/40 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Emails Processed</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-serif">{stats?.totalEmails || 0}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Internal & client correspondences</p>
          </div>
        </div>

        {/* Project Chat Rooms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/40 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Project Rooms</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-serif">
              {(stats?.totalChannels || 0) + (stats?.totalClientRooms || 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats?.totalClientRooms || 0} client project rooms active
            </p>
          </div>
        </div>

        {/* Storage Consumed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-red-500/40 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Server Storage</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-serif">
              {formatStorage(stats?.totalStorageUsedBytes || '0')}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">CAD plans, renders & attachments</p>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'EMPLOYEES' && <EmployeeManager />}
      {activeTab === 'AUDIT' && <AuditLogViewer />}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Building className="w-4 h-4 text-red-400" />
              <span>Employees by Interior Design Department</span>
            </h3>
            <div className="space-y-3 text-xs">
              {stats?.departmentDistribution?.map((d) => (
                <div key={d.department} className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>{d.department}</span>
                    <span className="font-semibold text-red-300">{d.count} Members</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-red-600 h-full rounded-full"
                      style={{
                        width: `${Math.max(10, (d.count / (stats?.totalUsers || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Organization Policy */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>In-House Privacy & Security Directives</span>
            </h3>
            <div className="text-xs text-slate-400 space-y-3">
              <p className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                🔒 <strong>100% In-House Data Isolation:</strong> Client drawings, quotation rates, and employee chats are strictly stored on internal server databases with no third-party telemetry.
              </p>
              <p className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                📧 <strong>Employee Mailbox Governance:</strong> Accounts can be instantly provisioned, reassigned, or revoked without losing previous project threads and CAD attachments.
              </p>
              <p className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                🛡️ <strong>Password & Credential Issuance:</strong> Generated temporary passes mandate an employee password change on first sign-in.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
