import React, { useRef, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import { formatWithCursor } from '../utils/format';

export interface FormattedNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChangeValue: (value: string) => void;
}

/**
  * Minglik ajratgich (bo'sh joy) bilan formatlanadigan maxsus input komponenti.
  * Foydalanuvchi sonni o'rtasidan tahrirlaganda (masalan "1 300 000" dagi "3" ni o'chirganda),
  * kursor boshiga yoki oxiriga sakrab ketmaydi, aynan o'sha o'rinda saqlanadi.
  */
export const FormattedNumberInput = forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  ({ value, onChangeValue, onKeyDown, className, inputMode = 'decimal', type = 'text', ...rest }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const pendingCursorRef = useRef<number | null>(null);

    // DOM yangilanishi bilan brauzer bo'yashidan (paint) oldin kursorni to'g'ri o'rniga qo'yish
    useLayoutEffect(() => {
      if (pendingCursorRef.current !== null && inputRef.current) {
        const pos = pendingCursorRef.current;
        inputRef.current.setSelectionRange(pos, pos);
        pendingCursorRef.current = null;
      }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const cursorPos = input.selectionStart ?? 0;
      const { formatted, newCursor } = formatWithCursor(input.value, cursorPos);

      pendingCursorRef.current = newCursor;
      onChangeValue(formatted);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = inputRef.current;
      if (input && input.selectionStart === input.selectionEnd && input.selectionStart !== null) {
        const pos = input.selectionStart;

        // Kursor probeldan keyin turganida Backspace bosilsa, probel oldidagi raqamni o'chirish
        if (e.key === 'Backspace' && pos > 0 && input.value[pos - 1] === ' ') {
          e.preventDefault();
          const delIdx = Math.max(0, pos - 2);
          const before = input.value.slice(0, delIdx);
          const after = input.value.slice(pos);
          const newVal = before + after;
          const { formatted, newCursor } = formatWithCursor(newVal, delIdx);
          pendingCursorRef.current = newCursor;
          onChangeValue(formatted);
          return;
        }

        // Kursor probeldan oldin turganida Delete bosilsa, probeldan keyingi raqamni o'chirish
        if (e.key === 'Delete' && pos < input.value.length && input.value[pos] === ' ') {
          e.preventDefault();
          const before = input.value.slice(0, pos);
          const after = input.value.slice(pos + 2);
          const newVal = before + after;
          const { formatted, newCursor } = formatWithCursor(newVal, pos);
          pendingCursorRef.current = newCursor;
          onChangeValue(formatted);
          return;
        }
      }

      onKeyDown?.(e);
    };

    return (
      <input
        ref={inputRef}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...rest}
      />
    );
  }
);

FormattedNumberInput.displayName = 'FormattedNumberInput';
