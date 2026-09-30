import { Debt } from '../store/DebtsStore';
import { startOfDay } from '../../lib/dates';
import { useTheme } from '../../theme';

export type DebtStatus = 'paid' | 'overdue' | 'soon' | 'active';

export const getRemaining = (debt: Debt): number => {
  return debt.jamiSumma - debt.tolanganSumma;
};

export const getDebtStatus = (debt: Debt): DebtStatus => {
  const remaining = getRemaining(debt);
  if (remaining <= 0) return 'paid';

  const today = startOfDay(new Date());
  const dueDate = startOfDay(new Date(debt.muddat));
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'soon'; // 0 (today), 1 (tomorrow), 2 (day after tomorrow) -> within 3 days including today
  return 'active';
};

export const getDebtLabel = (debt: Debt): { label: string; color: string; bgColor: string } => {
  // Using a hardcoded theme fallback if needed, but normally we'd rely on the UI components pulling from useTheme.
  // We'll return abstract colors (or hex) and let the components style them.
  const status = getDebtStatus(debt);
  const today = startOfDay(new Date());
  const dueDate = startOfDay(new Date(debt.muddat));
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (status === 'paid') {
    return { label: "To'langan", color: '#16a34a', bgColor: '#dcfce7' }; // green
  }

  if (status === 'overdue') {
    return { label: `${Math.abs(diffDays)} kun o'tgan`, color: '#dc2626', bgColor: '#fee2e2' }; // red
  }

  if (status === 'soon') {
    if (diffDays === 0) return { label: "Bugun", color: '#d97706', bgColor: '#fef3c7' }; // amber
    if (diffDays === 1) return { label: "Ertaga", color: '#d97706', bgColor: '#fef3c7' };
    return { label: `${diffDays} kundan keyin`, color: '#d97706', bgColor: '#fef3c7' };
  }

  return { label: `${diffDays} kun qoldi`, color: '#64748b', bgColor: '#f1f5f9' }; // neutral (slate)
};
