import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet-danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-herb text-on-herb hover:bg-herb-strong shadow-raise",
  secondary: "bg-surface text-ink border border-line-strong hover:border-herb hover:text-herb",
  ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink",
  danger: "bg-danger text-white hover:brightness-110",
  "quiet-danger": "text-danger hover:bg-danger-soft",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[0.95rem] gap-1.5",
  md: "h-11 px-4 gap-2",
  lg: "h-13 px-6 text-lg gap-2.5",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return cn(
    "inline-flex select-none items-center justify-center rounded-soft font-semibold whitespace-nowrap",
    "transition-[background-color,border-color,color,filter] duration-150",
    "disabled:cursor-not-allowed disabled:opacity-55",
    VARIANTS[variant],
    SIZES[size],
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pending?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, pending, disabled, className, type = "button", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(buttonClass(variant, size), className)}
      {...rest}
    >
      {children}
    </button>
  );
});
