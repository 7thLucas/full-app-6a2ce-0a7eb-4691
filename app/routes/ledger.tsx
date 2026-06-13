import { useState, useEffect } from "react";
import { Search, Filter, AlertTriangle, ChevronDown, RefreshCw, Download } from "lucide-react";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";
import { useConfigurables } from "~/modules/configurables";

type LedgerStatus = "IN_CIRCULATION" | "DESTROYED" | "FLAGGED" | "DOUBLE_SPEND";

interface LedgerEntry {
  id: string;
  batchId: string;
  serialId: string;
  denomination: string;
  currency: string;
  status: LedgerStatus;
  issuingAuthority: string;
  issuedAt: string;
  lastSeen: string;
  amount: number;
  isAlert?: boolean;
}

function randomSerial() {
  return (
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    Math.floor(Math.random() * 9000000 + 1000000)
  );
}

function randomBatch() {
  return "BTCH-" + Math.floor(Math.random() * 90000 + 10000) + "-" + ["USD", "EUR", "GBP", "JPY", "CNY"][Math.floor(Math.random() * 5)];
}

const AUTHORITIES = [
  "Federal Reserve",
  "European Central Bank",
  "Bank of England",
  "Bank of Japan",
  "People's Bank of China",
  "Reserve Bank of India",
  "Swiss National Bank",
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "CHF", "INR"];
const DENOMS = ["$100", "$50", "$20", "€100", "€50", "£50", "£20", "¥10000"];

function generateLedger(count = 40): LedgerEntry[] {
  const statuses: LedgerStatus[] = ["IN_CIRCULATION", "IN_CIRCULATION", "IN_CIRCULATION", "DESTROYED", "FLAGGED", "DOUBLE_SPEND"];
  return Array.from({ length: count }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const isAlert = status === "DOUBLE_SPEND" || status === "FLAGGED";
    return {
      id: String(i + 1).padStart(6, "0"),
      batchId: randomBatch(),
      serialId: randomSerial(),
      denomination: DENOMS[Math.floor(Math.random() * DENOMS.length)],
      currency: CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)],
      status,
      issuingAuthority: AUTHORITIES[Math.floor(Math.random() * AUTHORITIES.length)],
      issuedAt: new Date(Date.now() - Math.random() * 1e10).toISOString().slice(0, 19) + "Z",
      lastSeen: new Date(Date.now() - Math.random() * 1e8).toISOString().slice(0, 19) + "Z",
      amount: Math.round(Math.random() * 900 + 100) * 100,
      isAlert,
    };
  });
}

const STATUS_CONFIG: Record<LedgerStatus, { label: string; className: string }> = {
  IN_CIRCULATION: { label: "IN CIRCULATION", className: "status-verified" },
  DESTROYED: { label: "DESTROYED", className: "status-blacklisted" },
  FLAGGED: { label: "FLAGGED", className: "status-flagged" },
  DOUBLE_SPEND: { label: "DOUBLE SPEND", className: "status-blacklisted" },
};

export default function SovereignLedger() {
  const { config, loading } = useConfigurables();
  const title = loading ? "Sovereign Currency Ledger" : (config?.ledgerTitle ?? "Sovereign Currency Ledger");

  const [entries] = useState(() => generateLedger(40));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LedgerStatus | "ALL">("ALL");
  const [newAlerts, setNewAlerts] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = entries.filter((e) => {
    const matchesSearch =
      !search ||
      e.serialId.toLowerCase().includes(search.toLowerCase()) ||
      e.batchId.toLowerCase().includes(search.toLowerCase()) ||
      e.issuingAuthority.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNewAlerts((n) => n + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  function handleRefresh() {
    setIsRefreshing(true);
    setNewAlerts(0);
    setTimeout(() => setIsRefreshing(false), 1200);
  }

  const alertCount = entries.filter((e) => e.isAlert).length;

  return (
    <AppLayout>
      <Header title={title} subtitle="Immutable Fiat Unit Lifecycle Tracking" />

      <div className="flex-1 p-6 space-y-4">
        {/* Alert Banner */}
        {(alertCount > 0 || newAlerts > 0) && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg animate-me-red-glow"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <AlertTriangle size={16} style={{ color: "var(--me-danger)" }} className="flex-shrink-0" />
            <span className="text-sm font-medium" style={{ color: "var(--me-danger)" }}>
              {alertCount} double-spend / flagged entries detected in current view
              {newAlerts > 0 && ` — ${newAlerts} new anomalies since last sync`}
            </span>
            <button
              onClick={handleRefresh}
              className="ml-auto text-xs px-2 py-1 rounded"
              style={{ background: "rgba(239,68,68,0.15)", color: "var(--me-danger)" }}
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div
            className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg"
            style={{ background: "var(--me-bg-card)", border: "1px solid var(--me-border)" }}
          >
            <Search size={14} style={{ color: "var(--me-text-secondary)" }} />
            <input
              type="text"
              placeholder="Search serial ID, batch, or authority..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--me-text-primary)" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
            style={{ background: "var(--me-bg-card)", border: "1px solid var(--me-border)" }}
          >
            <Filter size={14} style={{ color: "var(--me-text-secondary)" }} />
            <select
              className="bg-transparent text-sm outline-none cursor-pointer"
              style={{ color: "var(--me-text-primary)" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LedgerStatus | "ALL")}
            >
              <option value="ALL" style={{ background: "#111936" }}>All Status</option>
              <option value="IN_CIRCULATION" style={{ background: "#111936" }}>In Circulation</option>
              <option value="DESTROYED" style={{ background: "#111936" }}>Destroyed</option>
              <option value="FLAGGED" style={{ background: "#111936" }}>Flagged</option>
              <option value="DOUBLE_SPEND" style={{ background: "#111936" }}>Double Spend</option>
            </select>
            <ChevronDown size={12} style={{ color: "var(--me-text-secondary)" }} />
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              background: "var(--me-bg-card)",
              border: "1px solid var(--me-border)",
              color: "var(--me-gold)",
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Sync
          </button>

          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              background: "rgba(212,160,23,0.1)",
              border: "1px solid rgba(212,160,23,0.3)",
              color: "var(--me-gold)",
            }}
          >
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Entries", value: entries.length, color: "var(--me-blue)" },
            { label: "In Circulation", value: entries.filter((e) => e.status === "IN_CIRCULATION").length, color: "var(--me-success)" },
            { label: "Destroyed", value: entries.filter((e) => e.status === "DESTROYED").length, color: "var(--me-text-secondary)" },
            { label: "Alerts", value: entries.filter((e) => e.isAlert).length, color: "var(--me-danger)" },
          ].map((stat) => (
            <div key={stat.label} className="me-card px-4 py-3">
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--me-text-secondary)" }}>
                {stat.label}
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: stat.color }}>
                {stat.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Ledger Table */}
        <div className="me-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--me-bg-secondary)", borderBottom: "1px solid var(--me-border)" }}>
                  {["#", "Serial ID", "Batch ID", "Denomination", "Status", "Issuing Authority", "Issued At", "Last Seen"].map((h) => (
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
                {filtered.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="transition-colors duration-150 group"
                    style={{
                      background: entry.isAlert
                        ? "rgba(239,68,68,0.04)"
                        : i % 2 === 0
                        ? "transparent"
                        : "rgba(255,255,255,0.01)",
                      borderBottom: "1px solid rgba(212,160,23,0.06)",
                      borderLeft: entry.isAlert ? "2px solid rgba(239,68,68,0.5)" : "2px solid transparent",
                    }}
                  >
                    <td className="px-4 py-3">
                      {entry.isAlert && (
                        <AlertTriangle size={12} style={{ color: "var(--me-danger)" }} className="inline mr-1" />
                      )}
                      <span className="font-mono text-xs" style={{ color: "var(--me-text-secondary)" }}>
                        {entry.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--me-gold)" }}>
                      {entry.serialId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--me-blue)" }}>
                      {entry.batchId}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--me-text-primary)" }}>
                      {entry.denomination}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[entry.status].className}`}
                      >
                        {STATUS_CONFIG[entry.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--me-text-secondary)" }}>
                      {entry.issuingAuthority}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--me-text-secondary)" }}>
                      {entry.issuedAt.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--me-text-secondary)" }}>
                      {entry.lastSeen.slice(0, 16).replace("T", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: "var(--me-text-secondary)" }}>
              No ledger entries match your criteria.
            </div>
          )}

          <div
            className="px-4 py-3 flex items-center justify-between text-xs"
            style={{ borderTop: "1px solid var(--me-border)", color: "var(--me-text-secondary)" }}
          >
            <span>
              Showing {filtered.length} of {entries.length} entries — Immutable Ledger v3.0
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-me-pulse" style={{ background: "var(--me-success)" }} />
              <span>Auto-syncing every 30s</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
