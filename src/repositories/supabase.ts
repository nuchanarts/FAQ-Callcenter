import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ConflictError } from "@/domain/errors";
import { toRole } from "@/domain/permissions";
import type { TopicContent } from "@/domain/topic";
import type { StoredTopic, TopicDraft, TopicOrigin } from "@/domain/topics";
import type { AdminUserRecord, Repositories } from "@/repositories/types";

interface TopicRow {
  id: string;
  origin: TopicOrigin;
  content: TopicContent | null;
  hidden: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  updated_by: string;
  draft: TopicDraft | null;
}

interface AdminRow {
  id: string;
  email: string;
  display_name: string;
  role: string;
  password_hash: string;
  active: boolean;
}

const ADMIN_COLUMNS = "id, email, display_name, role, password_hash, active";

const UNIQUE_VIOLATION = "23505";

const toStored = (r: TopicRow): StoredTopic => ({
  id: r.id,
  origin: r.origin,
  content: r.content,
  hidden: r.hidden,
  version: r.version,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  updatedBy: r.updated_by,
  draft: r.draft ?? null,
});

const toRow = (t: StoredTopic): TopicRow => ({
  id: t.id,
  origin: t.origin,
  content: t.content,
  hidden: t.hidden,
  version: t.version,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
  updated_by: t.updatedBy,
  draft: t.draft ?? null,
});

const toAdmin = (r: AdminRow): AdminUserRecord => ({
  id: r.id,
  email: r.email,
  displayName: r.display_name,
  role: toRole(r.role) ?? "author",
  passwordHash: r.password_hash,
  active: r.active ?? true,
});

const toAdminRow = (a: AdminUserRecord): AdminRow => ({
  id: a.id,
  email: a.email.trim().toLowerCase(),
  display_name: a.displayName,
  role: a.role,
  password_hash: a.passwordHash,
  active: a.active,
});

/**
 * Production adapter (server-side only, service-role key).
 * Admin passwords are verified by the app (scrypt) so sessions behave the same on every backend.
 * Schema + RLS: supabase/migrations/0001_init.sql, 0002_roles_drafts.sql.
 */
export function createSupabaseRepositories(opts: {
  url: string;
  serviceRoleKey: string;
}): Repositories {
  const db: SupabaseClient = createClient(opts.url, opts.serviceRoleKey, {
    auth: { persistSession: false },
  });

  return {
    backend: "supabase",
    topics: {
      async list() {
        const { data, error } = await db.from("topics").select("*");
        if (error) throw error;
        return (data as TopicRow[]).map(toStored);
      },
      async get(id) {
        const { data, error } = await db.from("topics").select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        return data ? toStored(data as TopicRow) : null;
      },
      async upsert(topic, expectedVersion) {
        if (expectedVersion === null) {
          const { data, error } = await db.from("topics").insert(toRow(topic)).select().single();
          if (error?.code === UNIQUE_VIOLATION) throw new ConflictError();
          if (error) throw error;
          return toStored(data as TopicRow);
        }
        const { data, error } = await db
          .from("topics")
          .update(toRow(topic))
          .eq("id", topic.id)
          .eq("version", expectedVersion)
          .select();
        if (error) throw error;
        const [row] = data as TopicRow[];
        if (!row) throw new ConflictError();
        return toStored(row);
      },
      async delete(id) {
        const { error } = await db.from("topics").delete().eq("id", id);
        if (error) throw error;
      },
    },
    admins: {
      async findByEmail(email) {
        const { data, error } = await db
          .from("admin_users")
          .select(ADMIN_COLUMNS)
          .eq("email", email.trim().toLowerCase())
          .maybeSingle();
        if (error) throw error;
        return data ? toAdmin(data as AdminRow) : null;
      },
      async list() {
        const { data, error } = await db.from("admin_users").select(ADMIN_COLUMNS).order("email");
        if (error) throw error;
        return (data as AdminRow[]).map(toAdmin);
      },
      async upsert(admin) {
        const { data, error } = await db
          .from("admin_users")
          .upsert(toAdminRow(admin), { onConflict: "id" })
          .select(ADMIN_COLUMNS)
          .single();
        if (error?.code === UNIQUE_VIOLATION) throw new ConflictError();
        if (error) throw error;
        return toAdmin(data as AdminRow);
      },
    },
  };
}
