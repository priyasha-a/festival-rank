// Per-festival user data: localStorage is the instant, offline-friendly copy; when the user is
// signed in, changes are also pushed to Supabase so they follow them across devices.
// Conflicts resolve by last write wins (compared on updatedAt).

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export type FestivalRecord = {
  /** Artists the user checked off as seen (lineup order, then custom). */
  seen: string[];
  /** Artists the user added themselves because they weren't on the hardcoded lineup. */
  custom: string[];
  /** The user's ranking, best first. */
  ranked: string[];
  /** ISO timestamp of the last change; "" if never saved. */
  updatedAt: string;
};

type Lists = Omit<FestivalRecord, "updatedAt">;

const TABLE = "festival_rankings";
const PREFIX = "setrank:festival:";
const localKey = (festivalId: string) => `${PREFIX}${festivalId}`;

const strings = (x: unknown): string[] =>
  Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : [];
/** Milliseconds for an ISO timestamp; 0 for "" (never saved). */
export const time = (iso: string) => (iso ? Date.parse(iso) || 0 : 0);
const hasData = (r: Lists) => r.seen.length + r.custom.length + r.ranked.length > 0;
const sameLists = (a: Lists, b: Lists) =>
  JSON.stringify([a.seen, a.custom, a.ranked]) === JSON.stringify([b.seen, b.custom, b.ranked]);

// ---- localStorage ----

export function readLocal(festivalId: string): FestivalRecord {
  try {
    const raw = localStorage.getItem(localKey(festivalId));
    if (raw) {
      const p = JSON.parse(raw);
      return {
        seen: strings(p.seen),
        custom: strings(p.custom),
        ranked: strings(p.ranked),
        updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : "",
      };
    }
  } catch {
    // Corrupt entry: fall through to the legacy keys / empty record.
  }
  // Earlier versions stored each list under its own key.
  const legacy = (kind: string) => {
    try {
      return strings(JSON.parse(localStorage.getItem(`setrank:${kind}:${festivalId}`) ?? "[]"));
    } catch {
      return [];
    }
  };
  return { seen: legacy("seen"), custom: legacy("custom"), ranked: legacy("ranked"), updatedAt: "" };
}

function writeLocal(festivalId: string, record: FestivalRecord) {
  localStorage.setItem(localKey(festivalId), JSON.stringify(record));
}

function localFestivalIds(): string[] {
  const ids = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) ?? "";
    const id = k.startsWith(PREFIX) ? k.slice(PREFIX.length) : k.match(/^setrank:(?:seen|custom|ranked):(.+)$/)?.[1];
    if (id) ids.add(id);
  }
  return [...ids];
}

/** Removes every festival record from this browser (used on sign-out so the next user starts clean). */
export function clearLocal() {
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) ?? "";
    if (k.startsWith("setrank:")) doomed.push(k);
  }
  doomed.forEach((k) => localStorage.removeItem(k));
}

// ---- Supabase ----

type Row = { festival_id: string; seen: string[]; custom: string[]; ranked: string[]; updated_at: string };

const fromRow = (r: Row): FestivalRecord => ({
  seen: r.seen ?? [],
  custom: r.custom ?? [],
  ranked: r.ranked ?? [],
  updatedAt: r.updated_at,
});

const toRow = (userId: string, festivalId: string, r: FestivalRecord) => ({
  user_id: userId,
  festival_id: festivalId,
  seen: r.seen,
  custom: r.custom,
  ranked: r.ranked,
  updated_at: r.updatedAt || new Date().toISOString(),
});

export async function signedInUserId(sb: SupabaseClient): Promise<string | null> {
  const { data } = await sb.auth.getSession();
  return data.session?.user.id ?? null;
}

async function push(sb: SupabaseClient, userId: string, festivalId: string, record: FestivalRecord) {
  const { error } = await sb.from(TABLE).upsert(toRow(userId, festivalId, record), { onConflict: "user_id,festival_id" });
  if (error) console.warn("Couldn't sync to Supabase:", error.message);
}

// ---- Public API ----

/** Local copy immediately reconciled with Supabase (if signed in); whichever is newer wins. */
export async function loadRecord(festivalId: string): Promise<FestivalRecord> {
  const local = readLocal(festivalId);
  const sb = getSupabase();
  const userId = sb && (await signedInUserId(sb));
  if (!sb || !userId) return local;

  const { data, error } = await sb
    .from(TABLE)
    .select("festival_id, seen, custom, ranked, updated_at")
    .eq("festival_id", festivalId)
    .maybeSingle<Row>();
  if (error) {
    console.warn("Couldn't load from Supabase:", error.message);
    return local;
  }

  if (data && time(data.updated_at) >= time(local.updatedAt)) {
    const remote = fromRow(data);
    writeLocal(festivalId, remote);
    return remote;
  }
  // Local is newer (e.g. edited offline) or the cloud has nothing yet: upload it.
  if (hasData(local)) void push(sb, userId, festivalId, local);
  return local;
}

/** Every festival the user has data for (this browser + their account), keyed by festival id. */
export async function loadAllRecords(): Promise<Map<string, FestivalRecord>> {
  const records = new Map(localFestivalIds().map((id) => [id, readLocal(id)] as const));
  const sb = getSupabase();
  const userId = sb && (await signedInUserId(sb));
  if (!sb || !userId) return records;

  const { data, error } = await sb.from(TABLE).select("festival_id, seen, custom, ranked, updated_at");
  if (error) {
    console.warn("Couldn't load from Supabase:", error.message);
    return records;
  }
  for (const row of data as Row[]) {
    const local = records.get(row.festival_id);
    if (!local || time(row.updated_at) >= time(local.updatedAt)) {
      const remote = fromRow(row);
      writeLocal(row.festival_id, remote);
      records.set(row.festival_id, remote);
    }
  }
  return records;
}

const pushTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Saves locally right away; pushes to Supabase shortly after (debounced) when signed in. */
export function saveRecord(festivalId: string, changes: Partial<Lists>) {
  const prev = readLocal(festivalId);
  const next = { ...prev, ...changes };
  if (sameLists(prev, next) && prev.updatedAt) return;
  next.updatedAt = new Date().toISOString();
  writeLocal(festivalId, next);

  const sb = getSupabase();
  if (!sb) return;
  clearTimeout(pushTimers.get(festivalId));
  pushTimers.set(
    festivalId,
    setTimeout(async () => {
      pushTimers.delete(festivalId);
      const userId = await signedInUserId(sb);
      // Re-read so we send the latest state, not the one captured when the timer started.
      if (userId) await push(sb, userId, festivalId, readLocal(festivalId));
    }, 800),
  );
}

/** After signing in: upload any local festivals that are newer than (or missing from) the cloud. */
export async function syncLocalToRemote() {
  const sb = getSupabase();
  const userId = sb && (await signedInUserId(sb));
  if (!sb || !userId) return;

  const { data, error } = await sb.from(TABLE).select("festival_id, updated_at");
  if (error) {
    console.warn("Couldn't sync to Supabase:", error.message);
    return;
  }
  const remoteTimes = new Map(data.map((r) => [r.festival_id as string, time(r.updated_at as string)]));

  const rows = localFestivalIds()
    .map((id) => [id, readLocal(id)] as const)
    .filter(([id, rec]) => hasData(rec) && (!remoteTimes.has(id) || time(rec.updatedAt) > remoteTimes.get(id)!))
    .map(([id, rec]) => toRow(userId, id, rec));
  if (rows.length === 0) return;

  const { error: upsertError } = await sb.from(TABLE).upsert(rows, { onConflict: "user_id,festival_id" });
  if (upsertError) console.warn("Couldn't sync to Supabase:", upsertError.message);
}
