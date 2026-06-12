"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnalyzeResult } from "@/lib/page-analysis";
import {
  PERSONA_AGENTS,
  SimulationPhase,
  formatTelemetryLine,
  getAgentRuntime,
} from "@/lib/simulation";

const TICK_MS = 520;
const PROGRESS_STEP = 8;

type AnalyzeResponse =
  | AnalyzeResult
  | {
      requiresLogin: true;
      loginUrl: string;
      reason: string;
    };

function isLoginRequiredResponse(
  response: AnalyzeResponse
): response is Extract<AnalyzeResponse, { requiresLogin: true }> {
  return "requiresLogin" in response && response.requiresLogin === true;
}

function nowStamp(): string {
  const d = new Date();
  return d.toISOString().split("T")[1].slice(0, 12);
}

export function useSimulationEngine() {
  const [phase, setPhase] = useState<SimulationPhase>("IDLE");
  const [targetUrl, setTargetUrl] = useState("example.com");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(PERSONA_AGENTS[0].id);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzingUrl, setAnalyzingUrl] = useState(false);
  const [manualLoginWaiting, setManualLoginWaiting] = useState(false);
  const [manualLoginSessionId, setManualLoginSessionId] = useState<string | null>(null);
  const [manualLoginReason, setManualLoginReason] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const appendTelemetryBatch = useCallback((nextProgress: number) => {
    const ts = nowStamp();
    setLogLines((prev) => {
      const lines = PERSONA_AGENTS.map((agent) =>
        formatTelemetryLine(agent, nextProgress, ts)
      );
      return [...prev, ...lines].slice(-84);
    });
  }, []);

  const run = useCallback(() => {
    setPhase((current) => {
      if (current === "PAUSED") {
        return "RUNNING";
      }

      setLogLines([]);
      setDrawerOpen(false);
      setAnalysis(null);
      setAnalysisError(null);
      setManualLoginWaiting(false);
      setManualLoginSessionId(null);
      setManualLoginReason(null);
      setSelectedAgentId(PERSONA_AGENTS[0].id);
      setProgress(PROGRESS_STEP);
      appendTelemetryBatch(PROGRESS_STEP);
      return "RUNNING";
    });
  }, [appendTelemetryBatch]);

  const openManualLoginSession = useCallback(
    async (url: string, reason = "This page requires login before SimsAi can inspect it.") => {
      setAnalyzingUrl(true);
      setManualLoginWaiting(true);
      setManualLoginReason(reason);
      setAnalysisError(null);

      try {
        const response = await fetch("/api/manual-login/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "Could not open manual login browser");
        }

        const payload = (await response.json()) as { sessionId: string };
        setManualLoginSessionId(payload.sessionId);
        setManualLoginWaiting(true);
        setAnalyzingUrl(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not open manual login browser";
        setAnalysisError(
          message
        );
        setManualLoginWaiting(false);
        setManualLoginSessionId(null);
        setManualLoginReason(null);
        setAnalyzingUrl(false);
        setPhase((current) => (current === "RUNNING" || current === "PAUSED" ? "STOPPED" : current));
      }
    },
    []
  );

  const analyzeCurrentUrl = useCallback(async (url: string) => {
    setAnalyzingUrl(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "URL analysis failed");
      }

      const result = (await response.json()) as AnalyzeResponse;
      if (isLoginRequiredResponse(result)) {
        setAnalyzingUrl(false);
        setPhase("PAUSED");
        appendTelemetryBatch(Math.max(progress, PROGRESS_STEP));
        void openManualLoginSession(result.loginUrl || url, result.reason);
        return;
      }

      setAnalysis(result);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "URL analysis failed");
    } finally {
      setAnalyzingUrl(false);
    }
  }, [appendTelemetryBatch, openManualLoginSession, progress]);

  const runWithAnalysis = useCallback((urlOverride?: string) => {
    const analysisUrl = urlOverride ?? targetUrl;
    run();
    void analyzeCurrentUrl(analysisUrl);
  }, [analyzeCurrentUrl, run, targetUrl]);

  const runWithManualLogin = useCallback(async (urlOverride?: string) => {
    const analysisUrl = urlOverride ?? targetUrl;
    run();
    await openManualLoginSession(
      analysisUrl,
      "Manual login was requested before running the persona review."
    );
  }, [openManualLoginSession, run, targetUrl]);

  const continueManualLogin = useCallback(async () => {
    if (!manualLoginSessionId) {
      setAnalysisError("Manual login browser is still opening. Try again in a moment.");
      return;
    }
    setAnalyzingUrl(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/manual-login/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: manualLoginSessionId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Could not capture authenticated page");
      }

      const result = (await response.json()) as AnalyzeResult;
      setAnalysis(result);
      setManualLoginWaiting(false);
      setManualLoginSessionId(null);
      setManualLoginReason(null);
      setPhase("RUNNING");
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Could not capture authenticated page"
      );
      if (
        error instanceof Error &&
        error.message.includes("still looks like a login screen")
      ) {
        setManualLoginWaiting(true);
      } else {
        setManualLoginWaiting(false);
        setManualLoginSessionId(null);
        setManualLoginReason(null);
      }
    } finally {
      setAnalyzingUrl(false);
    }
  }, [manualLoginSessionId]);

  const pause = useCallback(() => {
    setPhase((p) => (p === "RUNNING" ? "PAUSED" : p));
  }, []);

  const stop = useCallback(() => {
    if (manualLoginSessionId) {
      void fetch("/api/manual-login/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: manualLoginSessionId }),
      });
    }
    setManualLoginWaiting(false);
    setManualLoginSessionId(null);
    setManualLoginReason(null);
    clearLoop();
    setPhase((p) => {
      if (p === "RUNNING" || p === "PAUSED") {
        return "STOPPED";
      }
      return p;
    });
  }, [clearLoop, manualLoginSessionId]);

  useEffect(() => {
    if (phase !== "RUNNING" || manualLoginWaiting) {
      clearLoop();
      return;
    }

    const id = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(100, prev + PROGRESS_STEP);
        appendTelemetryBatch(next);

        const activeIndex = Math.min(
          PERSONA_AGENTS.length - 1,
          Math.floor((next / 100) * PERSONA_AGENTS.length)
        );
        setSelectedAgentId(PERSONA_AGENTS[activeIndex].id);

        if (next >= 100) {
          clearInterval(id);
          intervalRef.current = null;
          queueMicrotask(() => {
            setPhase("COMPLETED");
          });
        }

        return next;
      });
    }, TICK_MS);

    intervalRef.current = id;
    return () => {
      clearInterval(id);
      intervalRef.current = null;
    };
  }, [phase, manualLoginWaiting, appendTelemetryBatch, clearLoop]);

  const agentRuns = useMemo(
    () => PERSONA_AGENTS.map((agent) => getAgentRuntime(agent, progress)),
    [progress]
  );

  const selectedAgent =
    agentRuns.find((agent) => agent.id === selectedAgentId) ?? agentRuns[0];

  const completedAgents = agentRuns.filter(
    (agent) => agent.status === "complete"
  ).length;

  return {
    phase,
    targetUrl,
    setTargetUrl,
    logLines,
    progress,
    completedAgents,
    drawerOpen,
    setDrawerOpen,
    reportRevealKey: progress,
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
    run: runWithAnalysis,
    runWithManualLogin,
    continueManualLogin,
    pause,
    stop,
    clearLoop,
  };
}
