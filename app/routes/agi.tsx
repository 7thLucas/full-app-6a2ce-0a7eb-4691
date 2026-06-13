import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
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
} from "recharts";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, Cpu, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";
import { useConfigurables } from "~/modules/configurables";

// Generate inflation prediction data
function generateInflationData() {
  return Array.from({ length: 24 }, (_, i) => ({
    period: `T-${23 - i}h`,
    actual: parseFloat((2.1 + Math.sin(i * 0.3) * 0.8 + Math.random() * 0.2).toFixed(2)),
    predicted: parseFloat((2.1 + Math.sin(i * 0.3) * 0.8 + (Math.random() - 0.5) * 0.05).toFixed(2)),
    upper: parseFloat((2.1 + Math.sin(i * 0.3) * 0.8 + 0.15).toFixed(2)),
    lower: parseFloat((2.1 + Math.sin(i * 0.3) * 0.8 - 0.15).toFixed(2)),
  }));
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

const DATA_STREAM_CHARS = "0123456789ABCDEF$€£¥₿∑∆∫∂π";

function DataStream() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const templates = [
      () => `[${new Date().toISOString().slice(11, 23)}] INFLATION_MODEL v9.2 → prediction: ${(2.1 + Math.random() * 0.5).toFixed(4)}%`,
      () => `[${new Date().toISOString().slice(11, 23)}] AML_SCAN → ${Math.floor(Math.random() * 9999)} transactions analyzed → ${Math.random() > 0.95 ? "⚠ ANOMALY" : "CLEAN"}`,
      () => `[${new Date().toISOString().slice(11, 23)}] INTEREST_RATE_ENGINE → current: 4.25% → recommended: ${(4.0 + Math.random() * 0.75).toFixed(2)}%`,
      () => `[${new Date().toISOString().slice(11, 23)}] MARKET_SIGNAL → VIX: ${(15 + Math.random() * 12).toFixed(2)} | DXY: ${(102 + Math.random() * 4).toFixed(3)}`,
      () => `[${new Date().toISOString().slice(11, 23)}] QUANTUM_ENTROPY_CHECK → blockchain_hash: 0x${Math.random().toString(16).slice(2, 18).toUpperCase()}`,
      () => `[${new Date().toISOString().slice(11, 23)}] SOVEREIGN_LEDGER_SYNC → ${(8400000 + Math.random() * 100000).toFixed(0)} units tracked`,
      () => `[${new Date().toISOString().slice(11, 23)}] NEURAL_CONFIDENCE → ${(95 + Math.random() * 4).toFixed(2)}% accuracy on 24h window`,
    ];

    // Initial lines
    setLines(Array.from({ length: 10 }, () => templates[Math.floor(Math.random() * templates.length)]()));

    const interval = setInterval(() => {
      setLines((prev) => {
        const next = [...prev, templates[Math.floor(Math.random() * templates.length)]()];
        return next.slice(-18);
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="font-mono text-xs leading-relaxed overflow-hidden"
      style={{ height: 260, color: "var(--me-blue)", opacity: 0.85 }}
    >
      <AnimatePresence initial={false}>
        {lines.map((line, i) => (
          <motion.div
            key={i + line.slice(0, 20)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="py-0.5 truncate"
            style={{ color: line.includes("ANOMALY") ? "var(--me-warning)" : "var(--me-blue)" }}
          >
            {line}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface AnomalyAlert {
  id: string;
  type: string;
  message: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  timestamp: string;
}

function generateAnomalies(count = 8): AnomalyAlert[] {
  const types = [
    { type: "VELOCITY_SPIKE", msg: "Unusual velocity spike detected in EUR corridor" },
    { type: "LAUNDERING_PATTERN", msg: "Structuring pattern identified — $485K across 12 accounts" },
    { type: "DOUBLE_SPEND", msg: "Duplicate serial TX attempt blocked — SN: AA8472901" },
    { type: "RATE_DEVIATION", msg: "Interest rate model deviation exceeds 0.5% threshold" },
    { type: "SUPPLY_ANOMALY", msg: "Issuance spike +22% — Federal Reserve batch BT-44521" },
    { type: "COUNTERFEIT_CLUSTER", msg: "3 blacklisted serials detected in same institution" },
    { type: "LIQUIDITY_WARNING", msg: "Overnight liquidity below sovereign buffer threshold" },
    { type: "CROSS_BORDER_FLAG", msg: "Suspicious JPY-USD corridor activity — $2.1B unusual flow" },
  ];
  const sevs: AnomalyAlert["severity"][] = ["HIGH", "MEDIUM", "LOW", "MEDIUM", "HIGH", "HIGH", "MEDIUM", "LOW"];
  return types.slice(0, count).map((t, i) => ({
    id: String(i),
    type: t.type,
    message: t.msg,
    severity: sevs[i],
    timestamp: new Date(Date.now() - i * 420000).toISOString().slice(11, 19),
  }));
}

const SEV_CONFIG = {
  HIGH: { className: "status-blacklisted", label: "HIGH" },
  MEDIUM: { className: "status-flagged", label: "MED" },
  LOW: { className: "status-verified", label: "LOW" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{
        background: "var(--me-bg-secondary)",
        border: "1px solid var(--me-border)",
        color: "var(--me-text-primary)",
      }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--me-gold)" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  );
};

function LiveMetric({
  label,
  value,
  suffix = "",
  color = "var(--me-gold)",
  subtext,
  trend,
}: {
  label: string;
  value: string;
  suffix?: string;
  color?: string;
  subtext?: string;
  trend?: "up" | "down" | "stable";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Activity;
  return (
    <div className="me-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider" style={{ color: "var(--me-text-secondary)" }}>
          {label}
        </span>
        <TrendIcon
          size={12}
          style={{
            color:
              trend === "up" ? "var(--me-success)" : trend === "down" ? "var(--me-danger)" : "var(--me-text-secondary)",
          }}
        />
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>
        {value}
        <span className="text-sm ml-0.5">{suffix}</span>
      </div>
      {subtext && (
        <div className="text-xs mt-1" style={{ color: "var(--me-text-secondary)" }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

export default function AGIBrain() {
  const { config, loading } = useConfigurables();
  const title = loading ? "AGI Monetary Brain" : (config?.agiBrainTitle ?? "AGI Monetary Brain");

  const [inflationData] = useState(generateInflationData);
  const [radarData] = useState(generateRadarData);
  const [anomalies] = useState(() => generateAnomalies(8));

  const [inflationPct, setInflationPct] = useState(2.34);
  const [confidence, setConfidence] = useState(97.2);
  const [interestRate, setInterestRate] = useState(4.25);
  const [amlScore, setAmlScore] = useState(91.4);

  useEffect(() => {
    const iv = setInterval(() => {
      setInflationPct((v) => parseFloat((v + (Math.random() - 0.5) * 0.04).toFixed(2)));
      setConfidence((v) => parseFloat(Math.min(99.9, Math.max(94, v + (Math.random() - 0.5) * 0.2)).toFixed(1)));
      setAmlScore((v) => parseFloat(Math.min(99, Math.max(88, v + (Math.random() - 0.5) * 0.3)).toFixed(1)));
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  return (
    <AppLayout>
      <Header title={title} subtitle="Autonomous Monetary Intelligence — 95%+ Prediction Accuracy" />

      <div className="flex-1 p-6 space-y-5">
        {/* Top bar: AGI status */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}
        >
          <Cpu size={16} style={{ color: "var(--me-blue)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--me-blue)" }}>
            AGI Monetary Brain — ACTIVE
          </span>
          <div className="w-1.5 h-1.5 rounded-full animate-me-pulse ml-1" style={{ background: "var(--me-blue)" }} />
          <span className="ml-auto text-xs font-mono" style={{ color: "var(--me-text-secondary)" }}>
            Model: SOVEREIGN-MIND-v9.2 | Context Window: 180-day macro
          </span>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
            style={{ background: "rgba(59,130,246,0.12)", color: "var(--me-blue)" }}
          >
            LIVE
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <LiveMetric
            label="Inflation Prediction"
            value={inflationPct.toFixed(2)}
            suffix="%"
            color="var(--me-gold)"
            subtext={`${confidence}% confidence`}
            trend="up"
          />
          <LiveMetric
            label="Recommended Rate"
            value={interestRate.toFixed(2)}
            suffix="%"
            color="var(--me-blue)"
            subtext="Optimal policy target"
            trend="stable"
          />
          <LiveMetric
            label="AML Risk Score"
            value={amlScore.toFixed(1)}
            suffix="/100"
            color="var(--me-success)"
            subtext="System-wide safety index"
            trend="up"
          />
          <LiveMetric
            label="Neural Accuracy"
            value={confidence.toFixed(1)}
            suffix="%"
            color="var(--me-warning)"
            subtext="24h prediction window"
            trend="up"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Inflation Prediction Chart */}
          <div className="me-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                  Inflation Prediction vs Actual
                </h3>
                <p className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                  24-hour rolling AGI forecast with confidence band
                </p>
              </div>
              <div
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
                style={{ background: "rgba(212,160,23,0.1)", color: "var(--me-gold)" }}
              >
                <Zap size={10} />
                95.2% ACC
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={inflationData}>
                <defs>
                  <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.07)" />
                <XAxis
                  dataKey="period"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[1.2, 3.2]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="upper"
                  name="Upper Band"
                  stroke="transparent"
                  fill="url(#confBand)"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  name="Lower Band"
                  stroke="transparent"
                  fill="rgba(10,15,46,0)"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual (%)"
                  stroke="#d4a017"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="AGI Predicted (%)"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Radar: Monetary Health */}
          <div className="me-card p-5">
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--me-text-primary)" }}>
              Monetary Health Radar
            </h3>
            <p className="text-xs mb-3" style={{ color: "var(--me-text-secondary)" }}>
              AGI multi-dimensional sovereign assessment
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(212,160,23,0.1)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                />
                <Radar
                  name="Health"
                  dataKey="value"
                  stroke="#d4a017"
                  fill="#d4a017"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* AGI Data Stream */}
          <div className="me-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} style={{ color: "var(--me-blue)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                AGI Thinking Stream
              </h3>
              <div className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded text-xs" style={{ background: "rgba(59,130,246,0.1)", color: "var(--me-blue)" }}>
                <div className="w-1.5 h-1.5 rounded-full animate-me-pulse" style={{ background: "var(--me-blue)" }} />
                PROCESSING
              </div>
            </div>
            <div
              className="rounded-lg p-3 overflow-hidden"
              style={{ background: "var(--me-bg-secondary)", border: "1px solid rgba(59,130,246,0.1)" }}
            >
              <DataStream />
            </div>
          </div>

          {/* Anomaly Feed */}
          <div className="me-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: "var(--me-warning)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                Anomaly Feed
              </h3>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(239,68,68,0.1)", color: "var(--me-danger)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {anomalies.filter((a) => a.severity === "HIGH").length} HIGH PRIORITY
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 310 }}>
              {anomalies.map((alert, i) => {
                const cfg = SEV_CONFIG[alert.severity];
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                    style={{
                      background:
                        alert.severity === "HIGH"
                          ? "rgba(239,68,68,0.05)"
                          : "rgba(255,255,255,0.02)",
                      border: `1px solid ${
                        alert.severity === "HIGH"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(255,255,255,0.04)"
                      }`,
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {alert.severity === "HIGH" ? (
                        <AlertTriangle size={12} style={{ color: "var(--me-danger)" }} />
                      ) : (
                        <CheckCircle size={12} style={{ color: "var(--me-warning)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-xs font-mono font-semibold"
                          style={{ color: "var(--me-text-secondary)" }}
                        >
                          {alert.type}
                        </span>
                        <span className={`text-xs px-1.5 py-0 rounded font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs leading-snug" style={{ color: "var(--me-text-primary)" }}>
                        {alert.message}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs font-mono" style={{ color: "var(--me-text-secondary)" }}>
                      {alert.timestamp}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
