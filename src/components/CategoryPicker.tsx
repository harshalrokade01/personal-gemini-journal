import React from 'react';
import { ReflectionCategory } from '../types';
import { Sun, Lightbulb, Heart, ShieldAlert, Compass } from 'lucide-react';

interface CategoryPickerProps {
  selectedCategory: ReflectionCategory;
  onSelectCategory: (cat: ReflectionCategory) => void;
  disabled?: boolean;
}

export const CATEGORY_CONFIG: Record<
  ReflectionCategory,
  { label: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  daily: {
    label: 'Daily Check-in',
    description: 'Day-end review, energy levels, gratitude, and intentions',
    icon: Sun,
  },
  brainstorm: {
    label: 'Strategic Ideation',
    description: 'Explore options, weigh trade-offs, and unpack creative paths',
    icon: Lightbulb,
  },
  gratitude: {
    label: 'Gratitude & Wins',
    description: 'Celebrate milestones, acknowledge learnings, and ground perspective',
    icon: Heart,
  },
  challenge: {
    label: 'Overcoming Challenge',
    description: 'Deconstruct obstacles, stress points, or tough conversations',
    icon: ShieldAlert,
  },
  general: {
    label: 'Open Reflection',
    description: 'Free-form thought exploration, stream of consciousness, or ideas',
    icon: Compass,
  },
};

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategory,
  onSelectCategory,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(CATEGORY_CONFIG) as ReflectionCategory[]).map((cat) => {
        const item = CATEGORY_CONFIG[cat];
        const Icon = item.icon;
        const isSelected = selectedCategory === cat;

        return (
          <button
            key={cat}
            type="button"
            disabled={disabled}
            onClick={() => onSelectCategory(cat)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:text-[var(--text-primary)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-indigo-500'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
