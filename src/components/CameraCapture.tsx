"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw } from "lucide-react";

export function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setReady(false);
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Camera unavailable. Check browser permissions.",
        );
      }
    };

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-3 text-white">
        <button
          onClick={onCancel}
          className="rounded-full bg-white/10 p-2 hover:bg-white/20"
          aria-label="Close camera"
        >
          <X size={18} />
        </button>
        <button
          onClick={() =>
            setFacing((f) => (f === "environment" ? "user" : "environment"))
          }
          className="rounded-full bg-white/10 p-2 hover:bg-white/20"
          aria-label="Switch camera"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <div className="max-w-sm px-6 text-center text-sm text-zinc-300">
            <p className="mb-2 font-medium">Couldn’t open the camera.</p>
            <p className="text-zinc-400">{error}</p>
            <button
              onClick={onCancel}
              className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-black"
            >
              Use file upload instead
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="max-h-full max-w-full"
          />
        )}
      </div>

      {!error && (
        <div className="flex items-center justify-center p-6">
          <button
            onClick={capture}
            disabled={!ready}
            aria-label="Take photo"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black ring-4 ring-white/30 disabled:opacity-50"
          >
            <Camera size={26} />
          </button>
        </div>
      )}
    </div>
  );
}
