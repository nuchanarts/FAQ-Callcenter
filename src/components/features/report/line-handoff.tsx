"use client";

import type { RefObject } from "react";
import { ClipboardPaste, MessageCircle, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useClipboard } from "@/hooks/use-clipboard";
import { th } from "@/i18n/th";

/** MOPH Call Center LINE Official Account. */
export const LINE_OA_ID = "@977tcqko";
const encodedId = encodeURIComponent(LINE_OA_ID);

/** OA chat with the message pre-filled (LINE URL scheme "oaMessage"). Web link: phones + fallback. */
export function lineChatUrl(message: string): string {
  return `https://line.me/R/oaMessage/${encodedId}/?${encodeURIComponent(message)}`;
}

/** Same chat via the line:// protocol, which opens the installed LINE for PC app directly. */
export function lineAppUrl(message: string): string {
  return `line://oaMessage/${encodedId}/?${encodeURIComponent(message)}`;
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export const LINE_ADD_FRIEND_URL = `https://line.me/R/ti/p/${encodedId}`;

interface LineOpenButtonProps {
  message: string;
  fallbackTarget: RefObject<HTMLElement | null>;
  onCopied: () => void;
}

/**
 * Copies the message and opens LINE on the OA chat with the message pre-filled:
 * on a PC via line:// (the LINE app, no browser tab); on phones via line.me (the app opens).
 * The copy is a safety net in case LINE for PC doesn't pre-fill — the caller pastes with Ctrl+V.
 */
export function LineOpenButton({ message, fallbackTarget, onCopied }: LineOpenButtonProps) {
  const { copy } = useClipboard();
  const toast = useToast();

  return (
    <a
      href={lineChatUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        if (isMobile()) window.open(lineChatUrl(message), "_blank", "noopener");
        else window.open(lineAppUrl(message), "_self");
        void copy(message).then((result) => {
          if (result === "copied") {
            toast.show(th.copy.copied);
            onCopied();
          } else {
            const el = fallbackTarget.current;
            if (el) {
              const range = document.createRange();
              range.selectNodeContents(el);
              window.getSelection()?.removeAllRanges();
              window.getSelection()?.addRange(range);
            }
            toast.show(th.copy.blocked, "error");
          }
        });
      }}
      className="inline-flex h-14 items-center justify-center gap-2 rounded-soft bg-[#06c755] px-6 text-lg font-semibold text-white hover:bg-[#05a948]"
    >
      <MessageCircle aria-hidden className="size-6" />
      {th.line.openChat}
    </a>
  );
}

/** "Copied — now do this" steps, matching the call-center's LINE instructions. */
export function LineSteps() {
  return (
    <div role="status" className="rounded-soft border border-[#06c755]/40 bg-[#06c755]/10 p-4">
      <p className="font-semibold text-ink">{th.line.stepsTitle}</p>
      <ol className="mt-2 flex flex-col gap-1.5">
        {th.line.steps(LINE_OA_ID).map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#06c755] text-[0.85rem] font-bold text-white">
              {i + 1}
            </span>
            <span className="text-ink">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 flex items-center gap-x-2 border-t border-[#06c755]/30 pt-3 text-[0.95rem] text-ink-muted">
        <ClipboardPaste aria-hidden className="size-4 shrink-0 text-ink-faint" />
        {th.line.emptyBox}
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[0.95rem] text-ink-muted">
        <UserPlus aria-hidden className="size-4 text-ink-faint" />
        <span className="font-semibold text-ink">{th.line.noChat}</span>
        {th.line.addFriend(LINE_OA_ID)}
        <a
          href={LINE_ADD_FRIEND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-herb underline underline-offset-2"
        >
          {th.line.addFriendLink}
        </a>
      </p>
    </div>
  );
}
