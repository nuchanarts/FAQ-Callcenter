"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { BookOpen, House, LibraryBig, MessageSquareWarning, Settings2 } from "lucide-react";
import { GuideHoverCard } from "@/components/features/layout/guide-hover-card";
import { useHoverOpen } from "@/hooks/use-hover-open";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";

interface NavLink {
  href: string;
  label: string;
  icon: typeof House;
  /** Icon only; on hover the label slides out and a guide preview floats below. */
  compact?: boolean;
}

const LINKS: NavLink[] = [
  { href: "/", label: th.nav.home, icon: House },
  { href: "/report", label: th.nav.report, icon: MessageSquareWarning },
  { href: "/manuals", label: th.nav.manuals, icon: LibraryBig },
  { href: "/guide", label: th.nav.guide, icon: BookOpen, compact: true },
];

const ADMIN_LINK: NavLink = { href: "/admin", label: th.nav.admin, icon: Settings2 };

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname() ?? "/";
  const links = isAdmin ? [...LINKS, ADMIN_LINK] : LINKS;
  return (
    <ul className="flex items-center gap-0.5 sm:gap-1">
      {links.map((link) => (
        <NavItem key={link.href} link={link} active={isActive(pathname, link.href)} />
      ))}
    </ul>
  );
}

function NavItem({ link, active }: { link: NavLink; active: boolean }) {
  const { href, label, icon: Icon, compact } = link;
  const { open, hoverProps } = useHoverOpen();
  // The guide preview is pointless on the guide page itself.
  const showCard = compact && open && !active;
  const cardId = useId();

  return (
    <li className="relative" {...(compact ? hoverProps : {})}>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-describedby={showCard ? cardId : undefined}
        className={cn(
          "group flex h-10 items-center rounded-soft px-2 text-[0.95rem] font-semibold transition-colors sm:px-3",
          compact ? (open ? "gap-1.5" : "gap-0 focus-visible:gap-1.5") : "gap-1.5",
          active
            ? "bg-herb-soft text-herb"
            : "text-ink-muted hover:bg-surface-muted hover:text-ink",
          compact && open && !active && "bg-surface-muted text-ink",
        )}
      >
        <Icon aria-hidden className={cn("size-[1.15rem]", !compact && "max-sm:hidden")} />
        {compact ? (
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out",
              open
                ? "max-w-40 opacity-100"
                : "max-w-0 opacity-0 group-focus-visible:max-w-40 group-focus-visible:opacity-100",
            )}
          >
            {label}
          </span>
        ) : (
          label
        )}
      </Link>
      {showCard && <GuideHoverCard id={cardId} />}
    </li>
  );
}
