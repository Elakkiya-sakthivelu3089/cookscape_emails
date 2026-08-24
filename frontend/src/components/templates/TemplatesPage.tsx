import React, { useState, useEffect } from 'react';
import { FileText, Plus, PenSquare, Sparkles, Trash2, Edit3, Check } from 'lucide-react';
import { api } from '../../services/api.js';
import { EmailTemplate } from '../../types/index.js';
import { useMail } from '../../context/MailContext.js';
import { useNavigate } from 'react-router-dom';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<'PROPOSAL' | 'QUOTATION' | 'SITE_UPDATE' | 'MOODBOARD' | 'INVOICE'>('PROPOSAL');
  const [newSubject, setNewSubject] = useState('');
  const [newBodyHtml, setNewBodyHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { openCompose } = useMail();
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.templates || []);
      if (!selectedTemplate && res.data.templates?.length > 0) {
        setSelectedTemplate(res.data.templates[0]);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleUseTemplate = (tpl: EmailTemplate) => {
    openCompose({
      subject: tpl.subject,
      bodyHtml: tpl.bodyHtml,
      category: tpl.category,
    });
    navigate('/mail');
  };

  const handleSaveNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/templates', {
        title: newTitle,
        description: newDescription,
        category: newCategory,
        subject: newSubject,
        bodyHtml: newBodyHtml,
      });
      await fetchTemplates();
      setSelectedTemplate(res.data.template);
      setIsCreating(false);
      setNewTitle('');
      setNewDescription('');
      setNewSubject('');
      setNewBodyHtml('');
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Templates List Sidebar */}
      <aside className="w-80 lg:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full select-none shrink-0 transition-colors duration-200">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Interior Design Templates
            </span>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {templates.map((tpl) => {
            const isSelected = selectedTemplate?.id === tpl.id && !isCreating;

            return (
              <div
                key={tpl.id}
                onClick={() => {
                  setSelectedTemplate(tpl);
                  setIsCreating(false);
                }}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-red-500/15 border-red-500/40 shadow-sm'
                    : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[200px]">
                    {tpl.title}
                  </span>
                  <span className="text-[10px] bg-red-500/15 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-mono border border-red-500/30">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Preview / Edit Workspace */}
      <main className="flex-1 h-full overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        {isCreating ? (
          /* Create New Template Form */
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif">Create Design Proposal Template</h3>

            <form onSubmit={handleSaveNewTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Template Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Luxury Villa Living Room Renovation Pitch"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500/60"
                  >
                    <option value="PROPOSAL">Design Proposal</option>
                    <option value="QUOTATION">Cost Quotation</option>
                    <option value="SITE_UPDATE">Site Update</option>
                    <option value="MOODBOARD">Moodboard Pitch</option>
                    <option value="INVOICE">Invoice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Short Description</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g. Standard pitch for contemporary 3BHK interiors"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Default Subject Line *</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Cookscape Design Concept: [Project Name]"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">HTML Template Body *</label>
                <textarea
                  rows={8}
                  required
                  value={newBodyHtml}
                  onChange={(e) => setNewBodyHtml(e.target.value)}
                  placeholder="<p>Dear [Client Name],</p><p>We are delighted to present...</p>"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 font-mono text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-red-500/60"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20"
                >
                  {isLoading ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        ) : selectedTemplate ? (
          /* Template Preview Mode */
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white font-serif">{selectedTemplate.title}</h2>
                  <span className="bg-red-500/15 text-red-700 dark:text-red-300 text-xs px-2 py-0.5 rounded-full font-mono border border-red-500/30">
                    {selectedTemplate.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedTemplate.description}</p>
              </div>

              <button
                onClick={() => handleUseTemplate(selectedTemplate)}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-red-600/20 transition-all hover:scale-102"
              >
                <PenSquare className="w-4 h-4" />
                <span>Use in New Email</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-2xl space-y-4">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400 dark:text-slate-500">Subject Preview:</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedTemplate.subject}</p>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <span className="text-xs uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-3">Rendered HTML Output:</span>
                <div
                  className="p-6 rounded-2xl bg-slate-50 dark:bg-white text-slate-900 text-xs shadow-inner border border-slate-200 dark:border-none"
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.bodyHtml }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-400 dark:text-slate-500 text-xs py-12">No template selected.</div>
        )}
      </main>
    </div>
  );
};
