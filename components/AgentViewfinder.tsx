"use client";

import { useEffect, useState } from "react";
import type { SimulationPhase } from "@/lib/simulation";
import { SIMULATION_STEPS } from "@/lib/simulation";

function ChromeBar({ url }: { url: string }) {
  const display = url.replace(/^https?:\/\//, "").slice(0, 48);
  return (
    <div className="flex items-center gap-2 border-b border-[#222222] bg-[#0A0A0A] px-2 py-1.5">
      <div className="flex gap-1">
        <span className="h-2 w-2 border border-[#222222] bg-[#222222]" />
        <span className="h-2 w-2 border border-[#222222] bg-[#222222]" />
        <span className="h-2 w-2 border border-[#222222] bg-[#222222]" />
      </div>
      <div className="min-w-0 flex-1 border border-[#222222] bg-black px-2 py-0.5 font-mono text-[9px] text-[#888888]">
        {display}
      </div>
    </div>
  );
}

export function AgentViewfinder({
  stepIndex,
  phase,
  targetUrl,
}: {
  stepIndex: number;
  phase: SimulationPhase;
  targetUrl: string;
}) {
  const step = SIMULATION_STEPS[stepIndex];
  const frozen = phase === "PAUSED";
  const [routeTab, setRouteTab] = useState(0);

  useEffect(() => {
    if (stepIndex !== 4 || phase !== "RUNNING") return;
    const id = window.setInterval(() => {
      setRouteTab((t) => (t === 0 ? 1 : 0));
    }, 380);
    return () => window.clearInterval(id);
  }, [stepIndex, phase]);

  return (
    <div
      className={`flex h-full min-h-[220px] flex-col border border-[#222222] bg-black ${frozen ? "opacity-80" : ""}`}
    >
      <ChromeBar url={targetUrl} />
      <div className="relative flex flex-1 flex-col overflow-hidden p-4">
        <div className="relative z-10 flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-[#888888]">
            <span>viewport 1280×720</span>
            <span className="text-white">
              {step?.phase ?? "Awaiting signal"}
            </span>
          </div>

          {stepIndex <= 1 && (
            <div className="mx-auto w-full max-w-sm border border-[#222222] bg-[#0A0A0A] p-4">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#888888]">
                Authenticate
              </div>
              <label className="mb-1 block font-mono text-[9px] text-[#888888]">
                username
              </label>
              <div className="mb-3 border border-[#222222] bg-black px-2 py-2 font-mono text-[10px] text-white">
                <span className="animate-pulse">
                  {stepIndex === 0
                    ? "█".repeat(32) + "…5000b payload"
                    : "root@usersim#"}
                </span>
              </div>
              <label className="mb-1 block font-mono text-[9px] text-[#888888]">
                password
              </label>
              <div className="mb-4 border border-[#222222] bg-black px-2 py-2 font-mono text-[10px] text-[#888888]">
                ••••••••••••
              </div>
              <button
                type="button"
                className={`w-full border border-[#222222] bg-white py-2 font-mono text-[10px] font-medium uppercase tracking-widest text-black ${
                  stepIndex === 1 && !frozen
                    ? "animate-[pulse_0.35s_ease-in-out_infinite]"
                    : ""
                }`}
              >
                Submit
              </button>
            </div>
          )}

          {stepIndex === 2 && (
            <div className="mx-auto w-full max-w-sm border border-[#222222] bg-[#0A0A0A] p-4">
              <div className="mb-3 border border-red-500/80 bg-black px-2 py-2 font-mono text-[10px] text-red-400">
                POST /api/v1/auth/register — 500 Internal Server Error
              </div>
              <pre className="max-h-28 overflow-hidden border border-[#222222] bg-black p-2 font-mono text-[9px] leading-relaxed text-[#888888]">
                {`{\n  "error": "EMPTY_PAYLOAD",\n  "trace_id": "usr_9f2a…"\n}`}
              </pre>
            </div>
          )}

          {stepIndex === 3 && (
            <div className="mx-auto w-full max-w-sm border border-[#222222] bg-black p-3 font-mono text-[9px] text-red-400">
              <div className="mb-2 text-[#888888]">console // uncaught</div>
              <div>
                TypeError: Cannot read properties of undefined (reading
                &apos;token&apos;)
              </div>
              <div className="mt-2 text-[#888888]">
                at AuthProvider.useEffect (chunk-auth.js:412:19)
              </div>
            </div>
          )}

          {stepIndex === 4 && (
            <div className="mx-auto flex w-full max-w-sm flex-col gap-2 border border-[#222222] bg-[#0A0A0A] p-3">
              <div className="flex border border-[#222222]">
                <div
                  className={`flex-1 border-r border-[#222222] px-2 py-1 text-center font-mono text-[9px] uppercase ${
                    routeTab === 0 ? "bg-white text-black" : "text-[#888888]"
                  }`}
                >
                  Dashboard
                </div>
                <div
                  className={`flex-1 px-2 py-1 text-center font-mono text-[9px] uppercase ${
                    routeTab === 1 ? "bg-white text-black" : "text-[#888888]"
                  }`}
                >
                  Settings
                </div>
              </div>
              <div className="border border-[#222222] bg-black p-3 font-mono text-[9px] text-[#888888]">
                Router transition queue depth: 6 · cancelling stale…
              </div>
            </div>
          )}

          {stepIndex === 5 && (
            <div className="mx-auto w-full max-w-sm border border-red-500/60 bg-black p-4 text-center">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-red-400">
                Unresponsive
              </div>
              <div className="font-mono text-[9px] text-[#888888]">
                Main thread blocked · layout thrash detected
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
