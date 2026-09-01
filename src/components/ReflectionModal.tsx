import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Calendar, Tag, Sparkles, User, Download, Copy, Check, Clock } from 'lucide-react';
import { Reflection } from '../types';
import { CATEGORY_CONFIG } from './CategoryPicker';

interface ReflectionModalProps {
  reflection: Reflection | null;
  onClose: () => void;
  onContinueInEditor: (reflection: Reflection) => void;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  reflection,
  onClose,
  onContinueInEditor,
}) => {
  const [copied, setCopied] = useState(false);

  if (!reflection) return null;

  const catConfig = CATEGORY_CONFIG[reflection.category] || CATEGORY_CONFIG.general;
  const CategoryIcon = catConfig.icon;

  const handleCopyAll = () => {
    const fullText = `# ${reflection.title}\n\nCategory: ${reflection.category}\nDate: ${new Date(
      reflection.createdAt
    ).toLocaleString()}\n\n` +
      reflection.messages
        .map(
          (m) =>
            `[${m.role === 'user' ? 'You' : 'Gemini'}] (${new Date(
              m.timestamp
            ).toLocaleTimeString()}):\n${m.content}\n`
        )
        .join('\n---\n\n');

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const mdContent = `# ${reflection.title || 'Reflection'}\n\n` +
      `**Category**: ${catConfig.label}\n` +
      `**Created**: ${new Date(reflection.createdAt).toLocaleString()}\n` +
      `**Tags**: ${reflection.tags?.join(', ') || 'None'}\n\n` +
      `---\n\n` +
      reflection.messages
        .map(
          (m) =>
            `### ${m.role === 'user' ? '👤 Your Entry' : '✨ Gemini 3.6 Flash'} (${new Date(
              m.timestamp
            ).toLocaleTimeString()})\n\n${m.content}\n\n`
        )
        .join('---\n\n');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(reflection.title || 'reflection')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden text-gray-900">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-white flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                <CategoryIcon className="w-3.5 h-3.5" />
                <span>{catConfig.label}</span>
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(reflection.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {reflection.title || 'Untitled Reflection'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Copy entire session"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Download Markdown"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-[#FAFAFA]/50">
          {reflection.tags && reflection.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {reflection.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-6">
            {reflection.messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 sm:p-5 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-gray-100 border border-gray-200 text-gray-900'
                    : 'bg-white border border-gray-200 shadow-xs text-gray-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100 text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    {m.role === 'user' ? (
                      <>
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-gray-800">Your Journal Note</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-indigo-600">{m.modelUsed ? m.modelUsed.replace('models/', '') : 'Gemini AI'}</span>
                      </>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>

                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{m.content}</p>
                ) : (
                  <div className="prose prose-neutral max-w-none text-sm sm:text-base prose-headings:text-gray-900 prose-headings:font-serif-display prose-a:text-indigo-600">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {reflection.messages?.length || 0} message turns
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onContinueInEditor(reflection);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              Continue in Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
