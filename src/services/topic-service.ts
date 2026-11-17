import { randomUUID } from "node:crypto";
import type { SessionUser } from "@/auth/session";
import { ConflictError, NotDeletableError, NotFoundError, ValidationError } from "@/domain/errors";
import { assertAdmin, assertCanPublish, canPublish } from "@/domain/permissions";
import { parseTopicContent, type TopicContent } from "@/domain/topic";
import {
  mergeTopics,
  visibleTopics,
  type BaseTopic,
  type EffectiveTopic,
  type StoredTopic,
  type TopicDraft,
} from "@/domain/topics";
import { DEFAULT_TAXONOMY, type Taxonomy } from "@/domain/taxonomy";
import { th } from "@/i18n/th";
import type { TopicRepository } from "@/repositories/types";

export interface TopicServiceDeps {
  topics: TopicRepository;
  base: BaseTopic[];
  now: () => Date;
  newId?: () => string;
  /** Current categories/levels; topics must use existing ids. Defaults to the built-in set. */
  taxonomy?: () => Promise<Taxonomy>;
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

  /** Parse content and check its category/level exist in the current (editable) taxonomy. */
  async function parseContent(input: unknown): Promise<TopicContent> {
    const content = parseTopicContent(input);
    const t = deps.taxonomy ? await deps.taxonomy() : DEFAULT_TAXONOMY;
    const fieldErrors: Record<string, string[]> = {};
    if (!t.categories.some((c) => c.id === content.categoryId)) {
      fieldErrors.categoryId = [th.validation.category];
    }
    if (!t.levels.some((l) => l.id === content.level)) fieldErrors.level = [th.validation.level];
    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidationError(th.errors.validation, fieldErrors);
    }
    return content;
  }

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
    patch: { content?: TopicContent | null; hidden?: boolean; draft?: TopicDraft | null },
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
        draft: patch.draft !== undefined ? patch.draft : (existing?.draft ?? null),
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

  const newDraft = (user: SessionUser, content: TopicContent): TopicDraft => ({
    content,
    by: user.displayName,
    at: deps.now().toISOString(),
    status: "pending",
    note: null,
  });

  /** Approvers publish directly; authors create a draft-only topic viewers can't see yet. */
  async function createTopic(actor: Actor, input: unknown): Promise<EffectiveTopic> {
    const user = assertAdmin(actor);
    const content = await parseContent(input);
    const publish = canPublish(user);
    const stamp = deps.now().toISOString();
    const stored = await readStored();
    const saved = await deps.topics.upsert(
      {
        id: newId(),
        origin: "custom",
        content: publish ? content : null,
        draft: publish ? null : newDraft(user, content),
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
    const content = await parseContent(input.content);
    // Approver/owner: publish now (any pending draft is superseded). Author: (re)submit a draft.
    if (canPublish(user))
      return write(user, input.id, input.expectedVersion, { content, draft: null });
    return write(user, input.id, input.expectedVersion, { draft: newDraft(user, content) });
  }

  async function pendingDraft(id: string): Promise<TopicDraft> {
    const draft = find(await readStored(), id).draft;
    if (!draft) throw new ValidationError(th.admin.review.noDraft);
    return draft;
  }

  /** Publish the author's draft as-is. */
  async function approveDraft(
    actor: Actor,
    input: { id: string; expectedVersion: number },
  ): Promise<EffectiveTopic> {
    const user = assertCanPublish(actor);
    const draft = await pendingDraft(input.id);
    return write(user, input.id, input.expectedVersion, { content: draft.content, draft: null });
  }

  /** Send the draft back to the author with a reason; viewers keep the published version. */
  async function rejectDraft(
    actor: Actor,
    input: { id: string; expectedVersion: number; note: string },
  ): Promise<EffectiveTopic> {
    const user = assertCanPublish(actor);
    const note = input.note.trim();
    if (!note)
      throw new ValidationError(th.validation.required, { note: [th.validation.required] });
    const draft = await pendingDraft(input.id);
    return write(user, input.id, input.expectedVersion, {
      draft: { ...draft, status: "rejected", note },
    });
  }

  /** Withdraw a draft (any admin). A topic that only ever existed as a draft is removed. */
  async function discardDraft(
    actor: Actor,
    input: { id: string; expectedVersion: number },
  ): Promise<{ id: string; removed: boolean }> {
    const user = assertAdmin(actor);
    const existing = await deps.topics.get(input.id);
    if (!existing?.draft) throw new ValidationError(th.admin.review.noDraft);
    if (existing.version !== input.expectedVersion) throw new ConflictError();
    if (existing.origin === "custom" && existing.content === null) {
      await deps.topics.delete(input.id);
      lastKnown.set(
        deps.topics,
        (lastKnown.get(deps.topics) ?? []).filter((s) => s.id !== input.id),
      );
      return { id: input.id, removed: true };
    }
    await write(user, input.id, input.expectedVersion, { draft: null });
    return { id: input.id, removed: false };
  }

  async function setHidden(
    actor: Actor,
    input: { id: string; hidden: boolean; expectedVersion: number },
  ): Promise<EffectiveTopic> {
    const user = assertCanPublish(actor);
    return write(user, input.id, input.expectedVersion, { hidden: input.hidden });
  }

  async function restoreTopic(
    actor: Actor,
    input: { id: string; expectedVersion: number },
  ): Promise<EffectiveTopic> {
    const user = assertCanPublish(actor);
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
    assertCanPublish(actor);
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
    approveDraft,
    rejectDraft,
    discardDraft,
    setHidden,
    restoreTopic,
    deleteTopic,
  };
}

export type TopicService = ReturnType<typeof createTopicService>;
