"use client";

import type { AgentRuntime, SimulationPhase } from "@/lib/simulation";

function ChromeBar({ url }: { url: string }) {
  const display = url.replace(/^https?:\/\//, "").slice(0, 58);
  return (
    <div className="flex items-center gap-2 border-b border-[#222222] bg-[#0A0A0A] px-2 py-1.5">
      <div className="flex gap-1" aria-hidden>
        <span className="h-2 w-2 border border-[#333333] bg-[#191919]" />
        <span className="h-2 w-2 border border-[#333333] bg-[#191919]" />
        <span className="h-2 w-2 border border-[#333333] bg-[#191919]" />
      </div>
      <div className="min-w-0 flex-1 truncate border border-[#222222] bg-black px-2 py-0.5 font-mono text-[9px] text-[#A0A0A0]">
        {display}
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full border border-[#222222] bg-black">
      <div
        className="h-full bg-white transition-[width] duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function AgentViewfinder({
  agent,
  phase,
  targetUrl,
}: {
  agent: AgentRuntime;
  phase: SimulationPhase;
  targetUrl: string;
}) {
  const frozen = phase === "PAUSED";
  const running = phase === "RUNNING";

  return (
    <div
      className={`flex h-full min-h-[360px] flex-col border border-[#222222] bg-black ${
        frozen ? "opacity-80" : ""
      }`}
    >
      <ChromeBar url={targetUrl} />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[300px] overflow-hidden border-b border-[#222222] bg-[#050505] p-4 lg:border-b-0 lg:border-r">
          <div
            className={`absolute inset-x-0 top-0 h-px bg-white/80 ${
              running ? "animate-pulse" : ""
            }`}
            aria-hidden
          />

          <div className="mb-4 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-widest text-[#A0A0A0]">
            <span>live browser inspection</span>
            <span className="text-white">{agent.productStage}</span>
          </div>

          <div className="mx-auto flex h-full max-w-xl flex-col border border-[#222222] bg-[#0A0A0A]">
            <div className="border-b border-[#222222] px-4 py-3">
              <div className="mb-2 h-3 w-36 bg-white" />
              <div className="h-2 w-64 max-w-full bg-[#333333]" />
            </div>

            <div className="grid flex-1 grid-rows-[auto_1fr_auto] gap-4 p-4">
              <div className="grid grid-cols-3 gap-2">
                {["Hero", "Proof", "Action"].map((label, index) => (
                  <div
                    key={label}
                    className={`border px-2 py-2 font-mono text-[9px] uppercase ${
                      index === agent.progress % 3
                        ? "border-white bg-white text-black"
                        : "border-[#222222] bg-black text-[#A0A0A0]"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col justify-center gap-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A0]">
                  Current surface
                </div>
                <div className="border border-[#222222] bg-black p-4 text-sm leading-6 text-white">
                  {agent.browserScene}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-[#222222] bg-black p-3">
                    <div className="mb-1 font-mono text-[9px] uppercase text-[#A0A0A0]">
                      Friction
                    </div>
                    <div className="text-sm text-white">{agent.signal}</div>
                  </div>
                  <div className="border border-[#222222] bg-black p-3">
                    <div className="mb-1 font-mono text-[9px] uppercase text-[#A0A0A0]">
                      Confidence
                    </div>
                    <div className="font-mono text-xl text-white">
                      {agent.confidence}%
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-widest text-[#A0A0A0]">
                  <span>{agent.status}</span>
                  <span>{agent.progress}%</span>
                </div>
                <ProgressBar value={agent.progress} />
              </div>
            </div>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-4 bg-[#0A0A0A] p-4">
          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#A0A0A0]">
              Active persona
            </div>
            <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
            <p className="mt-1 text-sm text-[#C8C8C8]">{agent.title}</p>
          </div>

          <div className="border border-[#222222] bg-black p-3">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#A0A0A0]">
              Persona
            </div>
            <p className="text-sm leading-6 text-[#D8D8D8]">{agent.persona}</p>
          </div>

          <div className="border border-[#222222] bg-black p-3">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#A0A0A0]">
              Think-aloud
            </div>
            <blockquote className="text-sm leading-6 text-white">
              &quot;{agent.quote}&quot;
            </blockquote>
          </div>

          <div className="border border-[#222222] bg-black p-3">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#A0A0A0]">
              Recommended fix
            </div>
            <p className="text-sm leading-6 text-[#D8D8D8]">
              {agent.recommendation}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
