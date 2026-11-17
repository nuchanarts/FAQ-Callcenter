"use client";

import {
  CircleCheck,
  CircleDashed,
  Headset,
  Info,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTaxonomy } from "@/components/features/taxonomy/taxonomy-context";
import { findLevel, type LevelIconName } from "@/domain/taxonomy";

export const LEVEL_ICON_COMPONENTS: Record<LevelIconName, LucideIcon> = {
  "circle-check": CircleCheck,
  "circle-dashed": CircleDashed,
  headset: Headset,
  "triangle-alert": TriangleAlert,
  info: Info,
  wrench: Wrench,
};

/** One level badge per topic (Constitution I). Shape + text, never color alone. */
export function LevelBadge({ level }: { level: string }) {
  const def = findLevel(useTaxonomy(), level);
  const Icon = LEVEL_ICON_COMPONENTS[def.icon] ?? Info;
  return (
    <Badge tone={def.tone} icon={<Icon aria-hidden className="size-4" />}>
      {def.name}
    </Badge>
  );
}
