"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PERSONA_AGENTS,
  SimulationPhase,
  formatTelemetryLine,
  getAgentRuntime,
} from "@/lib/simulation";

const TICK_MS = 520;
const PROGRESS_STEP = 8;

function nowStamp(): string {
  const d = new Date();
  return d.toISOString().split("T")[1].slice(0, 12);
}

export function useSimulationEngine() {
  const [phase, setPhase] = useState<SimulationPhase>("IDLE");
  const [targetUrl, setTargetUrl] = useState("https://acme-product.test");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportRevealKey, setReportRevealKey] = useState(0);
  const [selectedAgentId, setSelectedAgentId] = useState(PERSONA_AGENTS[0].id);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const openReport = useCallback(() => {
    setDrawerOpen(true);
    setReportRevealKey((k) => k + 1);
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
      setSelectedAgentId(PERSONA_AGENTS[0].id);
      setProgress(PROGRESS_STEP);
      appendTelemetryBatch(PROGRESS_STEP);
      return "RUNNING";
    });
  }, [appendTelemetryBatch]);

  const pause = useCallback(() => {
    setPhase((p) => (p === "RUNNING" ? "PAUSED" : p));
  }, []);

  const stop = useCallback(() => {
    clearLoop();
    setPhase((p) => {
      if (p === "RUNNING" || p === "PAUSED") {
        queueMicrotask(openReport);
        return "STOPPED";
      }
      return p;
    });
  }, [clearLoop, openReport]);

  useEffect(() => {
    if (phase !== "RUNNING") {
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
            openReport();
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
  }, [phase, appendTelemetryBatch, clearLoop, openReport]);

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
    reportRevealKey,
    selectedAgent,
    selectedAgentId,
    setSelectedAgentId,
    agentRuns,
    run,
    pause,
    stop,
    clearLoop,
  };
}
