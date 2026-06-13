import { useState, useEffect } from "react";
import { Send, Plus, ArrowRight, CheckCircle, Clock, Zap, Globe2, Building2, RefreshCw, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";
import { useConfigurables } from "~/modules/configurables";

type TransferStatus = "PENDING" | "PROCESSING" | "SETTLED" | "FAILED";

interface Transfer {
  id: string;
  sender: string;
  senderCountry: string;
  recipient: string;
  recipientCountry: string;
  amount: number;
  currency: string;
  toCurrency: string;
  status: TransferStatus;
  initiatedAt: string;
  settledAt?: string;
  duration?: number;
}

const INSTITUTIONS = [
  { name: "Federal Reserve Bank", country: "USA" },
  { name: "European Central Bank", country: "EU" },
  { name: "Bank of England", country: "UK" },
  { name: "Bank of Japan", country: "JP" },
  { name: "People's Bank of China", country: "CN" },
  { name: "Reserve Bank of India", country: "IN" },
  { name: "Swiss National Bank", country: "CH" },
  { name: "Bank of Canada", country: "CA" },
  { name: "Bundesbank", country: "DE" },
  { name: "Banque de France", country: "FR" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "CHF", "INR", "CAD"];

function randomInstitution(exclude?: string) {
  const pool = INSTITUTIONS.filter((i) => i.name !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateTransfers(count = 12): Transfer[] {
  const statuses: TransferStatus[] = ["SETTLED", "SETTLED", "SETTLED", "PROCESSING", "PENDING", "SETTLED", "FAILED", "SETTLED"];
  return Array.from({ length: count }, (_, i) => {
    const sender = randomInstitution();
    const recipient = randomInstitution(sender.name);
    const status = statuses[i % statuses.length];
    const amount = Math.round(Math.random() * 4900 + 100) * 1_000_000;
    const currency = CURRENCIES[i % CURRENCIES.length];
    const toCurrency = CURRENCIES[(i + 2) % CURRENCIES.length];
    const initiatedAt = new Date(Date.now() - (i + 1) * 420000).toISOString().slice(11, 19);
    const duration = status === "SETTLED" ? parseFloat((0.1 + Math.random() * 2.5).toFixed(2)) : undefined;
    return {
      id: `ME-${String(100000 + i).slice(1)}`,
      sender: sender.name,
      senderCountry: sender.country,
      recipient: recipient.name,
      recipientCountry: recipient.country,
      amount,
      currency,
      toCurrency,
      status,
      initiatedAt,
      settledAt: status === "SETTLED" ? new Date(Date.now() - i * 300000).toISOString().slice(11, 19) : undefined,
      duration,
    };
  });
}

function generateVolumeData() {
  return Array.from({ length: 12 }, (_, i) => ({
    hour: `${String(i * 2).padStart(2, "0")}:00`,
    volume: Math.round(1.2 + Math.random() * 3.8) * 1_000_000_000,
    settled: Math.round(0.8 + Math.random() * 3) * 1_000_000_000,
  }));
}

const STATUS_CONFIG: Record<TransferStatus, { label: string; className: string; Icon: React.ComponentType<any> }> = {
  PENDING: { label: "PENDING", className: "status-pending", Icon: Clock },
  PROCESSING: { label: "PROCESSING", className: "status-processing", Icon: RefreshCw },
  SETTLED: { label: "SETTLED", className: "status-settled", Icon: CheckCircle },
  FAILED: { label: "FAILED", className: "status-blacklisted", Icon: Zap },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--me-gold)" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: ${(p.value / 1_000_000_000).toFixed(2)}B
        </p>
      ))}
    </div>
  );
};

interface NewTransferForm {
  sender: string;
  recipient: string;
  amount: string;
  currency: string;
  toCurrency: string;
}

export default function BankingProtocol() {
  const { config, loading } = useConfigurables();
  const title = loading ? "Inter-Operable Banking Protocol" : (config?.bankingProtocolTitle ?? "Inter-Operable Banking Protocol");

  const [transfers, setTransfers] = useState<Transfer[]>(() => generateTransfers(12));
  const [volumeData] = useState(generateVolumeData);
  const [statusFilter, setStatusFilter] = useState<TransferStatus | "ALL">("ALL");
  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [form, setForm] = useState<NewTransferForm>({
    sender: INSTITUTIONS[0].name,
    recipient: INSTITUTIONS[1].name,
    amount: "",
    currency: "USD",
    toCurrency: "EUR",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulate live status transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setTransfers((prev) =>
        prev.map((t) => {
          if (t.status === "PROCESSING" && Math.random() > 0.5) {
            return {
              ...t,
              status: "SETTLED",
              settledAt: new Date().toISOString().slice(11, 19),
              duration: parseFloat((0.1 + Math.random() * 2).toFixed(2)),
            };
          }
          if (t.status === "PENDING" && Math.random() > 0.7) {
            return { ...t, status: "PROCESSING" };
          }
          return t;
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = statusFilter === "ALL" ? transfers : transfers.filter((t) => t.status === statusFilter);

  const totalSettled = transfers.filter((t) => t.status === "SETTLED").reduce((s, t) => s + t.amount, 0);
  const totalPending = transfers.filter((t) => t.status === "PENDING" || t.status === "PROCESSING").reduce((s, t) => s + t.amount, 0);
  const avgDuration =
    transfers.filter((t) => t.duration).reduce((s, t) => s + (t.duration ?? 0), 0) /
    Math.max(1, transfers.filter((t) => t.duration).length);

  async function handleSubmit() {
    if (!form.amount || !form.sender || !form.recipient) return;
    setIsSubmitting(true);
    const senderInst = INSTITUTIONS.find((i) => i.name === form.sender) ?? INSTITUTIONS[0];
    const recipientInst = INSTITUTIONS.find((i) => i.name === form.recipient) ?? INSTITUTIONS[1];
    const newTransfer: Transfer = {
      id: `ME-${String(100000 + Date.now() % 99999).slice(1)}`,
      sender: senderInst.name,
      senderCountry: senderInst.country,
      recipient: recipientInst.name,
      recipientCountry: recipientInst.country,
      amount: parseFloat(form.amount) * 1_000_000,
      currency: form.currency,
      toCurrency: form.toCurrency,
      status: "PENDING",
      initiatedAt: new Date().toISOString().slice(11, 19),
    };
    await new Promise((r) => setTimeout(r, 1000));
    setTransfers((prev) => [newTransfer, ...prev]);
    setIsSubmitting(false);
    setShowNewTransfer(false);
    setForm({ sender: INSTITUTIONS[0].name, recipient: INSTITUTIONS[1].name, amount: "", currency: "USD", toCurrency: "EUR" });
  }

  return (
    <AppLayout>
      <Header title={title} subtitle="Atomic Cross-Border Settlements — No SWIFT Dependency" />

      <div className="flex-1 p-6 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Settled Volume", value: `$${(totalSettled / 1_000_000_000).toFixed(2)}B`, color: "var(--me-success)" },
            { label: "Pending Value", value: `$${(totalPending / 1_000_000_000).toFixed(2)}B`, color: "var(--me-warning)" },
            { label: "Avg Settlement", value: `${avgDuration.toFixed(2)}s`, color: "var(--me-blue)" },
            { label: "SWIFT Replaced", value: "100%", color: "var(--me-gold)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="me-card px-4 py-3">
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--me-text-secondary)" }}>
                {label}
              </div>
              <div className="text-xl font-bold font-mono" style={{ color }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Volume Chart */}
          <div className="me-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
                  Settlement Volume — 24h
                </h3>
                <p className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                  Initiated vs Settled (USD equivalent)
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a017" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="settleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.07)" />
                <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1e9).toFixed(1)}B`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="volume" name="Initiated" stroke="#d4a017" strokeWidth={1.5} fill="url(#volGrad)" />
                <Area type="monotone" dataKey="settled" name="Settled" stroke="#10b981" strokeWidth={1.5} fill="url(#settleGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* No-SWIFT card */}
          <div className="me-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} style={{ color: "var(--me-gold)" }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--me-gold)" }}>
                  Atomic Protocol
                </h3>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--me-text-secondary)" }}>
                Money Elysium's Inter-Operable Banking Protocol replaces SWIFT with atomic, near-instant cross-border settlements — sovereign-grade security, zero correspondent bank dependency.
              </p>
            </div>
            <div className="space-y-2">
              {[
                { label: "Settlement time", old: "2–5 days", new: "< 3 seconds" },
                { label: "Fees", old: "0.5–2%", new: "0.001%" },
                { label: "Transparency", old: "Opaque", new: "Full audit trail" },
              ].map(({ label, old: oldVal, new: newVal }) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-xs px-3 py-2 rounded"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <span style={{ color: "var(--me-text-secondary)" }}>{label}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--me-danger)", textDecoration: "line-through" }}>{oldVal}</span>
                    <ArrowRight size={10} style={{ color: "var(--me-text-secondary)" }} />
                    <span style={{ color: "var(--me-success)" }}>{newVal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transfers Table */}
        <div className="me-card">
          {/* Table Controls */}
          <div
            className="flex items-center gap-3 px-5 py-4 border-b"
            style={{ borderColor: "var(--me-border)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--me-text-primary)" }}>
              Transfer Ledger
            </h3>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg ml-2"
              style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)" }}
            >
              <Filter size={12} style={{ color: "var(--me-text-secondary)" }} />
              <select
                className="bg-transparent text-xs outline-none cursor-pointer"
                style={{ color: "var(--me-text-primary)" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TransferStatus | "ALL")}
              >
                <option value="ALL" style={{ background: "#111936" }}>All Status</option>
                <option value="PENDING" style={{ background: "#111936" }}>Pending</option>
                <option value="PROCESSING" style={{ background: "#111936" }}>Processing</option>
                <option value="SETTLED" style={{ background: "#111936" }}>Settled</option>
                <option value="FAILED" style={{ background: "#111936" }}>Failed</option>
              </select>
            </div>
            <button
              onClick={() => setShowNewTransfer(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: "var(--me-gold)",
                color: "var(--me-bg-primary)",
                boxShadow: "0 0 12px rgba(212,160,23,0.25)",
              }}
            >
              <Plus size={13} />
              New Transfer
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--me-bg-secondary)", borderBottom: "1px solid var(--me-border)" }}>
                  {["TX ID", "Sender Institution", "→", "Recipient Institution", "Amount", "Pair", "Status", "Time", "Duration"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
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
                    const cfg = STATUS_CONFIG[t.status];
                    const StatusIcon = cfg.Icon;
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="transition-colors duration-200"
                        style={{
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                          borderBottom: "1px solid rgba(212,160,23,0.05)",
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--me-blue)" }}>
                          {t.id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={11} style={{ color: "var(--me-text-secondary)" }} />
                            <div>
                              <div className="text-xs font-medium" style={{ color: "var(--me-text-primary)" }}>
                                {t.sender}
                              </div>
                              <div className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                                {t.senderCountry}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <ArrowRight size={12} style={{ color: "var(--me-gold)" }} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Globe2 size={11} style={{ color: "var(--me-text-secondary)" }} />
                            <div>
                              <div className="text-xs font-medium" style={{ color: "var(--me-text-primary)" }}>
                                {t.recipient}
                              </div>
                              <div className="text-xs" style={{ color: "var(--me-text-secondary)" }}>
                                {t.recipientCountry}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: "var(--me-gold)" }}>
                          ${(t.amount / 1_000_000).toFixed(0)}M
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--me-blue)" }}>
                          {t.currency}/{t.toCurrency}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit ${cfg.className}`}>
                            <StatusIcon
                              size={10}
                              className={t.status === "PROCESSING" ? "animate-spin" : ""}
                            />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--me-text-secondary)" }}>
                          {t.initiatedAt}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: t.duration ? "var(--me-success)" : "var(--me-text-secondary)" }}>
                          {t.duration ? `${t.duration}s` : "—"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          <div
            className="px-5 py-3 flex items-center justify-between text-xs"
            style={{ borderTop: "1px solid var(--me-border)", color: "var(--me-text-secondary)" }}
          >
            <span>Showing {filtered.length} of {transfers.length} transfers</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-me-pulse" style={{ background: "var(--me-success)" }} />
              <span>Live settlement updates every 3s</span>
            </div>
          </div>
        </div>

        {/* New Transfer Modal */}
        <AnimatePresence>
          {showNewTransfer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.7)" }}
              onClick={() => setShowNewTransfer(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="me-card p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
                style={{ boxShadow: "0 0 40px rgba(212,160,23,0.2)" }}
              >
                <h3 className="text-base font-bold mb-4" style={{ color: "var(--me-gold)" }}>
                  Initiate Atomic Transfer
                </h3>

                <div className="space-y-4">
                  {/* Sender */}
                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: "var(--me-text-secondary)" }}>
                      Sender Institution
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                      value={form.sender}
                      onChange={(e) => setForm((f) => ({ ...f, sender: e.target.value }))}
                    >
                      {INSTITUTIONS.map((i) => (
                        <option key={i.name} value={i.name} style={{ background: "#0d1435" }}>
                          {i.name} ({i.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: "var(--me-text-secondary)" }}>
                      Recipient Institution
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                      value={form.recipient}
                      onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
                    >
                      {INSTITUTIONS.map((i) => (
                        <option key={i.name} value={i.name} style={{ background: "#0d1435" }}>
                          {i.name} ({i.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount + Currency Pair */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: "var(--me-text-secondary)" }}>
                        Amount (Millions)
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
                        From
                      </label>
                      <select
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                        value={form.currency}
                        onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c} style={{ background: "#0d1435" }}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider block mb-1" style={{ color: "var(--me-text-secondary)" }}>
                      To Currency
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-primary)" }}
                      value={form.toCurrency}
                      onChange={(e) => setForm((f) => ({ ...f, toCurrency: e.target.value }))}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c} style={{ background: "#0d1435" }}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setShowNewTransfer(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm"
                    style={{ background: "var(--me-bg-secondary)", border: "1px solid var(--me-border)", color: "var(--me-text-secondary)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!form.amount || isSubmitting}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    style={{
                      background: "var(--me-gold)",
                      color: "var(--me-bg-primary)",
                      boxShadow: "0 0 16px rgba(212,160,23,0.3)",
                    }}
                  >
                    <Send size={14} />
                    {isSubmitting ? "Initiating..." : "Initiate Transfer"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
