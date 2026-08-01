"use client";

import { useState } from "react";

type Props = {
  photoUrls: string[];
  alt?: string;
};

export function ProfileGallery({ photoUrls, alt = "" }: Props) {
  const photos =
    photoUrls.filter((u) => !u.includes("api.dicebear.com")).length > 0
      ? photoUrls.filter((u) => !u.includes("api.dicebear.com"))
      : photoUrls.length
        ? photoUrls
        : ["https://api.dicebear.com/9.x/lorelei/svg?seed=attune&backgroundColor=d7ebe4"];
  const [index, setIndex] = useState(0);
  const current = photos[Math.min(index, photos.length - 1)]!;

  return (
    <div className="profile-gallery">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current} alt={alt} />
      {photos.length > 1 ? (
        <>
          <div className="gallery-dots">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === index ? "on" : ""}
                aria-label={`Photo ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <div className="gallery-nav">
            <button
              type="button"
              className="btn secondary"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              Prev
            </button>
            <span className="meta">
              {index + 1} / {photos.length}
            </span>
            <button
              type="button"
              className="btn secondary"
              disabled={index >= photos.length - 1}
              onClick={() => setIndex((i) => Math.min(photos.length - 1, i + 1))}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
