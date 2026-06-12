"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
  "Enriching context",
  "Reading copy",
  "Running personas",
  "Building report",
];

const demoSources = [
  {
    name: "Website",
    status: "Live",
    detail: "Playwright captures screenshot, DOM text, headings, buttons, forms.",
  },
  {
    name: "X conversation",
    status: "Demo",
    detail: "Would sample recent posts mentioning the brand, category, or competitor terms.",
  },
  {
    name: "Web search",
    status: "Demo",
    detail: "Would pull search snippets, reviews, docs, and category language.",
  },
  {
    name: "Community",
    status: "Demo",
    detail: "Would summarize Reddit, forums, or support threads when API access is available.",
  },
];

const commandChips = ["@buyer", "@security", "@accessibility", "@pricing", "@founder"];

function SimsAiBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center ${compact ? "gap-2" : "justify-center gap-3"}`}
      aria-label="SimsAi"
    >
      <div
        className={`${compact ? "h-9 w-9" : "h-12 w-12"} simsai-gem relative shrink-0`}
        aria-hidden="true"
      >
        <span className="absolute left-1/2 top-[18%] h-[24%] w-[36%] -translate-x-1/2 rounded-full bg-white/45 blur-[3px]" />
      </div>
      <div className={compact ? "text-left" : "text-left"}>
        <div
          className={`${compact ? "text-xl" : "text-3xl sm:text-4xl"} simsai-wordmark font-semibold tracking-normal`}
        >
          SimsAi
        </div>
        {!compact ? (
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9BFFB8]">
            Persona lab
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IdeShell({
  active,
  title,
  subtitle,
  progress,
  children,
}: {
  active: "review" | "agents" | "sources" | "report";
  title: string;
  subtitle: string;
  progress: number;
  children: ReactNode;
}) {
  const rail = [
    { id: "review", label: "Review", mark: "R" },
    { id: "agents", label: "Agents", mark: "A" },
    { id: "sources", label: "Sources", mark: "S" },
    { id: "report", label: "Report", mark: "F" },
  ] as const;

  return (
    <main className="ide-stage h-[100dvh] overflow-hidden text-white">
      <section className="ide-window flex h-full min-h-0 flex-col overflow-hidden">
        <header className="ide-titlebar flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <SimsAiBrand compact />
            <div className="hidden h-7 w-px bg-white/10 sm:block" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-[#F2F2F4]">
                {title}
              </div>
              <div className="truncate font-mono text-[10px] text-[#8E8E98]">
                {subtitle}
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 font-mono text-[10px] text-[#8E8E98] sm:flex">
            <span className="ide-status-dot" aria-hidden="true" />
            playwright.local
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[70px] shrink-0 border-r border-white/10 bg-[#090A0D] py-3 md:block">
            <nav className="flex flex-col items-center gap-2" aria-label="Workspace">
              {rail.map((item) => (
                <div
                  key={item.id}
                  className={`flex w-full flex-col items-center gap-1 border-l-2 py-2 ${
                    active === item.id
                      ? "border-[#79F2A6] text-white"
                      : "border-transparent text-[#74747D]"
                  }`}
                >
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-xl border font-mono text-xs ${
                      active === item.id
                        ? "border-[#79F2A6]/40 bg-[#79F2A6]/12 text-[#B8FFD0]"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    {item.mark}
                  </div>
                  <span className="text-[10px]">{item.label}</span>
                </div>
              ))}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="ide-tabs flex min-h-10 items-end gap-1 overflow-x-auto border-b border-white/10 bg-[#0D0E12] px-2 pt-2">
              {["target.url", "personas.json", "findings.md"].map((tab, index) => (
                <div
                  key={tab}
                  className={`shrink-0 rounded-t-xl border border-b-0 px-3 py-2 font-mono text-[11px] ${
                    index === 0
                      ? "border-white/12 bg-[#15161B] text-[#F1F1F3]"
                      : "border-transparent bg-transparent text-[#777780]"
                  }`}
                >
                  {tab}
                </div>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#0B0C10]">
              {children}
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#090A0D] px-3 py-1.5 font-mono text-[10px] text-[#8E8E98]">
          <span>SimsAi workspace</span>
          <span>{Math.max(0, Math.min(progress, 100))}% indexed</span>
        </footer>
      </section>
    </main>
  );
}

const severityTone = {
  critical: "border-red-400/50 bg-red-950/25 text-red-100",
  high: "border-orange-300/40 bg-orange-950/20 text-orange-100",
  medium: "border-yellow-200/35 bg-yellow-950/15 text-yellow-100",
  low: "border-white/10 bg-white/[0.04] text-[#D8D8D8]",
};

function extractUrlFromPrompt(prompt: string) {
  const tokens = prompt.match(
    /\b(?:https?:\/\/)?(?:localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?|\[::1\](?::\d+)?|(?:[\w-]+\.)+[a-z]{2,})(?:\/[^\s]*)?/gi
  );
  const latestToken = tokens?.at(-1);
  if (!latestToken) return null;
  return latestToken.replace(/[),.;!?]+$/, "");
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
  return `# SimsAi Live Page Report

**Requested URL:** \`${targetUrl}\`  
**Captured URL:** \`${analysis.evidence.finalUrl}\`  
**Outcome:** ${outcome}  
**Page title:** ${analysis.evidence.title || "Untitled page"}

---

## Captured Surface

- **Headings:** ${analysis.evidence.headings.slice(0, 8).join(" | ") || "none captured"}
- **Buttons:** ${analysis.evidence.buttons.slice(0, 8).join(" | ") || "none captured"}
- **Forms:** ${analysis.evidence.forms.slice(0, 8).join(" | ") || "none captured"}
- **Visited pages:** ${
    analysis.evidence.visitedPages
      ?.map((page) => page.title || page.url)
      .join(" | ") || "primary page only"
  }
- **Console errors:** ${analysis.evidence.consoleErrors.length}
- **Network errors:** ${analysis.evidence.networkErrors.length}

---

## Source Enrichment Preview

${demoSources
  .map(
    (source) =>
      `- **${source.name} (${source.status}):** ${source.detail}`
  )
  .join("\n")}

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
  const [inputError, setInputError] = useState("");
  const [manualLoginEnabled, setManualLoginEnabled] = useState(false);

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
    manualLoginWaiting,
    manualLoginSessionId,
    manualLoginReason,
    selectedAgent,
    selectedAgentId,
    setSelectedAgentId,
    agentRuns,
    run,
    runWithManualLogin,
    continueManualLogin,
    pause,
    stop,
  } = useSimulationEngine();

  const reportOutcome = phase === "COMPLETED" ? "COMPLETED" : "STOPPED";
  const reportMd = analysis
    ? buildLiveReportMarkdown({ targetUrl, outcome: reportOutcome, analysis })
    : buildBugReportMarkdown({ targetUrl, outcome: reportOutcome, progress });

  const promptUrl = extractUrlFromPrompt(chatPrompt);
  const detectedUrl = promptUrl ?? "No URL detected";
  const runEnabled =
    phase === "IDLE" ||
    phase === "PAUSED" ||
    phase === "COMPLETED" ||
    phase === "STOPPED";
  const canSubmitReview = runEnabled && Boolean(promptUrl);
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
    if (
      (phase === "COMPLETED" || phase === "STOPPED") &&
      !analyzingUrl &&
      !manualLoginWaiting
    ) {
      queueMicrotask(() => setScreen("report"));
    }
  }, [analyzingUrl, manualLoginWaiting, phase, screen]);

  const submitChatRun = () => {
    if (!promptUrl) {
      setInputError("Paste a public URL or localhost link before running the review.");
      return;
    }
    if (runEnabled) {
      setTargetUrl(promptUrl);
      setInputError("");
      setCopied(false);
      setTraceOpen(false);
      setScreen("process");
      if (manualLoginEnabled) {
        runWithManualLogin(promptUrl);
      } else {
        run(promptUrl);
      }
    }
  };

  const copyReport = async () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    try {
      await navigator.clipboard.writeText(reportMd);
    } catch {
      // Clipboard permissions can be unavailable in some demo browsers.
    }
  };

  const resetFlow = () => {
    stop();
    setScreen("chat");
    setCopied(false);
    setTraceOpen(false);
    setInputError("");
  };

  if (screen === "chat") {
    return (
      <IdeShell
        active="review"
        title="New persona review"
        subtitle="Command palette / product-feedback agent"
        progress={0}
      >
        <section className="grid min-h-full grid-rows-[auto_1fr]">
          <div className="border-b border-white/10 bg-[#101116] px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#79F2A6]">
                  SimsAi Composer
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
                  Review any product page like it is open in an IDE.
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#A7A7B0]">
                  Paste a URL, add persona instructions, and SimsAi runs seven
                  synthetic users across the live surface, same-site routes, and
                  authenticated pages when login is enabled.
                </p>
              </div>
              <div className="grid min-w-[280px] grid-cols-3 gap-2">
                <div className="ide-panel p-3">
                  <div className="font-mono text-[10px] uppercase text-[#8E8E98]">
                    agents
                  </div>
                  <div className="mt-1 text-xl font-semibold">7</div>
                </div>
                <div className="ide-panel p-3">
                  <div className="font-mono text-[10px] uppercase text-[#8E8E98]">
                    mode
                  </div>
                  <div className="mt-1 truncate text-sm text-white">
                    {manualLoginEnabled ? "Auth" : "Public"}
                  </div>
                </div>
                <div className="ide-panel p-3">
                  <div className="font-mono text-[10px] uppercase text-[#8E8E98]">
                    routes
                  </div>
                  <div className="mt-1 text-xl font-semibold">4</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 gap-4 p-4 xl:grid-cols-[minmax(0,1.25fr)_360px]">
            <form
              className="ide-command-panel self-start overflow-hidden rounded-[18px]"
              onSubmit={(event) => {
                event.preventDefault();
                submitChatRun();
              }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-sm text-[#79F2A6]">cmd</span>
                  <span className="h-4 w-px bg-white/10" />
                  <span className="truncate text-sm text-[#D8D8DE]">
                    Review target with persona agents
                  </span>
                </div>
                <span className="ide-badge hidden sm:inline-flex">7 agents</span>
              </div>
              <textarea
                value={chatPrompt}
                onChange={(event) => {
                  setChatPrompt(event.target.value);
                  setInputError("");
                }}
                rows={5}
                className="block max-h-56 min-h-40 w-full resize-none bg-[#0F1015] px-4 py-4 font-mono text-[14px] leading-7 text-white outline-none placeholder:text-[#777780]"
                placeholder="review https://example.com @buyer @accessibility"
              />
              <div className="border-t border-white/10 px-4 py-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="ide-badge">target: {detectedUrl}</span>
                  {commandChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setChatPrompt((prompt) => `${prompt} ${chip}`);
                        setInputError("");
                      }}
                      className="ide-chip"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-[#D8D8DE]">
                  <input
                    type="checkbox"
                    checked={manualLoginEnabled}
                    onChange={(event) => setManualLoginEnabled(event.target.checked)}
                    className="mt-1 accent-[#79F2A6]"
                  />
                  <span>
                    <span className="block font-medium text-white">
                      Login required
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#9A9AA4]">
                      Opens a local browser window so you can log in manually,
                      then SimsAi captures the authenticated page.
                    </span>
                  </span>
                </label>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          setChatPrompt(prompt);
                          setInputError("");
                        }}
                        className="ide-suggestion shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={!canSubmitReview}
                    className="glass-button glass-button-primary shrink-0 px-5 py-3 text-sm font-semibold"
                  >
                    Run review
                  </button>
                </div>
                {inputError ? (
                  <div className="mt-3 rounded-xl border border-[#FFCF70]/30 bg-[#FFCF70]/10 px-3 py-2 text-sm text-[#FFE5AD]">
                    {inputError}
                  </div>
                ) : null}
              </div>
            </form>

            <aside className="grid gap-4">
              <section className="ide-panel p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Workspace readiness
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-[#9A9AA4]">
                      Everything visible here participates in the demo.
                    </p>
                  </div>
                  <span className="ide-badge">ready</span>
                </div>
                <div className="grid gap-2">
                  {[
                    "Live browser capture",
                    "Manual login handoff",
                    "Same-site route crawl",
                    "Findings as issues",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                    >
                      <span>{item}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#79F2A6]" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="ide-panel p-4">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                  persona queue
                </div>
                <div className="grid gap-2">
                  {PERSONA_AGENTS.slice(0, 7).map((persona) => (
                    <div
                      key={persona.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">
                          {persona.name}
                        </div>
                        <div className="truncate text-xs text-[#8E8E98]">
                          {persona.title}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] uppercase text-[#8E8E98]">
                        queued
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </IdeShell>
    );
  }

  if (screen === "process") {
    return (
      <IdeShell
        active="agents"
        title={`Reviewing ${detectedUrl}`}
        subtitle={`${completedAgents}/${PERSONA_AGENTS.length} agents complete / ${activeAgents} active`}
        progress={progress}
      >
        <section className="grid min-h-full grid-rows-[auto_1fr]">
          <div className="border-b border-white/10 bg-[#101116] px-4 py-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">
                  {analysis
                    ? `Captured ${analysis.evidence.title || analysis.evidence.finalUrl}`
                    : manualLoginWaiting
                      ? manualLoginSessionId
                        ? "Login detected - browser is waiting"
                        : "Login detected - opening browser"
                    : analysisError
                      ? `Inspection issue: ${analysisError}`
                      : "Opening page locally"}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#8E8E98]">
                  {manualLoginWaiting
                    ? manualLoginReason ??
                      "Log in in the browser window, then continue capture"
                    : `${completedAgents}/${PERSONA_AGENTS.length} complete / ${activeAgents} active / ${progress}%`}
                </div>
                {manualLoginWaiting && analysisError ? (
                  <div className="mt-2 rounded-xl border border-[#FFCF70]/30 bg-[#FFCF70]/10 px-3 py-2 text-xs text-[#FFE5AD]">
                    {analysisError}
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                {manualLoginWaiting ? (
                  <button
                    type="button"
                    onClick={continueManualLogin}
                    disabled={!manualLoginSessionId}
                    className="glass-button glass-button-primary px-3 py-2 text-sm font-semibold"
                  >
                    {manualLoginSessionId ? "Continue after login" : "Opening browser..."}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={pause}
                  disabled={phase !== "RUNNING" || manualLoginWaiting}
                  className="glass-button px-3 py-2 text-sm"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stop();
                    setScreen("report");
                  }}
                  className="glass-button px-3 py-2 text-sm text-[#B8B8BE]"
                >
                  Finish now
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-6">
              {runSteps.map((step, index) => {
                const active = index <= runStepIndex;
                return (
                  <div key={step} className="min-w-0">
                    <div
                      className={`mb-1 h-1 rounded-full ${
                        active ? "bg-[#79F2A6]" : "bg-white/10"
                      }`}
                    />
                    <div
                      className={`truncate font-mono text-[10px] ${
                        active ? "text-[#C8FFD8]" : "text-[#777780]"
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid min-h-0 grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
            <aside className="min-h-0 border-b border-white/10 bg-[#0D0E12] xl:border-b-0 xl:border-r">
              <div className="border-b border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                personas.json
              </div>
              <div className="grid max-h-72 gap-1 overflow-y-auto p-2 sm:grid-cols-2 xl:max-h-none xl:grid-cols-1">
                {agentRuns.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`rounded-xl border px-3 py-2 text-left ${
                      selectedAgentId === agent.id
                        ? "border-[#79F2A6]/45 bg-[#79F2A6]/12"
                        : "border-transparent bg-white/[0.025] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {agent.name}
                      </span>
                      <span className="font-mono text-[10px] text-[#8E8E98]">
                        {agent.progress}%
                      </span>
                    </div>
                    <div className="mt-1 truncate text-xs text-[#8E8E98]">
                      {agent.title}
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <div className="min-h-[520px] p-3">
              <AgentViewfinder
                agent={selectedAgent}
                finding={selectedFinding}
                evidence={analysis?.evidence ?? null}
                analyzing={analyzingUrl}
                phase={phase}
                targetUrl={targetUrl}
              />
            </div>

            <aside className="grid min-h-0 grid-rows-[auto_minmax(180px,1fr)_260px] border-t border-white/10 bg-[#0D0E12] xl:border-l xl:border-t-0">
              <div className="border-b border-white/10 p-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                  sources
                </div>
                <div className="mt-3 grid gap-2">
                  {demoSources.map((source, index) => {
                    const active =
                      source.status === "Live" ||
                      progress >= 22 + index * 12 ||
                      Boolean(analysis);
                    return (
                      <div
                        key={source.name}
                        className={`rounded-xl border px-3 py-2 ${
                          active
                            ? "border-[#79F2A6]/25 bg-[#79F2A6]/10"
                            : "border-white/10 bg-white/[0.025]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-white">{source.name}</span>
                          <span className="font-mono text-[10px] uppercase text-[#8E8E98]">
                            {source.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="min-h-0 overflow-y-auto p-3">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                  active thought
                </div>
                <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm leading-6 text-[#D8D8DE]">
                  {selectedFinding?.quote ?? selectedAgent.quote}
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm leading-6 text-[#B8B8BE]">
                  {selectedFinding?.recommendation ?? selectedAgent.recommendation}
                </div>
              </div>
              <div className="min-h-0 border-t border-white/10">
                <TelemetryTerminal lines={logLines} phase={phase} />
              </div>
            </aside>
          </div>
        </section>
      </IdeShell>
    );
  }

  return (
    <IdeShell
      active="report"
      title={analysis?.evidence.title || "Persona review complete"}
      subtitle={analysis?.evidence.finalUrl || targetUrl}
      progress={100}
    >
      <section className="grid gap-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#79F2A6]">
              final report / findings.md
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-4xl">
              {analysis?.evidence.title || "Persona review complete"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#A8A8AF]">
              {analysis
                ? `Captured ${analysis.evidence.finalUrl}. ${analysis.evidence.headings.length} headings, ${analysis.evidence.buttons.length} buttons, and ${analysis.evidence.forms.length} form signals were reviewed.`
                : "The review used the built-in demo persona matrix because no page capture was available."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyReport}
              className="glass-button px-3 py-2 text-sm"
            >
              {copied ? "Copied" : "Copy report"}
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="glass-button px-3 py-2 text-sm"
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={resetFlow}
              className="glass-button glass-button-primary px-3 py-2 text-sm font-semibold"
            >
              Run another
            </button>
          </div>
        </div>

        <section className="grid gap-3 lg:grid-cols-4">
          {demoSources.map((source) => (
            <article key={source.name} className="ide-panel p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{source.name}</h3>
                <span className="font-mono text-[10px] uppercase text-[#8E8E98]">
                  {source.status}
                </span>
              </div>
              <p className="text-xs leading-5 text-[#B8B8BE]">{source.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3">
            {findingCards.map((card, index) => {
              if (!card) return null;
              return (
                <article
                  key={card.id}
                  className={`ide-issue border-l-2 ${severityTone[card.severity]}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                        issue {String(index + 1).padStart(2, "0")} / {card.agent.name}
                      </div>
                      <h2 className="mt-2 text-base font-semibold leading-6 text-white">
                        {card.title}
                      </h2>
                    </div>
                    <span className="ide-badge">{card.severity}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#D8D8DE]">
                    {card.recommendation}
                  </p>
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 font-mono text-[11px] leading-5 text-[#A8A8AF]">
                    {card.evidence}
                  </div>
                  <div className="mt-3 text-xs text-[#8F8F98]">
                    {card.confidence}% confidence /{" "}
                    {card.isLive ? "real page finding" : "demo fallback"}
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="ide-panel overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="text-sm font-medium">Persona inspector</div>
              <div className="mt-1 text-xs text-[#A8A8AF]">
                Click a persona to inspect its final reasoning.
              </div>
            </div>
            <div className="grid max-h-[540px] gap-2 overflow-y-auto p-3">
              {agentRuns.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`rounded-xl border p-3 text-left ${
                    selectedAgentId === agent.id
                      ? "border-[#79F2A6]/45 bg-[#79F2A6]/12"
                      : "border-white/10 bg-white/[0.025]"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">{agent.name}</div>
                  <div className="mt-1 text-xs text-[#A8A8AF]">{agent.title}</div>
                </button>
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
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
          <section className="ide-panel overflow-hidden">
            <button
              type="button"
              onClick={() => setTraceOpen((open) => !open)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span>
                <span className="block text-sm font-medium">Terminal trace</span>
                <span className="mt-1 block text-xs text-[#A8A8AF]">
                  Browser and agent event stream.
                </span>
              </span>
              <span className="font-mono text-xs text-[#A8A8AF]">
                {traceOpen ? "Hide" : "Show"}
              </span>
            </button>
            {traceOpen ? (
              <div className="h-[calc(100%-64px)] min-h-72 border-t border-white/10">
                <TelemetryTerminal lines={logLines} phase={phase} />
              </div>
            ) : (
              <div className="h-72 border-t border-white/10">
                <TelemetryTerminal lines={logLines} phase={phase} />
              </div>
            )}
          </section>
        </section>
      </section>

      <BugReportDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        markdown={reportMd}
        revealKey={reportRevealKey}
      />
    </IdeShell>
  );
}
