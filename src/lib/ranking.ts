// Beli-style ranking by binary insertion.
//
// `ranked` is ordered best → worst. To place a new artist we binary-search the slot range [lo, hi]:
// compare against the middle artist; if the new one is better the slot is above (hi = mid),
// otherwise below (lo = mid + 1). When lo === hi, that's the insertion index.
// Each placement takes about log2(n) comparisons.

export type Insertion = { artist: string; lo: number; hi: number };

export type RankState = {
  ranked: string[];
  /** Artists still waiting to be placed. */
  queue: string[];
  /** The artist currently being placed, or null when there's nothing left to do. */
  current: Insertion | null;
};

/** Index in `ranked` of the artist to compare the current one against. */
export const midpoint = (ins: Insertion) => Math.floor((ins.lo + ins.hi) / 2);

/** Upper bound on comparisons left for the current artist. */
export const comparisonsLeft = (ins: Insertion) => Math.ceil(Math.log2(ins.hi - ins.lo + 1));

/**
 * Inserts the current artist once its slot is pinned down, then pulls the next artist off the queue.
 * The very first artist needs no comparison. Loops until a real question needs asking (or we're done).
 */
export function settle(state: RankState): RankState {
  const ranked = [...state.ranked];
  const queue = [...state.queue];
  let current = state.current;

  for (;;) {
    if (current && current.lo >= current.hi) {
      ranked.splice(current.lo, 0, current.artist);
      current = null;
    }
    if (current || queue.length === 0) break;
    const artist = queue.shift()!;
    if (ranked.length === 0) ranked.push(artist);
    else current = { artist, lo: 0, hi: ranked.length };
  }

  return { ranked, queue, current };
}

/** Answer "which was better?" for the current comparison. */
export function choose(state: RankState, preferNew: boolean): RankState {
  if (!state.current) return state;
  const mid = midpoint(state.current);
  const current = preferNew ? { ...state.current, hi: mid } : { ...state.current, lo: mid + 1 };
  return settle({ ...state, current });
}

/** "Too close to call": place the new artist directly below the one it was compared with. */
export function tie(state: RankState): RankState {
  if (!state.current) return state;
  const slot = midpoint(state.current) + 1;
  return settle({ ...state, current: { ...state.current, lo: slot, hi: slot } });
}

/** Pull one artist out of the ranking and place it again from scratch. */
export function rerank(state: RankState, artist: string): RankState {
  return settle({ ranked: state.ranked.filter((a) => a !== artist), queue: [artist], current: null });
}

/**
 * Builds the starting state from what the user checked off and any ranking saved earlier.
 * Previously ranked artists keep their order (minus any since unchecked); new ones get queued.
 */
export function initialState(seen: string[], savedRanking: string[]): RankState {
  const seenSet = new Set(seen);
  const ranked = savedRanking.filter((a) => seenSet.has(a));
  const rankedSet = new Set(ranked);
  return settle({ ranked, queue: seen.filter((a) => !rankedSet.has(a)), current: null });
}
