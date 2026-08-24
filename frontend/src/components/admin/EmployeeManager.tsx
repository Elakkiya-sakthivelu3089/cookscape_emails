import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  KeyRound,
  Shield,
  HardDrive,
  CheckCircle2,
  XCircle,
  MoreVertical,
  RefreshCw,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { CreateEmployeeModal } from './CreateEmployeeModal.js';

export const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<any | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/employees', {
        params: {
          search: search || undefined,
          department: department !== 'ALL' ? department : undefined,
        },
      });
      setEmployees(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, department]);

  const toggleStatus = async (user: any) => {
    try {
      await api.put(`/admin/employees/${user.id}`, {
        isActive: !user.isActive,
      });
      setEmployees((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleResetPassword = async (user: any) => {
    try {
      const res = await api.post(`/admin/employees/${user.id}/reset-password`);
      setResettingUser(user);
      setGeneratedPassword(res.data.temporaryPassword);
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  const formatBytes = (bytesStr: string) => {
    const bytes = Number(bytesStr || 0);
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const getStoragePercentage = (usedStr: string, quotaStr: string) => {
    const used = Number(usedStr || 0);
    const quota = Number(quotaStr || 1);
    return Math.min(100, Math.round((used / quota) * 100));
  };

  const departments = [
    { id: 'ALL', label: 'All Departments' },
    { id: 'Design', label: 'Design Studio' },
    { id: 'Modular Kitchen', label: 'Modular Kitchen' },
    { id: 'Architecture', label: 'CAD & 3D' },
    { id: 'Site Ops', label: 'Site Ops' },
    { id: 'Client Relations', label: 'Client Relations' },
    { id: 'Management', label: 'Management' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors duration-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Employee Mailboxes & Accounts</span>
            <span className="text-xs bg-red-500/15 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full border border-red-500/30 font-medium">
              {employees.length} Accounts
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage official <span className="text-red-600 dark:text-red-400 font-mono font-medium">@cookscape.com</span> emails, reset passwords, and allocate storage quotas.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchEmployees}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-red-600/20 transition-all hover:scale-102 active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Employee</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or title..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500/60 transition-colors"
          />
        </div>

        {/* Department Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setDepartment(dept.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                department === dept.id
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Official Email</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Mailbox Storage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No employee accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const percent = getStoragePercentage(emp.usedStorageBytes, emp.quotaBytes);
                  const isSuper = emp.role === 'SUPER_ADMIN';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-center font-bold font-serif text-xs">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                              <span>{emp.name}</span>
                              {isSuper && (
                                <span className="bg-red-500/20 text-red-700 dark:text-red-300 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                                  ADMIN
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{emp.designation}</p>
                          </div>
                        </div>
                      </td>

                      {/* Official Email */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-red-700 dark:text-red-300 font-medium">
                          {emp.email}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                          {emp.department}
                        </span>
                      </td>

                      {/* Mailbox Storage */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>{formatBytes(emp.usedStorageBytes)}</span>
                            <span className="text-slate-400 dark:text-slate-500">/ {formatBytes(emp.quotaBytes)}</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                percent > 85
                                  ? 'bg-rose-500'
                                  : percent > 60
                                  ? 'bg-red-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(4, percent)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          disabled={isSuper}
                          onClick={() => toggleStatus(emp)}
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            emp.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
                          }`}
                        >
                          {emp.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Disabled</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleResetPassword(emp)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-red-500/15 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-300 border border-slate-200 dark:border-slate-800 hover:border-red-500/30 transition-colors text-[11px]"
                            title="Generate new password for employee"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Reset Pass</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal Notification */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Password Reset Successful</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{resettingUser.email}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <p className="text-slate-600 dark:text-slate-400">New Temporary Password for {resettingUser.name}:</p>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm tracking-wider flex items-center justify-between">
                <span>{generatedPassword}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Email: ${resettingUser.email}\nTemporary Password: ${generatedPassword}\nLogin: ${window.location.origin}/login`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                The employee will be required to change their password upon signing in.
              </p>
            </div>

            <button
              onClick={() => {
                setResettingUser(null);
                setGeneratedPassword('');
              }}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      <CreateEmployeeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchEmployees}
      />
    </div>
  );
};
