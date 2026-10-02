"use client";

import type { ReactNode } from "react";
import { comparisonsLeft, midpoint, type RankState } from "@/lib/ranking";

export type ItemLabel = { title: string; subtitle?: string };

/** "Which was better?" head-to-head screen. Shown while `state.current` is set. */
export function CompareScreen({
  state,
  label,
  question,
  context,
  gradient,
  topLeft,
  onChoose,
  onTie,
  onUndo,
  canUndo,
  onRemove,
}: {
  /** When given, each card gets a "Didn't see this" link that drops that item. */
  onRemove?: (id: string) => void;
  state: RankState & { current: NonNullable<RankState["current"]> };
  label: (id: string) => ItemLabel;
  question: string;
  context: string;
  gradient: string;
  topLeft: ReactNode;
  onChoose: (preferNew: boolean) => void;
  onTie: () => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const { ranked, queue, current } = state;
  const total = ranked.length + queue.length + 1;
  const opponent = ranked[midpoint(current)];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {topLeft}
        <span className="text-sm text-neutral-500">
          {ranked.length} of {total} ranked
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full bg-gradient-to-r ${gradient} transition-all`}
          style={{ width: `${(ranked.length / total) * 100}%` }}
        />
      </div>

      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">{question}</h1>
        <p className="text-sm text-neutral-500">
          {context} · about {comparisonsLeft(current)} more for this one
        </p>
      </header>

      <div className="space-y-3">
        <ChoiceButton {...label(current.artist)} gradient={gradient} onClick={() => onChoose(true)} />
        {onRemove && <DidntSee title={label(current.artist).title} onClick={() => onRemove(current.artist)} />}
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-neutral-600">or</p>
        <ChoiceButton {...label(opponent)} gradient={gradient} onClick={() => onChoose(false)} />
        {onRemove && <DidntSee title={label(opponent).title} onClick={() => onRemove(opponent)} />}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-full px-4 py-2 text-sm text-neutral-400 active:text-neutral-200 disabled:opacity-30"
        >
          ↶ Undo
        </button>
        <button
          type="button"
          onClick={onTie}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-neutral-300 ring-1 ring-neutral-800 active:bg-neutral-800"
        >
          Too close to call
        </button>
      </div>
    </div>
  );
}

function DidntSee({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <div className="-mt-1 text-right">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Didn't see ${title}`}
        className="px-2 py-1 text-xs text-neutral-500 active:text-neutral-200"
      >
        ✕ Didn’t see this
      </button>
    </div>
  );
}

function ChoiceButton({ title, subtitle, gradient, onClick }: ItemLabel & { gradient: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-3xl bg-gradient-to-br ${gradient} p-[2px] transition active:scale-[0.97]`}
    >
      <span className="flex min-h-32 flex-col items-center justify-center gap-1 rounded-[22px] bg-neutral-950/85 px-6 py-8 text-center">
        <span className="text-2xl font-bold leading-tight">{title}</span>
        {subtitle && <span className="text-sm text-neutral-400">{subtitle}</span>}
      </span>
    </button>
  );
}

/** Numbered results list with the #1 spot highlighted. */
export function RankedList({
  ranked,
  label,
  gradient,
  onRerank,
  onRemove,
}: {
  ranked: string[];
  label: (id: string) => ItemLabel;
  gradient: string;
  /** When given, each row gets a re-rank button. Omit for read-only lists (e.g. a friend's ranking). */
  onRerank?: (id: string) => void;
  /** When given, each row gets a remove button (used for shows, which the user created). */
  onRemove?: (id: string) => void;
}) {
  return (
    <ol className="space-y-2">
      {ranked.map((id, i) => {
        const { title, subtitle } = label(id);
        return (
          <li
            key={id}
            className={i === 0 ? `rounded-2xl bg-gradient-to-br ${gradient} p-[2px]` : "rounded-2xl ring-1 ring-neutral-800"}
          >
            <div
              className={`flex items-center gap-4 rounded-[14px] bg-neutral-950/85 py-3 pl-4 ${onRerank || onRemove ? "pr-1" : "pr-4"}`}
            >
              <span className="w-7 shrink-0 text-right text-lg font-bold tabular-nums text-neutral-500">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate ${i === 0 ? "text-lg font-semibold" : ""}`}>{title}</span>
                {subtitle && <span className="block truncate text-sm text-neutral-500">{subtitle}</span>}
              </span>
              {onRerank && (
                <button
                  type="button"
                  onClick={() => onRerank(id)}
                  aria-label={`Re-rank ${title}`}
                  className="shrink-0 px-2 py-1 text-lg text-neutral-500 active:text-neutral-200"
                >
                  ↻
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(id)}
                  aria-label={`Remove ${title}`}
                  className="shrink-0 px-2 py-1 text-lg text-neutral-600 active:text-neutral-200"
                >
                  ×
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
