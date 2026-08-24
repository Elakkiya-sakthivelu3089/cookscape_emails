import React, { useState } from 'react';
import {
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  Star,
  Archive,
  Download,
  Paperclip,
  Share2,
  CornerDownLeft,
  Mail,
  FileText,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { useMail } from '../../context/MailContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { FullEmailDetail } from '../../types/index.js';

export const EmailThreadView: React.FC = () => {
  const {
    selectedEmailId,
    selectedEmailDetail,
    selectedThread,
    isLoadingDetail,
    openCompose,
    toggleStar,
    moveToTrash,
    restoreFromTrash,
    deletePermanently,
    currentFolder,
    sendEmail,
  } = useMail();
  const { user } = useAuth();

  const [quickReplyText, setQuickReplyText] = useState('');
  const [isSendingQuickReply, setIsSendingQuickReply] = useState(false);

  if (!selectedEmailId || !selectedEmailDetail) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8 text-center text-slate-500 select-none transition-colors duration-200">
        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4 shadow-sm dark:shadow-xl">
          <Mail className="w-8 h-8 text-red-600 dark:text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300 font-serif">Cookscape Mail Reader</h3>
        <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm mt-1">
          Select an interior design correspondence or client quotation from the list to view its full discussion thread.
        </p>
      </div>
    );
  }

  if (isLoadingDetail) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs transition-colors duration-200">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Loading thread details...</span>
      </div>
    );
  }

  const isTrashFolder = currentFolder === 'TRASH';

  const handleQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReplyText.trim()) return;

    setIsSendingQuickReply(true);
    const success = await sendEmail({
      to: [selectedEmailDetail.senderEmail],
      subject: selectedEmailDetail.subject.startsWith('Re:')
        ? selectedEmailDetail.subject
        : `Re: ${selectedEmailDetail.subject}`,
      bodyHtml: `<p>${quickReplyText.replace(/\n/g, '<br/>')}</p>`,
      threadId: selectedEmailDetail.threadId,
      category: selectedEmailDetail.category,
    });

    if (success) {
      setQuickReplyText('');
    }
    setIsSendingQuickReply(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      {/* Top Action Toolbar */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-4 flex items-center justify-between shrink-0 select-none transition-colors duration-200">
        <div className="flex items-center space-x-1 sm:space-x-2 text-slate-700 dark:text-slate-300 text-xs">
          <button
            onClick={() =>
              openCompose({
                to: selectedEmailDetail.senderEmail,
                subject: selectedEmailDetail.subject.startsWith('Re:')
                  ? selectedEmailDetail.subject
                  : `Re: ${selectedEmailDetail.subject}`,
                threadId: selectedEmailDetail.threadId,
                category: selectedEmailDetail.category,
              })
            }
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="hidden sm:inline">Reply</span>
          </button>

          <button
            onClick={() =>
              openCompose({
                subject: `Fwd: ${selectedEmailDetail.subject}`,
                bodyHtml: `<br/><br/>-------- Forwarded Message --------<br/>From: ${selectedEmailDetail.senderName} &lt;${selectedEmailDetail.senderEmail}&gt;<br/>Subject: ${selectedEmailDetail.subject}<br/><br/>${selectedEmailDetail.bodyHtml}`,
                category: selectedEmailDetail.category,
              })
            }
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
            title="Forward"
          >
            <Forward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Forward</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {isTrashFolder ? (
            <>
              <button
                onClick={() => restoreFromTrash(selectedEmailDetail.id)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition-colors"
              >
                <span>Restore to Inbox</span>
              </button>
              <button
                onClick={() => deletePermanently(selectedEmailDetail.id)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => moveToTrash(selectedEmailDetail.id)}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-600 text-slate-400 dark:text-slate-400 transition-colors"
              title="Move to Trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          Thread: {selectedEmailDetail.threadId.substring(0, 14)}...
        </div>
      </div>

      {/* Main Email & Thread History Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Subject Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-serif leading-tight">
              {selectedEmailDetail.subject}
            </h2>
            <span className="px-2.5 py-1 rounded-md bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 text-xs font-semibold shrink-0">
              {selectedEmailDetail.category}
            </span>
          </div>
        </div>

        {/* Thread Chronological Messages */}
        <div className="space-y-6">
          {selectedThread.map((msg, index) => {
            const isLast = index === selectedThread.length - 1;

            return (
              <div
                key={msg.id}
                className={`rounded-2xl border ${
                  isLast
                    ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-md dark:shadow-xl'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800/60 opacity-90'
                } p-5 space-y-4 transition-colors duration-200`}
              >
                {/* Sender Bar */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white font-bold font-serif flex items-center justify-center shadow-md text-sm">
                      {msg.senderName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{msg.senderName}</span>
                        <span className="font-mono text-red-700 dark:text-red-400 text-xs font-medium">
                          &lt;{msg.senderEmail}&gt;
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        to{' '}
                        {msg.recipients
                          ?.map((r) => r.recipientName || r.recipientEmail)
                          .join(', ') || 'Team'}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, yyyy, h:mm a') : ''}
                  </div>
                </div>

                {/* Email Body Content */}
                <div
                  className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed font-sans pt-2 border-t border-slate-100 dark:border-slate-800/40"
                  dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                />

                {/* Attachments list for this message */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/60 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span>Attached Design Files & Documents ({msg.attachments.length}):</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs transition-colors group"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-slate-800 dark:text-slate-200 font-medium truncate group-hover:text-red-600 dark:group-hover:text-red-400">
                                {att.originalName}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {(att.size / 1024).toFixed(0)} KB • {att.mimeType}
                              </p>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Inline Quick Reply Box */}
        <form
          onSubmit={handleQuickReply}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl space-y-3 transition-colors duration-200"
        >
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Reply className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Quick Reply to {selectedEmailDetail.senderName}</span>
          </div>

          <textarea
            rows={3}
            value={quickReplyText}
            onChange={(e) => setQuickReplyText(e.target.value)}
            placeholder="Write a quick reply or status update..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60 resize-none"
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                openCompose({
                  to: selectedEmailDetail.senderEmail,
                  subject: `Re: ${selectedEmailDetail.subject}`,
                  threadId: selectedEmailDetail.threadId,
                  category: selectedEmailDetail.category,
                })
              }
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-500 font-medium"
            >
              Open Full Rich Composer
            </button>

            <button
              type="submit"
              disabled={isSendingQuickReply || !quickReplyText.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 disabled:opacity-50 transition-all"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>{isSendingQuickReply ? 'Sending...' : 'Send Reply'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
