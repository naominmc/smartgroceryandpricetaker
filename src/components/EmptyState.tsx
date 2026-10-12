import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = ShoppingCart,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-card dark:bg-slate-800/80 rounded-card border border-dashed border-gray-300 dark:border-slate-700 my-4">
      <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/80 text-primary dark:text-blue-400 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-bold text-base text-text-main dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-text-secondary dark:text-slate-400 max-w-[260px] mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="bg-primary hover:bg-primary-hover active:scale-95 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-soft transition-all min-h-[44px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
