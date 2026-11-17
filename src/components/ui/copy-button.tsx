"use client";

import { useState, type RefObject } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useClipboard } from "@/hooks/use-clipboard";
import { th } from "@/i18n/th";

const COPIED_MS = 2000;

function selectContents(el: HTMLElement | null): void {
  if (!el) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  text: string;
  label: string;
  /** Element whose text is selected when the clipboard is blocked (manual Ctrl+C fallback). */
  fallbackTarget?: RefObject<HTMLElement | null>;
  /** Called after a successful copy (e.g. to show the "what next" steps). */
  onCopied?: () => void;
}

/** One-click copy with confirmation; falls back to selecting the text (spec edge case). */
export function CopyButton({ text, label, fallbackTarget, onCopied, ...rest }: CopyButtonProps) {
  const { copy } = useClipboard();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const result = await copy(text);
    if (result === "copied") {
      toast.show(th.copy.copied);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_MS);
      onCopied?.();
    } else {
      selectContents(fallbackTarget?.current ?? null);
      toast.show(th.copy.blocked, "error");
    }
  }

  return (
    <Button onClick={onClick} {...rest}>
      {copied ? <Check aria-hidden className="size-5" /> : <Copy aria-hidden className="size-5" />}
      {label}
    </Button>
  );
}
