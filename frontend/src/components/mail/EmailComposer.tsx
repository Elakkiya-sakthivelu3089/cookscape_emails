import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Paperclip,
  Send,
  Sparkles,
  FileText,
  Trash2,
  Image as ImageIcon,
  Smile,
  Link as LinkIcon,
  ChevronDown,
  Check,
  PenTool,
} from 'lucide-react';
import { useMail } from '../../context/MailContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { EmailTemplate, Attachment } from '../../types/index.js';
import { RichTextEditor } from './RichTextEditor.js';

export const EmailComposer: React.FC = () => {
  const { isComposeOpen, closeCompose, composeDraftData, sendEmail } = useMail();
  const { user } = useAuth();

  // Window State: 'normal' | 'expanded' | 'minimized' (Google Gmail style)
  const [windowMode, setWindowMode] = useState<'normal' | 'expanded' | 'minimized'>('normal');

  const [to, setTo] = useState<string>('');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [importance, setImportance] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [category, setCategory] = useState<'GENERAL' | 'PROPOSAL' | 'QUOTATION' | 'SITE_UPDATE' | 'BILLING'>('GENERAL');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showFormattingBar, setShowFormattingBar] = useState(true);

  // Template dropdown state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Directory autocomplete
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isComposeOpen) {
      // Load templates
      api.get('/templates').then((res) => setTemplates(res.data.templates || []));
      // Load directory contacts
      api.get('/contacts').then((res) => setContacts(res.data.contacts || []));

      if (composeDraftData) {
        if (composeDraftData.to) setTo(Array.isArray(composeDraftData.to) ? composeDraftData.to.join(', ') : composeDraftData.to);
        if (composeDraftData.subject) setSubject(composeDraftData.subject);
        if (composeDraftData.bodyHtml) setBodyHtml(composeDraftData.bodyHtml);
        if (composeDraftData.category) setCategory(composeDraftData.category);
      } else if (!bodyHtml && user?.signatureHtml) {
        // Append user signature
        setBodyHtml(`<p><br/></p><p><br/></p><p>--</p>${user.signatureHtml}`);
      }
    }
  }, [isComposeOpen, composeDraftData]);

  if (!isComposeOpen) return null;

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTo(val);

    const lastQuery = val.split(',').pop()?.trim().toLowerCase() || '';
    if (lastQuery.length > 0) {
      const matches = contacts.filter(
        (c) => c.name.toLowerCase().includes(lastQuery) || c.email.toLowerCase().includes(lastQuery)
      );
      setFilteredContacts(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectContact = (contact: any) => {
    const parts = to.split(',');
    parts.pop(); // remove last typed query
    parts.push(` ${contact.email}`);
    setTo(parts.join(',').trim().replace(/^,/, ''));
    setShowSuggestions(false);
  };

  const handleInsertTemplate = (tpl: EmailTemplate) => {
    setSubject(tpl.subject);
    setCategory(tpl.category as any);
    const signature = user?.signatureHtml ? `<p><br/></p><p>--</p>${user.signatureHtml}` : '';
    setBodyHtml(`${tpl.bodyHtml}${signature}`);
    setShowTemplateDropdown(false);
  };

  const handleInsertSignature = () => {
    if (user?.signatureHtml) {
      setBodyHtml((prev) => `${prev}<p><br/></p><p>--</p>${user.signatureHtml}`);
    }
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

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const toList = to.split(',').map((s) => s.trim()).filter(Boolean);
    const ccList = cc ? cc.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const bccList = bcc ? bcc.split(',').map((s) => s.trim()).filter(Boolean) : [];

    if (toList.length === 0) {
      alert('Please specify at least one recipient.');
      return;
    }

    setIsSending(true);
    await sendEmail({
      to: toList,
      cc: ccList,
      bcc: bccList,
      subject,
      bodyHtml,
      importance,
      category,
      attachments,
      threadId: composeDraftData?.threadId,
    });
    setIsSending(false);
  };

  // 1. Minimized Mode: Compact Floating Dock Bar (Like Gmail)
  if (windowMode === 'minimized') {
    return (
      <div
        onClick={() => setWindowMode('normal')}
        className="fixed bottom-0 right-4 sm:right-8 z-50 w-72 sm:w-80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-t-xl shadow-2xl overflow-hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/90 transition-all flex items-center justify-between px-3.5 py-2.5 animate-in slide-in-from-bottom-3"
      >
        <div className="flex items-center space-x-2 truncate">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
          <span className="text-xs font-semibold truncate font-sans">
            {subject ? subject : 'New Message'}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setWindowMode('normal');
            }}
            className="p-1 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Restore size"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeCompose();
            }}
            className="p-1 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Normal & Expanded Window Container
  const isExpanded = windowMode === 'expanded';

  return (
    <>
      {/* Dimmed backdrop when in expanded full-screen mode */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setWindowMode('normal')}
        />
      )}

      <div
        className={`fixed z-50 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isExpanded
            ? 'inset-3 sm:inset-6 md:inset-8 lg:inset-10 rounded-2xl animate-in zoom-in-95'
            : 'bottom-0 right-4 sm:right-8 w-full max-w-2xl h-[600px] max-h-[90vh] rounded-t-2xl animate-in slide-in-from-bottom-5'
        }`}
      >
        {/* Compose Window Header (Google Gmail Style Controls) */}
        <div className="bg-slate-100 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
              {composeDraftData?.threadId ? 'Reply to Thread' : 'New Cookscape Email Message'}
            </h3>
          </div>

          <div className="flex items-center space-x-1 text-slate-400">
            {/* Minimize to bottom bar */}
            <button
              type="button"
              onClick={() => setWindowMode('minimized')}
              className="p-1.5 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Expand / Restore toggle */}
            <button
              type="button"
              onClick={() => setWindowMode(isExpanded ? 'normal' : 'expanded')}
              className="p-1.5 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Exit full screen' : 'Full screen'}
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Close window */}
            <button
              type="button"
              onClick={closeCompose}
              className="p-1.5 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Save & Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Template Picker & Classification Bar */}
      <div className="bg-slate-50 dark:bg-slate-950/60 px-4 py-2 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-700 dark:text-red-300 hover:bg-red-500/25 border border-red-500/30 transition-colors font-medium text-[11px]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Insert Design Proposal / Quote Template</span>
          </button>

          {showTemplateDropdown && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowTemplateDropdown(false)}
              />
              <div className="absolute left-0 mt-1 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-30 space-y-1">
                <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 px-2 py-1">
                  Ready-to-Use Interior Templates
                </p>
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleInsertTemplate(tpl)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs space-y-0.5 group"
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400">
                      {tpl.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{tpl.description}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Category & Priority selector */}
        <div className="flex items-center space-x-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-red-500/50"
          >
            <option value="GENERAL">General</option>
            <option value="PROPOSAL">Design Proposal</option>
            <option value="QUOTATION">Cost Quotation</option>
            <option value="SITE_UPDATE">Site Update</option>
            <option value="BILLING">Invoice / Billing</option>
          </select>

          <select
            value={importance}
            onChange={(e) => setImportance(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-red-500/50"
          >
            <option value="NORMAL">Normal Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="URGENT">Urgent (Design Review)</option>
          </select>
        </div>
      </div>

      {/* Main Compose Form */}
      <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-y-auto p-4 space-y-3 text-xs">
        {/* TO Input */}
        <div className="relative">
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-slate-500 font-medium w-12 text-xs">To:</span>
            <input
              type="text"
              required
              value={to}
              onChange={handleToChange}
              placeholder="e.g. client@gmail.com, priya.designer@cookscape.com"
              className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
            />
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="hover:text-red-600"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  onClick={() => setShowBcc(true)}
                  className="hover:text-red-600"
                >
                  Bcc
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div className="absolute left-12 right-0 mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredContacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectContact(c)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                    <span className="text-[11px] text-red-700 dark:text-red-400 ml-2 font-mono">
                      {c.email}
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                    {c.department}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CC Input */}
        {showCc && (
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-slate-500 font-medium w-12 text-xs">Cc:</span>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="colleague@cookscape.com"
              className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
            />
          </div>
        )}

        {/* BCC Input */}
        {showBcc && (
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-slate-500 font-medium w-12 text-xs">Bcc:</span>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="archive@cookscape.com"
              className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
            />
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 pb-2">
          <span className="text-slate-500 font-medium w-12 text-xs">Subject:</span>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Cookscape 3D Renders & Kitchen Quotation - Villa 402"
            className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none font-medium"
          />
        </div>

        {/* 🎨 Gmail-Style WYSIWYG Rich Text Editor Component */}
        <RichTextEditor
          value={bodyHtml}
          onChange={setBodyHtml}
          showFormattingBar={showFormattingBar}
          onToggleFormattingBar={() => setShowFormattingBar(!showFormattingBar)}
          onInsertSignature={handleInsertSignature}
        />

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1">
              <Paperclip className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Attachments ({attachments.length}):</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs"
                >
                  <span className="text-slate-800 dark:text-slate-300 font-medium truncate max-w-[160px]">
                    {att.originalName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ({(att.size / 1024).toFixed(0)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🚀 Bottom Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 select-none">
          {/* Left Actions: Send Button + Icon Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Split Send Button */}
            <div className="inline-flex rounded-xl shadow-md shadow-red-600/20 overflow-hidden">
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 font-bold text-xs transition-all active:scale-98 disabled:opacity-50"
              >
                <span>{isSending ? 'Sending...' : 'Send'}</span>
              </button>
              <button
                type="button"
                className="bg-red-700 hover:bg-red-600 text-white px-2 py-2 border-l border-red-800 flex items-center justify-center"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Formatting Toggle Button (Aa) */}
            <button
              type="button"
              onClick={() => setShowFormattingBar(!showFormattingBar)}
              className={`p-2 rounded-xl border text-xs font-bold font-serif transition-colors ${
                showFormattingBar
                  ? 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40'
                  : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Formatting Options (Aa)"
            >
              Aa
            </button>

            {/* Attachment Button */}
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
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              title="Attach CAD drawings, 3D renders, PDFs"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Insert Signature Pen Tool */}
            <button
              type="button"
              onClick={handleInsertSignature}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Insert Signature"
            >
              <PenTool className="w-4 h-4" />
            </button>
          </div>

          {/* Right Actions: Discard Trash */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={closeCompose}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Discard draft"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  </>
  );
};
