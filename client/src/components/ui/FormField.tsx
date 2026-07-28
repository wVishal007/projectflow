import React, { useId, useMemo } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactElement;
  hint?: string;
  icon?: React.ReactNode;
}

export function FormField({ label, error, required, htmlFor, children, hint, icon }: FormFieldProps) {
  const generatedId = useId();
  const id = htmlFor || generatedId;
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  const childProps = {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': !!error,
  };

  const childWithProps = useMemo(
    () => React.cloneElement(children, childProps as Record<string, unknown>),
    [children, id, describedBy, error]
  );

  const childWithIcon = useMemo(() => {
    if (!icon) return childWithProps;
    return React.cloneElement(childWithProps, {
      className: `${(childWithProps.props.className as string) || ''} pl-10`.trim(),
    } as Record<string, unknown>);
  }, [icon, childWithProps]);

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {icon ? (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            {icon}
          </div>
          {childWithIcon}
        </div>
      ) : (
        childWithIcon
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-500 dark:text-gray-400 animate-slideDown">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400 animate-slideDown flex items-center gap-1" role="alert">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
