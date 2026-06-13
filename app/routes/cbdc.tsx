import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Treemap,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRightLeft,
  TrendingUp,
  Activity,
  Zap,
  Globe2,
  Shield,
  PenLine,
  Clock,
  BarChart3,
} from "lucide-react";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";

// ─── CBDC Data ────────────────────────────────────────────────────────────────

const CBDC_COLORS: Record<string, string> = {
  "USD-D": "#3b82f6",
  "EUR-D": "#d4a017",
  "IDR-D": "#ef4444",
  "CNY-D": "#dc2626",
  "JPY-D": "#ec4899",
  "GBP-D": "#a855f7",
  "SAR-D": "#22c55e",
  "INR-D": "#f97316",
};

interface CBDC {
  ticker: string;
  name: string;
  nation: string;
  flag: string;
  issuer: string;
  supply: number;
  supplyMax: number;
  velocity: number;
  adoptionRate: number;
  status: "ACTIVE" | "PILOT" | "SUSPENDED";
  color: string;
  governor: string;
  treasuryChief: string;
}

const CBDCS: CBDC[] = [
  { ticker: "USD-D", name: "Digital Dollar", nation: "United States", flag: "🇺🇸", issuer: "Federal Reserve", supply: 4_820_000_000_000, supplyMax: 6_000_000_000_000, velocity: 847.3, adoptionRate: 34.2, status: "ACTIVE", color: "#3b82f6", governor: "Gov. J. Powell", treasuryChief: "Sec. J. Yellen" },
  { ticker: "EUR-D", name: "Digital Euro", nation: "Eurozone", flag: "🇪🇺", issuer: "European Central Bank", supply: 3_210_000_000_000, supplyMax: 5_000_000_000_000, velocity: 612.8, adoptionRate: 28.7, status: "ACTIVE", color: "#d4a017", governor: "Pres. C. Lagarde", treasuryChief: "Comm. V. Dombrovskis" },
  { ticker: "IDR-D", name: "Digital Rupiah", nation: "Indonesia", flag: "🇮🇩", issuer: "Bank Indonesia", supply: 890_000_000_000_000, supplyMax: 1_200_000_000_000_000, velocity: 1240.5, adoptionRate: 19.4, status: "PILOT", color: "#ef4444", governor: "Gov. P. Warjiyo", treasuryChief: "Min. S. Mulyani" },
  { ticker: "CNY-D", name: "Digital Yuan", nation: "China", flag: "🇨🇳", issuer: "People's Bank of China", supply: 9_140_000_000_000, supplyMax: 12_000_000_000_000, velocity: 2341.7, adoptionRate: 62.8, status: "ACTIVE", color: "#dc2626", governor: "Gov. Pan Gongsheng", treasuryChief: "Min. Lan Fo'an" },
  { ticker: "JPY-D", name: "Digital Yen", nation: "Japan", flag: "🇯🇵", issuer: "Bank of Japan", supply: 620_000_000_000_000, supplyMax: 900_000_000_000_000, velocity: 987.2, adoptionRate: 41.5, status: "ACTIVE", color: "#ec4899", governor: "Gov. K. Ueda", treasuryChief: "Min. S. Kato" },
  { ticker: "GBP-D", name: "Digital Pound", nation: "United Kingdom", flag: "🇬🇧", issuer: "Bank of England", supply: 1_840_000_000_000, supplyMax: 2_500_000_000_000, velocity: 534.6, adoptionRate: 22.1, status: "PILOT", color: "#a855f7", governor: "Gov. A. Bailey", treasuryChief: "Chan. J. Hunt" },
  { ticker: "SAR-D", name: "Digital Riyal", nation: "Saudi Arabia", flag: "🇸🇦", issuer: "Saudi Central Bank", supply: 420_000_000_000, supplyMax: 800_000_000_000, velocity: 318.9, adoptionRate: 11.8, status: "PILOT", color: "#22c55e", governor: "Gov. A. Al-Kholifey", treasuryChief: "Min. M. Al-Jadaan" },
  { ticker: "INR-D", name: "Digital Rupee", nation: "India", flag: "🇮🇳", issuer: "Reserve Bank of India", supply: 210_000_000_000_000, supplyMax: 400_000_000_000_000, velocity: 1872.4, adoptionRate: 15.3, status: "ACTIVE", color: "#f97316", governor: "Gov. S. Malhotra", treasuryChief: "Min. N. Sitharaman" },
];

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(target);
  useEffect(() => {
    const start = prevTarget.current;
    const diff = target - start;
    const steps = Math.ceil(duration / 16);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + diff * eased));
      if (step >= steps) {
        prevTarget.current = target;
        clearInterval(timer);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function formatSupply(n: number): string {
  if (n >= 1e15) return (n / 1e15).toFixed(2) + "Q";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  return n.toLocaleString();
}

// ─── CBDC Fleet Card ──────────────────────────────────────────────────────────

function CBDCCard({ cbdc, liveSupply }: { cbdc: CBDC; liveSupply: number }) {
  const animated = useCountUp(liveSupply, 1200);
  const pct = Math.min((liveSupply / cbdc.supplyMax) * 100, 100);

  const statusColors: Record<string, string> = {
    ACTIVE: "#22c55e",
    PILOT: "#f59e0b",
    SUSPENDED: "#ef4444",
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl p-4"
      style={{
        background: "var(--me-bg-card)",
        border: `1px solid ${cbdc.color}30`,
        boxShadow: `0 0 20px ${cbdc.color}10`,
      }}
      whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${cbdc.color}25` }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
        style={{ background: cbdc.color, transform: "translate(30%, -30%)" }}
      />
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{cbdc.flag}</span>
            <span className="text-xs font-bold font-mono tracking-widest" style={{ color: cbdc.color }}>
              {cbdc.ticker}
            </span>
          </div>
          <div className="text-sm font-semibold mt-0.5" style={{ color: "var(--me-text-primary)" }}>
            {cbdc.name}
          </div>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: `${statusColors[cbdc.status]}20`,
            color: statusColors[cbdc.status],
            border: `1px solid ${statusColors[cbdc.status]}40`,
          }}
        >
          {cbdc.status}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-end gap-1 mb-1">
          <span className="text-xl font-bold font-mono" style={{ color: cbdc.color }}>
            {formatSupply(animated)}
          </span>
          <span className="text-xs mb-0.5" style={{ color: "var(--me-text-secondary)" }}>in circ.</span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct > 85 ? "#ef4444" : cbdc.color }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: "var(--me-text-secondary)" }}>{pct.toFixed(1)}% of cap</span>
          <span className="text-xs" style={{ color: "var(--me-text-secondary)" }}>{formatSupply(cbdc.supplyMax)} max</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-xs" style={{ color: "var(--me-text-secondary)" }}>24h Velocity</div>
          <div className="text-sm font-bold font-mono" style={{ color: cbdc.color }}>{cbdc.velocity.toFixed(1)} tx/s</div>
        </div>
        <div className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-xs" style={{ color: "var(--me-text-secondary)" }}>Adoption vs Fiat</div>
          <div className="text-sm font-bold font-mono" style={{ color: cbdc.adoptionRate > 50 ? "#22c55e" : cbdc.color }}>
            {cbdc.adoptionRate.toFixed(1)}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Minting Interface ────────────────────────────────────────────────────────

type MintStep = 0 | 1 | 2 | 3;

interface MintState {
  ticker: string;
  amount: string;
  justification: string;
  step: MintStep;
}

function MintingInterface({ cbdcs }: { cbdcs: CBDC[] }) {
  const [state, setState] = useState<MintState>({ ticker: "USD-D", amount: "", justification: "", step: 0 });
  const [animating, setAnimating] = useState(false);
  const [mintedAmount, setMintedAmount] = useState(0);
  const [confirmPulse, setConfirmPulse] = useState(false);
  const selectedCBDC = cbdcs.find(c => c.ticker === state.ticker)!;
  const amount = Number(state.amount.replace(/,/g, "")) || 0;
  const supplyPct = Math.min(((selectedCBDC.supply + amount) / selectedCBDC.supplyMax) * 100, 100);
  const atCap = supplyPct > 95;

  const stepLabels = ["PROPOSE", "CENTRAL BANK APPROVAL", "TREASURY SIGN-OFF", "MINT CONFIRMED"];
  const stepIcons = [PenLine, Shield, CheckCircle2, Coins];

  const advance = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setState(s => ({ ...s, step: (s.step + 1) as MintStep }));
      setAnimating(false);
      if (state.step === 2) {
        setMintedAmount(amount);
        setConfirmPulse(true);
        setTimeout(() => setConfirmPulse(false), 3000);
      }
    }, 900);
  };

  const reset = () => setState({ ticker: "USD-D", amount: "", justification: "", step: 0 });

  return (
    <div className="me-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Coins size={18} style={{ color: "var(--me-gold)" }} />
        <h2 className="text-base font-bold" style={{ color: "var(--me-text-primary)" }}>Minting Authorization Workflow</h2>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto">
        {stepLabels.map((label, i) => {
          const StepIcon = stepIcons[i];
          const done = state.step > i;
          const active = state.step === i;
          return (
            <div key={i} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                  style={{
                    background: done ? "#22c55e" : active ? selectedCBDC.color : "rgba(255,255,255,0.07)",
                    color: done || active ? "#fff" : "var(--me-text-secondary)",
                    boxShadow: active ? `0 0 14px ${selectedCBDC.color}60` : "none",
                  }}
                >
                  {done ? <CheckCircle2 size={14} /> : <StepIcon size={14} />}
                </div>
                <span className="text-xs mt-1 text-center whitespace-nowrap" style={{ color: active ? selectedCBDC.color : "var(--me-text-secondary)", fontSize: "10px" }}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1 transition-all duration-700"
                  style={{ background: done ? "#22c55e" : "rgba(255,255,255,0.07)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {state.step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--me-text-secondary)" }}>Select CBDC</label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-2.5 rounded-lg text-sm font-mono appearance-none pr-8"
                    style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                    value={state.ticker}
                    onChange={e => setState(s => ({ ...s, ticker: e.target.value }))}
                  >
                    {cbdcs.map(c => (
                      <option key={c.ticker} value={c.ticker}>{c.flag} {c.ticker} — {c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-3 pointer-events-none" style={{ color: "var(--me-text-secondary)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--me-text-secondary)" }}>Mint Amount</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg text-sm font-mono"
                  style={{ background: "var(--me-bg-secondary)", border: `1px solid ${atCap ? "#ef4444" : "var(--me-border)"}`, color: "var(--me-text-primary)" }}
                  placeholder="e.g. 50,000,000,000"
                  value={state.amount}
                  onChange={e => setState(s => ({ ...s, amount: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--me-text-secondary)" }}>Policy Justification</label>
              <textarea
                className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
                rows={3}
                style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                placeholder="Provide monetary policy justification for issuance..."
                value={state.justification}
                onChange={e => setState(s => ({ ...s, justification: e.target.value }))}
              />
            </div>
            {atCap && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <AlertTriangle size={14} style={{ color: "#ef4444" }} />
                <span className="text-xs" style={{ color: "#ef4444" }}>WARNING: This issuance would exceed 95% of the supply cap for {state.ticker}</span>
              </div>
            )}
            <button
              className="w-full py-3 rounded-lg font-bold text-sm transition-all"
              style={{
                background: state.amount && state.justification ? selectedCBDC.color : "rgba(255,255,255,0.05)",
                color: state.amount && state.justification ? "#fff" : "var(--me-text-secondary)",
                cursor: state.amount && state.justification ? "pointer" : "not-allowed",
              }}
              onClick={() => state.amount && state.justification && advance()}
            >
              Submit for Central Bank Approval →
            </button>
          </motion.div>
        )}

        {state.step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${selectedCBDC.color}40` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${selectedCBDC.color}20`, border: `2px solid ${selectedCBDC.color}60` }}>
                  <Shield size={18} style={{ color: selectedCBDC.color }} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--me-text-primary)" }}>{selectedCBDC.governor}</div>
                  <div className="text-xs" style={{ color: "var(--me-text-secondary)" }}>{selectedCBDC.issuer} — Governor</div>
                </div>
                <motion.div
                  className="ml-auto px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)" }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  AWAITING SIGNATURE
                </motion.div>
              </div>
              <div className="text-xs space-y-1.5" style={{ color: "var(--me-text-secondary)" }}>
                <div className="flex justify-between"><span>Proposed Amount:</span> <span className="font-mono font-bold" style={{ color: selectedCBDC.color }}>{formatSupply(amount)} {state.ticker}</span></div>
                <div className="flex justify-between"><span>Justification:</span> <span className="max-w-xs text-right truncate">{state.justification}</span></div>
                <div className="flex justify-between"><span>Timestamp:</span> <span className="font-mono">{new Date().toISOString().slice(0, 19)}Z</span></div>
              </div>
            </div>
            <button
              className="w-full py-3 rounded-lg font-bold text-sm transition-all"
              style={{ background: selectedCBDC.color, color: "#fff" }}
              onClick={advance}
              disabled={animating}
            >
              {animating ? "Processing Authorization..." : `Approve — ${selectedCBDC.governor}`}
            </button>
          </motion.div>
        )}

        {state.step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(34,197,94,0.4)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.5)" }}>
                  <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--me-text-primary)" }}>{selectedCBDC.governor}</div>
                  <div className="text-xs" style={{ color: "#22c55e" }}>SIGNED — Central Bank Authorization</div>
                </div>
              </div>
              <div className="text-xs font-mono p-2 rounded" style={{ background: "rgba(34,197,94,0.05)", color: "#22c55e" }}>
                SIG: 3045022100a{Math.random().toString(36).slice(2, 18).toUpperCase()}...APPROVED
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${selectedCBDC.color}40` }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${selectedCBDC.color}20`, border: `2px solid ${selectedCBDC.color}60` }}>
                  <PenLine size={18} style={{ color: selectedCBDC.color }} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--me-text-primary)" }}>{selectedCBDC.treasuryChief}</div>
                  <div className="text-xs" style={{ color: "var(--me-text-secondary)" }}>Treasury — Co-signatory</div>
                </div>
                <motion.div
                  className="ml-auto px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)" }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  AWAITING
                </motion.div>
              </div>
            </div>
            <button
              className="w-full py-3 rounded-lg font-bold text-sm transition-all"
              style={{ background: "#22c55e", color: "#fff" }}
              onClick={advance}
              disabled={animating}
            >
              {animating ? "Processing Treasury Sign-off..." : `Co-Sign — ${selectedCBDC.treasuryChief}`}
            </button>
          </motion.div>
        )}

        {state.step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: `${selectedCBDC.color}20`, border: `3px solid ${selectedCBDC.color}` }}
              animate={confirmPulse ? { boxShadow: [`0 0 0px ${selectedCBDC.color}`, `0 0 40px ${selectedCBDC.color}80`, `0 0 0px ${selectedCBDC.color}`] } : {}}
              transition={{ repeat: 3, duration: 0.8 }}
            >
              <Coins size={36} style={{ color: selectedCBDC.color }} />
            </motion.div>
            <div>
              <div className="text-lg font-bold" style={{ color: "#22c55e" }}>MINT CONFIRMED</div>
              <div className="text-sm mt-1" style={{ color: "var(--me-text-secondary)" }}>New {state.ticker} supply issued to ledger</div>
            </div>
            <motion.div
              className="text-3xl font-bold font-mono"
              style={{ color: selectedCBDC.color }}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              +{formatSupply(mintedAmount)}
            </motion.div>
            <div className="text-xs space-y-1" style={{ color: "var(--me-text-secondary)" }}>
              <div>Authorized by: {selectedCBDC.governor} &amp; {selectedCBDC.treasuryChief}</div>
              <div className="font-mono">TXID: MINT-{Date.now().toString(16).toUpperCase()}</div>
            </div>
            <button
              className="px-6 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
              onClick={reset}
            >
              Issue Another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Distribution Ledger ──────────────────────────────────────────────────────

const DISTRIBUTION_DATA = [
  { institution: "Central Banks", "USD-D": 40, "EUR-D": 35, "IDR-D": 45, "CNY-D": 50, "JPY-D": 38, "GBP-D": 42, "SAR-D": 55, "INR-D": 48 },
  { institution: "Commercial Banks", "USD-D": 30, "EUR-D": 28, "IDR-D": 25, "CNY-D": 22, "JPY-D": 30, "GBP-D": 27, "SAR-D": 20, "INR-D": 24 },
  { institution: "Digital Wallets", "USD-D": 20, "EUR-D": 22, "IDR-D": 20, "CNY-D": 18, "JPY-D": 22, "GBP-D": 18, "SAR-D": 14, "INR-D": 18 },
  { institution: "Reserve Pools", "USD-D": 10, "EUR-D": 15, "IDR-D": 10, "CNY-D": 10, "JPY-D": 10, "GBP-D": 13, "SAR-D": 11, "INR-D": 10 },
];

function DistributionLedger({ cbdcs }: { cbdcs: CBDC[] }) {
  const [filter, setFilter] = useState<string>("ALL");

  const tickers = cbdcs.map(c => c.ticker);
  const activeTickers = filter === "ALL" ? tickers : [filter];

  return (
    <div className="me-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BarChart3 size={18} style={{ color: "var(--me-gold)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--me-text-primary)" }}>Distribution Ledger</h2>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            className="px-2.5 py-1 rounded text-xs font-medium transition-all"
            style={{
              background: filter === "ALL" ? "var(--me-gold)" : "rgba(255,255,255,0.05)",
              color: filter === "ALL" ? "var(--me-bg-primary)" : "var(--me-text-secondary)",
            }}
            onClick={() => setFilter("ALL")}
          >ALL</button>
          {cbdcs.map(c => (
            <button
              key={c.ticker}
              className="px-2.5 py-1 rounded text-xs font-medium transition-all"
              style={{
                background: filter === c.ticker ? c.color : "rgba(255,255,255,0.05)",
                color: filter === c.ticker ? "#fff" : "var(--me-text-secondary)",
              }}
              onClick={() => setFilter(c.ticker)}
            >
              {c.ticker}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={DISTRIBUTION_DATA} barGap={1}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.06)" vertical={false} />
          <XAxis dataKey="institution" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip
            contentStyle={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--me-gold)" }}
          />
          {activeTickers.map(ticker => {
            const cbdc = cbdcs.find(c => c.ticker === ticker)!;
            return (
              <Bar key={ticker} dataKey={ticker} fill={cbdc.color} radius={[2, 2, 0, 0]} />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-3">
        {activeTickers.map(ticker => {
          const cbdc = cbdcs.find(c => c.ticker === ticker)!;
          return (
            <div key={ticker} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cbdc.color }} />
              <span className="text-xs" style={{ color: "var(--me-text-secondary)" }}>{ticker}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CBDC vs Physical Ratio ───────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function generateRatioData(startDigital: number, growthRate: number) {
  return MONTHS.map((month, i) => {
    const digital = Math.min(startDigital + i * growthRate + Math.random() * 3, 99);
    return { month, digital: parseFloat(digital.toFixed(1)), physical: parseFloat((100 - digital).toFixed(1)) };
  });
}

const RATIO_DATA: Record<string, ReturnType<typeof generateRatioData>> = {
  "USD-D": generateRatioData(28, 0.7),
  "EUR-D": generateRatioData(22, 0.8),
  "IDR-D": generateRatioData(12, 0.9),
  "CNY-D": generateRatioData(55, 1.2),
  "JPY-D": generateRatioData(35, 0.9),
  "GBP-D": generateRatioData(18, 0.6),
  "SAR-D": generateRatioData(9, 0.5),
  "INR-D": generateRatioData(11, 0.8),
};

function RatioTracker({ cbdcs }: { cbdcs: CBDC[] }) {
  const [selected, setSelected] = useState("CNY-D");
  const data = RATIO_DATA[selected];
  const cbdc = cbdcs.find(c => c.ticker === selected)!;
  const tippingPoint = data.findIndex(d => d.digital >= 50);

  return (
    <div className="me-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp size={18} style={{ color: "var(--me-gold)" }} />
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--me-text-primary)" }}>CBDC vs Physical Ratio</h2>
            <p className="text-xs" style={{ color: "var(--me-text-secondary)" }}>12-month adoption trajectory</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {cbdcs.map(c => (
            <button
              key={c.ticker}
              className="px-2.5 py-1 rounded text-xs font-medium transition-all"
              style={{
                background: selected === c.ticker ? c.color : "rgba(255,255,255,0.05)",
                color: selected === c.ticker ? "#fff" : "var(--me-text-secondary)",
              }}
              onClick={() => setSelected(c.ticker)}
            >
              {c.ticker}
            </button>
          ))}
        </div>
      </div>

      {tippingPoint >= 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <Zap size={12} style={{ color: "#22c55e" }} />
          <span className="text-xs" style={{ color: "#22c55e" }}>
            CBDC adoption exceeds 50% tipping point in <strong>{MONTHS[tippingPoint]}</strong>
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.06)" />
          <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--me-gold)" }}
          />
          <Line type="monotone" dataKey="digital" name="Digital CBDC" stroke={cbdc.color} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="physical" name="Physical Fiat" stroke="rgba(148,163,184,0.5)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 rounded" style={{ background: cbdc.color }} />
          <span className="text-xs" style={{ color: "var(--me-text-secondary)" }}>Digital {cbdc.ticker}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 rounded" style={{ background: "rgba(148,163,184,0.5)", borderTop: "1px dashed rgba(148,163,184,0.5)" }} />
          <span className="text-xs" style={{ color: "var(--me-text-secondary)" }}>Physical Fiat</span>
        </div>
        {tippingPoint >= 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
            <span className="text-xs" style={{ color: "#22c55e" }}>50% Tipping Point</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cross-Border Atomic Swap Panel ──────────────────────────────────────────

interface CrossBorderSwap {
  id: string;
  fromTicker: string;
  fromNation: string;
  fromFlag: string;
  toTicker: string;
  toNation: string;
  toFlag: string;
  amount: number;
  rate: number;
  status: "INITIATING" | "QUANTUM-LOCKED" | "SETTLED";
  ts: number;
}

const SWAP_TEMPLATES = [
  { fromTicker: "USD-D", fromNation: "United States", fromFlag: "🇺🇸", toTicker: "EUR-D", toNation: "Eurozone", toFlag: "🇪🇺", rate: 0.924 },
  { fromTicker: "CNY-D", fromNation: "China", fromFlag: "🇨🇳", toTicker: "JPY-D", toNation: "Japan", toFlag: "🇯🇵", rate: 21.42 },
  { fromTicker: "GBP-D", fromNation: "United Kingdom", fromFlag: "🇬🇧", toTicker: "USD-D", toNation: "United States", toFlag: "🇺🇸", rate: 1.267 },
  { fromTicker: "INR-D", fromNation: "India", fromFlag: "🇮🇳", toTicker: "SAR-D", toNation: "Saudi Arabia", toFlag: "🇸🇦", rate: 0.044 },
  { fromTicker: "EUR-D", fromNation: "Eurozone", fromFlag: "🇪🇺", toTicker: "GBP-D", toNation: "United Kingdom", toFlag: "🇬🇧", rate: 0.859 },
  { fromTicker: "IDR-D", fromNation: "Indonesia", fromFlag: "🇮🇩", toTicker: "CNY-D", toNation: "China", toFlag: "🇨🇳", rate: 0.00045 },
  { fromTicker: "JPY-D", fromNation: "Japan", fromFlag: "🇯🇵", toTicker: "USD-D", toNation: "United States", toFlag: "🇺🇸", rate: 0.0067 },
  { fromTicker: "SAR-D", fromNation: "Saudi Arabia", fromFlag: "🇸🇦", toTicker: "EUR-D", toNation: "Eurozone", toFlag: "🇪🇺", rate: 0.246 },
];

function genSwap(): CrossBorderSwap {
  const tpl = SWAP_TEMPLATES[Math.floor(Math.random() * SWAP_TEMPLATES.length)];
  return {
    id: Math.random().toString(36).slice(2, 10).toUpperCase(),
    ...tpl,
    amount: Math.round(10_000_000 + Math.random() * 990_000_000),
    status: "INITIATING",
    ts: Date.now(),
  };
}

function CrossBorderPanel({ cbdcs }: { cbdcs: CBDC[] }) {
  const [swaps, setSwaps] = useState<CrossBorderSwap[]>(() => Array.from({ length: 6 }, genSwap).map((s, i) => ({
    ...s,
    status: (["INITIATING", "QUANTUM-LOCKED", "SETTLED", "SETTLED", "QUANTUM-LOCKED", "INITIATING"] as const)[i],
  })));
  const [settled, setSettled] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setSwaps(prev => {
        const updated = prev.map(s => {
          if (s.status === "INITIATING") return { ...s, status: "QUANTUM-LOCKED" as const };
          if (s.status === "QUANTUM-LOCKED") return { ...s, status: "SETTLED" as const };
          return s;
        });
        const newSwap = genSwap();
        return [newSwap, ...updated.slice(0, 7)];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    swaps.forEach(s => {
      if (s.status === "SETTLED" && !settled.has(s.id)) {
        setSettled(prev => new Set([...prev, s.id]));
        setTimeout(() => setSettled(prev => {
          const n = new Set(prev);
          n.delete(s.id);
          return n;
        }), 1500);
      }
    });
  }, [swaps]);

  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    "INITIATING": { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "INITIATING" },
    "QUANTUM-LOCKED": { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6", label: "QUANTUM-LOCKED" },
    "SETTLED": { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "SETTLED" },
  };

  return (
    <div className="me-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <ArrowRightLeft size={18} style={{ color: "var(--me-gold)" }} />
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--me-text-primary)" }}>Cross-Border CBDC Atomic Swaps</h2>
          <p className="text-xs" style={{ color: "var(--me-text-secondary)" }}>Live atomic swap settlement layer — updates every 4s</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono" style={{ background: "rgba(59,130,246,0.1)", color: "var(--me-blue)" }}>
          <div className="w-1.5 h-1.5 rounded-full animate-me-pulse" style={{ background: "var(--me-blue)" }} />
          LIVE
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--me-border)" }}>
              {["SWAP ID", "FROM", "TO", "AMOUNT", "RATE", "STATUS"].map(h => (
                <th key={h} className="text-left py-2 pr-4 font-semibold uppercase tracking-wider" style={{ color: "var(--me-text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {swaps.map(swap => {
                const fromCbdc = cbdcs.find(c => c.ticker === swap.fromTicker)!;
                const toCbdc = cbdcs.find(c => c.ticker === swap.toTicker)!;
                const st = statusStyle[swap.status];
                const isFlashing = swap.status === "SETTLED" && settled.has(swap.id);
                return (
                  <motion.tr
                    key={swap.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0, background: isFlashing ? "rgba(34,197,94,0.08)" : "transparent" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <td className="py-2.5 pr-4 font-mono" style={{ color: "var(--me-text-secondary)" }}>{swap.id}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span>{swap.fromFlag}</span>
                        <span className="font-bold font-mono" style={{ color: fromCbdc?.color ?? "#fff" }}>{swap.fromTicker}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span>{swap.toFlag}</span>
                        <span className="font-bold font-mono" style={{ color: toCbdc?.color ?? "#fff" }}>{swap.toTicker}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 font-mono font-bold" style={{ color: "var(--me-text-primary)" }}>{formatSupply(swap.amount)}</td>
                    <td className="py-2.5 pr-4 font-mono" style={{ color: "var(--me-text-secondary)" }}>{swap.rate.toFixed(4)}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}>
                        {st.label}
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
  );
}

// ─── Burn Interface ───────────────────────────────────────────────────────────

function BurnInterface({ cbdcs }: { cbdcs: CBDC[] }) {
  const [ticker, setTicker] = useState("USD-D");
  const [amount, setAmount] = useState("");
  const [burning, setBurning] = useState(false);
  const [burned, setBurned] = useState(false);
  const [totalBurnedToday] = useState(Math.round(Math.random() * 80_000_000_000 + 20_000_000_000));
  const selectedCBDC = cbdcs.find(c => c.ticker === ticker)!;
  const burnAmount = Number(amount.replace(/,/g, "")) || 0;
  const supplyImpact = burnAmount > 0 ? ((burnAmount / selectedCBDC.supply) * 100).toFixed(4) : "0.0000";

  const handleBurn = () => {
    if (!burnAmount) return;
    setBurning(true);
    setTimeout(() => {
      setBurning(false);
      setBurned(true);
      setTimeout(() => setBurned(false), 3500);
    }, 1800);
  };

  return (
    <div className="me-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <Flame size={18} style={{ color: "#ef4444" }} />
        <h2 className="text-base font-bold" style={{ color: "var(--me-text-primary)" }}>Supply Retirement / Burn</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--me-text-secondary)" }}>Select CBDC</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2.5 rounded-lg text-sm font-mono appearance-none pr-8"
              style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
              value={ticker}
              onChange={e => { setTicker(e.target.value); setAmount(""); setBurned(false); }}
            >
              {cbdcs.map(c => <option key={c.ticker} value={c.ticker}>{c.flag} {c.ticker}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-3 pointer-events-none" style={{ color: "var(--me-text-secondary)" }} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--me-text-secondary)" }}>Retirement Amount</label>
          <input
            className="w-full px-3 py-2.5 rounded-lg text-sm font-mono"
            style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
            placeholder="Amount to retire..."
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg p-3 text-center" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--me-text-secondary)" }}>Burned Today</div>
          <div className="text-sm font-bold font-mono" style={{ color: "#ef4444" }}>{formatSupply(totalBurnedToday)}</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--me-border)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--me-text-secondary)" }}>Circulating Supply</div>
          <div className="text-sm font-bold font-mono" style={{ color: selectedCBDC.color }}>{formatSupply(selectedCBDC.supply)}</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--me-border)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--me-text-secondary)" }}>Supply Impact</div>
          <div className="text-sm font-bold font-mono" style={{ color: burnAmount > 0 ? "#f59e0b" : "var(--me-text-secondary)" }}>-{supplyImpact}%</div>
        </div>
      </div>

      <AnimatePresence>
        {burning && (
          <motion.div
            key="burning"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <motion.div
              className="text-6xl mb-3 inline-block"
              animate={{ scale: [1, 1.2, 0.9, 1.1, 1], rotate: [-5, 5, -3, 3, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            >
              🔥
            </motion.div>
            <div className="text-sm font-bold" style={{ color: "#ef4444" }}>BURNING {formatSupply(burnAmount)} {ticker}...</div>
            <div className="mt-2">
              <motion.div
                className="h-1 rounded-full mx-auto"
                style={{ background: "#ef4444", width: "60%" }}
                animate={{ scaleX: [0, 1] }}
                transition={{ duration: 1.8 }}
              />
            </div>
          </motion.div>
        )}
        {burned && !burning && (
          <motion.div
            key="burned"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-6 rounded-xl mb-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-bold" style={{ color: "#ef4444" }}>RETIREMENT CONFIRMED</div>
            <div className="text-sm mt-1 font-mono" style={{ color: "var(--me-text-secondary)" }}>
              {formatSupply(burnAmount)} {ticker} permanently removed from circulation
            </div>
            <div className="text-xs mt-1.5 font-mono" style={{ color: "rgba(148,163,184,0.6)" }}>
              BURN-{Date.now().toString(16).toUpperCase()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!burning && !burned && (
        <button
          className="w-full py-3 rounded-lg font-bold text-sm transition-all"
          style={{
            background: burnAmount > 0 ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
            border: burnAmount > 0 ? "1px solid rgba(239,68,68,0.5)" : "1px solid var(--me-border)",
            color: burnAmount > 0 ? "#ef4444" : "var(--me-text-secondary)",
            cursor: burnAmount > 0 ? "pointer" : "not-allowed",
          }}
          onClick={handleBurn}
        >
          <Flame size={14} className="inline mr-2" />
          Initiate Retirement Burn
        </button>
      )}
    </div>
  );
}

// ─── Supply Analytics ─────────────────────────────────────────────────────────

function SupplyAnalytics({ cbdcs }: { cbdcs: CBDC[] }) {
  const totalCBDC = cbdcs.reduce((sum, c) => sum + (c.supply / 1e12), 0); // normalized in trillions USD equivalent
  const totalPhysical = 94_500; // rough physical fiat in trillions
  const totalCBDCT = Math.round(totalCBDC * 100) / 100;
  const pctDigitized = ((totalCBDCT / (totalCBDCT + totalPhysical)) * 100).toFixed(2);

  const treeData = cbdcs.map(c => ({
    name: c.ticker,
    value: Math.round(c.supply / 1e9), // in billions
    color: c.color,
  }));

  return (
    <div className="me-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <Activity size={18} style={{ color: "var(--me-gold)" }} />
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--me-text-primary)" }}>Global CBDC Supply Analytics</h2>
          <p className="text-xs" style={{ color: "var(--me-text-secondary)" }}>Combined digital vs physical sovereign supply</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl p-4 text-center" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: "var(--me-text-secondary)" }}>Total CBDC Supply</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "var(--me-blue)" }}>${totalCBDCT.toFixed(0)}T</div>
          <div className="text-xs mt-1" style={{ color: "var(--me-text-secondary)" }}>across 8 currencies</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "rgba(148,163,184,0.05)", border: "1px solid rgba(148,163,184,0.15)" }}>
          <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: "var(--me-text-secondary)" }}>Physical Fiat in System</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "var(--me-text-primary)" }}>${(totalPhysical / 1000).toFixed(0)}T</div>
          <div className="text-xs mt-1" style={{ color: "var(--me-text-secondary)" }}>global sovereign supply</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "rgba(212,160,23,0.07)", border: "1px solid rgba(212,160,23,0.25)" }}>
          <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: "var(--me-text-secondary)" }}>% Digitized</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "var(--me-gold)" }}>{pctDigitized}%</div>
          <div className="text-xs mt-1" style={{ color: "var(--me-text-secondary)" }}>sovereign monetary supply</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--me-text-secondary)" }}>CBDC Supply Distribution (Billions USD-equiv)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={treeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}B`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                contentStyle={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "var(--me-gold)" }}
                formatter={(v: number) => [`$${v.toLocaleString()}B`, "Supply"]}
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {treeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--me-text-secondary)" }}>Per-CBDC Metrics</div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {cbdcs.map(c => (
              <div key={c.ticker} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="text-base">{c.flag}</span>
                <span className="text-xs font-bold font-mono w-14" style={{ color: c.color }}>{c.ticker}</span>
                <div className="flex-1">
                  <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${Math.min((c.supply / c.supplyMax) * 100, 100)}%`, background: c.color }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono w-20 text-right" style={{ color: "var(--me-text-secondary)" }}>{formatSupply(c.supply)}</span>
                <span className="text-xs font-bold w-12 text-right" style={{ color: c.adoptionRate > 50 ? "#22c55e" : c.color }}>{c.adoptionRate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CBDCPage() {
  const [liveSupplies, setLiveSupplies] = useState<Record<string, number>>(
    Object.fromEntries(CBDCS.map(c => [c.ticker, c.supply]))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSupplies(prev => {
        const next = { ...prev };
        CBDCS.forEach(c => {
          const delta = Math.round((Math.random() - 0.48) * c.velocity * 1000);
          next[c.ticker] = Math.max(0, Math.min(c.supplyMax, prev[c.ticker] + delta));
        });
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <Header title="CBDC Issuance & Lifecycle Management" subtitle="Sovereign Digital Currency Command Center" />

      <div className="flex-1 p-6 space-y-6">
        {/* 1. CBDC Fleet Overview */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe2 size={16} style={{ color: "var(--me-gold)" }} />
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--me-gold)" }}>CBDC Fleet Overview</h2>
            <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded text-xs font-mono" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
              <div className="w-1.5 h-1.5 rounded-full animate-me-pulse" style={{ background: "#22c55e" }} />
              8 CURRENCIES LIVE
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
            {CBDCS.map(cbdc => (
              <CBDCCard key={cbdc.ticker} cbdc={cbdc} liveSupply={liveSupplies[cbdc.ticker]} />
            ))}
          </div>
        </section>

        {/* 2. Minting Interface */}
        <MintingInterface cbdcs={CBDCS} />

        {/* 3. Distribution Ledger */}
        <DistributionLedger cbdcs={CBDCS} />

        {/* 4. CBDC vs Physical Ratio Tracker */}
        <RatioTracker cbdcs={CBDCS} />

        {/* 5. Cross-Border Atomic Swap Panel */}
        <CrossBorderPanel cbdcs={CBDCS} />

        {/* 6. Retirement / Burn Interface */}
        <BurnInterface cbdcs={CBDCS} />

        {/* 7. Supply Analytics */}
        <SupplyAnalytics cbdcs={CBDCS} />
      </div>
    </AppLayout>
  );
}
