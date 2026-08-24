import React from 'react';
import { Star, Paperclip, Tag, AlertCircle, Sparkles, Inbox, Clock } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useMail } from '../../context/MailContext.js';
import { EmailItem } from '../../types/index.js';

export const EmailList: React.FC = () => {
  const {
    emails,
    selectedEmailId,
    setSelectedEmailId,
    categoryFilter,
    setCategoryFilter,
    toggleStar,
    isLoadingList,
  } = useMail();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isToday(d)) return format(d, 'HH:mm');
      if (isYesterday(d)) return 'Yesterday';
      return format(d, 'MMM d');
    } catch {
      return '';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'PROPOSAL':
        return <span className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 text-[10px] px-1.5 py-0.2 rounded font-medium">Proposal</span>;
      case 'QUOTATION':
        return <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0.2 rounded font-medium">Quotation</span>;
      case 'SITE_UPDATE':
        return <span className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[10px] px-1.5 py-0.2 rounded font-medium">Site Status</span>;
      default:
        return null;
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Messages' },
    { id: 'PROPOSAL', label: 'Design Proposals' },
    { id: 'QUOTATION', label: 'Quotations' },
    { id: 'SITE_UPDATE', label: 'Site Updates' },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none transition-colors duration-200">
      {/* Category Pills Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center space-x-1.5 overflow-x-auto shrink-0">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              categoryFilter === c.id
                ? 'bg-red-600 text-white font-bold shadow-sm shadow-red-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Email List Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {isLoadingList ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p>Loading messages...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-600 dark:text-slate-400">No emails in this folder</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-0.5">Your communication is all caught up.</p>
            </div>
          </div>
        ) : (
          emails.map((item) => {
            const isSelected = selectedEmailId === item.emailId;

            return (
              <div
                key={item.recipientRecordId}
                onClick={() => setSelectedEmailId(item.emailId)}
                className={`p-3.5 cursor-pointer transition-all flex flex-col space-y-1.5 relative group ${
                  isSelected
                    ? 'bg-red-500/10 border-l-4 border-red-600'
                    : item.isRead
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-90 hover:opacity-100'
                    : 'bg-red-50/40 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold'
                }`}
              >
                {/* Top Row: Sender + Star + Date */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        item.isRead ? 'text-slate-700 dark:text-slate-300 font-normal' : 'text-slate-900 dark:text-white font-bold'
                      }`}
                    >
                      {item.senderName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                    {item.hasAttachments && (
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(item.emailId, item.isStarred);
                      }}
                      className="text-slate-400 hover:text-amber-500"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          item.isStarred ? 'text-amber-500 fill-amber-500' : ''
                        }`}
                      />
                    </button>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>

                {/* Middle Row: Subject + Category Badge */}
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs truncate ${
                      item.isRead ? 'text-slate-800 dark:text-slate-200' : 'text-red-700 dark:text-red-400 font-semibold'
                    }`}
                  >
                    {item.subject}
                  </span>
                  {getCategoryBadge(item.category)}
                </div>

                {/* Bottom Row: Text Snippet */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate line-clamp-1 font-normal">
                  {item.snippet || '(No content)'}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
