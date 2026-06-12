"use client";

import Image from "next/image";
import type { PageEvidence, PersonaFinding } from "@/lib/page-analysis";
import {
  PERSONA_AGENTS,
  type AgentRuntime,
  type SimulationPhase,
} from "@/lib/simulation";

function ChromeBar({ url }: { url: string }) {
  const display = url.replace(/^https?:\/\//, "").slice(0, 58);
  return (
    <div className="flex items-center gap-2 border-b border-white/10 bg-[#111113] px-2 py-1.5">
      <div className="flex gap-1" aria-hidden>
        <span className="h-2 w-2 border border-white/10 bg-[#2A2A2D]" />
        <span className="h-2 w-2 border border-white/10 bg-[#2A2A2D]" />
        <span className="h-2 w-2 border border-white/10 bg-[#2A2A2D]" />
      </div>
      <div className="glass-pill min-w-0 flex-1 truncate px-2 py-0.5 font-mono text-[9px] text-[#B8B8BE]">
        {display}
      </div>
    </div>
  );
}

function AgentCursors({
  progress,
  running,
}: {
  progress: number;
  running: boolean;
}) {
  const cursorVariants = [
    "agent-cursor-founder",
    "agent-cursor-budget",
    "agent-cursor-ops",
    "agent-cursor-merchant",
    "agent-cursor-access",
    "agent-cursor-security",
    "agent-cursor-research",
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {PERSONA_AGENTS.map((persona, index) => {
        const left = 10 + ((progress * (index + 2) + index * 13) % 76);
        const top = 14 + ((progress * (index + 3) + index * 9) % 64);

        return (
          <div
            key={persona.id}
            data-agent-cursor={persona.id}
            className={`agent-cursor ${cursorVariants[index]} ${
              running ? "agent-cursor-live" : ""
            }`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${index * 130}ms`,
            }}
          >
            <span className="agent-cursor-label">{persona.name.split(" ")[0]}</span>
          </div>
        );
      })}
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
  const visibleSignal = finding?.signal ?? agent.signal;
  const visibleQuote = finding?.quote ?? agent.quote;
  const visibleRecommendation = finding?.recommendation ?? agent.recommendation;
  const visibleConfidence = finding?.confidence ?? agent.confidence;
  const visibleSurface =
    evidence?.title || evidence?.description || agent.browserScene;
  const crawledPages = evidence?.visitedPages ?? [];
  const routeLabels = [
    {
      label: evidence?.title || "Home",
      detail: evidence?.finalUrl || targetUrl,
    },
    ...crawledPages.map((page) => ({
      label: page.title || page.headings[0] || new URL(page.url).pathname || "Page",
      detail: page.url,
    })),
  ].slice(0, 4);
  const visibleRoutes =
    routeLabels.length > 1
      ? routeLabels
      : [
          ...routeLabels,
          { label: "Pricing", detail: `${targetUrl.replace(/\/$/, "")}/pricing` },
          { label: "Docs", detail: `${targetUrl.replace(/\/$/, "")}/docs` },
          { label: "Settings", detail: `${targetUrl.replace(/\/$/, "")}/settings` },
        ].slice(0, 4);
  const activeRouteIndex = Math.floor(agent.progress / 22) % visibleRoutes.length;

  return (
    <div
      className={`ide-panel flex h-full min-h-[560px] flex-col overflow-hidden rounded-[16px] ${
        frozen ? "opacity-80" : ""
      }`}
    >
      <ChromeBar url={targetUrl} />
      <div className="min-h-0 flex-1">
        <div className="relative h-full min-h-[540px] overflow-hidden bg-[#08090D] p-3">
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
                className={`h-1.5 w-1.5 rounded-full bg-[#79F2A6] ${
                  running ? "live-signal" : ""
                }`}
                aria-hidden
              />
              live multi-agent inspection
            </span>
            <span className={running ? "live-flicker text-white" : "text-white"}>
              {agent.productStage}
            </span>
          </div>

          <div className="grid h-[calc(100%-2.25rem)] min-h-[490px] grid-rows-[minmax(0,1fr)_auto_auto] gap-3">
            <div className="relative min-h-0 overflow-hidden rounded-[14px] border border-white/10 bg-[#101116] shadow-2xl shadow-black/35">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#15161B] px-3 py-2">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#79F2A6]">
                    viewport.preview
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[#A8A8AF]">
                    {analyzing ? "Capturing DOM and screenshot" : evidence ? "Page captured" : "Demo trace"}
                  </div>
                </div>
                <div className="flex max-w-[55%] gap-1.5 overflow-hidden font-mono text-[10px] text-[#8E8E98]">
                  {visibleRoutes.map((route, index) => (
                    <span
                      key={`${route.detail}-${index}`}
                      title={route.detail}
                      className={`rounded-full border px-2 py-1 ${
                        index === activeRouteIndex
                          ? "border-[#79F2A6]/45 bg-[#79F2A6]/12 text-[#C8FFD8]"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      {route.label.slice(0, 18)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative h-[calc(100%-49px)] min-h-[330px] bg-black">
                {evidence?.screenshot ? (
                  <Image
                    src={evidence.screenshot}
                    alt={`Screenshot captured from ${evidence.finalUrl}`}
                    width={1365}
                    height={900}
                    unoptimized
                    className="h-full w-full object-contain object-top opacity-90"
                  />
                ) : (
                  <div className="grid h-full place-items-center p-6 text-center text-sm leading-6 text-white">
                    {visibleSurface}
                  </div>
                )}
                <AgentCursors progress={agent.progress} running={running} />
                <div
                  className={`pointer-events-none absolute h-24 w-28 border border-[#79F2A6]/80 bg-[#79F2A6]/8 ${
                    running ? "live-drift" : ""
                  }`}
                  style={{ left: `${hotspotLeft}%`, top: `${hotspotTop}%` }}
                  aria-hidden
                >
                  <span className="absolute -left-1 -top-1 h-2 w-2 bg-[#79F2A6]" />
                  <span className="absolute -right-1 -top-1 h-2 w-2 bg-[#79F2A6]" />
                  <span className="absolute -bottom-1 -left-1 h-2 w-2 bg-[#79F2A6]" />
                  <span className="absolute -bottom-1 -right-1 h-2 w-2 bg-[#79F2A6]" />
                </div>
                <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/75 px-3 py-2 backdrop-blur">
                  <div className="truncate text-xs text-white">{visibleSurface}</div>
                  <div className="mt-1 font-mono text-[10px] text-[#8E8E98]">
                    7 independent cursors testing {visibleRoutes.length} routes,
                    layout, copy, trust, forms, and CTA paths
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-4">
              {visibleRoutes.map((route, index) => (
                <div
                  key={`${route.detail}-trace`}
                  className={`rounded-xl border px-3 py-2 ${
                    index === activeRouteIndex
                      ? "border-[#79F2A6]/40 bg-[#79F2A6]/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                    route {index + 1}
                  </div>
                  <div className="mt-1 truncate text-sm text-white">
                    {route.label}
                  </div>
                  <div className="mt-1 truncate font-mono text-[10px] text-[#8E8E98]">
                    {route.detail}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1.6fr)_120px_120px]">
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  current friction
                </div>
                <div className="max-h-16 overflow-hidden text-sm leading-5 text-white">
                  {visibleSignal}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  evidence
                </div>
                <div className="font-mono text-2xl text-white">
                  {evidence
                    ? evidence.headings.length + evidence.buttons.length
                    : Math.max(1, Math.round(agent.progress / 13))}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  confidence
                </div>
                <div className="font-mono text-2xl text-white">
                  {visibleConfidence}%
                </div>
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  active persona
                </div>
                <div className="mt-2 flex items-center gap-2 text-base font-semibold text-white">
                  <span
                    className={`h-2 w-2 rounded-full bg-[#79F2A6] ${
                      running ? "live-signal" : ""
                    }`}
                    aria-hidden
                  />
                  {agent.name}
                </div>
                <div className="mt-1 text-xs text-[#A8A8AF]">{agent.title}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  think-aloud
                </div>
                <blockquote className="mt-2 max-h-16 overflow-hidden text-sm leading-5 text-[#D8D8DE]">
                  &quot;{visibleQuote}&quot;
                </blockquote>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  recommended fix
                </div>
                <p className="mt-2 max-h-16 overflow-hidden text-sm leading-5 text-[#D8D8DE]">
                  {visibleRecommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
