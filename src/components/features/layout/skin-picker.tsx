"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Check, Palette } from "lucide-react";
import { DEFAULT_SKIN, SKIN_STORAGE_KEY, SKINS, type SkinId } from "./skins";
import { useHoverOpen } from "@/hooks/use-hover-open";
import { th } from "@/i18n/th";

function readSkin(): SkinId {
  const attr = document.documentElement.getAttribute("data-skin");
  return (SKINS.find((s) => s.id === attr)?.id ?? DEFAULT_SKIN) as SkinId;
}

/** The skin lives on <html data-skin>; watch that attribute as the external store. */
function subscribeSkin(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-skin"] });
  return () => observer.disconnect();
}

function applySkin(id: SkinId) {
  if (id === DEFAULT_SKIN) document.documentElement.removeAttribute("data-skin");
  else document.documentElement.setAttribute("data-skin", id);
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, id);
  } catch {
    // Storage blocked (private window): the skin still applies for this visit.
  }
}

/** Header button that lets each viewer pick a color skin; remembered per browser. */
export function SkinPicker() {
  const { open, setOpen, hovering, hoverProps } = useHoverOpen();
  const skin = useSyncExternalStore(subscribeSkin, readSkin, () => DEFAULT_SKIN);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div ref={rootRef} className="relative" {...hoverProps}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => (hovering.current ? true : !v))}
        title={th.skin.label}
        className="flex size-10 items-center justify-center rounded-soft text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        <Palette aria-hidden className="size-5" />
        <span className="sr-only">{th.skin.label}</span>
      </button>
      {open && (
        <div
          role="group"
          aria-label={th.skin.label}
          className="absolute top-full right-0 z-50 w-64 pt-2"
        >
          <div className="rounded-soft border border-line bg-surface p-3 shadow-raise">
            <p className="mb-2 px-1 text-[0.95rem] font-semibold">{th.skin.label}</p>
            <ul className="grid gap-1">
              {SKINS.map((s) => {
                const active = s.id === skin;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => applySkin(s.id)}
                      className={`flex w-full items-center gap-3 rounded-soft px-2 py-1.5 text-left hover:bg-surface-muted ${active ? "bg-herb-soft font-semibold" : ""}`}
                    >
                      <span
                        aria-hidden
                        className="size-7 shrink-0 rounded-full border border-line-strong"
                        style={{
                          background: `linear-gradient(135deg, ${s.swatch[0]} 50%, ${s.swatch[1]} 50%)`,
                        }}
                      />
                      <span className="flex-1">{s.label}</span>
                      {active && <Check aria-hidden className="size-4 text-herb" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
