"use client";

import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { th } from "@/i18n/th";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

/** Hero search input: large, clear button, "/" hint (FR-021). */
export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox(
  { value, onChange },
  ref,
) {
  return (
    <div role="search" className="relative">
      <label htmlFor="topic-search" className="sr-only">
        {th.search.label}
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-6 -translate-y-1/2 text-ink-faint"
      />
      <input
        ref={ref}
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
        className="h-16 w-full rounded-soft border-2 border-transparent bg-surface pr-14 pl-13 text-lg text-ink shadow-raise placeholder:text-ink-faint focus:border-herb focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint hover:bg-surface-muted hover:text-ink"
        >
          <X aria-hidden className="size-5" />
          <span className="sr-only">{th.search.clear}</span>
        </button>
      ) : (
        <span className="absolute top-1/2 right-4 hidden -translate-y-1/2 items-center gap-1.5 text-[0.9rem] text-ink-faint sm:flex">
          <Kbd>/</Kbd>
        </span>
      )}
    </div>
  );
});
