import React, { useState, useEffect } from 'react';
import { X, Hash, MessageSquare, Briefcase, Plus, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

interface NewRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewRoomModal: React.FC<NewRoomModalProps> = ({ isOpen, onClose }) => {
  const { createRoom } = useChat();
  const { user } = useAuth();

  const [type, setType] = useState<'CHANNEL' | 'CLIENT_PROJECT' | 'DIRECT'>('CHANNEL');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/contacts').then((res) => {
        const otherContacts = (res.data.contacts || []).filter((c: any) => c.id !== user?.id);
        setContacts(otherContacts);
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const toggleUserSelection = (userId: string) => {
    if (type === 'DIRECT') {
      setSelectedUserIds([userId]);
    } else {
      setSelectedUserIds((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (type === 'DIRECT' && selectedUserIds.length === 0) {
      setError('Please select a colleague for direct messaging.');
      return;
    }

    if (type !== 'DIRECT' && !name.trim()) {
      setError('Room name is required.');
      return;
    }

    setIsLoading(true);
    const result = await createRoom({
      type,
      name: type === 'DIRECT' ? undefined : name,
      description: description || undefined,
      projectCode: type === 'CLIENT_PROJECT' ? projectCode : undefined,
      clientName: type === 'CLIENT_PROJECT' ? clientName : undefined,
      memberUserIds: selectedUserIds,
    });

    setIsLoading(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to create room.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Start New Conversation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Channels, Direct Messages & Client Project Portals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Type Switcher */}
        <div className="p-6 pb-2">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setType('CHANNEL');
                setSelectedUserIds([]);
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg font-medium transition-all ${
                type === 'CHANNEL'
                  ? 'bg-red-600 text-white font-bold shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Channel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('CLIENT_PROJECT');
                setSelectedUserIds([]);
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg font-medium transition-all ${
                type === 'CLIENT_PROJECT'
                  ? 'bg-red-600 text-white font-bold shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Client Project</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('DIRECT');
                setSelectedUserIds([]);
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg font-medium transition-all ${
                type === 'DIRECT'
                  ? 'bg-red-600 text-white font-bold shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Direct Chat</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 pt-3 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {type !== 'DIRECT' && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                {type === 'CHANNEL' ? 'Channel Name' : 'Project Title'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  type === 'CHANNEL'
                    ? 'e.g. modular-kitchens or site-supervisors'
                    : 'e.g. Villa 402 - Living & Kitchen Renovation'
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
              />
            </div>
          )}

          {type === 'CLIENT_PROJECT' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Project Code</label>
                <input
                  type="text"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  placeholder="e.g. CK-2026-VILLA402"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Client / Homeowner Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Ms. Ananya Verma"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
                />
              </div>
            </div>
          )}

          {type !== 'DIRECT' && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this channel or project room for?"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
              />
            </div>
          )}

          {/* Members / Target User Selection */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
              {type === 'DIRECT' ? 'Select Colleague to Message' : 'Assign Team Members & Clients'}
            </label>
            <div className="max-h-44 overflow-y-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
              {contacts.map((c) => {
                const isSelected = selectedUserIds.includes(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => toggleUserSelection(c.id)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-red-500/15 text-slate-900 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-700 dark:text-red-400 font-bold font-serif flex items-center justify-center text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-xs leading-none">{c.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{c.designation} • {c.department}</p>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-md shadow-red-600/20 disabled:opacity-50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isLoading ? 'Creating...' : 'Create Conversation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
