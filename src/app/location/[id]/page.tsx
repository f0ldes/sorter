"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import {
  addDoc,
  deleteDoc,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth } from "@/lib/firebase";
import {
  itemsCol,
  locationDoc,
  storageDoc,
  storagesCol,
} from "@/lib/paths";
import {
  ChevronLeft,
  Loader2,
  Pencil,
  Check,
  X,
  Trash2,
  Plus,
  Boxes,
  ChevronRight,
} from "lucide-react";

export default function LocationDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [user] = useAuthState(auth);

  const [snap, loading] = useDocument(
    user && params.id ? locationDoc(user.uid, params.id) : null,
  );
  // No orderBy on these filtered queries — that would require a Firestore
  // composite index. We sort client-side instead (fine for MVP-scale data).
  const [storagesSnap, , storagesError] = useCollection(
    user && params.id
      ? query(storagesCol(user.uid), where("locationId", "==", params.id))
      : null,
  );
  const [locationItems, , itemsError] = useCollection(
    user && params.id
      ? query(itemsCol(user.uid), where("locationId", "==", params.id))
      : null,
  );

  const storages = [...(storagesSnap?.docs ?? [])].sort((a, b) =>
    a.data().name.localeCompare(b.data().name),
  );
  const looseItems = (locationItems?.docs ?? [])
    .filter((d) => !d.data().storageId)
    .sort((a, b) => {
      const ta = a.data().createdAt?.toMillis?.() ?? 0;
      const tb = b.data().createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [newStorage, setNewStorage] = useState("");
  const [creating, setCreating] = useState(false);

  if (!user || loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-sm text-zinc-500">
        Loading…
      </main>
    );
  }

  if (!snap?.exists()) {
    return (
      <main className="mx-auto max-w-xl px-4 py-6 text-sm text-zinc-500">
        Location not found. <Link href="/locations">Back to locations</Link>
      </main>
    );
  }

  const data = snap.data();

  const onRename = async () => {
    if (!editName.trim()) return;
    await updateDoc(locationDoc(user.uid, params.id!), {
      name: editName.trim(),
    });
    setEditing(false);
  };

  const onDelete = async () => {
    if (
      !confirm(
        `Delete location "${data.name}"? Storage and items inside keep their references but show as Unassigned.`,
      )
    )
      return;
    await deleteDoc(locationDoc(user.uid, params.id!));
    router.push("/locations");
  };

  const onAddStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStorage.trim()) return;
    setCreating(true);
    await addDoc(storagesCol(user.uid), {
      name: newStorage.trim(),
      locationId: params.id,
      parentId: null,
      createdAt: serverTimestamp(),
    } as never);
    setNewStorage("");
    setCreating(false);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/locations"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ChevronLeft size={12} />
        Locations
      </Link>

      <div className="mt-2 mb-6 flex items-center gap-2">
        {editing ? (
          <>
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-lg font-semibold dark:border-zinc-700 dark:bg-zinc-950"
            />
            <button
              onClick={onRename}
              className="text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <>
            <h1 className="flex-1 text-xl font-semibold">{data.name}</h1>
            <button
              onClick={() => {
                setEditName(data.name);
                setEditing(true);
              }}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      <h2 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Storage
      </h2>
      <form onSubmit={onAddStorage} className="mb-3 flex gap-2">
        <input
          value={newStorage}
          onChange={(e) => setNewStorage(e.target.value)}
          placeholder="New storage in this location"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          disabled={!newStorage.trim() || creating}
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

      {storagesError && (
        <p className="mb-3 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          Couldn’t load storages: {storagesError.message}
        </p>
      )}
      {itemsError && (
        <p className="mb-3 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          Couldn’t load items: {itemsError.message}
        </p>
      )}

      {storages.length === 0 ? (
        <p className="mb-6 text-sm text-zinc-500">
          No storage in this location yet.
        </p>
      ) : (
        <ul className="mb-6 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {storages.map((d) => (
            <li key={d.id} className="flex items-center gap-2 px-3 py-2">
              <Boxes size={16} className="text-zinc-400" />
              <Link
                href={`/storage/${d.id}`}
                className="flex flex-1 items-center gap-2 text-sm hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <span className="flex-1 font-medium">{d.data().name}</span>
                <ChevronRight size={14} className="text-zinc-400" />
              </Link>
              <button
                onClick={async () => {
                  if (
                    !confirm(
                      `Delete storage "${d.data().name}"? Items inside become Unsorted.`,
                    )
                  )
                    return;
                  await deleteDoc(storageDoc(user.uid, d.id));
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {looseItems.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Loose items in this location
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {looseItems.map((d) => {
              const i = d.data();
              return (
                <li key={d.id}>
                  <Link
                    href={`/item/${d.id}`}
                    className="block overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={i.photoUrl}
                        alt={i.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-2 text-sm font-medium truncate">
                      {i.name}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
