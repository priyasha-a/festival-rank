// Solo shows the user logged, plus their ranking of them (best first).
// Same approach as festival data in storage.ts: localStorage first, synced to Supabase when signed in,
// last write wins. All of a user's shows travel together as one record.

import type { SupabaseClient } from "@supabase/supabase-js";
import { signedInUserId, time } from "./storage";
import { getSupabase } from "./supabase";

export type Show = {
  id: string;
  artist: string;
  /** Optional details; "" when left blank. */
  venue: string;
  city: string;
  /** "YYYY-MM" or "". */
  date: string;
  openers: string[];
};

export type ShowsRecord = { shows: Show[]; ranked: string[]; updatedAt: string };

/** Card colors for everything shows-related (festivals each have their own). */
export const SHOWS_GRADIENT = "from-rose-400 via-orange-400 to-amber-300";

const TABLE = "user_shows";
const KEY = "setrank:shows"; // "setrank:" prefix so clearLocal() wipes it on sign-out

const str = (x: unknown) => (typeof x === "string" ? x : "");

function parseShows(x: unknown): Show[] {
  if (!Array.isArray(x)) return [];
  return x.flatMap((s) =>
    s && typeof s === "object" && typeof s.id === "string" && typeof s.artist === "string"
      ? [
          {
            id: s.id,
            artist: s.artist,
            venue: str(s.venue),
            city: str(s.city),
            date: str(s.date),
            openers: Array.isArray(s.openers) ? s.openers.filter((o: unknown) => typeof o === "string") : [],
          },
        ]
      : [],
  );
}

function parseRecord(p: { shows?: unknown; ranked?: unknown; updatedAt?: unknown; updated_at?: unknown }): ShowsRecord {
  return {
    shows: parseShows(p.shows),
    ranked: Array.isArray(p.ranked) ? p.ranked.filter((r): r is string => typeof r === "string") : [],
    updatedAt: str(p.updatedAt ?? p.updated_at),
  };
}

export function readLocalShows(): ShowsRecord {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return parseRecord(JSON.parse(raw));
  } catch {
    // Corrupt entry: start empty.
  }
  return { shows: [], ranked: [], updatedAt: "" };
}

function writeLocal(record: ShowsRecord) {
  localStorage.setItem(KEY, JSON.stringify(record));
}

async function push(sb: SupabaseClient, userId: string, r: ShowsRecord) {
  const { error } = await sb
    .from(TABLE)
    .upsert(
      { user_id: userId, shows: r.shows, ranked: r.ranked, updated_at: r.updatedAt || new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) console.warn("Couldn't sync shows to Supabase:", error.message);
}

async function fetchRemote(sb: SupabaseClient): Promise<ShowsRecord | null | undefined> {
  const { data, error } = await sb.from(TABLE).select("shows, ranked, updated_at").maybeSingle();
  if (error) {
    console.warn("Couldn't load shows from Supabase:", error.message);
    return undefined; // unknown, as opposed to null = no row yet
  }
  return data ? parseRecord(data) : null;
}

/** Local shows reconciled with the user's account (if signed in); whichever is newer wins. */
export async function loadShows(): Promise<ShowsRecord> {
  const local = readLocalShows();
  const sb = getSupabase();
  const userId = sb && (await signedInUserId(sb));
  if (!sb || !userId) return local;

  const remote = await fetchRemote(sb);
  if (remote === undefined) return local;
  if (remote && time(remote.updatedAt) >= time(local.updatedAt)) {
    writeLocal(remote);
    return remote;
  }
  // Local is newer (e.g. edited offline, including deleting everything) or the account has nothing yet.
  if (local.updatedAt) void push(sb, userId, local);
  return local;
}

let pushTimer: ReturnType<typeof setTimeout> | undefined;

/** Saves locally right away; pushes to Supabase shortly after when signed in. */
export function saveShows(changes: Partial<Omit<ShowsRecord, "updatedAt">>) {
  const prev = readLocalShows();
  const next = { ...prev, ...changes };
  if (JSON.stringify([prev.shows, prev.ranked]) === JSON.stringify([next.shows, next.ranked]) && prev.updatedAt) return;
  next.updatedAt = new Date().toISOString();
  writeLocal(next);

  const sb = getSupabase();
  if (!sb) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const userId = await signedInUserId(sb);
    if (userId) await push(sb, userId, readLocalShows());
  }, 800);
}

/** After signing in: upload shows logged on this device if they're newer than the account's copy. */
export async function syncShowsToRemote() {
  const sb = getSupabase();
  const userId = sb && (await signedInUserId(sb));
  if (!sb || !userId) return;
  const local = readLocalShows();
  if (!local.updatedAt) return; // nothing was ever saved on this device
  const remote = await fetchRemote(sb);
  if (remote === undefined) return;
  if (!remote || time(local.updatedAt) > time(remote.updatedAt)) await push(sb, userId, local);
}

/** "The Fillmore, Philadelphia · May 2026 · with Opener" — whichever parts exist. */
export function showSubtitle(show: Show): string {
  const place = [show.venue, show.city].filter(Boolean).join(", ");
  const openers = show.openers.length ? `with ${show.openers.join(", ")}` : "";
  return [place, formatMonth(show.date), openers].filter(Boolean).join(" · ");
}

export function formatMonth(yyyyMm: string): string {
  if (!/^\d{4}-\d{2}$/.test(yyyyMm)) return "";
  return new Date(`${yyyyMm}-01T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
