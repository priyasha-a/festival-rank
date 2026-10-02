// Usernames and mutual friendships. Row Level Security (supabase/schema.sql) is what actually enforces
// who can see what: only accepted friends can read each other's festival_rankings and user_shows.

import type { SupabaseClient } from "@supabase/supabase-js";
import { parseRecord, type ShowsRecord } from "./shows";
import { COLUMNS, fromRow, signedInUserId, type FestivalRecord, type Row } from "./storage";
import { getSupabase } from "./supabase";

export type Profile = { id: string; username: string; display_name: string };

export type Friendship = {
  id: string;
  status: "pending" | "accepted";
  /** True when the other person sent the request (so it's ours to accept). */
  incoming: boolean;
  other: Profile;
};

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const PROFILE_COLUMNS = "id, username, display_name";

export const cleanUsername = (s: string) => s.trim().replace(/^@/, "").toLowerCase();

async function session(): Promise<{ sb: SupabaseClient; userId: string } | null> {
  const sb = getSupabase();
  const userId = sb && (await signedInUserId(sb));
  return sb && userId ? { sb, userId } : null;
}

/** The signed-in user's profile; null if they haven't picked a username yet; undefined if signed out. */
export async function getMyProfile(): Promise<Profile | null | undefined> {
  const s = await session();
  if (!s) return undefined;
  const { data } = await s.sb.from("profiles").select(PROFILE_COLUMNS).eq("id", s.userId).maybeSingle<Profile>();
  return data ?? null;
}

/** Returns an error message, or null on success. */
export async function createProfile(username: string, displayName: string): Promise<string | null> {
  const s = await session();
  if (!s) return "Sign in first.";
  const { error } = await s.sb
    .from("profiles")
    .insert({ id: s.userId, username: cleanUsername(username), display_name: displayName.trim() });
  if (!error) return null;
  return error.code === "23505" ? "That username is taken. Try another." : error.message;
}

export async function findProfile(username: string): Promise<Profile | null> {
  const s = await session();
  if (!s) return null;
  const { data } = await s.sb
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("username", cleanUsername(username))
    .maybeSingle<Profile>();
  return data ?? null;
}

/** Every request and friendship involving the signed-in user, with the other person's profile. */
export async function listFriendships(): Promise<Friendship[]> {
  const s = await session();
  if (!s) return [];
  const { data, error } = await s.sb.from("friendships").select("id, status, requester, addressee");
  if (error || !data) return [];

  const otherId = (f: { requester: string; addressee: string }) => (f.requester === s.userId ? f.addressee : f.requester);
  const ids = data.map(otherId);
  if (ids.length === 0) return [];
  const { data: profiles } = await s.sb.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
  const byId = new Map((profiles ?? []).map((p: Profile) => [p.id, p]));

  return data.flatMap((f) => {
    const other = byId.get(otherId(f));
    return other ? [{ id: f.id, status: f.status, incoming: f.addressee === s.userId, other }] : [];
  });
}

/** Returns an error message, or null on success. */
export async function sendRequest(to: Profile): Promise<string | null> {
  const s = await session();
  if (!s) return "Sign in first.";
  if (to.id === s.userId) return "That's you!";
  const { error } = await s.sb.from("friendships").insert({ requester: s.userId, addressee: to.id });
  if (!error) return null;
  return error.code === "23505" ? "You already have a request with them." : error.message;
}

export async function acceptRequest(friendshipId: string) {
  const s = await session();
  await s?.sb.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
}

/** Declines, cancels, or unfriends — whichever applies. */
export async function removeFriendship(friendshipId: string) {
  const s = await session();
  await s?.sb.from("friendships").delete().eq("id", friendshipId);
}

/** A friend's festival records (empty unless you're friends — RLS hides them otherwise). */
export async function friendFestivals(userId: string): Promise<Map<string, FestivalRecord>> {
  const s = await session();
  if (!s) return new Map();
  const { data } = await s.sb.from("festival_rankings").select(COLUMNS).eq("user_id", userId);
  return new Map(((data ?? []) as Row[]).map((row) => [row.festival_id, fromRow(row)]));
}

export async function friendShows(userId: string): Promise<ShowsRecord | null> {
  const s = await session();
  if (!s) return null;
  const { data } = await s.sb.from("user_shows").select("shows, ranked, updated_at").eq("user_id", userId).maybeSingle();
  return data ? parseRecord(data) : null;
}

export const inviteLink = (username: string) => `${window.location.origin}/u/${username}`;

/** Only allow same-site paths as post-sign-in destinations. */
export const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : null);
