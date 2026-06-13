# Money Elysium — Design System

## Color Palette
- **Background primary**: #0a0f2e (midnight navy)
- **Background secondary**: #0d1435 (slightly lighter navy)
- **Background card**: #111936 (card surface)
- **Accent gold**: #d4a017 (primary accent — borders, highlights, badges)
- **Accent gold light**: #f0c040 (hover states, icons)
- **Electric blue**: #3b82f6 (data highlights, active states, charts)
- **Electric blue glow**: #60a5fa (secondary data)
- **Success green**: #10b981 (verified status, positive indicators)
- **Warning amber**: #f59e0b (flagged status, caution)
- **Danger red**: #ef4444 (blacklisted, alerts, anomalies)
- **Text primary**: #f1f5f9 (near-white)
- **Text secondary**: #94a3b8 (muted gray-blue)
- **Border**: rgba(212, 160, 23, 0.2) (subtle gold border)

## Typography
- **Font family**: Inter (UI) — clean, institutional, data-dense
- **Display headings**: font-weight 700, tracking-tight
- **Data values**: font-weight 600, monospace (for numbers/IDs)
- **Labels**: uppercase, letter-spacing wide, font-size small
- **Body**: Regular weight, comfortable line-height

## Layout
- **Sidebar navigation**: fixed left, 240px wide, dark navy, gold accents on active items
- **Main content**: fluid right panel, padding-heavy, card-based layout
- **Header**: top bar with Money Elysium logo (gold) + "Sovereign Fiat Management System" subtitle in muted text
- **Cards**: rounded-lg (8px), subtle gold border, slight inner glow on hover

## Components

### Navigation Sidebar
- 5 items: Command Center, Sovereign Ledger, Anti-Counterfeit, AGI Brain, Banking Protocol
- Active item: gold left border + gold text
- Icons: appropriate financial/tech icons per section
- Footer: system status indicator (ONLINE) + version

### Stat Cards (Command Center)
- Large numeric value (gold or electric blue)
- Label above in uppercase muted text
- Trend arrow + percentage change
- Subtle animated pulse on live values

### Data Table (Ledger)
- Dark background rows, alternating slight shade
- Status badges: pill-shaped, color-coded (green/amber/red)
- Hover row highlight in electric blue tint
- Inline alert rows for double-spend detection

### Verification Widget (Anti-Counterfeit)
- Large input field for serial number
- Animated scanning bar (sweeping blue line effect)
- Result card: full-width verdict with large icon + color fill
- Confidence meter: animated arc gauge

### AI Panel (AGI Brain)
- Animated "thinking" data stream: scrolling hex/binary characters
- Metric cards with live-updating numbers
- Anomaly feed: scrolling alert list with timestamps
- "LIVE" pulsing indicator in top-right

### Transfer Table (Banking Protocol)
- Institutional sender/receiver columns
- Status pill with real-time transitions (PENDING → PROCESSING → SETTLED)
- Amount with currency flag/code
- Timeline indicator per row

## Animation Guidelines
- **Pulse**: subtle scale + opacity loop on live indicators
- **Counter animation**: numbers count up on mount
- **Scan effect**: linear gradient sweep for verification
- **Data stream**: scrolling monospace characters (Matrix-style but toned down)
- **Status transitions**: smooth color cross-fade on state changes
- **Chart updates**: smooth curve transitions

## Elevation / Depth
- Cards: box-shadow with navy + subtle gold glow
- Active elements: gold border glow (box-shadow: 0 0 12px rgba(212,160,23,0.3))
- Alert elements: red pulsing glow
- Verified elements: green glow

## Tech Stack
- React + TypeScript
- Tailwind CSS (custom config with above palette)
- Recharts for data visualizations (line charts, area charts, bar charts)
- Framer Motion for animations
- Lucide React for icons