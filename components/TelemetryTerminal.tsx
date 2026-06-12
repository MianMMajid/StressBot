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
      <div className="mb-2 flex items-center justify-between border-b border-[#222222] pb-2 text-[#888888]">
        <span>
          <span className="text-white">stressbot</span>@telemetry · session_
          {lines.length.toString(16).padStart(4, "0")}
        </span>
        <span className="flex items-center gap-2 uppercase tracking-widest">
          <span
            className={`h-1.5 w-1.5 bg-white ${
              phase === "RUNNING" ? "live-signal" : ""
            }`}
            aria-hidden
          />
          {phase === "RUNNING" ? "streaming" : "standby"}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {lines.length === 0 ? (
          <li className="text-[#777777]">
            <span className="select-none text-[#888888]">0000</span>{" "}
            Waiting for StressBot review...
          </li>
        ) : null}
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
        {phase === "RUNNING" ? (
          <li className="text-white">
            <span className="select-none text-[#888888]">
              {(lines.length + 1).toString().padStart(4, "0")}
            </span>{" "}
            <span className="live-flicker">capturing next agent event...</span>
          </li>
        ) : null}
      </ul>
      <div ref={bottomRef} />
    </div>
  );
}
