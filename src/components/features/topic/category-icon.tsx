import {
  ClipboardList,
  IdCard,
  LogIn,
  Pill,
  Printer,
  Stethoscope,
  Upload,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIcon as IconName } from "@/domain/categories";
import { cn } from "@/lib/cn";

const ICONS: Record<IconName, LucideIcon> = {
  "log-in": LogIn,
  "id-card": IdCard,
  upload: Upload,
  printer: Printer,
  pill: Pill,
  stethoscope: Stethoscope,
  wallet: Wallet,
  "clipboard-list": ClipboardList,
};

export function CategoryIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = ICONS[name];
  return <Icon aria-hidden className={cn("shrink-0", className ?? "size-4")} />;
}
