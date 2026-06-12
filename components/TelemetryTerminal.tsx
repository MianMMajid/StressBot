"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LogEvent, SimulationPhase } from "@/lib/simulation";
import { VIRTUAL_USERS } from "@/lib/simulation";
import {
  buildTechnicalTrace,
  translateTelemetry,
  type TranslationMode,
} from "@/lib/telemetry-translator";

type UserFilter = "ALL" | string;

function LogRow({
  event,
  viewMode,
  expanded,
  onToggle,
}: {
  event: LogEvent;
  viewMode: TranslationMode;
  expanded: boolean;
  onToggle: () => void;
}) {
  const primary = translateTelemetry(event, viewMode);

  return (
    <div className="border-b border-[#252526] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="grid w-full grid-cols-[84px_52px_1fr_16px] items-start gap-2 py-1 text-left hover:bg-[#1e1e1e]"
      >
        <span className="shrink-0 font-mono text-[10px] leading-snug text-[#cccccc]/45">
          {event.ts}
        </span>
        <span
          className="shrink-0 truncate font-mono text-[10px] font-semibold leading-snug"
          style={{ color: event.userColor }}
        >
          {event.user.replace("User_", "U")}
        </span>
        <span className="min-w-0 break-words font-mono text-[10px] leading-snug">
          {event.isCritical && (
            <span className="mr-1.5 inline-block bg-[#f44747] px-1 py-px align-middle font-sans text-[8px] font-bold uppercase leading-none tracking-wide text-white">
              Critical
            </span>
          )}
          <span
            className={event.isCritical ? "text-[#f44747]" : "text-[#cccccc]"}
          >
            {primary}
          </span>
        </span>
        <span className="shrink-0 pt-px text-center font-mono text-[9px] text-[#cccccc]/40">
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded && (
        <div className="log-expand mb-1.5 ml-[92px] mr-2">
          {viewMode === "friendly" ? (
            // Friendly mode → reveal the authentic raw console trace
            <pre className="overflow-x-auto border border-[#3c3c3c] bg-[#111111] px-3 py-2 font-mono text-[10px] leading-relaxed text-[#9cdcfe]">
              {buildTechnicalTrace(event)}
            </pre>
          ) : (
            // Technical mode → reveal the plain-language explanation
            <p className="border border-[#252526] bg-[#1e1e1e] px-3 py-2 font-sans text-[11px] italic leading-relaxed text-[#cccccc]/85">
              {translateTelemetry(event, "friendly")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function TelemetryTerminal({
  entries,
  phase,
  criticalOnly = false,
}: {
  entries: LogEvent[];
  phase: SimulationPhase;
  criticalOnly?: boolean;
}) {
  const [filter, setFilter] = useState<UserFilter>("ALL");
  const [viewMode, setViewMode] = useState<TranslationMode>("technical");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);

  // Base pool: full stream or critical-only depending on the panel mode.
  const baseEntries = useMemo(
    () => (criticalOnly ? entries.filter((e) => e.isCritical) : entries),
    [entries, criticalOnly]
  );

  const filtered = useMemo(
    () =>
      filter === "ALL"
        ? baseEntries
        : baseEntries.filter((e) => e.user === filter),
    [baseEntries, filter]
  );

  const countsByUser = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of baseEntries) {
      counts.set(e.user, (counts.get(e.user) ?? 0) + 1);
    }
    return counts;
  }, [baseEntries]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Auto-scroll ONLY this container (never the page), and only while the
  // reader is already pinned to the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [filtered.length, filter]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    atBottomRef.current = pinned;
    setAtBottom(pinned);
  };

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    atBottomRef.current = true;
    setAtBottom(true);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#181818]">
      {/* Toolbar: view-mode segmented toggle */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#252526] bg-[#181818] px-2 py-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#cccccc]/50">
          {criticalOnly ? (
            <span className="text-[#f44747]">⊗ Critical errors</span>
          ) : (
            "Telemetry stream"
          )}
        </span>
        <div
          role="group"
          aria-label="Log translation mode"
          className="flex border border-[#3c3c3c]"
        >
          <button
            type="button"
            onClick={() => setViewMode("friendly")}
            aria-pressed={viewMode === "friendly"}
            className={`px-2.5 py-1 font-sans text-[10px] transition-colors ${
              viewMode === "friendly"
                ? "bg-[#007acc] text-white"
                : "bg-[#1e1e1e] text-[#cccccc]/60 hover:text-[#cccccc]"
            }`}
          >
            User Friendly
          </button>
          <button
            type="button"
            onClick={() => setViewMode("technical")}
            aria-pressed={viewMode === "technical"}
            className={`border-l border-[#3c3c3c] px-2.5 py-1 font-sans text-[10px] transition-colors ${
              viewMode === "technical"
                ? "bg-[#007acc] text-white"
                : "bg-[#1e1e1e] text-[#cccccc]/60 hover:text-[#cccccc]"
            }`}
          >
            Technical
          </button>
        </div>
      </div>

      {/* User filter — auto-fit grid re-flows chips to any panel width */}
      <div className="grid shrink-0 grid-cols-[repeat(auto-fit,minmax(76px,1fr))] gap-1 border-b border-[#252526] bg-[#181818] p-1.5">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`flex min-w-0 items-center justify-center gap-1.5 border px-1.5 py-1 font-mono text-[9px] uppercase tracking-wide transition-colors ${
            filter === "ALL"
              ? "border-[#007acc] bg-[#04395e] text-white"
              : "border-[#3c3c3c] bg-[#1e1e1e] text-[#cccccc]/70 hover:bg-[#2d2d2d] hover:text-[#cccccc]"
          }`}
          title="Show every virtual user"
        >
          <span className="truncate">ALL</span>
          <span className="shrink-0 text-[#6a9955]">{baseEntries.length}</span>
        </button>
        {VIRTUAL_USERS.map((u) => {
          const active = filter === u.id;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => setFilter(u.id)}
              className={`flex min-w-0 items-center justify-center gap-1.5 border px-1.5 py-1 font-mono text-[9px] transition-colors ${
                active
                  ? "border-[#007acc] bg-[#04395e] text-white"
                  : "border-[#3c3c3c] bg-[#1e1e1e] text-[#cccccc]/70 hover:bg-[#2d2d2d] hover:text-[#cccccc]"
              }`}
              title={`Show only ${u.id}`}
            >
              <span
                className="h-1.5 w-1.5 shrink-0"
                style={{ backgroundColor: u.color }}
                aria-hidden
              />
              <span className="truncate">{u.id.replace("User_", "U")}</span>
              <span className="shrink-0 text-[#6a9955]">
                {countsByUser.get(u.id) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Column header */}
      <div className="grid shrink-0 grid-cols-[84px_52px_1fr_16px] gap-2 border-b border-[#252526] bg-[#181818] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#cccccc]/50">
        <span>Stamp</span>
        <span>User</span>
        <span className="flex min-w-0 items-center justify-between gap-2">
          Stream
          <span className="truncate normal-case tracking-normal text-[#6a9955]">
            {filter === "ALL" ? "all users" : filter} · {filtered.length} lines
            · click a row for the {viewMode === "friendly" ? "raw trace" : "plain-English view"}
          </span>
        </span>
        <span />
      </div>

      {/* Log stream */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1"
      >
        {filtered.length === 0 && (
          <div className="px-1 py-2 font-mono text-[10px] text-[#6a9955]">
            {phase === "IDLE"
              ? criticalOnly
                ? "// No critical errors yet — press ▷ Run to start the chaos run."
                : "// Press ▷ Run to start the chaos run — log lines stream here."
              : criticalOnly
              ? "// No critical errors for this user — they're holding up."
              : "// No lines for this user yet."}
          </div>
        )}
        {filtered.map((e) => (
          <LogRow
            key={e.id}
            event={e}
            viewMode={viewMode}
            expanded={expandedIds.has(e.id)}
            onToggle={() => toggleExpanded(e.id)}
          />
        ))}
      </div>

      {!atBottom && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-2.5 right-3.5 border border-[#007acc] bg-[#0e639c] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-white hover:bg-[#1177bb]"
        >
          ↓ Latest
        </button>
      )}
    </div>
  );
}
