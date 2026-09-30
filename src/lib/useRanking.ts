"use client";

import { useEffect, useRef, useState } from "react";
import { choose, initialState, rerank, settle, tie, type RankState } from "./ranking";

/**
 * Ranking state plus an undo history, shared by the festival and show rankers.
 * Items are ids (artist names for festival sets, show ids for solo shows).
 * `onRankedChange` fires whenever the ranked order changes so the caller can save it.
 */
export function useRanking(onRankedChange: (ranked: string[]) => void) {
  const [state, setState] = useState<RankState | null>(null);
  const [history, setHistory] = useState<RankState[]>([]);

  const onChange = useRef(onRankedChange);
  useEffect(() => {
    onChange.current = onRankedChange;
  });

  const ranked = state?.ranked;
  useEffect(() => {
    if (ranked) onChange.current(ranked);
  }, [ranked]);

  function update(next: RankState) {
    if (state) setHistory([...history, state]);
    setState(next);
  }

  return {
    state,
    canUndo: history.length > 0,
    /** (Re)start from the items to rank and any previously saved order. Clears undo history. */
    start(items: string[], savedRanking: string[]) {
      setState(initialState(items, savedRanking));
      setHistory([]);
    },
    choose(preferNew: boolean) {
      if (state) update(choose(state, preferNew));
    },
    tie() {
      if (state) update(tie(state));
    },
    rerank(id: string) {
      if (state) update(rerank(state, id));
    },
    startOver(items: string[]) {
      update(settle({ ranked: [], queue: items, current: null }));
    },
    undo() {
      if (history.length === 0) return;
      setState(history[history.length - 1]);
      setHistory(history.slice(0, -1));
    },
  };
}
