"use client";

import { useEffect, useMemo, useState } from "react";
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

type Screen = "chat" | "process" | "report";

const suggestedPrompts = [
  "Test example.com like a skeptical first-time visitor.",
  "Review localhost:3000 for pricing, trust, and accessibility issues.",
  "Analyze https://example.com like an enterprise security buyer.",
];

const runSteps = [
  "Opening page",
  "Capturing structure",
  "Reading copy",
  "Running personas",
  "Building report",
];

const severityTone = {
  critical: "border-red-400/50 bg-red-950/25 text-red-100",
  high: "border-orange-300/40 bg-orange-950/20 text-orange-100",
  medium: "border-yellow-200/35 bg-yellow-950/15 text-yellow-100",
  low: "border-white/10 bg-white/[0.04] text-[#D8D8D8]",
};

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
  const [screen, setScreen] = useState<Screen>("chat");
  const [chatPrompt, setChatPrompt] = useState(
    "Test example.com like a skeptical buyer. Show UX, pricing, trust, and accessibility feedback."
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
    ? buildLiveReportMarkdown({ targetUrl, outcome: reportOutcome, analysis })
    : buildBugReportMarkdown({ targetUrl, outcome: reportOutcome, progress });

  const detectedUrl = extractUrlFromPrompt(chatPrompt) ?? targetUrl;
  const runEnabled =
    phase === "IDLE" ||
    phase === "PAUSED" ||
    phase === "COMPLETED" ||
    phase === "STOPPED";
  const activeAgents = agentRuns.filter(
    (agent) => agent.status === "scanning" || agent.status === "reasoning"
  ).length;
  const runStepIndex =
    phase === "COMPLETED"
      ? runSteps.length - 1
      : analyzingUrl
        ? Math.min(1, Math.floor(progress / 25))
        : Math.min(runSteps.length - 1, Math.floor(progress / 24));

  const analysisFindingByAgent = useMemo(
    () => new Map(analysis?.findings.map((finding) => [finding.agentId, finding]) ?? []),
    [analysis]
  );
  const selectedFinding = analysisFindingByAgent.get(selectedAgentId);

  const findingCards = EXAMPLE_FINDINGS.map((fallback) => {
    const agent = agentRuns.find((item) => item.id === fallback.agentId);
    if (!agent) return null;
    const liveFinding = analysisFindingByAgent.get(fallback.agentId) as
      | PersonaFinding
      | undefined;

    return {
      id: fallback.id,
      agent,
      title: liveFinding?.signal ?? fallback.title,
      evidence: liveFinding?.evidence ?? fallback.evidence,
      recommendation: liveFinding?.recommendation ?? fallback.fix,
      severity: liveFinding?.severity ?? agent.severity,
      confidence: liveFinding?.confidence ?? agent.confidence,
      isLive: Boolean(liveFinding),
    };
  }).filter(Boolean);

  useEffect(() => {
    if (screen !== "process") return;
    if ((phase === "COMPLETED" || phase === "STOPPED") && !analyzingUrl) {
      queueMicrotask(() => setScreen("report"));
    }
  }, [analyzingUrl, phase, screen]);

  const submitChatRun = () => {
    const possibleUrl = extractUrlFromPrompt(chatPrompt);
    if (possibleUrl) {
      setTargetUrl(possibleUrl);
    }
    if (runEnabled) {
      setCopied(false);
      setTraceOpen(false);
      setScreen("process");
      run(possibleUrl ?? targetUrl);
    }
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(reportMd);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const resetFlow = () => {
    stop();
    setScreen("chat");
    setCopied(false);
    setTraceOpen(false);
  };

  if (screen === "chat") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#050506] px-4 py-8 text-white">
        <section className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9B9BA1]">
              UserSim
            </div>
            <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
              Ask seven AI personas to review any product page.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#B8B8BE]">
              Paste a public URL or localhost link. UserSim opens it locally,
              captures the page, and returns focused product feedback.
            </p>
          </div>

          <form
            className="border border-white/10 bg-[#111113] shadow-2xl shadow-black/40"
            onSubmit={(event) => {
              event.preventDefault();
              submitChatRun();
            }}
          >
            <textarea
              value={chatPrompt}
              onChange={(event) => setChatPrompt(event.target.value)}
              rows={5}
              className="block max-h-52 min-h-40 w-full resize-none bg-[#0B0B0C] px-5 py-5 text-[16px] leading-7 text-white outline-none placeholder:text-[#77777F]"
              placeholder="Example: Test example.com like a skeptical buyer and accessibility reviewer."
            />
            <div className="border-t border-white/10 px-4 py-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="border border-white/10 bg-black px-3 py-1.5 text-xs text-[#D8D8DC]">
                  Target: {detectedUrl}
                </span>
                <span className="text-xs text-[#8F8F98]">
                  Runs locally with Playwright. No deployment required.
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setChatPrompt(prompt)}
                      className="shrink-0 border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-[#C8C8CE] hover:border-white/40 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="shrink-0 border border-white bg-white px-5 py-3 text-sm font-semibold text-black"
                >
                  Start review
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>
    );
  }

  if (screen === "process") {
    return (
      <main className="min-h-[100dvh] bg-[#050506] px-4 py-6 text-white">
        <section className="mx-auto grid max-w-5xl gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9B9BA1]">
                UserSim
              </div>
              <h1 className="mt-1 text-2xl font-semibold">
                Reviewing {detectedUrl}
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={pause}
                disabled={phase !== "RUNNING"}
                className="border border-white/10 bg-[#151517] px-3 py-2 text-sm text-white disabled:opacity-30"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={() => {
                  stop();
                  setScreen("report");
                }}
                className="border border-white/10 bg-black px-3 py-2 text-sm text-[#B8B8BE]"
              >
                Finish now
              </button>
            </div>
          </div>

          <section className="border border-white/10 bg-[#111113] px-5 py-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">
                  {analysis
                    ? `Captured ${analysis.evidence.title || analysis.evidence.finalUrl}`
                    : analysisError
                      ? `Inspection issue: ${analysisError}`
                      : "Opening page locally"}
                </div>
                <div className="mt-1 text-sm text-[#A8A8AF]">
                  {completedAgents}/{PERSONA_AGENTS.length} agents complete · {activeAgents} active
                </div>
              </div>
              <div className="font-mono text-sm text-[#D8D8DC]">{progress}%</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              {runSteps.map((step, index) => {
                const active = index <= runStepIndex;
                return (
                  <div key={step}>
                    <div className={`mb-2 h-1.5 ${active ? "bg-white" : "bg-white/10"}`} />
                    <div className={`text-xs ${active ? "text-white" : "text-[#77777F]"}`}>
                      {step}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="min-h-[520px]">
            <AgentViewfinder
              agent={selectedAgent}
              finding={selectedFinding}
              evidence={analysis?.evidence ?? null}
              analyzing={analyzingUrl}
              phase={phase}
              targetUrl={targetUrl}
            />
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#050506] px-4 py-6 text-white">
      <section className="mx-auto grid max-w-6xl gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9B9BA1]">
              Final report
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              {analysis?.evidence.title || "Persona review complete"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#A8A8AF]">
              {analysis
                ? `Captured ${analysis.evidence.finalUrl}. ${analysis.evidence.headings.length} headings, ${analysis.evidence.buttons.length} buttons, and ${analysis.evidence.forms.length} form signals were reviewed.`
                : "The review used the built-in demo persona matrix because no page capture was available."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyReport}
              className="border border-white/10 bg-[#151517] px-3 py-2 text-sm text-white"
            >
              {copied ? "Copied" : "Copy report"}
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="border border-white/10 bg-[#151517] px-3 py-2 text-sm text-white"
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={resetFlow}
              className="border border-white bg-white px-3 py-2 text-sm font-semibold text-black"
            >
              Run another
            </button>
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {findingCards.map((card) => {
            if (!card) return null;
            return (
              <article
                key={card.id}
                className={`border p-4 ${severityTone[card.severity]}`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {card.agent.name}
                    </div>
                    <div className="mt-0.5 text-xs text-[#B8B8BE]">
                      {card.agent.title}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase">
                    {card.severity}
                  </span>
                </div>
                <h2 className="text-base font-semibold leading-6 text-white">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#D8D8DE]">
                  {card.recommendation}
                </p>
                <div className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-[#B8B8BE]">
                  {card.evidence}
                </div>
                <div className="mt-4 text-xs text-[#8F8F98]">
                  {card.confidence}% confidence ·{" "}
                  {card.isLive ? "real page finding" : "demo fallback"}
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-h-[480px]">
            <AgentViewfinder
              agent={selectedAgent}
              finding={selectedFinding}
              evidence={analysis?.evidence ?? null}
              analyzing={false}
              phase={phase}
              targetUrl={targetUrl}
            />
          </div>
          <aside className="border border-white/10 bg-[#101012]">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="text-sm font-medium">Persona details</div>
              <div className="mt-1 text-xs text-[#A8A8AF]">
                Select a persona to inspect its reasoning.
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
                  <div className="text-sm font-semibold">{agent.name}</div>
                  <div
                    className={`mt-1 text-xs ${
                      selectedAgentId === agent.id
                        ? "text-black/70"
                        : "text-[#A8A8AF]"
                    }`}
                  >
                    {agent.title}
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
                Optional browser and agent event stream.
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
      </section>

      <BugReportDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        markdown={reportMd}
        revealKey={reportRevealKey}
      />
    </main>
  );
}
