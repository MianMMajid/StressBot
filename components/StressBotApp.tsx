"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import { SandboxViewportFrame } from "@/components/SandboxViewportFrame";
import { TelemetryTerminal } from "@/components/TelemetryTerminal";
import { ActivityBar, ExplorerSidebar } from "@/components/VSCodeChrome";
import { PHASE_PILL } from "@/lib/ui-theme";

/** Editor pane share of the editor row (percent) — panel sits on the RIGHT. */
const EDITOR_PCT_MIN = 25;
const EDITOR_PCT_MAX = 80;
const EDITOR_PCT_DEFAULT = 55;


type EditorTab = "sandbox" | "report";

export function StressBotApp() {
  const [editorPct, setEditorPct] = useState(EDITOR_PCT_DEFAULT);
  const [isResizing, setIsResizing] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [activePanelTab, setActivePanelTab] = useState<"PROBLEMS" | "TERMINAL">("TERMINAL");
  /** User's explicit tab choice since the report last opened (null = default). */
  const [tabOverride, setTabOverride] = useState<EditorTab | null>(null);
  const editorRowRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startPct: number; width: number } | null>(
    null
  );

  const {
    phase,
    targetUrl,
    setTargetUrl,
    logEntries,
    tickProgressLabel,
    drawerOpen,
    setDrawerOpen,
    reportRevealKey,
    reportMarkdown,
    cursors,
    rings,
    nameStress,
    chaoticName,
    run,
    pause,
    stop,
  } = useSimulationEngine();

  const runEnabled =
    phase === "IDLE" || phase === "PAUSED" || phase === "COMPLETED";
  const pauseEnabled = phase === "RUNNING";
  const stopEnabled = phase === "RUNNING" || phase === "PAUSED";

  // COMPLETED → the report opens as an editor tab (no overlay on top).
  // Derived state: tab visibility tracks the engine's report flag directly;
  // when a new report opens, clear any stale user tab choice (render-phase
  // adjustment — the React-sanctioned alternative to setState-in-effect).
  const reportOpen = drawerOpen;
  const [prevReportOpen, setPrevReportOpen] = useState(reportOpen);
  if (reportOpen !== prevReportOpen) {
    setPrevReportOpen(reportOpen);
    if (reportOpen) setTabOverride(null);
  }
  const activeTab: EditorTab = reportOpen ? (tabOverride ?? "report") : "sandbox";

  const handleRun = useCallback(() => {
    setTabOverride(null);
    run();
  }, [run]);

  const closeReportTab = useCallback(() => {
    setTabOverride(null);
    setDrawerOpen(false);
  }, [setDrawerOpen]);

  const { errorCount, warnCount } = useMemo(() => {
    let errors = 0;
    let warns = 0;
    for (const e of logEntries) {
      if (e.isCritical) errors += 1;
      else if (e.rawErrorDetails) warns += 1;
    }
    return { errorCount: errors, warnCount: warns };
  }, [logEntries]);

  const beginPanelDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!editorRowRef.current) return;
      e.preventDefault();
      const width = editorRowRef.current.getBoundingClientRect().width;
      dragRef.current = { startX: e.clientX, startPct: editorPct, width };
      setIsResizing(true);
    },
    [editorPct]
  );

  useEffect(() => {
    if (!isResizing || !dragRef.current) return;

    const start = dragRef.current;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - start.startX;
      const next = start.startPct + (dx / start.width) * 100;
      setEditorPct(Math.min(EDITOR_PCT_MAX, Math.max(EDITOR_PCT_MIN, next)));
    };
    const onUp = () => {
      setIsResizing(false);
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isResizing]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#1e1e1e] font-sans text-[#cccccc]">
      {/* ════ TIER 1 — Titlebar ════════════════════════════════════ */}
      <div className="flex h-10 shrink-0 items-center gap-3 overflow-hidden border-b border-[#252526] bg-[#2d2d2d] px-3">
        <div className="flex min-w-0 shrink-0 items-center gap-2.5 sm:w-56">
          <div className="flex shrink-0 gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="hidden truncate font-sans text-xs text-[#cccccc]/80 sm:inline">
            StressBotApp.tsx — stressbot
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
          <label className="sr-only" htmlFor="target-url">
            Target URL
          </label>
          <input
            id="target-url"
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={phase === "RUNNING"}
            spellCheck={false}
            className="w-full max-w-[440px] min-w-0 truncate border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-1 text-center font-mono text-[11px] text-[#cccccc] outline-none placeholder:text-[#cccccc]/40 focus:border-[#007acc] disabled:opacity-50"
            placeholder="https://www.saucedemo.com"
          />
          <button
            type="button"
            title="Reload the target website"
            onClick={() => setIframeKey((k) => k + 1)}
            className="flex shrink-0 items-center justify-center border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-1 text-[#cccccc] transition-colors hover:bg-[#37373d] hover:text-white"
          >
            {/* Refresh / reload arrow */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden
            >
              <path d="M13.65 2.35A8 8 0 1 0 15 8h-2a6 6 0 1 1-1.06-3.41L9 7h7V0l-2.35 2.35z" />
            </svg>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleRun}
            disabled={!runEnabled}
            className="flex items-center gap-1.5 border border-transparent bg-[#0e639c] px-3 py-1 font-sans text-[11px] font-medium text-white transition-colors hover:bg-[#1177bb] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span
              className={`run-dot h-2 w-2 rounded-full ${
                phase === "RUNNING" ? "run-dot-active" : "bg-[#89d185]"
              }`}
              aria-hidden
            />
            ▷ Run
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={!pauseEnabled}
            className="border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-1 font-sans text-[11px] text-[#cccccc] transition-colors hover:bg-[#37373d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ⏸ Pause
          </button>
          <button
            type="button"
            onClick={stop}
            disabled={!stopEnabled}
            className="border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-1 font-sans text-[11px] text-[#f44747] transition-colors hover:bg-[#37373d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ◼ Stop
          </button>
        </div>
      </div>

      {/* ════ TIER 2 — Workspace split ═════════════════════════════ */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ActivityBar />
        <ExplorerSidebar />

        {/* Editor column: tabs / editor / separator / terminal */}
        <div
          ref={editorRowRef}
          className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden"
        >
          {/* Editor pane (tabs + content) — panel sits to its RIGHT */}
          <div
            className="flex min-h-0 min-w-0 flex-none flex-col overflow-hidden"
            style={{
              flexBasis: `${editorPct}%`,
              transition: isResizing ? "none" : "flex-basis 0.1s ease-out",
            }}
          >
          {/* Editor tab bar */}
          <div className="flex shrink-0 items-stretch overflow-x-auto border-b border-[#252526] bg-[#2d2d2d]">
            <button
              type="button"
              onClick={() => setTabOverride("sandbox")}
              className={`flex items-center gap-1.5 border-r border-[#252526] px-3 py-1.5 ${
                activeTab === "sandbox"
                  ? "border-t-2 border-t-[#007acc] bg-[#1e1e1e] text-white"
                  : "border-t-2 border-t-transparent text-[#cccccc]/60 hover:text-[#cccccc]"
              }`}
            >
              <span className="font-mono text-[8px] font-bold text-[#519aba]">
                TS
              </span>
              <span className="whitespace-nowrap font-sans text-[11.5px]">
                SandboxViewportFrame.tsx
              </span>
            </button>
            {reportOpen && (
              <button
                type="button"
                onClick={() => setTabOverride("report")}
                className={`flex items-center gap-1.5 border-r border-[#252526] px-3 py-1.5 ${
                  activeTab === "report"
                    ? "border-t-2 border-t-[#007acc] bg-[#1e1e1e] text-white"
                    : "border-t-2 border-t-transparent text-[#cccccc]/60 hover:text-[#cccccc]"
                }`}
              >
                <span className="font-mono text-[8px] font-bold text-[#519aba]">
                  M↓
                </span>
                <span className="whitespace-nowrap font-sans text-[11.5px]">
                  stability-report.md
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeReportTab();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      closeReportTab();
                    }
                  }}
                  className="ml-1 px-0.5 text-[11px] text-[#cccccc]/50 hover:text-white"
                  aria-label="Close stability-report.md"
                >
                  ×
                </span>
              </button>
            )}
            <span className="ml-auto hidden shrink-0 items-center gap-2 px-3 font-mono text-[9px] text-[#6a9955] md:flex">
              <span className={`border px-1.5 py-px ${PHASE_PILL[phase]}`}>
                {phase}
              </span>
              {tickProgressLabel} ticks
            </span>
          </div>

          {/* Editor content */}
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-[#1e1e1e]">
            {activeTab === "sandbox" ? (
              <div className="h-full min-h-0 p-2.5">
                <SandboxViewportFrame
                  phase={phase}
                  targetUrl={targetUrl}
                  cursors={cursors}
                  rings={rings}
                  nameStress={nameStress}
                  chaoticName={chaoticName}
                  iframeKey={iframeKey}
                />
              </div>
            ) : (
              <div
                key={reportRevealKey}
                className="report-reveal h-full overflow-y-auto overscroll-contain"
              >
                <div className="mx-auto max-w-3xl px-6 py-5">
                  <div className="border border-[#252526] bg-[#1e1e1e] p-6">
                    <article className="markdown-report">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {reportMarkdown || "_Compiling report…_"}
                      </ReactMarkdown>
                    </article>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* ════ TIER 3 — Right-side panel (in-flow resize handle) ══ */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize terminal panel"
            aria-valuemin={EDITOR_PCT_MIN}
            aria-valuemax={EDITOR_PCT_MAX}
            aria-valuenow={Math.round(editorPct)}
            onPointerDown={beginPanelDrag}
            className={`w-1 shrink-0 cursor-col-resize transition-colors hover:bg-[#007acc] ${
              isResizing ? "bg-[#007acc]" : "bg-[#252526]"
            }`}
          />
          <div className="flex min-w-[200px] flex-1 flex-col overflow-hidden border-l border-[#252526] bg-[#181818]">
            <div className="flex shrink-0 items-center gap-4 overflow-x-auto border-b border-[#252526] bg-[#181818] px-3 pt-1.5">
              {(["PROBLEMS", "TERMINAL"] as const).map((tab) => {
                const active = activePanelTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivePanelTab(tab)}
                    className={`whitespace-nowrap border-b pb-1.5 font-sans text-[10.5px] tracking-wide transition-colors ${
                      active
                        ? "border-[#007acc] text-white"
                        : "border-transparent text-[#cccccc]/55 hover:text-[#cccccc]"
                    }`}
                  >
                    {tab}
                    {tab === "PROBLEMS" && errorCount > 0 && (
                      <span
                        className={`ml-1.5 font-mono text-[10px] ${
                          active ? "text-[#f44747]" : "text-[#cccccc]/40"
                        }`}
                      >
                        {errorCount}
                      </span>
                    )}
                  </button>
                );
              })}
              <span className="ml-auto hidden whitespace-nowrap font-mono text-[9px] text-[#6a9955] sm:inline">
                400ms · 10 lines/tick
              </span>
            </div>
            {activePanelTab === "TERMINAL" ? (
              <TelemetryTerminal entries={logEntries} phase={phase} />
            ) : (
              <TelemetryTerminal
                entries={logEntries}
                phase={phase}
                criticalOnly
              />
            )}
          </div>
        </div>
      </div>

      {/* ════ Status bar ═══════════════════════════════════════════ */}
      <div className="flex h-6 shrink-0 items-center gap-3 overflow-hidden bg-[#007acc] px-2.5 font-sans text-[10.5px] text-white">
        <span className="shrink-0">⎇ main*</span>
        <span className="shrink-0">
          ⊗ {errorCount} ⚠ {warnCount}
        </span>
        <span className="hidden shrink-0 sm:inline">
          STRESSBOT: {phase} · {tickProgressLabel} ticks
        </span>
        <span className="ml-auto hidden shrink-0 md:inline">
          Ln {logEntries.length + 1}, Col 1
        </span>
        <span className="hidden shrink-0 md:inline">Spaces: 2</span>
        <span className="hidden shrink-0 sm:inline">UTF-8</span>
        <span className="shrink-0">TypeScript JSX</span>
      </div>
    </div>
  );
}
