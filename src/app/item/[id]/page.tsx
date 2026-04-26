"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useDocument } from "react-firebase-hooks/firestore";
import { deleteDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { itemDoc } from "@/lib/paths";
import { TagsInput } from "@/components/TagsInput";
import { LocationSelect } from "@/components/LocationSelect";
import { StorageSelect } from "@/components/StorageSelect";
import { useExistingTags } from "@/lib/useExistingTags";
import { Loader2, Trash2 } from "lucide-react";

export default function ItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [user] = useAuthState(auth);
  const [snap, loading] = useDocument(
    user && params.id ? itemDoc(user.uid, params.id) : null,
  );
  const existingTags = useExistingTags(user?.uid ?? "");

  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [storageId, setStorageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!snap?.exists() || hydrated) return;
    const d = snap.data();
    setName(d.name ?? "");
    setTags(d.tags ?? []);
    setNotes(d.notes ?? "");
    setLocationId(d.locationId ?? null);
    setStorageId(d.storageId ?? null);
    setHydrated(true);
  }, [snap, hydrated]);

  if (loading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center text-sm text-zinc-500">
        Loading…
      </main>
    );
  }

  if (!snap?.exists()) {
    return (
      <main className="mx-auto max-w-xl px-4 py-6 text-sm text-zinc-500">
        Item not found.
      </main>
    );
  }

  const data = snap.data();

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !params.id) return;
    setSaving(true);
    await updateDoc(itemDoc(user.uid, params.id), {
      name: name.trim(),
      tags,
      notes: notes.trim(),
      locationId,
      storageId,
      updatedAt: serverTimestamp(),
    });
    setSaving(false);
  };

  const onDelete = async () => {
    if (!user || !params.id) return;
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setDeleting(true);
    try {
      if (data.photoPath) {
        await deleteObject(ref(storage, data.photoPath)).catch(() => {});
      }
      await deleteDoc(itemDoc(user.uid, params.id));
      router.push("/");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.photoUrl}
          alt={data.name}
          className="aspect-square w-full object-cover"
        />
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <Field label="Name" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </Field>
        <Field label="Location">
          <LocationSelect
            uid={user.uid}
            value={locationId}
            onChange={(next) => {
              setLocationId(next);
              setStorageId(null);
            }}
          />
        </Field>
        <Field label="Storage">
          <StorageSelect
            uid={user.uid}
            value={storageId}
            locationFilter={locationId}
            onChange={(nextStorage, derivedLocation) => {
              setStorageId(nextStorage);
              if (nextStorage && derivedLocation) {
                setLocationId(derivedLocation);
              }
            }}
          />
        </Field>
        <Field label="Tags">
          <TagsInput
            value={tags}
            onChange={setTags}
            suggestions={existingTags}
          />
        </Field>
        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </Field>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="bubbly inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save changes
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
