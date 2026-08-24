import React from 'react';
import {
  Inbox,
  Star,
  Send,
  FileEdit,
  Archive,
  AlertOctagon,
  Trash2,
  PenSquare,
  Sparkles,
} from 'lucide-react';
import { useMail } from '../../context/MailContext.js';
import { EmailList } from './EmailList.js';
import { EmailThreadView } from './EmailThreadView.js';
import { EmailComposer } from './EmailComposer.js';

export const MailboxLayout: React.FC = () => {
  const { currentFolder, setCurrentFolder, counts, openCompose } = useMail();

  const folderNavItems = [
    { id: 'INBOX', label: 'Inbox', icon: Inbox, badge: counts.inboxUnread },
    { id: 'STARRED', label: 'Starred', icon: Star, count: counts.starredCount },
    { id: 'SENT', label: 'Sent Mail', icon: Send, count: counts.sentCount },
    { id: 'DRAFTS', label: 'Drafts', icon: FileEdit, count: counts.draftsCount },
    { id: 'ARCHIVE', label: 'Archive', icon: Archive },
    { id: 'SPAM', label: 'Spam', icon: AlertOctagon, count: counts.spamCount },
    { id: 'TRASH', label: 'Trash', icon: Trash2, count: counts.trashCount },
  ];

  return (
    <div className="h-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* 1. Left Folders Sidebar */}
      <aside className="w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-3 select-none shrink-0 transition-colors duration-200">
        <div className="space-y-4">
          {/* Main Compose Button */}
          <button
            onClick={() => openCompose()}
            className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all hover:scale-102 active:scale-98"
          >
            <PenSquare className="w-4 h-4" />
            <span>New Email</span>
          </button>

          {/* Folder Links */}
          <nav className="space-y-0.5 text-xs">
            {folderNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentFolder === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentFolder(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300 font-semibold border border-red-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && item.badge === undefined && (
                    <span className="text-slate-400 dark:text-slate-500 text-[11px] font-mono">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Interior Design Shortcuts */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 text-[11px] space-y-1.5">
          <div className="flex items-center space-x-1.5 text-[#006039] dark:text-emerald-400 font-semibold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Design Suite Tip</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-snug">
            Use the template selector inside Compose to instantly insert modular kitchen quotes and BOQ breakdowns.
          </p>
        </div>
      </aside>

      {/* 2. Middle Email List (320px - 400px) */}
      <section className="w-80 lg:w-96 shrink-0 h-full">
        <EmailList />
      </section>

      {/* 3. Right Full Thread Reader (Flex-1) */}
      <main className="flex-1 h-full min-w-0">
        <EmailThreadView />
      </main>

      {/* Pop-up Rich Composer */}
      <EmailComposer />
    </div>
  );
};
