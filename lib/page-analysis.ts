import { PERSONA_AGENTS, PersonaAgent } from "@/lib/simulation";

export interface PageEvidence {
  url: string;
  finalUrl: string;
  title: string;
  description: string;
  headings: string[];
  buttons: string[];
  links: string[];
  forms: string[];
  visitedPages?: Array<{
    url: string;
    title: string;
    headings: string[];
    buttons: string[];
    forms: string[];
  }>;
  visibleText: string;
  screenshot: string | null;
  consoleErrors: string[];
  networkErrors: string[];
  authChallenge?: {
    detected: boolean;
    reason: string;
  };
}

export interface PersonaFinding {
  agentId: string;
  summary: string;
  quote: string;
  signal: string;
  recommendation: string;
  evidence: string;
  severity: PersonaAgent["severity"];
  confidence: number;
}

export interface AnalyzeResult {
  evidence: PageEvidence;
  findings: PersonaFinding[];
}

const FALLBACK_EVIDENCE: PageEvidence = {
  url: "",
  finalUrl: "",
  title: "Unable to inspect page",
  description: "",
  headings: [],
  buttons: [],
  links: [],
  forms: [],
  visitedPages: [],
  visibleText: "",
  screenshot: null,
  consoleErrors: [],
  networkErrors: [],
  authChallenge: undefined,
};

function firstMeaningful(items: string[], fallback: string) {
  return items.find((item) => item.trim().length > 0)?.trim() ?? fallback;
}

function includesAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function trimEvidence(value: string, max = 180) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}...` : clean;
}

function listEvidence(label: string, items: string[], max = 4) {
  if (!items.length) return `${label}: none captured`;
  return `${label}: ${items.slice(0, max).map((item) => `"${trimEvidence(item, 52)}"`).join(", ")}`;
}

function buildFinding(agent: PersonaAgent, evidence: PageEvidence): PersonaFinding {
  const pageText = [
    evidence.title,
    evidence.description,
    evidence.headings.join(" "),
    evidence.buttons.join(" "),
    evidence.links.join(" "),
    evidence.forms.join(" "),
    evidence.visibleText,
  ].join(" ");

  const hero = firstMeaningful(
    [evidence.title, evidence.description, ...evidence.headings],
    "the first screen"
  );
  const cta = firstMeaningful(evidence.buttons, "no obvious primary button");
  const form = firstMeaningful(evidence.forms, "no visible form fields");
  const link = firstMeaningful(evidence.links, "no obvious navigation link");
  const hasPricing = includesAny(pageText, ["pricing", "price", "plan", "$", "billing"]);
  const hasSecurity = includesAny(pageText, [
    "security",
    "privacy",
    "soc 2",
    "gdpr",
    "compliance",
    "data",
  ]);
  const hasAccessibilityRisk =
    evidence.buttons.length > 12 || evidence.headings.length === 0 || evidence.forms.length > 4;
  const hasClearCta = evidence.buttons.length > 0;
  const pageName = evidence.title || evidence.finalUrl || evidence.url;

  switch (agent.id) {
    case "maya":
      return {
        agentId: agent.id,
        summary: "First impression depends on the hero and first CTA.",
        quote: `On ${trimEvidence(pageName, 60)}, I see "${trimEvidence(hero, 90)}", then I look for one action. The clearest button is "${trimEvidence(cta, 70)}".`,
        signal: hasClearCta
          ? "The first-time visitor can identify an action, but the page still needs instant positioning clarity."
          : "The first-time visitor does not get an obvious next action from the first screen.",
        recommendation:
          hasClearCta
            ? `Keep "${trimEvidence(cta, 50)}" visually dominant and make the top heading explain the outcome before supporting copy.`
            : "Add one primary above-the-fold CTA and make the first heading say who this is for and what outcome it produces.",
        evidence: `${listEvidence("Headings", evidence.headings, 3)}; ${listEvidence("Buttons", evidence.buttons, 3)}`,
        severity: hasClearCta ? "medium" : "high",
        confidence: 88,
      };
    case "daniel":
      return {
        agentId: agent.id,
        summary: "Budget evaluation depends on pricing, plan limits, and ROI proof.",
        quote: hasPricing
          ? `I found pricing-related language on ${trimEvidence(pageName, 60)}, but I still need plan limits and a finance-friendly reason to buy.`
          : `I scanned the captured text and navigation for pricing language, but ${trimEvidence(pageName, 60)} does not make cost easy to evaluate.`,
        signal: hasPricing
          ? "Pricing exists, but buyer confidence depends on comparison detail."
          : "Budget buyer cannot evaluate cost from the inspected page.",
        recommendation:
          hasPricing
            ? "Place plan limits, included usage, and ROI proof directly beside the pricing CTA."
            : "Add a visible Pricing or Plans path in the captured navigation and summarize what a buyer gets before signup.",
        evidence: `${listEvidence("Links", evidence.links, 5)}; ${listEvidence("Buttons", evidence.buttons, 4)}`,
        severity: hasPricing ? "medium" : "high",
        confidence: 84,
      };
    case "priya":
      return {
        agentId: agent.id,
        summary: "Power users look for setup controls and configuration depth.",
        quote: `I found "${trimEvidence(form, 90)}" as a configurable element on this page. I need to know how much control I get after submit.`,
        signal:
          evidence.forms.length > 0
            ? "Configuration is discoverable, but advanced control is not yet obvious."
            : "Power users do not see a clear configuration path.",
        recommendation:
          evidence.forms.length > 0
            ? "Label the setup fields with expected inputs and show the output users will receive after they submit."
            : "Show a clear setup path or configuration preview for advanced users before the generic CTA.",
        evidence: `${listEvidence("Form signals", evidence.forms, 6)}; ${listEvidence("Buttons", evidence.buttons, 4)}`,
        severity: evidence.forms.length > 0 ? "medium" : "high",
        confidence: 86,
      };
    case "luis":
      return {
        agentId: agent.id,
        summary: "Non-technical users need plain-language outcomes instead of internal product terms.",
        quote: `The page gives me "${trimEvidence(hero, 100)}". I need it to tell me what problem gets fixed first in plain language.`,
        signal:
          pageText.length > 900
            ? "The page contains enough content, but the practical next action may be buried."
            : "The page may be too thin to explain the practical value.",
        recommendation:
          `Add a plain-language outcome block near "${trimEvidence(hero, 55)}" that says what improves, where, and how fast.`,
        evidence: trimEvidence(evidence.visibleText || hero, 260),
        severity: "medium",
        confidence: 82,
      };
    case "ava":
      return {
        agentId: agent.id,
        summary: "Accessibility risk is inferred from page structure and interaction density.",
        quote: hasAccessibilityRisk
          ? `I see structural risk on ${trimEvidence(pageName, 60)}: ${evidence.headings.length} headings, ${evidence.buttons.length} buttons, and ${evidence.forms.length} form signals.`
          : `The structure of ${trimEvidence(pageName, 60)} looks manageable, but I still need visible focus states and readable labels confirmed in-browser.`,
        signal: hasAccessibilityRisk
          ? "Accessibility review should happen before shipping this flow."
          : "Accessibility risk is moderate, with focus states and labels still worth checking.",
        recommendation:
          evidence.headings.length === 0
            ? "Add a clear heading hierarchy and verify keyboard focus order before running deeper user tests."
            : "Check focus order, form labels, contrast, and keyboard operation on the captured page.",
        evidence: `${listEvidence("Headings", evidence.headings, 5)}; ${evidence.buttons.length} buttons; ${evidence.forms.length} form signals`,
        severity: hasAccessibilityRisk ? "critical" : "medium",
        confidence: 80,
      };
    case "marcus":
      return {
        agentId: agent.id,
        summary: "Security buyers need data-handling proof before they try the product.",
        quote: hasSecurity
          ? `I can see trust or data language on ${trimEvidence(pageName, 60)}. I still need specifics about storage, recording, credentials, and audit logs.`
          : `On ${trimEvidence(pageName, 60)}, I do not see enough security or privacy proof before sharing a real URL or credentials.`,
        signal: hasSecurity
          ? "Trust language exists but may need concrete operational detail."
          : "Enterprise trust is under-explained on this surface.",
        recommendation:
          hasSecurity
            ? "Turn the existing trust language into concrete operating details: retention, credentials, recording, compliance, and audit logs."
            : "Add a trust strip or security page link near the first CTA covering privacy, retention, credentials, and auditability.",
        evidence: `${listEvidence("Trust-related links", evidence.links.filter((item) => includesAny(item, ["privacy", "security", "terms", "compliance"])), 4)}; ${trimEvidence(pageText, 180)}`,
        severity: hasSecurity ? "medium" : "critical",
        confidence: 83,
      };
    default:
      return {
        agentId: agent.id,
        summary: "The research lead synthesizes recurring persona signals.",
        quote: `The strongest evidence is the inspected page structure: ${evidence.headings.length} headings, ${evidence.buttons.length} buttons, ${evidence.links.length} links.`,
        signal:
          `The page-specific review is based on "${trimEvidence(pageName, 70)}", captured DOM text, ${evidence.headings.length} headings, ${evidence.buttons.length} buttons, and a screenshot.`,
        recommendation:
          "Use the first six persona findings as a pre-test backlog, then validate the highest-severity issue with real users.",
        evidence: trimEvidence(link),
        severity: "low",
        confidence: 78,
      };
  }
}

export function analyzeEvidence(evidence: PageEvidence): AnalyzeResult {
  return {
    evidence,
    findings: PERSONA_AGENTS.map((agent) => buildFinding(agent, evidence)),
  };
}

export function buildFallbackAnalysis(url: string, reason: string): AnalyzeResult {
  return analyzeEvidence({
    ...FALLBACK_EVIDENCE,
    url,
    finalUrl: url,
    title: "Inspection blocked - fallback report",
    visibleText: `The local browser could not inspect this URL. Reason: ${reason}`,
    networkErrors: [reason],
  });
}
