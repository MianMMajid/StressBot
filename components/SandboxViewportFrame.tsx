"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { SimulationPhase } from "@/lib/simulation";
import type { CursorSnapshot, ClickRingSnapshot } from "@/lib/simulation";

function ChromeBar({ url }: { url: string }) {
  const display = url.replace(/^https?:\/\//, "").slice(0, 56);
  return (
    <div className="flex items-center gap-2 border-b border-[#1a1a1a] bg-[#2d2d2d] px-2 py-1.5">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" title="close" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" title="minimize" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" title="maximize" />
      </div>
      <div className="min-w-0 flex-1 border border-[#3c3c3c] bg-[#1e1e1e] px-2 py-0.5 font-mono text-[9px] text-[#9d9d9d]">
        {display}
      </div>
    </div>
  );
}

function drawCursor(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  color: string,
  label: string
) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-Math.PI / 4);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 14);
  ctx.lineTo(4, 11);
  ctx.lineTo(9, 16);
  ctx.lineTo(11, 14);
  ctx.lineTo(6, 9);
  ctx.lineTo(10, 8);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000000";
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = "600 9px ui-monospace, JetBrains Mono, monospace";
  const tx = px + 10;
  const ty = py - 6;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.strokeText(label, tx, ty);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, tx, ty);
  ctx.restore();
}

export function SandboxViewportFrame({
  phase,
  targetUrl,
  cursors,
  rings,
  nameStress,
  chaoticName,
  iframeKey,
}: {
  phase: SimulationPhase;
  targetUrl: string;
  cursors: CursorSnapshot[];
  rings: ClickRingSnapshot[];
  nameStress: boolean;
  chaoticName: string;
  iframeKey: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const cursorTargetsRef = useRef<CursorSnapshot[]>(cursors);
  const ringTargetsRef = useRef<ClickRingSnapshot[]>(rings);
  const phaseStateRef = useRef<SimulationPhase>(phase);
  const displayedCursorsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );
  const displayedRingsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => { cursorTargetsRef.current = cursors; }, [cursors]);
  useEffect(() => { ringTargetsRef.current = rings; }, [rings]);
  useEffect(() => { phaseStateRef.current = phase; }, [phase]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const layer = layerRef.current;
    if (!canvas || !layer) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let sizedW = 0;
    let sizedH = 0;

    const frame = () => {
      rafId = requestAnimationFrame(frame);

      const width = layer.clientWidth;
      const height = layer.clientHeight;
      if (width < 2 || height < 2) return;

      if (width !== sizedW || height !== sizedH) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        sizedW = width;
        sizedH = height;
      }

      const frozen = phaseStateRef.current === "PAUSED";
      const targets = cursorTargetsRef.current;
      const ringTargets = ringTargetsRef.current;
      const displayed = displayedCursorsRef.current;
      const displayedRings = displayedRingsRef.current;

      if (!frozen) {
        const EASE = 0.11;
        for (const t of targets) {
          const cur = displayed.get(t.userId);
          if (!cur) {
            displayed.set(t.userId, { x: t.x, y: t.y });
            continue;
          }
          cur.x += (t.x - cur.x) * EASE;
          cur.y += (t.y - cur.y) * EASE;
        }

        const RING_EASE = 0.18;
        const liveIds = new Set<string>();
        for (const r of ringTargets) {
          liveIds.add(r.id);
          const cur = displayedRings.get(r.id) ?? r.r * 0.4;
          displayedRings.set(r.id, cur + (r.r - cur) * RING_EASE);
        }
        for (const id of displayedRings.keys()) {
          if (!liveIds.has(id)) displayedRings.delete(id);
        }
      }

      ctx.clearRect(0, 0, width, height);
      const m = Math.min(width, height);

      for (const r of ringTargets) {
        const rad = (displayedRings.get(r.id) ?? r.r) * m;
        const fade = Math.max(0.15, 1 - r.r / 0.28);
        ctx.beginPath();
        ctx.arc(r.x * width, r.y * height, rad, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(54,117,136,${0.85 * fade})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (const t of targets) {
        const cur = displayed.get(t.userId) ?? { x: t.x, y: t.y };
        const cx = cur.x * width;
        const cy = cur.y * height;
        const tx = t.x * width;
        const ty = t.y * height;

        const dist = Math.hypot(tx - cx, ty - cy);
        if (!frozen && dist > 14) {
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([3, 4]);
          ctx.moveTo(cx, cy);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = `${t.color}55`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${t.color}66`;
          ctx.fill();
          ctx.restore();
        }

        drawCursor(ctx, cx, cy, t.color, t.userId);
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const frozen = phase === "PAUSED";

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-[#3c3c3c] bg-[#252526] ${frozen ? "opacity-90" : ""}`}
    >
      <ChromeBar url={targetUrl} />

      {/* The real saucedemo.com site + canvas overlay live together here */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
        {/* Local interactive Saucedemo mock for reliable demo behavior. */}
        <iframe
          key={iframeKey}
          src="/mock-saucedemo"
          title="www.saucedemo.com — stress target"
          className="absolute inset-0 h-full w-full border-0"
          loading="eager"
        />

        {/* Cursor + click-ring canvas — pinned over the iframe.
            IMPORTANT: pointer-events-none must be on the canvas element
            itself, not only the container div. CSS pointer-events:none on
            a parent does NOT propagate to children — without this, the
            canvas silently intercepts every click before it reaches the
            iframe below. */}
        <div
          ref={layerRef}
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          aria-hidden
        >
          <canvas
            ref={canvasRef}
            className="pointer-events-none block h-full w-full"
          />
        </div>

        {/* Stressbot status overlay — top-right corner */}
        <div className="pointer-events-none absolute right-2 top-2 z-20 w-[min(calc(100%-16px),200px)] border border-[#d0d0d0] bg-white/95 p-2 font-mono text-[9px] text-[#333333]">
          <div className="mb-1 truncate text-[#666666]">stressbot overlay</div>
          <label className="mb-0.5 block truncate text-[#666666]">
            Injected payload
          </label>
          <div
            className={`truncate border bg-[#fafafa] px-1.5 py-1 text-[#111111] ${
              nameStress
                ? "border-red-600 bg-[#fff5f5] text-red-700"
                : "border-[#cccccc]"
            }`}
          >
            {chaoticName || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
