// Admin-only actions (managing the festival list and requests). Supabase Row Level Security enforces who's an
// admin (the `admins` table); these helpers just make the calls.

import { getSupabase } from "./supabase";
import { normalize } from "./text";

export async function isAdmin(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data } = await sb.rpc("is_admin");
  return data === true;
}

/** Requests for the same festival (same name ignoring case/accents, same year), most-requested first. */
export type RequestGroup = {
  name: string;
  year: number;
  location: string;
  dates: string;
  /** Every artist anyone listed, de-duplicated. */
  artists: string[];
  count: number;
  ids: string[];
  latest: string;
  /** Signed-in people who asked (one entry per person; someone who asked twice is listed once). */
  requesters: { username: string; displayName: string }[];
  /** Requests sent while signed out, or by someone who hasn't picked a username. */
  anonymous: number;
};

type RequestRow = {
  id: string;
  user_id: string | null;
  name: string;
  year: number;
  location: string;
  dates: string;
  artists: string[];
  created_at: string;
};

export async function loadRequestGroups(): Promise<RequestGroup[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("festival_requests").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as RequestRow[];

  // Who asked: usernames for the signed-in requesters (profiles are readable by any signed-in user).
  const userIds = [...new Set(rows.map((r) => r.user_id).filter((id): id is string => !!id))];
  const { data: profiles } = userIds.length
    ? await sb.from("profiles").select("id, username, display_name").in("id", userIds)
    : { data: [] };
  const byId = new Map(
    (profiles ?? []).map((p: { id: string; username: string; display_name: string }) => [
      p.id,
      { username: p.username, displayName: p.display_name },
    ]),
  );

  const groups = new Map<string, RequestGroup & { seenUsers: Set<string> }>();
  for (const r of rows) {
    const key = `${normalize(r.name)}|${r.year}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        name: r.name,
        year: r.year,
        location: r.location,
        dates: r.dates,
        artists: [],
        count: 0,
        ids: [],
        latest: r.created_at,
        requesters: [],
        anonymous: 0,
        seenUsers: new Set(),
      };
      groups.set(key, g);
    }
    g.count++;
    g.ids.push(r.id);
    g.location ||= r.location;
    g.dates ||= r.dates;
    const have = new Set(g.artists.map(normalize));
    g.artists.push(...r.artists.filter((a) => !have.has(normalize(a))));

    const person = r.user_id ? byId.get(r.user_id) : undefined;
    if (!person) g.anonymous++;
    else if (!g.seenUsers.has(r.user_id!)) {
      g.seenUsers.add(r.user_id!);
      g.requesters.push(person);
    }
  }
  return [...groups.values()]
    .map(({ seenUsers: _seenUsers, ...g }) => g)
    .sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest));
}

export async function dismissRequests(ids: string[]) {
  const sb = getSupabase();
  if (!sb || ids.length === 0) return;
  const { error } = await sb.from("festival_requests").delete().in("id", ids);
  if (error) console.warn("Couldn't dismiss requests:", error.message);
}

export type FestivalInput = {
  id: string;
  name: string;
  year: number;
  startDate: string;
  location: string;
  dates: string;
  gradient: string;
  partial: boolean;
  aliases: string[];
  lineup: string[];
  hidden: boolean;
};

/** Saves (adds or replaces) a festival in the database. Returns an error message, or null on success. */
export async function saveFestival(f: FestivalInput): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return "Supabase isn’t set up.";
  const { error } = await sb.from("festivals").upsert({
    id: f.id,
    name: f.name,
    year: f.year,
    start_date: f.startDate,
    location: f.location,
    dates: f.dates,
    gradient: f.gradient,
    partial: f.partial,
    aliases: f.aliases,
    lineup: f.lineup,
    hidden: f.hidden,
    updated_at: new Date().toISOString(),
  });
  return error ? error.message : null;
}

/** Deletes the database copy (for a built-in festival, this reverts it to the version in the code). */
export async function deleteFestivalRow(id: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return "Supabase isn’t set up.";
  const { error } = await sb.from("festivals").delete().eq("id", id);
  return error ? error.message : null;
}

/** "Movement Detroit", 2025 → "movement-detroit-2025". */
export const festivalSlug = (name: string, year: number) =>
  `${normalize(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${year}`;

/** Hands a request's details to the "new festival" editor (too long for a URL). */
export const PREFILL_KEY = "setrank-admin-prefill";
