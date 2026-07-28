interface PasswordStrengthProps {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string; textColor: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-500' };
  return { score, label: 'Very Strong', color: 'bg-green-500', textColor: 'text-green-500' };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, label, color, textColor } = getStrength(password);
  const segments = 5;
  const filled = Math.min(score, segments);

  return (
    <div
      className="mt-2"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={segments}
      aria-valuenow={filled}
      aria-label={`Password strength: ${label}`}
    >
      <div className="flex space-x-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ease-out ${
              i < filled ? color : 'bg-gray-200 dark:bg-gray-700'
            }`}
            style={{ transitionDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
        <span>Password strength:</span>
        <span className={`font-semibold ${textColor}`}>{label}</span>
      </p>
    </div>
  );
}
