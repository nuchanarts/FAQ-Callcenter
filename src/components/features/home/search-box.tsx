"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Search, X } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { th } from "@/i18n/th";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Hero search input (FR-021): the first thing a caller should see.
 * Visible prompt label, oversized field with a thick border, a breathing halo
 * while empty, a clear button, a "/" hint and an explicit search button.
 */
export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox(
  { value, onChange },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  return (
    <div role="search">
      <label
        htmlFor="topic-search"
        className="mb-3 flex items-center gap-2 text-lg font-semibold sm:text-xl"
      >
        <Search aria-hidden className="size-5" />
        <span>{th.search.label}</span>
        <span className="font-normal text-hero-ink/80 max-sm:sr-only">· {th.search.prompt}</span>
      </label>
      <div
        className={`relative rounded-soft bg-surface ${value ? "shadow-raise" : "search-attention"}`}
      >
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-5 size-7 -translate-y-1/2 text-herb"
        />
        <input
          ref={inputRef}
          id="topic-search"
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          value={value}
          placeholder={th.search.placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onChange("");
          }}
          className="h-18 w-full rounded-soft border-[3px] border-herb bg-surface pr-36 pl-15 text-xl text-ink placeholder:text-ink-muted focus:border-herb-strong focus:outline-none sm:h-20 sm:pr-44 [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-2">
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              className="flex size-11 items-center justify-center rounded-full text-ink-faint hover:bg-surface-muted hover:text-ink"
            >
              <X aria-hidden className="size-5" />
              <span className="sr-only">{th.search.clear}</span>
            </button>
          ) : (
            <span className="hidden items-center text-[0.9rem] text-ink-faint sm:flex">
              <Kbd>/</Kbd>
            </span>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="flex h-12 items-center gap-2 rounded-soft bg-herb px-4 text-lg font-semibold text-on-herb hover:bg-herb-strong sm:h-14 sm:px-6"
          >
            <Search aria-hidden className="size-5" />
            <span className="max-sm:sr-only">{th.search.submit}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
