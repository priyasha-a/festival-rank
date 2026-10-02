"use client";

import Link from "next/link";
import { useState } from "react";
import type { FestivalSummary } from "@/lib/festivals";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Group = { name: string; editions: FestivalSummary[] };

/** One card per festival; tapping it reveals its years. Single-year festivals link straight through. */
export default function FestivalPicker({ festivals }: { festivals: FestivalSummary[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const q = normalize(query.trim());
  const matches = (f: FestivalSummary) => !q || normalize(`${f.name} ${f.year} ${f.location}`).includes(q);

  // `festivals` is already newest first, so groups come out ordered by their latest edition
  // and each group's editions are newest first too.
  const groups: Group[] = [];
  for (const f of festivals.filter(matches)) {
    const group = groups.find((g) => g.name === f.name);
    if (group) group.editions.push(f);
    else groups.push({ name: f.name, editions: [f] });
  }

  function toggle(name: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search festivals or years"
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-base outline-none ring-1 ring-neutral-800 placeholder:text-neutral-500 focus:ring-neutral-500"
      />

      <ul className="space-y-3">
        {groups.map(({ name, editions }) => {
          const latest = editions[0];
          const single = editions.length === 1;
          // While searching, show matching years without needing a tap.
          const expanded = !single && (open.has(name) || q.length > 0);
          const years = editions.map((e) => e.year).sort();
          // A range ("2022–2026") when every year is there or the list would be long; otherwise list
          // them ("2022, 2026") so a gap doesn't read as consecutive years.
          const consecutive = years[years.length - 1] - years[0] === years.length - 1;
          const yearText =
            consecutive || years.length > 3 ? `${years[0]}–${years[years.length - 1]}` : years.join(", ");
          const subtitle = single
            ? `${latest.location} · ${latest.dates}`
            : `${latest.location} · ${editions.length} years · ${yearText}`;

          const header = (
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0 text-left">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-xl font-semibold">{name}</span>
                  {single && <span className="text-sm text-neutral-400">{latest.year}</span>}
                </div>
                <p className="mt-0.5 truncate text-sm text-neutral-400">{subtitle}</p>
              </div>
              <span
                aria-hidden
                className={`text-2xl text-neutral-500 transition-transform ${expanded ? "rotate-90" : ""}`}
              >
                ›
              </span>
            </div>
          );

          return (
            <li key={name} className={`rounded-2xl bg-gradient-to-br ${latest.gradient} p-[2px]`}>
              <div className="rounded-[14px] bg-neutral-950/80 backdrop-blur">
                {single ? (
                  <Link href={`/festival/${latest.id}`} className="block transition active:scale-[0.98]">
                    {header}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggle(name)}
                    aria-expanded={expanded}
                    className="block w-full transition active:scale-[0.98]"
                  >
                    {header}
                  </button>
                )}

                {expanded && (
                  <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                    {editions.map((e) => (
                      <Link
                        key={e.id}
                        href={`/festival/${e.id}`}
                        className="rounded-xl bg-neutral-900 px-3 py-2.5 text-center ring-1 ring-neutral-800 active:bg-neutral-800"
                      >
                        <span className="block text-lg font-semibold">{e.year}</span>
                        <span className="block truncate text-xs text-neutral-500">{e.dates}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {groups.length === 0 && (
          <li className="py-6 text-center text-sm text-neutral-500">No festivals match “{query}”.</li>
        )}
      </ul>
    </div>
  );
}
