"use server";

import { z } from "zod";
import { getAdmin } from "@/auth/current-admin";
import { parseOrThrow } from "@/domain/validation";
import type { EffectiveTopic } from "@/domain/topics";
import { runAction, type ActionResult } from "@/lib/action-result";
import { topicService } from "@/services";

// Thin entry points: parse arguments → service (which re-checks the admin) → ActionResult.
// Content validation itself lives in the domain schema (Constitution XIV).

const ref = z.object({ id: z.string().min(1).max(100) });
const versioned = ref.extend({ expectedVersion: z.number().int().min(0) });

type Result = Promise<ActionResult<EffectiveTopic>>;

export async function createTopicAction(content: unknown): Result {
  return runAction(async () => topicService().createTopic(await getAdmin(), content));
}

export async function saveTopicAction(input: {
  id: string;
  expectedVersion: number;
  content: unknown;
}): Result {
  return runAction(async () => {
    const { id, expectedVersion } = parseOrThrow(versioned, input);
    return topicService().saveTopic(await getAdmin(), {
      id,
      expectedVersion,
      content: input.content,
    });
  });
}

export async function setTopicHiddenAction(input: {
  id: string;
  hidden: boolean;
  expectedVersion: number;
}): Result {
  return runAction(async () => {
    const args = parseOrThrow(versioned.extend({ hidden: z.boolean() }), input);
    return topicService().setHidden(await getAdmin(), args);
  });
}

export async function restoreTopicAction(input: { id: string; expectedVersion: number }): Result {
  return runAction(async () =>
    topicService().restoreTopic(await getAdmin(), parseOrThrow(versioned, input)),
  );
}

export async function deleteTopicAction(input: {
  id: string;
  expectedVersion: number;
}): Promise<ActionResult<{ id: string }>> {
  return runAction(async () =>
    topicService().deleteTopic(await getAdmin(), parseOrThrow(versioned, input)),
  );
}

export async function approveDraftAction(input: { id: string; expectedVersion: number }): Result {
  return runAction(async () =>
    topicService().approveDraft(await getAdmin(), parseOrThrow(versioned, input)),
  );
}

export async function rejectDraftAction(input: {
  id: string;
  expectedVersion: number;
  note: string;
}): Result {
  return runAction(async () => {
    const args = parseOrThrow(versioned.extend({ note: z.string().max(500) }), input);
    return topicService().rejectDraft(await getAdmin(), args);
  });
}

export async function discardDraftAction(input: {
  id: string;
  expectedVersion: number;
}): Promise<ActionResult<{ id: string; removed: boolean }>> {
  return runAction(async () =>
    topicService().discardDraft(await getAdmin(), parseOrThrow(versioned, input)),
  );
}

export async function undeleteTopicAction(input: { id: string; expectedVersion: number }): Result {
  return runAction(async () =>
    topicService().undeleteTopic(await getAdmin(), parseOrThrow(versioned, input)),
  );
}
