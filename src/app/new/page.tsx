"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { itemsCol } from "@/lib/paths";
import { resizeImage } from "@/lib/resizeImage";
import { TagsInput } from "@/components/TagsInput";
import { LocationSelect } from "@/components/LocationSelect";
import { StorageSelect } from "@/components/StorageSelect";
import { CameraCapture } from "@/components/CameraCapture";
import { useExistingTags } from "@/lib/useExistingTags";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";

export default function NewItemPage() {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const existingTags = useExistingTags(user?.uid ?? "");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [storageId, setStorageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setPicked = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await resizeImage(file);
      const path = `users/${user.uid}/items/${Date.now()}-${crypto.randomUUID()}.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const photoUrl = await getDownloadURL(storageRef);

      const docRef = await addDoc(itemsCol(user.uid), {
        name: name.trim(),
        tags,
        notes: notes.trim(),
        photoUrl,
        photoPath: path,
        storageId,
        locationId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as never);

      router.push(`/item/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">New item</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Photo
          </label>

          <div className="mt-1 overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="preview"
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-sm text-zinc-500">
                No photo yet
              </div>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <Camera size={15} />
              Take photo
            </button>
            <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900">
              <ImageIcon size={15} />
              Upload file
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPicked(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!file || !name.trim() || saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Saving…" : "Save item"}
        </button>
      </form>

      {showCamera && (
        <CameraCapture
          onCancel={() => setShowCamera(false)}
          onCapture={(f) => {
            setPicked(f);
            setShowCamera(false);
          }}
        />
      )}
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
