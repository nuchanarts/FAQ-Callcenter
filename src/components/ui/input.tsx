import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export const controlClass = cn(
  "w-full rounded-soft border border-line-strong bg-surface px-3.5 text-ink",
  "placeholder:text-ink-faint transition-colors",
  "hover:border-ink-faint focus:border-herb focus:outline-none focus:ring-3 focus:ring-herb/25",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20",
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(controlClass, "h-11", className)} {...rest} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 5, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlClass, "py-2.5 leading-relaxed", className)}
      {...rest}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...rest }, ref) {
    return <select ref={ref} className={cn(controlClass, "h-11 pr-8", className)} {...rest} />;
  },
);
