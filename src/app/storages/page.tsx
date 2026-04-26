"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { addDoc, orderBy, query, serverTimestamp } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { itemsCol, locationsCol, storagesCol } from "@/lib/paths";
import { LocationSelect } from "@/components/LocationSelect";
import { Boxes, ChevronRight, Loader2, Plus, Search } from "lucide-react";

export default function StoragesPage() {
  const [user] = useAuthState(auth);
  const [storagesSnap] = useCollection(
    user ? query(storagesCol(user.uid), orderBy("name")) : null,
  );
  const [locationsSnap] = useCollection(
    user ? query(locationsCol(user.uid), orderBy("name")) : null,
  );
  const [itemsSnap] = useCollection(user ? itemsCol(user.uid) : null);
  const [search, setSearch] = useState("");

  const [newName, setNewName] = useState("");
  const [newLocationId, setNewLocationId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const locationName = useMemo(() => {
    const m = new Map<string, string>();
    locationsSnap?.docs.forEach((d) => m.set(d.id, d.data().name));
    return m;
  }, [locationsSnap]);

  const itemCounts = useMemo(() => {
    const m = new Map<string, number>();
    itemsSnap?.docs.forEach((d) => {
      const sid = d.data().storageId;
      if (sid) m.set(sid, (m.get(sid) ?? 0) + 1);
    });
    return m;
  }, [itemsSnap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (storagesSnap?.docs ?? []).filter((d) => {
      if (!q) return true;
      const data = d.data();
      const loc = data.locationId
        ? locationName.get(data.locationId) ?? ""
        : "";
      return (
        data.name.toLowerCase().includes(q) ||
        loc.toLowerCase().includes(q)
      );
    });
  }, [storagesSnap, search, locationName]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setCreating(true);
    await addDoc(storagesCol(user.uid), {
      name: newName.trim(),
      locationId: newLocationId,
      parentId: null,
      createdAt: serverTimestamp(),
    } as never);
    setNewName("");
    setNewLocationId(null);
    setCreating(false);
  };

  if (!user) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">Storages</h1>
      <p className="mb-4 text-sm text-zinc-500">
        All storage containers across every location.
      </p>

      <form
        onSubmit={create}
        className="mb-6 flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            New storage
          </label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. TransparentBox1"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="sm:w-48">
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Location
          </label>
          <div className="mt-1">
            <LocationSelect
              uid={user.uid}
              value={newLocationId}
              onChange={setNewLocationId}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!newName.trim() || creating}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {creating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Add
        </button>
      </form>

      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-2.5 top-2.5 text-zinc-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search storage or location…"
          className="w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-8 pr-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {storagesSnap?.empty
            ? "No storage yet — create one inside a location."
            : "No storage matches your search."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {filtered.map((d) => {
            const data = d.data();
            const loc = data.locationId
              ? locationName.get(data.locationId)
              : null;
            const count = itemCounts.get(d.id) ?? 0;
            return (
              <li key={d.id}>
                <Link
                  href={`/storage/${d.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <Boxes size={16} className="text-zinc-400" />
                  <span className="font-medium">{data.name}</span>
                  {loc && (
                    <span className="text-xs text-zinc-500">in {loc}</span>
                  )}
                  <span className="ml-auto text-xs text-zinc-500">
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                  <ChevronRight size={14} className="text-zinc-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
