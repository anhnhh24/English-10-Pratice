/**
 * Score Helpers & Color Class Generators
 */

export function getScoreColorClass(score: number): {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
} {
  if (score >= 8.0) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-600',
    };
  }
  if (score >= 6.5) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      badgeBg: 'bg-blue-600',
    };
  }
  if (score >= 5.0) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      badgeBg: 'bg-amber-600',
    };
  }
  return {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    badgeBg: 'bg-red-600',
  };
}

export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'bg-emerald-500 text-white';
  if (accuracy >= 65) return 'bg-blue-500 text-white';
  if (accuracy >= 50) return 'bg-amber-500 text-white';
  return 'bg-red-500 text-white';
}
