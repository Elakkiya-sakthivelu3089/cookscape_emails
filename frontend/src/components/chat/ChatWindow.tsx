import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Hash,
  Briefcase,
  User,
  Download,
  FileText,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { useChat } from '../../context/ChatContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Attachment } from '../../types/index.js';

export const ChatWindow: React.FC = () => {
  const { activeRoom, messages, sendMessage, sendTyping, typingUsers, activeRoomId } = useChat();
  const { user } = useAuth();

  const [inputContent, setInputContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (!activeRoom) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8 text-center text-slate-500 select-none transition-colors duration-200">
        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4 shadow-sm dark:shadow-xl">
          <Briefcase className="w-8 h-8 text-red-600 dark:text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300 font-serif">Cookscape Safe Collaboration Hub</h3>
        <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm mt-1">
          Select a channel or client project room from the sidebar to begin discussing interior drawings and site updates safely in-house.
        </p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);
    sendTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await api.post('/mail/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAttachments((prev) => [...prev, res.data]);
      } catch (err) {
        console.error('File upload failed:', err);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() && attachments.length === 0) return;

    setIsSending(true);
    const success = await sendMessage(inputContent, attachments);
    if (success) {
      setInputContent('');
      setAttachments([]);
    }
    setIsSending(false);
  };

  const currentTypingNames = activeRoomId ? typingUsers[activeRoomId] || [] : [];

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      {/* Room Header */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-6 flex items-center justify-between shrink-0 select-none transition-colors duration-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 flex items-center justify-center">
            {activeRoom.type === 'CHANNEL' && <Hash className="w-4 h-4" />}
            {activeRoom.type === 'CLIENT_PROJECT' && <Briefcase className="w-4 h-4" />}
            {activeRoom.type === 'DIRECT' && <User className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">{activeRoom.name}</h3>
              {activeRoom.projectCode && (
                <span className="bg-red-500/15 text-red-700 dark:text-red-300 font-mono text-[10px] px-2 py-0.5 rounded font-semibold border border-red-500/30">
                  {activeRoom.projectCode}
                </span>
              )}
            </div>
            {activeRoom.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{activeRoom.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg">
            🔒 In-House Company Safe
          </span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl font-bold font-serif flex items-center justify-center text-xs shrink-0 ${
                  isMe
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {msg.sender.name.charAt(0)}
              </div>

              {/* Message Bubble & Meta */}
              <div className={`space-y-1 max-w-lg ${isMe ? 'items-end text-right' : ''}`}>
                <div className={`flex items-center space-x-2 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{msg.sender.name}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                    {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-red-600 text-white font-medium rounded-tr-none shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/40">
                      {msg.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs transition-colors"
                        >
                          <FileText className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                          <span className="truncate max-w-[200px] text-slate-800 dark:text-slate-200 font-medium">
                            {att.originalName}
                          </span>
                          <Download className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Real-time Typing Indicator */}
        {currentTypingNames.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 italic">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>{currentTypingNames.join(', ')} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shrink-0 transition-colors duration-200">
        {/* Pending attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att, i) => (
              <span
                key={i}
                className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg text-xs text-slate-800 dark:text-slate-300"
              >
                <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span className="truncate max-w-[150px]">{att.originalName}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-slate-400 hover:text-rose-500 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            title="Attach floor plans, CAD drawings, or images"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputContent}
            onChange={handleInputChange}
            placeholder={`Message #${activeRoom.name}...`}
            className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-red-500/60"
          />

          <button
            type="submit"
            disabled={isSending || (!inputContent.trim() && attachments.length === 0)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 disabled:opacity-50 transition-all hover:scale-102 active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
