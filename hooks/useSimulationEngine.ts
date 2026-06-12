"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SIMULATION_STEPS,
  SimulationPhase,
  formatTelemetryLine,
} from "@/lib/simulation";

const TICK_MS = 600;

function nowStamp(): string {
  const d = new Date();
  return d.toISOString().split("T")[1].slice(0, 12);
}

export function useSimulationEngine() {
  const [phase, setPhase] = useState<SimulationPhase>("IDLE");
  const [targetUrl, setTargetUrl] = useState("https://localhost:3000");
  const [logLines, setLogLines] = useState<string[]>([]);
  /** How many simulation steps have been logged (also next index to append). */
  const [progress, setProgress] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportRevealKey, setReportRevealKey] = useState(0);

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

  const appendStep = useCallback((index: number) => {
    const step = SIMULATION_STEPS[index];
    if (!step) return;
    const line = formatTelemetryLine(step, nowStamp());
    setLogLines((prev) => [...prev, line]);
  }, []);

  const run = useCallback(() => {
    setPhase((current) => {
      if (current === "PAUSED") {
        return "RUNNING";
      }
      setLogLines([]);
      setDrawerOpen(false);
      appendStep(0);
      setProgress(1);
      return "RUNNING";
    });
  }, [appendStep]);

  const pause = useCallback(() => {
    setPhase((p) => (p === "RUNNING" ? "PAUSED" : p));
  }, []);

  const stop = useCallback(() => {
    clearLoop();
    setPhase((p) => {
      if (p === "RUNNING" || p === "PAUSED") {
        queueMicrotask(() => {
          openReport();
        });
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
        if (prev >= SIMULATION_STEPS.length) {
          return prev;
        }
        appendStep(prev);
        const next = prev + 1;
        if (next >= SIMULATION_STEPS.length) {
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
  }, [phase, appendStep, clearLoop, openReport]);

  const viewStepIndex = Math.min(
    Math.max(0, progress - 1),
    SIMULATION_STEPS.length - 1
  );

  const stepsExecuted = SIMULATION_STEPS.slice(0, progress);

  return {
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
    clearLoop,
  };
}
