import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Cpu,
  Zap,
  Shield,
  Clock,
  ChevronRight,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  Network,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";
import { useConfigurables } from "~/modules/configurables";

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

// ─── TYPE: AGI assessment ──────────────────────────────────────────────────
type Assessment = "STABLE" | "WATCH" | "CRITICAL";
type Trend = "up" | "down" | "flat";

// ─── SIMULATED DATA GENERATORS ────────────────────────────────────────────

function generateInflationData() {
  return Array.from({ length: 30 }, (_, i) => {
    const base = 2.1 + Math.sin(i * 0.28) * 0.9;
    const noise = (Math.random() - 0.5) * 0.18;
    const actual = parseFloat((base + noise).toFixed(3));
    const predicted = parseFloat((base + (Math.random() - 0.5) * 0.04).toFixed(3));
    return {
      period: i % 4 === 0 ? `T-${29 - i}h` : "",
      actual,
      predicted,
      upper: parseFloat((predicted + 0.18).toFixed(3)),
      lower: parseFloat((predicted - 0.18).toFixed(3)),
    };
  });
}

function generateRadarData() {
  return [
    { metric: "Inflation Risk", value: 38, fullMark: 100 },
    { metric: "Liquidity", value: 82, fullMark: 100 },
    { metric: "AML Score", value: 91, fullMark: 100 },
    { metric: "Velocity", value: 67, fullMark: 100 },
    { metric: "Stability", value: 74, fullMark: 100 },
    { metric: "Solvency", value: 88, fullMark: 100 },
  ];
}

interface EconSignal {
  id: string;
  label: string;
  value: string;
  unit: string;
  trend: Trend;
  assessment: Assessment;
  delta: string;
}

function buildSignals(): EconSignal[] {
  return [
    { id: "cpi", label: "CPI", value: "3.24", unit: "%", trend: "up", assessment: "WATCH", delta: "+0.12" },
    { id: "m2", label: "M2 Money Supply", value: "21.04", unit: "T", trend: "up", assessment: "WATCH", delta: "+0.3T" },
    { id: "usdeur", label: "USD/EUR", value: "0.924", unit: "", trend: "flat", assessment: "STABLE", delta: "-0.001" },
    { id: "usdcny", label: "USD/CNY", value: "7.243", unit: "", trend: "down", assessment: "STABLE", delta: "-0.018" },
    { id: "usdidr", label: "USD/IDR", value: "16,340", unit: "", trend: "up", assessment: "WATCH", delta: "+85" },
    { id: "usdjpy", label: "USD/JPY", value: "157.82", unit: "", trend: "up", assessment: "CRITICAL", delta: "+1.24" },
    { id: "gdp", label: "GDP Growth", value: "2.18", unit: "%", trend: "down", assessment: "WATCH", delta: "-0.31" },
    { id: "inflation", label: "Inflation Index", value: "118.4", unit: "pt", trend: "up", assessment: "WATCH", delta: "+2.1" },
    { id: "bonds10y", label: "10Y Bond Yield", value: "4.68", unit: "%", trend: "up", assessment: "CRITICAL", delta: "+0.09" },
    { id: "tradebal", label: "Trade Balance", value: "-67.2", unit: "B", trend: "down", assessment: "WATCH", delta: "-4.1B" },
    { id: "reserves", label: "Foreign Reserves", value: "3,401", unit: "B", trend: "flat", assessment: "STABLE", delta: "+12B" },
    { id: "capflow", label: "Capital Flow Index", value: "84.2", unit: "pt", trend: "up", assessment: "STABLE", delta: "+3.1" },
    { id: "sovdebt", label: "Sovereign Debt Ratio", value: "122.4", unit: "%", trend: "up", assessment: "CRITICAL", delta: "+1.8" },
  ];
}

interface PolicyLog {
  id: string;
  timestamp: string;
  action: string;
  trigger: string;
  outcome: "EXECUTED" | "PENDING" | "REVERTED";
}

function generatePolicyLog(): PolicyLog[] {
  const entries: PolicyLog[] = [
    { id: "p1", timestamp: "2026-06-13 04:17:02", action: "Rate hold at 4.25% — inflationary pressure within tolerance band", trigger: "CPI +0.12% / M2 +0.3T", outcome: "EXECUTED" },
    { id: "p2", timestamp: "2026-06-13 02:44:18", action: "FX intervention signal: IDR corridor stress mitigation +$800M", trigger: "USD/IDR breach 16,300", outcome: "EXECUTED" },
    { id: "p3", timestamp: "2026-06-12 22:11:55", action: "AML freeze order — 3 correspondent accounts, $47M suspended", trigger: "LAUNDERING_PATTERN confidence 97.4%", outcome: "EXECUTED" },
    { id: "p4", timestamp: "2026-06-12 19:30:40", action: "Liquidity injection: overnight repo +$12B to primary dealers", trigger: "Liquidity ratio 94.1% (below 95% floor)", outcome: "EXECUTED" },
    { id: "p5", timestamp: "2026-06-12 15:05:22", action: "Sovereign debt issuance cap advisory issued to Treasury desk", trigger: "Debt/GDP ratio breached 122%", outcome: "PENDING" },
    { id: "p6", timestamp: "2026-06-12 09:48:33", action: "JPY corridor alert: recommend G7 currency coordination signal", trigger: "USD/JPY velocity anomaly +1.2%/6h", outcome: "EXECUTED" },
    { id: "p7", timestamp: "2026-06-11 23:12:07", action: "Bond yield curve control recalibration — 10Y target 4.50%", trigger: "10Y yield spread 42bps above neutral", outcome: "REVERTED" },
    { id: "p8", timestamp: "2026-06-11 17:54:19", action: "CPI forward guidance update: 3.1% Q3 projection published", trigger: "Inflation model refit R²=0.988", outcome: "EXECUTED" },
    { id: "p9", timestamp: "2026-06-11 12:30:00", action: "Trade balance deficit advisory: recommend tariff re-evaluation", trigger: "Trade deficit -$4.1B exceeds 30-day avg", outcome: "PENDING" },
    { id: "p10", timestamp: "2026-06-10 08:20:45", action: "Capital flow index surge detected — portfolio rebalancing alert", trigger: "Capital Flow Index +3.1 in 12h window", outcome: "EXECUTED" },
  ];
  return entries;
}

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  amount: number;
  risk: "HIGH" | "MEDIUM" | "LOW";
  label: string;
}

interface NetworkEdge {
  source: string;
  target: string;
  flagged: boolean;
  amount: number;
}

function generateNetwork(): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  const nodes: NetworkNode[] = [
    { id: "n1", x: 260, y: 140, amount: 48500000, risk: "HIGH", label: "Shell Co. A" },
    { id: "n2", x: 140, y: 240, amount: 12300000, risk: "HIGH", label: "Offshore B" },
    { id: "n3", x: 380, y: 260, amount: 9100000, risk: "HIGH", label: "Nominee C" },
    { id: "n4", x: 220, y: 320, amount: 31000000, risk: "HIGH", label: "Trust D" },
    { id: "n5", x: 80, y: 160, amount: 4200000, risk: "MEDIUM", label: "Corp E" },
    { id: "n6", x: 460, y: 160, amount: 7800000, risk: "MEDIUM", label: "LLC F" },
    { id: "n7", x: 320, y: 360, amount: 2100000, risk: "MEDIUM", label: "Fund G" },
    { id: "n8", x: 160, y: 390, amount: 800000, risk: "LOW", label: "Agent H" },
    { id: "n9", x: 420, y: 380, amount: 1500000, risk: "LOW", label: "Entity I" },
    { id: "n10", x: 520, y: 280, amount: 3400000, risk: "LOW", label: "Holding J" },
  ];
  const edges: NetworkEdge[] = [
    { source: "n1", target: "n2", flagged: true, amount: 12000000 },
    { source: "n1", target: "n3", flagged: true, amount: 8500000 },
    { source: "n2", target: "n4", flagged: true, amount: 10000000 },
    { source: "n3", target: "n4", flagged: true, amount: 6200000 },
    { source: "n4", target: "n7", flagged: true, amount: 4100000 },
    { source: "n5", target: "n1", flagged: false, amount: 2100000 },
    { source: "n6", target: "n3", flagged: false, amount: 3400000 },
    { source: "n7", target: "n8", flagged: false, amount: 900000 },
    { source: "n7", target: "n9", flagged: false, amount: 780000 },
    { source: "n6", target: "n10", flagged: false, amount: 1200000 },
    { source: "n10", target: "n3", flagged: true, amount: 2800000 },
    { source: "n8", target: "n2", flagged: true, amount: 3100000 },
  ];
  return { nodes, edges };
}

const DATA_STREAM_TEMPLATES = [
  () => `[${new Date().toISOString().slice(11, 23)}] INFLATION_MODEL v9.2 → prediction: ${(2.1 + Math.random() * 0.5).toFixed(4)}%`,
  () => `[${new Date().toISOString().slice(11, 23)}] AML_SCAN → ${Math.floor(Math.random() * 9999)} transactions analyzed → ${Math.random() > 0.95 ? "⚠ ANOMALY" : "CLEAN"}`,
  () => `[${new Date().toISOString().slice(11, 23)}] INTEREST_RATE_ENGINE → current: 4.25% → recommended: ${(4.0 + Math.random() * 0.75).toFixed(2)}%`,
  () => `[${new Date().toISOString().slice(11, 23)}] MARKET_SIGNAL → VIX: ${(15 + Math.random() * 12).toFixed(2)} | DXY: ${(102 + Math.random() * 4).toFixed(3)}`,
  () => `[${new Date().toISOString().slice(11, 23)}] QUANTUM_ENTROPY_CHECK → blockchain_hash: 0x${Math.random().toString(16).slice(2, 18).toUpperCase()}`,
  () => `[${new Date().toISOString().slice(11, 23)}] SOVEREIGN_LEDGER_SYNC → ${(8400000 + Math.random() * 100000).toFixed(0)} units tracked`,
  () => `[${new Date().toISOString().slice(11, 23)}] NEURAL_CONFIDENCE → ${(95 + Math.random() * 4).toFixed(2)}% accuracy on 24h window`,
  () => `[${new Date().toISOString().slice(11, 23)}] CPI_INGEST → realtime feed: ${(3.1 + Math.random() * 0.3).toFixed(3)}% | delta: +${(Math.random() * 0.05).toFixed(3)}`,
  () => `[${new Date().toISOString().slice(11, 23)}] FX_MONITOR → USD/JPY: ${(156 + Math.random() * 3).toFixed(2)} ALERT_LEVEL: ${Math.random() > 0.7 ? "ELEVATED" : "NORMAL"}`,
];

function DataStream() {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    setLines(Array.from({ length: 10 }, () => DATA_STREAM_TEMPLATES[Math.floor(Math.random() * DATA_STREAM_TEMPLATES.length)]()));
    const iv = setInterval(() => {
      setLines((prev) => {
        const next = [...prev, DATA_STREAM_TEMPLATES[Math.floor(Math.random() * DATA_STREAM_TEMPLATES.length)]()];
        return next.slice(-18);
      });
    }, 1100);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="font-mono text-xs leading-relaxed overflow-hidden" style={{ height: 220, color: C.blue, opacity: 0.85 }}>
      <AnimatePresence initial={false}>
        {lines.map((line, i) => (
          <motion.div
            key={i + line.slice(0, 20)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="py-0.5 truncate"
            style={{ color: line.includes("ANOMALY") || line.includes("ALERT") ? C.warning : C.blue }}
          >
            {line}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── COUNTDOWN TIMER ──────────────────────────────────────────────────────
function useCountdown(targetHours = 38) {
  const end = useRef(Date.now() + targetHours * 3600 * 1000);
  const [remaining, setRemaining] = useState(targetHours * 3600);
  useEffect(() => {
    const iv = setInterval(() => {
      const diff = Math.max(0, Math.floor((end.current - Date.now()) / 1000));
      setRemaining(diff);
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── ASSESSMENT COLOR HELPERS ─────────────────────────────────────────────
function assessmentStyle(a: Assessment): { color: string; bg: string; border: string } {
  if (a === "CRITICAL") return { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" };
  if (a === "WATCH") return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" };
  return { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" };
}

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === "up") return <ArrowUp size={11} style={{ color: "#f59e0b" }} />;
  if (trend === "down") return <ArrowDown size={11} style={{ color: "#ef4444" }} />;
  return <Minus size={11} style={{ color: "#94a3b8" }} />;
}

// ─── ECONOMIC SIGNAL CARD ─────────────────────────────────────────────────
function SignalCard({ sig }: { sig: EconSignal }) {
  const ast = assessmentStyle(sig.assessment);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-3 flex flex-col gap-1"
      style={{ background: C.bgSec, border: `1px solid ${ast.border}` }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs uppercase tracking-wide truncate" style={{ color: C.textSec, maxWidth: "65%" }}>{sig.label}</span>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ color: ast.color, background: ast.bg, border: `1px solid ${ast.border}`, whiteSpace: "nowrap" }}>
          {sig.assessment}
        </span>
      </div>
      <div className="flex items-end gap-1.5 mt-0.5">
        <span className="text-lg font-bold font-mono leading-none" style={{ color: C.gold }}>
          {sig.value}
        </span>
        <span className="text-xs mb-0.5" style={{ color: C.textSec }}>{sig.unit}</span>
        <div className="ml-auto flex items-center gap-0.5">
          <TrendArrow trend={sig.trend} />
          <span className="text-xs font-mono" style={{ color: sig.trend === "down" ? "#ef4444" : sig.trend === "up" ? "#f59e0b" : "#94a3b8" }}>
            {sig.delta}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: C.bgSec, border: `1px solid ${C.border}`, color: C.textPri }}>
      <p className="font-semibold mb-1" style={{ color: C.gold }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}%</p>
      ))}
    </div>
  );
};

// ─── NETWORK GRAPH ────────────────────────────────────────────────────────
type RiskFilter = "ALL" | "HIGH" | "MEDIUM" | "LOW";

function nodeColor(risk: NetworkNode["risk"]) {
  if (risk === "HIGH") return "#ef4444";
  if (risk === "MEDIUM") return "#f59e0b";
  return "#22c55e";
}

function nodeRadius(amount: number) {
  const base = Math.sqrt(amount / 1000000);
  return Math.max(7, Math.min(22, base * 5));
}

function NetworkGraph({ riskFilter }: { riskFilter: RiskFilter }) {
  const { nodes, edges } = generateNetwork();
  const filtered = riskFilter === "ALL" ? nodes : nodes.filter((n) => n.risk === riskFilter);
  const filteredIds = new Set(filtered.map((n) => n.id));
  const filteredEdges = edges.filter((e) => filteredIds.has(e.source) && filteredIds.has(e.target));
  const [hovered, setHovered] = useState<string | null>(null);

  const W = 600;
  const H = 280;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
      <defs>
        <radialGradient id="glowRed" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="glowAmber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Edges */}
      {filteredEdges.map((e, i) => {
        const src = filtered.find((n) => n.id === e.source);
        const tgt = filtered.find((n) => n.id === e.target);
        if (!src || !tgt) return null;
        return (
          <line
            key={i}
            x1={src.x} y1={src.y}
            x2={tgt.x} y2={tgt.y}
            stroke={e.flagged ? "#ef4444" : "rgba(148,163,184,0.3)"}
            strokeWidth={e.flagged ? 1.8 : 0.9}
            strokeDasharray={e.flagged ? "4 3" : "none"}
            opacity={0.85}
          />
        );
      })}

      {/* Nodes */}
      {filtered.map((node) => {
        const r = nodeRadius(node.amount);
        const isHov = hovered === node.id;
        return (
          <g key={node.id} style={{ cursor: "pointer" }} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)}>
            {isHov && (
              <circle cx={node.x} cy={node.y} r={r + 10} fill={node.risk === "HIGH" ? "url(#glowRed)" : "url(#glowAmber)"} />
            )}
            <circle
              cx={node.x} cy={node.y}
              r={r}
              fill={`${nodeColor(node.risk)}22`}
              stroke={nodeColor(node.risk)}
              strokeWidth={isHov ? 2 : 1.5}
            />
            <text x={node.x} y={node.y + r + 11} textAnchor="middle" fontSize={8} fill="#94a3b8">{node.label}</text>
            {isHov && (
              <foreignObject x={node.x - 60} y={node.y - r - 32} width={120} height={28}>
                <div
                  style={{
                    background: "rgba(10,15,46,0.95)",
                    border: "1px solid rgba(212,160,23,0.3)",
                    borderRadius: 6,
                    padding: "3px 7px",
                    fontSize: 9,
                    color: "#d4a017",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  ${(node.amount / 1000000).toFixed(1)}M — {node.risk}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function AGIBrain() {
  const { config, loading } = useConfigurables();
  const title = loading ? "AGI Monetary Brain" : (config?.agiBrainTitle ?? "AGI Monetary Brain");

  const [inflationData] = useState(generateInflationData);
  const [radarData] = useState(generateRadarData);
  const [signals] = useState(buildSignals);
  const [policyLog] = useState(generatePolicyLog);

  // Live metrics
  const [inflationPct, setInflationPct] = useState(3.24);
  const [confidence, setConfidence] = useState(95.3);
  const [interestRate] = useState(4.25);
  const [agiRecommendedRate, setAgiRecommendedRate] = useState(3.75);
  const [amlScore, setAmlScore] = useState(91.4);

  // Risk network filter
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");

  // Countdown to next policy window
  const countdown = useCountdown(38);

  useEffect(() => {
    const iv = setInterval(() => {
      setInflationPct((v) => parseFloat((v + (Math.random() - 0.5) * 0.04).toFixed(2)));
      setAgiRecommendedRate((v) => parseFloat(Math.min(5.0, Math.max(3.0, v + (Math.random() - 0.5) * 0.02)).toFixed(2)));
      setAmlScore((v) => parseFloat(Math.min(99, Math.max(88, v + (Math.random() - 0.5) * 0.3)).toFixed(1)));
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  const rateDelta = parseFloat((interestRate - agiRecommendedRate).toFixed(2));

  return (
    <AppLayout>
      <Header title={title} subtitle="Autonomous Monetary Intelligence — Full Depth Layer" />

      <div className="flex-1 p-6 space-y-6">

        {/* ── Status Bar ─────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}
        >
          <Cpu size={15} style={{ color: C.blue }} />
          <span className="text-sm font-medium" style={{ color: C.blue }}>
            AGI Monetary Brain — ACTIVE
          </span>
          <div className="w-1.5 h-1.5 rounded-full animate-me-pulse ml-1" style={{ background: C.blue }} />
          <span className="ml-auto text-xs font-mono" style={{ color: C.textSec }}>
            Model: SOVEREIGN-MIND-v9.2 | Context: 180-day macro | Signals: 13 live
          </span>
          <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold" style={{ background: "rgba(59,130,246,0.12)", color: C.blue }}>
            LIVE
          </div>
        </div>

        {/* ── SECTION 1: Economic Signal Dashboard ───────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} style={{ color: C.gold }} />
            <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: C.textPri }}>
              Economic Signal Dashboard
            </h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: "rgba(212,160,23,0.1)", color: C.gold, border: "1px solid rgba(212,160,23,0.2)" }}>
              13 SIGNALS MONITORED
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {signals.map((sig, i) => (
              <motion.div key={sig.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <SignalCard sig={sig} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── SECTION 2: Enhanced Inflation Prediction Panel + Radar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Inflation Chart */}
          <div className="me-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: C.textPri }}>
                  Inflation Prediction vs Actual
                </h3>
                <p className="text-xs" style={{ color: C.textSec }}>30-period rolling AGI forecast with 95% confidence band</p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
                  style={{ background: "rgba(212,160,23,0.1)", color: C.gold, border: "1px solid rgba(212,160,23,0.2)" }}
                >
                  <Zap size={10} />
                  95.3% ACC
                </div>
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
                  style={{ background: "rgba(59,130,246,0.08)", color: C.blue, border: "1px solid rgba(59,130,246,0.2)" }}
                >
                  <Clock size={10} />
                  <span className="font-bold">{countdown}</span>
                  <span style={{ color: C.textSec }}>next policy</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded" style={{ background: C.gold }} />
                <span className="text-xs" style={{ color: C.textSec }}>Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded" style={{ background: C.blue, borderBottom: "1px dashed" }} />
                <span className="text-xs" style={{ color: C.textSec }}>AGI Predicted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 rounded" style={{ background: "rgba(59,130,246,0.2)" }} />
                <span className="text-xs" style={{ color: C.textSec }}>Confidence Band</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={inflationData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4a017" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#d4a017" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.07)" />
                <XAxis dataKey="period" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[1.0, 3.6]} />
                <Tooltip content={<CustomTooltip />} />
                {/* Confidence band: fill between upper and lower */}
                <Area type="monotone" dataKey="upper" name="Upper Band" stroke="transparent" fill="url(#bandGrad)" />
                <Area type="monotone" dataKey="lower" name="Lower Band" stroke="transparent" fill="rgba(10,15,46,0)" />
                {/* Actual */}
                <Area type="monotone" dataKey="actual" name="Actual (%)" stroke="#d4a017" strokeWidth={2} fill="url(#actualGrad)" dot={false} />
                {/* Predicted */}
                <Area type="monotone" dataKey="predicted" name="AGI Predicted (%)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 3" fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div className="me-card p-5">
            <h3 className="text-sm font-semibold mb-1" style={{ color: C.textPri }}>Monetary Health Radar</h3>
            <p className="text-xs mb-3" style={{ color: C.textSec }}>AGI multi-dimensional sovereign assessment</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(212,160,23,0.1)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                <Radar name="Health" dataKey="value" stroke="#d4a017" fill="#d4a017" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── SECTION 3: Interest Rate Recommendation Engine ──────────── */}
        <div className="me-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} style={{ color: C.gold }} />
            <h3 className="text-sm font-semibold" style={{ color: C.textPri }}>Interest Rate Recommendation Engine</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded font-mono" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
              NEURAL ENGINE v4.1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {/* Current Rate */}
            <div className="rounded-lg p-4 text-center" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}>
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.textSec }}>Current Rate</div>
              <div className="text-4xl font-bold font-mono" style={{ color: C.textPri }}>{interestRate.toFixed(2)}<span className="text-lg">%</span></div>
              <div className="text-xs mt-1" style={{ color: C.textSec }}>Fed Funds — in effect</div>
            </div>

            {/* Delta */}
            <div className="rounded-lg p-4 text-center flex flex-col items-center justify-center gap-2" style={{ background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.2)" }}>
              <div className="text-xs uppercase tracking-widest" style={{ color: C.textSec }}>AGI Delta</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold font-mono" style={{ color: rateDelta > 0 ? "#ef4444" : "#22c55e" }}>
                  {rateDelta > 0 ? "+" : ""}{rateDelta.toFixed(2)}%
                </span>
                {rateDelta > 0 ? <TrendingDown size={20} style={{ color: "#ef4444" }} /> : <TrendingUp size={20} style={{ color: "#22c55e" }} />}
              </div>
              <div className="text-xs" style={{ color: C.textSec }}>
                {rateDelta > 0 ? "Rate is above optimal" : "Rate is below optimal"}
              </div>
            </div>

            {/* Recommended Rate */}
            <div className="rounded-lg p-4 text-center" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: C.textSec }}>AGI Recommended</div>
              <div className="text-4xl font-bold font-mono" style={{ color: C.blue }}>{agiRecommendedRate.toFixed(2)}<span className="text-lg">%</span></div>
              <div className="text-xs mt-1" style={{ color: C.textSec }}>Optimal policy target</div>
            </div>
          </div>

          {/* Timeline + Rationale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={12} style={{ color: C.blue }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textPri }}>Rate Adjustment Timeline</span>
              </div>
              <div className="space-y-2">
                {[
                  { date: "2026-07-30", action: "FOMC Meeting — window to adjust", delta: rateDelta > 0 ? "-25bps" : "+25bps", active: true },
                  { date: "2026-09-17", action: "Secondary adjustment opportunity", delta: rateDelta > 0 ? "-25bps" : "Hold", active: false },
                  { date: "2026-11-05", action: "Year-end policy normalization", delta: "Review", active: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.active ? C.gold : "#374151" }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono" style={{ color: C.textSec }}>{item.date}</span>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ color: item.active ? C.gold : C.textSec, background: item.active ? "rgba(212,160,23,0.1)" : "transparent" }}>
                          {item.delta}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: C.textPri }}>{item.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Brain size={12} style={{ color: C.gold }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textPri }}>AGI Rationale</span>
              </div>
              <ul className="space-y-2">
                {[
                  `CPI at ${inflationPct.toFixed(2)}% — above 2% target, cut-case weakening`,
                  `M2 growth +0.3T signals excess liquidity pressure`,
                  `10Y yield at 4.68% creates inversion risk if rate elevated`,
                  `JPY corridor stress: FX volatility argues for hold/cut`,
                  `GDP growth ${2.18}% declining — restrictive stance amplifies slowdown risk`,
                ].map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: C.textPri }}>
                    <ChevronRight size={11} className="mt-0.5 flex-shrink-0" style={{ color: C.gold }} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Money Laundering Risk Network ───────────────── */}
        <div className="me-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Network size={14} style={{ color: "#ef4444" }} />
            <h3 className="text-sm font-semibold" style={{ color: C.textPri }}>Money Laundering Risk Network</h3>
            <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              10 ENTITIES FLAGGED
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Filter size={11} style={{ color: C.textSec }} />
              <span className="text-xs" style={{ color: C.textSec }}>Risk:</span>
              {(["ALL", "HIGH", "MEDIUM", "LOW"] as RiskFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setRiskFilter(f)}
                  className="text-xs px-2 py-0.5 rounded font-medium transition-all"
                  style={{
                    background: riskFilter === f ? (f === "HIGH" ? "rgba(239,68,68,0.2)" : f === "MEDIUM" ? "rgba(245,158,11,0.2)" : f === "LOW" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)") : "rgba(255,255,255,0.03)",
                    color: riskFilter === f ? (f === "HIGH" ? "#ef4444" : f === "MEDIUM" ? "#f59e0b" : f === "LOW" ? "#22c55e" : C.blue) : C.textSec,
                    border: `1px solid ${riskFilter === f ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                    cursor: "pointer",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ background: "rgba(5,8,25,0.6)", border: `1px solid ${C.border}` }}>
            <NetworkGraph riskFilter={riskFilter} />
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} /><span className="text-xs" style={{ color: C.textSec }}>HIGH — Core flagged entities</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} /><span className="text-xs" style={{ color: C.textSec }}>MEDIUM — Watch list</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} /><span className="text-xs" style={{ color: C.textSec }}>LOW — Monitored</span></div>
            <div className="flex items-center gap-1.5 ml-2"><div className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: "#ef4444" }} /><span className="text-xs" style={{ color: C.textSec }}>Flagged connection</span></div>
            <span className="ml-auto text-xs font-mono" style={{ color: C.textSec }}>Node size = transaction amount</span>
          </div>
        </div>

        {/* ── SECTION 5: AGI Policy Execution Log + Data Stream ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Policy Log */}
          <div className="me-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} style={{ color: C.gold }} />
              <h3 className="text-sm font-semibold" style={{ color: C.textPri }}>AGI Policy Execution Log</h3>
              <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                AUTONOMOUS
              </span>
            </div>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 340 }}>
              <AnimatePresence>
                {policyLog.map((entry, i) => {
                  const outcomeColor = entry.outcome === "EXECUTED" ? "#22c55e" : entry.outcome === "PENDING" ? "#f59e0b" : "#ef4444";
                  const outcomeBg = entry.outcome === "EXECUTED" ? "rgba(34,197,94,0.08)" : entry.outcome === "PENDING" ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-lg p-3"
                      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-mono" style={{ color: C.textSec }}>{entry.timestamp}</span>
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ color: outcomeColor, background: outcomeBg, border: `1px solid ${outcomeColor}33` }}
                        >
                          {entry.outcome}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed mb-1.5" style={{ color: C.textPri }}>{entry.action}</p>
                      <div className="flex items-center gap-1.5">
                        <Zap size={9} style={{ color: C.gold }} />
                        <span className="text-xs font-mono" style={{ color: C.textSec }}>Trigger: {entry.trigger}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* AGI Thinking Stream */}
          <div className="me-card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Brain size={14} style={{ color: C.blue }} />
              <h3 className="text-sm font-semibold" style={{ color: C.textPri }}>AGI Thinking Stream</h3>
              <div className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded text-xs" style={{ background: "rgba(59,130,246,0.1)", color: C.blue }}>
                <div className="w-1.5 h-1.5 rounded-full animate-me-pulse" style={{ background: C.blue }} />
                PROCESSING
              </div>
            </div>
            <div className="rounded-lg p-3 overflow-hidden flex-1" style={{ background: C.bgSec, border: "1px solid rgba(59,130,246,0.1)" }}>
              <DataStream />
            </div>

            {/* Summary stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Prediction Acc.", value: `${confidence.toFixed(1)}%`, color: C.gold },
                { label: "AML Safety", value: `${amlScore.toFixed(1)}/100`, color: "#22c55e" },
                { label: "Inflation Est.", value: `${inflationPct.toFixed(2)}%`, color: C.blue },
              ].map((m) => (
                <div key={m.label} className="rounded-lg p-2.5 text-center" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}` }}>
                  <div className="text-xs mb-0.5" style={{ color: C.textSec }}>{m.label}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
