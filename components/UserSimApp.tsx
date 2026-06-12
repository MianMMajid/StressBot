"use client";

import { useState } from "react";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import { AgentViewfinder } from "@/components/AgentViewfinder";
import { TelemetryTerminal } from "@/components/TelemetryTerminal";
import { BugReportDrawer } from "@/components/BugReportDrawer";
import {
  EXAMPLE_FINDINGS,
  PERSONA_AGENTS,
  buildBugReportMarkdown,
} from "@/lib/simulation";

const severityTone = {
  critical: "border-red-400 text-red-300",
  high: "border-orange-300 text-orange-200",
  medium: "border-yellow-200 text-yellow-100",
  low: "border-[#444444] text-[#C8C8C8]",
};

const suggestedPrompts = [
  "Find why first-time users do not understand our homepage.",
  "Review pricing and tell me what blocks a budget owner.",
  "Test this like an enterprise security buyer before signup.",
];

export function UserSimApp() {
  const [chatPrompt, setChatPrompt] = useState(
    "Run seven AI personas on my product and show the top UX, trust, pricing, accessibility, and onboarding issues."
  );
  const {
    phase,
    targetUrl,
    setTargetUrl,
    logLines,
    progress,
    completedAgents,
    drawerOpen,
    setDrawerOpen,
    reportRevealKey,
    selectedAgent,
    selectedAgentId,
    setSelectedAgentId,
    agentRuns,
    run,
    pause,
    stop,
  } = useSimulationEngine();

  const reportMd = buildBugReportMarkdown({
    targetUrl,
    outcome: phase === "COMPLETED" ? "COMPLETED" : "STOPPED",
    progress,
  });

  const runEnabled =
    phase === "IDLE" ||
    phase === "PAUSED" ||
    phase === "COMPLETED" ||
    phase === "STOPPED";
  const pauseEnabled = phase === "RUNNING";
  const stopEnabled = phase === "RUNNING" || phase === "PAUSED";
  const activeAgents = agentRuns.filter(
    (agent) => agent.status === "scanning" || agent.status === "reasoning"
  ).length;
  const evidenceCount = agentRuns.reduce(
    (total, agent) => total + Math.max(0, Math.round(agent.progress / 18)),
    0
  );

  const submitChatRun = () => {
    const possibleUrl = chatPrompt.match(/https?:\/\/[^\s]+/)?.[0];
    if (possibleUrl && phase !== "RUNNING") {
      setTargetUrl(possibleUrl);
    }
    if (runEnabled) {
      run();
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-hidden bg-[#000000] text-white">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#222222] bg-[#0A0A0A] px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex min-w-[150px] flex-col">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A0A0A0]">
            UserSim
          </span>
          <span className="text-sm font-semibold text-white">
            AI persona panel
          </span>
        </div>

        <div className="flex min-w-[220px] flex-1 items-center gap-2">
          <label className="sr-only" htmlFor="target-url">
            Target URL
          </label>
          <span className="hidden shrink-0 font-mono text-[10px] text-[#A0A0A0] md:inline">
            TARGET
          </span>
          <input
            id="target-url"
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={phase === "RUNNING"}
            spellCheck={false}
            className="min-w-0 flex-1 border border-[#333333] bg-black px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-[#777777] focus:border-white disabled:opacity-50"
            placeholder="https://your-product.com"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submitChatRun}
            disabled={!runEnabled}
            className="border border-white bg-white px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-black transition-colors hover:bg-[#EAEAEA] disabled:cursor-not-allowed disabled:opacity-30"
          >
            Run
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={!pauseEnabled}
            className="border border-[#333333] bg-[#0A0A0A] px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={stop}
            disabled={!stopEnabled}
            className="border border-[#333333] bg-black px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-[#A0A0A0] transition-colors hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Stop
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] text-[#A0A0A0]">
          <span className="hidden items-center gap-2 lg:flex">
            <span
              className={`h-1.5 w-1.5 bg-white ${
                phase === "RUNNING" ? "live-signal" : ""
              }`}
              aria-hidden
            />
            PARALLEL RUN
          </span>
          <span className="border border-[#333333] px-2 py-1 text-white">
            {phase}
          </span>
          <span>
            {completedAgents}/{PERSONA_AGENTS.length} agents
          </span>
        </div>
      </header>

      <section className="shrink-0 border-b border-[#222222] bg-black px-3 py-3 sm:px-4">
        <form
          className="mx-auto grid max-w-6xl gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitChatRun();
          }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 hidden h-7 w-7 shrink-0 border border-white bg-white text-center font-mono text-[10px] font-bold leading-7 text-black sm:block">
              AI
            </div>
            <div className="min-w-0 flex-1 border border-[#333333] bg-[#0A0A0A]">
              <div className="border-b border-[#222222] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-[#A0A0A0]">
                Ask the persona panel what to test
              </div>
              <textarea
                value={chatPrompt}
                onChange={(event) => setChatPrompt(event.target.value)}
                disabled={phase === "RUNNING"}
                rows={2}
                className="block max-h-28 min-h-16 w-full resize-none bg-black px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-[#777777] disabled:opacity-60"
                placeholder="Example: Test https://myapp.com like a skeptical buyer and accessibility reviewer."
              />
              <div className="flex flex-col gap-2 border-t border-[#222222] px-3 py-2 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 md:pb-0">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setChatPrompt(prompt)}
                      disabled={phase === "RUNNING"}
                      className="shrink-0 border border-[#333333] bg-[#050505] px-2.5 py-1.5 text-left text-xs text-[#C8C8C8] hover:border-white hover:text-white disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={!runEnabled}
                  className="shrink-0 border border-white bg-white px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-black disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Run Persona Panel
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      <main className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <aside className="flex min-h-[240px] flex-col border-b border-[#222222] bg-[#050505] lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="border-b border-[#222222] px-3 py-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A0A0A0]">
              7 simultaneous agents
            </h2>
          </div>
          <div className="grid grid-cols-3 border-b border-[#222222] bg-black">
            <div className="border-r border-[#222222] px-3 py-2">
              <div className="font-mono text-[9px] uppercase tracking-widest text-[#A0A0A0]">
                Active
              </div>
              <div className="font-mono text-lg text-white">{activeAgents}</div>
            </div>
            <div className="border-r border-[#222222] px-3 py-2">
              <div className="font-mono text-[9px] uppercase tracking-widest text-[#A0A0A0]">
                Evidence
              </div>
              <div className="font-mono text-lg text-white">{evidenceCount}</div>
            </div>
            <div className="px-3 py-2">
              <div className="font-mono text-[9px] uppercase tracking-widest text-[#A0A0A0]">
                Findings
              </div>
              <div className="font-mono text-lg text-white">
                {EXAMPLE_FINDINGS.length}
              </div>
            </div>
          </div>
          <div className="grid max-h-[330px] gap-2 overflow-y-auto p-3 lg:max-h-none">
            {agentRuns.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgentId(agent.id)}
                className={`relative overflow-hidden border p-3 text-left transition-colors ${
                  selectedAgentId === agent.id
                    ? "border-white bg-white text-black"
                    : "border-[#222222] bg-black text-white hover:border-[#666666]"
                }`}
              >
                {agent.status !== "queued" && agent.status !== "complete" ? (
                  <span
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white live-flicker"
                    aria-hidden
                  />
                ) : null}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span
                        className={`h-1.5 w-1.5 ${
                          selectedAgentId === agent.id ? "bg-black" : "bg-white"
                        } ${
                          agent.status === "scanning" ||
                          agent.status === "reasoning"
                            ? "live-signal"
                            : ""
                        }`}
                        aria-hidden
                      />
                      {agent.name}
                    </div>
                    <div
                      className={`font-mono text-[9px] uppercase tracking-widest ${
                        selectedAgentId === agent.id
                          ? "text-black/70"
                          : "text-[#A0A0A0]"
                      }`}
                    >
                      {agent.title}
                    </div>
                  </div>
                  <span
                    className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase ${
                      selectedAgentId === agent.id
                        ? "border-black text-black"
                        : severityTone[agent.severity]
                    }`}
                  >
                    {agent.severity}
                  </span>
                </div>
                <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest">
                  <span>{agent.status}</span>
                  <span>{agent.progress}%</span>
                </div>
                <div
                  className={`mb-2 grid grid-cols-7 gap-1 ${
                    selectedAgentId === agent.id ? "opacity-70" : "opacity-100"
                  }`}
                  aria-hidden
                >
                  {Array.from({ length: 7 }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-1 ${
                        agent.progress / 100 > index / 7
                          ? selectedAgentId === agent.id
                            ? "bg-black"
                            : "bg-white"
                          : selectedAgentId === agent.id
                            ? "bg-black/20"
                            : "bg-[#222222]"
                      }`}
                    />
                  ))}
                </div>
                <div
                  className={`h-1.5 border ${
                    selectedAgentId === agent.id
                      ? "border-black bg-black/10"
                      : "border-[#222222] bg-[#090909]"
                  }`}
                >
                  <div
                    className={
                      selectedAgentId === agent.id ? "h-full bg-black" : "h-full bg-white"
                    }
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[520px] flex-col border-b border-[#222222] lg:min-h-0 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3 border-b border-[#222222] bg-[#0A0A0A] px-3 py-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A0A0A0]">
              Agent viewfinder
            </h2>
            <div className="flex items-center gap-3 font-mono text-[10px] text-[#A0A0A0]">
              <span>{progress}% panel progress</span>
              <span className="hidden border border-[#333333] px-2 py-0.5 text-white sm:inline">
                {activeAgents} live
              </span>
            </div>
          </div>
          <div className="min-h-0 flex-1 p-3">
            <AgentViewfinder
              agent={selectedAgent}
              phase={phase}
              targetUrl={targetUrl}
            />
          </div>
        </section>

        <aside className="flex min-h-[420px] flex-col bg-[#050505] lg:col-span-2 xl:col-span-1 xl:min-h-0">
          <div className="border-b border-[#222222] bg-[#0A0A0A] px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A0A0A0]">
                Six demo findings
              </h2>
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#A0A0A0]">
                <span
                  className={`h-1.5 w-1.5 bg-white ${
                    phase === "RUNNING" ? "live-signal" : ""
                  }`}
                  aria-hidden
                />
                synthesizing
              </span>
            </div>
          </div>
          <div className="grid max-h-[360px] gap-2 overflow-y-auto p-3 sm:grid-cols-2 xl:max-h-none xl:grid-cols-1">
            {EXAMPLE_FINDINGS.map((finding, index) => {
              const agent = agentRuns.find((a) => a.id === finding.agentId);
              if (!agent) return null;
              const findingUnlocked = agent.progress > 42;
              return (
                <button
                  key={finding.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`relative overflow-hidden border p-3 text-left ${
                    selectedAgentId === agent.id
                      ? "border-white bg-[#101010]"
                      : "border-[#222222] bg-black hover:border-[#666666]"
                  }`}
                >
                  {findingUnlocked ? (
                    <span
                      className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white live-flicker"
                      aria-hidden
                    />
                  ) : null}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#A0A0A0]">
                      Example {index + 1}
                    </span>
                    <span
                      className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase ${severityTone[agent.severity]}`}
                    >
                      {agent.shorthand}
                    </span>
                  </div>
                  <div
                    className={`mb-2 text-sm font-semibold ${
                      findingUnlocked ? "text-white" : "text-[#777777]"
                    }`}
                  >
                    {finding.title}
                  </div>
                  <p className="text-xs leading-5 text-[#C8C8C8]">
                    {findingUnlocked
                      ? finding.fix
                      : "Agent is still gathering evidence from the product surface."}
                  </p>
                  <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-[#A0A0A0]">
                    <span>{findingUnlocked ? "finding ready" : "collecting"}</span>
                    <span>{Math.min(100, Math.max(0, agent.progress))}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#222222]">
            <div className="flex items-center justify-between border-b border-[#222222] bg-[#0A0A0A] px-3 py-2">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A0A0A0]">
                Telemetry
              </h2>
              <span className="font-mono text-[10px] text-[#A0A0A0]">
                7x stream
              </span>
            </div>
            <div className="h-52">
              <TelemetryTerminal lines={logLines} phase={phase} />
            </div>
          </div>
        </aside>
      </main>

      <BugReportDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        markdown={reportMd}
        revealKey={reportRevealKey}
      />
    </div>
  );
}
