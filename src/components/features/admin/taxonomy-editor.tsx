"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { saveTaxonomyAction } from "@/app/actions/taxonomy-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useActionFeedback } from "@/components/features/admin/use-action-feedback";
import { CategoryIcon } from "@/components/features/topic/category-icon";
import { LEVEL_ICON_COMPONENTS } from "@/components/features/topic/level-badge";
import {
  CATEGORY_ICONS,
  LEVEL_ICONS,
  LEVEL_TONES,
  type CategoryDef,
  type LevelDef,
  type Taxonomy,
} from "@/domain/taxonomy";
import { th } from "@/i18n/th";

const t = th.taxonomy;

interface Props {
  initial: {
    taxonomy: Taxonomy;
    version: number;
    usage: { categories: Record<string, number>; levels: Record<string, number> };
  };
}

function move<T>(list: T[], index: number, delta: number): T[] {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

/** Edit categories and levels (approvers/owners). Saved as one document; in-use entries can't be removed. */
export function TaxonomyEditor({ initial }: Props) {
  const { run, pending } = useActionFeedback();
  const [categories, setCategories] = useState<CategoryDef[]>(initial.taxonomy.categories);
  const [levels, setLevels] = useState<LevelDef[]>(initial.taxonomy.levels);
  const [error, setError] = useState<string | null>(null);
  const used = initial.usage;

  const save = async () => {
    setError(null);
    const res = await run(
      () =>
        saveTaxonomyAction({ taxonomy: { categories, levels }, expectedVersion: initial.version }),
      t.saved,
    );
    if (!res.ok) setError(res.error.message);
  };

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <p
          role="alert"
          className="rounded-soft border border-danger/40 bg-danger-soft px-4 py-3 font-semibold text-danger"
        >
          {error}
        </p>
      )}

      <section aria-labelledby="cat-heading" className="flex flex-col gap-3">
        <h2 id="cat-heading" className="text-2xl font-semibold">
          {t.categories}
        </h2>
        <ul className="flex flex-col gap-2">
          {categories.map((c, i) => {
            const count = used.categories[c.id] ?? 0;
            const update = (patch: Partial<CategoryDef>) =>
              setCategories((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
            return (
              <li
                key={c.id || `new-${i}`}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-2 rounded-soft border border-line bg-surface p-3 md:grid-cols-[2.5rem_minmax(0,1fr)_11rem_auto_auto]"
              >
                <span className="flex size-10 items-center justify-center rounded-soft bg-herb-soft text-herb">
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <Input
                  aria-label={`${t.name} ${c.name}`}
                  value={c.name}
                  maxLength={60}
                  onChange={(e) => update({ name: e.target.value })}
                />
                <Select
                  aria-label={`${t.icon} ${c.name}`}
                  value={c.icon}
                  onChange={(e) => update({ icon: e.target.value as CategoryDef["icon"] })}
                >
                  {CATEGORY_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </Select>
                <span>{count > 0 && <Badge tone="neutral">{t.usedBy(count)}</Badge>}</span>
                <RowButtons
                  label={c.name}
                  canRemove={count === 0}
                  onUp={() => setCategories((l) => move(l, i, -1))}
                  onDown={() => setCategories((l) => move(l, i, 1))}
                  onRemove={() => setCategories((l) => l.filter((_, j) => j !== i))}
                />
              </li>
            );
          })}
        </ul>
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() =>
            setCategories((l) => [...l, { id: "", name: t.newCategory, icon: "circle-help" }])
          }
        >
          <Plus aria-hidden className="size-4" />
          {t.addCategory}
        </Button>
      </section>

      <section aria-labelledby="lvl-heading" className="flex flex-col gap-3">
        <h2 id="lvl-heading" className="text-2xl font-semibold">
          {t.levels}
        </h2>
        <ul className="flex flex-col gap-2">
          {levels.map((l, i) => {
            const count = used.levels[l.id] ?? 0;
            const update = (patch: Partial<LevelDef>) =>
              setLevels((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
            const Icon = LEVEL_ICON_COMPONENTS[l.icon];
            return (
              <li
                key={l.id || `new-${i}`}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-2 rounded-soft border border-line bg-surface p-3 md:grid-cols-[2.5rem_minmax(0,1fr)_11rem_auto_auto]"
              >
                <span className="flex size-10 items-center justify-center" title={l.name}>
                  <Badge tone={l.tone} icon={<Icon aria-hidden className="size-4" />}>
                    <span className="sr-only">{l.name}</span>
                  </Badge>
                </span>
                <Input
                  aria-label={`${t.name} ${l.name}`}
                  value={l.name}
                  maxLength={60}
                  onChange={(e) => update({ name: e.target.value })}
                />
                <span className="grid grid-cols-2 gap-2">
                  <Select
                    aria-label={`${t.tone} ${l.name}`}
                    value={l.tone}
                    onChange={(e) => update({ tone: e.target.value as LevelDef["tone"] })}
                  >
                    {LEVEL_TONES.map((tone) => (
                      <option key={tone} value={tone}>
                        {t.tones[tone]}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label={`${t.icon} ${l.name}`}
                    value={l.icon}
                    onChange={(e) => update({ icon: e.target.value as LevelDef["icon"] })}
                  >
                    {LEVEL_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </Select>
                </span>
                <span>{count > 0 && <Badge tone="neutral">{t.usedBy(count)}</Badge>}</span>
                <RowButtons
                  label={l.name}
                  canRemove={count === 0}
                  onUp={() => setLevels((list) => move(list, i, -1))}
                  onDown={() => setLevels((list) => move(list, i, 1))}
                  onRemove={() => setLevels((list) => list.filter((_, j) => j !== i))}
                />
              </li>
            );
          })}
        </ul>
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() =>
            setLevels((l) => [...l, { id: "", name: t.newLevel, tone: "neutral", icon: "info" }])
          }
        >
          <Plus aria-hidden className="size-4" />
          {t.addLevel}
        </Button>
      </section>

      <Button size="lg" pending={pending} className="self-start" onClick={save}>
        <Save aria-hidden className="size-5" />
        {t.save}
      </Button>
    </div>
  );
}

function RowButtons({
  label,
  canRemove,
  onUp,
  onDown,
  onRemove,
}: {
  label: string;
  canRemove: boolean;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <span className="flex items-center gap-1">
      <Button variant="ghost" size="sm" aria-label={`${t.moveUp} ${label}`} onClick={onUp}>
        <ArrowUp aria-hidden className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" aria-label={`${t.moveDown} ${label}`} onClick={onDown}>
        <ArrowDown aria-hidden className="size-4" />
      </Button>
      <Button
        variant="quiet-danger"
        size="sm"
        disabled={!canRemove}
        title={canRemove ? undefined : t.cannotRemove}
        aria-label={`${t.remove} ${label}`}
        onClick={onRemove}
      >
        <Trash2 aria-hidden className="size-4" />
        {t.remove}
      </Button>
    </span>
  );
}
