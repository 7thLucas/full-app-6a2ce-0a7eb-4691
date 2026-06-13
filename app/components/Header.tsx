import { useConfigurables } from "~/modules/configurables";
import { Bell, ChevronDown, Globe } from "lucide-react";
import { useState, useEffect } from "react";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { config, loading } = useConfigurables();
  const appName = loading ? "Money Elysium" : (config?.appName ?? "Money Elysium");

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
      style={{
        background: "rgba(10, 15, 46, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--me-border)",
      }}
    >
      <div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--me-text-primary)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: "var(--me-text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Live time indicator */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono"
          style={{ background: "var(--me-bg-card)", border: "1px solid var(--me-border)" }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-me-pulse"
            style={{ background: "var(--me-success)" }}
          />
          <span style={{ color: "var(--me-text-primary)" }}>
            {currentTime.toISOString().replace("T", " ").slice(0, 19)} UTC
          </span>
        </div>

        {/* Global indicator */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
          style={{ background: "var(--me-bg-card)", border: "1px solid var(--me-border)" }}
        >
          <Globe size={12} style={{ color: "var(--me-blue)" }} />
          <span style={{ color: "var(--me-text-secondary)" }}>GLOBAL</span>
        </div>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ background: "var(--me-bg-card)", border: "1px solid var(--me-border)" }}
        >
          <Bell size={16} style={{ color: "var(--me-text-secondary)" }} />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full animate-me-red-glow"
            style={{ background: "var(--me-danger)" }}
          />
        </button>

        {/* Authority badge */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
          style={{ background: "rgba(212, 160, 23, 0.1)", border: "1px solid rgba(212, 160, 23, 0.3)" }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--me-gold)" }}>
            {appName}
          </span>
          <ChevronDown size={12} style={{ color: "var(--me-gold)" }} />
        </div>
      </div>
    </header>
  );
}
