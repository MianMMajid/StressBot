export type SimulationPhase =
  | "IDLE"
  | "RUNNING"
  | "PAUSED"
  | "STOPPED"
  | "COMPLETED";

export type AgentStatus = "queued" | "scanning" | "reasoning" | "complete";

export type FindingSeverity = "critical" | "high" | "medium" | "low";

export interface PersonaAgent {
  id: string;
  name: string;
  title: string;
  shorthand: string;
  productStage: string;
  persona: string;
  goal: string;
  emotionalContext: string;
  testFocus: string;
  browserScene: string;
  currentQuestion: string;
  quote: string;
  signal: string;
  recommendation: string;
  severity: FindingSeverity;
  confidence: number;
}

export interface ExampleFinding {
  id: string;
  agentId: string;
  title: string;
  evidence: string;
  impact: string;
  fix: string;
}

export interface AgentRuntime extends PersonaAgent {
  status: AgentStatus;
  progress: number;
}

export const PERSONA_AGENTS: PersonaAgent[] = [
  {
    id: "maya",
    name: "Maya Chen",
    title: "First-time founder",
    shorthand: "Clarity",
    productStage: "Homepage",
    persona:
      "29-year-old startup founder who landed from a social post and gives the product 45 seconds before moving on.",
    goal: "Understand what the product does and whether it is worth a demo.",
    emotionalContext: "Curious, rushed, and allergic to vague AI claims.",
    testFocus: "Value proposition, headline clarity, primary CTA.",
    browserScene: "Landing page hero with headline, subcopy, and a demo button.",
    currentQuestion: "Can I explain this product in one sentence after 10 seconds?",
    quote:
      "I know it uses AI agents, but I cannot tell whether this is for UX feedback, QA, conversion, or all three.",
    signal: "Positioning ambiguity blocks the first click.",
    recommendation:
      "Make the hero say: Seven AI personas inspect your product and return persona-specific UX feedback in minutes.",
    severity: "high",
    confidence: 92,
  },
  {
    id: "daniel",
    name: "Daniel Ortiz",
    title: "Budget owner",
    shorthand: "Pricing",
    productStage: "Pricing",
    persona:
      "41-year-old operations manager comparing three tools before asking finance for approval.",
    goal: "Find cost, limits, plan differences, and the business case.",
    emotionalContext: "Skeptical and ROI-driven after two disappointing vendor calls.",
    testFocus: "Pricing comprehension, plan comparison, procurement confidence.",
    browserScene: "Pricing table with starter, growth, and enterprise tiers.",
    currentQuestion: "What do I get at each tier, and what will finance ask me?",
    quote:
      "The price appears before I know what is included. I need usage limits, integrations, and proof this replaces manual reviews.",
    signal: "Buyer cannot build an internal case from the page.",
    recommendation:
      "Add a plan comparison row for runs per month, saved hours, data retention, and export controls.",
    severity: "medium",
    confidence: 88,
  },
  {
    id: "priya",
    name: "Priya Raman",
    title: "Product ops lead",
    shorthand: "Power",
    productStage: "Onboarding",
    persona:
      "36-year-old product ops lead who has configured research tools and wants control immediately.",
    goal: "Create a reusable persona panel for the team's staging app.",
    emotionalContext: "Impatient with tutorials but willing to configure a serious workflow.",
    testFocus: "Setup speed, configuration depth, dashboard hierarchy.",
    browserScene: "New test wizard with target URL, product type, and persona settings.",
    currentQuestion: "Can I define precise personas without fighting the UI?",
    quote:
      "Do not hide the controls. I want persona goals, patience level, expertise, device, and evidence format in one place.",
    signal: "Advanced users need visible control, not a black-box run button.",
    recommendation:
      "Add a compact persona editor with role, goal, context, patience, expertise, and device fields.",
    severity: "high",
    confidence: 90,
  },
  {
    id: "luis",
    name: "Luis Mercado",
    title: "Non-technical merchant",
    shorthand: "Plain English",
    productStage: "Dashboard",
    persona:
      "52-year-old e-commerce owner who wants practical fixes without learning research terminology.",
    goal: "See what is broken on his store and what to change first.",
    emotionalContext: "Busy, direct, and uncomfortable with technical jargon.",
    testFocus: "Plain-language output, prioritization, next action clarity.",
    browserScene: "Results dashboard with telemetry, scores, and findings.",
    currentQuestion: "Can I understand the result without a UX dictionary?",
    quote:
      "Telemetry and synthetic matrix sound impressive, but I just need to know which page loses customers and what copy to change.",
    signal: "The result page is too tool-centric for non-technical buyers.",
    recommendation:
      "Lead every report with three plain-language fixes, affected page, expected lift, and owner.",
    severity: "medium",
    confidence: 86,
  },
  {
    id: "ava",
    name: "Ava Brooks",
    title: "Accessibility reviewer",
    shorthand: "Access",
    productStage: "Keyboard flow",
    persona:
      "34-year-old keyboard-first user with low vision who depends on visible focus states and readable contrast.",
    goal: "Complete the core flow without a mouse and without eye strain.",
    emotionalContext: "Patient but precise; leaves when focus order or contrast breaks.",
    testFocus: "Keyboard navigation, contrast, labels, tap targets.",
    browserScene: "Dark UI with persona cards, terminal logs, and report drawer.",
    currentQuestion: "Can I operate the product if I cannot rely on tiny gray text?",
    quote:
      "The dark theme looks sharp, but the tiny gray labels and terminal-sized text make important controls easy to miss.",
    signal: "Accessibility risk in the exact demo surface judges will inspect.",
    recommendation:
      "Increase body copy size in panels, strengthen focus rings, and reserve tiny mono text for secondary metadata.",
    severity: "critical",
    confidence: 94,
  },
  {
    id: "marcus",
    name: "Marcus Reed",
    title: "Security evaluator",
    shorthand: "Trust",
    productStage: "Pre-signup",
    persona:
      "44-year-old security lead evaluating whether an AI testing tool can touch staging data.",
    goal: "Decide whether it is safe to paste a staging URL and credentials.",
    emotionalContext: "Cautious, policy-bound, and looking for audit evidence.",
    testFocus: "Data handling, permissions, session recording, compliance cues.",
    browserScene: "Connect target URL screen with credential and browser-run language.",
    currentQuestion: "What data leaves my environment, and can I audit the agent?",
    quote:
      "Before I enter a staging URL, I need to know if sessions are recorded, where data goes, and whether credentials are stored.",
    signal: "Trust gap stops enterprise trials before the product can prove value.",
    recommendation:
      "Add a security strip near the URL input: no code access, ephemeral sessions, redacted recordings, exportable audit log.",
    severity: "critical",
    confidence: 91,
  },
  {
    id: "nora",
    name: "Nora Singh",
    title: "Research lead",
    shorthand: "Synthesis",
    productStage: "Report",
    persona:
      "Senior UX researcher coordinating the panel and separating directional AI signals from claims that need human validation.",
    goal: "Synthesize the six persona runs into a credible product feedback brief.",
    emotionalContext: "Evidence-minded and careful not to oversell synthetic feedback.",
    testFocus: "Cross-persona themes, confidence, caveats, and next research steps.",
    browserScene: "Final report with severity matrix, agent quotes, and recommended fixes.",
    currentQuestion: "Which signals repeat, and which require real user follow-up?",
    quote:
      "The strongest demo is not that AI replaces research. It is that AI finds obvious persona-specific friction before you spend recruiting budget.",
    signal: "Synthesis needs caveats so the product feels credible.",
    recommendation:
      "Frame findings as directional pre-test feedback, then suggest which two issues deserve human validation.",
    severity: "low",
    confidence: 84,
  },
];

export const EXAMPLE_FINDINGS: ExampleFinding[] = PERSONA_AGENTS.slice(0, 6).map(
  (agent) => ({
    id: `${agent.id}-finding`,
    agentId: agent.id,
    title: agent.signal,
    evidence: agent.quote,
    impact: agent.currentQuestion,
    fix: agent.recommendation,
  })
);

export function getAgentRuntime(agent: PersonaAgent, progress: number): AgentRuntime {
  const stagger = PERSONA_AGENTS.findIndex((a) => a.id === agent.id) * 4;
  const adjusted = Math.max(0, Math.min(100, progress - stagger));
  const status: AgentStatus =
    adjusted >= 100
      ? "complete"
      : adjusted >= 58
        ? "reasoning"
        : adjusted > 0
          ? "scanning"
          : "queued";

  return {
    ...agent,
    status,
    progress: adjusted,
  };
}

export function formatTelemetryLine(agent: PersonaAgent, progress: number, ts: string) {
  const runtime = getAgentRuntime(agent, progress);
  return `[${ts}] <${agent.id.toUpperCase()}> ${agent.severity.toUpperCase()} ${runtime.status.toUpperCase()} ${runtime.progress}% :: ${agent.currentQuestion}`;
}

export function buildBugReportMarkdown(opts: {
  targetUrl: string;
  outcome: "COMPLETED" | "STOPPED";
  progress: number;
}): string {
  const { targetUrl, outcome, progress } = opts;
  const completed = Math.round((Math.min(progress, 100) / 100) * PERSONA_AGENTS.length);

  return `# SimsAi Persona Panel Report

**Target:** \`${targetUrl}\`  
**Outcome:** ${outcome}  
**Agents completed:** ${completed} / ${PERSONA_AGENTS.length}  
**Hardcoded demo findings:** ${EXAMPLE_FINDINGS.length}

---

## Executive Summary

Seven AI agents ran simultaneously against the product surface: six persona testers plus one research lead. The demo shows how the same product creates different friction for different users based on role, expertise, patience, risk tolerance, and buying context.

Use this as directional pre-test feedback. It is designed to catch obvious product, UX, trust, and accessibility problems before recruiting real users.

---

## Persona Findings

${EXAMPLE_FINDINGS.map((finding, index) => {
  const agent = PERSONA_AGENTS.find((a) => a.id === finding.agentId);
  if (!agent) return "";
  return `### ${index + 1}. ${agent.name} - ${agent.title}

**Persona:** ${agent.persona}  
**Goal:** ${agent.goal}  
**Signal:** ${finding.title}  
**Evidence:** "${finding.evidence}"  
**Impact question:** ${finding.impact}  
**Recommended fix:** ${finding.fix}  
**Severity:** ${agent.severity.toUpperCase()} | **Confidence:** ${agent.confidence}%
`;
}).join("\n")}

---

## Research Lead Synthesis

Nora found three cross-persona themes:

1. The positioning must say exactly what the AI agents inspect and what artifact the user receives.
2. The report should start with plain-language fixes before telemetry or technical traces.
3. Trust and accessibility need first-screen treatment because they block adoption before the product can demonstrate value.

---

## Suggested Hackathon Demo Script

1. Paste a URL.
2. Press **Run Persona Panel**.
3. Show seven agents running in parallel.
4. Click between persona cards and read each think-aloud quote.
5. Open this report and point to the six concrete findings.

*Generated by SimsAi - synthetic persona panel for fast product feedback.*
`;
}
