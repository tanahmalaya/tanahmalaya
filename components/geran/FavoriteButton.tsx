"use client";

import { useState } from "react";
import Link from "next/link";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill={filled ? "#0E3B2E" : "none"}
      stroke={filled ? "#0E3B2E" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export default function FavoriteButton({
  geranId,
  favorited,
  isLoggedIn,
  redirectPath,
  onToggle,
  className = "",
}: {
  geranId: string;
  favorited: boolean;
  isLoggedIn: boolean;
  redirectPath: string;
  onToggle?: (geranId: string, favorited: boolean) => void;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const base = `w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm transition-transform active:scale-90 ${className}`;

  if (!isLoggedIn) {
    return (
      <Link
        href={`/geran/log-masuk?redirect=${encodeURIComponent(redirectPath)}`}
        onClick={(e) => e.stopPropagation()}
        className={base}
        aria-label="Log masuk untuk simpan favorite"
      >
        <HeartIcon filled={false} />
      </Link>
    );
  }

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/geran/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geranId }),
      });
      const data = await res.json();
      if (res.ok) onToggle?.(geranId, data.favorited);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${base} disabled:opacity-60`}
      aria-label={favorited ? "Buang dari favorite" : "Simpan ke favorite"}
    >
      <HeartIcon filled={favorited} />
    </button>
  );
}
