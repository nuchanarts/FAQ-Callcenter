import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ConflictError } from "@/domain/errors";
import { toRole } from "@/domain/permissions";
import type { TopicContent } from "@/domain/topic";
import type { Taxonomy } from "@/domain/taxonomy";
import type { StoredTopic, TopicDraft, TopicOrigin } from "@/domain/topics";
import type { UsageCount, UsageKind } from "@/domain/usage";
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
  deleted: boolean | null;
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
  deleted: r.deleted ?? false,
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
  deleted: t.deleted ?? false,
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
 * Schema + RLS: supabase/migrations/0001_init.sql … 0006_usage.sql.
 */
/** Rows per request when reading usage counters (≤ the API's max-rows, 1000 by default). */
const USAGE_PAGE = 1000;

export function createSupabaseRepositories(opts: {
  url: string;
  serviceRoleKey: string;
}): Repositories {
  const db: SupabaseClient = createClient(opts.url, opts.serviceRoleKey, {
    auth: { persistSession: false },
  });

  return {
    backend: "supabase",
    stats: {
      async increment({ day, kind, topicId }) {
        // Atomic upsert (+1) in the database, safe across concurrent server instances.
        const { error } = await db.rpc("increment_usage", {
          p_day: day,
          p_kind: kind,
          p_topic_id: topicId,
        });
        if (error) throw error;
      },
      async list(sinceDay) {
        // The API returns at most ~1000 rows per request: page through, in a stable order.
        const out: UsageCount[] = [];
        for (let from = 0; ; from += USAGE_PAGE) {
          let query = db
            .from("usage_daily")
            .select("day, kind, topic_id, count")
            .order("day")
            .order("kind")
            .order("topic_id");
          if (sinceDay) query = query.gte("day", sinceDay);
          const { data, error } = await query.range(from, from + USAGE_PAGE - 1);
          if (error) throw error;
          const rows = data as { day: string; kind: string; topic_id: string; count: number }[];
          for (const r of rows) {
            out.push({
              day: r.day,
              kind: r.kind as UsageKind,
              topicId: r.topic_id,
              count: r.count,
            });
          }
          if (rows.length < USAGE_PAGE) return out;
        }
      },
    },
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
    taxonomy: {
      async get() {
        const { data, error } = await db
          .from("app_settings")
          .select("value, version")
          .eq("key", "taxonomy")
          .maybeSingle();
        if (error) throw error;
        return data ? { taxonomy: data.value as Taxonomy, version: data.version as number } : null;
      },
      async save(taxonomy, expectedVersion) {
        const version = (expectedVersion ?? 0) + 1;
        if (expectedVersion === null) {
          const { error } = await db
            .from("app_settings")
            .insert({ key: "taxonomy", value: taxonomy, version });
          if (error?.code === UNIQUE_VIOLATION) throw new ConflictError();
          if (error) throw error;
          return { taxonomy, version };
        }
        const { data, error } = await db
          .from("app_settings")
          .update({ value: taxonomy, version, updated_at: new Date().toISOString() })
          .eq("key", "taxonomy")
          .eq("version", expectedVersion)
          .select("key");
        if (error) throw error;
        if (!data?.length) throw new ConflictError();
        return { taxonomy, version };
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
