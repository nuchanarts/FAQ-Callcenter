"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const TOAST_MS = 3200;
const MAX_VISIBLE = 3;
const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    setItems((list) => [...list.slice(-(MAX_VISIBLE - 1)), { id, message, tone }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), TOAST_MS);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex max-w-md items-center gap-2 rounded-pill px-4 py-2.5 font-semibold shadow-raise",
              "animate-[toast-in_180ms_ease-out]",
              t.tone === "success" ? "bg-ink text-paper" : "bg-danger text-white",
            )}
          >
            {t.tone === "success" ? (
              <CheckCircle2 aria-hidden className="size-5" />
            ) : (
              <AlertCircle aria-hidden className="size-5" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
