"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { dismissRequests, isAdmin, loadRequestGroups, PREFILL_KEY, type RequestGroup } from "@/lib/admin";
import { findOfficialMatch } from "@/lib/customFestivals";
import type { FestivalSummary } from "@/lib/festivals";
import { normalize } from "@/lib/text";

export type AdminEntry = { festival: FestivalSummary; hidden: boolean; inDatabase: boolean; builtIn: boolean };

/** Admin home: festival requests (most-requested first) and the full festival list. */
export default function AdminPanel({ entries }: { entries: AdminEntry[] }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [requests, setRequests] = useState<RequestGroup[]>([]);
  const [query, setQuery] = useState("");
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    isAdmin().then((ok) => {
      setAllowed(ok);
      if (ok) loadRequestGroups().then(setRequests);
    });
  }, []);

  if (allowed === null) return null;
  if (!allowed) {
    return (
      <p className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-400 ring-1 ring-neutral-800">
        Admins only. Sign in with an admin account to manage festivals.
      </p>
    );
  }

  const visible = entries.filter((e) => !e.hidden).map((e) => e.festival);

  function addFromRequest(group: RequestGroup) {
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify(group));
    router.push("/admin/festival/new");
  }

  async function dismiss(group: RequestGroup, anchor: HTMLElement) {
    const ok = await confirm(`Dismiss ${group.name} ${group.year}?`, {
      body: `Removes ${group.count === 1 ? "this request" : `all ${group.count} requests`} for it.`,
      confirmLabel: "Dismiss",
      anchor,
    });
    if (!ok) return;
    await dismissRequests(group.ids);
    setRequests((prev) => prev.filter((g) => g !== group));
  }

  const q = normalize(query);
  const list = q
    ? entries.filter((e) => normalize(`${e.festival.name} ${e.festival.year}`).includes(q))
    : entries;

  return (
    <div className="space-y-8">
      {dialog}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Requests{requests.length ? ` (${requests.length})` : ""}
        </h2>
        {requests.length === 0 ? (
          <p className="text-sm text-neutral-500">No requests right now.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((g) => {
              const match = findOfficialMatch(
                { name: g.name, year: g.year, startDate: "", location: "", dates: "" },
                visible,
              );
              return (
                <li key={g.ids[0]} className="space-y-2 rounded-2xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate font-semibold">
                      {g.name} <span className="font-normal text-neutral-500">{g.year}</span>
                    </p>
                    <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                      {g.count} {g.count === 1 ? "request" : "requests"}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400">
                    {[g.location, g.dates].filter(Boolean).join(" · ") || "No location or dates given"}
                    {g.artists.length > 0 && ` · ${g.artists.length} artists listed`}
                  </p>
                  {match && (
                    <p className="text-sm text-emerald-400">
                      Looks like {match.name} {match.year}, which is already in the app.
                    </p>
                  )}
                  <div className="flex gap-2">
                    {match ? (
                      <Link
                        href={`/admin/festival/${match.id}`}
                        className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-neutral-950 active:scale-95"
                      >
                        Open {match.name}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addFromRequest(g)}
                        className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-neutral-950 active:scale-95"
                      >
                        Add festival
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => dismiss(g, e.currentTarget)}
                      className="rounded-full px-3 py-1.5 text-sm text-neutral-400 ring-1 ring-neutral-700 active:text-neutral-200"
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Festivals ({entries.length})
          </h2>
          <Link
            href="/admin/festival/new"
            className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-neutral-950 active:scale-95"
          >
            + New festival
          </Link>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search festivals or years"
          className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-base outline-none ring-1 ring-neutral-800 placeholder:text-neutral-500 focus:ring-neutral-500"
        />
        <ul className="divide-y divide-neutral-900 overflow-hidden rounded-2xl bg-neutral-900/60 ring-1 ring-neutral-800">
          {list.map(({ festival, hidden, inDatabase, builtIn }) => (
            <li key={festival.id}>
              <Link
                href={`/admin/festival/${festival.id}`}
                className="flex items-center gap-3 px-4 py-3 active:bg-neutral-800"
              >
                <span aria-hidden className={`size-8 shrink-0 rounded-lg bg-gradient-to-br ${festival.gradient}`} />
                <span className={`min-w-0 flex-1 truncate ${hidden ? "text-neutral-500 line-through" : ""}`}>
                  {festival.name} <span className="text-neutral-500">{festival.year}</span>
                </span>
                {hidden && <Badge>Hidden</Badge>}
                {inDatabase && <Badge>{builtIn ? "Edited" : "Added"}</Badge>}
                <span aria-hidden className="text-neutral-500">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">{children}</span>;
}
