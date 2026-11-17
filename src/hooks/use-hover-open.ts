"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

const CLOSE_DELAY_MS = 250;

/**
 * Open-on-hover state for header popovers. Mouse only: touch and keyboard keep their
 * own click/focus behavior. The close delay lets the pointer cross the gap to the panel.
 */
export function useHoverOpen() {
  const [open, setOpen] = useState(false);
  const hovering = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const hoverProps = {
    onPointerEnter(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      hovering.current = true;
      if (timer.current) clearTimeout(timer.current);
      setOpen(true);
    },
    onPointerLeave(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      hovering.current = false;
      timer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
    },
  };

  return { open, setOpen, hovering, hoverProps };
}
