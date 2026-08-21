import React from 'react';
import { SubjectId } from '../../types';

interface SubjectBadgeProps {
  subject?: SubjectId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SubjectBadge: React.FC<SubjectBadgeProps> = ({
  subject = 'english',
  size = 'md',
  className = '',
}) => {
  const isMath = subject === 'math';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center space-x-1 font-bold rounded-xl border transition ${
        isMath
          ? 'bg-blue-50 text-[#1E3A8A] border-blue-200'
          : 'bg-[#FAF9F6] text-[#5A5A40] border-[#D9D2C5]'
      } ${sizeClasses[size]} ${className}`}
    >
      <span>{isMath ? '📐' : '🇬🇧'}</span>
      <span>{isMath ? 'Môn Toán' : 'Tiếng Anh'}</span>
    </span>
  );
};
