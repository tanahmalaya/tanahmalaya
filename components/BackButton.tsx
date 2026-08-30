"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

type BackButtonProps = {
  href?: string;
  label?: string;
  variant?: "light" | "dark";
  className?: string;
};

export default function BackButton({ href, label = "Kembali", variant = "light", className = "" }: BackButtonProps) {
  const router = useRouter();

  const colorClasses =
    variant === "dark"
      ? "text-white/70 hover:text-brand-gold"
      : "text-brand-dark/60 hover:text-brand-gold";

  const sharedClasses = `inline-flex items-center gap-1.5 text-sm font-medium transition-colors active:opacity-70 ${colorClasses} ${className}`;

  if (href) {
    return (
      <Link href={href} className={sharedClasses}>
        <ArrowLeftIcon />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => router.back()} className={sharedClasses}>
      <ArrowLeftIcon />
      {label}
    </button>
  );
}
