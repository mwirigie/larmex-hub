import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /\d/.test(pw) },
  { label: "One special character (!@#$...)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function validatePassword(password: string): boolean {
  return RULES.every((r) => r.test(password));
}

export default function PasswordStrengthIndicator({ password }: { password: string }) {
  const results = useMemo(() => RULES.map((r) => ({ ...r, pass: r.test(password) })), [password]);
  const score = results.filter((r) => r.pass).length;

  const strengthLabel = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score <= 4 ? "Good" : "Strong";
  const strengthColor =
    score <= 1
      ? "bg-destructive"
      : score <= 3
        ? "bg-yellow-500"
        : score <= 4
          ? "bg-blue-500"
          : "bg-green-500";

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? strengthColor : "bg-muted"}`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{strengthLabel}</span>
      </div>
      <ul className="space-y-1">
        {results.map((r) => (
          <li key={r.label} className="flex items-center gap-1.5 text-xs">
            {r.pass ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={r.pass ? "text-foreground" : "text-muted-foreground"}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
