import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { StoredTopic } from "@/domain/topics";
import {
  applyAdminUpsert,
  applyTaxonomySave,
  applyUpsert,
  findAdminByEmail,
  findTopic,
  listTopics,
} from "@/repositories/topic-store";
import type { AdminUserRecord, Repositories, StoredTaxonomy } from "@/repositories/types";

interface FileShape {
  topics: StoredTopic[];
  /** Absent until an admin account is first changed; until then the seed admins apply. */
  admins?: AdminUserRecord[];
  taxonomy?: StoredTaxonomy;
}

/**
 * JSON-file store for local development (default). Reads on every call so separate
 * server bundles never see stale data; writes are serialized and atomic (tmp + rename).
 */
export function createFileRepositories(opts: {
  file: string;
  admins: AdminUserRecord[];
}): Repositories {
  const { file } = opts;
  let queue: Promise<unknown> = Promise.resolve();

  async function loadAll(): Promise<FileShape> {
    try {
      const data = JSON.parse(await readFile(file, "utf8")) as Partial<FileShape>;
      return {
        topics: Array.isArray(data.topics) ? data.topics : [],
        admins: Array.isArray(data.admins) ? data.admins : undefined,
        taxonomy: data.taxonomy,
      };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return { topics: [] };
      throw err;
    }
  }

  const load = async () => (await loadAll()).topics;
  const loadAdmins = async () => (await loadAll()).admins ?? opts.admins;

  async function saveAll(data: FileShape): Promise<void> {
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await rename(tmp, file);
  }

  async function save(topics: StoredTopic[]): Promise<void> {
    const current = await loadAll();
    await saveAll({ ...current, topics });
  }

  function serialized<T>(fn: () => Promise<T>): Promise<T> {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
  }

  return {
    backend: "file",
    taxonomy: {
      async get() {
        return (await loadAll()).taxonomy ?? null;
      },
      save(taxonomy, expectedVersion) {
        return serialized(async () => {
          const current = await loadAll();
          const next = applyTaxonomySave(current.taxonomy ?? null, taxonomy, expectedVersion);
          await saveAll({ ...current, taxonomy: next });
          return next;
        });
      },
    },
    admins: {
      async findByEmail(email) {
        return findAdminByEmail(await loadAdmins(), email);
      },
      async list() {
        return structuredClone(await loadAdmins());
      },
      upsert(admin) {
        return serialized(async () => {
          const current = await loadAll();
          const admins = applyAdminUpsert(current.admins ?? opts.admins, admin);
          await saveAll({ ...current, admins });
          return findAdminByEmail(admins, admin.email)!;
        });
      },
    },
    topics: {
      async list() {
        return listTopics(await load());
      },
      async get(id) {
        return findTopic(await load(), id);
      },
      upsert(topic, expectedVersion) {
        return serialized(async () => {
          const next = applyUpsert(await load(), topic, expectedVersion);
          await save(next);
          return findTopic(next, topic.id)!;
        });
      },
      delete(id) {
        return serialized(async () => {
          await save((await load()).filter((r) => r.id !== id));
        });
      },
    },
  };
}
