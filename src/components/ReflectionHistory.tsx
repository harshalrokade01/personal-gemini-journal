import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Calendar,
  MessageSquare,
  Tag,
  Trash2,
  ExternalLink,
  Download,
  Filter,
  Sparkles,
  ChevronRight,
  Plus,
  MapPin,
} from 'lucide-react';
import { Reflection, ReflectionCategory } from '../types';
import { CATEGORY_CONFIG } from './CategoryPicker';

interface ReflectionHistoryProps {
  reflections: Reflection[];
  selectedId: string | null;
  onSelectReflection: (reflection: Reflection) => void;
  onDeleteReflection: (id: string) => void;
  onNewReflection: () => void;
  onViewModal: (reflection: Reflection) => void;
  isLoading: boolean;
}

export const ReflectionHistory: React.FC<ReflectionHistoryProps> = ({
  reflections,
  selectedId,
  onSelectReflection,
  onDeleteReflection,
  onNewReflection,
  onViewModal,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Filtered reflections list
  const filteredReflections = useMemo(() => {
    return reflections.filter((r) => {
      const matchesCategory =
        selectedCategoryFilter === 'all' || r.category === selectedCategoryFilter;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inTitle = r.title?.toLowerCase().includes(q);
      const inPrompt = r.initialPrompt?.toLowerCase().includes(q);
      const inSummary = r.summary?.toLowerCase().includes(q);
      const inTags = r.tags?.some((t) => t.toLowerCase().includes(q));
      const inMessages = r.messages?.some((m) => m.content.toLowerCase().includes(q));
      const inLocation =
        r.location?.placeName?.toLowerCase().includes(q) ||
        r.location?.locality?.toLowerCase().includes(q) ||
        r.location?.country?.toLowerCase().includes(q);

      return inTitle || inPrompt || inSummary || inTags || inMessages || inLocation;
    });
  }, [reflections, searchQuery, selectedCategoryFilter]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-primary)] shadow-sm overflow-hidden transition-colors duration-200">
      {/* Header & Search */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">Journal History</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-primary)]">
              {reflections.length}
            </span>
          </div>

          <button
            onClick={onNewReflection}
            className="p-1.5 rounded-lg bg-[var(--badge-bg)] hover:bg-[var(--bg-hover)] text-indigo-500 transition-colors cursor-pointer border border-[var(--badge-border)]"
            title="Start new reflection"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-reflections-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries, keywords, tags, places..."
            className="w-full bg-[var(--bg-muted)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-9 pr-4 py-2 rounded-xl border border-[var(--border-primary)] focus:outline-none focus:border-indigo-500 focus:bg-[var(--bg-surface)] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-indigo-600 text-white font-medium shadow-xs'
                : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)]'
            }`}
          >
            All ({reflections.length})
          </button>
          {(Object.keys(CATEGORY_CONFIG) as ReflectionCategory[]).map((cat) => {
            const count = reflections.filter((r) => r.category === cat).length;
            if (count === 0 && selectedCategoryFilter !== cat) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)]'
                }`}
              >
                {CATEGORY_CONFIG[cat].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* History List Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-[var(--bg-muted)]/30">
        {isLoading ? (
          <div className="py-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading your saved reflections...</p>
          </div>
        ) : filteredReflections.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] space-y-3 px-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-primary)] flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {searchQuery || selectedCategoryFilter !== 'all'
                  ? 'No matching reflections found'
                  : 'No saved reflections yet'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
                {searchQuery || selectedCategoryFilter !== 'all'
                  ? 'Try adjusting your search terms or filter.'
                  : 'Write your thoughts in the editor and converse with Gemini.'}
              </p>
            </div>
            {!searchQuery && selectedCategoryFilter === 'all' && (
              <button
                onClick={onNewReflection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-600 text-white font-medium hover:bg-indigo-700 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Entry</span>
              </button>
            )}
          </div>
        ) : (
          filteredReflections.map((ref) => {
            const isSelected = selectedId === ref.id;
            const catConfig = CATEGORY_CONFIG[ref.category] || CATEGORY_CONFIG.general;
            const CategoryIcon = catConfig.icon;

            return (
              <div
                key={ref.id}
                onClick={() => onSelectReflection(ref)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group relative ${
                  isSelected
                    ? 'bg-[var(--bg-surface)] border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border-[var(--border-primary)]'
                }`}
              >
                {/* Top card metadata */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--badge-bg)] text-[var(--badge-text)] border border-[var(--badge-border)]">
                      <CategoryIcon className="w-3 h-3" />
                      <span>{catConfig.label}</span>
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(ref.createdAt)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-muted)] border border-[var(--border-primary)] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5" />
                      <span>{ref.messages?.length || 0}</span>
                    </span>

                    {/* Quick modal reader action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewModal(ref);
                      }}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Open full reader view"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteReflection(ref.id);
                      }}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-indigo-500 transition-colors">
                  {ref.title || 'Untitled Reflection'}
                </h3>

                {/* Attached Location Indicator Pill */}
                {ref.location && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md w-fit my-1">
                    <MapPin className="w-2.5 h-2.5 shrink-0 text-emerald-500" />
                    <span className="truncate max-w-[200px]">
                      {ref.location.placeName || `${ref.location.latitude.toFixed(2)}°, ${ref.location.longitude.toFixed(2)}°`}
                    </span>
                  </div>
                )}

                {/* Preview text */}
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
                  {ref.summary || ref.initialPrompt || ref.messages?.[0]?.content || 'Empty entry.'}
                </p>

                {/* Tags if any */}
                {ref.tags && ref.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ref.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-muted)] border border-[var(--border-primary)] px-1.5 py-0.2 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                    {ref.tags.length > 3 && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        +{ref.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
