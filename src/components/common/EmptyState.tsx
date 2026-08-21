import React from 'react';

interface EmptyStateProps {
  icon?: React.ElementType;
  emoji?: string;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  emoji = '📋',
  title,
  description,
  actionButton,
  className = '',
}) => {
  return (
    <div
      className={`p-10 sm:p-14 bg-white rounded-[2.5rem] border border-[#EAE7E0] text-center space-y-4 shadow-xs ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-[#FAF9F6] border border-[#D9D2C5] text-[#8A8A70] flex items-center justify-center mx-auto text-2xl">
        {Icon ? <Icon className="w-8 h-8 text-[#5A5A40]" /> : emoji}
      </div>

      <div className="space-y-1 max-w-md mx-auto">
        <h3 className="font-bold text-[#3D3D2D] text-base sm:text-lg">{title}</h3>
        <p className="text-xs sm:text-sm text-[#8A8A70] leading-relaxed">{description}</p>
      </div>

      {actionButton && (
        <div className="pt-2">
          <button
            onClick={actionButton.onClick}
            className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center space-x-2 cursor-pointer"
          >
            {actionButton.icon && <actionButton.icon className="w-4 h-4" />}
            <span>{actionButton.label}</span>
          </button>
        </div>
      )}
    </div>
  );
};
