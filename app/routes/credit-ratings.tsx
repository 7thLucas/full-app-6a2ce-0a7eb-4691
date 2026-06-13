import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Star, TrendingUp, TrendingDown, Minus, X, ChevronRight } from "lucide-react";
import { AppLayout } from "~/components/AppLayout";
import { Header } from "~/components/Header";

// ─── Types ──────────────────────────────────────────────────────────────────────

type RatingGrade =
  | "AAA" | "AA+" | "AA" | "AA-"
  | "A+" | "A" | "A-"
  | "BBB+" | "BBB" | "BBB-"
  | "BB+" | "BB" | "BB-"
  | "B+" | "B" | "B-"
  | "CCC+" | "CCC" | "CCC-";

interface RatingFactor {
  name: string;
  weight: number;
  score: number;
  label: string;
}

interface RatingHistoryEntry {
  date: string;
  grade: RatingGrade;
  trigger: string;
}

interface Nation {
  id: string;
  name: string;
  flag: string;
  grade: RatingGrade;
  score: number;
  prevScore: number;
  trend: number[];
  factors: RatingFactor[];
  history: RatingHistoryEntry[];
  rationale: string[];
  moodys: RatingGrade;
  sp: RatingGrade;
  fitch: RatingGrade;
}

interface TickerItem {
  nation: string;
  flag: string;
  action: "upgraded" | "downgraded" | "affirmed";
  from: RatingGrade;
  to: RatingGrade;
  timestamp: string;
}

// ─── Grade helpers ────────────────────────────────────────────────────────────

const GRADE_ORDER: RatingGrade[] = [
  "AAA","AA+","AA","AA-","A+","A","A-",
  "BBB+","BBB","BBB-","BB+","BB","BB-",
  "B+","B","B-","CCC+","CCC","CCC-",
];

function gradeNumeric(g: RatingGrade): number {
  return GRADE_ORDER.length - GRADE_ORDER.indexOf(g);
}

function gradeDelta(agi: RatingGrade, other: RatingGrade): number {
  return GRADE_ORDER.indexOf(other) - GRADE_ORDER.indexOf(agi);
}

function gradeColor(g: RatingGrade): string {
  const idx = GRADE_ORDER.indexOf(g);
  if (idx <= 3) return "#d4a017";   // AAA-AA- gold
  if (idx <= 6) return "#22c55e";   // A range green
  if (idx <= 9) return "#f59e0b";   // BBB range amber
  return "#ef4444";                  // BB and below red
}

function gradeBgColor(g: RatingGrade): string {
  const idx = GRADE_ORDER.indexOf(g);
  if (idx <= 3) return "rgba(212,160,23,0.12)";
  if (idx <= 6) return "rgba(34,197,94,0.12)";
  if (idx <= 9) return "rgba(245,158,11,0.12)";
  return "rgba(239,68,68,0.12)";
}

function gradeGlow(g: RatingGrade): string {
  const idx = GRADE_ORDER.indexOf(g);
  if (idx <= 3) return "0 0 18px rgba(212,160,23,0.35)";
  if (idx <= 6) return "0 0 18px rgba(34,197,94,0.25)";
  if (idx <= 9) return "0 0 18px rgba(245,158,11,0.2)";
  return "0 0 18px rgba(239,68,68,0.2)";
}

function tierLabel(g: RatingGrade): string {
  const idx = GRADE_ORDER.indexOf(g);
  if (idx <= 3) return "AAA-AA";
  if (idx <= 6) return "A";
  if (idx <= 9) return "BBB";
  if (idx <= 12) return "BB";
  if (idx <= 15) return "B";
  return "CCC";
}

// ─── Static nation data ────────────────────────────────────────────────────────

const NATIONS: Nation[] = [
  {
    id: "us", name: "United States", flag: "🇺🇸",
    grade: "AA+", score: 88, prevScore: 87,
    trend: [85,86,86,87,87,86,87,88,87,88],
    factors: [
      { name: "GDP Growth", weight: 15, score: 84, label: "2.4% YoY" },
      { name: "Inflation Rate", weight: 10, score: 72, label: "3.1% CPI" },
      { name: "Debt/GDP", weight: 15, score: 58, label: "123% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 91, label: "$3.3T" },
      { name: "Political Stability", weight: 10, score: 70, label: "Moderate" },
      { name: "Trade Balance", weight: 8, score: 55, label: "-$67B/mo" },
      { name: "Monetary Policy", weight: 12, score: 92, label: "High credibility" },
      { name: "Current Account", weight: 8, score: 54, label: "-2.9% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 52, label: "-5.8% GDP" },
      { name: "AGI Confidence", weight: 5, score: 95, label: "A+ certainty" },
    ],
    history: [
      { date: "2026-06-01", grade: "AA+", trigger: "Fiscal consolidation signal" },
      { date: "2026-03-15", grade: "AA", trigger: "Debt ceiling resolution" },
      { date: "2025-11-20", grade: "AA-", trigger: "Fed pivot confirmed" },
      { date: "2025-07-04", grade: "A+", trigger: "Strong Q2 GDP" },
      { date: "2025-02-10", grade: "A+", trigger: "Inflation baseline" },
      { date: "2024-09-30", grade: "A", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "The United States retains a AA+ rating underpinned by the world's largest reserve currency, deep capital markets, and unmatched institutional credibility of the Federal Reserve.",
      "Debt dynamics at 123% of GDP pose a structural drag, partially offset by the dollar's exorbitant privilege and robust domestic demand growth of 2.4% YoY.",
      "Political volatility around debt ceiling negotiations and fiscal gridlock introduce a modest downward bias that AGI models at 18% probability of negative revision within 12 months.",
      "Monetary policy credibility scores highest among G20 peers, reflecting the Fed's data-driven communication and effective inflation anchoring since 2024.",
      "AGI projects a stable outlook contingent on near-term fiscal path commitment; failure to address structural deficits above 5% of GDP could trigger downgrade to AA within 6 months.",
    ],
    moodys: "Aaa", sp: "AA+", fitch: "AA+",
  },
  {
    id: "eu", name: "European Union", flag: "🇪🇺",
    grade: "AA", score: 84, prevScore: 84,
    trend: [82,83,83,84,83,84,84,84,83,84],
    factors: [
      { name: "GDP Growth", weight: 15, score: 76, label: "1.8% YoY" },
      { name: "Inflation Rate", weight: 10, score: 80, label: "2.2% CPI" },
      { name: "Debt/GDP", weight: 15, score: 72, label: "91% avg" },
      { name: "Foreign Reserves", weight: 10, score: 85, label: "$1.1T ECB" },
      { name: "Political Stability", weight: 10, score: 78, label: "Moderate-High" },
      { name: "Trade Balance", weight: 8, score: 74, label: "+€18B/mo" },
      { name: "Monetary Policy", weight: 12, score: 88, label: "ECB credible" },
      { name: "Current Account", weight: 8, score: 76, label: "+2.1% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 70, label: "-3.1% GDP" },
      { name: "AGI Confidence", weight: 5, score: 88, label: "High certainty" },
    ],
    history: [
      { date: "2026-05-10", grade: "AA", trigger: "ECB rate normalization" },
      { date: "2025-12-01", grade: "AA-", trigger: "Energy transition progress" },
      { date: "2025-08-15", grade: "A+", trigger: "Banking union reform" },
      { date: "2025-03-20", grade: "A+", trigger: "Inflation convergence" },
      { date: "2024-10-05", grade: "A", trigger: "Sovereign debt stress" },
      { date: "2024-04-01", grade: "A", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "The European Union's composite credit profile benefits from deep internal market integration, a credible ECB with effective inflation control, and improving external surplus dynamics.",
      "Divergence among member states remains a structural concern, with southern periphery debt levels exceeding 140% GDP contrasting with northern core surpluses below 70%.",
      "Trade balance has turned positive at +€18B per month as the euro depreciation cycle boosted export competitiveness, supporting current account stabilization.",
      "AGI models flag moderate political fragmentation risk, particularly around European Parliament cohesion and German fiscal stance, assigned 22% probability.",
      "The EU holds stable outlook as ECB completes its rate normalization cycle and capital markets union deepens, supporting a potential upgrade to AA+ within 18 months.",
    ],
    moodys: "Aaa", sp: "AA", fitch: "AA+",
  },
  {
    id: "cn", name: "China", flag: "🇨🇳",
    grade: "A+", score: 79, prevScore: 81,
    trend: [83,82,82,81,80,80,79,79,78,79],
    factors: [
      { name: "GDP Growth", weight: 15, score: 88, label: "5.2% YoY" },
      { name: "Inflation Rate", weight: 10, score: 85, label: "0.8% CPI" },
      { name: "Debt/GDP", weight: 15, score: 62, label: "117% total" },
      { name: "Foreign Reserves", weight: 10, score: 97, label: "$3.25T" },
      { name: "Political Stability", weight: 10, score: 75, label: "Centralized" },
      { name: "Trade Balance", weight: 8, score: 92, label: "+$82B/mo" },
      { name: "Monetary Policy", weight: 12, score: 72, label: "Moderate credibility" },
      { name: "Current Account", weight: 8, score: 88, label: "+2.8% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 60, label: "-6.1% GDP" },
      { name: "AGI Confidence", weight: 5, score: 68, label: "Moderate certainty" },
    ],
    history: [
      { date: "2026-04-22", grade: "A+", trigger: "Property sector stabilization partial" },
      { date: "2026-01-10", grade: "AA-", trigger: "Real estate stress escalation" },
      { date: "2025-09-03", grade: "AA-", trigger: "PBOC stimulus package" },
      { date: "2025-05-15", grade: "AA", trigger: "Strong export data" },
      { date: "2025-01-01", grade: "AA", trigger: "New year fiscal review" },
      { date: "2024-06-20", grade: "AA", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "China's credit profile is shaped by its massive $3.25T foreign reserve buffer and persistent trade surplus, which provide extraordinary external resilience against global shocks.",
      "The ongoing property sector de-leveraging, with Evergrande and Country Garden restructurings still unresolved, continues to suppress domestic confidence and drag on banking sector quality.",
      "GDP growth at 5.2% remains structurally impressive but masks growing dependence on state-directed infrastructure spending rather than private consumption-led expansion.",
      "Monetary policy credibility scores moderate as PBoC transparency and forward guidance lag G7 central bank standards, introducing pricing uncertainty for foreign investors.",
      "AGI maintains a negative watch bias with 35% probability of further downgrade to A if property NPL ratios exceed 8% or local government financing vehicle defaults accelerate.",
    ],
    moodys: "A1", sp: "A+", fitch: "A+",
  },
  {
    id: "jp", name: "Japan", flag: "🇯🇵",
    grade: "A", score: 76, prevScore: 75,
    trend: [73,74,74,74,75,75,74,75,76,76],
    factors: [
      { name: "GDP Growth", weight: 15, score: 64, label: "1.2% YoY" },
      { name: "Inflation Rate", weight: 10, score: 70, label: "2.9% CPI" },
      { name: "Debt/GDP", weight: 15, score: 30, label: "261% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 92, label: "$1.24T" },
      { name: "Political Stability", weight: 10, score: 88, label: "High" },
      { name: "Trade Balance", weight: 8, score: 55, label: "-¥1.2T/mo" },
      { name: "Monetary Policy", weight: 12, score: 82, label: "BoJ credible" },
      { name: "Current Account", weight: 8, score: 80, label: "+3.1% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 48, label: "-6.4% GDP" },
      { name: "AGI Confidence", weight: 5, score: 85, label: "High certainty" },
    ],
    history: [
      { date: "2026-06-05", grade: "A", trigger: "BoJ rate normalization progress" },
      { date: "2026-02-14", grade: "A-", trigger: "Yen stabilization" },
      { date: "2025-10-30", grade: "A-", trigger: "Current account improvement" },
      { date: "2025-06-11", grade: "BBB+", trigger: "Debt sustainability upgrade" },
      { date: "2025-02-01", grade: "BBB+", trigger: "Abenomics legacy review" },
      { date: "2024-07-01", grade: "BBB", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "Japan's 261% debt-to-GDP ratio is the highest among G20 nations, yet uniquely offset by domestic investor captivity — over 88% of JGBs are held domestically, insulating from external shocks.",
      "Bank of Japan's exit from yield curve control and gradual rate normalization has restored monetary policy credibility, reversing the principal drag on the rating through 2024-2025.",
      "Political stability under the LDP-led coalition provides predictable governance continuity; AGI scores Japan highest among G20 for institutional resilience and rule-of-law certainty.",
      "The current account surplus at 3.1% of GDP provides meaningful external buffer despite trade balance weakness driven by energy imports and yen volatility.",
      "AGI holds a stable-to-positive outlook, with a 28% probability of upgrade to A+ if fiscal consolidation roadmap announced post-2027 election achieves primary surplus targets.",
    ],
    moodys: "A1", sp: "A+", fitch: "A",
  },
  {
    id: "gb", name: "United Kingdom", flag: "🇬🇧",
    grade: "AA-", score: 82, prevScore: 81,
    trend: [79,79,80,80,81,81,81,82,81,82],
    factors: [
      { name: "GDP Growth", weight: 15, score: 72, label: "1.7% YoY" },
      { name: "Inflation Rate", weight: 10, score: 74, label: "2.7% CPI" },
      { name: "Debt/GDP", weight: 15, score: 65, label: "101% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 80, label: "$185B" },
      { name: "Political Stability", weight: 10, score: 80, label: "Post-reform stable" },
      { name: "Trade Balance", weight: 8, score: 58, label: "-£4.2B/mo" },
      { name: "Monetary Policy", weight: 12, score: 88, label: "BoE credible" },
      { name: "Current Account", weight: 8, score: 64, label: "-2.6% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 62, label: "-4.8% GDP" },
      { name: "AGI Confidence", weight: 5, score: 90, label: "Very high certainty" },
    ],
    history: [
      { date: "2026-06-01", grade: "AA-", trigger: "Labour fiscal reset positive" },
      { date: "2026-01-20", grade: "A+", trigger: "Gilt market stabilization" },
      { date: "2025-08-10", grade: "A+", trigger: "BoE credibility restoration" },
      { date: "2025-04-01", grade: "A", trigger: "Post-Brexit adjustment" },
      { date: "2024-11-15", grade: "A", trigger: "Growth recovery signal" },
      { date: "2024-05-01", grade: "A", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "The United Kingdom benefits from its deep capital markets, independent central bank with high credibility, and status as a global financial center underpinning the AA- rating.",
      "Post-Brexit trade disruptions have partially resolved, but the current account deficit at -2.6% of GDP reflects structural import dependency that limits further upside pressure.",
      "Labour government's fiscal reset in 2026 introduced credible medium-term consolidation targets, reducing gilt risk premium and directly contributing to this upgrade cycle.",
      "Bank of England's transparent communication and effective inflation management since 2024 score among the top three G20 monetary authorities in AGI assessments.",
      "AGI assigns a stable outlook with 20% upgrade probability to AA contingent on sustained deficit reduction toward 3% GDP over the next 18 months.",
    ],
    moodys: "Aa3", sp: "AA", fitch: "AA-",
  },
  {
    id: "in", name: "India", flag: "🇮🇳",
    grade: "BBB+", score: 68, prevScore: 66,
    trend: [62,63,64,65,65,66,66,67,67,68],
    factors: [
      { name: "GDP Growth", weight: 15, score: 94, label: "7.8% YoY" },
      { name: "Inflation Rate", weight: 10, score: 68, label: "4.1% CPI" },
      { name: "Debt/GDP", weight: 15, score: 58, label: "84% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 82, label: "$648B" },
      { name: "Political Stability", weight: 10, score: 72, label: "Moderate" },
      { name: "Trade Balance", weight: 8, score: 52, label: "-$22B/mo" },
      { name: "Monetary Policy", weight: 12, score: 76, label: "RBI credible" },
      { name: "Current Account", weight: 8, score: 58, label: "-1.4% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 55, label: "-5.1% GDP" },
      { name: "AGI Confidence", weight: 5, score: 80, label: "Good certainty" },
    ],
    history: [
      { date: "2026-06-10", grade: "BBB+", trigger: "Record FDI inflows" },
      { date: "2026-02-28", grade: "BBB", trigger: "Q3 GDP beat 7.4%" },
      { date: "2025-10-01", grade: "BBB", trigger: "Digital infrastructure upgrade" },
      { date: "2025-05-20", grade: "BBB-", trigger: "Manufacturing PMI breakout" },
      { date: "2025-01-15", grade: "BBB-", trigger: "RBI credibility score" },
      { date: "2024-08-01", grade: "BBB-", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "India's 7.8% GDP growth is the highest among G20 nations, reflecting demographic dividend, digital economy expansion, and manufacturing supply chain diversification from China.",
      "The fiscal deficit at -5.1% of GDP and debt at 84% remain structural constraints, but the trajectory is improving as GST revenue collections and direct tax collections hit records.",
      "Foreign reserve adequacy at $648B provides 11 months of import cover, substantially reducing external vulnerability despite the persistent trade deficit.",
      "RBI's credibility has improved markedly since 2024 through its flexible inflation targeting framework, with CPI anchored near the 4% midpoint target.",
      "AGI projects India on a positive trend toward BBB+ to A- upgrade within 24 months if fiscal consolidation reaches 4.5% GDP deficit and banking NPA ratios decline below 3%.",
    ],
    moodys: "Baa3", sp: "BBB-", fitch: "BBB-",
  },
  {
    id: "br", name: "Brazil", flag: "🇧🇷",
    grade: "BB+", score: 54, prevScore: 55,
    trend: [57,56,56,55,55,54,54,53,54,54],
    factors: [
      { name: "GDP Growth", weight: 15, score: 70, label: "3.1% YoY" },
      { name: "Inflation Rate", weight: 10, score: 58, label: "5.8% IPCA" },
      { name: "Debt/GDP", weight: 15, score: 42, label: "93% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 72, label: "$355B" },
      { name: "Political Stability", weight: 10, score: 58, label: "Volatile" },
      { name: "Trade Balance", weight: 8, score: 74, label: "+$7.2B/mo" },
      { name: "Monetary Policy", weight: 12, score: 60, label: "BCB recovering" },
      { name: "Current Account", weight: 8, score: 50, label: "-1.8% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 38, label: "-7.2% GDP" },
      { name: "AGI Confidence", weight: 5, score: 62, label: "Moderate certainty" },
    ],
    history: [
      { date: "2026-05-15", grade: "BB+", trigger: "Fiscal framework revision" },
      { date: "2025-11-20", grade: "BB", trigger: "AGI commodities boost" },
      { date: "2025-07-01", grade: "BB", trigger: "Lula fiscal policy concern" },
      { date: "2025-02-14", grade: "BB-", trigger: "Inflation overshoot" },
      { date: "2024-09-01", grade: "BB-", trigger: "BCB rate cycle" },
      { date: "2024-03-15", grade: "B+", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "Brazil's BB+ rating reflects strong commodity export revenues — the world's top agricultural exporter — balanced against persistent fiscal imbalance at -7.2% of GDP.",
      "The Banco Central do Brasil's aggressive rate cycle, with SELIC reaching 13.25%, has partially anchored inflation at 5.8% IPCA but at significant growth cost to domestic demand.",
      "Political uncertainty under the current administration's fiscal expansion narrative continues to weigh on market confidence, with AGI assigning 30% probability of fiscal slippage.",
      "External position is well-supported by $355B foreign reserves and a robust trade surplus from agricultural and mining exports providing meaningful current account buffer.",
      "AGI maintains stable outlook at BB+ with upgrade path conditional on primary surplus delivery in 2026 budget and inflation returning within the 3.25% target band.",
    ],
    moodys: "Ba1", sp: "BB", fitch: "BB",
  },
  {
    id: "id", name: "Indonesia", flag: "🇮🇩",
    grade: "BBB", score: 65, prevScore: 64,
    trend: [61,62,62,63,63,64,64,64,65,65],
    factors: [
      { name: "GDP Growth", weight: 15, score: 82, label: "5.3% YoY" },
      { name: "Inflation Rate", weight: 10, score: 76, label: "2.8% CPI" },
      { name: "Debt/GDP", weight: 15, score: 78, label: "42% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 70, label: "$148B" },
      { name: "Political Stability", weight: 10, score: 74, label: "Stable" },
      { name: "Trade Balance", weight: 8, score: 72, label: "+$3.1B/mo" },
      { name: "Monetary Policy", weight: 12, score: 70, label: "BI credible" },
      { name: "Current Account", weight: 8, score: 68, label: "+0.4% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 72, label: "-2.8% GDP" },
      { name: "AGI Confidence", weight: 5, score: 75, label: "Good certainty" },
    ],
    history: [
      { date: "2026-04-01", grade: "BBB", trigger: "Nickel export revenue surge" },
      { date: "2025-10-15", grade: "BBB-", trigger: "EV battery supply chain" },
      { date: "2025-05-01", grade: "BBB-", trigger: "BI credibility improvement" },
      { date: "2025-01-10", grade: "BBB-", trigger: "Fiscal framework" },
      { date: "2024-08-20", grade: "BB+", trigger: "Growth acceleration" },
      { date: "2024-02-01", grade: "BB+", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "Indonesia's BBB rating is anchored by conservative fiscal management with debt-to-GDP at only 42%, one of the lowest in G20, providing substantial space for counter-cyclical spending.",
      "The transition to EV battery supply chain dominance via nickel processing has materially upgraded Indonesia's medium-term growth trajectory and export diversification profile.",
      "Bank Indonesia has maintained credibility through transparent communication and proactive rate management, keeping inflation at 2.8% well within its 2-4% target band.",
      "Demographic dividend with over 70M population entering workforce by 2030 gives Indonesia a structural growth advantage that AGI models project to sustain 5%+ GDP through decade end.",
      "AGI maintains positive outlook with upgrade probability to BBB+ at 38% within 18 months, contingent on continued current account improvement and reserve adequacy maintenance.",
    ],
    moodys: "Baa2", sp: "BBB", fitch: "BBB",
  },
  {
    id: "sa", name: "Saudi Arabia", flag: "🇸🇦",
    grade: "A", score: 77, prevScore: 76,
    trend: [72,73,73,74,74,75,75,76,76,77],
    factors: [
      { name: "GDP Growth", weight: 15, score: 74, label: "3.8% YoY" },
      { name: "Inflation Rate", weight: 10, score: 82, label: "1.9% CPI" },
      { name: "Debt/GDP", weight: 15, score: 88, label: "28% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 90, label: "$445B + PIF" },
      { name: "Political Stability", weight: 10, score: 78, label: "Centralized stable" },
      { name: "Trade Balance", weight: 8, score: 88, label: "+$16B/mo" },
      { name: "Monetary Policy", weight: 12, score: 72, label: "Peg credible" },
      { name: "Current Account", weight: 8, score: 84, label: "+3.7% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 58, label: "-2.1% non-oil" },
      { name: "AGI Confidence", weight: 5, score: 80, label: "High certainty" },
    ],
    history: [
      { date: "2026-05-20", grade: "A", trigger: "Vision 2030 milestone" },
      { date: "2025-12-10", grade: "A-", trigger: "Aramco dividend flows" },
      { date: "2025-07-01", grade: "A-", trigger: "Non-oil GDP 38% achieved" },
      { date: "2025-02-28", grade: "BBB+", trigger: "NEOM phase 1 complete" },
      { date: "2024-09-15", grade: "BBB+", trigger: "Diversification progress" },
      { date: "2024-03-01", grade: "BBB+", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "Saudi Arabia's A rating reflects its exceptional low-debt position at 28% of GDP, massive foreign reserves exceeding $445B, and a credible fiscal transformation via Vision 2030.",
      "Non-oil GDP has reached 38% of total economic output, ahead of Vision 2030 targets, demonstrating successful economic diversification beyond hydrocarbon dependency.",
      "The SAR peg to the USD maintained with $445B+ in reserves provides monetary stability, while low inflation at 1.9% supports purchasing power and business confidence.",
      "NEOM, giga-projects, and tourism sector growth contribute to structural employment creation, reducing vulnerability to oil price cycles that historically drove sovereign risk.",
      "AGI assigns a positive outlook with 32% probability of upgrade to A+ if Vision 2030 private sector employment targets are met and debt remains below 35% GDP through 2028.",
    ],
    moodys: "A1", sp: "A", fitch: "A+",
  },
  {
    id: "ru", name: "Russia", flag: "🇷🇺",
    grade: "B", score: 38, prevScore: 41,
    trend: [55,52,49,46,44,43,41,40,39,38],
    factors: [
      { name: "GDP Growth", weight: 15, score: 60, label: "2.8% official" },
      { name: "Inflation Rate", weight: 10, score: 35, label: "8.1% CPI" },
      { name: "Debt/GDP", weight: 15, score: 85, label: "20% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 30, label: "$290B (frozen)" },
      { name: "Political Stability", weight: 10, score: 22, label: "High risk" },
      { name: "Trade Balance", weight: 8, score: 58, label: "+$12B/mo" },
      { name: "Monetary Policy", weight: 12, score: 30, label: "CBR compromised" },
      { name: "Current Account", weight: 8, score: 52, label: "+3.2% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 40, label: "-5.2% GDP" },
      { name: "AGI Confidence", weight: 5, score: 20, label: "Very low certainty" },
    ],
    history: [
      { date: "2026-04-10", grade: "B", trigger: "Sanctions escalation round 8" },
      { date: "2026-01-05", grade: "B+", trigger: "Asset freeze extension" },
      { date: "2025-08-20", grade: "BB-", trigger: "War economy distortion" },
      { date: "2025-03-01", grade: "BB", trigger: "Ruble instability" },
      { date: "2024-10-15", grade: "BB+", trigger: "Geopolitical risk premium" },
      { date: "2024-04-01", grade: "BBB-", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "Russia's B rating reflects severe geopolitical isolation, with over $290B in foreign reserves frozen under Western sanctions, effectively eliminating external liquidity buffers.",
      "Despite official GDP growth of 2.8%, AGI models assign low confidence given opaque data reporting; war economy distortions, military spending at 7% of GDP, and import substitution failures mask underlying contraction.",
      "Central Bank of Russia's monetary policy credibility is severely compromised by political interference, capital controls, and forced lending to state entities at below-market rates.",
      "Structural long-term risks include brain drain of over 700,000 skilled workers since 2022, technology sanctions blocking semiconductor access, and energy infrastructure degradation.",
      "AGI assigns a negative outlook with 55% probability of further downgrade to B- or CCC+ if sanctions are not materially eased within 12 months or if energy export revenues decline below $200B annually.",
    ],
    moodys: "Withdrawn", sp: "Withdrawn", fitch: "Withdrawn",
  },
  {
    id: "kr", name: "South Korea", flag: "🇰🇷",
    grade: "AA", score: 85, prevScore: 84,
    trend: [82,82,83,83,83,84,84,84,85,85],
    factors: [
      { name: "GDP Growth", weight: 15, score: 80, label: "2.6% YoY" },
      { name: "Inflation Rate", weight: 10, score: 82, label: "2.1% CPI" },
      { name: "Debt/GDP", weight: 15, score: 80, label: "54% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 88, label: "$412B" },
      { name: "Political Stability", weight: 10, score: 72, label: "Post-crisis stable" },
      { name: "Trade Balance", weight: 8, score: 82, label: "+$5.8B/mo" },
      { name: "Monetary Policy", weight: 12, score: 86, label: "BOK credible" },
      { name: "Current Account", weight: 8, score: 84, label: "+2.8% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 75, label: "-3.8% GDP" },
      { name: "AGI Confidence", weight: 5, score: 90, label: "High certainty" },
    ],
    history: [
      { date: "2026-05-28", grade: "AA", trigger: "Semiconductor cycle recovery" },
      { date: "2026-01-15", grade: "AA-", trigger: "Political stability restored" },
      { date: "2025-09-10", grade: "A+", trigger: "Fiscal consolidation" },
      { date: "2025-04-20", grade: "A+", trigger: "Export diversification" },
      { date: "2024-11-01", grade: "A", trigger: "Constitutional crisis resolution" },
      { date: "2024-05-15", grade: "A", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "South Korea's AA rating benefits from its technological export powerhouse status — semiconductors, EVs, and display panels — generating consistent current account surpluses of 2.8% GDP.",
      "Foreign reserves at $412B provide robust cover of 8.4 months of imports, and the BOK's inflation targeting framework has successfully anchored CPI at 2.1% near the 2% target.",
      "Post-constitutional crisis political normalization in 2025 restored institutional confidence, reducing the political risk premium that had weighed on the A+ rating.",
      "The semiconductor cycle recovery since mid-2025, led by Samsung and SK Hynix HBM chip demand from AI data centers, has materially improved export revenue visibility.",
      "AGI holds a stable-to-positive outlook with 30% probability of upgrade to AA+ contingent on fiscal deficit reduction toward 2.5% GDP and tech export diversification continuation.",
    ],
    moodys: "Aa2", sp: "AA", fitch: "AA-",
  },
  {
    id: "au", name: "Australia", flag: "🇦🇺",
    grade: "AAA", score: 92, prevScore: 92,
    trend: [91,91,92,91,92,92,92,91,92,92],
    factors: [
      { name: "GDP Growth", weight: 15, score: 82, label: "2.1% YoY" },
      { name: "Inflation Rate", weight: 10, score: 78, label: "3.0% CPI" },
      { name: "Debt/GDP", weight: 15, score: 88, label: "46% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 85, label: "$62B + fx" },
      { name: "Political Stability", weight: 10, score: 92, label: "Very High" },
      { name: "Trade Balance", weight: 8, score: 88, label: "+A$8.4B/mo" },
      { name: "Monetary Policy", weight: 12, score: 88, label: "RBA credible" },
      { name: "Current Account", weight: 8, score: 82, label: "+1.8% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 80, label: "-0.8% GDP" },
      { name: "AGI Confidence", weight: 5, score: 96, label: "Very high certainty" },
    ],
    history: [
      { date: "2026-03-01", grade: "AAA", trigger: "Near-surplus budget achieved" },
      { date: "2025-08-15", grade: "AAA", trigger: "Commodity export boom" },
      { date: "2025-02-01", grade: "AAA", trigger: "Annual reaffirmation" },
      { date: "2024-09-01", grade: "AAA", trigger: "Fiscal consolidation" },
      { date: "2024-03-01", grade: "AAA", trigger: "Annual reaffirmation" },
      { date: "2023-09-01", grade: "AAA", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "Australia maintains its AAA rating anchored by exceptional institutional quality, near-surplus fiscal position at -0.8% GDP, and uninterrupted AAA status across all major rating agencies.",
      "Commodity export dominance in iron ore, LNG, and coal provides structural current account surplus resilience, though transition risk from green energy shift is factored into the medium-term outlook.",
      "Reserve Bank of Australia's credibility is among the highest in G20, with transparent governance, independent board operations, and effective CPI management since 2024.",
      "Political stability under Australia's mature democratic system scores 92/100 in AGI political risk assessment, the highest among commodity-dependent G20 members.",
      "AGI reaffirms AAA with stable outlook; downside risk at only 8% probability tied to China demand shock for iron ore exceeding 30% volume decline or domestic housing market systemic failure.",
    ],
    moodys: "Aaa", sp: "AAA", fitch: "AAA",
  },
  {
    id: "ca", name: "Canada", flag: "🇨🇦",
    grade: "AAA", score: 91, prevScore: 90,
    trend: [88,89,89,89,90,90,90,90,91,91],
    factors: [
      { name: "GDP Growth", weight: 15, score: 76, label: "1.9% YoY" },
      { name: "Inflation Rate", weight: 10, score: 82, label: "2.3% CPI" },
      { name: "Debt/GDP", weight: 15, score: 82, label: "62% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 80, label: "$104B" },
      { name: "Political Stability", weight: 10, score: 88, label: "High" },
      { name: "Trade Balance", weight: 8, score: 72, label: "+C$2.1B/mo" },
      { name: "Monetary Policy", weight: 12, score: 90, label: "BoC top credibility" },
      { name: "Current Account", weight: 8, score: 74, label: "-1.1% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 72, label: "-1.9% GDP" },
      { name: "AGI Confidence", weight: 5, score: 95, label: "Very high certainty" },
    ],
    history: [
      { date: "2026-04-10", grade: "AAA", trigger: "BoC rate normalization complete" },
      { date: "2025-09-20", grade: "AAA", trigger: "Annual reaffirmation" },
      { date: "2025-03-01", grade: "AAA", trigger: "Fiscal path confirmed" },
      { date: "2024-09-01", grade: "AAA", trigger: "Annual reaffirmation" },
      { date: "2024-03-01", grade: "AAA", trigger: "Initial AGI assessment" },
      { date: "2023-09-01", grade: "AAA", trigger: "Legacy baseline" },
    ],
    rationale: [
      "Canada's AAA rating is supported by the Bank of Canada's world-class monetary policy credibility, sound fiscal framework, and diversified commodity-plus-services export base.",
      "Debt-to-GDP at 62% remains well within AAA peer norms, and the fiscal deficit trajectory at -1.9% indicates a credible path toward primary surplus within 3 years.",
      "The Bank of Canada completed its rate normalization cycle in Q2 2026, successfully anchoring inflation at 2.3% within the 1-3% target band with minimal growth sacrifice.",
      "Canada's resource wealth in energy, minerals, and agricultural commodities provides structural export resilience insulating sovereign finances from service sector cyclicality.",
      "AGI holds a stable AAA with only 5% downside probability, contingent on housing market correction depth; a 40%+ nominal price decline scenario could temporarily impair banking sector capital.",
    ],
    moodys: "Aaa", sp: "AAA", fitch: "AAA",
  },
  {
    id: "mx", name: "Mexico", flag: "🇲🇽",
    grade: "BBB-", score: 61, prevScore: 62,
    trend: [64,64,63,63,62,62,62,61,61,61],
    factors: [
      { name: "GDP Growth", weight: 15, score: 70, label: "2.2% YoY" },
      { name: "Inflation Rate", weight: 10, score: 62, label: "4.7% CPI" },
      { name: "Debt/GDP", weight: 15, score: 68, label: "58% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 72, label: "$222B" },
      { name: "Political Stability", weight: 10, score: 56, label: "Moderate risk" },
      { name: "Trade Balance", weight: 8, score: 62, label: "-$1.8B/mo" },
      { name: "Monetary Policy", weight: 12, score: 70, label: "Banxico credible" },
      { name: "Current Account", weight: 8, score: 60, label: "-1.2% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 48, label: "-4.8% GDP" },
      { name: "AGI Confidence", weight: 5, score: 68, label: "Moderate certainty" },
    ],
    history: [
      { date: "2026-05-05", grade: "BBB-", trigger: "Judicial reform concern" },
      { date: "2025-11-15", grade: "BBB", trigger: "Nearshoring boost" },
      { date: "2025-06-01", grade: "BBB", trigger: "Remittance record" },
      { date: "2025-01-20", grade: "BBB", trigger: "Banxico rate cut cycle" },
      { date: "2024-08-10", grade: "BBB+", trigger: "Nearshoring investment" },
      { date: "2024-02-01", grade: "BBB+", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "Mexico's BBB- rating reflects the tension between its nearshoring windfall from US-China supply chain bifurcation and growing institutional risks from judicial and energy sector reforms.",
      "The judicial reform of 2025 introducing popular election of judges has reduced rule-of-law certainty scores, increasing investor risk premiums and contributing to this watch-negative stance.",
      "Nearshoring FDI remains strong at $36B annually, supporting manufacturing sector growth and employment creation that partially offsets political governance concerns.",
      "Banxico's credibility score has improved as the rate cutting cycle proceeded predictably and inflation returned within the 3-5% tolerance band after 2025 overshoot.",
      "AGI assigns a negative watch with 40% probability of downgrade to BB+ if energy sector nationalization advances or rule-of-law metrics deteriorate further in 2026 Q3 assessment.",
    ],
    moodys: "Baa2", sp: "BBB", fitch: "BBB-",
  },
  {
    id: "ar", name: "Argentina", flag: "🇦🇷",
    grade: "CCC+", score: 22, prevScore: 19,
    trend: [14,15,16,17,17,18,18,19,21,22],
    factors: [
      { name: "GDP Growth", weight: 15, score: 58, label: "4.2% recovery" },
      { name: "Inflation Rate", weight: 10, score: 15, label: "48% CPI" },
      { name: "Debt/GDP", weight: 15, score: 22, label: "145% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 18, label: "$27B net neg" },
      { name: "Political Stability", weight: 10, score: 52, label: "Reform volatile" },
      { name: "Trade Balance", weight: 8, score: 58, label: "+$2.1B/mo" },
      { name: "Monetary Policy", weight: 12, score: 25, label: "BCRA rebuilding" },
      { name: "Current Account", weight: 8, score: 40, label: "+0.8% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 48, label: "+0.2% surplus" },
      { name: "AGI Confidence", weight: 5, score: 35, label: "Low certainty" },
    ],
    history: [
      { date: "2026-06-01", grade: "CCC+", trigger: "Primary surplus achieved" },
      { date: "2025-12-15", grade: "CCC", trigger: "IMF tranche approval" },
      { date: "2025-07-10", grade: "CC", trigger: "Milei shock therapy Q2" },
      { date: "2025-02-01", grade: "CC", trigger: "Debt restructuring progress" },
      { date: "2024-09-01", grade: "SD", trigger: "Technical default exit" },
      { date: "2024-03-01", grade: "SD", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "Argentina's CCC+ rating marks meaningful recovery from selective default in 2024, driven by Milei administration's shock therapy producing the first primary budget surplus in over a decade.",
      "Inflation at 48% CPI remains critically elevated despite rapid deceleration from 300%+ peak in 2024, and BCRA's credibility rebuilding process is fragile and prone to reversal.",
      "Debt at 145% of GDP with negative net international reserves creates existential refinancing risk; near-term IMF program continuity is the single most important rating factor.",
      "The trade surplus provides a marginal current account anchor, but reserves remain critically insufficient for any meaningful exchange rate defense or capital account liberalization.",
      "AGI projects continued upgrade trajectory with 45% probability of reaching CCC or B- within 12 months if IMF program stays on track and inflation decelerates below 30% annually.",
    ],
    moodys: "Ca", sp: "CCC+", fitch: "CC",
  },
  {
    id: "za", name: "South Africa", flag: "🇿🇦",
    grade: "BB-", score: 46, prevScore: 45,
    trend: [43,43,44,44,45,44,45,45,45,46],
    factors: [
      { name: "GDP Growth", weight: 15, score: 52, label: "1.4% YoY" },
      { name: "Inflation Rate", weight: 10, score: 65, label: "4.4% CPI" },
      { name: "Debt/GDP", weight: 15, score: 48, label: "74% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 58, label: "$61B" },
      { name: "Political Stability", weight: 10, score: 52, label: "Post-GNU fragile" },
      { name: "Trade Balance", weight: 8, score: 55, label: "+R2.1B/mo" },
      { name: "Monetary Policy", weight: 12, score: 68, label: "SARB credible" },
      { name: "Current Account", weight: 8, score: 50, label: "-1.6% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 38, label: "-5.8% GDP" },
      { name: "AGI Confidence", weight: 5, score: 60, label: "Moderate certainty" },
    ],
    history: [
      { date: "2026-05-01", grade: "BB-", trigger: "GNU reform momentum" },
      { date: "2025-10-20", grade: "BB-", trigger: "Load-shedding end milestone" },
      { date: "2025-05-10", grade: "BB", trigger: "Eskom restructuring" },
      { date: "2025-01-01", grade: "BB-", trigger: "Power crisis peak passed" },
      { date: "2024-08-01", grade: "BB-", trigger: "GNU formation" },
      { date: "2024-02-01", grade: "B+", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "South Africa's BB- rating reflects structural challenges including 33% unemployment, infrastructure deficit, and fiscal deterioration, partially offset by SARB credibility and mineral wealth.",
      "The Government of National Unity formed in 2024 has improved governance confidence, but reform implementation pace on energy, logistics, and state-owned enterprise remains slow.",
      "Eskom load-shedding elimination milestone in 2025 removed the single largest growth constraint, with AGI models projecting a 0.8% annual growth uplift from energy reliability.",
      "South African Reserve Bank maintains above-average G20 credibility scores through independent governance, transparent communication, and successful inflation targeting.",
      "AGI assigns a neutral outlook with 28% upgrade probability to BB if fiscal consolidation delivers below 5% deficit by 2027 and platinum group metals export revenues sustain current levels.",
    ],
    moodys: "Ba2", sp: "BB-", fitch: "BB-",
  },
  {
    id: "tr", name: "Turkey", flag: "🇹🇷",
    grade: "BB-", score: 48, prevScore: 46,
    trend: [40,40,42,43,44,44,45,46,47,48],
    factors: [
      { name: "GDP Growth", weight: 15, score: 82, label: "4.8% YoY" },
      { name: "Inflation Rate", weight: 10, score: 28, label: "38% CPI" },
      { name: "Debt/GDP", weight: 15, score: 74, label: "41% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 50, label: "$138B gross" },
      { name: "Political Stability", weight: 10, score: 55, label: "Presidential risk" },
      { name: "Trade Balance", weight: 8, score: 42, label: "-$7.1B/mo" },
      { name: "Monetary Policy", weight: 12, score: 52, label: "CBRT rebuilding" },
      { name: "Current Account", weight: 8, score: 40, label: "-3.2% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 60, label: "-4.2% GDP" },
      { name: "AGI Confidence", weight: 5, score: 58, label: "Moderate certainty" },
    ],
    history: [
      { date: "2026-06-05", grade: "BB-", trigger: "Orthodox monetary policy" },
      { date: "2025-11-20", grade: "B+", trigger: "CBRT credibility score" },
      { date: "2025-06-01", grade: "B+", trigger: "Rate normalization" },
      { date: "2025-01-15", grade: "B", trigger: "Post-election orthodoxy" },
      { date: "2024-08-01", grade: "B-", trigger: "Inflation peak" },
      { date: "2024-02-01", grade: "B-", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "Turkey's BB- rating reflects the Central Bank of the Republic of Turkey's return to orthodox monetary policy since 2024, which has begun anchoring inflation expectations after years of heterodox experimentation.",
      "Inflation at 38% CPI, while sharply down from 85% peak in 2024, remains the primary credit constraint, and CBRT credibility rebuilding is at an early stage vulnerable to policy reversal.",
      "Strong GDP growth at 4.8% reflects the underlying dynamism of Turkey's young population, diversified industrial base, and strategic geographic positioning between European and Middle Eastern markets.",
      "The current account deficit at -3.2% of GDP driven by energy imports and tourism seasonality creates external financing needs that elevate vulnerability to global risk-off episodes.",
      "AGI holds positive outlook with 38% probability of upgrade to BB if inflation decelerates below 20% by year-end and CBRT independence is constitutionally reinforced.",
    ],
    moodys: "B1", sp: "B+", fitch: "BB-",
  },
  {
    id: "de", name: "Germany", flag: "🇩🇪",
    grade: "AAA", score: 94, prevScore: 93,
    trend: [91,91,92,92,92,93,93,93,94,94],
    factors: [
      { name: "GDP Growth", weight: 15, score: 70, label: "1.4% YoY" },
      { name: "Inflation Rate", weight: 10, score: 86, label: "1.8% CPI" },
      { name: "Debt/GDP", weight: 15, score: 86, label: "64% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 90, label: "€285B Bundesbank" },
      { name: "Political Stability", weight: 10, score: 92, label: "Very High" },
      { name: "Trade Balance", weight: 8, score: 94, label: "+€20.2B/mo" },
      { name: "Monetary Policy", weight: 12, score: 92, label: "ECB + Bundesbank" },
      { name: "Current Account", weight: 8, score: 92, label: "+5.8% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 88, label: "+0.4% surplus" },
      { name: "AGI Confidence", weight: 5, score: 97, label: "Very high certainty" },
    ],
    history: [
      { date: "2026-05-15", grade: "AAA", trigger: "Fiscal surplus achieved" },
      { date: "2025-10-01", grade: "AAA", trigger: "Annual reaffirmation" },
      { date: "2025-04-01", grade: "AAA", trigger: "Defence investment managed" },
      { date: "2024-10-01", grade: "AAA", trigger: "Annual reaffirmation" },
      { date: "2024-04-01", grade: "AAA", trigger: "Initial AGI assessment" },
      { date: "2023-10-01", grade: "AAA", trigger: "Legacy baseline" },
    ],
    rationale: [
      "Germany holds the highest AGI score among G20 nations at 94, reflecting fiscal surplus, the world's second-largest current account surplus at 5.8% GDP, and unmatched institutional credibility.",
      "The Bundesbank tradition of price stability embedded in ECB governance provides Germany with monetary policy credibility amplified beyond its domestic economy.",
      "Trade surplus at +€20.2B per month reflects German engineering export dominance in machinery, vehicles, and chemical sectors, insulating sovereign finances from internal demand cyclicality.",
      "Debt-to-GDP at 64% is exceptionally well-managed for a G7 economy, and Germany's constitutional Schuldenbremse (debt brake) provides a legal commitment to fiscal discipline.",
      "AGI reaffirms AAA with stable outlook; the only material risk at 12% probability is prolonged industrial competitiveness erosion from energy costs relative to US and Chinese manufacturing rivals.",
    ],
    moodys: "Aaa", sp: "AAA", fitch: "AAA",
  },
  {
    id: "fr", name: "France", flag: "🇫🇷",
    grade: "AA-", score: 80, prevScore: 80,
    trend: [78,79,79,79,80,80,80,80,80,80],
    factors: [
      { name: "GDP Growth", weight: 15, score: 74, label: "1.6% YoY" },
      { name: "Inflation Rate", weight: 10, score: 82, label: "2.0% CPI" },
      { name: "Debt/GDP", weight: 15, score: 62, label: "112% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 82, label: "€246B" },
      { name: "Political Stability", weight: 10, score: 72, label: "Cohabitation stable" },
      { name: "Trade Balance", weight: 8, score: 65, label: "-€7.2B/mo" },
      { name: "Monetary Policy", weight: 12, score: 88, label: "ECB credible" },
      { name: "Current Account", weight: 8, score: 68, label: "-0.8% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 52, label: "-5.1% GDP" },
      { name: "AGI Confidence", weight: 5, score: 85, label: "High certainty" },
    ],
    history: [
      { date: "2026-04-20", grade: "AA-", trigger: "Fiscal pact progress" },
      { date: "2025-10-10", grade: "A+", trigger: "Cohabitation stability" },
      { date: "2025-05-01", grade: "A+", trigger: "Structural reform" },
      { date: "2025-01-01", grade: "A+", trigger: "Austerity package" },
      { date: "2024-07-20", grade: "A", trigger: "Political fragmentation" },
      { date: "2024-01-15", grade: "A", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "France's AA- rating reflects a tension between structural economic strengths — luxury goods, aerospace, and energy giant exports — and one of the G20's highest structural fiscal deficits at -5.1% GDP.",
      "Debt-to-GDP at 112% exceeds the EU stability pact's 60% threshold significantly, and reducing it without triggering recessionary dynamics in a low-growth environment remains the central challenge.",
      "The current cohabitation political arrangement has produced a functional if slow-moving fiscal pact commitment, reducing the probability of disorderly debt accumulation scenarios.",
      "ECB shared monetary policy provides France with interest rate conditions optimized for the euro area rather than France alone, which introduces periodic tension with domestic growth needs.",
      "AGI holds stable outlook at AA- with 15% upgrade probability to AA if the medium-term fiscal framework achieves below 4% deficit by 2027, and 20% downgrade probability if political deadlock resumes.",
    ],
    moodys: "Aa2", sp: "AA-", fitch: "AA-",
  },
  {
    id: "it", name: "Italy", flag: "🇮🇹",
    grade: "BBB", score: 63, prevScore: 62,
    trend: [59,60,60,61,61,62,62,62,63,63],
    factors: [
      { name: "GDP Growth", weight: 15, score: 65, label: "1.0% YoY" },
      { name: "Inflation Rate", weight: 10, score: 80, label: "2.2% CPI" },
      { name: "Debt/GDP", weight: 15, score: 35, label: "139% ratio" },
      { name: "Foreign Reserves", weight: 10, score: 72, label: "€168B" },
      { name: "Political Stability", weight: 10, score: 68, label: "Coalition stable" },
      { name: "Trade Balance", weight: 8, score: 74, label: "+€4.8B/mo" },
      { name: "Monetary Policy", weight: 12, score: 85, label: "ECB credible" },
      { name: "Current Account", weight: 8, score: 72, label: "+1.8% GDP" },
      { name: "Fiscal Deficit", weight: 7, score: 55, label: "-4.4% GDP" },
      { name: "AGI Confidence", weight: 5, score: 72, label: "Good certainty" },
    ],
    history: [
      { date: "2026-05-25", grade: "BBB", trigger: "PNRR fund utilization" },
      { date: "2025-11-01", grade: "BBB-", trigger: "Deficit below 5% achieved" },
      { date: "2025-06-15", grade: "BBB-", trigger: "ECB support" },
      { date: "2025-02-01", grade: "BBB-", trigger: "Meloni fiscal stability" },
      { date: "2024-09-10", grade: "BB+", trigger: "BTP-Bund spread compression" },
      { date: "2024-03-01", grade: "BB+", trigger: "Initial AGI assessment" },
    ],
    rationale: [
      "Italy's BBB rating reflects steady improvement from BB+ as the Meloni government demonstrated fiscal constraint, reducing the deficit below 5% GDP and ECB continued backstop support via TPI.",
      "Debt at 139% of GDP is structurally elevated but manageable given ECB's Transmission Protection Instrument, which effectively caps the BTP-Bund spread at levels consistent with debt sustainability.",
      "EU's PNRR recovery fund utilization has accelerated, delivering infrastructure and digitalization investments that support Italy's sluggish potential growth rate of approximately 0.7% annually.",
      "The current account surplus at 1.8% GDP has strengthened, driven by luxury goods, machinery exports, and tourism recovery to pre-pandemic levels, providing external position improvement.",
      "AGI holds stable outlook at BBB with 22% upgrade probability to BBB+ conditional on deficit path reaching 3.5% GDP by 2027 and PNRR implementation milestones being met on schedule.",
    ],
    moodys: "Baa3", sp: "BBB", fitch: "BBB",
  },
];

// Sort nations by score descending
const SORTED_NATIONS = [...NATIONS].sort((a, b) => b.score - a.score);

// ─── Ticker data ──────────────────────────────────────────────────────────────

const INITIAL_TICKER: TickerItem[] = [
  { nation: "India", flag: "🇮🇳", action: "upgraded", from: "BBB", to: "BBB+", timestamp: "09:14:22" },
  { nation: "South Korea", flag: "🇰🇷", action: "upgraded", from: "AA-", to: "AA", timestamp: "09:12:05" },
  { nation: "Germany", flag: "🇩🇪", action: "affirmed", from: "AAA", to: "AAA", timestamp: "09:10:00" },
  { nation: "Russia", flag: "🇷🇺", action: "downgraded", from: "B+", to: "B", timestamp: "09:08:44" },
  { nation: "Argentina", flag: "🇦🇷", action: "upgraded", from: "CCC", to: "CCC+", timestamp: "09:06:30" },
  { nation: "Turkey", flag: "🇹🇷", action: "upgraded", from: "B+", to: "BB-", timestamp: "09:04:15" },
  { nation: "Australia", flag: "🇦🇺", action: "affirmed", from: "AAA", to: "AAA", timestamp: "09:02:01" },
  { nation: "China", flag: "🇨🇳", action: "downgraded", from: "AA-", to: "A+", timestamp: "08:58:33" },
  { nation: "Brazil", flag: "🇧🇷", action: "downgraded", from: "BBB-", to: "BB+", timestamp: "08:55:10" },
  { nation: "United Kingdom", flag: "🇬🇧", action: "upgraded", from: "A+", to: "AA-", timestamp: "08:52:00" },
];

// ─── Distribution chart data ──────────────────────────────────────────────────

function buildDistribution(nations: Nation[]) {
  const tiers = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"];
  return tiers.map((tier) => ({
    tier,
    count: nations.filter((n) => tierLabel(n.grade) === tier).length,
    color: tier === "AAA" || tier === "AA" ? "#d4a017"
      : tier === "A" ? "#22c55e"
      : tier === "BBB" ? "#f59e0b"
      : tier === "BB" ? "#fb923c"
      : tier === "B" ? "#ef4444"
      : "#dc2626",
  }));
}

// ─── World map component ──────────────────────────────────────────────────────

// Simplified SVG world map with approximate nation paths
const MAP_REGIONS: { id: string; d: string; label: string }[] = [
  { id: "us", label: "US", d: "M 95 135 L 145 135 L 150 160 L 120 175 L 90 165 Z" },
  { id: "ca", label: "CA", d: "M 90 90 L 155 90 L 155 130 L 90 130 Z" },
  { id: "mx", label: "MX", d: "M 100 175 L 140 175 L 145 200 L 115 205 Z" },
  { id: "br", label: "BR", d: "M 155 195 L 200 195 L 205 240 L 160 245 L 148 225 Z" },
  { id: "ar", label: "AR", d: "M 158 245 L 195 245 L 192 285 L 163 288 Z" },
  { id: "gb", label: "UK", d: "M 248 105 L 258 105 L 258 120 L 248 120 Z" },
  { id: "fr", label: "FR", d: "M 255 118 L 275 118 L 275 135 L 255 135 Z" },
  { id: "de", label: "DE", d: "M 272 108 L 290 108 L 290 125 L 272 125 Z" },
  { id: "it", label: "IT", d: "M 268 130 L 282 130 L 285 152 L 268 148 Z" },
  { id: "eu", label: "EU", d: "M 256 100 L 298 100 L 302 140 L 256 140 Z" },
  { id: "ru", label: "RU", d: "M 295 85 L 420 85 L 420 130 L 295 130 Z" },
  { id: "tr", label: "TR", d: "M 295 132 L 330 132 L 330 148 L 295 148 Z" },
  { id: "sa", label: "SA", d: "M 308 148 L 338 148 L 338 175 L 308 175 Z" },
  { id: "za", label: "ZA", d: "M 285 220 L 308 220 L 308 255 L 285 255 Z" },
  { id: "in", label: "IN", d: "M 352 148 L 385 148 L 388 195 L 352 195 Z" },
  { id: "cn", label: "CN", d: "M 385 110 L 440 110 L 445 162 L 385 165 Z" },
  { id: "jp", label: "JP", d: "M 445 115 L 460 115 L 460 145 L 445 145 Z" },
  { id: "kr", label: "KR", d: "M 440 140 L 455 140 L 455 155 L 440 155 Z" },
  { id: "id", label: "ID", d: "M 400 195 L 450 195 L 455 215 L 400 215 Z" },
  { id: "au", label: "AU", d: "M 415 225 L 468 225 L 468 270 L 415 270 Z" },
];

function WorldMap({ nations, onHover }: {
  nations: Nation[];
  onHover: (n: Nation | null, x: number, y: number) => void;
}) {
  const nationMap = new Map(nations.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 560 310"
      className="w-full"
      style={{ background: "transparent" }}
    >
      {/* Ocean background */}
      <rect x="0" y="0" width="560" height="310" fill="#080e1f" rx="8" />
      {/* Grid lines */}
      {[80,120,160,200,240,280].map((y) => (
        <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      ))}
      {[100,200,300,400,500].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="310" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      ))}

      {MAP_REGIONS.map((region) => {
        const nation = nationMap.get(region.id);
        const color = nation ? gradeColor(nation.grade) : "#1e293b";
        const fillOpacity = nation ? 0.7 : 0.3;

        return (
          <g key={region.id}>
            <path
              d={region.d}
              fill={color}
              fillOpacity={fillOpacity}
              stroke={color}
              strokeWidth="1"
              strokeOpacity={0.8}
              style={{ cursor: nation ? "pointer" : "default", transition: "fill-opacity 0.2s" }}
              onMouseEnter={(e) => {
                if (nation) {
                  const rect = (e.currentTarget as SVGPathElement).getBoundingClientRect();
                  onHover(nation, rect.x + rect.width / 2, rect.y);
                }
              }}
              onMouseLeave={() => onHover(null, 0, 0)}
            />
            <text
              x={0}
              y={0}
              fontSize="7"
              fill="rgba(255,255,255,0.6)"
              textAnchor="middle"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              <textPath href={`#path-${region.id}`} startOffset="50%">
                {region.label}
              </textPath>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
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
        opacity={0.9}
      />
    </svg>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CreditRatings() {
  const [selectedNation, setSelectedNation] = useState<Nation | null>(null);
  const [ticker, setTicker] = useState<TickerItem[]>(INITIAL_TICKER);
  const [hoveredMapNation, setHoveredMapNation] = useState<Nation | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [pulsingNations, setPulsingNations] = useState<Set<string>>(new Set());
  const [nations, setNations] = useState<Nation[]>(SORTED_NATIONS);
  const tickerRef = useRef<HTMLDivElement>(null);
  const distribution = buildDistribution(nations);

  // Ticker scroll animation
  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    let frame: number;
    let pos = 0;
    const speed = 0.6;

    function animate() {
      pos += speed;
      if (pos >= el!.scrollWidth / 2) pos = 0;
      el!.scrollLeft = pos;
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [ticker]);

  // Periodic rating updates every 8s
  useEffect(() => {
    const updateActions: Array<{ nationId: string; delta: -1 | 1 | 0 }> = [
      { nationId: "in", delta: 1 },
      { nationId: "tr", delta: 1 },
      { nationId: "ar", delta: 1 },
      { nationId: "ru", delta: -1 },
      { nationId: "cn", delta: -1 },
      { nationId: "br", delta: 0 },
    ];

    let actionIndex = 0;

    const interval = setInterval(() => {
      const action = updateActions[actionIndex % updateActions.length];
      actionIndex++;

      setNations((prev) => {
        const nation = prev.find((n) => n.id === action.nationId);
        if (!nation) return prev;
        const currentIdx = GRADE_ORDER.indexOf(nation.grade);
        const newIdx = Math.max(0, Math.min(GRADE_ORDER.length - 1, currentIdx - action.delta));
        const newGrade = GRADE_ORDER[newIdx];
        const newScore = Math.max(0, Math.min(100, nation.score + action.delta * 1));

        if (newGrade === nation.grade) return prev;

        // Add to ticker
        const tickerEntry: TickerItem = {
          nation: nation.name,
          flag: nation.flag,
          action: action.delta > 0 ? "upgraded" : action.delta < 0 ? "downgraded" : "affirmed",
          from: nation.grade,
          to: newGrade,
          timestamp: new Date().toTimeString().slice(0, 8),
        };
        setTicker((t) => [tickerEntry, ...t.slice(0, 19)]);

        // Pulse the card
        setPulsingNations((s) => new Set([...s, action.nationId]));
        setTimeout(() => {
          setPulsingNations((s) => { const ns = new Set(s); ns.delete(action.nationId); return ns; });
        }, 1200);

        return prev.map((n) =>
          n.id === action.nationId
            ? { ...n, grade: newGrade, score: newScore, prevScore: n.score }
            : n
        ).sort((a, b) => b.score - a.score);
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  function handleMapHover(nation: Nation | null, x: number, y: number) {
    setHoveredMapNation(nation);
    setTooltipPos({ x, y });
  }

  // Agency grade numeric for delta
  function agencyGradeDelta(agiGrade: RatingGrade, other: string): number {
    const otherMap: Record<string, RatingGrade> = {
      "Aaa": "AAA", "Aa1": "AA+", "Aa2": "AA", "Aa3": "AA-",
      "A1": "A+", "A2": "A", "A3": "A-",
      "Baa1": "BBB+", "Baa2": "BBB", "Baa3": "BBB-",
      "Ba1": "BB+", "Ba2": "BB", "Ba3": "BB-",
      "B1": "B+", "B2": "B", "B3": "B-",
      "Ca": "CCC+", "C": "CCC",
    };
    const mapped = otherMap[other] ?? (other as RatingGrade);
    return GRADE_ORDER.indexOf(mapped) - GRADE_ORDER.indexOf(agiGrade);
  }

  const avgDelta = (n: Nation) => {
    const mD = agencyGradeDelta(n.grade, n.moodys);
    const sD = agencyGradeDelta(n.grade, n.sp);
    const fD = agencyGradeDelta(n.grade, n.fitch);
    const validDeltas = [mD, sD, fD].filter((d) => !isNaN(d));
    if (validDeltas.length === 0) return 0;
    return validDeltas.reduce((a, b) => a + b, 0) / validDeltas.length;
  };

  return (
    <AppLayout>
      <Header
        title="Sovereign Credit Rating Engine"
        subtitle="AGI-Powered Continuous Credit Assessment — 20 G20 Nations"
      />

      <div className="flex-1 p-6 space-y-6" style={{ background: "#080e1f" }}>

        {/* ── 1. Rating Change Ticker ─────────────────────────────────────── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#0d1426", border: "1px solid rgba(59,130,246,0.25)" }}
        >
          <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ borderColor: "rgba(59,130,246,0.15)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#3b82f6" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#3b82f6" }}>LIVE RATING FEED</span>
            </div>
            <span className="text-xs" style={{ color: "#475569" }}>AGI updates continuously · Legacy agencies update quarterly</span>
          </div>
          <div
            ref={tickerRef}
            className="flex items-center gap-0 overflow-hidden whitespace-nowrap py-2 px-2"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Duplicate for seamless loop */}
            {[...ticker, ...ticker].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-4 border-r" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <span className="text-base">{item.flag}</span>
                <span className="text-xs font-semibold" style={{ color: "#e2e8f0" }}>{item.nation}</span>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: item.action === "upgraded" ? "rgba(34,197,94,0.15)" : item.action === "downgraded" ? "rgba(239,68,68,0.15)" : "rgba(148,163,184,0.1)",
                    color: item.action === "upgraded" ? "#22c55e" : item.action === "downgraded" ? "#ef4444" : "#94a3b8",
                  }}
                >
                  {item.action === "upgraded" ? "▲" : item.action === "downgraded" ? "▼" : "—"} {item.from} → {item.to}
                </span>
                <span className="text-xs font-mono" style={{ color: "#475569" }}>by AGI</span>
                <span className="text-xs font-mono" style={{ color: "#334155" }}>{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. Live Rating Board ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star size={16} style={{ color: "#d4a017" }} />
            <h2 className="text-sm font-bold tracking-wider uppercase" style={{ color: "#e2e8f0" }}>Live Rating Board</h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono ml-1" style={{ background: "rgba(212,160,23,0.1)", color: "#d4a017" }}>
              {nations.length} NATIONS
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              {[["AAA-AA", "#d4a017"], ["A", "#22c55e"], ["BBB", "#f59e0b"], ["BB-CCC", "#ef4444"]].map(([label, color]) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-xs" style={{ color: "#64748b" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {nations.map((nation, rank) => {
              const isPulsing = pulsingNations.has(nation.id);
              const trendDelta = nation.score - nation.prevScore;
              const gc = gradeColor(nation.grade);

              return (
                <motion.div
                  key={nation.id}
                  layout
                  animate={isPulsing ? {
                    boxShadow: [gradeGlow(nation.grade), "0 0 40px rgba(255,255,255,0.3)", gradeGlow(nation.grade)],
                    scale: [1, 1.03, 1],
                  } : { scale: 1 }}
                  transition={{ duration: 0.6 }}
                  onClick={() => setSelectedNation(nation)}
                  className="rounded-xl p-4 cursor-pointer transition-all duration-200"
                  style={{
                    background: "#0d1426",
                    border: `1px solid ${gc}30`,
                    boxShadow: isPulsing ? gradeGlow(nation.grade) : "none",
                  }}
                >
                  {/* Rank + flag */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold" style={{ color: "#334155" }}>#{rank + 1}</span>
                    <span className="text-xl">{nation.flag}</span>
                  </div>

                  {/* Name */}
                  <div className="text-xs font-semibold mb-2 truncate" style={{ color: "#e2e8f0" }}>
                    {nation.name}
                  </div>

                  {/* Grade badge */}
                  <div
                    className="text-lg font-black font-mono text-center py-1.5 rounded-lg mb-2"
                    style={{
                      background: gradeBgColor(nation.grade),
                      color: gc,
                      border: `1px solid ${gc}40`,
                    }}
                  >
                    {nation.grade}
                  </div>

                  {/* Score + trend */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-black font-mono" style={{ color: gc }}>
                      {nation.score}
                    </span>
                    <div className="flex items-center gap-1">
                      {trendDelta > 0 ? (
                        <TrendingUp size={12} style={{ color: "#22c55e" }} />
                      ) : trendDelta < 0 ? (
                        <TrendingDown size={12} style={{ color: "#ef4444" }} />
                      ) : (
                        <Minus size={12} style={{ color: "#64748b" }} />
                      )}
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: trendDelta > 0 ? "#22c55e" : trendDelta < 0 ? "#ef4444" : "#64748b" }}
                      >
                        {trendDelta > 0 ? `+${trendDelta}` : trendDelta}
                      </span>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <MiniSparkline data={nation.trend} color={gc} />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── 3. Bottom row: Distribution + Heat Map ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Rating Distribution Chart */}
          <div className="rounded-xl" style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#e2e8f0" }}>
                Rating Distribution
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Nations per grade tier</p>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={distribution} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <XAxis
                    dataKey="tier"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#475569", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0d1426",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    formatter={(value: number) => [`${value} nations`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Global Credit Heat Map */}
          <div className="rounded-xl" style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#e2e8f0" }}>
                Global Credit Heat Map
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Hover nations for details</p>
            </div>
            <div className="p-4 relative">
              <WorldMap nations={nations} onHover={handleMapHover} />
              {hoveredMapNation && (
                <div
                  className="absolute z-20 px-3 py-2 rounded-lg text-xs pointer-events-none"
                  style={{
                    background: "#0d1426",
                    border: `1px solid ${gradeColor(hoveredMapNation.grade)}50`,
                    top: 8,
                    right: 8,
                    minWidth: 140,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{hoveredMapNation.flag}</span>
                    <span className="font-semibold" style={{ color: "#e2e8f0" }}>{hoveredMapNation.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-black font-mono text-sm px-1.5 py-0.5 rounded"
                      style={{ color: gradeColor(hoveredMapNation.grade), background: gradeBgColor(hoveredMapNation.grade) }}
                    >
                      {hoveredMapNation.grade}
                    </span>
                    <span className="font-mono font-bold" style={{ color: gradeColor(hoveredMapNation.grade) }}>
                      {hoveredMapNation.score}/100
                    </span>
                  </div>
                </div>
              )}
              {/* Legend */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {[["AAA-AA", "#d4a017"], ["A", "#22c55e"], ["BBB", "#f59e0b"], ["BB", "#fb923c"], ["B-CCC", "#ef4444"]].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm" style={{ background: color, opacity: 0.7 }} />
                    <span className="text-xs" style={{ color: "#64748b" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Agency Comparison Table ───────────────────────────────────── */}
        <div className="rounded-xl" style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#e2e8f0" }}>
                Agency Comparison Matrix
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                AGI updates continuously. Legacy agencies update quarterly.
              </p>
            </div>
            <span
              className="text-xs font-bold px-2 py-1 rounded font-mono"
              style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}
            >
              AGI vs MOODY'S vs S&P vs FITCH
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Nation", "AGI Grade", "AGI Score", "Moody's", "S&P", "Fitch", "AGI vs Avg Delta"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "#475569" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nations.map((nation, i) => {
                  const delta = avgDelta(nation);
                  const deltaFormatted = delta === 0 ? "EQUAL" : delta > 0 ? `AGI +${delta.toFixed(1)} ABOVE` : `AGI ${delta.toFixed(1)} BELOW`;
                  const deltaColor = delta > 0.5 ? "#22c55e" : delta < -0.5 ? "#ef4444" : "#94a3b8";

                  return (
                    <tr
                      key={nation.id}
                      onClick={() => setSelectedNation(nation)}
                      className="cursor-pointer transition-colors"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)")}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{nation.flag}</span>
                          <span className="font-semibold" style={{ color: "#e2e8f0" }}>{nation.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="font-black font-mono text-sm px-2 py-0.5 rounded"
                          style={{ color: gradeColor(nation.grade), background: gradeBgColor(nation.grade) }}
                        >
                          {nation.grade}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold" style={{ color: gradeColor(nation.grade) }}>
                        {nation.score}
                      </td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: "#94a3b8" }}>{nation.moodys}</td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: "#94a3b8" }}>{nation.sp}</td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: "#94a3b8" }}>{nation.fitch}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="font-bold font-mono text-xs px-2 py-0.5 rounded"
                          style={{
                            background: delta > 0.5 ? "rgba(34,197,94,0.12)" : delta < -0.5 ? "rgba(239,68,68,0.12)" : "rgba(148,163,184,0.1)",
                            color: deltaColor,
                            border: `1px solid ${deltaColor}40`,
                          }}
                        >
                          {deltaFormatted}
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

      {/* ── 5. Nation Drill-Down Panel ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedNation && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.6)" }}
              onClick={() => setSelectedNation(null)}
            />

            {/* Side panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-screen z-50 overflow-y-auto"
              style={{
                width: "min(520px, 100vw)",
                background: "#090f20",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
              }}
            >
              {/* Panel header */}
              <div
                className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b"
                style={{ background: "#090f20", borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedNation.flag}</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "#e2e8f0" }}>{selectedNation.name}</h2>
                    <p className="text-xs" style={{ color: "#475569" }}>Sovereign Credit Report · AGI Edition</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="text-2xl font-black font-mono px-3 py-1.5 rounded-lg"
                    style={{
                      color: gradeColor(selectedNation.grade),
                      background: gradeBgColor(selectedNation.grade),
                      border: `1px solid ${gradeColor(selectedNation.grade)}40`,
                      boxShadow: gradeGlow(selectedNation.grade),
                    }}
                  >
                    {selectedNation.grade}
                  </div>
                  <button
                    onClick={() => setSelectedNation(null)}
                    className="p-2 rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: "#64748b" }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">

                {/* Score summary */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}
                >
                  <div>
                    <div className="text-3xl font-black font-mono" style={{ color: gradeColor(selectedNation.grade) }}>
                      {selectedNation.score}
                      <span className="text-sm font-normal ml-1" style={{ color: "#475569" }}>/100</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>AGI Composite Score</div>
                  </div>
                  <MiniSparkline data={selectedNation.trend} color={gradeColor(selectedNation.grade)} />
                </div>

                {/* Factor breakdown */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
                    Rating Factor Breakdown
                  </h3>
                  <div className="space-y-3">
                    {selectedNation.factors.map((factor) => {
                      const barColor = factor.score >= 80 ? "#22c55e" : factor.score >= 60 ? "#3b82f6" : factor.score >= 40 ? "#f59e0b" : "#ef4444";
                      return (
                        <div key={factor.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>{factor.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono" style={{ color: "#475569" }}>{factor.weight}% weight</span>
                              <span className="text-xs font-mono font-bold" style={{ color: "#e2e8f0" }}>{factor.label}</span>
                              <span className="text-xs font-black font-mono w-8 text-right" style={{ color: barColor }}>
                                {factor.score}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${factor.score}%`, background: barColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rating history */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
                    Rating History Timeline
                  </h3>
                  <div className="space-y-2">
                    {selectedNation.history.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{ background: i === 0 ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <div
                          className="w-14 text-center font-black font-mono text-sm px-1 py-0.5 rounded flex-shrink-0"
                          style={{ color: gradeColor(entry.grade), background: gradeBgColor(entry.grade) }}
                        >
                          {entry.grade}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono" style={{ color: "#64748b" }}>{entry.date}</p>
                          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{entry.trigger}</p>
                        </div>
                        {i === 0 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                            CURRENT
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AGI Rationale */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
                    AGI Rationale
                  </h3>
                  <div
                    className="p-4 rounded-xl space-y-3"
                    style={{ background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.12)" }}
                  >
                    {selectedNation.rationale.map((sentence, i) => (
                      <p key={i} className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                        {sentence}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Legacy comparison */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
                    Agency Comparison
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "AGI", grade: selectedNation.grade, isAgi: true },
                      { label: "Moody's", grade: selectedNation.moodys, isAgi: false },
                      { label: "S&P", grade: selectedNation.sp, isAgi: false },
                      { label: "Fitch", grade: selectedNation.fitch, isAgi: false },
                    ].map((agency) => {
                      const deltaVsAgi = agency.isAgi ? 0 : agencyGradeDelta(selectedNation.grade, agency.grade);
                      return (
                        <div
                          key={agency.label}
                          className="text-center p-3 rounded-xl"
                          style={{
                            background: agency.isAgi ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.02)",
                            border: agency.isAgi ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <div className="text-xs font-bold mb-1.5" style={{ color: agency.isAgi ? "#3b82f6" : "#475569" }}>
                            {agency.label}
                          </div>
                          <div
                            className="text-sm font-black font-mono"
                            style={{ color: agency.isAgi ? gradeColor(selectedNation.grade) : "#94a3b8" }}
                          >
                            {agency.grade}
                          </div>
                          {!agency.isAgi && (
                            <div
                              className="text-xs font-mono mt-1"
                              style={{ color: deltaVsAgi > 0 ? "#ef4444" : deltaVsAgi < 0 ? "#22c55e" : "#475569" }}
                            >
                              {deltaVsAgi > 0 ? `+${deltaVsAgi}` : deltaVsAgi < 0 ? `${deltaVsAgi}` : "="}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
