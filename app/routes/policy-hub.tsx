import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  Search,
  FileText,
  MessageSquare,
  Timer,
  TrendingUp,
  Zap,
  BarChart3,
} from "lucide-react";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";

// ─── Types ──────────────────────────────────────────────────────────────────

type NationStatus = "ONLINE" | "AWAY" | "OFFLINE";
type ProposalStage = "DRAFTING" | "VOTING" | "IMPLEMENTING";
type UrgencyLevel = "STANDARD" | "PRIORITY" | "EMERGENCY";
type VoteChoice = "APPROVE" | "ABSTAIN" | "REJECT" | null;
type AdoptionStatus = "PENDING" | "IN_PROGRESS" | "IMPLEMENTED";
type HistoricalOutcome = "APPROVED" | "REJECTED" | "WITHDRAWN";

interface Nation {
  id: string;
  flag: string;
  name: string;
  shortName: string;
  representative: string;
  title: string;
  currency: string;
  status: NationStatus;
  lastActive: string;
  color: string;
  isFounding: boolean;
}

interface Vote {
  nationId: string;
  choice: VoteChoice;
  reason: string;
}

interface Proposal {
  id: string;
  title: string;
  proposingNationId: string;
  policyType: string;
  stage: ProposalStage;
  urgency: UrgencyLevel;
  deadline: string;
  votes: Vote[];
  fullText: string[];
  versions: { label: string; date: string; changes: string }[];
  implementationTimeline?: string[];
}

interface ImplementationRecord {
  policyTitle: string;
  adoptionByNation: { nationId: string; status: AdoptionStatus; progress: number; estimatedDate: string }[];
}

interface HistoricalEntry {
  date: string;
  title: string;
  proposingNationId: string;
  voteCount: string;
  outcome: HistoricalOutcome;
  implementationStatus: string;
}

// ─── Static Data ────────────────────────────────────────────────────────────

const NATIONS: Nation[] = [
  { id: "US", flag: "🇺🇸", name: "United States", shortName: "US", representative: "Gov. Marcus Hale", title: "Federal Reserve Governor", currency: "USD", status: "ONLINE", lastActive: "2 min ago", color: "#3b82f6", isFounding: true },
  { id: "EU", flag: "🇪🇺", name: "European Union", shortName: "EU", representative: "Dir. Elara Fontaine", title: "ECB Executive Director", currency: "EUR", status: "ONLINE", lastActive: "5 min ago", color: "#6366f1", isFounding: true },
  { id: "UK", flag: "🇬🇧", name: "United Kingdom", shortName: "UK", representative: "Gov. James Whitmore", title: "Bank of England Governor", currency: "GBP", status: "ONLINE", lastActive: "1 min ago", color: "#a78bfa", isFounding: true },
  { id: "JP", flag: "🇯🇵", name: "Japan", shortName: "JP", representative: "Gov. Hiroshi Tanaka", title: "Bank of Japan Governor", currency: "JPY", status: "AWAY", lastActive: "18 min ago", color: "#f59e0b", isFounding: true },
  { id: "CA", flag: "🇨🇦", name: "Canada", shortName: "CA", representative: "Gov. Sophie Leclair", title: "Bank of Canada Governor", currency: "CAD", status: "ONLINE", lastActive: "3 min ago", color: "#10b981", isFounding: true },
  { id: "DE", flag: "🇩🇪", name: "Germany", shortName: "DE", representative: "Pres. Klaus Becker", title: "Bundesbank President", currency: "EUR", status: "ONLINE", lastActive: "7 min ago", color: "#6366f1", isFounding: true },
  { id: "FR", flag: "🇫🇷", name: "France", shortName: "FR", representative: "Gov. Marie Dupont", title: "Banque de France Governor", currency: "EUR", status: "AWAY", lastActive: "22 min ago", color: "#ec4899", isFounding: true },
  { id: "CN", flag: "🇨🇳", name: "China", shortName: "CN", representative: "Gov. Wei Zhang", title: "PBoC Governor", currency: "CNY", status: "ONLINE", lastActive: "4 min ago", color: "#ef4444", isFounding: false },
  { id: "IN", flag: "🇮🇳", name: "India", shortName: "IN", representative: "Gov. Priya Sharma", title: "RBI Governor", currency: "INR", status: "ONLINE", lastActive: "9 min ago", color: "#f97316", isFounding: false },
  { id: "ID", flag: "🇮🇩", name: "Indonesia", shortName: "ID", representative: "Gov. Adi Santoso", title: "Bank Indonesia Governor", currency: "IDR", status: "AWAY", lastActive: "31 min ago", color: "#14b8a6", isFounding: false },
];

const POLICY_TYPE_COLORS: Record<string, string> = {
  "Interest Rate Alignment": "#3b82f6",
  "Emergency Liquidity": "#ef4444",
  "Currency Swap Line": "#10b981",
  "Inflation Target Setting": "#f59e0b",
  "Capital Flow Management": "#6366f1",
  "Coordinated QE/QT": "#8b5cf6",
  "Sovereign Debt Crisis": "#f97316",
};

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: "P-2026-001",
    title: "Coordinated 25bps Rate Reduction",
    proposingNationId: "US",
    policyType: "Interest Rate Alignment",
    stage: "VOTING",
    urgency: "PRIORITY",
    deadline: "2026-06-20",
    votes: [
      { nationId: "US", choice: "APPROVE", reason: "Inflation cooling below 2.1%; growth slowdown warrants pre-emptive easing." },
      { nationId: "EU", choice: "APPROVE", reason: "Eurozone PMI contraction supports synchronized reduction." },
      { nationId: "UK", choice: "ABSTAIN", reason: "Domestic wage inflation remains elevated at 3.8%; caution advised." },
      { nationId: "JP", choice: "APPROVE", reason: "YCC exit strategy aligns with modest global easing cycle." },
      { nationId: "CA", choice: null, reason: "" },
      { nationId: "DE", choice: null, reason: "" },
      { nationId: "FR", choice: null, reason: "" },
    ],
    fullText: [
      "The Council of G7 Central Banks proposes a coordinated reduction of benchmark interest rates by 25 basis points across all founding member jurisdictions, to take effect on the first business day following the attainment of a supermajority quorum vote. This synchronized action is warranted by the confluence of materially easing inflationary pressures, decelerating global trade volumes, and leading indicators pointing toward sub-trend GDP growth across the North Atlantic economies.",
      "Member institutions shall implement the rate adjustment within their respective domestic monetary frameworks, subject to standard communication protocols and forward guidance alignment. The Federal Open Market Committee, the ECB Governing Council, the Bank of England Monetary Policy Committee, and corresponding bodies in Japan, Canada, Germany, and France shall each convene emergency briefings within 48 hours of quorum confirmation to calibrate individual implementation pathways.",
      "Observer nations — the People's Bank of China, the Reserve Bank of India, and Bank Indonesia — are invited to submit independent policy response frameworks for Council awareness. The Council recognizes that observer jurisdictions retain sovereign discretion in their monetary policy calibration and does not prescribe coordinated action within this resolution. However, informational transparency among all ten Council members is strongly encouraged to prevent disorderly cross-border capital flows.",
      "Implementation effectiveness shall be reviewed at the Quarterly Coordination Summit scheduled for September 2026. Should global conditions materially deteriorate prior to that date, the Emergency Fast-Track Protocol may be invoked to accelerate further coordinated action. This proposal supersedes the preliminary draft circulated on 2026-06-05 and incorporates feedback from the UK delegation regarding the staggered implementation timeline.",
    ],
    versions: [
      { label: "v1.0", date: "2026-06-05", changes: "Initial draft submitted by US delegation. Proposed 50bps reduction." },
      { label: "v1.1", date: "2026-06-09", changes: "Reduced to 25bps after UK objection. Added observer nation clause." },
      { label: "v1.2", date: "2026-06-12", changes: "Current version. Refined implementation timeline. Added Japan YCC footnote." },
    ],
    implementationTimeline: [
      "T+0: Quorum confirmed — formal resolution adopted",
      "T+48h: Member central bank emergency briefings",
      "T+72h: Coordinated public communications released",
      "T+5 days: Rate adjustments effective across jurisdictions",
      "T+30 days: Cross-border capital flow monitoring report",
      "T+90 days: Effectiveness review at Quarterly Summit",
    ],
  },
  {
    id: "P-2026-002",
    title: "Emergency Liquidity Injection — Brazil",
    proposingNationId: "US",
    policyType: "Emergency Liquidity",
    stage: "DRAFTING",
    urgency: "EMERGENCY",
    deadline: "2026-06-14",
    votes: [
      { nationId: "US", choice: "APPROVE", reason: "BRL contagion risk to USD Latam credit markets is significant." },
      { nationId: "EU", choice: null, reason: "" },
      { nationId: "UK", choice: null, reason: "" },
      { nationId: "JP", choice: null, reason: "" },
      { nationId: "CA", choice: null, reason: "" },
      { nationId: "DE", choice: null, reason: "" },
      { nationId: "FR", choice: null, reason: "" },
    ],
    fullText: [
      "Following the sharp depreciation of the Brazilian Real (BRL) and the Banco Central do Brasil's exhaustion of foreign exchange reserves, the United States Federal Reserve, acting as emergency convener, proposes an immediate multilateral liquidity support facility totaling USD 180 billion, to be deployed via coordinated swap line activations over a 72-hour window.",
      "The facility shall be structured as a temporary foreign currency swap arrangement, with each participating G7 institution contributing a pro-rated share based on IMF quota allocations. The Federal Reserve shall act as administrative agent, with the BIS serving as the clearing and settlement intermediary. Interest shall accrue at the respective base rate plus 50 basis points, with a maximum facility term of 180 days subject to renewal by Council resolution.",
      "Conditionality shall be minimal and focused on transparency commitments: the Banco Central do Brasil shall provide weekly FX reserve disclosures, maintain interest rate policy within Council-agreed bands, and submit to a joint IMF-BIS supervision review at Day 60. The Council recognizes the systemic importance of Brazil to global emerging market stability and the cascading risk of disorderly BRL depreciation to regional trade partners.",
      "This proposal is submitted under Emergency Protocol Article 7, which authorizes expedited 24-hour voting. Observer nations China and India, as major BRL trading partners, are formally invited to participate as co-lenders on commercially equivalent terms. Failure to attain quorum within 24 hours shall trigger automatic escalation to the IMF Executive Board emergency facility.",
    ],
    versions: [
      { label: "v1.0", date: "2026-06-13", changes: "Emergency draft submitted by US delegation under Article 7 fast-track." },
    ],
    implementationTimeline: [
      "T+0: Emergency quorum vote — 24H window",
      "T+4h: BIS swap facility documentation executed",
      "T+24h: First USD 60B tranche deployed",
      "T+48h: Second USD 60B tranche deployed",
      "T+72h: Final USD 60B tranche deployed",
      "T+60 days: IMF-BIS joint supervision review",
    ],
  },
  {
    id: "P-2026-003",
    title: "Global Inflation Target Alignment 2026",
    proposingNationId: "EU",
    policyType: "Inflation Target Setting",
    stage: "IMPLEMENTING",
    urgency: "STANDARD",
    deadline: "2026-07-01",
    votes: [
      { nationId: "US", choice: "APPROVE", reason: "2.0% symmetric target aligns with FOMC framework." },
      { nationId: "EU", choice: "APPROVE", reason: "ECB mandated 2% target — full alignment." },
      { nationId: "UK", choice: "APPROVE", reason: "Consistent with Bank of England remit letter." },
      { nationId: "JP", choice: "APPROVE", reason: "Supports Bank of Japan's 2% price stability goal." },
      { nationId: "CA", choice: "APPROVE", reason: "Bank of Canada 1-3% band centerpoint aligns." },
      { nationId: "DE", choice: "APPROVE", reason: "Supports Bundesbank contribution to ECB framework." },
      { nationId: "FR", choice: "ABSTAIN", reason: "France supports in principle but requests national flexibility clause." },
    ],
    fullText: [
      "The Council formally adopts a harmonized symmetric inflation target of 2.0% year-on-year as the shared medium-term price stability objective for all G7 founding member jurisdictions. This resolution does not supersede domestic mandates but establishes a common reference point for international policy coordination, communication, and joint assessment of cross-border spillovers.",
      "Member institutions shall adopt consistent methodologies for measuring headline and core inflation, with particular regard to housing cost treatment, energy price smoothing, and import price deflation. A Technical Harmonization Working Group, co-chaired by the Federal Reserve and the ECB, shall produce a unified measurement framework by Q3 2026 for adoption by all Council members.",
      "The 2.0% symmetric target implies that deviations above and below are treated with equal concern, superseding any asymmetric frameworks that may have historically tolerated below-target outcomes. The Council recognizes that structural factors — demographic aging, deglobalization, and energy transition costs — may create persistent upward pressure on neutral inflation rates across member jurisdictions.",
      "This resolution was approved by a vote of 6-0-1 at the Spring Coordination Plenary and enters implementation phase effective immediately. France's abstention is noted and the Council commits to reviewing the national flexibility clause at the September 2026 Summit. Observer nations are encouraged to benchmark domestic targets against the 2.0% Council standard.",
    ],
    versions: [
      { label: "v1.0", date: "2026-04-10", changes: "Initial proposal by ECB for 1.5-2.5% band." },
      { label: "v1.1", date: "2026-04-28", changes: "Narrowed to 2.0% symmetric after US-Japan alignment." },
      { label: "v1.2", date: "2026-05-15", changes: "Added Technical Working Group mandate. France flexibility clause tabled." },
    ],
    implementationTimeline: [
      "COMPLETED: Quorum vote — 6 APPROVE, 0 REJECT, 1 ABSTAIN",
      "COMPLETED: Formal adoption at Spring Plenary 2026-05-20",
      "IN PROGRESS: Technical Harmonization Working Group formation",
      "IN PROGRESS: Unified measurement framework development",
      "PENDING: Q3 2026 framework publication",
      "PENDING: September Summit national flexibility review",
    ],
  },
  {
    id: "P-2026-004",
    title: "USD/EUR Swap Line Extension — 36 Months",
    proposingNationId: "UK",
    policyType: "Currency Swap Line",
    stage: "VOTING",
    urgency: "STANDARD",
    deadline: "2026-06-30",
    votes: [
      { nationId: "US", choice: "APPROVE", reason: "Strengthens transatlantic liquidity corridor." },
      { nationId: "EU", choice: "APPROVE", reason: "ECB endorses 36-month extension at current capacity." },
      { nationId: "UK", choice: "APPROVE", reason: "UK proposes and sponsors this extension." },
      { nationId: "JP", choice: null, reason: "" },
      { nationId: "CA", choice: "APPROVE", reason: "Canada benefits from USD corridor stability." },
      { nationId: "DE", choice: null, reason: "" },
      { nationId: "FR", choice: null, reason: "" },
    ],
    fullText: [
      "The United Kingdom, acting as coordinating member, proposes a 36-month extension of the existing USD/EUR standing swap line arrangement between the Federal Reserve and the European Central Bank, maintaining the current facility capacity of USD 500 billion / EUR 460 billion. The extension shall take effect upon the expiry of the current 12-month arrangement on 2026-09-01.",
      "The extended facility shall incorporate enhanced operational parameters including: automated drawdown notification to all Council members within one business hour of activation; real-time utilization dashboards accessible to founding member governors; and a graduated interest rate structure starting at Fed Funds Rate +10bps for the first USD 100B, scaling to +25bps thereafter to discourage excess facility dependency.",
      "The Council's Financial Stability Committee shall conduct semi-annual reviews of facility utilization and market impact, with authority to recommend capacity adjustments up to ±20% within the approved extension period. Any adjustment exceeding this threshold shall require a full Council vote under standard quorum procedures.",
      "This proposal reflects the Council's commitment to maintaining robust cross-currency liquidity infrastructure as a foundational pillar of international financial stability. The USD/EUR swap line has been activated on three occasions since 2020, demonstrating its systemic importance during periods of acute dollar funding stress. Japan, Canada, and the United Kingdom maintain parallel bilateral arrangements that complement this core facility.",
    ],
    versions: [
      { label: "v1.0", date: "2026-06-01", changes: "UK submits 24-month extension proposal." },
      { label: "v1.1", date: "2026-06-08", changes: "Extended to 36 months after US-EU joint request. Enhanced notification clauses added." },
    ],
    implementationTimeline: [
      "T+0: Quorum confirmed",
      "T+30 days: Legal documentation finalized by FRB NY and ECB Legal",
      "T+60 days: Operational systems testing",
      "2026-09-01: Extended facility goes live",
      "2027-03-01: First semi-annual utilization review",
    ],
  },
];

const IMPLEMENTATION_TRACKER: ImplementationRecord[] = [
  {
    policyTitle: "Global Inflation Target Alignment 2026",
    adoptionByNation: [
      { nationId: "US", status: "IMPLEMENTED", progress: 100, estimatedDate: "2026-05-20" },
      { nationId: "EU", status: "IMPLEMENTED", progress: 100, estimatedDate: "2026-05-20" },
      { nationId: "UK", status: "IN_PROGRESS", progress: 72, estimatedDate: "2026-07-15" },
      { nationId: "JP", status: "IN_PROGRESS", progress: 55, estimatedDate: "2026-08-01" },
      { nationId: "CA", status: "IMPLEMENTED", progress: 100, estimatedDate: "2026-06-01" },
      { nationId: "DE", status: "IN_PROGRESS", progress: 88, estimatedDate: "2026-07-01" },
      { nationId: "FR", status: "PENDING", progress: 20, estimatedDate: "2026-09-30" },
    ],
  },
];

const HISTORICAL_ARCHIVE: HistoricalEntry[] = [
  { date: "2026-05-20", title: "Global Inflation Target Alignment 2026", proposingNationId: "EU", voteCount: "6-0-1", outcome: "APPROVED", implementationStatus: "IN PROGRESS" },
  { date: "2026-03-15", title: "Coordinated G7 Capital Flow Reporting Framework", proposingNationId: "CA", voteCount: "7-0-0", outcome: "APPROVED", implementationStatus: "IMPLEMENTED" },
  { date: "2026-01-08", title: "Emergency Liquidity Protocol — Turkey (TRY Crisis)", proposingNationId: "EU", voteCount: "5-1-1", outcome: "APPROVED", implementationStatus: "IMPLEMENTED" },
  { date: "2025-11-22", title: "Coordinated QT Tapering — Phase II", proposingNationId: "US", voteCount: "4-2-1", outcome: "APPROVED", implementationStatus: "IMPLEMENTED" },
  { date: "2025-09-10", title: "Global CBDC Interoperability Standards v2.0", proposingNationId: "UK", voteCount: "3-3-1", outcome: "REJECTED", implementationStatus: "N/A" },
  { date: "2025-07-01", title: "Enhanced Sovereign Debt Surveillance Framework", proposingNationId: "DE", voteCount: "6-0-1", outcome: "APPROVED", implementationStatus: "IMPLEMENTED" },
  { date: "2025-04-18", title: "Carbon-Adjusted Reserve Requirement Proposal", proposingNationId: "FR", voteCount: "2-4-1", outcome: "REJECTED", implementationStatus: "N/A" },
  { date: "2025-02-05", title: "Unified G7 Stablecoin Oversight Framework", proposingNationId: "US", voteCount: "N/A", outcome: "WITHDRAWN", implementationStatus: "N/A" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getNation(id: string) {
  return NATIONS.find((n) => n.id === id)!;
}

function getApproveCount(proposal: Proposal) {
  return proposal.votes.filter((v) => v.choice === "APPROVE").length;
}

function getDeadlineCountdown(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "EXPIRED";
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

function useCountdown(deadline: string) {
  const [display, setDisplay] = useState(() => getDeadlineCountdown(deadline));
  useEffect(() => {
    const t = setInterval(() => setDisplay(getDeadlineCountdown(deadline)), 15000);
    return () => clearInterval(t);
  }, [deadline]);
  return display;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function NationDot({ status }: { status: NationStatus }) {
  const color = status === "ONLINE" ? "#22c55e" : status === "AWAY" ? "#f59e0b" : "#64748b";
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: color, boxShadow: status === "ONLINE" ? `0 0 6px ${color}` : undefined }}
    />
  );
}

function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const map: Record<UrgencyLevel, { bg: string; text: string; border: string }> = {
    STANDARD: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", border: "rgba(100,116,139,0.3)" },
    PRIORITY: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
    EMERGENCY: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", border: "rgba(239,68,68,0.4)" },
  };
  const c = map[urgency];
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded font-mono tracking-wider"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {urgency}
    </span>
  );
}

function VoteBadge({ choice }: { choice: VoteChoice }) {
  if (!choice) return <span className="text-xs font-mono" style={{ color: "#475569" }}>PENDING</span>;
  const map: Record<Exclude<VoteChoice, null>, { bg: string; text: string }> = {
    APPROVE: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
    ABSTAIN: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
    REJECT: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
  };
  const c = map[choice];
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded font-mono" style={{ background: c.bg, color: c.text }}>
      {choice}
    </span>
  );
}

function AdoptionBadge({ status }: { status: AdoptionStatus }) {
  const map: Record<AdoptionStatus, { bg: string; text: string }> = {
    PENDING: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
    IN_PROGRESS: { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
    IMPLEMENTED: { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
  };
  const c = map[status];
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded font-mono" style={{ background: c.bg, color: c.text }}>
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Collaborative Authoring Simulator ──────────────────────────────────────

const AUTHOR_CURSORS = [
  { nationId: "US", color: "#3b82f6", text: "The Council's Technical Working Group notes that coordinated implementation across member jurisdictions requires unified measurement frameworks for core inflation, excluding energy and food prices on a rolling 12-month basis..." },
  { nationId: "EU", color: "#6366f1", text: "The European Central Bank proposes that member institutions adopt the Harmonised Index of Consumer Prices (HICP) methodology as the baseline standard, with national CPI adjustments permitted only where structural differences exceed a 15bps threshold..." },
  { nationId: "JP", color: "#f59e0b", text: "Bank of Japan notes that import-driven inflationary dynamics in commodity-dependent economies may necessitate a supplementary framework for measuring underlying domestic demand inflation, distinct from headline CPI fluctuations driven by yen volatility..." },
];

function CollaborativeAuthoring({ proposalId }: { proposalId: string }) {
  const [texts, setTexts] = useState<string[]>(["", "", ""]);
  const [activeCursor, setActiveCursor] = useState(0);
  const charIndicesRef = useRef([0, 0, 0]);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const CHARS_PER_SEC = 18;

  useEffect(() => {
    let running = true;
    function tick(now: number) {
      if (!running) return;
      const elapsed = now - lastTimeRef.current;
      if (elapsed > 1000 / CHARS_PER_SEC) {
        lastTimeRef.current = now;
        const idx = Math.floor(now / 4000) % 3;
        setActiveCursor(idx);
        const target = AUTHOR_CURSORS[idx].text;
        const current = charIndicesRef.current[idx];
        if (current < target.length) {
          charIndicesRef.current[idx] = current + 1;
          setTexts((prev) => {
            const next = [...prev];
            next[idx] = target.slice(0, charIndicesRef.current[idx]);
            return next;
          });
        } else {
          // reset after a pause
          setTimeout(() => {
            charIndicesRef.current[idx] = 0;
            setTexts((prev) => { const next = [...prev]; next[idx] = ""; return next; });
          }, 2000);
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [proposalId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={14} style={{ color: "#1d4ed8" }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#e2e8f0" }}>Live Collaborative Editing</span>
        <span className="text-xs px-2 py-0.5 rounded font-mono animate-pulse" style={{ background: "rgba(29,78,216,0.15)", color: "#60a5fa" }}>3 AUTHORS ACTIVE</span>
      </div>

      {AUTHOR_CURSORS.map((author, i) => {
        const nation = getNation(author.nationId);
        const isActive = activeCursor === i;
        return (
          <div
            key={author.nationId}
            className="rounded-lg p-4"
            style={{
              background: isActive ? `${author.color}0d` : "rgba(255,255,255,0.02)",
              border: `1px solid ${isActive ? author.color + "40" : "rgba(255,255,255,0.06)"}`,
              transition: "all 0.3s",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{nation.flag}</span>
              <span className="text-xs font-bold" style={{ color: author.color }}>
                {nation.representative} is {isActive ? "typing..." : "reviewing..."}
              </span>
              {isActive && (
                <span className="inline-block w-1.5 h-3.5 rounded-sm animate-pulse" style={{ background: author.color }} />
              )}
            </div>
            <p className="text-xs leading-relaxed min-h-[2rem]" style={{ color: "#94a3b8" }}>
              {texts[i]}
              {isActive && texts[i].length > 0 && (
                <span className="inline-block w-0.5 h-3 ml-px animate-pulse" style={{ background: author.color, verticalAlign: "text-bottom" }} />
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Proposal Detail Panel ───────────────────────────────────────────────────

function ProposalDetailPanel({
  proposal,
  onClose,
  onVoteChange,
}: {
  proposal: Proposal;
  onClose: () => void;
  onVoteChange: (proposalId: string, nationId: string, choice: VoteChoice, reason: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"text" | "votes" | "authoring" | "timeline">("text");
  const [activeVersion, setActiveVersion] = useState(proposal.versions[proposal.versions.length - 1].label);
  const [localVotes, setLocalVotes] = useState<Record<string, { choice: VoteChoice; reason: string }>>(
    Object.fromEntries(proposal.votes.map((v) => [v.nationId, { choice: v.choice, reason: v.reason }]))
  );
  const approveCount = proposal.votes.filter((v) => v.choice === "APPROVE").length;
  const nation = getNation(proposal.proposingNationId);

  function handleVote(nationId: string, choice: VoteChoice) {
    setLocalVotes((prev) => ({ ...prev, [nationId]: { ...prev[nationId], choice } }));
    onVoteChange(proposal.id, nationId, choice, localVotes[nationId]?.reason ?? "");
  }

  function handleReason(nationId: string, reason: string) {
    setLocalVotes((prev) => ({ ...prev, [nationId]: { ...prev[nationId], reason } }));
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed right-0 top-0 h-screen z-50 flex flex-col overflow-hidden"
      style={{ width: "min(640px, 100vw)", background: "#0a0f25", borderLeft: "1px solid rgba(29,78,216,0.4)", boxShadow: "-8px 0 40px rgba(0,0,0,0.6)" }}
    >
      {/* Panel header */}
      <div className="flex items-start justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono" style={{ color: "#1d4ed8" }}>{proposal.id}</span>
            <UrgencyBadge urgency={proposal.urgency} />
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{
                background: `${POLICY_TYPE_COLORS[proposal.policyType] ?? "#6366f1"}20`,
                color: POLICY_TYPE_COLORS[proposal.policyType] ?? "#6366f1",
                border: `1px solid ${POLICY_TYPE_COLORS[proposal.policyType] ?? "#6366f1"}40`,
              }}
            >
              {proposal.policyType}
            </span>
          </div>
          <h2 className="text-base font-bold leading-snug" style={{ color: "#e2e8f0" }}>{proposal.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{nation.flag}</span>
            <span className="text-xs" style={{ color: "#64748b" }}>Proposed by {nation.representative}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}>
          <X size={16} />
        </button>
      </div>

      {/* Quorum tracker */}
      <div className="px-6 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>Quorum Progress</span>
          <span className="text-xs font-bold font-mono" style={{ color: approveCount >= 5 ? "#22c55e" : "#f59e0b" }}>
            {approveCount}/7 founding votes — {approveCount >= 5 ? "QUORUM MET" : "5 required"}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (approveCount / 5) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ background: approveCount >= 5 ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#f59e0b,#d97706)" }}
          />
        </div>
        <div className="flex gap-1 mt-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i < approveCount ? "#22c55e" : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {(["text", "votes", "authoring", "timeline"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all"
            style={{
              color: activeTab === tab ? "#1d4ed8" : "#475569",
              borderBottom: activeTab === tab ? "2px solid #1d4ed8" : "2px solid transparent",
              background: activeTab === tab ? "rgba(29,78,216,0.05)" : "transparent",
            }}
          >
            {tab === "text" ? "Policy Text" : tab === "votes" ? "Votes" : tab === "authoring" ? "Authoring" : "Timeline"}
          </button>
        ))}
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === "text" && (
          <div className="space-y-4">
            {/* Version selector */}
            <div className="flex gap-2 flex-wrap mb-4">
              {proposal.versions.map((v) => (
                <button
                  key={v.label}
                  onClick={() => setActiveVersion(v.label)}
                  className="text-xs px-3 py-1.5 rounded font-mono font-bold transition-all"
                  style={{
                    background: activeVersion === v.label ? "rgba(29,78,216,0.2)" : "rgba(255,255,255,0.04)",
                    color: activeVersion === v.label ? "#60a5fa" : "#64748b",
                    border: activeVersion === v.label ? "1px solid rgba(29,78,216,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {v.label}
                  {v.label === proposal.versions[proposal.versions.length - 1].label && (
                    <span className="ml-1.5 text-xs" style={{ color: "#22c55e" }}>● CURRENT</span>
                  )}
                </button>
              ))}
            </div>

            {/* Version diff note */}
            {(() => {
              const ver = proposal.versions.find((v) => v.label === activeVersion);
              return ver ? (
                <div className="rounded-lg px-4 py-2 mb-4 text-xs" style={{ background: "rgba(29,78,216,0.07)", border: "1px solid rgba(29,78,216,0.2)" }}>
                  <span style={{ color: "#64748b" }}>{ver.date} — </span>
                  <span style={{ color: "#93c5fd" }}>{ver.changes}</span>
                </div>
              ) : null;
            })()}

            {/* Full policy text */}
            <div className="space-y-4">
              {proposal.fullText.map((para, i) => (
                <p key={i} className="text-sm leading-7" style={{ color: "#cbd5e1" }}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        )}

        {activeTab === "votes" && (
          <div className="space-y-3">
            {proposal.votes.map((vote) => {
              const vNation = getNation(vote.nationId);
              const local = localVotes[vote.nationId];
              return (
                <div
                  key={vote.nationId}
                  className="rounded-lg p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{vNation.flag}</span>
                      <div>
                        <div className="text-xs font-bold" style={{ color: "#e2e8f0" }}>{vNation.name}</div>
                        <div className="text-xs" style={{ color: "#475569" }}>{vNation.representative}</div>
                      </div>
                    </div>
                    <VoteBadge choice={local?.choice ?? null} />
                  </div>

                  {/* Vote buttons */}
                  <div className="flex gap-2 mb-3">
                    {(["APPROVE", "ABSTAIN", "REJECT"] as VoteChoice[]).map((choice) => {
                      const colors = {
                        APPROVE: { active: "#22c55e", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)" },
                        ABSTAIN: { active: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)" },
                        REJECT: { active: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)" },
                      }[choice as string] ?? { active: "#fff", bg: "transparent", border: "transparent" };
                      const isSelected = local?.choice === choice;
                      return (
                        <motion.button
                          key={choice}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleVote(vote.nationId, choice)}
                          className="flex-1 py-1.5 rounded text-xs font-bold transition-all"
                          style={{
                            background: isSelected ? colors.bg : "rgba(255,255,255,0.04)",
                            color: isSelected ? colors.active : "#475569",
                            border: `1px solid ${isSelected ? colors.border : "rgba(255,255,255,0.08)"}`,
                          }}
                        >
                          {choice}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Reason field */}
                  {local?.reason && (
                    <p className="text-xs italic" style={{ color: "#64748b" }}>"{local.reason}"</p>
                  )}
                  {!local?.reason && local?.choice && (
                    <input
                      placeholder="Add reasoning..."
                      value=""
                      onChange={(e) => handleReason(vote.nationId, e.target.value)}
                      className="w-full bg-transparent text-xs px-2 py-1.5 rounded outline-none"
                      style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "authoring" && (
          <CollaborativeAuthoring proposalId={proposal.id} />
        )}

        {activeTab === "timeline" && (
          <div className="space-y-2">
            {(proposal.implementationTimeline ?? ["No timeline available."]).map((step, i) => {
              const isDone = step.startsWith("COMPLETED") || step.startsWith("T+0:");
              const isInProgress = step.startsWith("IN PROGRESS");
              const color = isDone ? "#22c55e" : isInProgress ? "#3b82f6" : "#475569";
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    {i < (proposal.implementationTimeline?.length ?? 1) - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: "rgba(255,255,255,0.08)", minHeight: "24px" }} />
                    )}
                  </div>
                  <p className="text-xs leading-5 pb-4" style={{ color: isDone ? "#cbd5e1" : isInProgress ? "#93c5fd" : "#64748b" }}>{step}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Emergency Modal ─────────────────────────────────────────────────────────

function EmergencyModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [phase, setPhase] = useState<"confirm" | "countdown" | "done">("confirm");
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) { setPhase("done"); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, phase]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="rounded-xl p-7 w-full max-w-md mx-4"
        style={{ background: "#09111f", border: "2px solid rgba(239,68,68,0.6)", boxShadow: "0 0 60px rgba(239,68,68,0.25)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} style={{ color: "#ef4444" }} />
            <span className="font-bold tracking-wider uppercase text-sm" style={{ color: "#ef4444" }}>EMERGENCY PROTOCOL ACTIVATION</span>
          </div>
          <button onClick={onClose} style={{ color: "#64748b" }}><X size={16} /></button>
        </div>

        {phase === "confirm" && (
          <>
            <div className="rounded-lg p-4 mb-5 space-y-2 text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ color: "#cbd5e1" }}>Activating the Emergency Protocol will enable <span className="font-bold text-white">24-hour expedited voting</span> for all pending proposals flagged as EMERGENCY urgency.</p>
              <p style={{ color: "#f59e0b" }}>Quorum threshold remains at 5/7 founding members. Fast-track voting bypasses standard 7-day deliberation period.</p>
              <p style={{ color: "#94a3b8" }}>This action is permanently logged and will be reported to the BIS and IMF.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
              <button onClick={() => setPhase("countdown")} className="flex-1 py-2.5 rounded-lg text-xs font-bold" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)" }}>Activate Protocol</button>
            </div>
          </>
        )}

        {phase === "countdown" && (
          <div className="text-center py-4">
            <p className="text-xs mb-4 uppercase tracking-widest" style={{ color: "#94a3b8" }}>Activating in</p>
            <div className="text-7xl font-black font-mono mx-auto mb-4 w-28 h-28 rounded-full flex items-center justify-center"
              style={{ color: "#ef4444", border: "3px solid rgba(239,68,68,0.5)", boxShadow: "0 0 40px rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
              {count}
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "2px solid #ef4444" }}>
              <Zap size={28} style={{ color: "#ef4444" }} />
            </div>
            <p className="font-bold mb-2" style={{ color: "#ef4444" }}>EMERGENCY PROTOCOL ACTIVE</p>
            <p className="text-xs mb-4" style={{ color: "#64748b" }}>24-hour expedited voting is now active for EMERGENCY proposals.</p>
            <button onClick={onConfirm} className="w-full py-2.5 rounded-lg text-xs font-bold" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>Close</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PolicyHub() {
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState("");

  const selectedProposal = proposals.find((p) => p.id === selectedProposalId) ?? null;

  const onlineFoundingCount = NATIONS.filter((n) => n.isFounding && n.status === "ONLINE").length;

  const emergencyProposals = proposals.filter((p) => p.urgency === "EMERGENCY");

  const [emergencyCountdown, setEmergencyCountdown] = useState(() => getDeadlineCountdown("2026-06-14"));
  useEffect(() => {
    const t = setInterval(() => setEmergencyCountdown(getDeadlineCountdown("2026-06-14")), 10000);
    return () => clearInterval(t);
  }, []);

  function handleVoteChange(proposalId: string, nationId: string, choice: VoteChoice, reason: string) {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposalId
          ? { ...p, votes: p.votes.map((v) => (v.nationId === nationId ? { ...v, choice, reason } : v)) }
          : p
      )
    );
  }

  const filteredArchive = HISTORICAL_ARCHIVE.filter(
    (h) =>
      h.title.toLowerCase().includes(archiveSearch.toLowerCase()) ||
      getNation(h.proposingNationId).name.toLowerCase().includes(archiveSearch.toLowerCase())
  );

  const KANBAN_STAGES: ProposalStage[] = ["DRAFTING", "VOTING", "IMPLEMENTING"];
  const STAGE_COLORS: Record<ProposalStage, string> = {
    DRAFTING: "#64748b",
    VOTING: "#1d4ed8",
    IMPLEMENTING: "#22c55e",
  };

  return (
    <AppLayout>
      <Header title="Multi-Nation Policy Coordination Hub" subtitle="G7 Council — Monetary Policy Alignment & Diplomatic Protocol" />

      <div className="flex flex-1 min-h-0" style={{ background: "#080e1f" }}>
        {/* Nation Status Sidebar */}
        <aside
          className="w-52 flex-shrink-0 flex flex-col overflow-y-auto border-r"
          style={{ background: "#0a1022", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="px-3 py-3 border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0a1022" }}>
            <div className="flex items-center gap-2">
              <Users size={13} style={{ color: "#1d4ed8" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#94a3b8" }}>Council Members</span>
            </div>
          </div>

          <div className="p-2 space-y-1">
            <div className="px-2 py-1.5 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#d4a017" }}>G7 Founding</span>
            </div>
            {NATIONS.filter((n) => n.isFounding).map((nation) => (
              <div
                key={nation.id}
                className="rounded-lg px-2.5 py-2.5"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{nation.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate" style={{ color: "#e2e8f0" }}>{nation.shortName}</span>
                      {nation.status === "ONLINE" && (
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                      )}
                      {nation.status === "AWAY" && (
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "#f59e0b" }} />
                      )}
                    </div>
                    <div className="text-xs truncate" style={{ color: nation.color, fontSize: "9px" }}>{nation.currency}</div>
                  </div>
                </div>
                <div className="text-xs truncate" style={{ color: "#475569", fontSize: "9px" }}>{nation.title}</div>
              </div>
            ))}

            <div className="px-2 py-1.5 mt-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#64748b" }}>Observers</span>
            </div>
            {NATIONS.filter((n) => !n.isFounding).map((nation) => (
              <div
                key={nation.id}
                className="rounded-lg px-2.5 py-2.5 opacity-80"
                style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{nation.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate" style={{ color: "#94a3b8" }}>{nation.shortName}</span>
                      {nation.status === "ONLINE" && (
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
                      )}
                      {nation.status === "AWAY" && (
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "#f59e0b" }} />
                      )}
                    </div>
                    <div className="text-xs" style={{ color: nation.color, fontSize: "9px" }}>{nation.currency}</div>
                  </div>
                </div>
                <div className="text-xs truncate" style={{ color: "#475569", fontSize: "9px" }}>{nation.title}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="p-5 space-y-5">

            {/* ── 1. Council Status Bar ────────────────────────────────────── */}
            <div
              className="rounded-xl px-5 py-3"
              style={{ background: "#0d1426", border: "1px solid rgba(29,78,216,0.3)" }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Globe size={14} style={{ color: "#1d4ed8" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#e2e8f0" }}>Council Status</span>
                <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold" style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: "#d4a017" }}>
                  <Users size={11} />
                  Quorum: {onlineFoundingCount}/7 founding members required (5 min)
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {NATIONS.map((nation) => (
                  <div
                    key={nation.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: `1px solid ${nation.isFounding ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    <span className="text-base">{nation.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: nation.isFounding ? "#e2e8f0" : "#94a3b8" }}>{nation.shortName}</span>
                        <NationDot status={nation.status} />
                      </div>
                      <div className="text-xs" style={{ color: "#475569", fontSize: "9px" }}>{nation.lastActive}</div>
                    </div>
                    {!nation.isFounding && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(100,116,139,0.1)", color: "#64748b", fontSize: "9px" }}>OBS</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── 5. Emergency Fast-Track Panel ───────────────────────────── */}
            {emergencyProposals.length > 0 && (
              <div
                className="rounded-xl p-5"
                style={{ background: "rgba(239,68,68,0.04)", border: "2px solid rgba(239,68,68,0.4)", boxShadow: "0 0 30px rgba(239,68,68,0.06)" }}
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} style={{ color: "#ef4444" }} className="animate-pulse" />
                    <span className="text-sm font-bold uppercase tracking-wider" style={{ color: "#ef4444" }}>EMERGENCY PROTOCOL: 24H EXPEDITED VOTING</span>
                    {emergencyActive && (
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-bold animate-pulse" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)" }}>ACTIVE</span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowEmergencyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.5)" }}
                  >
                    <Zap size={12} />
                    Activate Emergency Protocol
                  </button>
                </div>

                {emergencyProposals.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg px-4 py-3 cursor-pointer"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
                    onClick={() => setSelectedProposalId(p.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{getNation(p.proposingNationId).flag}</span>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#fca5a5" }}>{p.title}</p>
                        <p className="text-xs" style={{ color: "#64748b" }}>{p.id} · {p.policyType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-xs font-bold font-mono" style={{ color: "#ef4444" }}>{emergencyCountdown}</p>
                        <p className="text-xs" style={{ color: "#64748b" }}>time remaining</p>
                      </div>
                      <Timer size={14} style={{ color: "#ef4444" }} className="animate-pulse" />
                      <ChevronRight size={14} style={{ color: "#64748b" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── 2. Active Proposals Board (Kanban) ──────────────────────── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={15} style={{ color: "#1d4ed8" }} />
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#e2e8f0" }}>Active Proposals Board</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {KANBAN_STAGES.map((stage) => {
                  const stageProposals = proposals.filter((p) => p.stage === stage);
                  return (
                    <div key={stage} className="rounded-xl overflow-hidden" style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div
                        className="px-4 py-3 flex items-center justify-between border-b"
                        style={{ borderColor: "rgba(255,255,255,0.06)", borderTop: `3px solid ${STAGE_COLORS[stage]}` }}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: STAGE_COLORS[stage] }}>{stage}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${STAGE_COLORS[stage]}20`, color: STAGE_COLORS[stage] }}>{stageProposals.length}</span>
                      </div>
                      <div className="p-3 space-y-3 min-h-[200px]">
                        {stageProposals.map((proposal) => {
                          const nation = getNation(proposal.proposingNationId);
                          const approveCount = getApproveCount(proposal);
                          const countdown = getDeadlineCountdown(proposal.deadline);
                          return (
                            <motion.div
                              key={proposal.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setSelectedProposalId(proposal.id)}
                              className="rounded-lg p-4 cursor-pointer"
                              style={{
                                background: "rgba(255,255,255,0.025)",
                                border: `1px solid ${proposal.urgency === "EMERGENCY" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}`,
                              }}
                            >
                              <div className="flex items-start justify-between mb-2 gap-2">
                                <p className="text-xs font-bold leading-snug flex-1" style={{ color: "#e2e8f0" }}>{proposal.title}</p>
                                <span className="text-base flex-shrink-0">{nation.flag}</span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 mb-3">
                                <span
                                  className="text-xs px-2 py-0.5 rounded font-mono"
                                  style={{
                                    background: `${POLICY_TYPE_COLORS[proposal.policyType] ?? "#6366f1"}20`,
                                    color: POLICY_TYPE_COLORS[proposal.policyType] ?? "#6366f1",
                                    fontSize: "9px",
                                  }}
                                >
                                  {proposal.policyType}
                                </span>
                                <UrgencyBadge urgency={proposal.urgency} />
                              </div>

                              {/* Quorum progress */}
                              <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span style={{ color: "#475569" }}>Votes</span>
                                  <span style={{ color: approveCount >= 5 ? "#22c55e" : "#f59e0b" }}>{approveCount}/7</span>
                                </div>
                                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                                  <motion.div
                                    className="h-full rounded-full"
                                    animate={{ width: `${Math.min(100, (approveCount / 7) * 100)}%` }}
                                    style={{ background: approveCount >= 5 ? "#22c55e" : "#f59e0b" }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs" style={{ color: "#475569" }}>
                                <div className="flex items-center gap-1">
                                  <Clock size={10} />
                                  <span>{countdown}</span>
                                </div>
                                <ChevronRight size={12} />
                              </div>
                            </motion.div>
                          );
                        })}
                        {stageProposals.length === 0 && (
                          <div className="flex items-center justify-center h-24 text-xs" style={{ color: "#334155" }}>No proposals</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 6. Implementation Tracker ───────────────────────────────── */}
            <div className="rounded-xl overflow-hidden" style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <TrendingUp size={14} style={{ color: "#22c55e" }} />
                <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Implementation Tracker</span>
              </div>
              {IMPLEMENTATION_TRACKER.map((record, ri) => (
                <div key={ri} className="p-5">
                  <p className="text-xs font-bold mb-4" style={{ color: "#d4a017" }}>{record.policyTitle}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {["Nation", "Representative", "Status", "Progress", "Est. Completion"].map((h) => (
                            <th key={h} className="pb-2 text-left font-semibold uppercase tracking-wider whitespace-nowrap pr-4" style={{ color: "#475569" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {record.adoptionByNation.map((row) => {
                          const n = getNation(row.nationId);
                          return (
                            <tr key={row.nationId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <td className="py-2.5 pr-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{n.flag}</span>
                                  <span className="font-semibold" style={{ color: "#e2e8f0" }}>{n.shortName}</span>
                                </div>
                              </td>
                              <td className="py-2.5 pr-4" style={{ color: "#64748b" }}>{n.representative}</td>
                              <td className="py-2.5 pr-4"><AdoptionBadge status={row.status} /></td>
                              <td className="py-2.5 pr-4">
                                <div className="flex items-center gap-2 min-w-[120px]">
                                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                                    <motion.div
                                      className="h-full rounded-full"
                                      animate={{ width: `${row.progress}%` }}
                                      transition={{ duration: 0.8 }}
                                      style={{ background: row.status === "IMPLEMENTED" ? "#22c55e" : row.status === "IN_PROGRESS" ? "#3b82f6" : "#475569" }}
                                    />
                                  </div>
                                  <span className="font-mono" style={{ color: "#64748b" }}>{row.progress}%</span>
                                </div>
                              </td>
                              <td className="py-2.5 font-mono" style={{ color: "#64748b" }}>{row.estimatedDate}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* ── 7. Policy Archive ────────────────────────────────────────── */}
            <div className="rounded-xl overflow-hidden" style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b flex-wrap gap-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} style={{ color: "#d4a017" }} />
                  <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Policy Archive</span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: "rgba(212,160,23,0.1)", color: "#d4a017" }}>{HISTORICAL_ARCHIVE.length} ENTRIES</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Search size={12} style={{ color: "#475569" }} />
                  <input
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    placeholder="Search archive..."
                    className="bg-transparent text-xs outline-none w-36"
                    style={{ color: "#e2e8f0" }}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Date", "Policy Title", "Proposed By", "Vote", "Outcome", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#475569" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArchive.map((entry, i) => {
                      const n = getNation(entry.proposingNationId);
                      const outcomeColors: Record<HistoricalOutcome, string> = {
                        APPROVED: "#22c55e",
                        REJECTED: "#ef4444",
                        WITHDRAWN: "#f59e0b",
                      };
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: "#64748b" }}>{entry.date}</td>
                          <td className="px-4 py-2.5 font-semibold" style={{ color: "#e2e8f0", maxWidth: "280px" }}>{entry.title}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{n.flag}</span>
                              <span style={{ color: "#94a3b8" }}>{n.shortName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: "#94a3b8" }}>{entry.voteCount}</td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span
                              className="font-bold font-mono px-2 py-0.5 rounded"
                              style={{
                                background: `${outcomeColors[entry.outcome]}15`,
                                color: outcomeColors[entry.outcome],
                                border: `1px solid ${outcomeColors[entry.outcome]}30`,
                              }}
                            >
                              {entry.outcome}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="text-xs" style={{ color: entry.implementationStatus === "IMPLEMENTED" ? "#22c55e" : entry.implementationStatus === "IN PROGRESS" ? "#3b82f6" : "#475569" }}>
                              {entry.implementationStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Proposal Detail Panel */}
      <AnimatePresence>
        {selectedProposal && (
          <ProposalDetailPanel
            proposal={selectedProposal}
            onClose={() => setSelectedProposalId(null)}
            onVoteChange={handleVoteChange}
          />
        )}
      </AnimatePresence>

      {/* Emergency Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <EmergencyModal
            onClose={() => setShowEmergencyModal(false)}
            onConfirm={() => { setEmergencyActive(true); setShowEmergencyModal(false); }}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
