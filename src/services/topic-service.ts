import { randomUUID } from "node:crypto";
import type { SessionUser } from "@/auth/session";
import { NotDeletableError, NotFoundError, ValidationError } from "@/domain/errors";
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
  /** true when the store failed and only built-in content is shown (FR-019). */
  degraded: boolean;
}

type Actor = SessionUser | null;

/** Version 0 means "never stored": the repository must insert instead of update. */
const repoExpected = (version: number): number | null => (version === 0 ? null : version);

/** Topic use cases. All business rules live here or in src/domain (Constitution XIV). */
export function createTopicService(deps: TopicServiceDeps) {
  const newId = deps.newId ?? (() => `c-${randomUUID()}`);
  const baseById = new Map(deps.base.map((b) => [b.id, b]));

  async function allTopics(): Promise<EffectiveTopic[]> {
    return mergeTopics(deps.base, await deps.topics.list());
  }

  async function findOrThrow(id: string): Promise<EffectiveTopic> {
    const found = (await allTopics()).find((t) => t.id === id);
    if (!found) throw new NotFoundError("topic");
    return found;
  }

  /** Write a new version of a topic record and return the merged result. */
  async function write(
    actor: SessionUser,
    current: EffectiveTopic,
    expectedVersion: number,
    patch: { content?: TopicContent | null; hidden?: boolean },
  ): Promise<EffectiveTopic> {
    const existing = await deps.topics.get(current.id);
    const stamp = deps.now().toISOString();
    const next: StoredTopic = {
      id: current.id,
      origin: current.origin,
      content: patch.content !== undefined ? patch.content : (existing?.content ?? null),
      hidden: patch.hidden ?? existing?.hidden ?? false,
      version: expectedVersion + 1,
      createdAt: existing?.createdAt ?? stamp,
      updatedAt: stamp,
      updatedBy: actor.displayName,
    };
    await deps.topics.upsert(next, repoExpected(expectedVersion));
    return findOrThrow(current.id);
  }

  // ── Viewer ──────────────────────────────────────────────────────────

  async function getPublicTopics(): Promise<PublicTopics> {
    try {
      return { topics: visibleTopics(await allTopics()), degraded: false };
    } catch (err) {
      console.error("[topics] store unavailable, serving built-in content", err);
      return { topics: mergeTopics(deps.base, []), degraded: true };
    }
  }

  async function findPublicTopic(id: string): Promise<EffectiveTopic | null> {
    const { topics } = await getPublicTopics();
    return topics.find((t) => t.id === id) ?? null;
  }

  // ── Admin (every function re-checks the session: FR-012) ─────────────

  async function listForAdmin(actor: Actor): Promise<EffectiveTopic[]> {
    assertAdmin(actor);
    return allTopics();
  }

  async function getForAdmin(actor: Actor, id: string): Promise<EffectiveTopic> {
    assertAdmin(actor);
    return findOrThrow(id);
  }

  async function createTopic(actor: Actor, input: unknown): Promise<EffectiveTopic> {
    const user = assertAdmin(actor);
    const content = parseTopicContent(input);
    const stamp = deps.now().toISOString();
    const id = newId();
    await deps.topics.upsert(
      {
        id,
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
    return findOrThrow(id);
  }

  async function saveTopic(
    actor: Actor,
    input: { id: string; expectedVersion: number; content: unknown },
  ): Promise<EffectiveTopic> {
    const user = assertAdmin(actor);
    const content = parseTopicContent(input.content);
    const current = await findOrThrow(input.id);
    return write(user, current, input.expectedVersion, { content });
  }

  async function setHidden(
    actor: Actor,
    input: { id: string; hidden: boolean; expectedVersion: number },
  ): Promise<EffectiveTopic> {
    const user = assertAdmin(actor);
    const current = await findOrThrow(input.id);
    return write(user, current, input.expectedVersion, { hidden: input.hidden });
  }

  async function restoreTopic(
    actor: Actor,
    input: { id: string; expectedVersion: number },
  ): Promise<EffectiveTopic> {
    const user = assertAdmin(actor);
    const current = await findOrThrow(input.id);
    if (!baseById.has(current.id)) throw new ValidationError();
    if (current.version === 0) return current;
    return write(user, current, input.expectedVersion, { content: null });
  }

  async function deleteTopic(actor: Actor, id: string): Promise<{ id: string }> {
    assertAdmin(actor);
    if (baseById.has(id)) throw new NotDeletableError();
    const existing = await deps.topics.get(id);
    if (!existing) throw new NotFoundError("topic");
    await deps.topics.delete(id);
    return { id };
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
