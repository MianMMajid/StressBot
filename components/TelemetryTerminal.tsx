"use client";

import { useEffect, useRef } from "react";
import type { SimulationPhase } from "@/lib/simulation";

export function TelemetryTerminal({
  lines,
  phase,
}: {
  lines: string[];
  phase: SimulationPhase;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "RUNNING") return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, phase]);

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto bg-black p-3 font-mono text-[10px] leading-relaxed text-[#C8C8C8]">
      <div className="mb-2 border-b border-[#222222] pb-2 text-[#888888]">
        <span className="text-white">usersim</span>@telemetry · session_
        {lines.length.toString(16).padStart(4, "0")}
      </div>
      <ul className="flex flex-col gap-1">
        {lines.map((line, i) => (
          <li
            key={`${i}-${line.slice(0, 24)}`}
            className={
              line.includes("CRITICAL") || line.includes("HIGH")
                ? "text-red-400"
                : "text-[#C8C8C8]"
            }
          >
            <span className="select-none text-[#888888]">
              {(i + 1).toString().padStart(4, "0")}
            </span>{" "}
            {line}
          </li>
        ))}
      </ul>
      <div ref={bottomRef} />
    </div>
  );
}
