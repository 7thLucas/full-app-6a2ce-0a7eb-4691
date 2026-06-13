import { useState, useEffect, useRef } from "react";
import {
  Shield,
  ShieldAlert,
  Lock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Key,
  Activity,
  Eye,
  Zap,
  AlertOctagon,
  RefreshCw,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "LOW" | "MED" | "HIGH" | "CRITICAL";
type EventType = "SCAN" | "DETECT" | "QUARANTINE" | "PATCH" | "VERIFY";

interface ThreatEvent {
  id: string;
  type: EventType;
  severity: Severity;
  institution: string;
  target: string;
  timestamp: Date;
  action: string;
  category: string;
}

interface QuarantineHold {
  id: string;
  institution: string;
  account: string;
  amount: string;
  reason: string;
  timestamp: Date;
  confidence: number;
}

interface PatchRecord {
  cve: string;
  description: string;
  severity: Severity;
  patchedAt: Date;
  method: string;
  status: "RESOLVED";
}

interface EncryptionStatus {
  institution: string;
  lastRotated: Date;
  nextRotation: Date;
  algorithm: string;
  strength: string;
  daysUntilNext: number;
}

// ─── Static seed data ─────────────────────────────────────────────────────────

const INSTITUTIONS = [
  "Federal Reserve (US)",
  "European Central Bank",
  "Bank of England",
  "People's Bank of China",
  "Bank of Japan",
  "Reserve Bank of India",
  "Swiss National Bank",
  "Deutsche Bundesbank",
];

const THREAT_CATEGORIES = [
  "Counterfeit injection",
  "Double-spend attack",
  "Quantum decryption attempt",
  "Unauthorized access",
  "AML violation",
  "Reserve manipulation",
  "Coordinated currency attack",
  "Insider escalation",
  "Zero-day exploit",
];

const AUTO_ACTIONS: Record<string, string> = {
  "Counterfeit injection": "Note series blacklisted — propagated globally",
  "Double-spend attack": "Transaction reverted — UTXO lock applied",
  "Quantum decryption attempt": "Key rotation triggered — session terminated",
  "Unauthorized access": "Session revoked — IP range blocked",
  "AML violation": "Funds frozen — compliance report filed",
  "Reserve manipulation": "Reserve snapshoted — transaction reversed",
  "Coordinated currency attack": "Cross-node consensus invalidated",
  "Insider escalation": "Privileges suspended — audit trail locked",
  "Zero-day exploit": "Exploit patched — sandbox quarantine active",
};

const FUND_SYSTEMS = [
  "Reserve Fund RFX-0091",
  "Settlement Buffer SB-4412",
  "Clearing Pool CP-8821",
  "Liquidity Reserve LR-3310",
  "Issuance Vault IV-7720",
  "National Depository ND-1145",
  "Interbank Bridge IB-9903",
  "Sovereign Vault SV-0055",
];

const QUARANTINE_HOLDS: QuarantineHold[] = [
  {
    id: "QH-001",
    institution: "Federal Reserve (US)",
    account: "FRB-ACC-0041-NYK",
    amount: "$2,847,000,000",
    reason: "Coordinated currency attack — 14 linked wallets",
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    confidence: 99.4,
  },
  {
    id: "QH-002",
    institution: "European Central Bank",
    account: "ECB-ACC-1182-FRA",
    amount: "€941,500,000",
    reason: "AML violation — layering pattern identified",
    timestamp: new Date(Date.now() - 1000 * 60 * 23),
    confidence: 97.8,
  },
  {
    id: "QH-003",
    institution: "Bank of Japan",
    account: "BOJ-ACC-3390-TKY",
    amount: "¥184,200,000,000",
    reason: "Reserve manipulation attempt detected",
    timestamp: new Date(Date.now() - 1000 * 60 * 41),
    confidence: 98.1,
  },
  {
    id: "QH-004",
    institution: "People's Bank of China",
    account: "PBC-ACC-0027-BJG",
    amount: "¥31,600,000,000",
    reason: "Insider escalation — unauthorized privilege usage",
    timestamp: new Date(Date.now() - 1000 * 60 * 67),
    confidence: 96.5,
  },
  {
    id: "QH-005",
    institution: "Reserve Bank of India",
    account: "RBI-ACC-7714-MUM",
    amount: "₹89,300,000,000",
    reason: "Double-spend attack — 7 concurrent transactions",
    timestamp: new Date(Date.now() - 1000 * 60 * 95),
    confidence: 99.9,
  },
  {
    id: "QH-006",
    institution: "Swiss National Bank",
    account: "SNB-ACC-2201-ZRH",
    amount: "CHF 1,230,000,000",
    reason: "Zero-day exploit — memory injection attempt",
    timestamp: new Date(Date.now() - 1000 * 60 * 118),
    confidence: 98.7,
  },
];

const PATCH_RECORDS: PatchRecord[] = [
  { cve: "CVE-2025-48201", description: "Buffer overflow in reserve reconciliation engine", severity: "CRITICAL", patchedAt: new Date(Date.now() - 1000 * 60 * 4), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-47993", description: "SQL injection vector in ledger query handler", severity: "HIGH", patchedAt: new Date(Date.now() - 1000 * 60 * 19), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-47841", description: "Quantum key oracle side-channel exposure", severity: "CRITICAL", patchedAt: new Date(Date.now() - 1000 * 60 * 37), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-47660", description: "Race condition in atomic settlement module", severity: "HIGH", patchedAt: new Date(Date.now() - 1000 * 60 * 55), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-47512", description: "Heap use-after-free in AML pattern engine", severity: "HIGH", patchedAt: new Date(Date.now() - 1000 * 60 * 78), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-47304", description: "Integer overflow in currency supply counter", severity: "MED", patchedAt: new Date(Date.now() - 1000 * 60 * 102), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-47109", description: "Timing attack on CRYSTALS-Kyber implementation", severity: "CRITICAL", patchedAt: new Date(Date.now() - 1000 * 60 * 145), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-46981", description: "Path traversal in audit log exporter", severity: "MED", patchedAt: new Date(Date.now() - 1000 * 60 * 188), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-46803", description: "Deserialization vulnerability in cross-bank bridge", severity: "HIGH", patchedAt: new Date(Date.now() - 1000 * 60 * 230), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-46600", description: "Open redirect in OAuth2 token exchange flow", severity: "LOW", patchedAt: new Date(Date.now() - 1000 * 60 * 285), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-46412", description: "Unvalidated input in banknote verification API", severity: "MED", patchedAt: new Date(Date.now() - 1000 * 60 * 310), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-46200", description: "Prototype pollution in monetary policy engine", severity: "HIGH", patchedAt: new Date(Date.now() - 1000 * 60 * 355), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-46017", description: "SSRF in external reserve oracle connector", severity: "HIGH", patchedAt: new Date(Date.now() - 1000 * 60 * 392), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-45881", description: "Weak entropy in session token generator", severity: "MED", patchedAt: new Date(Date.now() - 1000 * 60 * 440), method: "AGI auto-patch", status: "RESOLVED" },
  { cve: "CVE-2025-45700", description: "DoS amplification in SWIFT bridge adapter", severity: "LOW", patchedAt: new Date(Date.now() - 1000 * 60 * 490), method: "AGI auto-patch", status: "RESOLVED" },
];

const ENCRYPTION_NODES: EncryptionStatus[] = [
  { institution: "Federal Reserve (US)", lastRotated: new Date(Date.now() - 1000 * 60 * 60 * 6), nextRotation: new Date(Date.now() + 1000 * 60 * 60 * 18), algorithm: "CRYSTALS-Kyber-1024", strength: "QUANTUM-RESISTANT", daysUntilNext: 1 },
  { institution: "European Central Bank", lastRotated: new Date(Date.now() - 1000 * 60 * 60 * 14), nextRotation: new Date(Date.now() + 1000 * 60 * 60 * 10), algorithm: "CRYSTALS-Kyber-1024", strength: "QUANTUM-RESISTANT", daysUntilNext: 1 },
  { institution: "Bank of England", lastRotated: new Date(Date.now() - 1000 * 60 * 60 * 2), nextRotation: new Date(Date.now() + 1000 * 60 * 60 * 22), algorithm: "CRYSTALS-Kyber-1024", strength: "QUANTUM-RESISTANT", daysUntilNext: 1 },
  { institution: "People's Bank of China", lastRotated: new Date(Date.now() - 1000 * 60 * 60 * 18), nextRotation: new Date(Date.now() + 1000 * 60 * 60 * 6), algorithm: "CRYSTALS-Kyber-1024", strength: "QUANTUM-RESISTANT", daysUntilNext: 1 },
  { institution: "Bank of Japan", lastRotated: new Date(Date.now() - 1000 * 60 * 60 * 9), nextRotation: new Date(Date.now() + 1000 * 60 * 60 * 15), algorithm: "CRYSTALS-Kyber-1024", strength: "QUANTUM-RESISTANT", daysUntilNext: 1 },
  { institution: "Reserve Bank of India", lastRotated: new Date(Date.now() - 1000 * 60 * 60 * 3), nextRotation: new Date(Date.now() + 1000 * 60 * 60 * 21), algorithm: "CRYSTALS-Kyber-1024", strength: "QUANTUM-RESISTANT", daysUntilNext: 1 },
  { institution: "Swiss National Bank", lastRotated: new Date(Date.now() - 1000 * 60 * 60 * 11), nextRotation: new Date(Date.now() + 1000 * 60 * 60 * 13), algorithm: "CRYSTALS-Kyber-1024", strength: "QUANTUM-RESISTANT", daysUntilNext: 1 },
  { institution: "Deutsche Bundesbank", lastRotated: new Date(Date.now() - 1000 * 60 * 60 * 5), nextRotation: new Date(Date.now() + 1000 * 60 * 60 * 19), algorithm: "CRYSTALS-Kyber-1024", strength: "QUANTUM-RESISTANT", daysUntilNext: 1 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateEvent(): ThreatEvent {
  const types: EventType[] = ["SCAN", "SCAN", "SCAN", "DETECT", "QUARANTINE", "PATCH", "VERIFY"];
  const severities: Severity[] = ["LOW", "LOW", "MED", "MED", "HIGH", "CRITICAL"];
  const type = types[Math.floor(Math.random() * types.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const category = THREAT_CATEGORIES[Math.floor(Math.random() * THREAT_CATEGORIES.length)];
  const institution = INSTITUTIONS[Math.floor(Math.random() * INSTITUTIONS.length)];
  const target = FUND_SYSTEMS[Math.floor(Math.random() * FUND_SYSTEMS.length)];

  const actionMap: Record<EventType, string> = {
    SCAN: "Deep packet inspection complete — no anomaly",
    DETECT: AUTO_ACTIONS[category] ?? "Flagged for review",
    QUARANTINE: "Funds isolated — operator notified",
    PATCH: "Vulnerability sealed — systems hardened",
    VERIFY: "Integrity confirmed — signature validated",
  };

  return {
    id: Math.random().toString(36).slice(2, 10).toUpperCase(),
    type,
    severity: type === "SCAN" || type === "VERIFY" ? "LOW" : severity,
    institution,
    target,
    timestamp: new Date(),
    action: actionMap[type],
    category,
  };
}

function formatRelative(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string }> = {
  LOW: { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
  MED: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  HIGH: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.3)" },
  CRITICAL: { bg: "rgba(220,38,38,0.18)", text: "#dc2626", border: "rgba(220,38,38,0.5)" },
};

const EVENT_COLORS: Record<EventType, string> = {
  SCAN: "#3b82f6",
  DETECT: "#f59e0b",
  QUARANTINE: "#ef4444",
  PATCH: "#10b981",
  VERIFY: "#6366f1",
};

function SeverityBadge({ severity }: { severity: Severity }) {
  const c = SEVERITY_COLORS[severity];
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded font-mono"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {severity}
    </span>
  );
}

function EventTypeBadge({ type }: { type: EventType }) {
  const color = EVENT_COLORS[type];
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded font-mono min-w-[72px] inline-block text-center"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
    >
      {type}
    </span>
  );
}

// ─── Uptime counter ────────────────────────────────────────────────────────────

function UptimeCounter() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return <span className="font-mono text-sm font-bold" style={{ color: "#10b981" }}>UPTIME {h}:{m}:{s}</span>;
}

// ─── Release modal ────────────────────────────────────────────────────────────

function ReleaseModal({
  hold,
  onClose,
  onConfirm,
}: {
  hold: QuarantineHold;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="rounded-xl p-6 w-full max-w-md mx-4"
        style={{ background: "#0f1629", border: "1px solid rgba(239,68,68,0.4)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertOctagon size={18} style={{ color: "#ef4444" }} />
            <span className="font-bold text-sm" style={{ color: "#ef4444" }}>OPERATOR OVERRIDE REQUIRED</span>
          </div>
          <button onClick={onClose} style={{ color: "#64748b" }}>
            <X size={16} />
          </button>
        </div>

        <p className="text-xs mb-4" style={{ color: "#94a3b8" }}>
          You are about to release a quarantined fund hold. This action will be permanently logged
          and requires your authorization. Confirm release of:
        </p>

        <div className="rounded-lg p-4 mb-4 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: "#64748b" }}>Institution</span>
            <span className="font-semibold" style={{ color: "#e2e8f0" }}>{hold.institution}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "#64748b" }}>Account</span>
            <span className="font-mono" style={{ color: "#e2e8f0" }}>{hold.account}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "#64748b" }}>Amount Held</span>
            <span className="font-bold" style={{ color: "#ef4444" }}>{hold.amount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "#64748b" }}>Threat Reason</span>
            <span className="text-right max-w-[60%]" style={{ color: "#f59e0b" }}>{hold.reason}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)" }}
          >
            Confirm Release
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SecurityMonitor() {
  const [events, setEvents] = useState<ThreatEvent[]>(() =>
    Array.from({ length: 12 }, generateEvent).map((e, i) => ({
      ...e,
      timestamp: new Date(Date.now() - (12 - i) * 4500),
    }))
  );
  const [quarantineHolds, setQuarantineHolds] = useState<QuarantineHold[]>(QUARANTINE_HOLDS);
  const [releaseTarget, setReleaseTarget] = useState<QuarantineHold | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Live event feed
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => [generateEvent(), ...prev].slice(0, 40));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll feed to top when new events arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events.length]);

  function handleRelease(hold: QuarantineHold) {
    setReleaseTarget(hold);
  }

  function confirmRelease() {
    if (releaseTarget) {
      setQuarantineHolds((prev) => prev.filter((h) => h.id !== releaseTarget.id));
    }
    setReleaseTarget(null);
  }

  // Today's summary stats (derived from feed state)
  const todayDetected = 1847;
  const todayNeutralized = 1843;
  const todayFunds = "$4.29B";
  const todayPatches = 15;
  const humanInterventions = 0;

  return (
    <AppLayout>
      <Header title="Self-Healing Security Monitor" subtitle="Autonomous Threat Quarantine — AGI Response System" />

      <div className="flex-1 p-6 space-y-6" style={{ background: "#080e1f" }}>

        {/* ── 1. System Status Banner ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl px-6 py-4 flex items-center justify-between flex-wrap gap-4"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(8,14,31,0) 60%)",
            border: "1px solid rgba(16,185,129,0.3)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9">
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: "rgba(16,185,129,0.2)" }}
              />
              <div
                className="relative w-4 h-4 rounded-full"
                style={{ background: "#10b981", boxShadow: "0 0 12px #10b981" }}
              />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wider uppercase" style={{ color: "#10b981" }}>
                AUTONOMOUS SECURITY: ACTIVE — AGI Threat Response Online
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#4ade80" }}>
                All 8 central bank nodes monitored · Quantum encryption nominal · Zero human interventions today
              </p>
            </div>
          </div>
          <UptimeCounter />
        </motion.div>

        {/* ── 6. Threat Intelligence Summary ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Threats Detected", value: todayDetected.toLocaleString(), icon: Eye, color: "#f59e0b" },
            { label: "Auto-Neutralized", value: todayNeutralized.toLocaleString(), icon: CheckCircle2, color: "#10b981" },
            { label: "Quarantined Funds", value: todayFunds, icon: AlertTriangle, color: "#ef4444" },
            { label: "Patches Applied", value: todayPatches.toString(), icon: RefreshCw, color: "#3b82f6" },
            { label: "Human Interventions", value: humanInterventions.toString(), icon: Shield, color: "#6366f1" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl p-4"
                style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#475569" }}>
                    {stat.label}
                  </span>
                  <Icon size={14} style={{ color: stat.color }} />
                </div>
                <span className="text-xl font-bold font-mono" style={{ color: stat.color }}>
                  {stat.value}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* ── 2 & 3: Feed + Quarantine side-by-side ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Live Threat Scan Feed */}
          <div
            className="rounded-xl flex flex-col"
            style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)", maxHeight: 520 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <Activity size={15} style={{ color: "#3b82f6" }} />
                <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Live Threat Scan Feed</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3b82f6" }} />
                LIVE
              </div>
            </div>

            <div ref={feedRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
              <AnimatePresence initial={false}>
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-lg px-3 py-2.5 flex flex-col gap-1"
                    style={{
                      background: event.severity === "CRITICAL"
                        ? "rgba(220,38,38,0.06)"
                        : event.severity === "HIGH"
                        ? "rgba(239,68,68,0.04)"
                        : "rgba(255,255,255,0.02)",
                      border: `1px solid ${
                        event.severity === "CRITICAL"
                          ? "rgba(220,38,38,0.2)"
                          : event.severity === "HIGH"
                          ? "rgba(239,68,68,0.12)"
                          : "rgba(255,255,255,0.04)"
                      }`,
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <EventTypeBadge type={event.type} />
                      <SeverityBadge severity={event.severity} />
                      <span className="text-xs font-mono ml-auto" style={{ color: "#475569" }}>
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#cbd5e1" }}>{event.institution}</p>
                        <p className="text-xs" style={{ color: "#64748b" }}>{event.target}</p>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      <span style={{ color: "#64748b" }}>Category: </span>{event.category}
                    </p>
                    <p className="text-xs" style={{ color: "#4ade80" }}>
                      <span style={{ color: "#64748b" }}>Action: </span>{event.action}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Auto-Quarantine Events Log */}
          <div
            className="rounded-xl flex flex-col"
            style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)", maxHeight: 520 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <ShieldAlert size={15} style={{ color: "#ef4444" }} />
                <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Auto-Quarantine Log</span>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                {quarantineHolds.length} ACTIVE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              <AnimatePresence>
                {quarantineHolds.map((hold) => (
                  <motion.div
                    key={hold.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg p-3"
                    style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold font-mono" style={{ color: "#ef4444" }}>{hold.id}</span>
                      <span className="text-xs" style={{ color: "#475569" }}>{formatRelative(hold.timestamp)}</span>
                    </div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "#e2e8f0" }}>{hold.institution}</p>
                    <p className="text-xs font-mono mb-1" style={{ color: "#64748b" }}>{hold.account}</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#ef4444" }}>{hold.amount}</span>
                      <span className="text-xs" style={{ color: "#10b981" }}>AGI conf: {hold.confidence}%</span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: "#f59e0b" }}>{hold.reason}</p>
                    <button
                      onClick={() => handleRelease(hold)}
                      className="w-full py-1.5 rounded text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                      Operator Release
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── 4. Vulnerability Patch History ──────────────────────────────────── */}
        <div
          className="rounded-xl"
          style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <RefreshCw size={15} style={{ color: "#3b82f6" }} />
            <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Vulnerability Patch History</span>
            <span className="ml-auto text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
              ALL RESOLVED
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["CVE ID", "Description", "Severity", "Patched", "Method", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PATCH_RECORDS.map((r, i) => {
                  const sc = SEVERITY_COLORS[r.severity];
                  return (
                    <tr
                      key={r.cve}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      }}
                    >
                      <td className="px-4 py-2.5 font-mono font-bold" style={{ color: "#3b82f6" }}>{r.cve}</td>
                      <td className="px-4 py-2.5 max-w-xs" style={{ color: "#cbd5e1" }}>{r.description}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="px-2 py-0.5 rounded font-bold font-mono"
                          style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: "#64748b" }}>
                        {formatRelative(r.patchedAt)}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: "#6366f1" }}>{r.method}</td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={11} style={{ color: "#10b981" }} />
                          <span style={{ color: "#10b981" }} className="font-semibold">{r.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 5. Quantum Encryption Health ────────────────────────────────────── */}
        <div
          className="rounded-xl"
          style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <Key size={15} style={{ color: "#3b82f6" }} />
              <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Quantum Encryption Health</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: "#64748b" }}>Overall Score</span>
              <span className="text-sm font-bold font-mono" style={{ color: "#3b82f6" }}>99.7 / 100</span>
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#3b82f6", boxShadow: "0 0 8px #3b82f6" }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Institution", "Last Rotated", "Next Rotation", "Algorithm", "Strength", "Days Until Next"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ENCRYPTION_NODES.map((node, i) => (
                  <tr
                    key={node.institution}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    }}
                  >
                    <td className="px-4 py-2.5 font-semibold" style={{ color: "#e2e8f0" }}>{node.institution}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: "#64748b" }}>{formatRelative(node.lastRotated)}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: "#94a3b8" }}>in {Math.round((node.nextRotation.getTime() - Date.now()) / 3600000)}h</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: "#3b82f6" }}>{node.algorithm}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="px-2 py-0.5 rounded font-bold font-mono text-xs"
                        style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}
                      >
                        {node.strength}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (node.daysUntilNext / 7) * 100)}%`,
                              background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                            }}
                          />
                        </div>
                        <span className="font-mono" style={{ color: "#3b82f6" }}>{node.daysUntilNext}d</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Release Confirmation Modal */}
      <AnimatePresence>
        {releaseTarget && (
          <ReleaseModal
            hold={releaseTarget}
            onClose={() => setReleaseTarget(null)}
            onConfirm={confirmRelease}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
