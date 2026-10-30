"use client";

import { useEffect, useState } from "react";
import { hhmm } from "@/lib/format";

/** Местное время Калининграда; на сервере рендерится то же значение, что и при первой отрисовке. */
export function Clock({ initial }: { initial: string }) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    const tick = () => setNow(new Date().toISOString());
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return <time dateTime={now}>{hhmm(now)}</time>;
}
