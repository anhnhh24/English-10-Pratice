import React from 'react';
import { getScoreColorClass } from '../../utils/scoreHelpers';

interface ScorePillProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showFraction?: boolean;
}

export const ScorePill: React.FC<ScorePillProps> = ({
  score,
  maxScore = 10,
  size = 'md',
  showFraction = true,
}) => {
  const colors = getScoreColorClass(score);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3.5 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center space-x-1 font-extrabold rounded-xl border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}
    >
      <span>{score.toFixed(1)}</span>
      {showFraction && <span className="opacity-70 text-[0.8em]">/{maxScore}đ</span>}
    </span>
  );
};
