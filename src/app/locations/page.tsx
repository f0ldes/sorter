"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import {
  addDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { locationDoc, locationsCol, storagesCol } from "@/lib/paths";
import {
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
  MapPin,
  Boxes,
  ChevronRight,
} from "lucide-react";

export default function LocationsPage() {
  const [user] = useAuthState(auth);
  const [locations] = useCollection(
    user ? query(locationsCol(user.uid), orderBy("name")) : null,
  );
  const [storages] = useCollection(
    user ? query(storagesCol(user.uid), orderBy("name")) : null,
  );

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (!user) return null;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    await addDoc(locationsCol(user.uid), {
      name: newName.trim(),
      parentId: null,
      createdAt: serverTimestamp(),
    } as never);
    setNewName("");
    setCreating(false);
  };

  const unassignedStorages =
    storages?.docs.filter((d) => !d.data().locationId) ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold">Locations</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Top-level places like “Garage” or “Kitchen” that hold storage
        containers.
      </p>

      <form onSubmit={create} className="mb-6 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New location name (e.g. Garage)"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          disabled={!newName.trim() || creating}
          className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {creating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Add
        </button>
      </form>

      {locations?.empty ? (
        <p className="text-sm text-zinc-500">
          No locations yet. Add one above.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {locations?.docs.map((d) => {
            const data = d.data();
            const editing = editId === d.id;
            const storageCount =
              storages?.docs.filter((s) => s.data().locationId === d.id)
                .length ?? 0;
            return (
              <li key={d.id} className="flex items-center gap-2 px-3 py-2">
                <MapPin size={16} className="text-zinc-400" />
                {editing ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                    />
                    <button
                      onClick={async () => {
                        if (!editName.trim()) return;
                        await updateDoc(locationDoc(user.uid, d.id), {
                          name: editName.trim(),
                        });
                        setEditId(null);
                      }}
                      className="text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/location/${d.id}`}
                      className="flex flex-1 items-center gap-2 text-sm hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      <span className="font-medium">{data.name}</span>
                      <span className="text-xs text-zinc-500">
                        {storageCount} storage
                      </span>
                      <ChevronRight
                        size={14}
                        className="ml-auto text-zinc-400"
                      />
                    </Link>
                    <button
                      onClick={() => {
                        setEditId(d.id);
                        setEditName(data.name);
                      }}
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          !confirm(
                            `Delete location "${data.name}"? Storage and items inside keep their references but show as Unassigned.`,
                          )
                        )
                          return;
                        await deleteDoc(locationDoc(user.uid, d.id));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {unassignedStorages.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Unassigned storage
          </h2>
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {unassignedStorages.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/storage/${d.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <Boxes size={16} className="text-zinc-400" />
                  <span className="flex-1">{d.data().name}</span>
                  <ChevronRight size={14} className="text-zinc-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
