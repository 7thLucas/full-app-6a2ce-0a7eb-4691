import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  AlertTriangle,
  Shield,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Zap,
  Clock,
  Globe2,
  Activity,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";

// ─── Types ────────────────────────────────────────────────────────────────────

type PressureLevel = "STABLE" | "WATCH" | "CRISIS";
type Severity = "LOW" | "MED" | "HIGH" | "CRITICAL";
type ThreatType =
  | "Currency devaluation"
  | "Capital flight"
  | "Competitive devaluation"
  | "Sanctions freeze"
  | "Swap manipulation"
  | "Sovereign debt cascade"
  | "Hyperinflation export"
  | "SWIFT exclusion";

interface Nation {
  code: string;
  name: string;
  currency: string;
  currencyCode: string;
  pressureScore: number;
  pressureLevel: PressureLevel;
  threat: ThreatType;
  trend: "up" | "down" | "stable";
  devaluation7d: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CapitalFlightAlert {
  id: string;
  institution: string;
  outflowBn: number;
  velocityPerHour: number;
  originNation: string;
  destNation: string;
  severity: Severity;
  timestamp: Date;
}

interface DefenseProtocol {
  id: string;
  name: string;
  description: string;
  institutionsCount: number;
  estimatedStabilizationHours: number;
  color: string;
}

interface CrisisHistory {
  id: string;
  year: number;
  name: string;
  resolutionMonths: number;
  impactScore: number;
  description: string;
  meResponse: string;
  peakLoss: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const NATIONS: Nation[] = [
  {
    code: "US", name: "United States", currency: "US Dollar", currencyCode: "USD",
    pressureScore: 28, pressureLevel: "STABLE", threat: "Currency devaluation",
    trend: "stable", devaluation7d: -0.4, x: 120, y: 170, width: 110, height: 60,
  },
  {
    code: "EU", name: "European Union", currency: "Euro", currencyCode: "EUR",
    pressureScore: 41, pressureLevel: "WATCH", threat: "Sovereign debt cascade",
    trend: "up", devaluation7d: -1.8, x: 400, y: 140, width: 80, height: 55,
  },
  {
    code: "CN", name: "China", currency: "Renminbi", currencyCode: "CNY",
    pressureScore: 74, pressureLevel: "CRISIS", threat: "Competitive devaluation",
    trend: "up", devaluation7d: -3.2, x: 640, y: 175, width: 80, height: 60,
  },
  {
    code: "JP", name: "Japan", currency: "Japanese Yen", currencyCode: "JPY",
    pressureScore: 62, pressureLevel: "CRISIS", threat: "Currency devaluation",
    trend: "up", devaluation7d: -4.1, x: 710, y: 165, width: 60, height: 45,
  },
  {
    code: "UK", name: "United Kingdom", currency: "Pound Sterling", currencyCode: "GBP",
    pressureScore: 33, pressureLevel: "STABLE", threat: "Capital flight",
    trend: "down", devaluation7d: 0.6, x: 380, y: 130, width: 40, height: 30,
  },
  {
    code: "IN", name: "India", currency: "Indian Rupee", currencyCode: "INR",
    pressureScore: 55, pressureLevel: "WATCH", threat: "Capital flight",
    trend: "up", devaluation7d: -2.1, x: 580, y: 195, width: 65, height: 50,
  },
  {
    code: "BR", name: "Brazil", currency: "Brazilian Real", currencyCode: "BRL",
    pressureScore: 68, pressureLevel: "CRISIS", threat: "Hyperinflation export",
    trend: "up", devaluation7d: -3.8, x: 220, y: 280, width: 60, height: 55,
  },
  {
    code: "ID", name: "Indonesia", currency: "Indonesian Rupiah", currencyCode: "IDR",
    pressureScore: 49, pressureLevel: "WATCH", threat: "Swap manipulation",
    trend: "up", devaluation7d: -1.4, x: 670, y: 240, width: 55, height: 40,
  },
  {
    code: "SA", name: "Saudi Arabia", currency: "Saudi Riyal", currencyCode: "SAR",
    pressureScore: 22, pressureLevel: "STABLE", threat: "Sanctions freeze",
    trend: "stable", devaluation7d: 0.0, x: 510, y: 200, width: 50, height: 38,
  },
  {
    code: "RU", name: "Russia", currency: "Russian Ruble", currencyCode: "RUB",
    pressureScore: 88, pressureLevel: "CRISIS", threat: "SWIFT exclusion",
    trend: "up", devaluation7d: -7.3, x: 540, y: 130, width: 90, height: 55,
  },
  {
    code: "KR", name: "South Korea", currency: "South Korean Won", currencyCode: "KRW",
    pressureScore: 37, pressureLevel: "STABLE", threat: "Competitive devaluation",
    trend: "stable", devaluation7d: -0.8, x: 700, y: 155, width: 45, height: 35,
  },
  {
    code: "AU", name: "Australia", currency: "Australian Dollar", currencyCode: "AUD",
    pressureScore: 31, pressureLevel: "STABLE", threat: "Capital flight",
    trend: "down", devaluation7d: 0.3, x: 700, y: 300, width: 65, height: 55,
  },
  {
    code: "CA", name: "Canada", currency: "Canadian Dollar", currencyCode: "CAD",
    pressureScore: 26, pressureLevel: "STABLE", threat: "Currency devaluation",
    trend: "stable", devaluation7d: -0.2, x: 110, y: 140, width: 85, height: 45,
  },
];

const INSTITUTIONS_POOL = [
  "Goldman Sachs", "JPMorgan Chase", "Deutsche Bank", "HSBC", "BNP Paribas",
  "Citigroup", "Barclays", "UBS", "Credit Suisse", "Bank of America",
  "Mitsubishi UFJ", "Standard Chartered", "Société Générale", "ING Group",
];

const ORIGIN_DEST_PAIRS: [string, string][] = [
  ["China", "Hong Kong"], ["Russia", "UAE"], ["Brazil", "Switzerland"],
  ["Japan", "Singapore"], ["India", "Cayman Islands"], ["EU", "United States"],
  ["Indonesia", "Singapore"], ["Saudi Arabia", "United States"],
];

function generateAlert(): CapitalFlightAlert {
  const pair = ORIGIN_DEST_PAIRS[Math.floor(Math.random() * ORIGIN_DEST_PAIRS.length)];
  const severities: Severity[] = ["LOW", "MED", "HIGH", "CRITICAL"];
  return {
    id: Math.random().toString(36).slice(2, 8).toUpperCase(),
    institution: INSTITUTIONS_POOL[Math.floor(Math.random() * INSTITUTIONS_POOL.length)],
    outflowBn: parseFloat((0.5 + Math.random() * 12.5).toFixed(2)),
    velocityPerHour: Math.round(50_000_000 + Math.random() * 2_500_000_000),
    originNation: pair[0],
    destNation: pair[1],
    severity: severities[Math.floor(Math.random() * severities.length)],
    timestamp: new Date(),
  };
}

const DEFENSE_PROTOCOLS: DefenseProtocol[] = [
  {
    id: "rate-freeze",
    name: "Rate Freeze",
    description: "Immediately halt all interest rate adjustments and lock monetary policy at current levels to prevent speculative attacks.",
    institutionsCount: 8,
    estimatedStabilizationHours: 48,
    color: "#3b82f6",
  },
  {
    id: "liquidity-injection",
    name: "Emergency Liquidity Injection",
    description: "Deploy sovereign reserve funds via coordinated repo operations to supply-side stabilize affected currency corridors.",
    institutionsCount: 13,
    estimatedStabilizationHours: 72,
    color: "#f59e0b",
  },
  {
    id: "capital-controls",
    name: "Capital Controls Activation",
    description: "Restrict cross-border capital flows above threshold for designated crisis nations. All outflows require central bank approval.",
    institutionsCount: 4,
    estimatedStabilizationHours: 96,
    color: "#8b5cf6",
  },
  {
    id: "swap-lines",
    name: "Coordinated Swap Line",
    description: "Activate bilateral currency swap agreements between G20 central banks to prevent liquidity crunch in interbank lending.",
    institutionsCount: 11,
    estimatedStabilizationHours: 24,
    color: "#10b981",
  },
  {
    id: "sanctions-counter",
    name: "Sanctions Counter-Response",
    description: "Activate alternative settlement corridors bypassing SWIFT. Route sovereign payments via Money Elysium inter-operable protocol.",
    institutionsCount: 6,
    estimatedStabilizationHours: 12,
    color: "#ef4444",
  },
];

const CRISIS_HISTORY: CrisisHistory[] = [
  {
    id: "asian-97",
    year: 1997,
    name: "Asian Financial Crisis",
    resolutionMonths: 24,
    impactScore: 91,
    description: "Currency contagion across Thailand, Indonesia, South Korea. IMF intervention required. $100B+ in bailouts.",
    meResponse: "Automated capital flow monitoring would have detected the 3-week prelude pattern. Swap line activation within 6 hours would have halved contagion spread.",
    peakLoss: "$600B GDP loss",
  },
  {
    id: "gfc-2008",
    year: 2008,
    name: "Global Financial Crisis",
    resolutionMonths: 60,
    impactScore: 98,
    description: "Lehman collapse triggered interbank freeze. Currency markets destabilized globally. Fed required $7T+ swap lines.",
    meResponse: "Self-Healing Security would have quarantined leveraged positions 48 hours pre-collapse. Emergency Liquidity Injection protocol would have stabilized USD/EUR corridor immediately.",
    peakLoss: "$22T wealth destruction",
  },
  {
    id: "cny-2015",
    year: 2015,
    name: "CNY Devaluation Shock",
    resolutionMonths: 6,
    impactScore: 72,
    description: "PBOC devalued CNY 3.5% in single day, triggering EM selloff. $1T in global capital outflows within 72 hours.",
    meResponse: "Competitive Devaluation Detection would have flagged the threshold breach at 2.1%. Capital Controls Activation + SDR rebalancing within 2 hours would have absorbed the shock.",
    peakLoss: "$3T market cap erased",
  },
  {
    id: "em-2018",
    year: 2018,
    name: "EM Currency Crisis",
    resolutionMonths: 10,
    impactScore: 65,
    description: "Turkish Lira and Argentine Peso collapse spread to Indian Rupee, South African Rand. Fed rate hikes amplified dollar demand.",
    meResponse: "Capital Flight Alert feed would have detected coordinated outflows from Turkey 14 days in advance. Rate Freeze + coordinated swap line activation would have prevented contagion.",
    peakLoss: "$2.1T EM market loss",
  },
  {
    id: "lira-2022",
    year: 2022,
    name: "Turkish Lira Collapse",
    resolutionMonths: 18,
    impactScore: 78,
    description: "TRY lost 44% of value in single year. Unorthodox monetary policy and geopolitical tensions drove hyperinflationary spiral.",
    meResponse: "AGI Monetary Brain would have overridden rate cuts 3 months before the crisis. Sovereign debt cascade alert would have triggered IMF coordination protocol automatically.",
    peakLoss: "TRY -44% / $275B GDP impact",
  },
  {
    id: "svb-2023",
    year: 2023,
    name: "SVB Regional Bank Contagion",
    resolutionMonths: 3,
    impactScore: 59,
    description: "Silicon Valley Bank failure triggered tech sector bank run. Signature and Silvergate followed. $200B in deposits frozen.",
    meResponse: "Sovereign Currency Ledger would have flagged the duration mismatch in SVB's bond portfolio 6 months prior. Emergency Liquidity Injection would have prevented FDIC takeover.",
    peakLoss: "$200B deposits frozen",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_STYLE: Record<Severity, { bg: string; text: string; border: string }> = {
  LOW: { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
  MED: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  HIGH: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.3)" },
  CRITICAL: { bg: "rgba(220,38,38,0.2)", text: "#dc2626", border: "rgba(220,38,38,0.5)" },
};

const PRESSURE_COLORS: Record<PressureLevel, string> = {
  STABLE: "#10b981",
  WATCH: "#f59e0b",
  CRISIS: "#ef4444",
};

function formatVelocity(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B/hr`;
  return `$${(v / 1_000_000).toFixed(0)}M/hr`;
}

function formatRelative(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLE[severity];
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded font-mono"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {severity}
    </span>
  );
}

// ─── 1. Crisis Status Header ──────────────────────────────────────────────────

function CrisisStatusHeader({
  incidentCount,
  onActivateProtocol,
}: {
  incidentCount: number;
  onActivateProtocol: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      style={{
        background: "linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(245,158,11,0.06) 50%, rgba(8,14,31,0) 100%)",
        border: "1px solid rgba(220,38,38,0.4)",
        boxShadow: "0 0 32px rgba(220,38,38,0.08)",
      }}
    >
      {/* Left: threat level */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-11 h-11">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "rgba(245,158,11,0.15)",
              animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
          <div
            className="relative w-5 h-5 rounded-full"
            style={{ background: "#f59e0b", boxShadow: "0 0 16px #f59e0b" }}
          />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span
              className="text-xl font-black tracking-wider uppercase font-mono"
              style={{ color: "#f59e0b" }}
            >
              THREAT LEVEL: ELEVATED
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#94a3b8" }}>
            <span className="flex items-center gap-1.5">
              <Activity size={11} style={{ color: "#ef4444" }} />
              <span className="font-mono font-bold" style={{ color: "#ef4444" }}>
                {incidentCount} ACTIVE INCIDENTS
              </span>
            </span>
            <span>·</span>
            <span>4 NATIONS IN CRISIS</span>
            <span>·</span>
            <span>G20 MONITORING: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Right: action button */}
      <button
        onClick={onActivateProtocol}
        className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #dc2626, #b91c1c)",
          color: "#fff",
          boxShadow: "0 0 20px rgba(220,38,38,0.4)",
          border: "1px solid rgba(220,38,38,0.6)",
        }}
      >
        <Swords size={16} />
        Activate Emergency Protocol
      </button>
    </motion.div>
  );
}

// ─── 2. World Currency Pressure Map ──────────────────────────────────────────

function NationTooltip({ nation, onClose }: { nation: Nation; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-20 w-56 rounded-xl p-4"
      style={{
        top: nation.y + nation.height + 4,
        left: Math.min(nation.x, 680),
        background: "#0a1020",
        border: `1px solid ${PRESSURE_COLORS[nation.pressureLevel]}60`,
        boxShadow: `0 0 16px ${PRESSURE_COLORS[nation.pressureLevel]}20`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm" style={{ color: "#e2e8f0" }}>{nation.name}</span>
        <button onClick={onClose} style={{ color: "#475569" }}>
          <X size={13} />
        </button>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span style={{ color: "#64748b" }}>Currency</span>
          <span className="font-mono font-bold" style={{ color: "#e2e8f0" }}>
            {nation.currencyCode} — {nation.currency}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: "#64748b" }}>Pressure Score</span>
          <span
            className="font-mono font-bold"
            style={{ color: PRESSURE_COLORS[nation.pressureLevel] }}
          >
            {nation.pressureScore}/100
          </span>
        </div>
        <div className="flex justify-between items-start gap-2">
          <span style={{ color: "#64748b" }}>Key Threat</span>
          <span className="text-right" style={{ color: "#f59e0b" }}>{nation.threat}</span>
        </div>
        <div className="flex justify-between items-center">
          <span style={{ color: "#64748b" }}>7-Day Movement</span>
          <span
            className="font-mono font-bold flex items-center gap-1"
            style={{ color: nation.devaluation7d < 0 ? "#ef4444" : "#10b981" }}
          >
            {nation.devaluation7d > 0 ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            {nation.devaluation7d > 0 ? "+" : ""}
            {nation.devaluation7d.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span style={{ color: "#64748b" }}>Status</span>
          <span
            className="font-bold px-2 py-0.5 rounded text-xs"
            style={{
              background: `${PRESSURE_COLORS[nation.pressureLevel]}18`,
              color: PRESSURE_COLORS[nation.pressureLevel],
              border: `1px solid ${PRESSURE_COLORS[nation.pressureLevel]}40`,
            }}
          >
            {nation.pressureLevel}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function WorldPressureMap() {
  const [hovered, setHovered] = useState<Nation | null>(null);

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe2 size={15} style={{ color: "#f59e0b" }} />
          <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
            World Currency Pressure Map — G20 + ASEAN
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {(["STABLE", "WATCH", "CRISIS"] as PressureLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: PRESSURE_COLORS[level] }}
              />
              <span style={{ color: "#64748b" }}>{level}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative" style={{ height: 380 }}>
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full"
          style={{ background: "radial-gradient(ellipse at 50% 50%, #0d1c3a 0%, #07090f 100%)" }}
        >
          {/* Ocean background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="800" height="400" fill="url(#grid)" />

          {/* Nation blocks */}
          {NATIONS.map((nation) => {
            const color = PRESSURE_COLORS[nation.pressureLevel];
            const isCrisis = nation.pressureLevel === "CRISIS";
            const isHovered = hovered?.code === nation.code;

            return (
              <g key={nation.code}>
                {/* Pulse glow for crisis nations */}
                {isCrisis && (
                  <rect
                    x={nation.x - 3}
                    y={nation.y - 3}
                    width={nation.width + 6}
                    height={nation.height + 6}
                    rx={6}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    strokeOpacity={0.5}
                    style={{ animation: "ping 2s ease-in-out infinite" }}
                  />
                )}
                <rect
                  x={nation.x}
                  y={nation.y}
                  width={nation.width}
                  height={nation.height}
                  rx={4}
                  fill={isHovered ? `${color}30` : `${color}18`}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => setHovered(hovered?.code === nation.code ? null : nation)}
                />
                <text
                  x={nation.x + nation.width / 2}
                  y={nation.y + nation.height / 2 - 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fontWeight="bold"
                  fill={color}
                  style={{ pointerEvents: "none" }}
                >
                  {nation.code}
                </text>
                <text
                  x={nation.x + nation.width / 2}
                  y={nation.y + nation.height / 2 + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={8}
                  fill={`${color}90`}
                  style={{ pointerEvents: "none" }}
                >
                  {nation.pressureScore}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip overlay */}
        <AnimatePresence>
          {hovered && (
            <NationTooltip nation={hovered} onClose={() => setHovered(null)} />
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs mt-2" style={{ color: "#475569" }}>
        Click a nation to view pressure details. Crisis nations pulse with active threat glow.
      </p>
    </div>
  );
}

// ─── 3. Capital Flight Alert Feed ─────────────────────────────────────────────

function CapitalFlightFeed() {
  const [alerts, setAlerts] = useState<CapitalFlightAlert[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      ...generateAlert(),
      timestamp: new Date(Date.now() - i * 5000),
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prev) => [generateAlert(), ...prev].slice(0, 30));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        background: "#0d1426",
        border: "1px solid rgba(255,255,255,0.07)",
        maxHeight: 440,
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <TrendingDown size={15} style={{ color: "#ef4444" }} />
          <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
            Capital Flight Alert Feed
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
          style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#ef4444" }}
          />
          LIVE
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        <AnimatePresence initial={false}>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
              style={{
                background:
                  alert.severity === "CRITICAL"
                    ? "rgba(220,38,38,0.07)"
                    : alert.severity === "HIGH"
                    ? "rgba(239,68,68,0.04)"
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  alert.severity === "CRITICAL"
                    ? "rgba(220,38,38,0.25)"
                    : alert.severity === "HIGH"
                    ? "rgba(239,68,68,0.12)"
                    : "rgba(255,255,255,0.05)"
                }`,
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={alert.severity} />
                <span
                  className="text-xs font-bold font-mono"
                  style={{ color: "#e2e8f0" }}
                >
                  {alert.institution}
                </span>
                <span
                  className="ml-auto text-xs font-mono"
                  style={{ color: "#475569" }}
                >
                  {formatRelative(alert.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="font-bold font-mono" style={{ color: "#ef4444" }}>
                  −${alert.outflowBn.toFixed(2)}B
                </span>
                <span style={{ color: "#475569" }}>outflow</span>
                <span className="font-mono" style={{ color: "#f59e0b" }}>
                  {formatVelocity(alert.velocityPerHour)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className="px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}
                >
                  {alert.originNation}
                </span>
                <ArrowRight size={10} style={{ color: "#475569" }} />
                <span
                  className="px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}
                >
                  {alert.destNation}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── 4. Competitive Devaluation Detection ────────────────────────────────────

const DEVALUATION_DATA = NATIONS.map((n) => ({
  nation: n.code,
  value: n.devaluation7d,
  isAlert: Math.abs(n.devaluation7d) > 2,
  color: Math.abs(n.devaluation7d) > 2 ? "#ef4444" : n.devaluation7d < 0 ? "#f59e0b" : "#10b981",
}));

const CustomDevalTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{
        background: "#0a1020",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#e2e8f0",
      }}
    >
      <p className="font-bold mb-1" style={{ color: "#f59e0b" }}>{label}</p>
      <p style={{ color: val < -2 ? "#ef4444" : val < 0 ? "#f59e0b" : "#10b981" }}>
        7d: {val > 0 ? "+" : ""}{val.toFixed(1)}% vs SDR
      </p>
      {Math.abs(val) > 2 && (
        <p className="font-bold mt-0.5" style={{ color: "#ef4444" }}>
          DEVALUATION ALERT
        </p>
      )}
    </div>
  );
};

function DevaluationPanel() {
  const alertCount = DEVALUATION_DATA.filter((d) => d.isAlert).length;

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={15} style={{ color: "#ef4444" }} />
            <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
              Competitive Devaluation Detection
            </span>
            {alertCount > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded font-mono animate-pulse"
                style={{
                  background: "rgba(220,38,38,0.18)",
                  color: "#ef4444",
                  border: "1px solid rgba(220,38,38,0.4)",
                }}
              >
                {alertCount} DEVALUATION ALERT{alertCount > 1 ? "S" : ""}
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "#64748b" }}>
            7-day currency movement vs SDR basket. Red = deviation &gt;2%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={DEVALUATION_DATA} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="nation"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
            domain={[-8, 2]}
          />
          <Tooltip content={<CustomDevalTooltip />} />
          <ReferenceLine y={-2} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} />
          <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" />
          <Bar
            dataKey="value"
            name="7d Movement"
            radius={[3, 3, 0, 0]}
            fill="#f59e0b"
          >
            {DEVALUATION_DATA.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#ef4444" }} />
          <span style={{ color: "#64748b" }}>Devaluation Alert (&gt;2%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#f59e0b" }} />
          <span style={{ color: "#64748b" }}>Moderate deviation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#10b981" }} />
          <span style={{ color: "#64748b" }}>Stable / appreciation</span>
        </div>
      </div>
    </div>
  );
}

// ─── 5. Coordinated Defense Protocol Panel ───────────────────────────────────

function ActivationModal({
  protocol,
  onClose,
}: {
  protocol: DefenseProtocol;
  onClose: () => void;
}) {
  const [countdown, setCountdown] = useState(5);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setActivated(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.8)" }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="rounded-2xl p-7 w-full max-w-sm mx-4 text-center"
        style={{
          background: "#0a1020",
          border: `1px solid ${protocol.color}50`,
          boxShadow: `0 0 40px ${protocol.color}20`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
          style={{ color: "#475569" }}
        >
          <X size={16} />
        </button>

        {!activated ? (
          <>
            <Swords size={28} className="mx-auto mb-4" style={{ color: protocol.color }} />
            <h3 className="text-base font-bold mb-2" style={{ color: "#e2e8f0" }}>
              Activating: {protocol.name}
            </h3>
            <p className="text-xs mb-6" style={{ color: "#64748b" }}>
              {protocol.description}
            </p>
            <div
              className="text-6xl font-black font-mono mb-4"
              style={{ color: protocol.color, textShadow: `0 0 30px ${protocol.color}` }}
            >
              {countdown}
            </div>
            <p className="text-xs" style={{ color: "#475569" }}>
              Protocol activates in {countdown} second{countdown !== 1 ? "s" : ""}...
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 rounded-lg text-xs font-semibold"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Abort
            </button>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Shield size={36} className="mx-auto mb-4" style={{ color: "#10b981" }} />
            </motion.div>
            <h3 className="text-base font-bold mb-2" style={{ color: "#10b981" }}>
              PROTOCOL ACTIVATED
            </h3>
            <p className="text-xs mb-4" style={{ color: "#64748b" }}>
              {protocol.name} is now live. Estimated stabilization in{" "}
              <span style={{ color: "#f59e0b" }}>
                {protocol.estimatedStabilizationHours}h
              </span>
              .
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg text-xs font-bold"
              style={{
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              Dismiss
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

function DefenseProtocolPanel() {
  const [activeProtocol, setActiveProtocol] = useState<DefenseProtocol | null>(null);

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield size={15} style={{ color: "#3b82f6" }} />
        <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
          Coordinated Defense Protocols
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {DEFENSE_PROTOCOLS.map((protocol) => (
          <motion.div
            key={protocol.id}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{
              background: `${protocol.color}08`,
              border: `1px solid ${protocol.color}25`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${protocol.color}18` }}
            >
              <Zap size={15} style={{ color: protocol.color }} />
            </div>
            <div>
              <h4 className="text-xs font-bold mb-1" style={{ color: "#e2e8f0" }}>
                {protocol.name}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                {protocol.description}
              </p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span style={{ color: "#475569" }}>Institutions</span>
                <span className="font-mono" style={{ color: protocol.color }}>
                  {protocol.institutionsCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#475569" }}>Est. Stabilization</span>
                <span className="font-mono" style={{ color: "#f59e0b" }}>
                  {protocol.estimatedStabilizationHours}h
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveProtocol(protocol)}
              className="mt-auto w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90"
              style={{
                background: `${protocol.color}18`,
                color: protocol.color,
                border: `1px solid ${protocol.color}35`,
              }}
            >
              Activate
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {activeProtocol && (
          <ActivationModal
            protocol={activeProtocol}
            onClose={() => setActiveProtocol(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 6. Crisis History Timeline ───────────────────────────────────────────────

function CrisisTimeline() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<CrisisHistory>(CRISIS_HISTORY[0]);

  function scrollBy(dir: number) {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 220, behavior: "smooth" });
    }
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock size={15} style={{ color: "#f59e0b" }} />
          <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
            Crisis History Timeline
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scrollBy(-1)}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable timeline */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-3 mb-5"
        style={{ scrollbarWidth: "none" }}
      >
        {CRISIS_HISTORY.map((crisis) => {
          const isSelected = selected.id === crisis.id;
          return (
            <button
              key={crisis.id}
              onClick={() => setSelected(crisis)}
              className="flex-shrink-0 w-48 rounded-xl p-3 text-left transition-all"
              style={{
                background: isSelected
                  ? "rgba(245,158,11,0.1)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  isSelected ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.07)"
                }`,
              }}
            >
              <div
                className="text-lg font-black font-mono mb-1"
                style={{ color: isSelected ? "#f59e0b" : "#64748b" }}
              >
                {crisis.year}
              </div>
              <div
                className="text-xs font-bold mb-1 leading-tight"
                style={{ color: isSelected ? "#e2e8f0" : "#94a3b8" }}
              >
                {crisis.name}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#475569" }}>
                  Impact
                </span>
                <span
                  className="text-xs font-mono font-bold"
                  style={{
                    color: crisis.impactScore >= 90 ? "#ef4444" : crisis.impactScore >= 70 ? "#f59e0b" : "#10b981",
                  }}
                >
                  {crisis.impactScore}/100
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${crisis.impactScore}%`,
                    background:
                      crisis.impactScore >= 90
                        ? "#ef4444"
                        : crisis.impactScore >= 70
                        ? "#f59e0b"
                        : "#10b981",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected crisis detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl p-4 grid grid-cols-1 lg:grid-cols-2 gap-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-2xl font-black font-mono"
                style={{ color: "#f59e0b" }}
              >
                {selected.year}
              </span>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>
                  {selected.name}
                </h3>
                <div className="flex items-center gap-3 text-xs mt-0.5">
                  <span style={{ color: "#64748b" }}>
                    Duration:{" "}
                    <span style={{ color: "#94a3b8" }}>
                      {selected.resolutionMonths} months
                    </span>
                  </span>
                  <span style={{ color: "#64748b" }}>
                    Peak:{" "}
                    <span style={{ color: "#ef4444" }}>{selected.peakLoss}</span>
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
              {selected.description}
            </p>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(16,185,129,0.04)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }}
              />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>
                Money Elysium Response Simulation
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
              {selected.meResponse}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function WarRoom() {
  const [incidentCount, setIncidentCount] = useState(47);
  const [showProtocolModal, setShowProtocolModal] = useState(false);

  // Slowly increment incident counter
  useEffect(() => {
    const interval = setInterval(() => {
      setIncidentCount((c) => c + Math.floor(Math.random() * 2));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <Header
        title="Currency War Room"
        subtitle="Geopolitical Monetary Defense Command — G20 + ASEAN Threat Monitor"
      />

      <div
        className="flex-1 p-6 space-y-6"
        style={{ background: "#080e1f" }}
      >
        {/* 1. Crisis Status Header */}
        <CrisisStatusHeader
          incidentCount={incidentCount}
          onActivateProtocol={() => setShowProtocolModal(true)}
        />

        {/* 2. World Currency Pressure Map */}
        <WorldPressureMap />

        {/* 3 & 4. Capital Flight Feed + Devaluation Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CapitalFlightFeed />
          <DevaluationPanel />
        </div>

        {/* 5. Coordinated Defense Protocol Panel */}
        <DefenseProtocolPanel />

        {/* 6. Crisis History Timeline */}
        <CrisisTimeline />
      </div>

      {/* Emergency Protocol Modal from header button */}
      <AnimatePresence>
        {showProtocolModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={() => setShowProtocolModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="rounded-2xl p-7 w-full max-w-md mx-4"
              style={{
                background: "#0a1020",
                border: "1px solid rgba(220,38,38,0.5)",
                boxShadow: "0 0 40px rgba(220,38,38,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Swords size={22} style={{ color: "#ef4444" }} />
                  <span className="text-base font-bold uppercase tracking-wider" style={{ color: "#ef4444" }}>
                    Emergency Protocol
                  </span>
                </div>
                <button onClick={() => setShowProtocolModal(false)} style={{ color: "#475569" }}>
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs mb-5 leading-relaxed" style={{ color: "#94a3b8" }}>
                Select a coordinated defense action. All activations are logged immutably on the Sovereign Currency Ledger and will be broadcast to all connected central bank nodes.
              </p>
              <div className="space-y-2">
                {DEFENSE_PROTOCOLS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setShowProtocolModal(false)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs transition-all hover:opacity-80"
                    style={{
                      background: `${p.color}10`,
                      border: `1px solid ${p.color}30`,
                      color: "#e2e8f0",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Zap size={13} style={{ color: p.color }} />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: "#64748b" }}>
                      <Clock size={11} />
                      <span>{p.estimatedStabilizationHours}h</span>
                      <ChevronRight size={12} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
