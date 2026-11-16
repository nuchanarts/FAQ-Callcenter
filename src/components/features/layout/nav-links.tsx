"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, House, MessageSquareWarning, Settings2 } from "lucide-react";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: th.nav.home, icon: House },
  { href: "/report", label: th.nav.report, icon: MessageSquareWarning },
  { href: "/guide", label: th.nav.guide, icon: BookOpen },
] as const;

const ADMIN_LINK = { href: "/admin", label: th.nav.admin, icon: Settings2 } as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname() ?? "/";
  const links = isAdmin ? [...LINKS, ADMIN_LINK] : LINKS;
  return (
    <ul className="flex items-center gap-0.5 sm:gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-soft px-2 text-[0.95rem] font-semibold transition-colors sm:px-3",
                active
                  ? "bg-herb-soft text-herb"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              <Icon aria-hidden className="size-[1.15rem] max-sm:hidden" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
