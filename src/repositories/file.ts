import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { StoredTopic } from "@/domain/topics";
import {
  applyUpsert,
  createAdminUserRepository,
  findTopic,
  listTopics,
} from "@/repositories/topic-store";
import type { AdminUserRecord, Repositories } from "@/repositories/types";

interface FileShape {
  topics: StoredTopic[];
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

  async function load(): Promise<StoredTopic[]> {
    try {
      const data = JSON.parse(await readFile(file, "utf8")) as Partial<FileShape>;
      return Array.isArray(data.topics) ? data.topics : [];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  async function save(topics: StoredTopic[]): Promise<void> {
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify({ topics } satisfies FileShape, null, 2), "utf8");
    await rename(tmp, file);
  }

  function serialized<T>(fn: () => Promise<T>): Promise<T> {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
  }

  return {
    backend: "file",
    admins: createAdminUserRepository(opts.admins),
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
