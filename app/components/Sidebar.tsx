import { Link, useLocation } from "react-router";
import { useConfigurables } from "~/modules/configurables";
import {
  LayoutDashboard,
  BookOpen,
  ShieldCheck,
  Brain,
  Network,
  Wifi,
  Lock,
  ShieldAlert,
  Swords,
  FlaskConical,
  KeySquare,
  Coins,
} from "lucide-react";

const navItems = [
  {
    id: "command-center",
    label: "Command Center",
    path: "/",
    icon: LayoutDashboard,
    description: "Central Bank Dashboard",
  },
  {
    id: "sovereign-ledger",
    label: "Sovereign Ledger",
    path: "/ledger",
    icon: BookOpen,
    description: "Immutable Fiat Ledger",
  },
  {
    id: "anti-counterfeit",
    label: "Anti-Counterfeit",
    path: "/verify",
    icon: ShieldCheck,
    description: "Verification Protocol",
  },
  {
    id: "agi-brain",
    label: "AGI Brain",
    path: "/agi",
    icon: Brain,
    description: "Monetary Intelligence",
  },
  {
    id: "banking-protocol",
    label: "Banking Protocol",
    path: "/protocol",
    icon: Network,
    description: "Inter-Operable Settlements",
  },
  {
    id: "security-monitor",
    label: "Security Monitor",
    path: "/security",
    icon: ShieldAlert,
    description: "Self-Healing Threat Response",
  },
  {
    id: "war-room",
    label: "War Room",
    path: "/war-room",
    icon: Swords,
    description: "Geopolitical Defense Command",
  },
  {
    id: "stress-test",
    label: "Stress Test",
    path: "/stress-test",
    icon: FlaskConical,
    description: "AI Economic Crisis Simulator",
  },
  {
    id: "quantum-security",
    label: "Quantum Security",
    path: "/quantum-security",
    icon: KeySquare,
    description: "Post-Quantum Cryptography",
  },
  {
    id: "cbdc",
    label: "CBDC",
    path: "/cbdc",
    icon: Coins,
    description: "Digital Currency Lifecycle",
  },
];

export function Sidebar() {
  const location = useLocation();
  const { config, loading } = useConfigurables();

  const appName = loading ? "Money Elysium" : (config?.appName ?? "Money Elysium");
  const tagline = loading ? "Sovereign Fiat Management" : (config?.tagline ?? "Sovereign Fiat Management System");
  const version = loading ? "v7.0.0" : (config?.systemVersion ?? "v7.0.0-SOVEREIGN");
  const logoUrl = loading ? "" : (config?.logoUrl ?? "");

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-50"
      style={{ background: "var(--me-bg-primary)", borderRight: "1px solid var(--me-border)" }}
    >
      {/* Logo / Header */}
      <div className="px-5 py-6 border-b" style={{ borderColor: "var(--me-border)" }}>
        <div className="flex items-center gap-3 mb-1">
          {logoUrl ? (
            <img src={logoUrl} alt={appName} className="w-8 h-8 object-contain" />
          ) : (
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--me-gold)", color: "var(--me-bg-primary)" }}
            >
              ME
            </div>
          )}
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--me-gold)" }}
          >
            {appName}
          </span>
        </div>
        <p className="text-xs leading-tight pl-11" style={{ color: "var(--me-text-secondary)" }}>
          {tagline}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.id}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative"
              style={
                isActive
                  ? {
                      background: "rgba(212, 160, 23, 0.1)",
                      borderLeft: "3px solid var(--me-gold)",
                      paddingLeft: "calc(0.75rem - 3px)",
                    }
                  : {
                      borderLeft: "3px solid transparent",
                      paddingLeft: "calc(0.75rem - 3px)",
                    }
              }
            >
              <Icon
                size={18}
                style={{ color: isActive ? "var(--me-gold)" : "var(--me-text-secondary)" }}
                className="flex-shrink-0 transition-colors group-hover:text-yellow-400"
              />
              <div className="min-w-0">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: isActive ? "var(--me-gold)" : "var(--me-text-primary)" }}
                >
                  {item.label}
                </div>
                <div className="text-xs truncate" style={{ color: "var(--me-text-secondary)" }}>
                  {item.description}
                </div>
              </div>
              {isActive && (
                <div
                  className="absolute right-2 w-1.5 h-1.5 rounded-full animate-me-pulse"
                  style={{ background: "var(--me-gold)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Status */}
      <div
        className="px-4 py-4 border-t space-y-2"
        style={{ borderColor: "var(--me-border)" }}
      >
        <div className="flex items-center gap-2">
          <Wifi size={12} style={{ color: "var(--me-success)" }} />
          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--me-success)" }}>
            SYSTEM ONLINE
          </span>
          <div
            className="ml-auto w-2 h-2 rounded-full animate-me-pulse"
            style={{ background: "var(--me-success)" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Lock size={12} style={{ color: "var(--me-text-secondary)" }} />
          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--me-text-secondary)" }}>
            QUANTUM SECURE
          </span>
        </div>
        <div className="text-xs font-mono" style={{ color: "rgba(148,163,184,0.5)" }}>
          {version}
        </div>
      </div>
    </aside>
  );
}
