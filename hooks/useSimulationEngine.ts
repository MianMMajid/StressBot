"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TICK_MS,
  TOTAL_TICKS,
  VIRTUAL_USERS,
  SAUCEDEMO_STRESS_TARGETS,
  DEFAULT_TARGET_URL,
  buildTickLogEntries,
  type LogEvent,
  type CursorSnapshot,
  type ClickRingSnapshot,
  type SimulationPhase,
} from "@/lib/simulation";
import { compileStabilityReport } from "@/lib/report-compiler";

/**
 * Maps each virtual user to a real saucedemo.com element position for the
 * given tick. Each user gets a deterministically different target so all 10
 * attack different parts of the page simultaneously.
 */
function mutateCursors(tick: number): CursorSnapshot[] {
  const targets = SAUCEDEMO_STRESS_TARGETS;
  return VIRTUAL_USERS.map((u, i) => {
    const targetIdx = (tick * 3 + i * 7) % targets.length;
    const t = targets[targetIdx];
    const jx = Math.sin(tick * 1.3 + i * 2.7) * 0.025;
    const jy = Math.cos(tick * 1.1 + i * 3.1) * 0.025;
    return {
      userId: u.id,
      color: u.color,
      x: Math.min(0.97, Math.max(0.03, t.x + jx)),
      y: Math.min(0.95, Math.max(0.05, t.y + jy)),
    };
  });
}

function chaoticPayload(tick: number): string {
  const alphabet = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ01{}[]<>/%$#@";
  let s = "";
  const len = 8 + (tick % 11);
  for (let i = 0; i < len; i++) {
    s += alphabet[(tick * 17 + i * 31) % alphabet.length];
  }
  return s;
}

export function useSimulationEngine() {
  const [phase, setPhase] = useState<SimulationPhase>("IDLE");
  const [targetUrl, setTargetUrl] = useState(DEFAULT_TARGET_URL);
  const [logEntries, setLogEntries] = useState<LogEvent[]>([]);
  const [emittedTicks, setEmittedTicks] = useState(0);
  const [cursors, setCursors] = useState<CursorSnapshot[]>(() => mutateCursors(0));
  const [rings, setRings] = useState<ClickRingSnapshot[]>([]);
  const [nameStress, setNameStress] = useState(false);
  const [chaoticName, setChaoticName] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportRevealKey, setReportRevealKey] = useState(0);
  /** Dynamically compiled markdown — regenerated every time the run ends. */
  const [reportMarkdown, setReportMarkdown] = useState("");

  const ringId = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(phase);
  const tickRef = useRef(0);
  const runSeqRef = useRef(0);
  /**
   * Snapshot of logEntries kept in a ref so finalizeRun/stop can read the
   * current accumulated events without capturing a stale closure value.
   */
  const logEntriesRef = useRef<LogEvent[]>([]);
  const targetUrlRef = useRef(targetUrl);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { targetUrlRef.current = targetUrl; }, [targetUrl]);

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

  /**
   * Compiles the markdown report from whatever logEntries accumulated up to
   * the point of call.  Works correctly whether the run reached TOTAL_TICKS
   * naturally or was stopped early — the tick count is passed in explicitly.
   */
  const compileReport = useCallback(
    (entries: LogEvent[], ticks: number, status: "COMPLETED" | "STOPPED_EARLY") => {
      const md = compileStabilityReport({
        logEntries: entries,
        targetUrl: targetUrlRef.current,
        ticksCompleted: ticks,
        totalTicks: TOTAL_TICKS,
        status,
      });
      setReportMarkdown(md);
    },
    []
  );

  const applyVisualizationForTick = useCallback((tick: number) => {
    setCursors(mutateCursors(tick));
    setNameStress((tick % 4 === 0 || tick % 7 === 2) && tick > 0);
    setChaoticName(chaoticPayload(tick));

    setRings((prev) => {
      const aged = prev
        .map((r) => ({ ...r, r: r.r + 0.04 }))
        .filter((r) => r.r < 0.28);
      const add: ClickRingSnapshot[] = [];
      if (tick > 0 && tick % 2 === 0) {
        const cs = mutateCursors(tick);
        const pick = cs[(tick + 3) % cs.length];
        if (pick) {
          ringId.current += 1;
          add.push({ id: `ring-${ringId.current}`, x: pick.x, y: pick.y, r: 0.03 });
        }
      }
      return [...aged, ...add].slice(-24);
    });
  }, []);

  const finalizeRun = useCallback(() => {
    clearLoop();
    // Compile from the ref snapshot — state update hasn't flushed yet when
    // this callback fires from inside emitTick.
    compileReport(logEntriesRef.current, tickRef.current, "COMPLETED");
    setPhase("COMPLETED");
    queueMicrotask(openReport);
  }, [clearLoop, compileReport, openReport]);

  const emitTick = useCallback(() => {
    const tick = tickRef.current;
    if (tick >= TOTAL_TICKS) return;

    const runSeq = runSeqRef.current;
    const newEntries = buildTickLogEntries(tick).map((e) => ({
      ...e,
      id: `r${runSeq}-${e.id}`,
    }));

    // Update the ref synchronously so finalizeRun can read the full set.
    logEntriesRef.current = [...logEntriesRef.current, ...newEntries];
    setLogEntries((prev) => [...prev, ...newEntries]);
    applyVisualizationForTick(tick);

    tickRef.current = tick + 1;
    setEmittedTicks(tick + 1);

    if (tick + 1 >= TOTAL_TICKS) {
      finalizeRun();
    }
  }, [applyVisualizationForTick, finalizeRun]);

  const beginFreshRun = useCallback(() => {
    runSeqRef.current += 1;
    tickRef.current = 0;
    logEntriesRef.current = [];
    setEmittedTicks(0);
    setLogEntries([]);
    setRings([]);
    setDrawerOpen(false);
    setReportMarkdown("");
    emitTick();
  }, [emitTick]);

  const run = useCallback(() => {
    const current = phaseRef.current;
    if (current === "PAUSED") {
      setPhase("RUNNING");
      return;
    }
    beginFreshRun();
    setPhase("RUNNING");
  }, [beginFreshRun]);

  const pause = useCallback(() => {
    setPhase((p) => (p === "RUNNING" ? "PAUSED" : p));
  }, []);

  /** Stop early — compile the report from however many ticks ran. */
  const stop = useCallback(() => {
    clearLoop();
    const captured = logEntriesRef.current;
    const ticks    = tickRef.current;
    setPhase((p) => {
      if (p === "RUNNING" || p === "PAUSED") {
        compileReport(captured, ticks, "STOPPED_EARLY");
        queueMicrotask(openReport);
        return "COMPLETED";
      }
      return p;
    });
  }, [clearLoop, compileReport, openReport]);

  useEffect(() => {
    if (phase !== "RUNNING") {
      clearLoop();
      return;
    }
    const id = setInterval(emitTick, TICK_MS);
    intervalRef.current = id;
    return () => {
      clearInterval(id);
      intervalRef.current = null;
    };
  }, [phase, emitTick, clearLoop]);

  const tickProgressLabel = `${Math.min(emittedTicks, TOTAL_TICKS)}/${TOTAL_TICKS}`;

  return {
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
    clearLoop,
  };
}
