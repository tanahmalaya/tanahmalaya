"use client";

// Input kata laluan dengan butang "tunjuk/sembunyi" - dikongsi oleh log masuk
// admin PLT, admin GERAN dan borang akaun GERAN awam supaya taip kata laluan
// boleh disahkan sebelum hantar (elak typo yang menyebabkan "kata laluan
// salah" mengelirukan, sedangkan sebenarnya cuma tersilap taip).
//
// className diteruskan terus ke <input> (caller kekal kawal warna/sempadan
// ikut tema masing-masing); ruang untuk butang mata ditambah via inline style
// supaya ia tak bergantung pada urutan class Tailwind mengatasi satu sama lain.

import { useState, type InputHTMLAttributes } from "react";

function IkonMata() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IkonMataDicoret() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a20.87 20.87 0 015.06-6.06" />
      <path d="M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a20.82 20.82 0 01-3.22 4.4" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function PasswordInput({
  className = "",
  style,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [tunjuk, setTunjuk] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={tunjuk ? "text" : "password"}
        className={className}
        style={{ ...style, paddingRight: "2.75rem" }}
      />
      <button
        type="button"
        onClick={() => setTunjuk((t) => !t)}
        tabIndex={-1}
        aria-label={tunjuk ? "Sembunyikan kata laluan" : "Tunjukkan kata laluan"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-black/35 hover:text-black/65"
      >
        {tunjuk ? <IkonMataDicoret /> : <IkonMata />}
      </button>
    </div>
  );
}
