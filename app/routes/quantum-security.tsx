import { useState, useEffect, useRef, useCallback } from "react";
import {
  Key,
  Shield,
  ShieldCheck,
  Lock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  X,
  ChevronDown,
  Activity,
  Cpu,
  Zap,
} from "lucide-react";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";

// ─── Types ─────────────────────────────────────────────────────────────────────

type KeyStatus = "ACTIVE" | "ROTATING" | "PENDING";
type TriggeredBy = "SCHEDULED" | "MANUAL" | "EMERGENCY";
type AlgorithmStatus = "ACTIVE" | "MONITORING" | "STANDBY";

interface SovereignKey {
  id: string;
  institution: string;
  algorithm: string;
  created: string;
  lastRotated: string;
  nextRotationDue: string;
  status: KeyStatus;
  healthScore: number;
  daysUntilRotation: number;
}

interface Algorithm {
  name: string;
  shortName: string;
  nistStatus: string;
  nistYear: string;
  type: string;
  securityLevel: number;
  feature: string;
  status: AlgorithmStatus;
  deployments: number;
  lastAudit: string;
  color: string;
}

interface AuditEntry {
  timestamp: string;
  institution: string;
  algorithm: string;
  keyIdOld: string;
  keyIdNew: string;
  triggeredBy: TriggeredBy;
  duration: string;
  verifiedBy: string;
  status: "COMPLETE" | "IN_PROGRESS" | "FAILED";
}

// ─── Static data ───────────────────────────────────────────────────────────────

const SOVEREIGN_KEYS: SovereignKey[] = [
  { id: "QK-FED-001-KEM", institution: "Federal Reserve (US)", algorithm: "CRYSTALS-Kyber-1024", created: "2024-01-15", lastRotated: "2026-06-01", nextRotationDue: "2026-07-01", status: "ACTIVE", healthScore: 99.2, daysUntilRotation: 18 },
  { id: "QK-FED-002-SIG", institution: "Federal Reserve (US)", algorithm: "CRYSTALS-Dilithium", created: "2024-01-15", lastRotated: "2026-06-01", nextRotationDue: "2026-07-01", status: "ACTIVE", healthScore: 99.2, daysUntilRotation: 18 },
  { id: "QK-ECB-001-KEM", institution: "European Central Bank", algorithm: "CRYSTALS-Kyber-1024", created: "2024-02-10", lastRotated: "2026-05-28", nextRotationDue: "2026-06-28", status: "ACTIVE", healthScore: 98.7, daysUntilRotation: 15 },
  { id: "QK-BIN-001-KEM", institution: "Bank Indonesia", algorithm: "CRYSTALS-Kyber-1024", created: "2024-03-05", lastRotated: "2026-05-20", nextRotationDue: "2026-06-20", status: "PENDING", healthScore: 97.4, daysUntilRotation: 7 },
  { id: "QK-BIN-002-SIG", institution: "Bank Indonesia", algorithm: "FALCON-1024", created: "2024-03-05", lastRotated: "2026-05-20", nextRotationDue: "2026-06-20", status: "PENDING", healthScore: 97.4, daysUntilRotation: 7 },
  { id: "QK-PBC-001-KEM", institution: "PBoC", algorithm: "CRYSTALS-Kyber-1024", created: "2024-02-28", lastRotated: "2026-06-05", nextRotationDue: "2026-07-05", status: "ACTIVE", healthScore: 98.1, daysUntilRotation: 22 },
  { id: "QK-BOJ-001-KEM", institution: "Bank of Japan", algorithm: "CRYSTALS-Kyber-1024", created: "2024-01-20", lastRotated: "2026-06-03", nextRotationDue: "2026-07-03", status: "ACTIVE", healthScore: 99.0, daysUntilRotation: 20 },
  { id: "QK-RBA-001-KEM", institution: "Reserve Bank of Australia", algorithm: "NTRU", created: "2024-04-01", lastRotated: "2026-05-25", nextRotationDue: "2026-06-25", status: "ACTIVE", healthScore: 97.8, daysUntilRotation: 12 },
  { id: "QK-BOE-001-KEM", institution: "Bank of England", algorithm: "CRYSTALS-Kyber-1024", created: "2024-01-30", lastRotated: "2026-06-02", nextRotationDue: "2026-07-02", status: "ACTIVE", healthScore: 98.5, daysUntilRotation: 19 },
  { id: "QK-SCB-001-KEM", institution: "Saudi Central Bank", algorithm: "HQC", created: "2024-05-10", lastRotated: "2026-05-15", nextRotationDue: "2026-06-15", status: "ROTATING", healthScore: 96.9, daysUntilRotation: 2 },
  { id: "QK-SYS-001-HSH", institution: "System — Master Key", algorithm: "SPHINCS+", created: "2024-01-01", lastRotated: "2026-06-10", nextRotationDue: "2026-07-10", status: "ACTIVE", healthScore: 99.8, daysUntilRotation: 27 },
  { id: "QK-SYS-002-SIG", institution: "System — Audit Chain", algorithm: "CRYSTALS-Dilithium", created: "2024-01-01", lastRotated: "2026-06-10", nextRotationDue: "2026-07-10", status: "ACTIVE", healthScore: 99.9, daysUntilRotation: 27 },
];

const ALGORITHMS: Algorithm[] = [
  {
    name: "CRYSTALS-Kyber-1024",
    shortName: "Kyber-1024",
    nistStatus: "NIST STANDARDIZED",
    nistYear: "2024",
    type: "Key Encapsulation",
    securityLevel: 5,
    feature: "ML-KEM",
    status: "ACTIVE",
    deployments: 8,
    lastAudit: "2026-06-10",
    color: "#3b82f6",
  },
  {
    name: "CRYSTALS-Dilithium",
    shortName: "Dilithium",
    nistStatus: "NIST STANDARDIZED",
    nistYear: "2024",
    type: "Digital Signatures",
    securityLevel: 5,
    feature: "ML-DSA",
    status: "ACTIVE",
    deployments: 6,
    lastAudit: "2026-06-10",
    color: "#6366f1",
  },
  {
    name: "SPHINCS+",
    shortName: "SPHINCS+",
    nistStatus: "NIST STANDARDIZED",
    nistYear: "2024",
    type: "Hash-Based Signatures",
    securityLevel: 5,
    feature: "Stateless",
    status: "ACTIVE",
    deployments: 4,
    lastAudit: "2026-06-08",
    color: "#10b981",
  },
  {
    name: "FALCON-1024",
    shortName: "FALCON-1024",
    nistStatus: "NIST STANDARDIZED",
    nistYear: "2024",
    type: "Lattice Signatures",
    securityLevel: 5,
    feature: "Compact",
    status: "ACTIVE",
    deployments: 3,
    lastAudit: "2026-06-09",
    color: "#d4a017",
  },
  {
    name: "NTRU",
    shortName: "NTRU",
    nistStatus: "NIST Round 4",
    nistYear: "2024",
    type: "Key Exchange",
    securityLevel: 4,
    feature: "Legacy Compatible",
    status: "MONITORING",
    deployments: 1,
    lastAudit: "2026-06-05",
    color: "#f59e0b",
  },
  {
    name: "HQC",
    shortName: "HQC",
    nistStatus: "NIST Round 4",
    nistYear: "2024",
    type: "Code-Based KEM",
    securityLevel: 3,
    feature: "Backup Layer",
    status: "STANDBY",
    deployments: 1,
    lastAudit: "2026-06-01",
    color: "#94a3b8",
  },
];

const AUDIT_TRAIL: AuditEntry[] = [
  { timestamp: "2026-06-13 09:14:22", institution: "System — Master Key", algorithm: "SPHINCS+", keyIdOld: "QK-SYS-001-A7F2", keyIdNew: "QK-SYS-001-B3E9", triggeredBy: "SCHEDULED", duration: "0.34s", verifiedBy: "AGI-VAULT-01", status: "COMPLETE" },
  { timestamp: "2026-06-13 09:14:22", institution: "System — Audit Chain", algorithm: "CRYSTALS-Dilithium", keyIdOld: "QK-SYS-002-D8C1", keyIdNew: "QK-SYS-002-E5A4", triggeredBy: "SCHEDULED", duration: "0.29s", verifiedBy: "AGI-VAULT-01", status: "COMPLETE" },
  { timestamp: "2026-06-12 18:03:11", institution: "Saudi Central Bank", algorithm: "HQC", keyIdOld: "QK-SCB-001-F4D7", keyIdNew: "QK-SCB-001-G2B8", triggeredBy: "MANUAL", duration: "1.12s", verifiedBy: "GOV-AUTH-SCB", status: "IN_PROGRESS" },
  { timestamp: "2026-06-12 14:22:05", institution: "Federal Reserve (US)", algorithm: "CRYSTALS-Kyber-1024", keyIdOld: "QK-FED-001-H9E3", keyIdNew: "QK-FED-001-KEM", triggeredBy: "SCHEDULED", duration: "0.41s", verifiedBy: "AGI-VAULT-02", status: "COMPLETE" },
  { timestamp: "2026-06-11 22:44:58", institution: "Bank of England", algorithm: "CRYSTALS-Kyber-1024", keyIdOld: "QK-BOE-001-J6A2", keyIdNew: "QK-BOE-001-KEM", triggeredBy: "SCHEDULED", duration: "0.38s", verifiedBy: "AGI-VAULT-01", status: "COMPLETE" },
  { timestamp: "2026-06-11 16:30:00", institution: "Bank of Japan", algorithm: "CRYSTALS-Kyber-1024", keyIdOld: "QK-BOJ-001-K3F7", keyIdNew: "QK-BOJ-001-KEM", triggeredBy: "SCHEDULED", duration: "0.44s", verifiedBy: "AGI-VAULT-03", status: "COMPLETE" },
  { timestamp: "2026-06-10 11:15:33", institution: "PBoC", algorithm: "CRYSTALS-Kyber-1024", keyIdOld: "QK-PBC-001-L8D1", keyIdNew: "QK-PBC-001-KEM", triggeredBy: "SCHEDULED", duration: "0.36s", verifiedBy: "AGI-VAULT-02", status: "COMPLETE" },
  { timestamp: "2026-06-09 23:55:01", institution: "European Central Bank", algorithm: "CRYSTALS-Kyber-1024", keyIdOld: "QK-ECB-001-M2C6", keyIdNew: "QK-ECB-001-KEM", triggeredBy: "SCHEDULED", duration: "0.39s", verifiedBy: "AGI-VAULT-01", status: "COMPLETE" },
  { timestamp: "2026-06-08 03:00:00", institution: "Federal Reserve (US)", algorithm: "CRYSTALS-Dilithium", keyIdOld: "QK-FED-002-N5B3", keyIdNew: "QK-FED-002-SIG", triggeredBy: "SCHEDULED", duration: "0.31s", verifiedBy: "AGI-VAULT-02", status: "COMPLETE" },
  { timestamp: "2026-06-07 14:27:45", institution: "Reserve Bank of Australia", algorithm: "NTRU", keyIdOld: "QK-RBA-001-O9A8", keyIdNew: "QK-RBA-001-KEM", triggeredBy: "MANUAL", duration: "2.18s", verifiedBy: "GOV-AUTH-RBA", status: "COMPLETE" },
  { timestamp: "2026-06-06 09:11:22", institution: "Bank Indonesia", algorithm: "CRYSTALS-Kyber-1024", keyIdOld: "QK-BIN-001-P4E7", keyIdNew: "QK-BIN-001-KEM", triggeredBy: "SCHEDULED", duration: "0.42s", verifiedBy: "AGI-VAULT-03", status: "COMPLETE" },
  { timestamp: "2026-06-05 18:49:03", institution: "Bank Indonesia", algorithm: "FALCON-1024", keyIdOld: "QK-BIN-002-Q7F1", keyIdNew: "QK-BIN-002-SIG", triggeredBy: "SCHEDULED", duration: "0.28s", verifiedBy: "AGI-VAULT-03", status: "COMPLETE" },
  { timestamp: "2026-06-04 22:00:00", institution: "Saudi Central Bank", algorithm: "HQC", keyIdOld: "QK-SCB-001-R2D5", keyIdNew: "QK-SCB-001-F4D7", triggeredBy: "EMERGENCY", duration: "0.19s", verifiedBy: "AGI-VAULT-01", status: "COMPLETE" },
  { timestamp: "2026-06-03 07:33:19", institution: "System — Master Key", algorithm: "SPHINCS+", keyIdOld: "QK-SYS-001-S6C9", keyIdNew: "QK-SYS-001-A7F2", triggeredBy: "SCHEDULED", duration: "0.35s", verifiedBy: "AGI-VAULT-01", status: "COMPLETE" },
  { timestamp: "2026-06-02 15:05:44", institution: "Bank of England", algorithm: "CRYSTALS-Dilithium", keyIdOld: "QK-BOE-002-T1A3", keyIdNew: "QK-BOE-002-SIG", triggeredBy: "SCHEDULED", duration: "0.30s", verifiedBy: "AGI-VAULT-02", status: "COMPLETE" },
  { timestamp: "2026-06-01 12:00:00", institution: "Federal Reserve (US)", algorithm: "CRYSTALS-Kyber-1024", keyIdOld: "QK-FED-001-U8B4", keyIdNew: "QK-FED-001-H9E3", triggeredBy: "SCHEDULED", duration: "0.37s", verifiedBy: "AGI-VAULT-01", status: "COMPLETE" },
  { timestamp: "2026-05-31 20:45:10", institution: "PBoC", algorithm: "CRYSTALS-Dilithium", keyIdOld: "QK-PBC-002-V5E8", keyIdNew: "QK-PBC-002-SIG", triggeredBy: "MANUAL", duration: "0.92s", verifiedBy: "GOV-AUTH-PBC", status: "COMPLETE" },
  { timestamp: "2026-05-30 06:22:33", institution: "Bank of Japan", algorithm: "SPHINCS+", keyIdOld: "QK-BOJ-002-W3F6", keyIdNew: "QK-BOJ-002-HSH", triggeredBy: "SCHEDULED", duration: "0.33s", verifiedBy: "AGI-VAULT-03", status: "COMPLETE" },
  { timestamp: "2026-05-29 11:58:01", institution: "European Central Bank", algorithm: "FALCON-1024", keyIdOld: "QK-ECB-002-X9D2", keyIdNew: "QK-ECB-002-SIG", triggeredBy: "SCHEDULED", duration: "0.26s", verifiedBy: "AGI-VAULT-02", status: "COMPLETE" },
  { timestamp: "2026-05-28 16:14:55", institution: "Reserve Bank of Australia", algorithm: "CRYSTALS-Kyber-1024", keyIdOld: "QK-RBA-002-Y4C7", keyIdNew: "QK-RBA-002-KEM", triggeredBy: "EMERGENCY", duration: "0.22s", verifiedBy: "AGI-VAULT-01", status: "COMPLETE" },
];

const INSTITUTION_HEALTH = [
  { name: "Fed", full: "Federal Reserve (US)", score: 99.2, trend: [98.8, 99.0, 99.1, 98.9, 99.0, 99.2, 99.1, 99.2, 99.3, 99.2, 99.1, 99.2, 99.0, 99.2, 99.2, 99.3, 99.2, 99.1, 99.2, 99.2, 99.1, 99.3, 99.2, 99.2, 99.0, 99.1, 99.2, 99.3, 99.2, 99.2] },
  { name: "ECB", full: "European Central Bank", score: 98.7, trend: [98.4, 98.5, 98.6, 98.5, 98.7, 98.6, 98.8, 98.7, 98.6, 98.7, 98.5, 98.6, 98.7, 98.8, 98.7, 98.6, 98.7, 98.8, 98.7, 98.6, 98.7, 98.7, 98.8, 98.7, 98.6, 98.7, 98.7, 98.6, 98.7, 98.7] },
  { name: "BIN", full: "Bank Indonesia", score: 97.4, trend: [97.0, 97.1, 97.2, 97.1, 97.3, 97.2, 97.4, 97.3, 97.2, 97.4, 97.2, 97.3, 97.4, 97.4, 97.3, 97.4, 97.4, 97.3, 97.4, 97.4, 97.3, 97.4, 97.4, 97.3, 97.4, 97.4, 97.3, 97.4, 97.4, 97.4] },
  { name: "PBoC", full: "People's Bank of China", score: 98.1, trend: [97.8, 97.9, 98.0, 97.9, 98.1, 98.0, 98.2, 98.1, 98.0, 98.1, 97.9, 98.0, 98.1, 98.1, 98.0, 98.1, 98.1, 98.0, 98.1, 98.1, 98.0, 98.1, 98.1, 98.0, 98.1, 98.2, 98.1, 98.0, 98.1, 98.1] },
  { name: "BoJ", full: "Bank of Japan", score: 99.0, trend: [98.7, 98.8, 98.9, 98.8, 99.0, 98.9, 99.1, 99.0, 98.9, 99.0, 98.8, 98.9, 99.0, 99.0, 98.9, 99.0, 99.0, 98.9, 99.0, 99.0, 98.9, 99.0, 99.0, 98.9, 99.0, 99.1, 99.0, 98.9, 99.0, 99.0] },
  { name: "RBA", full: "Reserve Bank of Australia", score: 97.8, trend: [97.5, 97.6, 97.7, 97.6, 97.8, 97.7, 97.9, 97.8, 97.7, 97.8, 97.6, 97.7, 97.8, 97.8, 97.7, 97.8, 97.8, 97.7, 97.8, 97.8, 97.7, 97.8, 97.8, 97.7, 97.8, 97.9, 97.8, 97.7, 97.8, 97.8] },
  { name: "BoE", full: "Bank of England", score: 98.5, trend: [98.2, 98.3, 98.4, 98.3, 98.5, 98.4, 98.6, 98.5, 98.4, 98.5, 98.3, 98.4, 98.5, 98.5, 98.4, 98.5, 98.5, 98.4, 98.5, 98.5, 98.4, 98.5, 98.5, 98.4, 98.5, 98.6, 98.5, 98.4, 98.5, 98.5] },
  { name: "SCB", full: "Saudi Central Bank", score: 96.9, trend: [96.6, 96.7, 96.8, 96.7, 96.9, 96.8, 97.0, 96.9, 96.8, 96.9, 96.7, 96.8, 96.9, 96.9, 96.8, 96.9, 96.9, 96.8, 96.9, 96.9, 96.8, 96.9, 96.9, 96.8, 96.9, 97.0, 96.9, 96.8, 96.9, 96.9] },
];

// ─── Countdown hook ────────────────────────────────────────────────────────────

// Base target: 47 years from Jun 13 2026 = Jun 13 2073
const SAFE_UNTIL = new Date("2073-06-13T00:00:00Z");

function useQuantumCountdown() {
  const [remaining, setRemaining] = useState(() => SAFE_UNTIL.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setRemaining(SAFE_UNTIL.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalSeconds = Math.max(0, Math.floor(remaining / 1000));
  const years = Math.floor(totalSeconds / (365.25 * 24 * 3600));
  const rem1 = totalSeconds - years * Math.floor(365.25 * 24 * 3600);
  const months = Math.floor(rem1 / (30.44 * 24 * 3600));
  const rem2 = rem1 - months * Math.floor(30.44 * 24 * 3600);
  const days = Math.floor(rem2 / (24 * 3600));
  const rem3 = rem2 - days * 24 * 3600;
  const hours = Math.floor(rem3 / 3600);
  const minutes = Math.floor((rem3 % 3600) / 60);
  const seconds = rem3 % 60;

  return { years, months, days, hours, minutes, seconds };
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h * 0.8 - h * 0.1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}

// ─── Threat Wave ──────────────────────────────────────────────────────────────

function ThreatWave() {
  return (
    <div className="relative w-full h-24 overflow-hidden rounded-xl" style={{ background: "rgba(8,14,31,0.8)" }}>
      {/* Animated wave */}
      <div className="absolute inset-0 flex items-center">
        <svg className="absolute left-0 w-full h-full" viewBox="0 0 400 96" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d="M0,48 Q50,20 100,48 T200,48 T300,48 T400,48 L400,96 L0,96 Z"
            fill="url(#waveGrad)"
            opacity="0.3"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="-200,0; 0,0; -200,0"
              dur="4s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M0,52 Q50,28 100,52 T200,52 T300,52 T400,52 L400,96 L0,96 Z"
            fill="url(#waveGrad)"
            opacity="0.15"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -200,0; 0,0"
              dur="5s"
              repeatCount="indefinite"
            />
          </path>
        </svg>

        {/* Labels */}
        <div className="relative z-10 flex items-center justify-between w-full px-6">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#ef4444" }}>QUANTUM THREAT</div>
            <div className="text-xs font-mono" style={{ color: "#ef444480" }}>RSA-2048 ZONE</div>
            <div className="flex items-center gap-1 mt-1 justify-center">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
              <span className="text-xs" style={{ color: "#ef4444" }}>APPROACHING 2073</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.15)", border: "2px solid #3b82f6", boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}>
              <Shield size={20} style={{ color: "#3b82f6" }} />
            </div>
            <span className="text-xs font-bold" style={{ color: "#3b82f6" }}>SOVEREIGN SHIELD</span>
          </div>

          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#10b981" }}>KYBER-1024 ZONE</div>
            <div className="text-xs font-mono" style={{ color: "#10b98180" }}>SAFE: 200+ YEARS</div>
            <div className="flex items-center gap-1 mt-1 justify-center">
              <ShieldCheck size={10} style={{ color: "#10b981" }} />
              <span className="text-xs" style={{ color: "#10b981" }}>PROTECTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Emergency Rekey Modal ────────────────────────────────────────────────────

function EmergencyRekeyModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<"confirm" | "countdown" | "done">("confirm");

  function startCountdown() {
    setPhase("countdown");
    setCountdown(3);
  }

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { setPhase("done"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div
        className="rounded-xl p-7 w-full max-w-md mx-4"
        style={{ background: "#090f20", border: "2px solid rgba(239,68,68,0.5)", boxShadow: "0 0 60px rgba(239,68,68,0.2)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} style={{ color: "#ef4444" }} />
            <span className="font-bold tracking-wider uppercase" style={{ color: "#ef4444" }}>EMERGENCY RE-KEY — ALL SYSTEMS</span>
          </div>
          <button onClick={onClose} style={{ color: "#64748b" }}>
            <X size={18} />
          </button>
        </div>

        {phase === "confirm" && (
          <>
            <div className="rounded-lg p-4 mb-5 space-y-2 text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ color: "#cbd5e1" }}>This will immediately rotate <span className="font-bold text-white">ALL 12 sovereign encryption keys</span> across all 8 institutions and 2 system channels.</p>
              <p className="mt-2" style={{ color: "#f59e0b" }}>Active sessions will be temporarily interrupted during key rotation (estimated 2–4 seconds per node).</p>
              <p className="mt-2" style={{ color: "#94a3b8" }}>This action will be permanently logged with operator identity and timestamp.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
                Cancel
              </button>
              <button onClick={startCountdown} className="flex-1 py-2.5 rounded-lg text-xs font-bold" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)" }}>
                I Understand — Proceed
              </button>
            </div>
          </>
        )}

        {phase === "countdown" && (
          <div className="text-center py-4">
            <p className="text-xs mb-4 uppercase tracking-widest" style={{ color: "#94a3b8" }}>Activating in</p>
            <div
              className="text-7xl font-black font-mono mx-auto mb-4 w-28 h-28 rounded-full flex items-center justify-center"
              style={{ color: "#ef4444", border: "3px solid rgba(239,68,68,0.5)", boxShadow: "0 0 40px rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}
            >
              {countdown}
            </div>
            <p className="text-xs" style={{ color: "#64748b" }}>Do not close this window</p>
          </div>
        )}

        {phase === "done" && (
          <div className="text-center py-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(16,185,129,0.1)", border: "2px solid #10b981" }}
            >
              <CheckCircle2 size={28} style={{ color: "#10b981" }} />
            </div>
            <p className="font-bold mb-2" style={{ color: "#10b981" }}>EMERGENCY RE-KEY INITIATED</p>
            <p className="text-xs mb-4" style={{ color: "#64748b" }}>All sovereign keys are being rotated. AGI monitoring active.</p>
            <button onClick={onConfirm} className="w-full py-2.5 rounded-lg text-xs font-bold" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Force Rotate Modal ────────────────────────────────────────────────────────

function ForceRotateModal({ keyEntry, onClose, onConfirm }: { keyEntry: SovereignKey; onClose: () => void; onConfirm: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="rounded-xl p-6 w-full max-w-sm mx-4" style={{ background: "#090f20", border: "1px solid rgba(59,130,246,0.4)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} style={{ color: "#3b82f6" }} />
            <span className="font-bold text-sm" style={{ color: "#3b82f6" }}>FORCE ROTATE KEY</span>
          </div>
          <button onClick={onClose} style={{ color: "#64748b" }}><X size={16} /></button>
        </div>
        <div className="rounded-lg p-3 mb-4 text-xs space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex justify-between"><span style={{ color: "#64748b" }}>Key ID</span><span className="font-mono" style={{ color: "#e2e8f0" }}>{keyEntry.id}</span></div>
          <div className="flex justify-between"><span style={{ color: "#64748b" }}>Institution</span><span className="font-semibold" style={{ color: "#e2e8f0" }}>{keyEntry.institution}</span></div>
          <div className="flex justify-between"><span style={{ color: "#64748b" }}>Algorithm</span><span className="font-mono" style={{ color: "#3b82f6" }}>{keyEntry.algorithm}</span></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
          <button onClick={() => onConfirm(keyEntry.id)} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.4)" }}>Confirm Rotation</button>
        </div>
      </div>
    </div>
  );
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

function KeyStatusBadge({ status }: { status: KeyStatus }) {
  const map: Record<KeyStatus, { bg: string; text: string; border: string }> = {
    ACTIVE: { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
    ROTATING: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.3)" },
    PENDING: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  };
  const c = map[status];
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded font-mono" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {status}
    </span>
  );
}

function TriggerBadge({ type }: { type: TriggeredBy }) {
  const map: Record<TriggeredBy, { bg: string; text: string }> = {
    SCHEDULED: { bg: "rgba(99,102,241,0.12)", text: "#6366f1" },
    MANUAL: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
    EMERGENCY: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
  };
  const c = map[type];
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded font-mono" style={{ background: c.bg, color: c.text }}>
      {type}
    </span>
  );
}

function AlgoStatusBadge({ status }: { status: AlgorithmStatus }) {
  const map: Record<AlgorithmStatus, { bg: string; text: string }> = {
    ACTIVE: { bg: "rgba(16,185,129,0.12)", text: "#10b981" },
    MONITORING: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
    STANDBY: { bg: "rgba(148,163,184,0.12)", text: "#94a3b8" },
  };
  const c = map[status];
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded font-mono" style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function QuantumSecurity() {
  const countdown = useQuantumCountdown();
  const [showRekeyModal, setShowRekeyModal] = useState(false);
  const [forceRotateKey, setForceRotateKey] = useState<SovereignKey | null>(null);
  const [keys, setKeys] = useState<SovereignKey[]>(SOVEREIGN_KEYS);
  const [rotatingKeys, setRotatingKeys] = useState<Set<string>>(new Set());

  const totalKeys = keys.length;
  const lastGlobalRotation = "2026-06-13 09:14:22 UTC";

  function handleForceRotateConfirm(keyId: string) {
    setForceRotateKey(null);
    setRotatingKeys((prev) => new Set([...prev, keyId]));
    setTimeout(() => {
      setKeys((prev) =>
        prev.map((k) =>
          k.id === keyId
            ? { ...k, status: "ACTIVE", lastRotated: "2026-06-13", daysUntilRotation: 30 }
            : k
        )
      );
      setRotatingKeys((prev) => { const s = new Set(prev); s.delete(keyId); return s; });
    }, 2500);
  }

  function handleEmergencyRekeyDone() {
    setShowRekeyModal(false);
    setKeys((prev) => prev.map((k) => ({ ...k, status: "ACTIVE", lastRotated: "2026-06-13", daysUntilRotation: 30 })));
  }

  function getRowHealth(score: number, days: number) {
    if (days <= 0) return "rgba(239,68,68,0.07)";
    if (days <= 7) return "rgba(245,158,11,0.07)";
    return "transparent";
  }

  function getHealthColor(score: number) {
    if (score >= 99) return "#10b981";
    if (score >= 97) return "#3b82f6";
    if (score >= 95) return "#f59e0b";
    return "#ef4444";
  }

  const overallHealth = (INSTITUTION_HEALTH.reduce((a, b) => a + b.score, 0) / INSTITUTION_HEALTH.length).toFixed(1);

  return (
    <AppLayout>
      <Header title="Quantum Security Command Center" subtitle="Post-Quantum Cryptographic Infrastructure — Sovereign Grade" />

      <div className="flex-1 p-6 space-y-6" style={{ background: "#080e1f" }}>

        {/* ── 1. Sovereign Encryption Status Header ─────────────────────────── */}
        <div
          className="rounded-xl px-6 py-5"
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.05) 50%, rgba(8,14,31,0) 100%)",
            border: "1px solid rgba(59,130,246,0.25)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Grade */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black font-mono"
                style={{ background: "rgba(212,160,23,0.12)", border: "2px solid rgba(212,160,23,0.5)", color: "#d4a017", boxShadow: "0 0 24px rgba(212,160,23,0.2)" }}
              >
                A+
              </div>
              <div>
                <p className="text-xl font-black tracking-wider uppercase" style={{ color: "#d4a017" }}>QUANTUM-SOVEREIGN</p>
                <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: "#64748b" }}>SYSTEM ENCRYPTION GRADE</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold font-mono" style={{ color: "#3b82f6" }}>{totalKeys}</p>
                <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: "#475569" }}>KEYS MANAGED</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-mono font-bold" style={{ color: "#10b981" }}>{lastGlobalRotation}</p>
                <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: "#475569" }}>LAST GLOBAL ROTATION</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono" style={{ color: "#10b981" }}>{overallHealth}</p>
                <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: "#475569" }}>SYSTEM HEALTH SCORE</p>
              </div>
            </div>

            {/* Emergency button */}
            <button
              onClick={() => setShowRekeyModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90"
              style={{
                background: "rgba(239,68,68,0.12)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.4)",
                boxShadow: "0 0 16px rgba(239,68,68,0.1)",
              }}
            >
              <AlertTriangle size={16} />
              EMERGENCY RE-KEY ALL
            </button>
          </div>
        </div>

        {/* ── 2. Quantum Threat Horizon Panel ───────────────────────────────── */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <Cpu size={16} style={{ color: "#3b82f6" }} />
              <span className="text-sm font-bold tracking-wider uppercase" style={{ color: "#e2e8f0" }}>Quantum Threat Horizon</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded font-mono" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>NIST PQC TIMELINE</span>
            </div>
          </div>

          <div className="p-6">
            {/* Big countdown */}
            <div className="text-center mb-6">
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#475569" }}>CURRENT ENCRYPTION SAFE FOR</p>
              <div className="flex items-end justify-center gap-3 flex-wrap">
                {[
                  { value: countdown.years, label: "YEARS" },
                  { value: countdown.months, label: "MONTHS" },
                  { value: countdown.days, label: "DAYS" },
                  { value: countdown.hours, label: "HRS" },
                  { value: countdown.minutes, label: "MIN" },
                  { value: countdown.seconds, label: "SEC" },
                ].map(({ value, label }, i) => (
                  <div key={label} className="flex items-end gap-1">
                    <div className="text-center">
                      <div
                        className="text-4xl sm:text-5xl font-black font-mono tabular-nums rounded-lg px-3 py-2"
                        style={{
                          color: label === "SEC" ? "#60a5fa" : label === "MIN" || label === "HRS" ? "#93c5fd" : "#3b82f6",
                          background: "rgba(59,130,246,0.07)",
                          border: "1px solid rgba(59,130,246,0.15)",
                          minWidth: label === "YEARS" ? "120px" : "72px",
                          textShadow: "0 0 20px rgba(59,130,246,0.5)",
                        }}
                      >
                        {String(value).padStart(2, "0")}
                      </div>
                      <p className="text-xs uppercase tracking-widest mt-1.5" style={{ color: "#475569" }}>{label}</p>
                    </div>
                    {i < 5 && <span className="text-2xl font-bold mb-6" style={{ color: "rgba(59,130,246,0.3)" }}>:</span>}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs" style={{ color: "#64748b" }}>
                Based on NIST PQC Timeline — quantum computers capable of breaking RSA-2048 projected by 2073
              </p>
            </div>

            {/* Wave visualization */}
            <ThreatWave />

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-4 mt-5">
              <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} style={{ color: "#ef4444" }} />
                  <span className="text-sm font-bold" style={{ color: "#ef4444" }}>Legacy RSA-2048</span>
                </div>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Status</span>
                    <span className="font-bold font-mono px-2 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>VULNERABLE</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Safe until</span>
                    <span style={{ color: "#ef4444" }}>~47 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Quantum threat</span>
                    <span style={{ color: "#f59e0b" }}>CRITICAL (2073)</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Deployed here</span>
                    <span style={{ color: "#10b981" }}>NO</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={14} style={{ color: "#10b981" }} />
                  <span className="text-sm font-bold" style={{ color: "#10b981" }}>CRYSTALS-Kyber-1024</span>
                </div>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Status</span>
                    <span className="font-bold font-mono px-2 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>SAFE</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Safe until</span>
                    <span style={{ color: "#10b981" }}>200+ years</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Quantum threat</span>
                    <span style={{ color: "#10b981" }}>NONE (lattice)</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#64748b" }}>Deployed here</span>
                    <span style={{ color: "#10b981" }}>YES — 8 nodes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Encryption Key Inventory Table ─────────────────────────────── */}
        <div className="rounded-xl" style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <Key size={15} style={{ color: "#d4a017" }} />
              <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Encryption Key Inventory</span>
              <span className="ml-1 text-xs px-2 py-0.5 rounded font-mono" style={{ background: "rgba(212,160,23,0.1)", color: "#d4a017" }}>{totalKeys} ACTIVE</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Key ID", "Institution", "Algorithm", "Created", "Last Rotated", "Next Rotation", "Status", "Health", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#475569" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map((key, i) => {
                  const isRotating = rotatingKeys.has(key.id);
                  const rowBg = isRotating ? "rgba(59,130,246,0.07)" : getRowHealth(key.healthScore, key.daysUntilRotation);
                  const hColor = getHealthColor(key.healthScore);
                  return (
                    <tr
                      key={key.id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: rowBg,
                        transition: "background 0.3s",
                      }}
                    >
                      <td className="px-4 py-2.5 font-mono font-bold whitespace-nowrap" style={{ color: "#3b82f6" }}>{key.id}</td>
                      <td className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: "#e2e8f0" }}>{key.institution}</td>
                      <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: "#93c5fd" }}>{key.algorithm}</td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: "#64748b" }}>{key.created}</td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: "#94a3b8" }}>{key.lastRotated}</td>
                      <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: key.daysUntilRotation <= 7 ? "#f59e0b" : "#94a3b8" }}>
                        {key.nextRotationDue}
                        {key.daysUntilRotation <= 7 && (
                          <span className="ml-1 text-xs" style={{ color: "#f59e0b" }}>({key.daysUntilRotation}d)</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {isRotating ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded font-mono" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
                            ROTATING
                          </span>
                        ) : (
                          <KeyStatusBadge status={key.status} />
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full" style={{ width: `${key.healthScore}%`, background: hColor }} />
                          </div>
                          <span className="font-mono" style={{ color: hColor }}>{key.healthScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setForceRotateKey(key)}
                          disabled={isRotating}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all disabled:opacity-40"
                          style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}
                        >
                          <RefreshCw size={10} className={isRotating ? "animate-spin" : ""} />
                          {isRotating ? "Rotating..." : "Force Rotate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 4. Post-Quantum Algorithm Status Board ────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} style={{ color: "#3b82f6" }} />
            <h2 className="text-sm font-bold tracking-wider uppercase" style={{ color: "#e2e8f0" }}>Post-Quantum Algorithm Status Board</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALGORITHMS.map((algo) => (
              <div
                key={algo.name}
                className="rounded-xl p-5"
                style={{
                  background: "#0d1426",
                  border: `1px solid rgba(255,255,255,0.07)`,
                  borderTop: `2px solid ${algo.color}40`,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#e2e8f0" }}>{algo.shortName}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{algo.type}</p>
                  </div>
                  <AlgoStatusBadge status={algo.status} />
                </div>

                {/* NIST badge */}
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded mb-3 text-xs font-bold"
                  style={{
                    background: algo.nistStatus === "NIST STANDARDIZED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                    color: algo.nistStatus === "NIST STANDARDIZED" ? "#10b981" : "#f59e0b",
                    border: `1px solid ${algo.nistStatus === "NIST STANDARDIZED" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                  }}
                >
                  <CheckCircle2 size={10} />
                  {algo.nistStatus} ({algo.nistYear})
                </div>

                {/* Feature tag */}
                <div className="mb-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded font-mono"
                    style={{ background: `${algo.color}15`, color: algo.color }}
                  >
                    {algo.feature}
                  </span>
                </div>

                {/* Security level */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#64748b" }}>NIST Security Level</span>
                    <span className="font-bold font-mono" style={{ color: algo.color }}>{algo.securityLevel} / 5</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(algo.securityLevel / 5) * 100}%`, background: algo.color }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div>
                    <span style={{ color: "#475569" }}>Deployments </span>
                    <span className="font-bold font-mono" style={{ color: algo.color }}>{algo.deployments}</span>
                  </div>
                  <div>
                    <span style={{ color: "#475569" }}>Audited </span>
                    <span className="font-mono" style={{ color: "#94a3b8" }}>{algo.lastAudit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. Cryptographic Health Scores ────────────────────────────────── */}
        <div className="rounded-xl" style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <Activity size={15} style={{ color: "#10b981" }} />
              <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Cryptographic Health Scores</span>
              <span className="text-xs" style={{ color: "#64748b" }}>— 30-day trend</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black font-mono" style={{ color: "#10b981" }}>{overallHealth}</span>
              <span
                className="text-sm font-black px-2 py-0.5 rounded"
                style={{ background: "rgba(212,160,23,0.12)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.3)" }}
              >
                A+
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
            {INSTITUTION_HEALTH.map((inst, i) => {
              const hColor = getHealthColor(inst.score);
              const isLast = i === INSTITUTION_HEALTH.length - 1;
              return (
                <div
                  key={inst.name}
                  className="p-4"
                  style={{
                    borderRight: i % 4 !== 3 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                    borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>{inst.name}</span>
                    <Sparkline data={inst.trend} color={hColor} />
                  </div>
                  <div className="text-2xl font-black font-mono mb-1" style={{ color: hColor }}>{inst.score}</div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${inst.score}%`, background: hColor }} />
                  </div>
                  <p className="text-xs mt-1.5 truncate" style={{ color: "#475569" }}>{inst.full}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 6. Key Rotation Event Audit Trail ─────────────────────────────── */}
        <div className="rounded-xl" style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <Clock size={15} style={{ color: "#6366f1" }} />
              <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Key Rotation Audit Trail</span>
              <span className="ml-1 text-xs px-2 py-0.5 rounded font-mono" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>{AUDIT_TRAIL.length} ENTRIES</span>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "rgba(212,160,23,0.1)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.25)" }}
            >
              <Download size={12} />
              Export Audit Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Timestamp", "Institution", "Algorithm", "Key ID (Old → New)", "Triggered By", "Duration", "Verified By", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#475569" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AUDIT_TRAIL.map((entry, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    }}
                  >
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: "#64748b" }}>{entry.timestamp}</td>
                    <td className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: "#e2e8f0" }}>{entry.institution}</td>
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: "#93c5fd" }}>{entry.algorithm}</td>
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: "#475569" }}>
                      <span style={{ color: "#ef444480" }}>{entry.keyIdOld}</span>
                      <span className="mx-1.5" style={{ color: "#3b82f6" }}>→</span>
                      <span style={{ color: "#10b981" }}>{entry.keyIdNew}</span>
                    </td>
                    <td className="px-4 py-2.5"><TriggerBadge type={entry.triggeredBy} /></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: "#94a3b8" }}>{entry.duration}</td>
                    <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: "#6366f1" }}>{entry.verifiedBy}</td>
                    <td className="px-4 py-2.5">
                      {entry.status === "COMPLETE" ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={10} style={{ color: "#10b981" }} />
                          <span style={{ color: "#10b981" }} className="font-semibold">COMPLETE</span>
                        </span>
                      ) : entry.status === "IN_PROGRESS" ? (
                        <span className="flex items-center gap-1">
                          <RefreshCw size={10} style={{ color: "#3b82f6" }} className="animate-spin" />
                          <span style={{ color: "#3b82f6" }} className="font-semibold">IN PROGRESS</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={10} style={{ color: "#ef4444" }} />
                          <span style={{ color: "#ef4444" }} className="font-semibold">FAILED</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showRekeyModal && (
        <EmergencyRekeyModal
          onClose={() => setShowRekeyModal(false)}
          onConfirm={handleEmergencyRekeyDone}
        />
      )}
      {forceRotateKey && (
        <ForceRotateModal
          keyEntry={forceRotateKey}
          onClose={() => setForceRotateKey(null)}
          onConfirm={handleForceRotateConfirm}
        />
      )}
    </AppLayout>
  );
}
