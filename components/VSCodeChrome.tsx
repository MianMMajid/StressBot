"use client";

/** Display-only VSCode chrome pieces: activity bar icons + explorer tree.
 *  Purely cosmetic — none of it is wired to real navigation. */

function Icon({ d, active }: { d: string; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#ffffff" : "#858585"}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const ACTIVITY_ICONS: { name: string; d: string; active?: boolean }[] = [
  {
    name: "Explorer",
    d: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5",
  },
  {
    name: "Search",
    d: "M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM21 21l-5-5",
  },
  {
    name: "Source Control",
    d: "M7 6a2 2 0 1 0 0-1zM7 7v10M7 19a2 2 0 1 0 0-1zM17 8a2 2 0 1 0 0-1zM17 9c0 4-4 4-8 5",
  },
  {
    name: "Run and Debug",
    d: "M8 5v14l11-7z",
    active: true,
  },
  {
    name: "Extensions",
    d: "M4 13h7v7H4zM13 4h7v7h-7zM4 4h7v7H4z",
  },
];

export function ActivityBar() {
  return (
    <div className="hidden w-12 shrink-0 flex-col items-center overflow-hidden border-r border-[#252526] bg-[#181818] py-1 md:flex">
      {ACTIVITY_ICONS.map((icon) => (
        <div
          key={icon.name}
          title={icon.name}
          className={`flex h-12 w-full items-center justify-center border-l-2 ${
            icon.active ? "border-white" : "border-transparent"
          }`}
        >
          <Icon d={icon.d} active={icon.active} />
        </div>
      ))}
      <div className="mt-auto flex h-12 w-full items-center justify-center border-l-2 border-transparent">
        <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.3 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.5 2 1.5A7 7 0 0 0 5 12" />
      </div>
    </div>
  );
}

type TreeRow = {
  label: string;
  depth: number;
  kind: "folder-open" | "folder-closed" | "ts" | "tsx" | "css" | "json" | "md";
  active?: boolean;
};

const FILE_TREE: TreeRow[] = [
  { label: ".next", depth: 0, kind: "folder-closed" },
  { label: "app", depth: 0, kind: "folder-open" },
  { label: "globals.css", depth: 1, kind: "css" },
  { label: "layout.tsx", depth: 1, kind: "tsx" },
  { label: "page.tsx", depth: 1, kind: "tsx" },
  { label: "components", depth: 0, kind: "folder-open" },
  { label: "SandboxViewportFrame.tsx", depth: 1, kind: "tsx", active: true },
  { label: "StressBotApp.tsx", depth: 1, kind: "tsx" },
  { label: "TelemetryTerminal.tsx", depth: 1, kind: "tsx" },
  { label: "VSCodeChrome.tsx", depth: 1, kind: "tsx" },
  { label: "hooks", depth: 0, kind: "folder-open" },
  { label: "useSimulationEngine.ts", depth: 1, kind: "ts" },
  { label: "lib", depth: 0, kind: "folder-open" },
  { label: "simulation.ts", depth: 1, kind: "ts" },
  { label: "ui-theme.ts", depth: 1, kind: "ts" },
  { label: "node_modules", depth: 0, kind: "folder-closed" },
  { label: "public", depth: 0, kind: "folder-closed" },
  { label: "package.json", depth: 0, kind: "json" },
  { label: "README.md", depth: 0, kind: "md" },
  { label: "tsconfig.json", depth: 0, kind: "json" },
];

function FileBadge({ kind }: { kind: TreeRow["kind"] }) {
  if (kind === "folder-open") {
    return <span className="w-3 shrink-0 text-[9px] text-[#c09553]">▾</span>;
  }
  if (kind === "folder-closed") {
    return <span className="w-3 shrink-0 text-[9px] text-[#c09553]">▸</span>;
  }
  const map: Record<string, { text: string; color: string }> = {
    ts: { text: "TS", color: "#519aba" },
    tsx: { text: "TS", color: "#519aba" },
    css: { text: "#", color: "#42a5f5" },
    json: { text: "{}", color: "#cbcb41" },
    md: { text: "M↓", color: "#519aba" },
  };
  const f = map[kind];
  return (
    <span
      className="w-3 shrink-0 text-center font-mono text-[8px] font-bold leading-none"
      style={{ color: f.color }}
      aria-hidden
    >
      {f.text}
    </span>
  );
}

export function ExplorerSidebar() {
  return (
    <aside className="hidden w-52 shrink-0 flex-col overflow-hidden border-r border-[#252526] bg-[#181818] lg:flex">
      <div className="flex shrink-0 items-center justify-between px-4 py-2">
        <span className="font-sans text-[10px] uppercase tracking-wider text-[#cccccc]/60">
          Explorer
        </span>
        <span className="text-[#cccccc]/40">···</span>
      </div>
      <div className="flex shrink-0 items-center gap-1 bg-[#252526] px-1.5 py-1">
        <span className="text-[9px] text-[#cccccc]">▾</span>
        <span className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#cccccc]">
          stressbot
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-0.5">
        {FILE_TREE.map((row) => (
          <div
            key={`${row.depth}-${row.label}`}
            className={`flex cursor-default items-center gap-1.5 py-[3px] pr-2 font-sans text-[11.5px] leading-tight ${
              row.active
                ? "bg-[#37373d] text-white"
                : "text-[#cccccc] hover:bg-[#2a2d2e]"
            }`}
            style={{ paddingLeft: 10 + row.depth * 14 }}
          >
            <FileBadge kind={row.kind} />
            <span className="truncate">{row.label}</span>
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-[#252526] px-4 py-1.5 font-sans text-[10px] uppercase tracking-wider text-[#cccccc]/60">
        ▸ Outline
      </div>
      <div className="shrink-0 px-4 pb-2 pt-0.5 font-sans text-[10px] uppercase tracking-wider text-[#cccccc]/60">
        ▸ Timeline
      </div>
    </aside>
  );
}
