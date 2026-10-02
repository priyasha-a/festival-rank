"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  deleteFestivalRow,
  festivalSlug,
  isAdmin,
  PREFILL_KEY,
  saveFestival,
  type RequestGroup,
} from "@/lib/admin";
import { GRADIENTS, type Festival } from "@/lib/festivals";

const inputClass =
  "w-full rounded-xl bg-neutral-900 px-4 py-3 text-base outline-none ring-1 ring-neutral-800 placeholder:text-neutral-500 focus:ring-neutral-500";

/** One artist per line (commas also split); blanks and repeats dropped. */
function parseLines(text: string, splitCommas: boolean): string[] {
  const seen = new Set<string>();
  return text
    .split(splitCommas ? /[\n,]/ : /\n/)
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
}

type Existing = { festival: Festival; hidden: boolean; inDatabase: boolean; builtIn: boolean };

/**
 * Add or edit a festival. Saving writes it to the `festivals` table, which the app reads on every page load,
 * so changes go live right away (no publishing needed).
 */
export default function FestivalEditor({ existing, takenIds }: { existing?: Existing; takenIds: string[] }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const f = existing?.festival;
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const [name, setName] = useState(f?.name ?? "");
  const [year, setYear] = useState(String(f?.year ?? new Date().getFullYear()));
  const [startDate, setStartDate] = useState(f?.startDate ?? "");
  const [dates, setDates] = useState(f?.dates ?? "");
  const [location, setLocation] = useState(f?.location ?? "");
  const [gradient, setGradient] = useState(f?.gradient ?? GRADIENTS[0].value);
  const [partial, setPartial] = useState(f?.partial ?? true);
  const [aliases, setAliases] = useState((f?.aliases ?? []).join(", "));
  const [lineupText, setLineupText] = useState((f?.lineup ?? []).join("\n"));
  const [hidden, setHidden] = useState(existing?.hidden ?? false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    isAdmin().then(setAllowed);
    // "Add festival" from a request hands over what people typed.
    if (existing) return;
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PREFILL_KEY);
    const g = JSON.parse(raw) as RequestGroup;
    setName(g.name);
    setYear(String(g.year));
    setLocation(g.location);
    setDates(g.dates);
    setLineupText(g.artists.join("\n"));
  }, [existing]);

  if (allowed === null) return null;
  if (!allowed) {
    return (
      <p className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-neutral-400 ring-1 ring-neutral-800">
        Admins only.
      </p>
    );
  }

  const yearNumber = Number(year);
  const id = f?.id ?? (name.trim() && yearNumber ? festivalSlug(name, yearNumber) : "");
  const lineup = parseLines(lineupText, false);
  const idTaken = !f && takenIds.includes(id);
  const valid =
    name.trim().length > 0 &&
    Number.isInteger(yearNumber) &&
    yearNumber >= 1990 &&
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    id.length >= 3 &&
    !idTaken;

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    const err = await saveFestival({
      id,
      name: name.trim(),
      year: yearNumber,
      startDate,
      location: location.trim(),
      dates: dates.trim(),
      gradient,
      partial,
      aliases: parseLines(aliases, true),
      lineup,
      hidden,
    });
    setSaving(false);
    if (err) return setError(err);
    router.push("/admin");
    router.refresh();
  }

  async function revert(anchor: HTMLElement) {
    if (!f) return;
    const builtIn = existing?.builtIn;
    const ok = await confirm(builtIn ? "Undo all edits?" : `Delete ${f.name} ${f.year}?`, {
      body: builtIn
        ? "Goes back to the built-in version of this festival."
        : "Removes it from the app. People who ranked it keep their picks but won’t see it listed.",
      confirmLabel: builtIn ? "Undo edits" : "Delete",
      anchor,
    });
    if (!ok) return;
    const err = await deleteFestivalRow(f.id);
    if (err) return setError(err);
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {dialog}

      <Field label="Festival name">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Year">
          <input
            type="number"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="First day" hint="For sorting">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dates" hint="As shown">
          <input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="May 15–17" className={inputClass} />
        </Field>
        <Field label="Location">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Las Vegas, NV"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Card color">
        <div className="flex flex-wrap gap-2">
          {GRADIENTS.map((g) => (
            <button
              key={g.value}
              type="button"
              title={g.label}
              aria-label={g.label}
              aria-pressed={gradient === g.value}
              onClick={() => setGradient(g.value)}
              className={`size-9 rounded-lg bg-gradient-to-br ${g.value} ${
                gradient === g.value ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-950" : ""
              }`}
            />
          ))}
        </div>
      </Field>

      <Field label="Other names" hint="Comma-separated, for matching requests">
        <input
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          placeholder="e.g. Movement, Movement Festival"
          className={inputClass}
        />
      </Field>

      <Field label={`Lineup (${lineup.length})`} hint="One artist per line">
        <textarea
          value={lineupText}
          onChange={(e) => setLineupText(e.target.value)}
          rows={12}
          className={`${inputClass} font-mono text-sm`}
        />
      </Field>
      {f && (
        <p className="text-xs text-neutral-500">
          Changing an artist’s spelling unchecks them for anyone who already picked them.
        </p>
      )}

      <div className="space-y-2">
        <Toggle checked={partial} onChange={setPartial}>
          Lineup may be incomplete (shows a note asking people to add missing artists)
        </Toggle>
        <Toggle checked={hidden} onChange={setHidden}>
          Hide this festival from the app
        </Toggle>
      </div>

      <p className="text-xs text-neutral-500">
        Web address: /festival/<span className="text-neutral-300">{id || "…"}</span>
        {idTaken && <span className="text-red-400"> (already used — change the name or year)</span>}
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1">
          <Link href="/admin" className="px-2 py-2 text-sm text-neutral-400 active:text-neutral-200">
            Cancel
          </Link>
          {existing?.inDatabase && (
            <button
              type="button"
              onClick={(e) => revert(e.currentTarget)}
              className="px-2 py-2 text-sm text-neutral-500 active:text-red-400"
            >
              {existing.builtIn ? "Undo edits" : "Delete"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!valid || saving}
          className="rounded-full bg-white px-6 py-3 font-semibold text-neutral-950 active:scale-95 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save & publish"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-neutral-300">{label}</span>
        {hint && <span className="text-neutral-500">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-neutral-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-white"
      />
      <span>{children}</span>
    </label>
  );
}
