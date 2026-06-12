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
  visibleText: string;
  screenshot: string | null;
  consoleErrors: string[];
  networkErrors: string[];
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
  visibleText: "",
  screenshot: null,
  consoleErrors: [],
  networkErrors: [],
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

  switch (agent.id) {
    case "maya":
      return {
        agentId: agent.id,
        summary: "First impression depends on the hero and first CTA.",
        quote: `I see "${trimEvidence(hero, 90)}", then I look for one action. The clearest button is "${trimEvidence(cta, 70)}".`,
        signal: hasClearCta
          ? "The first-time visitor can identify an action, but the page still needs instant positioning clarity."
          : "The first-time visitor does not get an obvious next action from the first screen.",
        recommendation:
          "Make the first heading say who this is for, what outcome it produces, and pair it with one primary CTA.",
        evidence: trimEvidence(hero),
        severity: hasClearCta ? "medium" : "high",
        confidence: 88,
      };
    case "daniel":
      return {
        agentId: agent.id,
        summary: "Budget evaluation depends on pricing, plan limits, and ROI proof.",
        quote: hasPricing
          ? "I can find pricing language, but I still need plan limits and a finance-friendly reason to buy."
          : "I cannot find pricing or plan language quickly, so I would need another page before I can justify this internally.",
        signal: hasPricing
          ? "Pricing exists, but buyer confidence depends on comparison detail."
          : "Budget buyer cannot evaluate cost from the inspected page.",
        recommendation:
          "Expose pricing or plan comparison near the buying CTA, including limits, saved time, and proof.",
        evidence: trimEvidence(pageText),
        severity: hasPricing ? "medium" : "high",
        confidence: 84,
      };
    case "priya":
      return {
        agentId: agent.id,
        summary: "Power users look for setup controls and configuration depth.",
        quote: `I found "${trimEvidence(form, 90)}" as the main configurable element. I need to know how much control I get after submit.`,
        signal:
          evidence.forms.length > 0
            ? "Configuration is discoverable, but advanced control is not yet obvious."
            : "Power users do not see a clear configuration path.",
        recommendation:
          "Show the setup fields, advanced options, and expected output before asking the user to commit.",
        evidence: trimEvidence(form),
        severity: evidence.forms.length > 0 ? "medium" : "high",
        confidence: 86,
      };
    case "luis":
      return {
        agentId: agent.id,
        summary: "Non-technical users need plain-language outcomes instead of internal product terms.",
        quote: `The page gives me "${trimEvidence(hero, 100)}". I need the page to tell me what problem gets fixed first.`,
        signal:
          pageText.length > 900
            ? "The page contains enough content, but the practical next action may be buried."
            : "The page may be too thin to explain the practical value.",
        recommendation:
          "Lead with three plain-language outcomes and avoid making the user decode product terminology.",
        evidence: trimEvidence(evidence.visibleText || hero),
        severity: "medium",
        confidence: 82,
      };
    case "ava":
      return {
        agentId: agent.id,
        summary: "Accessibility risk is inferred from page structure and interaction density.",
        quote: hasAccessibilityRisk
          ? "I see structural risk: many controls, missing headings, or dense form areas. Keyboard and screen-reader checks should be prioritized."
          : "The structure looks manageable, but I still need visible focus states and readable labels confirmed in-browser.",
        signal: hasAccessibilityRisk
          ? "Accessibility review should happen before shipping this flow."
          : "Accessibility risk is moderate, with focus states and labels still worth checking.",
        recommendation:
          "Check focus order, heading hierarchy, form labels, contrast, and keyboard operation on the captured page.",
        evidence: `${evidence.headings.length} headings, ${evidence.buttons.length} buttons, ${evidence.forms.length} form signals`,
        severity: hasAccessibilityRisk ? "critical" : "medium",
        confidence: 80,
      };
    case "marcus":
      return {
        agentId: agent.id,
        summary: "Security buyers need data-handling proof before they try the product.",
        quote: hasSecurity
          ? "I can see some trust or data language. I still need specifics about storage, recording, credentials, and audit logs."
          : "Before I paste a real URL or credentials, I need security, privacy, and data-retention details.",
        signal: hasSecurity
          ? "Trust language exists but may need concrete operational detail."
          : "Enterprise trust is under-explained on this surface.",
        recommendation:
          "Add a concise trust section covering data retention, credentials, recording, compliance, and auditability.",
        evidence: trimEvidence(pageText),
        severity: hasSecurity ? "medium" : "critical",
        confidence: 83,
      };
    default:
      return {
        agentId: agent.id,
        summary: "The research lead synthesizes recurring persona signals.",
        quote: `The strongest evidence is the inspected page structure: ${evidence.headings.length} headings, ${evidence.buttons.length} buttons, ${evidence.links.length} links.`,
        signal:
          "The page can be evaluated directionally from real extracted content, but human validation is still needed for high-stakes claims.",
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
    title: "Inspection blocked",
    visibleText: `The local browser could not inspect this URL. Reason: ${reason}`,
    networkErrors: [reason],
  });
}
