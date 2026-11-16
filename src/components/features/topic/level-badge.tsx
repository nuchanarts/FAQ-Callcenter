import { CircleCheck, CircleDashed, Headset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Level } from "@/domain/levels";
import { th } from "@/i18n/th";

const ICONS = { self: CircleCheck, partial: CircleDashed, team: Headset } as const;

/** One level badge per topic (Constitution I). Shape + text, never color alone. */
export function LevelBadge({ level }: { level: Level }) {
  const Icon = ICONS[level];
  return (
    <Badge tone={level} icon={<Icon aria-hidden className="size-4" />}>
      {th.levels[level]}
    </Badge>
  );
}
