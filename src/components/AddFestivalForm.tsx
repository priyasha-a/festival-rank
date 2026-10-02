"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { newCustomId, submitFestivalRequest } from "@/lib/customFestivals";
import { saveRecord } from "@/lib/storage";

const MAX = 80;
const clean = (s: string) => s.trim().replace(/\s+/g, " ").slice(0, MAX);

const inputClass =
  "w-full rounded-xl bg-neutral-900 px-4 py-3 text-base outline-none ring-1 ring-neutral-800 placeholder:text-neutral-500 focus:ring-neutral-500";

/** One artist per line (or comma-separated); blanks and repeats dropped. */
function parseArtists(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/[\n,]/)
    .map(clean)
    .filter((a) => a && !seen.has(a.toLowerCase()) && seen.add(a.toLowerCase()));
}

export default function AddFestivalForm() {
  const router = useRouter();
  const thisYear = new Date().getFullYear();
  const [name, setName] = useState("");
  const [year, setYear] = useState(String(thisYear));
  const [location, setLocation] = useState("");
  const [dates, setDates] = useState("");
  const [artistsText, setArtistsText] = useState("");
  const [saving, setSaving] = useState(false);

  // Pre-fill from the festival search ("Can't find X? Add it").
  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get("name");
    if (prefill) setName(clean(prefill));
  }, []);

  const artists = parseArtists(artistsText);
  const yearNumber = Number(year);
  const valid = clean(name).length > 0 && Number.isInteger(yearNumber) && yearNumber >= 1990 && yearNumber <= thisYear + 1;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);

    const id = newCustomId();
    const meta = {
      name: clean(name),
      year: yearNumber,
      // Mid-year placeholder: only used to sort "Your festivals" newest first.
      startDate: `${yearNumber}-07-01`,
      location: clean(location),
      dates: clean(dates),
    };
    // The artists they typed become their checked-off sets, ready to rank.
    saveRecord(id, { meta, custom: artists, seen: artists });
    void submitFestivalRequest({ name: meta.name, year: meta.year, location: meta.location, dates: meta.dates, artists });
    router.push(`/festival/${id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Festival name" hint="Required">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={MAX}
          placeholder="e.g. Movement Detroit"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-[6.5rem_1fr] gap-3">
        <Field label="Year" hint="Required">
          <input
            type="number"
            inputMode="numeric"
            min={1990}
            max={thisYear + 1}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Dates">
          <input value={dates} onChange={(e) => setDates(e.target.value)} maxLength={MAX} placeholder="May 23–25" className={inputClass} />
        </Field>
      </div>

      <Field label="Location">
        <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={MAX} placeholder="Detroit, MI" className={inputClass} />
      </Field>

      <Field label="Artists you saw" hint="One per line">
        <textarea
          value={artistsText}
          onChange={(e) => setArtistsText(e.target.value)}
          rows={6}
          placeholder={"Carl Cox\nJamie Jones\nFISHER"}
          className={inputClass}
        />
      </Field>

      <p className="text-sm text-neutral-500">
        You can add more artists later. We’ll also get a request to add this festival for everyone.
      </p>

      <div className="flex items-center justify-between pt-1">
        <Link href="/" className="px-2 py-2 text-sm text-neutral-400 active:text-neutral-200">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={!valid || saving}
          className="rounded-full bg-white px-6 py-3 font-semibold text-neutral-950 active:scale-95 disabled:opacity-40"
        >
          {artists.length >= 2 ? `Save ${artists.length} sets →` : "Save festival →"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint = "Optional", children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-neutral-300">{label}</span>
        <span className="text-neutral-500">{hint}</span>
      </span>
      {children}
    </label>
  );
}
