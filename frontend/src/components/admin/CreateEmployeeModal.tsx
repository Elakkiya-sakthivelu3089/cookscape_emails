import React, { useState } from 'react';
import { X, KeyRound, Copy, Check, UserPlus, Sparkles, Shield, HardDrive } from 'lucide-react';
import { api } from '../../services/api.js';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Design');
  const [designation, setDesignation] = useState('Interior Designer');
  const [phone, setPhone] = useState('');
  const [quotaGb, setQuotaGb] = useState(5);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Generated credential state
  const [createdEmployee, setCreatedEmployee] = useState<{
    name: string;
    email: string;
    temporaryPassword: string;
    department: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Cookscape#';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/admin/employees', {
        username,
        name,
        department,
        designation,
        phone,
        quotaGb,
        password: password || undefined,
      });

      setCreatedEmployee({
        name: res.data.employee.name,
        email: res.data.employee.email,
        temporaryPassword: res.data.employee.temporaryPassword,
        department: res.data.employee.department,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create employee account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCard = () => {
    if (!createdEmployee) return;
    const cardText = `==============================\nCOOKSCAPE EMPLOYEE WORKSPACE ACCESS\n==============================\nName: ${createdEmployee.name}\nOfficial Email: ${createdEmployee.email}\nTemporary Password: ${createdEmployee.temporaryPassword}\nDepartment: ${createdEmployee.department}\nWebmail Portal: ${window.location.origin}/login\n==============================\nPlease change your password on first login.`;
    navigator.clipboard.writeText(cardText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetForm = () => {
    setUsername('');
    setName('');
    setDepartment('Design');
    setDesignation('Interior Designer');
    setPhone('');
    setPassword('');
    setCreatedEmployee(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Create Employee Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Provision official @cookscape.com email & credentials</p>
            </div>
          </div>
          <button
            onClick={handleResetForm}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {createdEmployee ? (
            /* Success & Credential Card View */
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">Employee Account Created!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Share these credentials securely with the employee.
                </p>
              </div>

              {/* Printable / Copyable Credential Slip */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-red-500/30 relative group shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-serif font-bold text-red-600 dark:text-red-400 text-sm">COOKSCAPE WORKSPACE</span>
                  <span className="text-[10px] bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-mono font-bold">
                    EMPLOYEE PASS
                  </span>
                </div>

                <div className="space-y-2.5 mt-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Employee Name</span>
                    <p className="text-slate-900 dark:text-slate-100 font-medium">{createdEmployee.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Official Email</span>
                    <p className="text-red-700 dark:text-red-300 font-mono font-medium">{createdEmployee.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Temporary Password</span>
                    <p className="text-emerald-700 dark:text-emerald-400 font-mono font-bold tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded inline-block">
                      {createdEmployee.temporaryPassword}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Login URL</span>
                    <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{window.location.origin}/login</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCard}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-lg shadow-red-600/20 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Credentials Card</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!username) {
                      setUsername(e.target.value.toLowerCase().replace(/\s+/g, '.'));
                    }
                  }}
                  placeholder="e.g. Ananya Sundaram"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
                />
              </div>

              {/* Email Username & Domain Preview */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Company Email Address <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden focus-within:border-red-500/60">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="ananya.design"
                    className="flex-1 bg-transparent px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
                  />
                  <span className="bg-slate-100 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 px-3 py-2 text-red-700 dark:text-red-400 font-medium font-mono text-xs select-none">
                    @cookscape.com
                  </span>
                </div>
              </div>

              {/* Department & Designation Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500/60"
                  >
                    <option value="Design">Interior Design Studio</option>
                    <option value="Modular Kitchen">Modular Kitchen & Finishes</option>
                    <option value="Architecture">3D Visualization & CAD</option>
                    <option value="Site Ops">Site Execution & Ops</option>
                    <option value="Client Relations">Client Relations & Sales</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Interior Designer"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
                  />
                </div>
              </div>

              {/* Quota and Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 flex items-center space-x-1">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>Storage Quota</span>
                  </label>
                  <select
                    value={quotaGb}
                    onChange={(e) => setQuotaGb(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500/60"
                  >
                    <option value={2}>2 GB (Basic)</option>
                    <option value={5}>5 GB (Standard)</option>
                    <option value={10}>10 GB (Designer CAD/3D)</option>
                    <option value={25}>25 GB (Enterprise High Storage)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98400 00000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
                  />
                </div>
              </div>

              {/* Temporary Password with Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-medium">Initial Password</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-red-600 dark:text-red-400 hover:text-red-500 flex items-center space-x-1 text-[11px] font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to auto-generate"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-3 pr-8 py-2 text-slate-900 dark:text-slate-100 font-mono text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Employee will be prompted to set a new personal password upon their first login.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md shadow-red-600/20 disabled:opacity-50 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isLoading ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
