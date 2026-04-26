"use client";

import { useState } from "react";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import { resizeImage } from "@/lib/resizeImage";
import { CameraCapture } from "./CameraCapture";
import { Camera, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";

type Variant = "avatar" | "banner";

export function PhotoEditor({
  uid,
  pathPrefix,
  photoUrl,
  photoPath,
  onChange,
  variant = "avatar",
  size = 80,
  aspectRatio = "21 / 9",
}: {
  uid: string;
  pathPrefix: string;
  photoUrl: string | null;
  photoPath: string | null;
  onChange: (next: {
    photoUrl: string | null;
    photoPath: string | null;
  }) => Promise<void> | void;
  variant?: Variant;
  size?: number;
  aspectRatio?: string;
}) {
  const [showCamera, setShowCamera] = useState(false);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const blob = await resizeImage(
        file,
        variant === "banner" ? 2000 : 800,
        0.85,
      );
      const path = `users/${uid}/${pathPrefix}/${Date.now()}-${crypto.randomUUID()}.jpg`;
      const newRef = ref(storage, path);
      await uploadBytes(newRef, blob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(newRef);
      if (photoPath) {
        await deleteObject(ref(storage, photoPath)).catch(() => {});
      }
      await onChange({ photoUrl: url, photoPath: path });
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      if (photoPath) {
        await deleteObject(ref(storage, photoPath)).catch(() => {});
      }
      await onChange({ photoUrl: null, photoPath: null });
    } finally {
      setBusy(false);
    }
  };

  const fileInput = (
    <input
      type="file"
      accept="image/*"
      className="hidden"
      disabled={busy}
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) upload(f);
        e.target.value = "";
      }}
    />
  );

  if (variant === "banner") {
    return (
      <>
        <div
          className="photo-edit-trigger relative w-full overflow-hidden rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800"
          style={{ aspectRatio }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <ImageIcon size={48} />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 size={22} className="animate-spin text-white" />
            </div>
          )}
          <div className="photo-edit-controls absolute right-2 bottom-2 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur hover:bg-black/80 disabled:opacity-50"
            >
              <Camera size={12} />
              Take photo
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur hover:bg-black/80">
              <ImageIcon size={12} />
              Upload
              {fileInput}
            </label>
            {photoUrl && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur hover:bg-red-700/80 disabled:opacity-50"
              >
                <Trash2 size={12} />
                Remove
              </button>
            )}
          </div>
        </div>
        {showCamera && (
          <CameraCapture
            onCancel={() => setShowCamera(false)}
            onCapture={(f) => {
              setShowCamera(false);
              upload(f);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="photo-edit-trigger relative shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
        style={{ width: size, height: size }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <ImageIcon size={size * 0.4} />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={18} className="animate-spin text-white" />
          </div>
        )}
        <div className="photo-edit-controls absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45">
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            disabled={busy}
            title="Take photo"
            className="rounded-full bg-white/90 p-1.5 text-zinc-800 hover:bg-white disabled:opacity-50"
          >
            <Camera size={14} />
          </button>
          <label
            title="Upload"
            className="cursor-pointer rounded-full bg-white/90 p-1.5 text-zinc-800 hover:bg-white"
          >
            <ImageIcon size={14} />
            {fileInput}
          </label>
          {photoUrl && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              title="Remove"
              className="rounded-full bg-white/90 p-1.5 text-red-600 hover:bg-white disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {showCamera && (
        <CameraCapture
          onCancel={() => setShowCamera(false)}
          onCapture={(f) => {
            setShowCamera(false);
            upload(f);
          }}
        />
      )}
    </>
  );
}
