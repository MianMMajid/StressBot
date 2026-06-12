"use client";

import { useMemo, useState } from "react";
import type { PersonaFinding } from "@/lib/page-analysis";
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
  critical: "border-red-400/60 bg-red-950/30 text-red-200",
  high: "border-orange-300/50 bg-orange-950/20 text-orange-100",
  medium: "border-yellow-200/40 bg-yellow-950/20 text-yellow-100",
  low: "border-white/10 bg-white/[0.04] text-[#D8D8D8]",
};

const suggestedPrompts = [
  "Test example.com like a skeptical first-time visitor.",
  "Review localhost:3000 for pricing, trust, and accessibility issues.",
  "Analyze https://example.com like an enterprise security buyer.",
];

const runSteps = [
  "Opening page",
  "Capturing DOM",
  "Reading copy",
  "Running personas",
  "Synthesizing findings",
];

function extractUrlFromPrompt(prompt: string) {
  const tokens = prompt.match(
    /\b(?:https?:\/\/)?(?:localhost(?::\d+)?|(?:[\w-]+\.)+[a-z]{2,})(?:\/[^\s]*)?/i
  );
  if (!tokens?.[0]) return null;
  return tokens[0].replace(/[),.;!?]+$/, "");
}

function buildLiveReportMarkdown({
  targetUrl,
  outcome,
  analysis,
}: {
  targetUrl: string;
  outcome: "COMPLETED" | "STOPPED";
  analysis: NonNullable<ReturnType<typeof useSimulationEngine>["analysis"]>;
}) {
  return `# UserSim Live Page Report

**Requested URL:** \`${targetUrl}\`  
**Captured URL:** \`${analysis.evidence.finalUrl}\`  
**Outcome:** ${outcome}  
**Page title:** ${analysis.evidence.title || "Untitled page"}

---

## Captured Surface

- **Headings:** ${analysis.evidence.headings.slice(0, 8).join(" | ") || "none captured"}
- **Buttons:** ${analysis.evidence.buttons.slice(0, 8).join(" | ") || "none captured"}
- **Forms:** ${analysis.evidence.forms.slice(0, 8).join(" | ") || "none captured"}
- **Console errors:** ${analysis.evidence.consoleErrors.length}
- **Network errors:** ${analysis.evidence.networkErrors.length}

---

## Persona Findings

${analysis.findings
  .map((finding, index) => {
    const agent = PERSONA_AGENTS.find((item) => item.id === finding.agentId);
    return `### ${index + 1}. ${agent?.name ?? finding.agentId} - ${
      agent?.title ?? "Persona agent"
    }

**Signal:** ${finding.signal}  
**Evidence:** ${finding.evidence}  
**Quote:** "${finding.quote}"  
**Recommendation:** ${finding.recommendation}  
**Severity:** ${finding.severity.toUpperCase()} | **Confidence:** ${
      finding.confidence
    }%
`;
  })
  .join("\n")}

---

*Generated locally from a Playwright page inspection.*
`;
}

export function UserSimApp() {
  const [chatPrompt, setChatPrompt] = useState(
    "Run seven AI personas on my product and show the top UX, trust, pricing, accessibility, and onboarding issues."
  );
  const [traceOpen, setTraceOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
    analysis,
    analysisError,
    analyzingUrl,
    selectedAgent,
    selectedAgentId,
    setSelectedAgentId,
    agentRuns,
    run,
    pause,
    stop,
  } = useSimulationEngine();

  const reportOutcome = phase === "COMPLETED" ? "COMPLETED" : "STOPPED";
  const reportMd = analysis
    ? buildLiveReportMarkdown({
        targetUrl,
        outcome: reportOutcome,
        analysis,
      })
    : buildBugReportMarkdown({
        targetUrl,
        outcome: reportOutcome,
        progress,
      });

  const detectedUrl = extractUrlFromPrompt(chatPrompt) ?? targetUrl;
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
  const analysisFindingByAgent = useMemo(
    () => new Map(analysis?.findings.map((finding) => [finding.agentId, finding]) ?? []),
    [analysis]
  );
  const selectedFinding = analysisFindingByAgent.get(selectedAgentId);
  const runStepIndex =
    phase === "COMPLETED"
      ? runSteps.length - 1
      : analyzingUrl
        ? Math.min(1, Math.floor(progress / 25))
        : Math.min(runSteps.length - 1, Math.floor(progress / 24));

  const findingCards = EXAMPLE_FINDINGS.map((finding, index) => {
    const agent = agentRuns.find((item) => item.id === finding.agentId);
    if (!agent) return null;
    const liveFinding = analysisFindingByAgent.get(finding.agentId) as
      | PersonaFinding
      | undefined;

    return {
      id: finding.id,
      index,
      agent,
      title: liveFinding?.signal ?? finding.title,
      evidence: liveFinding?.evidence ?? finding.evidence,
      recommendation: liveFinding?.recommendation ?? finding.fix,
      severity: liveFinding?.severity ?? agent.severity,
      confidence: liveFinding?.confidence ?? agent.confidence,
      isLive: Boolean(liveFinding),
      unlocked: agent.progress > 42 || Boolean(liveFinding),
    };
  }).filter(Boolean);

  const submitChatRun = () => {
    const possibleUrl = extractUrlFromPrompt(chatPrompt);
    if (possibleUrl && phase !== "RUNNING") {
      setTargetUrl(possibleUrl);
    }
    if (runEnabled) {
      setCopied(false);
      run(possibleUrl ?? targetUrl);
    }
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(reportMd);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-[#050506] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B0B0C]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase text-[#9B9BA1]">
              UserSim
            </div>
            <div className="text-base font-semibold">AI product feedback</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#B8B8BE]">
            <span className="hidden sm:inline">
              Runs locally with Playwright. Captures page text, structure, and screenshot.
            </span>
            <span className="border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] text-white">
              {phase}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-4 lg:gap-5">
        <section className="border border-white/10 bg-[#111113] shadow-2xl shadow-black/30">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitChatRun();
            }}
          >
            <div className="border-b border-white/10 px-4 py-3">
              <div className="text-sm font-medium">What should the agents review?</div>
              <div className="mt-1 text-xs text-[#A8A8AF]">
                Paste any public URL or localhost link, then ask for the kind of feedback you want.
              </div>
            </div>
            <textarea
              value={chatPrompt}
              onChange={(event) => setChatPrompt(event.target.value)}
              disabled={phase === "RUNNING"}
              rows={3}
              className="block max-h-40 min-h-24 w-full resize-none bg-[#0B0B0C] px-4 py-4 text-[15px] leading-7 text-white outline-none placeholder:text-[#77777F] disabled:opacity-60"
              placeholder="Example: Test example.com like a skeptical buyer and accessibility reviewer."
            />
            <div className="grid gap-3 border-t border-white/10 px-4 py-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="border border-white/10 bg-black px-2.5 py-1.5 text-xs text-[#D8D8DC]">
                    Target: {detectedUrl}
                  </span>
                  <span className="border border-white/10 bg-black px-2.5 py-1.5 text-xs text-[#A8A8AF]">
                    {analysis
                      ? `Captured: ${analysis.evidence.title || analysis.evidence.finalUrl}`
                      : analyzingUrl
                        ? "Opening page locally..."
                        : analysisError
                          ? `Inspection issue: ${analysisError}`
                          : "Ready for local inspection"}
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setChatPrompt(prompt)}
                      disabled={phase === "RUNNING"}
                      className="shrink-0 border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-[#C8C8CE] hover:border-white/40 hover:text-white disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={!runEnabled}
                  className="border border-white bg-white px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Run Persona Panel
                </button>
                <button
                  type="button"
                  onClick={pause}
                  disabled={!pauseEnabled}
                  className="border border-white/10 bg-[#171719] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={stop}
                  disabled={!stopEnabled}
                  className="border border-white/10 bg-black px-3 py-2 text-sm text-[#B8B8BE] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Stop
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="border border-white/10 bg-[#101012] px-4 py-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Run status</div>
              <div className="mt-1 text-xs text-[#A8A8AF]">
                {completedAgents}/{PERSONA_AGENTS.length} agents complete · {activeAgents} active
              </div>
            </div>
            <div className="font-mono text-xs text-[#D8D8DC]">{progress}%</div>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {runSteps.map((step, index) => {
              const active = index <= runStepIndex && phase !== "IDLE";
              return (
                <div key={step} className="min-w-0">
                  <div
                    className={`mb-2 h-1.5 ${
                      active ? "bg-white" : "bg-white/10"
                    }`}
                  />
                  <div
                    className={`truncate text-xs ${
                      active ? "text-white" : "text-[#77777F]"
                    }`}
                  >
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                Top findings
              </h1>
              <p className="mt-1 text-sm text-[#A8A8AF]">
                Page-specific feedback appears here as soon as the local browser captures evidence.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyReport}
                disabled={!analysis && phase === "IDLE"}
                className="border border-white/10 bg-[#151517] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                {copied ? "Copied" : "Copy report"}
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="border border-white/10 bg-[#151517] px-3 py-2 text-sm text-white"
              >
                Open report
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {findingCards.map((card) => {
              if (!card) return null;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedAgentId(card.agent.id)}
                  className={`border p-4 text-left transition-colors ${
                    selectedAgentId === card.agent.id
                      ? "border-white bg-[#18181B]"
                      : "border-white/10 bg-[#101012] hover:border-white/30"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {card.agent.name}
                      </div>
                      <div className="mt-0.5 text-xs text-[#A8A8AF]">
                        {card.agent.title}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 border px-2 py-1 text-[10px] uppercase ${severityTone[card.severity]}`}
                    >
                      {card.severity}
                    </span>
                  </div>
                  <div
                    className={`text-sm font-medium leading-6 ${
                      card.unlocked ? "text-white" : "text-[#77777F]"
                    }`}
                  >
                    {card.unlocked
                      ? card.title
                      : "Agent is collecting evidence from the page."}
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#B8B8BE]">
                    {card.unlocked ? card.recommendation : card.evidence}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-[#8F8F98]">
                    <span>{card.isLive ? "Real page finding" : "Demo fallback"}</span>
                    <span>{card.confidence}% confidence</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-h-[520px]">
            <AgentViewfinder
              agent={selectedAgent}
              finding={selectedFinding}
              evidence={analysis?.evidence ?? null}
              analyzing={analyzingUrl}
              phase={phase}
              targetUrl={targetUrl}
            />
          </div>

          <aside className="border border-white/10 bg-[#101012]">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="text-sm font-medium">Persona panel</div>
              <div className="mt-1 text-xs text-[#A8A8AF]">
                Select an agent to inspect its evidence and recommendation.
              </div>
            </div>
            <div className="grid max-h-[520px] gap-2 overflow-y-auto p-3 sm:grid-cols-2 xl:grid-cols-1">
              {agentRuns.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`border p-3 text-left ${
                    selectedAgentId === agent.id
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-black/40 text-white hover:border-white/30"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{agent.name}</div>
                      <div
                        className={`text-xs ${
                          selectedAgentId === agent.id
                            ? "text-black/70"
                            : "text-[#A8A8AF]"
                        }`}
                      >
                        {agent.title}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] uppercase">
                      {agent.status}
                    </span>
                  </div>
                  <div
                    className={`h-1.5 ${
                      selectedAgentId === agent.id ? "bg-black/10" : "bg-white/10"
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
        </section>

        <section className="border border-white/10 bg-[#101012]">
          <button
            type="button"
            onClick={() => setTraceOpen((open) => !open)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-medium">Technical trace</span>
              <span className="mt-1 block text-xs text-[#A8A8AF]">
                Browser events and synthetic agent telemetry.
              </span>
            </span>
            <span className="font-mono text-xs text-[#A8A8AF]">
              {traceOpen ? "Hide" : "Show"}
            </span>
          </button>
          {traceOpen ? (
            <div className="h-72 border-t border-white/10">
              <TelemetryTerminal lines={logLines} phase={phase} />
            </div>
          ) : null}
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
