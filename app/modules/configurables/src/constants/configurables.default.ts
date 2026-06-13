/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TUIColors = {
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  gold: string;
  electricBlue: string;
  success: string;
  warning: string;
  danger: string;
  textPrimary: string;
  textSecondary: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  tagline: string;
  logoUrl: string;
  brandColor: TBrandColor;
  colors: TUIColors;
  systemVersion: string;
  commandCenterTitle: string;
  ledgerTitle: string;
  antiCounterfeitTitle: string;
  agiBrainTitle: string;
  bankingProtocolTitle: string;
  footerText: string;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "Money Elysium",
  tagline: "The World's First Sovereign Fiat Management System",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "#0a0f2e",
    secondary: "#d4a017",
    accent: "#3b82f6",
  },
  colors: {
    bgPrimary: "#0a0f2e",
    bgSecondary: "#0d1435",
    bgCard: "#111936",
    gold: "#d4a017",
    electricBlue: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
  },
  systemVersion: "v7.0.0-SOVEREIGN",
  commandCenterTitle: "Central Bank Command Center",
  ledgerTitle: "Sovereign Currency Ledger",
  antiCounterfeitTitle: "Anti-Counterfeit Verification",
  agiBrainTitle: "AGI Monetary Brain",
  bankingProtocolTitle: "Inter-Operable Banking Protocol",
  footerText: "SYSTEM ONLINE — QUANTUM ENCRYPTED — SOVEREIGN GRADE",
};
