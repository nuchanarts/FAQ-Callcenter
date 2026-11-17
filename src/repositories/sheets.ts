import { ConflictError } from "@/domain/errors";
import { toRole } from "@/domain/permissions";
import type { Taxonomy } from "@/domain/taxonomy";
import type { StoredTopic, TopicOrigin } from "@/domain/topics";
import type { AdminUserRecord, Repositories } from "@/repositories/types";

/**
 * Google Sheet backend (DATA_BACKEND=sheets): FAQ topics in tab "faq_topics", admin accounts
 * in tab "admin_users", read/written through the Apps Script web app
 * (scripts/google-sheet-webhook.gs) with the shared secret — so the Sheet itself can stay
 * private ("Restricted"). Version checks run inside the script under a lock.
 *
 * Reads are cached briefly per server instance (topics 20 s, admins 60 s) because each script
 * call takes ~1 s; this instance's own writes refresh the cache immediately.
 */
const TIMEOUT_MS = 15_000;
const TOPICS_TTL_MS = 20_000;
const ADMINS_TTL_MS = 60_000;

/** One row as the script stores it: plain text cells, JSON for content/draft. */
interface TopicRow {
  id: string;
  origin: string;
  version: string;
  hidden: string;
  content_json: string;
  draft_json: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

interface AdminRow {
  id: string;
  email: string;
  display_name: string;
  role: string;
  password_hash: string;
  active: string;
}

type ScriptReply = { ok: boolean; data?: unknown; error?: string; conflict?: boolean };

export interface SheetsOptions {
  url: string;
  secret: string;
  fetch?: typeof fetch;
  now?: () => number;
}

const parseJson = <T>(text: string): T | null => (text ? (JSON.parse(text) as T) : null);

export const toStored = (r: TopicRow): StoredTopic => ({
  id: r.id,
  origin: (r.origin === "custom" ? "custom" : "base") as TopicOrigin,
  content: parseJson(r.content_json),
  hidden: r.hidden === "true",
  version: Number(r.version),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  updatedBy: r.updated_by,
  draft: parseJson(r.draft_json),
});

export const toTopicRow = (t: StoredTopic): TopicRow => ({
  id: t.id,
  origin: t.origin,
  version: String(t.version),
  hidden: String(t.hidden),
  content_json: t.content ? JSON.stringify(t.content) : "",
  draft_json: t.draft ? JSON.stringify(t.draft) : "",
  created_at: t.createdAt,
  updated_at: t.updatedAt,
  updated_by: t.updatedBy,
});

const toAdmin = (r: AdminRow): AdminUserRecord => ({
  id: r.id,
  email: r.email.toLowerCase(),
  displayName: r.display_name,
  role: toRole(r.role) ?? "author",
  passwordHash: r.password_hash,
  active: r.active !== "false",
});

const toAdminRow = (a: AdminUserRecord): AdminRow => ({
  id: a.id,
  email: a.email.trim().toLowerCase(),
  display_name: a.displayName,
  role: a.role,
  password_hash: a.passwordHash,
  active: String(a.active),
});

export function createSheetsRepositories(opts: SheetsOptions): Repositories {
  const doFetch = opts.fetch ?? fetch;
  const now = opts.now ?? Date.now;
  let topicsCache: { at: number; rows: StoredTopic[] } | null = null;
  let adminsCache: { at: number; rows: AdminUserRecord[] } | null = null;

  async function call(action: string, payload: Record<string, unknown> = {}): Promise<unknown> {
    const res = await doFetch(opts.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: opts.secret, action, ...payload }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`sheets ${action}: HTTP ${res.status}`);
    const reply = (await res.json()) as ScriptReply;
    if (reply.conflict) throw new ConflictError();
    if (!reply.ok) throw new Error(`sheets ${action}: ${reply.error ?? "failed"}`);
    return reply.data;
  }

  async function listTopics(): Promise<StoredTopic[]> {
    if (topicsCache && now() - topicsCache.at < TOPICS_TTL_MS)
      return structuredClone(topicsCache.rows);
    const rows = ((await call("topics.list")) as TopicRow[]).map(toStored);
    topicsCache = { at: now(), rows };
    return structuredClone(rows);
  }

  async function listAdmins(): Promise<AdminUserRecord[]> {
    if (adminsCache && now() - adminsCache.at < ADMINS_TTL_MS)
      return structuredClone(adminsCache.rows);
    const rows = ((await call("admins.list")) as AdminRow[]).map(toAdmin);
    adminsCache = { at: now(), rows };
    return structuredClone(rows);
  }

  return {
    backend: "sheets",
    topics: {
      list: listTopics,
      async get(id) {
        // Writes check versions inside the script, so a cached read is safe here.
        return (await listTopics()).find((t) => t.id === id) ?? null;
      },
      async upsert(topic, expectedVersion) {
        try {
          const saved = toStored(
            (await call("topics.upsert", { row: toTopicRow(topic), expectedVersion })) as TopicRow,
          );
          if (topicsCache) {
            topicsCache = {
              at: topicsCache.at,
              rows: [...topicsCache.rows.filter((t) => t.id !== saved.id), saved],
            };
          }
          return saved;
        } catch (err) {
          if (err instanceof ConflictError) topicsCache = null; // someone else wrote: refetch
          throw err;
        }
      },
      async delete(id) {
        await call("topics.delete", { id });
        if (topicsCache) {
          topicsCache = { at: topicsCache.at, rows: topicsCache.rows.filter((t) => t.id !== id) };
        }
      },
    },
    taxonomy: {
      async get() {
        const row = (await call("settings.get", { key: "taxonomy" })) as {
          value_json: string;
          version: string;
        } | null;
        return row?.value_json
          ? { taxonomy: JSON.parse(row.value_json) as Taxonomy, version: Number(row.version) }
          : null;
      },
      async save(taxonomy, expectedVersion) {
        const version = (expectedVersion ?? 0) + 1;
        await call("settings.set", {
          key: "taxonomy",
          value_json: JSON.stringify(taxonomy),
          version: String(version),
          expectedVersion,
        });
        return { taxonomy, version };
      },
    },
    admins: {
      async findByEmail(email) {
        const key = email.trim().toLowerCase();
        return (await listAdmins()).find((a) => a.email === key) ?? null;
      },
      list: listAdmins,
      async upsert(admin) {
        const saved = toAdmin(
          (await call("admins.upsert", { row: toAdminRow(admin) })) as AdminRow,
        );
        adminsCache = null;
        return saved;
      },
    },
  };
}
