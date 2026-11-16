import { randomUUID } from "node:crypto";
import type { SessionUser } from "@/auth/session";
import { ConflictError, NotDeletableError, NotFoundError, ValidationError } from "@/domain/errors";
import { assertAdmin } from "@/domain/permissions";
import { parseTopicContent, type TopicContent } from "@/domain/topic";
import {
  mergeTopics,
  visibleTopics,
  type BaseTopic,
  type EffectiveTopic,
  type StoredTopic,
} from "@/domain/topics";
import type { TopicRepository } from "@/repositories/types";

export interface TopicServiceDeps {
  topics: TopicRepository;
  base: BaseTopic[];
  now: () => Date;
  newId?: () => string;
}

export interface PublicTopics {
  topics: EffectiveTopic[];
  /** true when the store failed and only built-in/last-known content is shown (FR-019). */
  degraded: boolean;
}

type Actor = SessionUser | null;

/** Version 0 means "never stored": the repository must insert instead of update. */
const repoExpected = (version: number): number | null => (version === 0 ? null : version);

/**
 * Last successful read per repository. Services are created per request, repositories are
 * process-wide, so this survives across requests and lets an outage keep hidden topics hidden.
 */
const lastKnown = new WeakMap<TopicRepository, StoredTopic[]>();

/** Topic use cases. All business rules live here or in src/domain (Constitution XIV). */
export function createTopicService(deps: TopicServiceDeps) {
  const newId = deps.newId ?? (() => `c-${randomUUID()}`);
  const baseIds = new Set(deps.base.map((b) => b.id));

  async function readStored(): Promise<StoredTopic[]> {
    const stored = await deps.topics.list();
    lastKnown.set(deps.topics, stored);
    return stored;
  }

  function find(stored: StoredTopic[], id: string): EffectiveTopic {
    const found = mergeTopics(deps.base, stored).find((t) => t.id === id);
    if (!found) throw new NotFoundError("topic");
    return found;
  }

  /** One read + one write: apply a patch to a topic record and return the merged result. */
  async function write(
    actor: SessionUser,
    id: string,
    expectedVersion: number,
    patch: { content?: TopicContent | null; hidden?: boolean },
  ): Promise<EffectiveTopic> {
    const stored = await readStored();
    const current = find(stored, id);
    const existing = stored.find((s) => s.id === id);
    const stamp = deps.now().toISOString();
    const saved = await deps.topics.upsert(
      {
        id,
        origin: current.origin,
        content: patch.content !== undefined ? patch.content : (existing?.content ?? null),
        hidden: patch.hidden ?? existing?.hidden ?? false,
        version: expectedVersion + 1,
        createdAt: existing?.createdAt ?? stamp,
        updatedAt: stamp,
        updatedBy: actor.displayName,
      },
      repoExpected(expectedVersion),
    );
    const next = [...stored.filter((s) => s.id !== id), saved];
    lastKnown.set(deps.topics, next);
    return find(next, id);
  }

  // ── Viewer ──────────────────────────────────────────────────────────

  async function getPublicTopics(): Promise<PublicTopics> {
    try {
      return { topics: visibleTopics(mergeTopics(deps.base, await readStored())), degraded: false };
    } catch (err) {
      console.error("[topics] store unavailable, serving built-in/last-known content", err);
      const fallback = lastKnown.get(deps.topics) ?? [];
      return { topics: visibleTopics(mergeTopics(deps.base, fallback)), degraded: true };
    }
  }

  async function findPublicTopic(id: string): Promise<EffectiveTopic | null> {
    const { topics } = await getPublicTopics();
    return topics.find((t) => t.id === id) ?? null;
  }

  // ── Admin (every function re-checks the session: FR-012) ─────────────

  async function listForAdmin(actor: Actor): Promise<EffectiveTopic[]> {
    assertAdmin(actor);
    return mergeTopics(deps.base, await readStored());
  }

  async function getForAdmin(actor: Actor, id: string): Promise<EffectiveTopic> {
    assertAdmin(actor);
    return find(await readStored(), id);
  }

  async function createTopic(actor: Actor, input: unknown): Promise<EffectiveTopic> {
    const user = assertAdmin(actor);
    const content = parseTopicContent(input);
    const stamp = deps.now().toISOString();
    const stored = await readStored();
    const saved = await deps.topics.upsert(
      {
        id: newId(),
        origin: "custom",
        content,
        hidden: false,
        version: 1,
        createdAt: stamp,
        updatedAt: stamp,
        updatedBy: user.displayName,
      },
      null,
    );
    const next = [...stored, saved];
    lastKnown.set(deps.topics, next);
    return find(next, saved.id);
  }

  async function saveTopic(
    actor: Actor,
    input: { id: string; expectedVersion: number; content: unknown },
  ): Promise<EffectiveTopic> {
    const user = assertAdmin(actor);
    const content = parseTopicContent(input.content);
    return write(user, input.id, input.expectedVersion, { content });
  }

  async function setHidden(
    actor: Actor,
    input: { id: string; hidden: boolean; expectedVersion: number },
  ): Promise<EffectiveTopic> {
    const user = assertAdmin(actor);
    return write(user, input.id, input.expectedVersion, { hidden: input.hidden });
  }

  async function restoreTopic(
    actor: Actor,
    input: { id: string; expectedVersion: number },
  ): Promise<EffectiveTopic> {
    const user = assertAdmin(actor);
    if (!baseIds.has(input.id)) {
      // Only built-in topics have an original to restore.
      find(await readStored(), input.id);
      throw new ValidationError();
    }
    if (input.expectedVersion === 0) return find(await readStored(), input.id);
    return write(user, input.id, input.expectedVersion, { content: null });
  }

  async function deleteTopic(
    actor: Actor,
    input: { id: string; expectedVersion: number },
  ): Promise<{ id: string }> {
    assertAdmin(actor);
    if (baseIds.has(input.id)) throw new NotDeletableError();
    const existing = await deps.topics.get(input.id);
    if (!existing) throw new NotFoundError("topic");
    // Never delete content someone changed after this admin loaded it.
    if (existing.version !== input.expectedVersion) throw new ConflictError();
    await deps.topics.delete(input.id);
    return { id: input.id };
  }

  return {
    getPublicTopics,
    findPublicTopic,
    listForAdmin,
    getForAdmin,
    createTopic,
    saveTopic,
    setHidden,
    restoreTopic,
    deleteTopic,
  };
}

export type TopicService = ReturnType<typeof createTopicService>;
