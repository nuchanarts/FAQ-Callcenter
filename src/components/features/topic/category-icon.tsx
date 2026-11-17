import {
  Calendar,
  CircleHelp,
  ClipboardList,
  Database,
  FileText,
  IdCard,
  LogIn,
  Monitor,
  Pill,
  Printer,
  Receipt,
  Settings,
  Stethoscope,
  Syringe,
  Upload,
  Users,
  Wallet,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIconName } from "@/domain/taxonomy";
import { cn } from "@/lib/cn";

export const CATEGORY_ICON_COMPONENTS: Record<CategoryIconName, LucideIcon> = {
  "log-in": LogIn,
  "id-card": IdCard,
  upload: Upload,
  printer: Printer,
  pill: Pill,
  stethoscope: Stethoscope,
  wallet: Wallet,
  "clipboard-list": ClipboardList,
  monitor: Monitor,
  wifi: Wifi,
  database: Database,
  settings: Settings,
  "file-text": FileText,
  calendar: Calendar,
  users: Users,
  syringe: Syringe,
  receipt: Receipt,
  "circle-help": CircleHelp,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICON_COMPONENTS[name as CategoryIconName] ?? CircleHelp;
  return <Icon aria-hidden className={cn("shrink-0", className ?? "size-4")} />;
}
