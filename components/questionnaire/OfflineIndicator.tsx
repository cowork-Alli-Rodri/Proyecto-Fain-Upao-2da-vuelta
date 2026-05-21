"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function update() {
      setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    }
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 w-full bg-[var(--color-coral-pulse)] px-4 py-2 text-center text-xs font-medium text-white"
    >
      Sin conexión. Tus respuestas se guardarán cuando vuelva la red.
    </div>
  );
}
