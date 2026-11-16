"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Pencil, RotateCcw, Trash2 } from "lucide-react";
import {
  deleteTopicAction,
  restoreTopicAction,
  setTopicHiddenAction,
} from "@/app/actions/topic-actions";
import { Button, buttonClass } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useActionFeedback } from "@/components/features/admin/use-action-feedback";
import type { EffectiveTopic } from "@/domain/topics";
import { th } from "@/i18n/th";

const a = th.admin.actions;
const c = th.admin.confirm;

type Dialog = null | "restore" | "delete" | "delete-final";

/**
 * Per-topic admin actions (Constitution VI): built-ins can be hidden/restored but never deleted;
 * custom topics can be deleted only after two confirmations.
 */
export function TopicRowActions({ topic }: { topic: EffectiveTopic }) {
  const { run, pending } = useActionFeedback();
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);
  const label = (action: string) => `${action} ${topic.title}`;

  const toggleHidden = () =>
    run(
      () =>
        setTopicHiddenAction({
          id: topic.id,
          hidden: !topic.hidden,
          expectedVersion: topic.version,
        }),
      topic.hidden ? th.admin.shown : th.admin.hidden,
    );

  const restore = async () => {
    await run(
      () => restoreTopicAction({ id: topic.id, expectedVersion: topic.version }),
      th.admin.restored,
    );
    close();
  };

  const remove = async () => {
    await run(() => deleteTopicAction({ id: topic.id }), th.admin.deleted);
    close();
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link
        href={`/admin/topics/${encodeURIComponent(topic.id)}`}
        aria-label={label(a.edit)}
        className={buttonClass("ghost", "sm")}
      >
        <Pencil aria-hidden className="size-4" />
        {a.edit}
      </Link>
      <Button
        variant="ghost"
        size="sm"
        pending={pending}
        aria-label={label(topic.hidden ? a.show : a.hide)}
        onClick={toggleHidden}
      >
        {topic.hidden ? (
          <Eye aria-hidden className="size-4" />
        ) : (
          <EyeOff aria-hidden className="size-4" />
        )}
        {topic.hidden ? a.show : a.hide}
      </Button>
      {topic.status === "edited" && (
        <Button
          variant="ghost"
          size="sm"
          aria-label={label(a.restore)}
          onClick={() => setDialog("restore")}
        >
          <RotateCcw aria-hidden className="size-4" />
          {a.restore}
        </Button>
      )}
      {topic.origin === "custom" && (
        <Button
          variant="quiet-danger"
          size="sm"
          aria-label={label(a.delete)}
          onClick={() => setDialog("delete")}
        >
          <Trash2 aria-hidden className="size-4" />
          {a.delete}
        </Button>
      )}

      <ConfirmDialog
        open={dialog === "restore"}
        title={c.restoreTitle}
        body={c.restoreBody}
        confirmLabel={a.restore}
        pending={pending}
        onConfirm={restore}
        onCancel={close}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        title={c.deleteTitle}
        body={c.deleteBody}
        confirmLabel={a.delete}
        tone="danger"
        onConfirm={() => setDialog("delete-final")}
        onCancel={close}
      />
      <ConfirmDialog
        open={dialog === "delete-final"}
        title={c.deleteFinalTitle}
        body={c.deleteFinalBody}
        confirmLabel={c.deleteFinal}
        tone="danger"
        pending={pending}
        onConfirm={remove}
        onCancel={close}
      />
    </div>
  );
}
