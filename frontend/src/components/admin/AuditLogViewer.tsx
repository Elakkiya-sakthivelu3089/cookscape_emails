import React, { useState, useEffect } from 'react';
import { Shield, Clock, Search, Filter, AlertCircle, CheckCircle, User, Mail, Key } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../services/api.js';
import { AuditLog } from '../../types/index.js';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/audit-logs', {
        params: { action: actionFilter || undefined },
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">LOGIN_SUCCESS</span>;
      case 'EMAIL_SENT':
        return <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono text-[10px]">EMAIL_SENT</span>;
      case 'EMPLOYEE_CREATED':
        return <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 font-mono text-[10px]">EMPLOYEE_CREATED</span>;
      case 'ADMIN_PASSWORD_RESET':
      case 'PASSWORD_CHANGED':
        return <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono text-[10px]">SECURITY_KEY</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">{action}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/30">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Security & Activity Audit Trail</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">All authentication, account provisioning, and corporate email events</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-red-500/50"
          >
            <option value="">All Security Events</option>
            <option value="LOGIN_SUCCESS">Logins</option>
            <option value="EMAIL_SENT">Emails Dispatched</option>
            <option value="EMPLOYEE_CREATED">Employee Provisioning</option>
            <option value="ADMIN_PASSWORD_RESET">Password Resets</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl transition-colors duration-200">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              No audit records found.
            </div>
          ) : (
            logs.map((log) => {
              let parsedDetails: any = null;
              try {
                if (log.details) parsedDetails = JSON.parse(log.details);
              } catch (e) {}

              return (
                <div key={log.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-start justify-between text-xs">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">{getActionBadge(log.action)}</div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        <span>{log.user ? `${log.user.name} (${log.user.email})` : 'System / Anonymous'}</span>
                      </p>
                      {parsedDetails && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 space-x-2">
                          {parsedDetails.createdEmail && (
                            <span>Target: <strong className="text-red-700 dark:text-red-300">{parsedDetails.createdEmail}</strong></span>
                          )}
                          {parsedDetails.subject && (
                            <span>Subject: <span className="text-slate-700 dark:text-slate-300">"{parsedDetails.subject}"</span></span>
                          )}
                          {parsedDetails.to && (
                            <span>To: {Array.isArray(parsedDetails.to) ? parsedDetails.to.join(', ') : parsedDetails.to}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 dark:text-slate-500 shrink-0 ml-4">
                    <p>{log.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss') : ''}</p>
                    <p className="font-mono text-[10px] text-slate-400 dark:text-slate-600">{log.ipAddress}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
