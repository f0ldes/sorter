"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { deleteDoc, query, updateDoc, where } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { itemsCol, locationDoc, storageDoc } from "@/lib/paths";
import {
  ChevronLeft,
  Pencil,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { PhotoEditor } from "@/components/PhotoEditor";

export default function StorageDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [user] = useAuthState(auth);

  const [snap, loading] = useDocument(
    user && params.id ? storageDoc(user.uid, params.id) : null,
  );
  const data = snap?.data();

  const [locSnap] = useDocument(
    user && data?.locationId ? locationDoc(user.uid, data.locationId) : null,
  );

  // Sort client-side to avoid needing a Firestore composite index.
  const [itemsSnap, , itemsError] = useCollection(
    user && params.id
      ? query(itemsCol(user.uid), where("storageId", "==", params.id))
      : null,
  );
  const items = (itemsSnap?.docs ?? []).slice().sort((a, b) => {
    const ta = a.data().createdAt?.toMillis?.() ?? 0;
    const tb = b.data().createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");

  if (!user || loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-sm text-zinc-500">
        Loading…
      </main>
    );
  }

  if (!snap?.exists() || !data) {
    return (
      <main className="mx-auto max-w-xl px-4 py-6 text-sm text-zinc-500">
        Storage not found. <Link href="/locations">Back to locations</Link>
      </main>
    );
  }

  const onRename = async () => {
    if (!editName.trim()) return;
    await updateDoc(storageDoc(user.uid, params.id!), {
      name: editName.trim(),
    });
    setEditing(false);
  };

  const onDelete = async () => {
    if (
      !confirm(
        `Delete storage "${data.name}"? Items inside keep their reference and show as Unsorted.`,
      )
    )
      return;
    await deleteDoc(storageDoc(user.uid, params.id!));
    if (data.locationId) {
      router.push(`/location/${data.locationId}`);
    } else {
      router.push("/locations");
    }
  };

  const locationName = locSnap?.exists() ? locSnap.data().name : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <nav className="flex items-center gap-1 text-xs text-zinc-500">
        <Link
          href="/locations"
          className="hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Locations
        </Link>
        {data.locationId && (
          <>
            <ChevronLeft size={12} className="rotate-180" />
            <Link
              href={`/location/${data.locationId}`}
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {locationName ?? "…"}
            </Link>
          </>
        )}
      </nav>

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

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Photo
        </h2>
        <PhotoEditor
          uid={user.uid}
          pathPrefix="storages"
          photoUrl={data.photoUrl ?? null}
          photoPath={data.photoPath ?? null}
          onChange={async ({ photoUrl, photoPath }) => {
            await updateDoc(storageDoc(user.uid, params.id!), {
              photoUrl,
              photoPath,
            });
          }}
        />
      </section>

      {itemsError && (
        <p className="mb-3 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          Couldn’t load items: {itemsError.message}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No items in this storage yet.{" "}
          <Link
            href="/new"
            className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Add one
          </Link>
          .
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((d) => {
            const i = d.data();
            return (
              <li key={d.id}>
                <Link
                  href={`/item/${d.id}`}
                  className="card-lift block overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
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
      )}
    </main>
  );
}
