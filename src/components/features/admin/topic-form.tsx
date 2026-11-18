"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { createTopicAction, saveTopicAction } from "@/app/actions/topic-actions";
import { Button, buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { AttachmentsEditor } from "@/components/features/admin/attachments-editor";
import { SymptomImageEditor } from "@/components/features/admin/symptom-image-editor";
import { ContentRenderer } from "@/components/features/topic/content-renderer";
import { SymptomImage } from "@/components/features/topic/symptom-image";
import { TopicImages } from "@/components/features/topic/topic-images";
import { LevelBadge } from "@/components/features/topic/level-badge";
import type { CategoryId } from "@/domain/categories";
import { useTaxonomy } from "@/components/features/taxonomy/taxonomy-context";
import type { ActionError } from "@/domain/errors";
import type { Level } from "@/domain/levels";
import {
  parseKeywords,
  TOPIC_LIMITS,
  type Attachment,
  type SymptomImage as SymptomImageValue,
} from "@/domain/topic";
import type { EffectiveTopic } from "@/domain/topics";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { th } from "@/i18n/th";
import { cn } from "@/lib/cn";

const f = th.admin.form;

/** Create/edit form shared by both admin pages (Constitution XIII), with a live viewer preview. */
export function TopicForm({
  topic,
  canPublish = true,
  imagesEnabled = false,
}: {
  topic?: EffectiveTopic;
  /** false = author: saving submits a draft for approval instead of publishing. */
  canPublish?: boolean;
  /** Vercel Blob store connected: allow image uploads. */
  imagesEnabled?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const taxonomy = useTaxonomy();
  // Continue from the latest draft when there is one (author's rework or approver's review).
  const start = topic?.draft?.content ?? topic;
  const [title, setTitle] = useState(start?.title ?? "");
  const [categoryId, setCategoryId] = useState<CategoryId | "">(start?.categoryId ?? "");
  const [level, setLevel] = useState<Level>(start?.level ?? taxonomy.levels[0]?.id ?? "");
  const [keywords, setKeywords] = useState(start?.keywords.join(", ") ?? "");
  const [solution, setSolution] = useState(start?.solution ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(start?.attachments ?? []);
  const [symptomImage, setSymptomImage] = useState<SymptomImageValue | null>(
    start?.symptomImage ?? null,
  );
  const [error, setError] = useState<ActionError | null>(null);
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty && !pending);

  const fieldError = (key: string) => error?.fieldErrors?.[key]?.[0];
  /** Wrap a setter so any edit marks the form dirty (unsaved-changes warning). */
  const edit =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      setDirty(true);
      set(v);
    };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    const content = {
      title,
      categoryId,
      level,
      keywords: parseKeywords(keywords),
      solution,
      attachments,
      symptomImage,
    };
    try {
      const result = topic
        ? await saveTopicAction({ id: topic.id, expectedVersion: topic.version, content })
        : await createTopicAction(content);
      if (!result.ok) {
        setError(result.error);
        return;
      }
    } catch {
      // Network failure or a stale deployment: keep the form and the admin's input.
      setError({ code: "unexpected", message: th.errors.unexpected });
      return;
    } finally {
      setPending(false);
    }
    setDirty(false);
    toast.show(canPublish ? th.admin.saved : th.admin.review.submitted);
    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]"
    >
      <div className="flex flex-col gap-5">
        {!canPublish && (
          <p className="rounded-soft border border-level-team/30 bg-level-team-soft px-4 py-3 text-ink">
            {th.admin.review.authorNotice}
          </p>
        )}
        {error && !error.fieldErrors && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-soft border border-danger/40 bg-danger-soft px-4 py-3 font-semibold text-danger"
          >
            {error.message}
            {error.code === "conflict" && (
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw aria-hidden className="size-4" />
                {th.errors.retry}
              </Button>
            )}
          </div>
        )}
        {error?.fieldErrors && (
          <p
            role="alert"
            className="rounded-soft border border-danger/40 bg-danger-soft px-4 py-3 font-semibold text-danger"
          >
            {th.report.fixErrors}
          </p>
        )}

        <Field label={f.title} hint={f.titleHint} error={fieldError("title")} required>
          {(p) => (
            <Input
              {...p}
              maxLength={TOPIC_LIMITS.title}
              value={title}
              onChange={(e) => edit(setTitle)(e.target.value)}
            />
          )}
        </Field>

        <SymptomImageEditor
          value={symptomImage}
          onChange={edit(setSymptomImage)}
          imagesEnabled={imagesEnabled}
          error={fieldError("symptomImage.url") ?? fieldError("symptomImage.caption")}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.category} error={fieldError("categoryId")} required>
            {(p) => (
              <Select
                {...p}
                value={categoryId}
                onChange={(e) => edit(setCategoryId)(e.target.value as CategoryId)}
              >
                <option value="" disabled>
                  {f.chooseCategory}
                </option>
                {taxonomy.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <fieldset>
            <legend className="mb-1.5 font-semibold">
              {f.level}
              <span className="ml-1 text-danger" aria-hidden="true">
                *
              </span>
            </legend>
            <div className="flex flex-col gap-1.5">
              {taxonomy.levels.map(({ id: l }) => (
                <label
                  key={l}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-soft border px-3 py-1.5",
                    level === l ? "border-herb bg-herb-soft" : "border-line bg-surface",
                  )}
                >
                  <input
                    type="radio"
                    name="level"
                    value={l}
                    checked={level === l}
                    onChange={() => edit(setLevel)(l)}
                    className="accent-herb"
                  />
                  <LevelBadge level={l} />
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <Field label={f.keywords} hint={f.keywordsHint} error={fieldError("keywords")} optional>
          {(p) => (
            <Input {...p} value={keywords} onChange={(e) => edit(setKeywords)(e.target.value)} />
          )}
        </Field>

        <Field label={f.solution} hint={f.solutionHint} error={fieldError("solution")} required>
          {(p) => (
            <Textarea
              {...p}
              rows={12}
              maxLength={TOPIC_LIMITS.solution}
              value={solution}
              onChange={(e) => edit(setSolution)(e.target.value)}
            />
          )}
        </Field>

        <AttachmentsEditor
          imagesEnabled={imagesEnabled}
          value={attachments}
          errors={error?.fieldErrors ?? {}}
          onChange={edit(setAttachments)}
        />

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" pending={pending}>
            {canPublish ? th.admin.actions.save : th.admin.review.submit}
          </Button>
          <Link href="/admin" className={buttonClass("ghost", "lg")}>
            <ArrowLeft aria-hidden className="size-5" />
            {th.admin.actions.back}
          </Link>
        </div>
      </div>

      <section
        aria-labelledby="preview-heading"
        className="rounded-soft border border-dashed border-line-strong bg-paper p-5 lg:sticky lg:top-24"
      >
        <h2 id="preview-heading" className="mb-3 text-lg font-semibold">
          {f.preview}
        </h2>
        <div className="rounded-soft bg-surface p-4 shadow-raise">
          <p className="text-lg font-semibold">{title || f.title}</p>
          <div className="mt-1.5 mb-4">
            <LevelBadge level={level} />
          </div>
          {symptomImage && (
            <div className="mb-4">
              <SymptomImage image={symptomImage} title={title || f.title} />
            </div>
          )}
          <ContentRenderer source={solution} />
          <div className="mt-4">
            <TopicImages images={attachments.filter((a) => a.kind === "image" && a.url)} />
          </div>
        </div>
      </section>
    </form>
  );
}
