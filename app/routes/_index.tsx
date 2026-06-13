import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Printer,
  Flame,
  Globe2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";
import { useConfigurables } from "~/modules/configurables";

// --- Data generators ---
function generateSupplyHistory() {
  const base = 8_420_000;
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    supply: base + Math.round((Math.random() - 0.48) * 50000 * i),
    issuance: Math.round(12000 + Math.random() * 8000),
    destruction: Math.round(9000 + Math.random() * 6000),
  }));
}

function generateVelocityData() {
  return Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    velocity: parseFloat((1.8 + Math.random() * 0.8).toFixed(2)),
    target: 2.2,
  }));
}

const CURRENCY_FLOWS = [
  { from: "USA", to: "EU", amount: "$4.2B", status: "ACTIVE" },
  { from: "China", to: "Japan", amount: "$2.8B", status: "ACTIVE" },
  { from: "UK", to: "UAE", amount: "$1.1B", status: "ACTIVE" },
  { from: "Germany", to: "Brazil", amount: "$890M", status: "PENDING" },
  { from: "India", to: "USA", amount: "$3.3B", status: "ACTIVE" },
  { from: "Singapore", to: "UK", amount: "$760M", status: "ACTIVE" },
];

// Counter animation hook
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function StatCard({
  label,
  value,
  suffix = "",
  prefix = "",
  trend,
  trendVal,
  icon: Icon,
  color = "var(--me-gold)",
  pulse = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  trend?: "up" | "down";
  trendVal?: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color?: string;
  pulse?: boolean;
}) {
  const displayed = useCountUp(value);

  const formattedValue =
    value >= 1_000_000_000
      ? (displayed / 1_000_000_000).toFixed(2) + "B"
      : value >= 1_000_000
      ? (displayed / 1_000_000).toFixed(1) + "M"
      : value >= 1_000
      ? (displayed / 1_000).toFixed(1) + "K"
      : displayed.toLocaleString();

  return (
    <div
      className="me-card p-5 relative overflow-hidden transition-all duration-300"
      style={{ boxShadow: pulse ? "0 0 16px rgba(212,160,23,0.15)" : undefined }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5"
        style={{ background: color, transform: "translate(30%, -30%)" }}
      />

      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--me-text-secondary)" }}
        >
          {label}
        </span>
        <div
          className="p-1.5 rounded"
          style={{ background: `rgba(${color === "var(--me-gold)" ? "212,160,23" : "59,130,246"},0.12)` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span
          className="text-2xl font-bold font-mono tracking-tight"
          style={{ color }}
        >
          {prefix}{formattedValue}{suffix}
        </span>
        {pulse && (
          <div
            className="mb-1 w-2 h-2 rounded-full animate-me-pulse"
            style={{ background: color }}
          />
        )}
      </div>

      {trend && trendVal && (
        <div className="mt-2 flex items-center gap-1">
          {trend === "up" ? (
            <ArrowUpRight size={12} style={{ color: "var(--me-success)" }} />
          ) : (
            <ArrowDownRight size={12} style={{ color: "var(--me-danger)" }} />
          )}
          <span
            className="text-xs font-medium"
            style={{ color: trend === "up" ? "var(--me-success)" : "var(--me-danger)" }}
          >
            {trendVal}
          </span>
          <span className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
            vs last 24h
          </span>
        </div>
      )}
    </div>
  );
}

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
      <p className="font-semibold mb-1" style={{ color: "var(--me-gold)" }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

export default function CommandCenter() {
  const { config, loading } = useConfigurables();
  const title = loading ? "Central Bank Command Center" : (config?.commandCenterTitle ?? "Central Bank Command Center");
  const [supplyData] = useState(generateSupplyHistory);
  const [velocityData] = useState(generateVelocityData);
  const [liveSupply, setLiveSupply] = useState(8_423_741_000);
  const [flowIndex, setFlowIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSupply((v) => v + Math.round((Math.random() - 0.47) * 12000));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlowIndex((i) => (i + 1) % CURRENCY_FLOWS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <Header title={title} subtitle="Real-time Sovereign Currency Intelligence" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stat Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Supply"
            value={liveSupply}
            prefix="$"
            icon={DollarSign}
            color="var(--me-gold)"
            trend="up"
            trendVal="+0.12%"
            pulse
          />
          <StatCard
            label="Velocity Index"
            value={214}
            suffix="%"
            icon={Activity}
            color="var(--me-blue)"
            trend="up"
            trendVal="+3.2%"
          />
          <StatCard
            label="Issuance Rate"
            value={1847200}
            prefix="$"
            icon={Printer}
            color="var(--me-success)"
            trend="down"
            trendVal="-1.8%"
          />
          <StatCard
            label="Destruction Rate"
            value={923100}
            prefix="$"
            icon={Flame}
            color="var(--me-danger)"
            trend="up"
            trendVal="+4.1%"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Supply History Chart */}
          <div className="me-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                  Supply History — 24h
                </h3>
                <p className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                  Total fiat units in circulation
                </p>
              </div>
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
                style={{ background: "rgba(59,130,246,0.1)", color: "var(--me-blue)" }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-me-pulse" style={{ background: "var(--me-blue)" }} />
                LIVE
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={supplyData}>
                <defs>
                  <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.08)" />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="supply"
                  name="Supply ($)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#supplyGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Issuance vs Destruction */}
          <div className="me-card p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                Issue vs Destroy
              </h3>
              <p className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                Units per hour
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={supplyData.slice(-8)} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.08)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="issuance" name="Issued ($)" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="destruction" name="Destroyed ($)" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Velocity Chart + Currency Flows */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Velocity Chart */}
          <div className="me-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                  Monetary Velocity Index
                </h3>
                <p className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                  Annual velocity vs target threshold
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.08)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[1.5, 3]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="velocity"
                  name="Velocity"
                  stroke="#d4a017"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Currency Flows */}
          <div className="me-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 size={14} style={{ color: "var(--me-gold)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                Live Currency Flows
              </h3>
            </div>
            <div className="space-y-2">
              {CURRENCY_FLOWS.map((flow, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300"
                  style={{
                    background: i === flowIndex ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${i === flowIndex ? "rgba(59,130,246,0.2)" : "transparent"}`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: "var(--me-text-secondary)" }}>
                      {flow.from}
                    </span>
                    <Zap size={10} style={{ color: "var(--me-gold)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--me-text-secondary)" }}>
                      {flow.to}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold" style={{ color: "var(--me-gold)" }}>
                      {flow.amount}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        flow.status === "ACTIVE" ? "status-verified" : "status-pending"
                      }`}
                    >
                      {flow.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--me-border)" }}>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--me-text-secondary)" }}>Active corridors</span>
                <span className="font-bold" style={{ color: "var(--me-blue)" }}>
                  142 nations
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
