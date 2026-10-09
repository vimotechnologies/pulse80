"use client";

import { useEffect, useState } from "react";

export function ToastMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return <TimedToast key={message} message={message} />;
}

function TimedToast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 top-5 z-[70] sm:left-auto sm:right-5 sm:max-w-sm rounded-lg border border-card-border bg-white px-4 py-3 text-sm font-semibold text-navy shadow-xl"
    >
      {message}
    </div>
  );
}
