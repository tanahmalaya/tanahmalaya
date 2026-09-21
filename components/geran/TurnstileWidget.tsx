"use client";

import { useEffect, useRef } from "react";

// Widget Cloudflare Turnstile. Kalau NEXT_PUBLIC_TURNSTILE_SITE_KEY tak
// ditetapkan, widget tak dipapar langsung dan borang hantar token null -
// pelayan akan terima dalam pembangunan dan tolak dalam produksi
// (lihat lib/turnstile.ts).
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
    onTurnstileReady?: () => void;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export default function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Disimpan dalam ref supaya render semula widget tak dicetuskan setiap kali
  // komponen induk render dengan callback baharu.
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;

    let dibatalkan = false;

    function render() {
      if (dibatalkan || !holderRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(holderRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => onTokenRef.current(null),
      });
    }

    if (window.turnstile) {
      render();
    } else {
      const sedia = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (sedia) {
        sedia.addEventListener("load", render);
      } else {
        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.addEventListener("load", render);
        document.head.appendChild(script);
      }
    }

    return () => {
      dibatalkan = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!SITE_KEY) return null;

  return <div ref={holderRef} className="my-1" />;
}
