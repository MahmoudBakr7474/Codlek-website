'use client';

import { ChevronDown, CircleAlert } from 'lucide-react';
import { cx } from '@/lib/cx';

/*
 * 48px fields. Borders use --line-input (3:1 against the field); focus adds a clear
 * ring in primary-ink (the button blue in light, a light blue in dark), so a focused
 * field is always brighter than an idle one. 16px text on phones so iOS doesn't zoom.
 */
export function controlClasses(invalid: boolean): string {
    return cx(
        'block w-full rounded-btn border bg-surface px-4 text-base text-ink shadow-xs transition-[border-color,box-shadow] duration-150 placeholder:text-ink-subtle focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:text-[15px]',
        invalid ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-line-input hover:border-ink-muted focus:border-primary-ink focus:ring-primary-ink/25',
    );
}

export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <p id={id} className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-danger">
            <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
            {children}
        </p>
    );
}

type FieldProps = {
    name: string;
    label: string;
    type?: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select';
    required?: boolean;
    placeholder?: string;
    hint?: string;
    error?: string;
    defaultValue?: string;
    options?: Array<{ value: string; label: string }>;
    rows?: number;
    ltr?: boolean;
    autoComplete?: string;
    className?: string;
};

export function Field({ name, label, type = 'text', required, placeholder, hint, error, defaultValue, options = [], rows = 5, ltr, autoComplete, className }: FieldProps) {
    const id = `f-${name}`;
    const invalid = Boolean(error);
    const describedBy = [invalid && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
    const common = { id, name, required, 'aria-invalid': invalid || undefined, 'aria-describedby': describedBy };

    return (
        <div className={className}>
            <label htmlFor={id} className="mb-2 flex items-center gap-1 text-sm font-semibold text-ink">
                {label}
                {required && (
                    <span className="text-danger" aria-hidden="true">
                        *
                    </span>
                )}
            </label>

            {type === 'textarea' ? (
                <textarea {...common} rows={rows} placeholder={placeholder} defaultValue={defaultValue} className={cx(controlClasses(invalid), 'min-h-32 resize-y py-3 leading-relaxed')} />
            ) : type === 'select' ? (
                <div className="relative">
                    <select {...common} defaultValue={defaultValue ?? ''} className={cx(controlClasses(invalid), 'h-12 cursor-pointer appearance-none pe-11')}>
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute end-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                </div>
            ) : (
                <input
                    {...common}
                    type={type}
                    placeholder={placeholder}
                    defaultValue={defaultValue}
                    autoComplete={autoComplete}
                    dir={ltr ? 'ltr' : undefined}
                    className={cx(controlClasses(invalid), 'h-12', ltr && 'rtl:text-right')}
                />
            )}

            {hint && (
                <p id={`${id}-hint`} className="mt-2 text-sm text-ink-muted">
                    {hint}
                </p>
            )}

            {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
        </div>
    );
}
