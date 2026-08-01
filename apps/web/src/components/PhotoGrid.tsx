"use client";

import { useRef, useState } from "react";
import { MAX_PHOTOS } from "@attune/shared";
import { api, removePhoto, uploadPhoto } from "@/lib/api";

type Props = {
  photoUrls: string[];
  onChange: (urls: string[]) => void;
  onError?: (message: string) => void;
};

export function PhotoGrid({ photoUrls, onChange, onError }: Props) {
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const targetSlot = useRef<number>(0);

  const realPhotos = photoUrls.filter((u) => !u.includes("api.dicebear.com"));
  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => realPhotos[i] ?? null);

  function openPicker(slot: number) {
    targetSlot.current = slot;
    fileRef.current?.click();
  }

  async function persistOrder(urls: string[]) {
    const trimmed = urls.slice(0, MAX_PHOTOS);
    await api("/profiles/me", {
      method: "PATCH",
      body: JSON.stringify({ photoUrls: trimmed }),
    });
    onChange(trimmed);
  }

  async function onFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const slot = targetSlot.current;
    setUploadingSlot(slot);
    onError?.("");
    try {
      const existing = slots[slot];
      if (existing) {
        await removePhoto(existing);
      }
      const res = await uploadPhoto(file);
      const clean = res.photoUrls.filter((u) => !u.includes("api.dicebear.com") && u !== res.url);
      clean.splice(Math.min(slot, clean.length), 0, res.url);
      await persistOrder(clean);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploadingSlot(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function clearSlot(url: string) {
    onError?.("");
    try {
      const res = await removePhoto(url);
      onChange(res.photoUrls.filter((u) => !u.includes("api.dicebear.com")));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Could not remove photo");
    }
  }

  return (
    <div>
      <p className="meta" style={{ marginBottom: "0.75rem" }}>
        Add up to {MAX_PHOTOS} photos — first slot is your main profile photo. JPEG/PNG/WebP, 5MB
        max each.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => void onFile(e.target.files)}
      />
      <div className="photo-grid">
        {slots.map((url, i) => (
          <div
            key={i}
            className={`photo-slot ${i === 0 ? "main" : ""} ${url ? "filled" : ""}`}
          >
            {url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" />
                <div className="photo-slot-actions">
                  <button type="button" onClick={() => openPicker(i)}>
                    Replace
                  </button>
                  <button type="button" onClick={() => void clearSlot(url)}>
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="photo-slot-add"
                disabled={uploadingSlot !== null}
                onClick={() => openPicker(i)}
              >
                {uploadingSlot === i ? "Uploading…" : i === 0 ? "+ Main photo" : `+ Photo ${i + 1}`}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
