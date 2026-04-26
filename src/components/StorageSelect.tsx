"use client";

import { useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { query, orderBy } from "firebase/firestore";
import { locationsCol, storagesCol } from "@/lib/paths";

export function StorageSelect({
  uid,
  value,
  onChange,
  locationFilter = null,
}: {
  uid: string;
  value: string | null;
  onChange: (next: string | null, locationId: string | null) => void;
  locationFilter?: string | null;
}) {
  const [storagesSnap] = useCollection(
    query(storagesCol(uid), orderBy("name")),
  );
  const [locationsSnap] = useCollection(
    query(locationsCol(uid), orderBy("name")),
  );

  const locationName = useMemo(() => {
    const m = new Map<string, string>();
    locationsSnap?.docs.forEach((d) => m.set(d.id, d.data().name));
    return m;
  }, [locationsSnap]);

  const filtered = useMemo(() => {
    const docs = storagesSnap?.docs ?? [];
    return locationFilter
      ? docs.filter((d) => d.data().locationId === locationFilter)
      : docs;
  }, [storagesSnap, locationFilter]);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const id = e.target.value || null;
        if (!id) {
          onChange(null, null);
          return;
        }
        const picked = storagesSnap?.docs.find((d) => d.id === id);
        onChange(id, picked?.data().locationId ?? null);
      }}
      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
    >
      <option value="">No storage</option>
      {filtered.map((d) => {
        const data = d.data();
        const loc = data.locationId
          ? locationName.get(data.locationId)
          : undefined;
        return (
          <option key={d.id} value={d.id}>
            {loc ? `${loc} / ${data.name}` : data.name}
          </option>
        );
      })}
    </select>
  );
}
