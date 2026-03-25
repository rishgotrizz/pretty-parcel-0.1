"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  if (ms <= 0) {
    return "Ended";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function FlashSaleTimer({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState(() => formatRemaining(new Date(endsAt).getTime() - Date.now()));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(formatRemaining(new Date(endsAt).getTime() - Date.now()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [endsAt]);

  return (
    <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-berry">
      Ends in {remaining}
    </span>
  );
}
