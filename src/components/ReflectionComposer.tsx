import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Save,
  Tag,
  Plus,
  X,
  Copy,
  Check,
  Download,
  AlertTriangle,
  RotateCcw,
  Clock,
  CheckCircle2,
  Trash2,
  Share2,
  MapPin,
  MapPinOff,
  Navigation,
  Loader2,
} from 'lucide-react';
import {
  Reflection,
  ReflectionCategory,
  ReflectionMode,
  ChatMessage,
  JournalLocation,
} from '../types';
import { CategoryPicker } from './CategoryPicker';
import { ModePicker } from './ModePicker';

interface ReflectionComposerProps {
  currentReflection: Reflection | null;
  onSave: (reflection: Partial<Reflection>) => Promise<string | void>;
  onNew: () => void;
  onDelete?: (id: string) => void;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
}

const STARTER_PROMPTS: Record<ReflectionCategory, string[]> = {
  daily: [
    "What energized me today, and what drained my battery?",
    "A moment today when I felt truly focused or present...",
    "One small adjustment I want to make tomorrow is...",
  ],
  brainstorm: [
    "I am evaluating two different directions for my career / project...",
    "What are 5 alternative angles I haven't considered for solving...",
    "If I had zero constraints, what bold step would I take?",
  ],
  gratitude: [
    "Three unexpected moments of kindness or clarity this week...",
    "A challenge in the past that I am now deeply grateful for...",
    "A person whose presence has made a positive impact on my journey...",
  ],
  challenge: [
    "I am facing resistance with a difficult project or stakeholder...",
    "A fear or anxiety that has been recurring recently...",
    "What is the single most constructive step I can take right now?",
  ],
  general: [
    "A philosophical question or idea I've been pondering...",
    "Unpacking a realization I had during a quiet moment...",
    "Connecting the dots between recent events and my long-term vision...",
  ],
};

export const ReflectionComposer: React.FC<ReflectionComposerProps> = ({
  currentReflection,
  onSave,
  onNew,
  onDelete,
  isSaving,
  saveError,
  onClearSaveError,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReflectionCategory>('daily');
  const [mode, setMode] = useState<ReflectionMode>('reflect');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState<JournalLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when currentReflection changes
  useEffect(() => {
    if (currentReflection) {
      setTitle(currentReflection.title || '');
      setCategory(currentReflection.category || 'daily');
      setMode(currentReflection.mode || 'reflect');
      setMessages(currentReflection.messages || []);
      setTags(currentReflection.tags || []);
      setLocation(currentReflection.location || null);
      setLocationError(null);
      setHasUnsavedChanges(false);
    } else {
      // Fresh new reflection
      setTitle('');
      setCategory('daily');
      setMode('reflect');
      setMessages([]);
      setTags([]);
      setLocation(null);
      setLocationError(null);
      setInputPrompt('');
      setHasUnsavedChanges(false);
    }
  }, [currentReflection?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Handle Geolocation Detection
  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const res = await fetch('/api/location/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });

          const data = await res.json();
          const newLoc: JournalLocation = {
            latitude,
            longitude,
            accuracy,
            placeName: data.placeName || `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`,
            locality: data.locality || '',
            country: data.country || '',
            formattedAddress: data.formattedAddress,
            timestamp: new Date().toISOString(),
          };

          setLocation(newLoc);
          setHasUnsavedChanges(true);
        } catch (err: any) {
          console.warn('Reverse geocode failed, using coordinates fallback:', err);
          const newLoc: JournalLocation = {
            latitude,
            longitude,
            accuracy,
            placeName: `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`,
            timestamp: new Date().toISOString(),
          };
          setLocation(newLoc);
          setHasUnsavedChanges(true);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Failed to detect location.';
        if (error.code === 1) {
          msg = 'Location permission was denied. Please allow location access in your browser.';
        } else if (error.code === 2) {
          msg = 'Location information is unavailable on your device.';
        } else if (error.code === 3) {
          msg = 'Location request timed out. Please try again.';
        }
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Handle Location Removal before saving
  const handleRemoveLocation = () => {
    setLocation(null);
    setLocationError(null);
    setHasUnsavedChanges(true);
  };

  // Handle Tag management
  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagInput.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setHasUnsavedChanges(true);
  };

  // Submit Prompt to Gemini API
  const handleSendPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = inputPrompt.trim();
    if (!promptText || isGenerating) return;

    setGenerationError(null);
    setIsGenerating(true);

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputPrompt('');

    // If title is empty, generate an initial title from prompt
    let updatedTitle = title;
    if (!updatedTitle.trim()) {
      updatedTitle = promptText.length > 50 ? `${promptText.slice(0, 47)}...` : promptText;
      setTitle(updatedTitle);
    }

    try {
      // Call server proxy with Gemini 3.6 Flash fallback and location context
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          mode,
          userPrompt: promptText,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          title: updatedTitle,
          location: location || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive AI reflection.');
      }

      const modelMessage: ChatMessage = {
        id: `msg-model-${Date.now()}`,
        role: 'model',
        content: data.reply || 'Reflected on your thought.',
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed || 'gemini-3.6-flash',
      };

      const finalMessages = [...updatedMessages, modelMessage];
      setMessages(finalMessages);
      setHasUnsavedChanges(true);

      // Auto-persist reflection to Firestore
      try {
        await onSave({
          title: updatedTitle,
          category,
          mode,
          initialPrompt: finalMessages[0]?.content || promptText,
          messages: finalMessages,
          tags,
          location: location || null,
          summary: data.reply ? `${data.reply.slice(0, 180)}...` : undefined,
        });
        setHasUnsavedChanges(false);
      } catch (saveErr: any) {
        console.error('Auto-save to Firestore failed:', saveErr);
        // Save error is handled by parent state banner
      }
    } catch (err: any) {
      console.error('Gemini reflection error:', err);
      setGenerationError(err.message || 'Error generating reflection response.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual save trigger
  const handleManualSave = async () => {
    if (!title.trim() && messages.length === 0 && !inputPrompt.trim() && !location) return;

    const currentTitle = title.trim() || 'Untitled Reflection';
    try {
      await onSave({
        title: currentTitle,
        category,
        mode,
        initialPrompt: messages[0]?.content || inputPrompt || '',
        messages,
        tags,
        location: location || null,
      });
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Manual save failed:', err);
    }
  };

  // Copy text helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export as Markdown file
  const handleExportMarkdown = () => {
    const locString = location ? `\n**Location**: ${location.placeName || `${location.latitude}, ${location.longitude}`}` : '';
    const mdContent = `# ${title || 'Reflection'}\n\n**Category**: ${category}\n**Mode**: ${mode}\n**Date**: ${new Date().toLocaleDateString()}${locString}\n**Tags**: ${tags.join(', ') || 'None'}\n\n---\n\n` +
      messages
        .map(
          (m) =>
            `### ${m.role === 'user' ? '👤 Your Entry' : '✨ Gemini Reflection'} (${new Date(
              m.timestamp
            ).toLocaleTimeString()})\n\n${m.content}\n\n`
        )
        .join('---\n\n');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title || 'reflection').toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-primary)] shadow-sm overflow-hidden transition-colors duration-200">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-4">
        {/* Title and Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <input
              id="reflection-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Title your reflection or journal entry..."
              className="w-full bg-transparent text-lg sm:text-xl font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-0 border-b border-transparent focus:border-indigo-500/50 pb-1"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Export Markdown */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                title="Export as Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Manual Save Button */}
            <button
              id="save-reflection-btn"
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)]'
              } disabled:opacity-50`}
              title="Persist to Firestore"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
            </button>

            {/* Delete button if existing reflection */}
            {currentReflection?.id && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(currentReflection.id)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete reflection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category and Mode Selectors */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div>
            <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-1.5">Reflection Category</span>
            <CategoryPicker
              selectedCategory={category}
              onSelectCategory={(cat) => {
                setCategory(cat);
                setHasUnsavedChanges(true);
              }}
              disabled={isGenerating}
            />
          </div>

          <div>
            <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-1.5">AI Reflection Lens</span>
            <ModePicker
              selectedMode={mode}
              onSelectMode={(m) => {
                setMode(m);
                setHasUnsavedChanges(true);
              }}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Metadata Row: Tags and Location */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--border-primary)]">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-[var(--badge-bg)] text-[var(--badge-text)] border border-[var(--badge-border)] font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-indigo-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <form onSubmit={handleAddTag} className="inline-flex items-center">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="+ add tag"
                className="w-20 sm:w-24 bg-transparent text-[11px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-b focus:border-indigo-500 px-1"
              />
            </form>
          </div>

          {/* Location Action & Pill */}
          <div className="flex items-center gap-2">
            {location ? (
              <div
                id="location-badge"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span
                  title={
                    location.formattedAddress ||
                    `Coordinates: ${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
                  }
                  className="max-w-[180px] sm:max-w-[240px] truncate"
                >
                  {location.placeName || `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`}
                </span>
                <button
                  id="remove-location-btn"
                  type="button"
                  onClick={handleRemoveLocation}
                  className="p-0.5 rounded hover:bg-emerald-500/20 text-emerald-600 transition-colors cursor-pointer"
                  title="Remove location from entry"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                id="add-location-btn"
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] transition-all cursor-pointer disabled:opacity-50"
                title="Attach current location (requires browser permission)"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>Detecting Location...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Add Location</span>
                  </>
                )}
              </button>
            )}

            {locationError && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertTriangle className="w-3 h-3 shrink-0 text-rose-500" />
                <span className="max-w-[200px] truncate">{locationError}</span>
                <button
                  type="button"
                  onClick={() => setLocationError(null)}
                  className="text-rose-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Error Alert Banner */}
      {saveError && (
        <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-500 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{saveError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSave}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium cursor-pointer"
            >
              Retry Save
            </button>
            <button
              onClick={onClearSaveError}
              className="text-rose-500 hover:text-rose-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Conversation / Journal Body Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[var(--bg-muted)]/20">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto py-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] border border-[var(--badge-border)] text-indigo-500 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                Begin your reflection session
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 max-w-md mx-auto">
                Write freely below or choose a starter prompt to spark a thoughtful dialogue with Gemini.
              </p>
            </div>

            {/* Prompt Starter Pills */}
            <div className="space-y-2 pt-2 text-left">
              <span className="text-[11px] font-medium text-[var(--text-muted)] px-1">Prompt Inspirations:</span>
              <div className="grid grid-cols-1 gap-2">
                {STARTER_PROMPTS[category].map((starter, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setInputPrompt(starter);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 text-left rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] hover:border-indigo-500/40 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                  >
                    <span>"{starter}"</span>
                    <Plus className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
            >
              {/* Sender label and metadata */}
              <div className="flex items-center gap-2 px-1 text-[11px] text-[var(--text-muted)]">
                {msg.role === 'user' ? (
                  <>
                    <span>You</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span className="text-indigo-500 font-medium">{msg.modelUsed ? msg.modelUsed.replace('models/', '') : 'Gemini AI'}</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-3xl rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed group relative ${
                  msg.role === 'user'
                    ? 'bg-[var(--bg-chat-user)] text-[var(--text-primary)] rounded-tr-sm border border-[var(--border-primary)]'
                    : 'bg-[var(--bg-chat-model)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border-primary)] shadow-xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                ) : (
                  <div className="prose max-w-none text-[var(--text-primary)] text-sm sm:text-base prose-headings:text-[var(--text-primary)] prose-headings:font-serif-display prose-a:text-indigo-500 prose-strong:text-[var(--text-primary)] prose-ul:my-2 prose-li:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}

                {/* Quick copy message action */}
                <button
                  type="button"
                  onClick={() => handleCopy(msg.content, msg.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                  title="Copy content"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}

        {/* Live Generation Loading State */}
        {isGenerating && (
          <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center gap-2 px-1 text-[11px] text-indigo-500">
              <Sparkles className="w-3 h-3 text-indigo-500 animate-spin" />
              <span>Gemini is reflecting on your input...</span>
            </div>
            <div className="max-w-xl rounded-2xl rounded-tl-sm p-4 bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-xs text-[var(--text-secondary)] text-sm flex items-center gap-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-[var(--text-muted)] font-mono">Synthesizing insights...</span>
            </div>
          </div>
        )}

        {/* Generation Error Banner */}
        {generationError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{generationError}</span>
            </div>
            <button
              onClick={() => setGenerationError(null)}
              className="text-rose-400 hover:text-rose-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Box */}
      <div className="p-4 sm:p-5 border-t border-[var(--border-primary)] bg-[var(--bg-surface)]">
        <form onSubmit={handleSendPrompt} className="space-y-3">
          <div className="relative rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all p-3 shadow-xs">
            <textarea
              id="reflection-prompt-textarea"
              ref={textareaRef}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
              rows={3}
              placeholder="Type your reflection, journal entry, or follow-up question... (Ctrl+Enter to send)"
              className="w-full bg-transparent text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-none"
              disabled={isGenerating}
            />

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)]">
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span>{inputPrompt.length} characters</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline font-mono">⌘/Ctrl + Enter to send</span>
              </div>

              <button
                id="send-reflection-btn"
                type="submit"
                disabled={!inputPrompt.trim() || isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Reflecting...</span>
                  </>
                ) : (
                  <>
                    <span>Reflect with Gemini</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
