"use client";

import { useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { itemsCol } from "./paths";

export function useExistingTags(uid: string): string[] {
  const [snap] = useCollection(itemsCol(uid));
  return useMemo(() => {
    if (!snap) return [];
    const set = new Set<string>();
    snap.docs.forEach((d) => d.data().tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [snap]);
}
