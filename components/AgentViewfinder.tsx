"use client";

import Image from "next/image";
import type { PageEvidence, PersonaFinding } from "@/lib/page-analysis";
import type { AgentRuntime, SimulationPhase } from "@/lib/simulation";

function ChromeBar({ url }: { url: string }) {
  const display = url.replace(/^https?:\/\//, "").slice(0, 58);
  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-[#111113] px-2 py-1.5">
      <div className="flex gap-1" aria-hidden>
        <span className="h-2 w-2 border border-white/10 bg-[#2A2A2D]" />
        <span className="h-2 w-2 border border-white/10 bg-[#2A2A2D]" />
        <span className="h-2 w-2 border border-white/10 bg-[#2A2A2D]" />
      </div>
      <div className="min-w-0 flex-1 truncate border border-white/10 bg-black/60 px-2 py-0.5 font-mono text-[9px] text-[#B8B8BE]">
        {display}
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full bg-white/10">
      <div
        className="h-full bg-white transition-[width] duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function AgentViewfinder({
  agent,
  finding,
  evidence,
  analyzing,
  phase,
  targetUrl,
}: {
  agent: AgentRuntime;
  finding?: PersonaFinding;
  evidence: PageEvidence | null;
  analyzing: boolean;
  phase: SimulationPhase;
  targetUrl: string;
}) {
  const frozen = phase === "PAUSED";
  const running = phase === "RUNNING";
  const hotspotLeft = 18 + ((agent.progress * 7) % 58);
  const hotspotTop = 24 + ((agent.progress * 5) % 42);
  const secondaryLeft = 70 - ((agent.progress * 3) % 44);
  const secondaryTop = 66 - ((agent.progress * 4) % 36);
  const visibleSignal = finding?.signal ?? agent.signal;
  const visibleQuote = finding?.quote ?? agent.quote;
  const visibleRecommendation = finding?.recommendation ?? agent.recommendation;
  const visibleConfidence = finding?.confidence ?? agent.confidence;
  const visibleSurface =
    evidence?.title || evidence?.description || agent.browserScene;

  return (
    <div
      className={`flex h-full min-h-[340px] flex-col border border-white/10 bg-[#101012] ${
        frozen ? "opacity-80" : ""
      }`}
    >
      <ChromeBar url={targetUrl} />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_320px]">
        <div className="relative min-h-[300px] overflow-hidden border-b border-white/10 bg-[#0B0B0C] p-3 sm:p-4 lg:border-b-0 lg:border-r">
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-20 border-y border-white/20 bg-white/5 ${
              running ? "live-scanline" : ""
            }`}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden
          />

          <div className="mb-4 flex items-center justify-between gap-3 text-xs text-[#A8A8AF]">
            <span className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 bg-white ${
                  running ? "live-signal" : ""
                }`}
                aria-hidden
              />
              live browser inspection
            </span>
            <span className={running ? "live-flicker text-white" : "text-white"}>
              {agent.productStage}
            </span>
          </div>

          <div className="relative mx-auto flex h-full max-w-xl flex-col overflow-hidden border border-white/10 bg-[#141416] shadow-xl shadow-black/30">
            <div
              className={`pointer-events-none absolute h-20 w-20 border border-white/70 ${
                running ? "live-drift" : ""
              }`}
              style={{ left: `${hotspotLeft}%`, top: `${hotspotTop}%` }}
              aria-hidden
            >
              <span className="absolute -left-1 -top-1 h-2 w-2 bg-white" />
              <span className="absolute -right-1 -top-1 h-2 w-2 bg-white" />
              <span className="absolute -bottom-1 -left-1 h-2 w-2 bg-white" />
              <span className="absolute -bottom-1 -right-1 h-2 w-2 bg-white" />
            </div>
            <div
              className="pointer-events-none absolute h-3 w-3 border border-white bg-black"
              style={{ left: `${secondaryLeft}%`, top: `${secondaryTop}%` }}
              aria-hidden
            />
            <div className="border-b border-white/10 px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-36 bg-white" />
                <div className="font-mono text-[9px] uppercase text-[#A8A8AF]">
                  {analyzing ? "capturing DOM" : evidence ? "page captured" : "demo trace"}
                </div>
              </div>
              <div className="h-2 w-64 max-w-full overflow-hidden bg-white/10">
                <div
                  className={`h-full w-1/3 bg-white/60 ${
                    running ? "animate-pulse" : ""
                  }`}
                />
              </div>
            </div>

            <div className="grid flex-1 grid-rows-[auto_1fr_auto] gap-4 p-3 sm:p-4">
              <div className="grid grid-cols-3 gap-2">
                {["Hero", "Proof", "Action"].map((label, index) => (
                  <div
                    key={label}
                    className={`border px-2 py-2 font-mono text-[9px] uppercase ${
                      index === Math.floor(agent.progress / 24) % 3
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-black/50 text-[#A8A8AF]"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col justify-center gap-3">
                <div className="text-xs text-[#A8A8AF]">
                  Current surface - agent trace
                </div>
                {evidence?.screenshot ? (
                  <div className="relative max-h-48 overflow-hidden border border-white/10 bg-black">
                    <Image
                      src={evidence.screenshot}
                      alt={`Screenshot captured from ${evidence.finalUrl}`}
                      width={900}
                      height={540}
                      unoptimized
                      className="h-full w-full object-cover object-top opacity-80"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 px-3 py-2 text-xs text-white">
                      {visibleSurface}
                    </div>
                  </div>
                ) : (
                  <div className="border border-white/10 bg-black/50 p-4 text-sm leading-6 text-white">
                    {visibleSurface}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="border border-white/10 bg-black/40 p-3">
                    <div className="mb-1 text-xs text-[#A8A8AF]">
                      Friction
                    </div>
                    <div className="text-sm text-white">{visibleSignal}</div>
                  </div>
                  <div className="border border-white/10 bg-black/40 p-3">
                    <div className="mb-1 text-xs text-[#A8A8AF]">
                      Evidence
                    </div>
                    <div className="font-mono text-xl text-white">
                      {evidence
                        ? evidence.headings.length + evidence.buttons.length
                        : Math.max(1, Math.round(agent.progress / 13))}
                    </div>
                  </div>
                  <div className="border border-white/10 bg-black/40 p-3">
                    <div className="mb-1 text-xs text-[#A8A8AF]">
                      Confidence
                    </div>
                    <div className="font-mono text-xl text-white">
                      {visibleConfidence}%
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between font-mono text-[9px] uppercase tracking-widest text-[#A8A8AF]">
                  <span>{agent.status}</span>
                  <span>{agent.progress}%</span>
                </div>
                <ProgressBar value={agent.progress} />
              </div>
            </div>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3 bg-[#111113] p-4">
          <div>
            <div className="mb-1 text-xs text-[#A8A8AF]">
              Active persona
            </div>
            <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
              <span
                className={`h-2 w-2 bg-white ${running ? "live-signal" : ""}`}
                aria-hidden
              />
              {agent.name}
            </h3>
            <p className="mt-1 text-sm text-[#C8C8C8]">{agent.title}</p>
          </div>

          <div className="border border-white/10 bg-black/40 p-3">
            <div className="mb-2 text-xs text-[#A8A8AF]">
              Persona
            </div>
            <p className="text-sm leading-6 text-[#D8D8D8]">{agent.persona}</p>
          </div>

          <div className="border border-white/10 bg-black/40 p-3">
            <div className="mb-2 text-xs text-[#A8A8AF]">
              Think-aloud
            </div>
            <blockquote className="text-sm leading-6 text-white">
              &quot;{visibleQuote}&quot;
            </blockquote>
          </div>

          <div className="border border-white/10 bg-black/40 p-3">
            <div className="mb-2 text-xs text-[#A8A8AF]">
              Recommended fix
            </div>
            <p className="text-sm leading-6 text-[#D8D8D8]">
              {visibleRecommendation}
            </p>
          </div>

          {finding ? (
            <div className="border border-white/10 bg-black/40 p-3">
              <div className="mb-2 text-xs text-[#A8A8AF]">
                Page evidence
              </div>
              <p className="text-sm leading-6 text-[#D8D8D8]">
                {finding.evidence}
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
