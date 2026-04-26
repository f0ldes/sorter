"use client";

import { useCollection } from "react-firebase-hooks/firestore";
import { query, orderBy } from "firebase/firestore";
import { locationsCol } from "@/lib/paths";

export function LocationSelect({
  uid,
  value,
  onChange,
}: {
  uid: string;
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const [snap] = useCollection(query(locationsCol(uid), orderBy("name")));

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
    >
      <option value="">No location</option>
      {snap?.docs.map((d) => (
        <option key={d.id} value={d.id}>
          {d.data().name}
        </option>
      ))}
    </select>
  );
}
