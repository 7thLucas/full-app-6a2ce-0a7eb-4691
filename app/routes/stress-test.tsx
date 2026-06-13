import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FlaskConical,
  Zap,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingDown,
  Globe,
  Building2,
  Skull,
  Sword,
  Activity,
  BarChart3,
  FileText,
  ChevronRight,
  Archive,
  Shield,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";

// ─── CSS variable helpers ──────────────────────────────────────────────────
const C = {
  bg: "var(--me-bg)",
  bgSec: "var(--me-bg-secondary)",
  border: "var(--me-border)",
  gold: "var(--me-gold)",
  blue: "var(--me-blue)",
  success: "var(--me-success)",
  danger: "var(--me-danger)",
  warning: "var(--me-warning)",
  textPri: "var(--me-text-primary)",
  textSec: "var(--me-text-secondary)",
};

// ─── TYPES ─────────────────────────────────────────────────────────────────
type SimPhase = "idle" | "loading" | "complete";
type PlaybookStatus = "GENERATED" | "IMPLEMENTED" | "ARCHIVED";

interface Scenario {
  id: string;
  emoji: string;
  name: string;
  riskPct: number;
  impactT: number;
  affectedNations: number;
  isShowcase?: boolean;
}

interface CascadeMonth {
  month: number;
  event: string;
  indicators: string[];
  institutions: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface PlaybookAction {
  priority: "P1" | "P2" | "P3";
  action: string;
  institution: string;
  cost: string;
  successPct: number;
}

interface PlaybookPhase {
  phase: string;
  timeframe: string;
  actions: PlaybookAction[];
}

interface HistoryEntry {
  id: string;
  scenario: string;
  date: string;
  severityScore: number;
  keyFinding: string;
  status: PlaybookStatus;
}

// ─── SCENARIO LIBRARY DATA ─────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  {
    id: "hyperinflation",
    emoji: "🔥",
    name: "Hyperinflation Spiral",
    riskPct: 23.4,
    impactT: 18.7,
    affectedNations: 34,
    isShowcase: true,
  },
  {
    id: "sovereign-default",
    emoji: "💀",
    name: "Sovereign Debt Default",
    riskPct: 31.2,
    impactT: 12.4,
    affectedNations: 18,
  },
  {
    id: "bank-run",
    emoji: "🏦",
    name: "Bank Run Cascade",
    riskPct: 19.8,
    impactT: 9.1,
    affectedNations: 22,
  },
  {
    id: "currency-war",
    emoji: "⚔️",
    name: "Currency War",
    riskPct: 44.7,
    impactT: 7.3,
    affectedNations: 67,
  },
  {
    id: "pandemic-shock",
    emoji: "🌍",
    name: "Pandemic Supply Shock",
    riskPct: 28.1,
    impactT: 22.6,
    affectedNations: 142,
  },
  {
    id: "flash-crash",
    emoji: "⚡",
    name: "Flash Crash Contagion",
    riskPct: 38.9,
    impactT: 5.8,
    affectedNations: 89,
  },
];

// ─── CASCADE TIMELINE DATA (Hyperinflation) ───────────────────────────────
const HYPERINFLATION_CASCADE: CascadeMonth[] = [
  {
    month: 1,
    event: "Emergency money printing authorized — +40% M2 expansion",
    indicators: ["M2 +40%", "CPI +2.1%", "FX stable"],
    institutions: ["Central Bank", "Treasury"],
    severity: "MEDIUM",
  },
  {
    month: 3,
    event: "Inflation acceleration — central bank credibility questioned",
    indicators: ["CPI +15%", "Bond yield +380bps", "M2 +120%"],
    institutions: ["Central Bank", "IMF Watch"],
    severity: "HIGH",
  },
  {
    month: 6,
    event: "Currency devaluation accelerates — capital flight begins",
    indicators: ["FX -30%", "CPI +48%", "Capital outflow $240B"],
    institutions: ["Central Bank", "Commercial Banks", "IMF"],
    severity: "HIGH",
  },
  {
    month: 9,
    event: "Bank runs begin — deposit withdrawals surge 340%",
    indicators: ["Deposit withdrawal +340%", "Liquidity ratio 61%", "USD demand +900%"],
    institutions: ["7 Major Banks", "Payment Processors", "IMF Emergency"],
    severity: "CRITICAL",
  },
  {
    month: 12,
    event: "Currency collapse — nominal hyperinflation threshold crossed",
    indicators: ["Inflation +1,200%/yr", "FX -89%", "GDP -22%"],
    institutions: ["All Commercial Banks", "G7 Emergency", "World Bank"],
    severity: "CRITICAL",
  },
  {
    month: 15,
    event: "IMF emergency intervention — $47B SDR package deployed",
    indicators: ["IMF +$47B", "Rate 285%", "FX floor established"],
    institutions: ["IMF", "World Bank", "Central Bank"],
    severity: "HIGH",
  },
  {
    month: 18,
    event: "Recovery protocol activated — monetary reform framework launched",
    indicators: ["Inflation -62% MoM", "FX +18%", "Confidence +24pt"],
    institutions: ["New Central Bank Board", "IMF Technical Mission", "G20"],
    severity: "MEDIUM",
  },
];

// ─── CASCADE CHART DATA ────────────────────────────────────────────────────
const CASCADE_CHART_DATA = [
  { month: "M0", currencyValue: 100, confidence: 95 },
  { month: "M1", currencyValue: 96, confidence: 88 },
  { month: "M3", currencyValue: 78, confidence: 64 },
  { month: "M6", currencyValue: 52, confidence: 38 },
  { month: "M9", currencyValue: 28, confidence: 18 },
  { month: "M12", currencyValue: 11, confidence: 7 },
  { month: "M15", currencyValue: 14, confidence: 22 },
  { month: "M18", currencyValue: 19, confidence: 41 },
];

// ─── PLAYBOOK DATA (Hyperinflation) ──────────────────────────────────────
const HYPERINFLATION_PLAYBOOK: PlaybookPhase[] = [
  {
    phase: "IMMEDIATE",
    timeframe: "0–72 hours",
    actions: [
      {
        priority: "P1",
        action: "Emergency rate hike to 35%",
        institution: "Central Bank",
        cost: "$0 (policy)",
        successPct: 61,
      },
      {
        priority: "P1",
        action: "Initiate IMF emergency contact — Article IV consultation",
        institution: "Treasury / Ministry of Finance",
        cost: "$0 (diplomatic)",
        successPct: 88,
      },
      {
        priority: "P1",
        action: "Capital controls — 72h freeze on non-essential FX outflows",
        institution: "Central Bank",
        cost: "$2.1B reserves",
        successPct: 72,
      },
    ],
  },
  {
    phase: "SHORT-TERM",
    timeframe: "1–4 weeks",
    actions: [
      {
        priority: "P1",
        action: "Activate bilateral currency swap lines with G7 partners",
        institution: "Central Bank / G7 Partners",
        cost: "$18B swap facility",
        successPct: 79,
      },
      {
        priority: "P2",
        action: "Deploy FX reserves to defend currency floor",
        institution: "Central Bank",
        cost: "$24B reserves",
        successPct: 55,
      },
      {
        priority: "P2",
        action: "Pause sovereign debt issuance — defer maturity rollovers",
        institution: "Treasury",
        cost: "Liquidity delay",
        successPct: 83,
      },
    ],
  },
  {
    phase: "MEDIUM-TERM",
    timeframe: "1–6 months",
    actions: [
      {
        priority: "P1",
        action: "Comprehensive monetary reform — new currency peg or float protocol",
        institution: "Central Bank + IMF Technical Mission",
        cost: "$47B IMF SDR package",
        successPct: 68,
      },
      {
        priority: "P2",
        action: "Central bank credibility restoration — independent board mandate",
        institution: "Central Bank",
        cost: "Institutional reform",
        successPct: 74,
      },
      {
        priority: "P3",
        action: "International coordination framework — G20 stabilization declaration",
        institution: "G20 Secretariat",
        cost: "$0 (multilateral)",
        successPct: 62,
      },
    ],
  },
];

// ─── SIMULATION HISTORY ───────────────────────────────────────────────────
const INITIAL_HISTORY: HistoryEntry[] = [
  {
    id: "h1",
    scenario: "Pandemic Supply Shock",
    date: "2026-05-14",
    severityScore: 78,
    keyFinding: "Supply chain collapse amplifies inflation beyond central bank tools",
    status: "IMPLEMENTED",
  },
  {
    id: "h2",
    scenario: "Currency War",
    date: "2026-04-22",
    severityScore: 52,
    keyFinding: "Competitive devaluation rebounds within 8 months with G7 coordination",
    status: "ARCHIVED",
  },
  {
    id: "h3",
    scenario: "Flash Crash Contagion",
    date: "2026-03-08",
    severityScore: 64,
    keyFinding: "Liquidity freeze in overnight repo triggers 48h system-wide halt",
    status: "ARCHIVED",
  },
  {
    id: "h4",
    scenario: "Sovereign Debt Default",
    date: "2026-02-11",
    severityScore: 88,
    keyFinding: "Credit event triggers CDS chain reaction across 14 counterparties",
    status: "GENERATED",
  },
];

// ─── LOADING SEQUENCE MESSAGES ─────────────────────────────────────────────
const LOADING_MSGS = [
  "AGI INITIALIZING...",
  "LOADING MACRO VARIABLES...",
  "RUNNING 10,000 MONTE CARLO SCENARIOS...",
  "IDENTIFYING CRITICAL PATH...",
  "COMPUTING CASCADE PROBABILITIES...",
  "GENERATING SOVEREIGN RESPONSE MATRIX...",
  "FINALIZING RISK ASSESSMENT...",
];

// ─── SEVERITY COLOR HELPER ─────────────────────────────────────────────────
function severityColor(s: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") {
  if (s === "CRITICAL") return "#ef4444";
  if (s === "HIGH") return "#f97316";
  if (s === "MEDIUM") return "#f59e0b";
  return "#22c55e";
}

function priorityColor(p: "P1" | "P2" | "P3") {
  if (p === "P1") return { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" };
  if (p === "P2") return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" };
  return { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" };
}

function statusColor(s: PlaybookStatus) {
  if (s === "GENERATED") return { color: "#d4a017", bg: "rgba(212,160,23,0.1)", border: "rgba(212,160,23,0.25)" };
  if (s === "IMPLEMENTED") return { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" };
  return { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" };
}

// ─── RISK GAUGE COMPONENT ──────────────────────────────────────────────────
function RiskGauge({ pct, label }: { pct: number; label: string }) {
  const r = 64;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);
  const color = pct > 50 ? "#ef4444" : pct > 30 ? "#f59e0b" : "#d4a017";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Track */}
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          {/* Progress */}
          <motion.circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
            transform="rotate(-90 80 80)"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold font-mono"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {pct}%
          </motion.span>
          <span className="text-xs mt-0.5" style={{ color: C.textSec }}>
            probability
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold" style={{ color: C.textPri }}>
          {label}
        </div>
        <div className="text-xs mt-0.5" style={{ color: C.textSec }}>
          5-year risk window
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOM TOOLTIP ────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{ background: "rgba(10,15,46,0.97)", border: "1px solid rgba(212,160,23,0.3)", color: C.textPri }}
    >
      <p className="font-semibold mb-1" style={{ color: C.gold }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}
          {p.dataKey === "currencyValue" || p.dataKey === "confidence" ? "%" : ""}
        </p>
      ))}
    </div>
  );
};

// ─── SLIDER COMPONENT ──────────────────────────────────────────────────────
function ParamSlider({
  label,
  min,
  max,
  value,
  unit,
  onChange,
  color = "#d4a017",
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: C.textSec }}>
          {label}
        </span>
        <span className="text-xs font-bold font-mono" style={{ color }}>
          {value}
          {unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 1 }}
        />
      </div>
      <div className="flex justify-between text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function StressTestSimulator() {
  const [activeTab, setActiveTab] = useState<"library" | "custom">("library");
  const [selectedScenario, setSelectedScenario] = useState<string>("hyperinflation");
  const [simPhase, setSimPhase] = useState<SimPhase>("idle");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [loadingPct, setLoadingPct] = useState(0);
  const [revealedMonths, setRevealedMonths] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);

  // Custom scenario params
  const [inflationRate, setInflationRate] = useState(120);
  const [m2Growth, setM2Growth] = useState(60);
  const [fxPressure, setFxPressure] = useState(45);
  const [reserveDepletion, setReserveDepletion] = useState(18);
  const [gdpContraction, setGdpContraction] = useState(-12);
  const [unemploymentRate, setUnemploymentRate] = useState(15);
  const [debtGdp, setDebtGdp] = useState(140);

  // Severity score (computed from sliders)
  const severityScore = Math.min(
    100,
    Math.round(
      (inflationRate / 500) * 30 +
        (m2Growth / 200) * 15 +
        (fxPressure / 100) * 15 +
        (reserveDepletion / 100) * 15 +
        (Math.abs(gdpContraction) / 50) * 12 +
        (unemploymentRate / 50) * 8 +
        ((debtGdp - 50) / 250) * 5
    )
  );

  // Run simulation
  function runSimulation() {
    if (simPhase === "loading") return;
    setSimPhase("loading");
    setLoadingPct(0);
    setLoadingMsgIdx(0);
    setRevealedMonths([]);

    let pct = 0;
    let msgIdx = 0;

    const interval = setInterval(() => {
      pct += Math.random() * 12 + 4;
      if (pct >= 100) pct = 100;
      setLoadingPct(Math.round(pct));

      const newMsgIdx = Math.min(
        LOADING_MSGS.length - 1,
        Math.floor((pct / 100) * LOADING_MSGS.length)
      );
      if (newMsgIdx !== msgIdx) {
        msgIdx = newMsgIdx;
        setLoadingMsgIdx(newMsgIdx);
      }

      if (pct >= 100) {
        clearInterval(interval);
        setSimPhase("complete");

        // Reveal cascade months sequentially
        HYPERINFLATION_CASCADE.forEach((m, i) => {
          setTimeout(() => {
            setRevealedMonths((prev) => [...prev, m.month]);
          }, i * 300);
        });

        // Add to history
        const scenario = SCENARIOS.find((s) => s.id === selectedScenario);
        if (scenario) {
          const entry: HistoryEntry = {
            id: `h${Date.now()}`,
            scenario: scenario.name,
            date: new Date().toISOString().slice(0, 10),
            severityScore: activeTab === "custom" ? severityScore : Math.round(scenario.riskPct * 2.1),
            keyFinding: "AGI simulation complete — sovereign response playbook generated",
            status: "GENERATED",
          };
          setHistory((prev) => [entry, ...prev]);
        }
      }
    }, 120);
  }

  const selectedScenarioData = SCENARIOS.find((s) => s.id === selectedScenario);

  return (
    <AppLayout>
      <Header
        title="AI Economic Stress Test Simulator"
        subtitle="AGI-Powered Sovereign Crisis Modeling — 10,000-Scenario Monte Carlo Engine"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* ── Header Status Bar ──────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <FlaskConical size={15} style={{ color: "#ef4444" }} />
          <span className="text-sm font-medium" style={{ color: "#ef4444" }}>
            STRESS TEST ENGINE — READY
          </span>
          <div
            className="w-1.5 h-1.5 rounded-full ml-1"
            style={{ background: "#ef4444", boxShadow: "0 0 6px #ef4444" }}
          />
          <span className="ml-auto text-xs font-mono" style={{ color: C.textSec }}>
            Model: CRISIS-MIND-v4.1 | Scenarios: 10,000 | Confidence: 94.2%
          </span>
          <div
            className="px-2 py-0.5 rounded text-xs font-semibold font-mono"
            style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
          >
            AGI ARMED
          </div>
        </div>

        {/* ── SECTION 1: Scenario Library / Custom Builder ───────────────── */}
        <div className="me-card p-5">
          {/* Tab Row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} style={{ color: C.gold }} />
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: C.textPri }}>
                Scenario Selection
              </h2>
            </div>
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {(["library", "custom"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all"
                  style={{
                    background: activeTab === tab ? "rgba(212,160,23,0.15)" : "transparent",
                    color: activeTab === tab ? C.gold : C.textSec,
                    borderRight: tab === "library" ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}
                >
                  {tab === "library" ? "Scenario Library" : "Custom Builder"}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "library" ? (
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {SCENARIOS.map((sc) => {
                  const isSelected = selectedScenario === sc.id;
                  return (
                    <div
                      key={sc.id}
                      className="rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200"
                      style={{
                        background: isSelected
                          ? "rgba(212,160,23,0.06)"
                          : sc.isShowcase
                          ? "rgba(212,160,23,0.03)"
                          : "rgba(255,255,255,0.02)",
                        border: isSelected
                          ? "1px solid rgba(212,160,23,0.6)"
                          : sc.isShowcase
                          ? "1px solid rgba(212,160,23,0.25)"
                          : "1px solid rgba(255,255,255,0.07)",
                        boxShadow: isSelected
                          ? "0 0 18px rgba(212,160,23,0.18)"
                          : sc.isShowcase
                          ? "0 0 8px rgba(212,160,23,0.06)"
                          : "none",
                      }}
                      onClick={() => setSelectedScenario(sc.id)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl leading-none">{sc.emoji}</span>
                          <div>
                            <div
                              className="text-sm font-bold leading-tight"
                              style={{ color: isSelected ? C.gold : C.textPri }}
                            >
                              {sc.name}
                            </div>
                            {sc.isShowcase && (
                              <div
                                className="text-xs font-mono mt-0.5"
                                style={{ color: C.gold, opacity: 0.8 }}
                              >
                                SHOWCASE
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle size={16} style={{ color: C.gold, flexShrink: 0 }} />
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg p-2 text-center" style={{ background: "rgba(239,68,68,0.06)" }}>
                          <div className="text-xs font-bold font-mono" style={{ color: "#ef4444" }}>
                            {sc.riskPct}%
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: C.textSec, fontSize: 9 }}>
                            Risk Prob.
                          </div>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: "rgba(212,160,23,0.06)" }}>
                          <div className="text-xs font-bold font-mono" style={{ color: C.gold }}>
                            ${sc.impactT}T
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: C.textSec, fontSize: 9 }}>
                            Est. Impact
                          </div>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: "rgba(59,130,246,0.06)" }}>
                          <div className="text-xs font-bold font-mono" style={{ color: "#3b82f6" }}>
                            {sc.affectedNations}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: C.textSec, fontSize: 9 }}>
                            Nations
                          </div>
                        </div>
                      </div>

                      {/* Select button */}
                      <button
                        className="w-full py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
                        style={{
                          background: isSelected
                            ? "rgba(212,160,23,0.18)"
                            : "rgba(255,255,255,0.04)",
                          color: isSelected ? C.gold : C.textSec,
                          border: `1px solid ${isSelected ? "rgba(212,160,23,0.4)" : "rgba(255,255,255,0.08)"}`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScenario(sc.id);
                        }}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="custom"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sliders */}
                  <div className="lg:col-span-2 space-y-5">
                    <ParamSlider
                      label="Inflation Rate"
                      min={0}
                      max={500}
                      value={inflationRate}
                      unit="%"
                      onChange={setInflationRate}
                      color="#ef4444"
                    />
                    <ParamSlider
                      label="M2 Growth Rate"
                      min={0}
                      max={200}
                      value={m2Growth}
                      unit="%"
                      onChange={setM2Growth}
                      color="#f97316"
                    />
                    <ParamSlider
                      label="FX Pressure Index"
                      min={0}
                      max={100}
                      value={fxPressure}
                      unit=""
                      onChange={setFxPressure}
                      color="#f59e0b"
                    />
                    <ParamSlider
                      label="Reserve Depletion Rate"
                      min={0}
                      max={100}
                      value={reserveDepletion}
                      unit="%/mo"
                      onChange={setReserveDepletion}
                      color="#d4a017"
                    />
                    <ParamSlider
                      label="GDP Contraction"
                      min={-50}
                      max={0}
                      value={gdpContraction}
                      unit="%"
                      onChange={setGdpContraction}
                      color="#8b5cf6"
                    />
                    <ParamSlider
                      label="Unemployment Rate"
                      min={0}
                      max={50}
                      value={unemploymentRate}
                      unit="%"
                      onChange={setUnemploymentRate}
                      color="#3b82f6"
                    />
                    <ParamSlider
                      label="Sovereign Debt / GDP"
                      min={50}
                      max={300}
                      value={debtGdp}
                      unit="%"
                      onChange={setDebtGdp}
                      color="#22c55e"
                    />
                  </div>

                  {/* Severity Gauge */}
                  <div className="flex flex-col items-center justify-center gap-4 rounded-xl p-5"
                    style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.textSec }}>
                      Scenario Severity Score
                    </div>
                    <RiskGauge pct={severityScore} label="Custom Scenario" />
                    <div
                      className="text-xs text-center px-3 py-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.03)", color: C.textSec }}
                    >
                      Adjust sliders to model<br />your custom crisis scenario
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RUN SIMULATION BUTTON ──────────────────────────────────────── */}
        <div className="flex items-center justify-center">
          <button
            onClick={runSimulation}
            disabled={simPhase === "loading"}
            className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-200"
            style={{
              background:
                simPhase === "loading"
                  ? "rgba(239,68,68,0.15)"
                  : "linear-gradient(135deg, rgba(239,68,68,0.9), rgba(180,30,30,0.9))",
              color: "#fff",
              border: "1px solid rgba(239,68,68,0.5)",
              boxShadow:
                simPhase !== "loading"
                  ? "0 0 24px rgba(239,68,68,0.35), 0 4px 16px rgba(0,0,0,0.4)"
                  : "none",
              cursor: simPhase === "loading" ? "not-allowed" : "pointer",
              opacity: simPhase === "loading" ? 0.7 : 1,
            }}
          >
            {simPhase === "loading" ? (
              <>
                <div
                  className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
                  style={{ borderTopColor: "#ef4444", borderRightColor: "rgba(239,68,68,0.3)" }}
                />
                SIMULATING...
              </>
            ) : (
              <>
                <Play size={16} />
                Run AGI Simulation
              </>
            )}
          </button>
        </div>

        {/* ── SECTION 2: AGI Cascade Simulation Viewer ──────────────────── */}
        <AnimatePresence>
          {(simPhase === "loading" || simPhase === "complete") && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="me-card p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap size={14} style={{ color: C.gold }} />
                <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: C.textPri }}>
                  AGI Cascade Simulation Viewer
                </h2>
                {simPhase === "complete" && (
                  <span
                    className="ml-2 text-xs px-2 py-0.5 rounded font-mono"
                    style={{ background: "rgba(212,160,23,0.1)", color: C.gold, border: "1px solid rgba(212,160,23,0.25)" }}
                  >
                    SIMULATION COMPLETE
                  </span>
                )}
              </div>

              {/* Loading sequence */}
              {simPhase === "loading" && (
                <div className="space-y-4 py-6">
                  <div className="text-center">
                    <motion.div
                      className="text-lg font-bold font-mono mb-2"
                      style={{ color: C.gold }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      {LOADING_MSGS[loadingMsgIdx]}
                    </motion.div>
                    <div className="text-sm font-mono" style={{ color: C.textSec }}>
                      {loadingPct}% complete
                    </div>
                  </div>
                  <div
                    className="rounded-full h-2 overflow-hidden mx-8"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #ef4444, #d4a017)",
                        width: `${loadingPct}%`,
                        boxShadow: "0 0 12px rgba(239,68,68,0.5)",
                      }}
                      animate={{ width: `${loadingPct}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <div className="flex justify-center gap-1.5 mt-2">
                    {LOADING_MSGS.map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full transition-all"
                        style={{
                          background: i <= loadingMsgIdx ? C.gold : "rgba(255,255,255,0.1)",
                          boxShadow: i === loadingMsgIdx ? `0 0 6px ${C.gold}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Cascade Timeline */}
              {simPhase === "complete" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Timeline */}
                  <div className="lg:col-span-2 space-y-3">
                    <h3 className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: C.textSec }}>
                      Month-by-Month Cascade — Hyperinflation Spiral
                    </h3>
                    {HYPERINFLATION_CASCADE.map((item, idx) => (
                      <AnimatePresence key={item.month}>
                        {revealedMonths.includes(item.month) && (
                          <motion.div
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35 }}
                            className="flex gap-4"
                          >
                            {/* Month badge + connector */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0"
                                style={{
                                  background: `rgba(${severityColor(item.severity) === "#ef4444" ? "239,68,68" : severityColor(item.severity) === "#f97316" ? "249,115,22" : severityColor(item.severity) === "#f59e0b" ? "245,158,11" : "34,197,94"},0.15)`,
                                  border: `2px solid ${severityColor(item.severity)}`,
                                  color: severityColor(item.severity),
                                }}
                              >
                                M{item.month}
                              </div>
                              {idx < HYPERINFLATION_CASCADE.length - 1 && (
                                <div
                                  className="w-0.5 flex-1 min-h-4"
                                  style={{ background: "rgba(255,255,255,0.07)" }}
                                />
                              )}
                            </div>

                            {/* Content */}
                            <div
                              className="flex-1 rounded-xl p-3 mb-2"
                              style={{
                                background: "rgba(255,255,255,0.02)",
                                border: `1px solid ${severityColor(item.severity)}25`,
                              }}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-xs font-semibold leading-snug" style={{ color: C.textPri }}>
                                  {item.event}
                                </p>
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                                  style={{
                                    color: severityColor(item.severity),
                                    background: `${severityColor(item.severity)}15`,
                                    border: `1px solid ${severityColor(item.severity)}30`,
                                  }}
                                >
                                  {item.severity}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mb-1.5">
                                {item.indicators.map((ind) => (
                                  <span
                                    key={ind}
                                    className="text-xs px-1.5 py-0.5 rounded font-mono"
                                    style={{
                                      background: "rgba(212,160,23,0.08)",
                                      color: C.gold,
                                      border: "1px solid rgba(212,160,23,0.15)",
                                    }}
                                  >
                                    {ind}
                                  </span>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {item.institutions.map((inst) => (
                                  <span
                                    key={inst}
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{
                                      background: "rgba(59,130,246,0.07)",
                                      color: "#3b82f6",
                                      border: "1px solid rgba(59,130,246,0.15)",
                                    }}
                                  >
                                    {inst}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    ))}
                  </div>

                  {/* Chart + Gauge */}
                  <div className="space-y-5">
                    {/* Currency Value Chart */}
                    <div
                      className="rounded-xl p-4"
                      style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}
                    >
                      <h3 className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "#ef4444" }}>
                        Currency Value Collapse
                      </h3>
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={CASCADE_CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="currencyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#d4a017" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="currencyValue"
                            name="Currency Value"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#currencyGrad)"
                          />
                          <Area
                            type="monotone"
                            dataKey="confidence"
                            name="Market Confidence"
                            stroke="#d4a017"
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                            fill="url(#confidenceGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Risk Probability Gauge */}
                    <div
                      className="rounded-xl p-4 flex flex-col items-center"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <h3 className="text-xs uppercase tracking-widest font-semibold mb-3 self-start" style={{ color: C.textSec }}>
                        Risk Probability
                      </h3>
                      <RiskGauge pct={23.4} label="Hyperinflation Spiral" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SECTION 3: Sovereign Response Playbook ─────────────────────── */}
        <AnimatePresence>
          {simPhase === "complete" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="me-card p-5"
            >
              <div className="flex items-center gap-2 mb-5">
                <Shield size={14} style={{ color: "#22c55e" }} />
                <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: C.textPri }}>
                  Sovereign Response Playbook
                </h2>
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded font-mono"
                  style={{ background: "rgba(212,160,23,0.1)", color: C.gold, border: "1px solid rgba(212,160,23,0.25)" }}
                >
                  AGI GENERATED
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {HYPERINFLATION_PLAYBOOK.map((phase) => (
                  <div
                    key={phase.phase}
                    className="rounded-xl p-4"
                    style={{ background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.15)" }}
                  >
                    {/* Phase header */}
                    <div className="mb-3">
                      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#22c55e" }}>
                        {phase.phase}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: C.textSec }}>
                        {phase.timeframe}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {phase.actions.map((action, i) => {
                        const pc = priorityColor(action.priority);
                        return (
                          <div
                            key={i}
                            className="rounded-lg p-3"
                            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${pc.border}` }}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded"
                                style={{ color: pc.color, background: pc.bg, border: `1px solid ${pc.border}` }}
                              >
                                {action.priority}
                              </span>
                              <span
                                className="text-xs font-bold font-mono"
                                style={{ color: "#22c55e" }}
                              >
                                {action.successPct}%
                              </span>
                            </div>
                            <p className="text-xs leading-snug mb-2" style={{ color: C.textPri }}>
                              {action.action}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span style={{ color: C.textSec }}>{action.institution}</span>
                              <span
                                className="font-mono"
                                style={{ color: C.gold }}
                              >
                                {action.cost}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SECTION 4: Simulation History Log ─────────────────────────── */}
        <div className="me-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Archive size={14} style={{ color: C.textSec }} />
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: C.textPri }}>
              Simulation History Log
            </h2>
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded font-mono"
              style={{ background: "rgba(255,255,255,0.04)", color: C.textSec, border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {history.length} RUNS
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                  {["Scenario", "Date", "Severity Score", "Key Finding", "Playbook Status"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-semibold uppercase tracking-widest"
                      style={{ color: C.textSec, fontSize: 10 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {history.map((entry, i) => {
                    const sc = statusColor(entry.status);
                    const scoreColor =
                      entry.severityScore >= 75 ? "#ef4444" : entry.severityScore >= 50 ? "#f59e0b" : "#22c55e";
                    return (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          background: i === 0 && history[0].id.startsWith("h1") === false ? "rgba(212,160,23,0.04)" : "transparent",
                        }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: C.textPri }}>
                          {entry.scenario}
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: C.textSec }}>
                          {entry.date}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${entry.severityScore * 0.6}px`,
                                maxWidth: 60,
                                background: scoreColor,
                                boxShadow: `0 0 4px ${scoreColor}60`,
                              }}
                            />
                            <span className="font-bold font-mono" style={{ color: scoreColor }}>
                              {entry.severityScore}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs" style={{ color: C.textSec }}>
                          <div className="truncate" title={entry.keyFinding}>
                            {entry.keyFinding}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-semibold"
                            style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}
                          >
                            {entry.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
