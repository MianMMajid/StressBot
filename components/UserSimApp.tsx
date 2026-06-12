"use client";

import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import { AgentViewfinder } from "@/components/AgentViewfinder";
import { TelemetryTerminal } from "@/components/TelemetryTerminal";
import { BugReportDrawer } from "@/components/BugReportDrawer";
import { SIMULATION_STEPS, buildBugReportMarkdown } from "@/lib/simulation";

export function UserSimApp() {
  const {
    phase,
    targetUrl,
    setTargetUrl,
    logLines,
    progress,
    drawerOpen,
    setDrawerOpen,
    reportRevealKey,
    viewStepIndex,
    stepsExecuted,
    run,
    pause,
    stop,
  } = useSimulationEngine();

  const reportMd = buildBugReportMarkdown({
    targetUrl,
    outcome: phase === "COMPLETED" ? "COMPLETED" : "STOPPED",
    stepsExecuted,
  });

  const runEnabled =
    phase === "IDLE" ||
    phase === "PAUSED" ||
    phase === "COMPLETED" ||
    phase === "STOPPED";
  const pauseEnabled = phase === "RUNNING";
  const stopEnabled = phase === "RUNNING" || phase === "PAUSED";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#000000] text-white">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[#222222] bg-[#0A0A0A] px-4 py-3">
        <div className="flex min-w-[140px] items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888]">
            UserSim
          </span>
          <span className="hidden h-3 w-px bg-[#222222] sm:inline" />
          <span className="hidden font-mono text-[10px] text-[#888888] sm:inline">
            v0.9.0-probe
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <label className="sr-only" htmlFor="target-url">
            Target URL
          </label>
          <span className="hidden shrink-0 font-mono text-[10px] text-[#888888] md:inline">
            TARGET
          </span>
          <input
            id="target-url"
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={phase === "RUNNING"}
            spellCheck={false}
            className="min-w-0 flex-1 border border-[#222222] bg-black px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-[#888888] focus:border-white disabled:opacity-50"
            placeholder="https://localhost:3000"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={run}
            disabled={!runEnabled}
            className="border border-[#222222] bg-white px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-black transition-colors hover:bg-[#EAEAEA] disabled:cursor-not-allowed disabled:opacity-30"
          >
            Run
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={!pauseEnabled}
            className="border border-[#222222] bg-[#0A0A0A] px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={stop}
            disabled={!stopEnabled}
            className="border border-[#222222] bg-black px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-[#888888] transition-colors hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Stop
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3 font-mono text-[10px] text-[#888888]">
          <span className="hidden lg:inline">MATRIX</span>
          <span className="rounded-none border border-[#222222] px-2 py-1 text-white">
            {phase}
          </span>
          <span>
            {progress}/{SIMULATION_STEPS.length}
          </span>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex min-h-[280px] flex-1 flex-col border-b border-[#222222] lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-[#222222] bg-[#0A0A0A] px-3 py-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#888888]">
              Agent viewfinder
            </h2>
            <span className="flex items-center gap-2 font-mono text-[10px] text-[#888888]">
              <span
                className={`h-1.5 w-1.5 border border-[#222222] ${
                  phase === "RUNNING" ? "bg-white" : "bg-[#222222]"
                }`}
                aria-hidden
              />
              LIVE / {SIMULATION_STEPS[viewStepIndex]?.type ?? "—"}
            </span>
          </div>
          <div className="min-h-0 flex-1 p-3">
            <AgentViewfinder
              stepIndex={viewStepIndex}
              phase={phase}
              targetUrl={targetUrl}
            />
          </div>
        </section>

        <section className="flex min-h-[240px] flex-1 flex-col lg:min-h-0">
          <div className="flex items-center justify-between border-b border-[#222222] bg-[#0A0A0A] px-3 py-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#888888]">
              Telemetry terminal
            </h2>
            <span className="font-mono text-[10px] text-[#888888]">
              UTF-8 · NDJSON stream
            </span>
          </div>
          <TelemetryTerminal lines={logLines} phase={phase} />
        </section>
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
