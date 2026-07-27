import { useState, useCallback, ChangeEvent } from 'react';

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

interface FieldConfig {
  rules: ValidationRule[];
}

type FieldsConfig<T extends string> = Record<T, FieldConfig>;

interface TouchedState {
  [key: string]: boolean;
}

interface ErrorsState {
  [key: string]: string;
}

export function useFormValidation<T extends string>(fieldsConfig: FieldsConfig<T>) {
  const [touched, setTouched] = useState<TouchedState>({});
  const [errors, setErrors] = useState<ErrorsState>({});

  const validateField = useCallback(
    (name: string, value: string) => {
      const config = fieldsConfig[name as T];
      if (!config) return '';
      for (const rule of config.rules) {
        if (!rule.test(value)) return rule.message;
      }
      return '';
    },
    [fieldsConfig]
  );

  const handleChange = useCallback(
    (name: string, value: string) => {
      if (!touched[name]) return;
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (name: string, value: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const validateAll = useCallback(
    (values: Record<string, string>) => {
      const newErrors: ErrorsState = {};
      const newTouched: TouchedState = {};
      let valid = true;

      for (const [name, value] of Object.entries(values)) {
        newTouched[name] = true;
        const error = validateField(name, value);
        if (error) {
          newErrors[name] = error;
          valid = false;
        }
      }

      setTouched(newTouched);
      setErrors(newErrors);
      return valid;
    },
    [validateField]
  );

  const reset = useCallback(() => {
    setTouched({});
    setErrors({});
  }, []);

  const getError = useCallback((name: string) => {
    return touched[name] ? errors[name] || '' : '';
  }, [touched, errors]);

  const inputProps = useCallback(
    (name: string) => ({
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        handleChange(name, e.target.value),
      onBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        handleBlur(name, e.target.value),
    }),
    [handleChange, handleBlur]
  );

  return { errors, touched, getError, validateAll, reset, inputProps, handleChange, handleBlur };
}

export const rules = {
  required: (field: string): ValidationRule => ({
    test: (v) => v.trim().length > 0,
    message: `${field} is required`,
  }),
  minLength: (min: number, field: string): ValidationRule => ({
    test: (v) => v.length >= min,
    message: `${field} must be at least ${min} characters`,
  }),
  maxLength: (max: number, field: string): ValidationRule => ({
    test: (v) => v.length <= max,
    message: `${field} must be at most ${max} characters`,
  }),
  email: (): ValidationRule => ({
    test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: 'Enter a valid email address',
  }),
  matches: (otherValue: string, field: string): ValidationRule => ({
    test: (v) => v === otherValue,
    message: `${field} do not match`,
  }),
};
