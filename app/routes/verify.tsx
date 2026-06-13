import { useState, useRef } from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Search, RotateCcw, Zap, Lock, Globe2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";
import { useConfigurables } from "~/modules/configurables";

type VerifyResult = "VERIFIED" | "FLAGGED" | "BLACKLISTED" | null;

interface VerificationResponse {
  verdict: VerifyResult;
  confidence: number;
  serialNumber: string;
  issuedBy: string;
  denomination: string;
  currency: string;
  issuedDate: string;
  globalBlacklist: boolean;
  detectionTime: number;
  checkpoints: string[];
}

const SAMPLE_SERIALS = [
  "AA8472901",
  "ZB1234567",
  "XC9900112",
  "KD4456789",
  "MF0034521",
];

const AUTHORITIES = [
  "Federal Reserve",
  "European Central Bank",
  "Bank of England",
  "Bank of Japan",
];

const DENOMS_LABELS = ["$100", "$50", "€100", "£50", "¥10000"];
const CURRENCIES = ["USD", "EUR", "GBP", "JPY"];

function simulateVerification(serial: string): Promise<VerificationResponse> {
  return new Promise((resolve) => {
    const h = serial.charCodeAt(0) + serial.charCodeAt(serial.length - 1);
    let verdict: VerifyResult;
    if (h % 7 === 0) verdict = "BLACKLISTED";
    else if (h % 4 === 0) verdict = "FLAGGED";
    else verdict = "VERIFIED";

    const confidence =
      verdict === "VERIFIED"
        ? 97 + Math.random() * 2.5
        : verdict === "FLAGGED"
        ? 73 + Math.random() * 15
        : 99 + Math.random() * 0.9;

    const checkpointsVerified = [
      "Quantum-signature layer",
      "Microprint authentication",
      "Polymer substrate scan",
      "UV fluorescence check",
      "Serial entropy analysis",
      "Global blacklist lookup",
    ];
    const checkpointsFlagged = ["Quantum-signature layer", "Microprint authentication"];

    setTimeout(
      () =>
        resolve({
          verdict,
          confidence: parseFloat(confidence.toFixed(2)),
          serialNumber: serial.toUpperCase(),
          issuedBy: AUTHORITIES[h % AUTHORITIES.length],
          denomination: DENOMS_LABELS[h % DENOMS_LABELS.length],
          currency: CURRENCIES[h % CURRENCIES.length],
          issuedDate: new Date(Date.now() - (h % 100) * 1e9).toISOString().slice(0, 10),
          globalBlacklist: verdict === "BLACKLISTED",
          detectionTime: parseFloat((0.0008 + Math.random() * 0.0003).toFixed(4)),
          checkpoints: verdict === "VERIFIED" ? checkpointsVerified : checkpointsFlagged,
        }),
      1400
    );
  });
}

const VERDICT_CONFIG = {
  VERIFIED: {
    Icon: ShieldCheck,
    label: "VERIFIED",
    sublabel: "Authentic & Authorized",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.35)",
    color: "var(--me-success)",
    glow: "0 0 30px rgba(16,185,129,0.25)",
  },
  FLAGGED: {
    Icon: ShieldAlert,
    label: "FLAGGED",
    sublabel: "Under Investigation",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.35)",
    color: "var(--me-warning)",
    glow: "0 0 30px rgba(245,158,11,0.25)",
  },
  BLACKLISTED: {
    Icon: ShieldX,
    label: "BLACKLISTED",
    sublabel: "Counterfeit Detected — Globally Blacklisted",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.35)",
    color: "var(--me-danger)",
    glow: "0 0 30px rgba(239,68,68,0.25)",
  },
};

// Arc gauge component
function ConfidenceGauge({ confidence, color }: { confidence: number; color: string }) {
  const radius = 52;
  const cx = 64;
  const cy = 64;
  const startAngle = -210;
  const totalArc = 240;
  const sweep = (confidence / 100) * totalArc;

  function polarToXY(angle: number, r: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  const start = polarToXY(startAngle, radius);
  const end = polarToXY(startAngle + sweep, radius);
  const largeArc = sweep > 180 ? 1 : 0;

  const bgStart = polarToXY(startAngle, radius);
  const bgEnd = polarToXY(startAngle + totalArc, radius);

  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      {/* Background arc */}
      <path
        d={`M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Value arc */}
      {confidence > 0 && (
        <motion.path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="20" fontWeight="700" fontFamily="monospace">
        {confidence.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Inter">
        CONFIDENCE
      </text>
    </svg>
  );
}

export default function AntiCounterfeit() {
  const { config, loading } = useConfigurables();
  const title = loading ? "Anti-Counterfeit Verification" : (config?.antiCounterfeitTitle ?? "Anti-Counterfeit Verification");

  const [serial, setSerial] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [recentChecks, setRecentChecks] = useState<VerificationResponse[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleVerify() {
    if (!serial.trim()) return;
    setIsScanning(true);
    setResult(null);
    const res = await simulateVerification(serial.trim());
    setIsScanning(false);
    setResult(res);
    setRecentChecks((prev) => [res, ...prev].slice(0, 6));
  }

  function handleReset() {
    setSerial("");
    setResult(null);
    inputRef.current?.focus();
  }

  const verdictCfg = result ? VERDICT_CONFIG[result.verdict as keyof typeof VERDICT_CONFIG] : null;

  return (
    <AppLayout>
      <Header title={title} subtitle="0.001-Second Banknote Authentication Protocol" />

      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Verification Panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Input */}
            <div className="me-card p-6">
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--me-gold)" }}>
                Banknote Serial Input
              </h3>
              <p className="text-xs mb-4" style={{ color: "var(--me-text-secondary)" }}>
                Enter the serial number printed on the banknote or paste a scan result
              </p>

              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg mb-3"
                style={{ background: "var(--me-bg-secondary)", border: "2px solid var(--me-border)" }}
              >
                <Search size={16} style={{ color: "var(--me-text-secondary)" }} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="e.g. AA8472901"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="flex-1 bg-transparent text-base font-mono outline-none"
                  style={{ color: "var(--me-text-primary)" }}
                  disabled={isScanning}
                />
                {serial && (
                  <button onClick={() => setSerial("")} style={{ color: "var(--me-text-secondary)" }}>
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              {/* Sample serials */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                  Try:
                </span>
                {SAMPLE_SERIALS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSerial(s)}
                    className="text-xs font-mono px-2 py-0.5 rounded transition-colors"
                    style={{
                      background: "rgba(59,130,246,0.08)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      color: "var(--me-blue)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={handleVerify}
                disabled={!serial.trim() || isScanning}
                className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50"
                style={{
                  background: isScanning
                    ? "rgba(212,160,23,0.3)"
                    : "var(--me-gold)",
                  color: "var(--me-bg-primary)",
                  boxShadow: !isScanning ? "0 0 16px rgba(212,160,23,0.3)" : undefined,
                }}
              >
                {isScanning ? "SCANNING..." : "VERIFY BANKNOTE"}
              </button>
            </div>

            {/* Scanning animation */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="me-card p-6 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full animate-me-pulse" style={{ background: "var(--me-blue)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--me-blue)" }}>
                      Anti-counterfeit scan in progress...
                    </span>
                  </div>
                  {/* Scanning bar */}
                  <div
                    className="relative rounded-lg overflow-hidden"
                    style={{ background: "var(--me-bg-secondary)", height: 80 }}
                  >
                    <div
                      className="absolute inset-x-0 h-0.5 animate-me-scan"
                      style={{
                        background: "linear-gradient(90deg, transparent, var(--me-blue), transparent)",
                        boxShadow: "0 0 12px var(--me-blue)",
                        top: 0,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-xs tracking-widest animate-me-blink" style={{ color: "var(--me-blue)" }}>
                        SCANNING {serial.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {["Quantum-signature check", "Global blacklist query", "Entropy analysis"].map((step) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-me-pulse" style={{ background: "var(--me-blue)" }} />
                        <span className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
              {result && verdictCfg && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: verdictCfg.bg,
                    border: `2px solid ${verdictCfg.border}`,
                    boxShadow: verdictCfg.glow,
                  }}
                >
                  {/* Verdict header */}
                  <div className="px-6 py-5 flex items-center gap-4">
                    <verdictCfg.Icon
                      size={40}
                      style={{ color: verdictCfg.color, filter: `drop-shadow(0 0 8px ${verdictCfg.color})` }}
                    />
                    <div>
                      <div className="text-2xl font-black tracking-tight" style={{ color: verdictCfg.color }}>
                        {verdictCfg.label}
                      </div>
                      <div className="text-sm" style={{ color: "var(--me-text-secondary)" }}>
                        {verdictCfg.sublabel}
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Zap size={12} style={{ color: "var(--me-gold)" }} />
                      <span className="text-xs font-mono" style={{ color: "var(--me-gold)" }}>
                        {result.detectionTime}s
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div
                    className="px-6 py-4 grid grid-cols-2 gap-4 border-t"
                    style={{ borderColor: verdictCfg.border }}
                  >
                    {[
                      { label: "Serial Number", value: result.serialNumber },
                      { label: "Issuing Authority", value: result.issuedBy },
                      { label: "Denomination", value: result.denomination },
                      { label: "Currency", value: result.currency },
                      { label: "Issue Date", value: result.issuedDate },
                      { label: "Global Blacklist", value: result.globalBlacklist ? "YES — FLAGGED" : "NOT LISTED" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "var(--me-text-secondary)" }}>
                          {label}
                        </div>
                        <div
                          className="text-sm font-semibold font-mono"
                          style={{ color: label === "Global Blacklist" && result.globalBlacklist ? "var(--me-danger)" : "var(--me-text-primary)" }}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkpoints */}
                  <div className="px-6 py-4 border-t" style={{ borderColor: verdictCfg.border }}>
                    <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--me-text-secondary)" }}>
                      Passed Authentication Layers
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.checkpoints.map((c) => (
                        <span
                          key={c}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background: "rgba(16,185,129,0.1)",
                            border: "1px solid rgba(16,185,129,0.2)",
                            color: "var(--me-success)",
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reset */}
                  <div className="px-6 py-3">
                    <button
                      onClick={handleReset}
                      className="text-xs font-medium"
                      style={{ color: "var(--me-text-secondary)" }}
                    >
                      Verify another banknote →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Stats + Gauge + Recent */}
          <div className="lg:col-span-2 space-y-4">
            {/* Gauge */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="me-card p-5 flex flex-col items-center"
              >
                <h3 className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--me-text-secondary)" }}>
                  Confidence Score
                </h3>
                <ConfidenceGauge
                  confidence={result.confidence}
                  color={verdictCfg?.color ?? "var(--me-gold)"}
                />
              </motion.div>
            )}

            {/* System Stats */}
            <div className="me-card p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--me-gold)" }}>
                System Metrics
              </h3>
              {[
                { label: "Total Verified Today", value: "2,847,391", color: "var(--me-success)" },
                { label: "Counterfeits Caught", value: "1,247", color: "var(--me-danger)" },
                { label: "Avg Detection Time", value: "0.0009s", color: "var(--me-blue)" },
                { label: "Global Blacklist Size", value: "14,822", color: "var(--me-warning)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                    {label}
                  </span>
                  <span className="text-xs font-bold font-mono" style={{ color }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Recent checks */}
            {recentChecks.length > 0 && (
              <div className="me-card p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--me-gold)" }}>
                  Recent Checks
                </h3>
                <div className="space-y-2">
                  {recentChecks.map((r, i) => {
                    const cfg = VERDICT_CONFIG[r.verdict as keyof typeof VERDICT_CONFIG];
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between px-2 py-1.5 rounded"
                        style={{ background: "rgba(255,255,255,0.02)" }}
                      >
                        <span className="font-mono text-xs" style={{ color: "var(--me-text-secondary)" }}>
                          {r.serialNumber}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${cfg.border}33`,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Security info */}
            <div className="me-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={12} style={{ color: "var(--me-gold)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--me-gold)" }}>
                  Quantum-Resistant
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--me-text-secondary)" }}>
                All verification transactions are encrypted with 256-qubit resistant protocols and logged immutably to the Sovereign Ledger.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Globe2 size={12} style={{ color: "var(--me-blue)" }} />
                <span className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                  Connected to 194 national blacklists
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
