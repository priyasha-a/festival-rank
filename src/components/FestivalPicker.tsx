"use client";

import Link from "next/link";
import { useState } from "react";
import type { FestivalSummary } from "@/lib/festivals";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function FestivalPicker({ festivals }: { festivals: FestivalSummary[] }) {
  const [query, setQuery] = useState("");
  const q = normalize(query.trim());
  const visible = q
    ? festivals.filter((f) => normalize(`${f.name} ${f.year} ${f.location}`).includes(q))
    : festivals;

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search festivals"
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-base outline-none ring-1 ring-neutral-800 placeholder:text-neutral-500 focus:ring-neutral-500"
      />

      <ul className="space-y-3">
        {visible.map((festival) => (
          <li key={festival.id}>
            <Link
              href={`/festival/${festival.id}`}
              className={`block rounded-2xl bg-gradient-to-br ${festival.gradient} p-[2px] transition active:scale-[0.98]`}
            >
              <div className="flex items-center justify-between gap-4 rounded-[14px] bg-neutral-950/80 px-5 py-4 backdrop-blur">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-xl font-semibold">{festival.name}</span>
                    <span className="text-sm text-neutral-400">{festival.year}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-neutral-400">
                    {festival.location} · {festival.dates}
                  </p>
                </div>
                <span aria-hidden className="text-2xl text-neutral-500">
                  ›
                </span>
              </div>
            </Link>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-6 text-center text-sm text-neutral-500">No festivals match “{query}”.</li>
        )}
      </ul>
    </div>
  );
}
