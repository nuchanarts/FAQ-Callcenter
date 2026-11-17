import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/auth/current-admin";
import { buttonClass } from "@/components/ui/button";
import { UsersManager } from "@/components/features/admin/users-manager";
import { canManageUsers } from "@/domain/permissions";
import { th } from "@/i18n/th";
import { userService } from "@/services";

export const metadata: Metadata = { title: th.users.title };

export default async function UsersPage() {
  const admin = await requireAdmin();
  // Only owners manage accounts; others get a plain 404 rather than a hint that it exists.
  if (!canManageUsers(admin)) notFound();
  const users = await userService().listUsers(admin);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{th.users.title}</h1>
          <p className="mt-1 text-ink-muted">{th.users.subtitle}</p>
        </div>
        <Link href="/admin" className={buttonClass("ghost", "md")}>
          <ArrowLeft aria-hidden className="size-5" />
          {th.admin.title}
        </Link>
      </header>
      <UsersManager users={users} meId={admin.id} />
    </div>
  );
}
