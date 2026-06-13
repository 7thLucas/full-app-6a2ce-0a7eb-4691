import { useState, useEffect, useRef } from "react";
import {
  Send, Plus, ArrowRight, CheckCircle, Clock, Zap, Globe2, Building2,
  RefreshCw, Filter, Shield, ChevronDown, ChevronRight, X, TrendingUp,
  Award, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";
import { useConfigurables } from "~/modules/configurables";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettlementStep = "INITIATED" | "QUANTUM-VERIFIED" | "CROSS-CHAIN-LOCKED" | "SETTLED";
type SettlementPriority = "STANDARD" | "PRIORITY" | "EMERGENCY";
type InstitutionStatus = "ONLINE" | "OFFLINE" | "SYNCING";
type InstitutionCategory = "central-bank" | "national-treasury" | "commercial-bank";

interface Institution {
  id: string;
  name: string;
  short: string;
  country: string;
  flag: string;
  category: InstitutionCategory;
  status: InstitutionStatus;
  volume24h: number;
}

interface SettlementStepInfo {
  step: SettlementStep;
  timestamp: string;
  duration?: number;
}

interface Transfer {
  id: string;
  sender: string;
  senderShort: string;
  recipient: string;
  recipientShort: string;
  amount: number;
  currencyPair: string;
  priority: SettlementPriority;
  memo: string;
  currentStep: SettlementStep;
  steps: SettlementStepInfo[];
  completedAt?: string;
  proofHash?: string;
  swiftDaysSaved: number;
  expanded: boolean;
}

interface NewTransferForm {
  sender: string;
  recipient: string;
  amount: string;
  currencyPair: string;
  priority: SettlementPriority;
  memo: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INSTITUTIONS: Institution[] = [
  { id: "fed",   name: "Federal Reserve",          short: "Fed",       country: "USA",           flag: "🇺🇸", category: "central-bank",      status: "ONLINE",  volume24h: 842_000_000_000 },
  { id: "ecb",   name: "European Central Bank",    short: "ECB",       country: "EU",            flag: "🇪🇺", category: "central-bank",      status: "ONLINE",  volume24h: 612_000_000_000 },
  { id: "bi",    name: "Bank Indonesia",           short: "BI",        country: "Indonesia",     flag: "🇮🇩", category: "central-bank",      status: "ONLINE",  volume24h: 48_000_000_000  },
  { id: "pboc",  name: "People's Bank of China",  short: "PBoC",      country: "China",         flag: "🇨🇳", category: "central-bank",      status: "SYNCING", volume24h: 520_000_000_000 },
  { id: "boj",   name: "Bank of Japan",           short: "BoJ",       country: "Japan",         flag: "🇯🇵", category: "central-bank",      status: "ONLINE",  volume24h: 310_000_000_000 },
  { id: "rba",   name: "Reserve Bank of Australia", short: "RBA",     country: "Australia",     flag: "🇦🇺", category: "central-bank",      status: "ONLINE",  volume24h: 95_000_000_000  },
  { id: "boe",   name: "Bank of England",         short: "BoE",       country: "UK",            flag: "🇬🇧", category: "central-bank",      status: "ONLINE",  volume24h: 280_000_000_000 },
  { id: "sama",  name: "Saudi Central Bank",      short: "SAMA",      country: "Saudi Arabia",  flag: "🇸🇦", category: "central-bank",      status: "ONLINE",  volume24h: 130_000_000_000 },
  { id: "rbi",   name: "Reserve Bank of India",   short: "RBI",       country: "India",         flag: "🇮🇳", category: "central-bank",      status: "SYNCING", volume24h: 180_000_000_000 },
  { id: "ust",   name: "US Treasury",             short: "UST",       country: "USA",           flag: "🇺🇸", category: "national-treasury", status: "ONLINE",  volume24h: 1_200_000_000_000 },
  { id: "hmt",   name: "HM Treasury",             short: "HMT",       country: "UK",            flag: "🇬🇧", category: "national-treasury", status: "ONLINE",  volume24h: 210_000_000_000 },
  { id: "jpmg",  name: "JPMorgan Chase",          short: "JPMG",      country: "USA",           flag: "🇺🇸", category: "commercial-bank",   status: "ONLINE",  volume24h: 390_000_000_000 },
  { id: "gs",    name: "Goldman Sachs",           short: "GS",        country: "USA",           flag: "🇺🇸", category: "commercial-bank",   status: "ONLINE",  volume24h: 220_000_000_000 },
  { id: "db",    name: "Deutsche Bank",           short: "DB",        country: "Germany",       flag: "🇩🇪", category: "commercial-bank",   status: "OFFLINE", volume24h: 0               },
  { id: "hsbc",  name: "HSBC",                    short: "HSBC",      country: "UK",            flag: "🇬🇧", category: "commercial-bank",   status: "ONLINE",  volume24h: 310_000_000_000 },
];

const CURRENCY_PAIRS = [
  "USD/EUR", "USD/CNY", "USD/IDR", "USD/JPY",
  "EUR/GBP", "USD/BRL", "USD/SAR", "CNY/EUR",
  "USD/INR", "EUR/JPY",
];

const SETTLEMENT_STEPS: SettlementStep[] = [
  "INITIATED", "QUANTUM-VERIFIED", "CROSS-CHAIN-LOCKED", "SETTLED",
];

const STEP_DURATIONS_MS: Record<SettlementStep, number> = {
  "INITIATED":          800,
  "QUANTUM-VERIFIED":  1400,
  "CROSS-CHAIN-LOCKED": 900,
  "SETTLED":             600,
};

const STEP_COLORS: Record<SettlementStep, string> = {
  "INITIATED":          "#d4a017",
  "QUANTUM-VERIFIED":  "#3b82f6",
  "CROSS-CHAIN-LOCKED": "#8b5cf6",
  "SETTLED":            "#10b981",
};

function genProofHash() {
  const hex = "0123456789abcdef";
  return "0x" + Array.from({ length: 64 }, () => hex[Math.floor(Math.random() * 16)]).join("");
}

function genTime(offsetMs = 0) {
  return new Date(Date.now() - offsetMs).toISOString().slice(11, 23);
}

function genTransfers(count = 10): Transfer[] {
  const pairs = [...CURRENCY_PAIRS];
  const priorities: SettlementPriority[] = ["STANDARD", "PRIORITY", "STANDARD", "EMERGENCY", "STANDARD"];
  const memos = [
    "Q2 liquidity rebalancing",
    "Sovereign debt settlement",
    "Trade finance corridor",
    "Emergency FX intervention",
    "Central bank swap line",
    "Treasury bond repurchase",
    "Strategic reserve transfer",
  ];

  return Array.from({ length: count }, (_, i) => {
    const senderInst = INSTITUTIONS[i % INSTITUTIONS.length];
    const recipientInst = INSTITUTIONS[(i + 3) % INSTITUTIONS.length];
    const isSettled = i < 7;
    const isInProgress = i === 7;
    const baseOffset = (i + 1) * 600_000;

    const steps: SettlementStepInfo[] = isSettled
      ? SETTLEMENT_STEPS.map((s, si) => ({
          step: s,
          timestamp: genTime(baseOffset - si * 800),
          duration: si > 0 ? parseFloat((0.2 + Math.random() * 0.6).toFixed(3)) : undefined,
        }))
      : isInProgress
      ? [
          { step: "INITIATED", timestamp: genTime(baseOffset), duration: undefined },
          { step: "QUANTUM-VERIFIED", timestamp: genTime(baseOffset - 1200), duration: 1.2 },
        ]
      : [{ step: "INITIATED", timestamp: genTime(baseOffset), duration: undefined }];

    const currentStep = steps[steps.length - 1].step;

    return {
      id: `ME-${String(900000 + i * 7 + 1).slice(1)}`,
      sender: senderInst.name,
      senderShort: senderInst.short,
      recipient: recipientInst.name,
      recipientShort: recipientInst.short,
      amount: Math.round((100 + Math.random() * 4900) * 1_000_000),
      currencyPair: pairs[i % pairs.length],
      priority: priorities[i % priorities.length],
      memo: memos[i % memos.length],
      currentStep,
      steps,
      completedAt: isSettled ? genTime(baseOffset - 3200) : undefined,
      proofHash: isSettled ? genProofHash() : undefined,
      swiftDaysSaved: Math.round(2 + Math.random() * 3),
      expanded: false,
    };
  });
}

function generateHourlyVolume() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    "USD/EUR":  Math.round(0.8 + Math.random() * 2.2) * 1_000_000_000,
    "USD/CNY":  Math.round(0.6 + Math.random() * 1.8) * 1_000_000_000,
    "USD/JPY":  Math.round(0.4 + Math.random() * 1.4) * 1_000_000_000,
    "EUR/GBP":  Math.round(0.2 + Math.random() * 0.9) * 1_000_000_000,
    "other":    Math.round(0.3 + Math.random() * 1.1) * 1_000_000_000,
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: InstitutionStatus }) {
  const colors: Record<InstitutionStatus, string> = {
    ONLINE:  "#10b981",
    OFFLINE: "#ef4444",
    SYNCING: "#f59e0b",
  };
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{
        background: colors[status],
        boxShadow: status === "ONLINE" ? `0 0 6px ${colors[status]}` : undefined,
        animation: status === "SYNCING" ? "me-pulse 1.5s ease-in-out infinite" : undefined,
      }}
    />
  );
}

function PriorityBadge({ priority }: { priority: SettlementPriority }) {
  const cfg: Record<SettlementPriority, { bg: string; color: string }> = {
    STANDARD:  { bg: "rgba(148,163,184,0.1)", color: "#94a3b8" },
    PRIORITY:  { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
    EMERGENCY: { bg: "rgba(239,68,68,0.15)",  color: "#ef4444" },
  };
  const s = cfg[priority];
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40` }}
    >
      {priority}
    </span>
  );
}

function SettlementStepTracker({ transfer }: { transfer: Transfer }) {
  const completedStepIds = new Set(transfer.steps.map((s) => s.step));
  return (
    <div className="flex items-center gap-0">
      {SETTLEMENT_STEPS.map((step, i) => {
        const isCompleted = completedStepIds.has(step);
        const isCurrent = transfer.currentStep === step && step !== "SETTLED";
        const color = STEP_COLORS[step];
        const stepInfo = transfer.steps.find((s) => s.step === step);

        return (
          <div key={step} className="flex items-center">
            {/* Step node */}
            <div className="flex flex-col items-center">
              <motion.div
                className="relative flex items-center justify-center w-6 h-6 rounded-full"
                style={{
                  background: isCompleted ? `${color}20` : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${isCompleted ? color : "rgba(255,255,255,0.1)"}`,
                }}
                animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                {isCompleted ? (
                  step === "SETTLED" ? (
                    <CheckCircle size={12} style={{ color }} />
                  ) : step === "QUANTUM-VERIFIED" ? (
                    <Zap size={10} style={{ color }} />
                  ) : step === "CROSS-CHAIN-LOCKED" ? (
                    <Shield size={10} style={{ color }} />
                  ) : (
                    <Clock size={10} style={{ color }} />
                  )
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                )}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `1.5px solid ${color}` }}
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}
              </motion.div>
              <span className="text-xs mt-0.5 whitespace-nowrap" style={{ color: isCompleted ? color : "rgba(255,255,255,0.2)", fontSize: "9px" }}>
                {step === "QUANTUM-VERIFIED" ? "QV" : step === "CROSS-CHAIN-LOCKED" ? "CCL" : step.slice(0, 4)}
              </span>
              {stepInfo?.duration && (
                <span className="font-mono" style={{ color: "#94a3b8", fontSize: "8px" }}>
                  {stepInfo.duration}s
                </span>
              )}
            </div>
            {/* Connector */}
            {i < SETTLEMENT_STEPS.length - 1 && (
              <div
                className="w-8 h-px mx-1 mb-4"
                style={{
                  background: completedStepIds.has(SETTLEMENT_STEPS[i + 1])
                    ? `linear-gradient(90deg, ${color}, ${STEP_COLORS[SETTLEMENT_STEPS[i + 1]]})`
                    : "rgba(255,255,255,0.08)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AuditTrailExpanded({ transfer }: { transfer: Transfer }) {
  return (
    <motion.tr
      key={`${transfer.id}-audit`}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <td colSpan={8} className="px-6 py-4" style={{ background: "rgba(59,130,246,0.03)", borderBottom: "1px solid rgba(212,160,23,0.1)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Proof hash */}
          <div>
            <p className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: "var(--me-text-secondary)" }}>
              Cryptographic Proof Hash
            </p>
            <p className="font-mono text-xs break-all" style={{ color: "#3b82f6" }}>
              {transfer.proofHash ?? "—  (pending settlement)"}
            </p>
          </div>
          {/* Settlement trail */}
          <div className="space-y-1.5">
            {transfer.steps.map((s) => (
              <div key={s.step} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: STEP_COLORS[s.step] }} />
                  <span style={{ color: STEP_COLORS[s.step] }}>{s.step}</span>
                </div>
                <span className="font-mono" style={{ color: "var(--me-text-secondary)" }}>{s.timestamp}</span>
              </div>
            ))}
          </div>
          {/* Meta row */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ color: "var(--me-text-secondary)" }}>
            <span>Intermediaries: <span className="font-semibold" style={{ color: "var(--me-success)" }}>None — direct atomic</span></span>
            <span>Fee: <span className="font-semibold" style={{ color: "var(--me-success)" }}>$0.00</span></span>
            <span>Priority: <span className="font-semibold" style={{ color: "var(--me-gold)" }}>{transfer.priority}</span></span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ color: "var(--me-text-secondary)" }}>
            <span>SWIFT equiv. time saved: <span className="font-semibold" style={{ color: "#f59e0b" }}>{transfer.swiftDaysSaved} business days</span></span>
            <span>Verification authority: <span className="font-semibold" style={{ color: "var(--me-blue)" }}>Money Elysium Quantum Node Network</span></span>
          </div>
          {transfer.memo && (
            <div className="text-xs lg:col-span-2" style={{ color: "var(--me-text-secondary)" }}>
              Memo: <span style={{ color: "var(--me-text-primary)" }}>{transfer.memo}</span>
            </div>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

function SwiftComparisonBanner({ totalDaysSaved }: { totalDaysSaved: number }) {
  return (
    <div
      className="me-card px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
      style={{ border: "1px solid rgba(212,160,23,0.35)", background: "linear-gradient(135deg, rgba(212,160,23,0.06) 0%, rgba(59,130,246,0.04) 100%)" }}
    >
      {/* SWIFT side */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle size={13} style={{ color: "#ef4444" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ef4444" }}>SWIFT Legacy Network</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: "#ef4444" }}>
          <span>2–5 business days</span>
          <span>$25–45 fee per transfer</span>
          <span>3+ intermediary banks</span>
          <span>No atomic guarantee</span>
        </div>
      </div>

      {/* VS */}
      <div className="hidden sm:flex flex-col items-center gap-0.5">
        <ArrowRight size={18} style={{ color: "var(--me-gold)" }} />
        <span className="text-xs font-black" style={{ color: "var(--me-gold)" }}>VS</span>
      </div>

      {/* ME side */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={13} style={{ color: "#10b981" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#10b981" }}>Money Elysium Protocol</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: "#10b981" }}>
          <span>&lt;1 second</span>
          <span>$0.00 fee</span>
          <span>Direct atomic — no intermediaries</span>
          <span>Quantum-verified</span>
        </div>
      </div>

      {/* Counter */}
      <div
        className="flex-shrink-0 text-center px-4 py-2 rounded-lg"
        style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)" }}
      >
        <motion.div
          key={totalDaysSaved}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xl font-black font-mono"
          style={{ color: "var(--me-gold)" }}
        >
          {totalDaysSaved.toLocaleString()}
        </motion.div>
        <div className="text-xs" style={{ color: "var(--me-text-secondary)" }}>SWIFT days saved</div>
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--me-gold)" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: ${(p.value / 1e9).toFixed(2)}B
        </p>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function BankingProtocol() {
  const { config, loading } = useConfigurables();
  const title = loading
    ? "Inter-Operable Banking Protocol"
    : (config?.bankingProtocolTitle ?? "Inter-Operable Banking Protocol");

  const [transfers, setTransfers] = useState<Transfer[]>(() => genTransfers(10));
  const [volumeData] = useState(generateHourlyVolume);
  const [statusFilter, setStatusFilter] = useState<SettlementStep | "ALL">("ALL");
  const [showModal, setShowModal] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [swiftDaysSaved, setSwiftDaysSaved] = useState(
    () => transfers.reduce((sum, t) => sum + t.swiftDaysSaved, 0) + 41_280
  );
  const [form, setForm] = useState<NewTransferForm>({
    sender: INSTITUTIONS[0].name,
    recipient: INSTITUTIONS[1].name,
    amount: "",
    currencyPair: "USD/EUR",
    priority: "STANDARD",
    memo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulate settlement progression
  useEffect(() => {
    const interval = setInterval(() => {
      setTransfers((prev) =>
        prev.map((t) => {
          const stepIdx = SETTLEMENT_STEPS.indexOf(t.currentStep);
          if (t.currentStep === "SETTLED") return t;
          if (Math.random() < 0.35 && stepIdx < SETTLEMENT_STEPS.length - 1) {
            const nextStep = SETTLEMENT_STEPS[stepIdx + 1];
            const newSteps: SettlementStepInfo[] = [
              ...t.steps,
              {
                step: nextStep,
                timestamp: genTime(0),
                duration: parseFloat((0.1 + Math.random() * 0.8).toFixed(3)),
              },
            ];
            return {
              ...t,
              currentStep: nextStep,
              steps: newSteps,
              completedAt: nextStep === "SETTLED" ? genTime(0) : t.completedAt,
              proofHash: nextStep === "SETTLED" ? genProofHash() : t.proofHash,
            };
          }
          return t;
        })
      );
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Tick SWIFT days saved counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSwiftDaysSaved((v) => v + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered =
    statusFilter === "ALL"
      ? transfers
      : transfers.filter((t) => t.currentStep === statusFilter);

  const totalSettled = transfers
    .filter((t) => t.currentStep === "SETTLED")
    .reduce((s, t) => s + t.amount, 0);

  const inProgressCount = transfers.filter(
    (t) => t.currentStep !== "SETTLED" && t.currentStep !== "INITIATED"
  ).length;

  const institutionRankings = [...INSTITUTIONS]
    .filter((i) => i.status !== "OFFLINE")
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 6);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!form.amount || !form.sender || !form.recipient) return;
    setIsSubmitting(true);

    const senderInst = INSTITUTIONS.find((i) => i.name === form.sender) ?? INSTITUTIONS[0];
    const recipientInst = INSTITUTIONS.find((i) => i.name === form.recipient) ?? INSTITUTIONS[1];

    const newTransfer: Transfer = {
      id: `ME-${String(900000 + Date.now() % 99999).slice(1)}`,
      sender: senderInst.name,
      senderShort: senderInst.short,
      recipient: recipientInst.name,
      recipientShort: recipientInst.short,
      amount: parseFloat(form.amount) * 1_000_000,
      currencyPair: form.currencyPair,
      priority: form.priority,
      memo: form.memo,
      currentStep: "INITIATED",
      steps: [{ step: "INITIATED", timestamp: genTime(0) }],
      swiftDaysSaved: Math.round(2 + Math.random() * 3),
      expanded: false,
    };

    await new Promise((r) => setTimeout(r, 900));
    setTransfers((prev) => [newTransfer, ...prev]);
    setSwiftDaysSaved((v) => v + newTransfer.swiftDaysSaved);
    setIsSubmitting(false);
    setShowModal(false);
    setForm({
      sender: INSTITUTIONS[0].name,
      recipient: INSTITUTIONS[1].name,
      amount: "",
      currencyPair: "USD/EUR",
      priority: "STANDARD",
      memo: "",
    });
  }

  // ── Categorise institutions for the sidebar
  const categorised: { label: string; category: InstitutionCategory }[] = [
    { label: "Central Banks", category: "central-bank" },
    { label: "National Treasuries", category: "national-treasury" },
    { label: "Commercial Banks", category: "commercial-bank" },
  ];

  return (
    <AppLayout>
      <Header title={title} subtitle="Atomic Cross-Border Settlements — No SWIFT Dependency" />

      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* ── Left Sidebar: Institution Directory ── */}
        <aside
          className="w-56 flex-shrink-0 overflow-y-auto border-r"
          style={{ borderColor: "var(--me-border)", background: "var(--me-bg-secondary)" }}
        >
          <div
            className="sticky top-0 px-3 py-2.5 border-b text-xs font-bold uppercase tracking-widest z-10"
            style={{ borderColor: "var(--me-border)", background: "var(--me-bg-secondary)", color: "var(--me-gold)" }}
          >
            Institution Directory
          </div>

          {categorised.map(({ label, category }) => {
            const group = INSTITUTIONS.filter((i) => i.category === category);
            return (
              <div key={category} className="mb-1">
                <div
                  className="px-3 py-1.5 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--me-text-secondary)" }}
                >
                  {label}
                </div>
                {group.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center gap-2 px-3 py-1.5 transition-colors cursor-default hover:bg-white/[0.03]"
                  >
                    <StatusDot status={inst.status} />
                    <span className="text-xs flex-1 truncate" style={{ color: "var(--me-text-primary)" }}>
                      {inst.short}
                    </span>
                    <span
                      className="text-xs flex-shrink-0 px-1 py-0.5 rounded"
                      style={{
                        background:
                          inst.status === "ONLINE"
                            ? "rgba(16,185,129,0.1)"
                            : inst.status === "SYNCING"
                            ? "rgba(245,158,11,0.1)"
                            : "rgba(239,68,68,0.1)",
                        color:
                          inst.status === "ONLINE"
                            ? "#10b981"
                            : inst.status === "SYNCING"
                            ? "#f59e0b"
                            : "#ef4444",
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {inst.status}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="px-3 py-2.5 border-t mt-2" style={{ borderColor: "var(--me-border)" }}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: "var(--me-text-secondary)" }}>Online</span>
              <span style={{ color: "#10b981" }}>{INSTITUTIONS.filter((i) => i.status === "ONLINE").length}</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: "var(--me-text-secondary)" }}>Syncing</span>
              <span style={{ color: "#f59e0b" }}>{INSTITUTIONS.filter((i) => i.status === "SYNCING").length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--me-text-secondary)" }}>Offline</span>
              <span style={{ color: "#ef4444" }}>{INSTITUTIONS.filter((i) => i.status === "OFFLINE").length}</span>
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* SWIFT vs ME banner */}
            <SwiftComparisonBanner totalDaysSaved={swiftDaysSaved} />

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Settled Today",    value: `$${(totalSettled / 1e9).toFixed(2)}B`,      color: "var(--me-success)" },
                { label: "In-Progress",      value: `${inProgressCount} active`,                 color: "#f59e0b"           },
                { label: "Avg. Settlement",  value: "<1s",                                        color: "var(--me-blue)"   },
                { label: "SWIFT Replaced",   value: "100%",                                       color: "var(--me-gold)"   },
              ].map(({ label, value, color }) => (
                <div key={label} className="me-card px-4 py-3">
                  <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--me-text-secondary)" }}>
                    {label}
                  </div>
                  <div className="text-lg font-black font-mono" style={{ color }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Volume Chart */}
              <div className="me-card p-4 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                      Hourly Settlement Volume by Currency Pair
                    </h3>
                    <p className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                      USD-equivalent, stacked
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-me-pulse" style={{ background: "#10b981" }} />
                    LIVE
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={170}>
                  <AreaChart data={volumeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      {[
                        ["usdeur", "#d4a017"],
                        ["usdcny", "#3b82f6"],
                        ["usdjpy", "#10b981"],
                        ["eurgbp", "#8b5cf6"],
                        ["other",  "#94a3b8"],
                      ].map(([id, color]) => (
                        <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.06)" />
                    <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e9).toFixed(0)}B`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="USD/EUR" name="USD/EUR" stroke="#d4a017" strokeWidth={1.5} fill="url(#grad-usdeur)" stackId="1" />
                    <Area type="monotone" dataKey="USD/CNY" name="USD/CNY" stroke="#3b82f6" strokeWidth={1.5} fill="url(#grad-usdcny)" stackId="1" />
                    <Area type="monotone" dataKey="USD/JPY" name="USD/JPY" stroke="#10b981" strokeWidth={1.5} fill="url(#grad-usdjpy)" stackId="1" />
                    <Area type="monotone" dataKey="EUR/GBP" name="EUR/GBP" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#grad-eurgbp)" stackId="1" />
                    <Area type="monotone" dataKey="other"   name="Other"   stroke="#94a3b8" strokeWidth={1}   fill="url(#grad-other)"  stackId="1" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Institution Rankings */}
              <div className="me-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award size={13} style={{ color: "var(--me-gold)" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                    Institution Activity
                  </h3>
                </div>
                <div className="space-y-2">
                  {institutionRankings.map((inst, i) => {
                    const maxVol = institutionRankings[0].volume24h;
                    const pct = (inst.volume24h / maxVol) * 100;
                    return (
                      <div key={inst.id}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold" style={{ color: "var(--me-text-primary)" }}>
                            {inst.flag} {inst.short}
                          </span>
                          <span className="text-xs font-mono" style={{ color: "var(--me-gold)" }}>
                            ${(inst.volume24h / 1e9).toFixed(1)}B
                          </span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: i === 0
                                ? "var(--me-gold)"
                                : i === 1
                                ? "#3b82f6"
                                : "#10b981",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-2 border-t text-xs" style={{ borderColor: "var(--me-border)", color: "var(--me-text-secondary)" }}>
                  <div className="flex items-center justify-between">
                    <span>Total 24h volume</span>
                    <span className="font-bold font-mono" style={{ color: "var(--me-gold)" }}>
                      ${(INSTITUTIONS.reduce((s, i) => s + i.volume24h, 0) / 1e12).toFixed(2)}T
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer History Table */}
            <div className="me-card">
              {/* Table header controls */}
              <div
                className="flex items-center gap-3 px-5 py-3 border-b flex-wrap"
                style={{ borderColor: "var(--me-border)" }}
              >
                <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                  Settlement Ledger
                </h3>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)" }}
                >
                  <Filter size={11} style={{ color: "var(--me-text-secondary)" }} />
                  <select
                    className="bg-transparent text-xs outline-none cursor-pointer"
                    style={{ color: "var(--me-text-primary)" }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as SettlementStep | "ALL")}
                  >
                    <option value="ALL"               style={{ background: "#111936" }}>All Steps</option>
                    <option value="INITIATED"          style={{ background: "#111936" }}>Initiated</option>
                    <option value="QUANTUM-VERIFIED"  style={{ background: "#111936" }}>Quantum-Verified</option>
                    <option value="CROSS-CHAIN-LOCKED" style={{ background: "#111936" }}>Cross-Chain-Locked</option>
                    <option value="SETTLED"            style={{ background: "#111936" }}>Settled</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: "var(--me-gold)",
                    color: "var(--me-bg-primary)",
                    boxShadow: "0 0 14px rgba(212,160,23,0.3)",
                  }}
                >
                  <Plus size={12} />
                  New Transfer
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "var(--me-bg-secondary)", borderBottom: "1px solid var(--me-border)" }}>
                      {["", "TX ID", "From → To", "Amount / Pair", "Priority", "Settlement Progress", "Status", "Time"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--me-text-secondary)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filtered.map((t, i) => {
                        const isExpanded = expandedIds.has(t.id);
                        const isSettled = t.currentStep === "SETTLED";
                        return (
                          <>
                            <motion.tr
                              key={t.id}
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="cursor-pointer transition-colors duration-200 hover:bg-white/[0.02]"
                              style={{
                                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                                borderBottom: "1px solid rgba(212,160,23,0.04)",
                              }}
                              onClick={() => toggleExpand(t.id)}
                            >
                              {/* Expand toggle */}
                              <td className="px-2 py-2.5 w-6">
                                {isExpanded
                                  ? <ChevronDown size={12} style={{ color: "var(--me-gold)" }} />
                                  : <ChevronRight size={12} style={{ color: "var(--me-text-secondary)" }} />
                                }
                              </td>
                              {/* TX ID */}
                              <td className="px-3 py-2.5 font-mono" style={{ color: "var(--me-blue)" }}>
                                {t.id}
                              </td>
                              {/* From → To */}
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1">
                                  <Building2 size={10} style={{ color: "var(--me-text-secondary)" }} />
                                  <span style={{ color: "var(--me-text-primary)" }}>{t.senderShort}</span>
                                  <ArrowRight size={10} style={{ color: "var(--me-gold)" }} />
                                  <Globe2 size={10} style={{ color: "var(--me-text-secondary)" }} />
                                  <span style={{ color: "var(--me-text-primary)" }}>{t.recipientShort}</span>
                                </div>
                              </td>
                              {/* Amount / Pair */}
                              <td className="px-3 py-2.5">
                                <span className="font-mono font-bold" style={{ color: "var(--me-gold)" }}>
                                  ${(t.amount / 1e6).toFixed(0)}M
                                </span>
                                <span className="ml-1.5 font-mono" style={{ color: "var(--me-blue)" }}>
                                  {t.currencyPair}
                                </span>
                              </td>
                              {/* Priority */}
                              <td className="px-3 py-2.5">
                                <PriorityBadge priority={t.priority} />
                              </td>
                              {/* Settlement Progress */}
                              <td className="px-3 py-2.5">
                                <SettlementStepTracker transfer={t} />
                              </td>
                              {/* Status */}
                              <td className="px-3 py-2.5">
                                {isSettled ? (
                                  <motion.span
                                    className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 w-fit status-settled"
                                    animate={{ boxShadow: ["0 0 0px #10b981", "0 0 8px #10b981", "0 0 0px #10b981"] }}
                                    transition={{ repeat: 2, duration: 0.8 }}
                                  >
                                    <CheckCircle size={9} /> SETTLED
                                  </motion.span>
                                ) : t.currentStep === "INITIATED" ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold status-pending flex items-center gap-1 w-fit">
                                    <Clock size={9} /> INITIATED
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold status-processing flex items-center gap-1 w-fit">
                                    <RefreshCw size={9} className="animate-spin" /> {t.currentStep.split("-")[0]}
                                  </span>
                                )}
                              </td>
                              {/* Time */}
                              <td className="px-3 py-2.5 font-mono" style={{ color: "var(--me-text-secondary)" }}>
                                {t.steps[0].timestamp}
                              </td>
                            </motion.tr>

                            {/* Expandable audit trail */}
                            <AnimatePresence>
                              {isExpanded && <AuditTrailExpanded key={`${t.id}-audit`} transfer={t} />}
                            </AnimatePresence>
                          </>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div
                className="px-5 py-2.5 flex items-center justify-between text-xs"
                style={{ borderTop: "1px solid var(--me-border)", color: "var(--me-text-secondary)" }}
              >
                <span>Showing {filtered.length} of {transfers.length} settlements</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-me-pulse" style={{ background: "var(--me-success)" }} />
                  <span>Live progression updates every 2.8s — click row for audit trail</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── New Transfer Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="me-card p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
              style={{ boxShadow: "0 0 48px rgba(212,160,23,0.18)" }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold" style={{ color: "var(--me-gold)" }}>
                    Initiate Atomic Transfer
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--me-text-secondary)" }}>
                    Direct settlement — no SWIFT, no intermediaries, $0.00 fee
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} style={{ color: "var(--me-text-secondary)" }}>
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* From / To */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: "var(--me-text-secondary)" }}>
                      From Institution
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                      value={form.sender}
                      onChange={(e) => setForm((f) => ({ ...f, sender: e.target.value }))}
                    >
                      {INSTITUTIONS.map((i) => (
                        <option key={i.id} value={i.name} style={{ background: "#0d1435" }}>
                          {i.flag} {i.short} — {i.country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: "var(--me-text-secondary)" }}>
                      To Institution
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                      value={form.recipient}
                      onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
                    >
                      {INSTITUTIONS.map((i) => (
                        <option key={i.id} value={i.name} style={{ background: "#0d1435" }}>
                          {i.flag} {i.short} — {i.country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amount + Currency Pair */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: "var(--me-text-secondary)" }}>
                      Amount (Millions USD)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
                      style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: "var(--me-text-secondary)" }}>
                      Currency Pair
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                      value={form.currencyPair}
                      onChange={(e) => setForm((f) => ({ ...f, currencyPair: e.target.value }))}
                    >
                      {CURRENCY_PAIRS.map((p) => (
                        <option key={p} value={p} style={{ background: "#0d1435" }}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs uppercase tracking-wider block mb-1.5" style={{ color: "var(--me-text-secondary)" }}>
                    Settlement Priority
                  </label>
                  <div className="flex gap-2">
                    {(["STANDARD", "PRIORITY", "EMERGENCY"] as SettlementPriority[]).map((p) => {
                      const colors: Record<SettlementPriority, string> = {
                        STANDARD:  "#94a3b8",
                        PRIORITY:  "#f59e0b",
                        EMERGENCY: "#ef4444",
                      };
                      const selected = form.priority === p;
                      return (
                        <button
                          key={p}
                          onClick={() => setForm((f) => ({ ...f, priority: p }))}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                          style={{
                            background: selected ? `${colors[p]}20` : "rgba(255,255,255,0.03)",
                            border: `1px solid ${selected ? colors[p] : "rgba(255,255,255,0.08)"}`,
                            color: selected ? colors[p] : "var(--me-text-secondary)",
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Memo */}
                <div>
                  <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: "var(--me-text-secondary)" }}>
                    Reference / Memo
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Q2 liquidity rebalancing"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                    value={form.memo}
                    onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                  />
                </div>

                {/* Fee callout */}
                <div
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <CheckCircle size={12} style={{ color: "#10b981" }} />
                  <span style={{ color: "var(--me-text-secondary)" }}>
                    Network fee: <span className="font-bold" style={{ color: "#10b981" }}>$0.00</span>
                    &nbsp;— Direct atomic settlement, 0 intermediaries, quantum-verified
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm"
                  style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.amount || isSubmitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  style={{
                    background: "var(--me-gold)",
                    color: "var(--me-bg-primary)",
                    boxShadow: "0 0 18px rgba(212,160,23,0.3)",
                  }}
                >
                  <Send size={13} />
                  {isSubmitting ? "Initiating..." : "Initiate Transfer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
