import React from 'react';
import { ReflectionMode } from '../types';
import { Sparkles, FileText, Compass, HelpCircle, CheckSquare } from 'lucide-react';

interface ModePickerProps {
  selectedMode: ReflectionMode;
  onSelectMode: (mode: ReflectionMode) => void;
  disabled?: boolean;
}

export const MODE_CONFIG: Record<
  ReflectionMode,
  { label: string; tag: string; icon: React.ComponentType<{ className?: string }> }
> = {
  reflect: {
    label: 'Reflect & Guide',
    tag: 'Empathetic guidance & reflective questions',
    icon: Sparkles,
  },
  summarize: {
    label: 'Summarize & Key Themes',
    tag: 'Concise synopsis and core observations',
    icon: FileText,
  },
  brainstorm: {
    label: 'Explore Angles',
    tag: '5 diverse perspectives and creative ideas',
    icon: Compass,
  },
  critique: {
    label: 'Challenge Assumptions',
    tag: 'Examine cognitive biases & hidden trade-offs',
    icon: HelpCircle,
  },
  action_items: {
    label: 'Extract Action Items',
    tag: 'Convert insights into concrete, prioritized steps',
    icon: CheckSquare,
  },
};

export const ModePicker: React.FC<ModePickerProps> = ({
  selectedMode,
  onSelectMode,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200">
      {(Object.keys(MODE_CONFIG) as ReflectionMode[]).map((mode) => {
        const item = MODE_CONFIG[mode];
        const Icon = item.icon;
        const isSelected = selectedMode === mode;

        return (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => onSelectMode(mode)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isSelected
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={item.tag}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
