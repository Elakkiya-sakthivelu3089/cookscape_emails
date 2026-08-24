import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, MessageSquare, Phone, Building, Sparkles } from 'lucide-react';
import { api } from '../../services/api.js';
import { useMail } from '../../context/MailContext.js';
import { useChat } from '../../context/ChatContext.js';
import { useNavigate } from 'react-router-dom';

export const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const { openCompose } = useMail();
  const { createRoom } = useChat();
  const navigate = useNavigate();

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/contacts', { params: { q: search || undefined } });
      setContacts(res.data.contacts || []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [search]);

  const filtered = contacts.filter((c) => {
    if (selectedDept !== 'ALL' && c.department !== selectedDept) return false;
    return true;
  });

  const handleStartChat = async (contact: any) => {
    const res = await createRoom({
      type: 'DIRECT',
      memberUserIds: [contact.id],
    });
    if (res.success) {
      navigate('/chat');
    }
  };

  const handleSendMail = (contact: any) => {
    openCompose({ to: contact.email });
    navigate('/mail');
  };

  const depts = ['ALL', 'Design', 'Modular Kitchen', 'Architecture', 'Site Ops', 'Client Relations', 'Management'];

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-950 p-6 lg:p-8 space-y-6 overflow-y-auto transition-colors duration-200">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Company Address Book</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Cookscape Studio Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Internal directory of interior designers, modular kitchen engineers, site supervisors, and active project clients.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search directory by name, email, department..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500/60"
          />
        </div>
      </div>

      {/* Department Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {depts.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDept(d)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              selectedDept === d
                ? 'bg-red-600 text-white font-bold shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {d === 'ALL' ? 'All Directory' : d}
          </button>
        ))}
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-red-500/15 text-red-700 dark:text-red-400 font-serif font-bold text-base flex items-center justify-center border border-red-500/30 shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
                <p className="text-[11px] text-red-700 dark:text-red-300 font-mono">{c.email}</p>
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    {c.department}
                  </span>
                  <span>{c.designation}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => handleSendMail(c)}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 text-xs font-semibold transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Send Email</span>
              </button>
              <button
                onClick={() => handleStartChat(c)}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/10 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Direct Chat</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
