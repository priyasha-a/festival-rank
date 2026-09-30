"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadShows, saveShows } from "@/lib/shows";

const MAX = 80;
const clean = (s: string) => s.trim().replace(/\s+/g, " ").slice(0, MAX);

const inputClass =
  "w-full rounded-xl bg-neutral-900 px-4 py-3 text-base outline-none ring-1 ring-neutral-800 placeholder:text-neutral-500 focus:ring-neutral-500";

export default function AddShowForm() {
  const router = useRouter();
  const [artist, setArtist] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [openers, setOpeners] = useState("");
  const [saving, setSaving] = useState(false);

  const thisMonth = new Date().toISOString().slice(0, 7);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clean(artist) || saving) return;
    setSaving(true);
    const record = await loadShows();
    saveShows({
      shows: [
        ...record.shows,
        {
          id: crypto.randomUUID(),
          artist: clean(artist),
          venue: clean(venue),
          city: clean(city),
          date: /^\d{4}-\d{2}$/.test(date) ? date : "",
          openers: openers.split(",").map(clean).filter(Boolean),
        },
      ],
    });
    // The shows page queues the new show and asks where it ranks.
    router.push("/shows");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Artist" required>
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          required
          autoFocus
          maxLength={MAX}
          placeholder="e.g. Fetty Wap"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Venue">
          <input value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={MAX} placeholder="The Fillmore" className={inputClass} />
        </Field>
        <Field label="City">
          <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={MAX} placeholder="Philadelphia" className={inputClass} />
        </Field>
      </div>

      <Field label="Month">
        <input type="month" value={date} max={thisMonth} onChange={(e) => setDate(e.target.value)} className={inputClass} />
      </Field>

      <Field label="Openers" hint="Separate with commas">
        <input value={openers} onChange={(e) => setOpeners(e.target.value)} placeholder="Optional" className={inputClass} />
      </Field>

      <div className="flex items-center justify-between pt-2">
        <Link href="/shows" className="px-2 py-2 text-sm text-neutral-400 active:text-neutral-200">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={!clean(artist) || saving}
          className="rounded-full bg-white px-6 py-3 font-semibold text-neutral-950 active:scale-95 disabled:opacity-40"
        >
          Save & rank →
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-neutral-300">{label}</span>
        <span className="text-neutral-500">{required ? "Required" : (hint ?? "Optional")}</span>
      </span>
      {children}
    </label>
  );
}
