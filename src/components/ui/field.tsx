import { useId, type ReactNode } from "react";
import { th } from "@/i18n/th";

export interface ControlProps {
  id: string;
  name?: string;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

interface FieldProps {
  label: string;
  name?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: (props: ControlProps) => ReactNode;
}

/** Label + hint + error wrapper that wires accessibility attributes into its control. */
export function Field({ label, name, hint, error, required, optional, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold text-ink">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
        {optional && (
          <span className="ml-1.5 font-normal text-ink-faint">{th.report.optional}</span>
        )}
      </label>
      {children({
        id,
        name,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {hint && (
        <p id={hintId} className="text-[0.95rem] text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[0.95rem] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
