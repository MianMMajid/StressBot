"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function BugReportDrawer({
  open,
  onClose,
  markdown,
  revealKey,
}: {
  open: boolean;
  onClose: () => void;
  markdown: string;
  revealKey: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/80 transition-opacity duration-200 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-report-title"
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[88vh] border-t border-[#222222] bg-[#0A0A0A] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-8 pt-3">
          <div className="flex items-center justify-between gap-3 border-b border-[#222222] pb-3">
            <h2
              id="bug-report-title"
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-white"
            >
              Markdown bug report
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="border border-[#222222] bg-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#888888] hover:border-white hover:text-white"
            >
              Close
            </button>
          </div>
          <div
            key={revealKey}
            className="report-reveal max-h-[calc(88vh-5rem)] overflow-y-auto border border-[#222222] bg-black p-5"
          >
            <article className="markdown-report">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}
