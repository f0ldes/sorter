"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { orderBy, query } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { locationsCol, storagesCol, itemsCol } from "@/lib/paths";
import { Search } from "lucide-react";

type Filter =
  | { kind: "all" }
  | { kind: "unsorted" }
  | { kind: "location"; id: string }
  | { kind: "storage"; id: string };

export default function LibraryPage() {
  const [user] = useAuthState(auth);
  const [items] = useCollection(
    user ? query(itemsCol(user.uid), orderBy("createdAt", "desc")) : null,
  );
  const [locations] = useCollection(
    user ? query(locationsCol(user.uid), orderBy("name")) : null,
  );
  const [storages] = useCollection(
    user ? query(storagesCol(user.uid), orderBy("name")) : null,
  );

  const [filterValue, setFilterValue] = useState("all");
  const [search, setSearch] = useState("");

  const filter: Filter = useMemo(() => {
    if (filterValue === "all") return { kind: "all" };
    if (filterValue === "unsorted") return { kind: "unsorted" };
    const [kind, id] = filterValue.split(":");
    if (kind === "loc" && id) return { kind: "location", id };
    if (kind === "sto" && id) return { kind: "storage", id };
    return { kind: "all" };
  }, [filterValue]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    return items.docs.filter((d) => {
      const data = d.data();
      switch (filter.kind) {
        case "unsorted":
          if (data.storageId || data.locationId) return false;
          break;
        case "location":
          if (data.locationId !== filter.id) return false;
          break;
        case "storage":
          if (data.storageId !== filter.id) return false;
          break;
      }
      if (!q) return true;
      const hay = [data.name, ...(data.tags ?? [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [items, filter, search]);

  if (!user) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-2.5 top-2.5 text-zinc-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or tag…"
            className="w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-8 pr-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <select
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="all">All items</option>
          <option value="unsorted">Unsorted</option>
          {(locations?.size ?? 0) > 0 && (
            <optgroup label="By location">
              {locations?.docs.map((l) => (
                <option key={l.id} value={`loc:${l.id}`}>
                  {l.data().name}
                </option>
              ))}
            </optgroup>
          )}
          {(storages?.size ?? 0) > 0 && (
            <optgroup label="By storage">
              {storages?.docs.map((s) => {
                const loc = locations?.docs
                  .find((l) => l.id === s.data().locationId)
                  ?.data().name;
                return (
                  <option key={s.id} value={`sto:${s.id}`}>
                    {loc ? `${loc} / ${s.data().name}` : s.data().name}
                  </option>
                );
              })}
            </optgroup>
          )}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 text-center text-sm text-zinc-500">
          {items?.size
            ? "No items match your filters."
            : "No items yet — tap “New” to add your first."}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((d) => {
            const data = d.data();
            return (
              <li key={d.id}>
                <Link
                  href={`/item/${d.id}`}
                  className="block overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.photoUrl}
                      alt={data.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-2 text-sm font-medium truncate">
                    {data.name}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
