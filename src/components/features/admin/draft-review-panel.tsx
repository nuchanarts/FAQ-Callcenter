"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Trash2, Undo2 } from "lucide-react";
import {
  approveDraftAction,
  discardDraftAction,
  rejectDraftAction,
} from "@/app/actions/topic-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useActionFeedback } from "@/components/features/admin/use-action-feedback";
import type { EffectiveTopic } from "@/domain/topics";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";

const r = th.admin.review;

const dateFormat = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

/**
 * Shown above the edit form when a topic has an author's draft.
 * Approvers: approve (publish as-is), reject with a reason, or discard.
 * Authors: see the approver's note when rejected, and can withdraw the draft.
 */
export function DraftReviewPanel({
  topic,
  canPublish,
}: {
  topic: EffectiveTopic;
  canPublish: boolean;
}) {
  const router = useRouter();
  const { run, pending } = useActionFeedback();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const draft = topic.draft;
  if (!draft) return null;

  const ref = { id: topic.id, expectedVersion: topic.version };
  const rejected = draft.status === "rejected";

  const approve = async () => {
    const res = await run(() => approveDraftAction(ref), r.approved);
    if (res.ok) router.push("/admin");
  };
  const reject = async () => {
    const res = await run(() => rejectDraftAction({ ...ref, note }), r.rejected);
    if (res.ok) setRejecting(false);
  };
  const discard = async () => {
    const res = await run(() => discardDraftAction(ref), r.discarded);
    if (res.ok) router.push("/admin");
  };

  return (
    <section
      aria-label={rejected ? r.rejectedTitle : r.title}
      className={cn(
        "flex flex-col gap-3 rounded-soft border px-5 py-4",
        rejected
          ? "border-danger/40 bg-danger-soft"
          : "border-level-partial/40 bg-level-partial-soft",
      )}
    >
      <div>
        <p className={cn("text-lg font-bold", rejected ? "text-danger" : "text-level-partial")}>
          {rejected ? r.rejectedTitle : r.title}
        </p>
        <p className="text-[0.95rem] text-ink-muted">
          {r.by(draft.by, dateFormat.format(new Date(draft.at)))}
        </p>
        {rejected && draft.note && (
          <p className="mt-2 rounded-soft bg-surface px-3 py-2 text-ink">
            <span className="font-semibold">{r.note}: </span>
            {draft.note}
          </p>
        )}
        <p className="mt-2 text-[0.93rem] text-ink-muted">
          {canPublish ? r.publishSupersedes : r.editingDraft}
        </p>
      </div>

      {rejecting && (
        <div className="flex flex-col gap-2">
          <label htmlFor="reject-note" className="font-semibold">
            {r.note}
          </label>
          <Textarea
            id="reject-note"
            rows={3}
            maxLength={500}
            placeholder={r.notePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canPublish && !rejected && !rejecting && (
          <Button size="md" pending={pending} onClick={approve}>
            <CheckCircle2 aria-hidden className="size-5" />
            {r.approve}
          </Button>
        )}
        {canPublish && !rejected && (
          <Button
            variant="secondary"
            size="md"
            pending={pending && rejecting}
            disabled={rejecting && note.trim() === ""}
            onClick={rejecting ? reject : () => setRejecting(true)}
          >
            <Undo2 aria-hidden className="size-5" />
            {r.reject}
          </Button>
        )}
        {rejecting && (
          <Button variant="ghost" size="md" onClick={() => setRejecting(false)}>
            {th.admin.actions.cancel}
          </Button>
        )}
        {!rejecting && (
          <Button variant="quiet-danger" size="md" pending={pending} onClick={discard}>
            <Trash2 aria-hidden className="size-5" />
            {r.discard}
          </Button>
        )}
      </div>
    </section>
  );
}
