# Design System — ProspectIQ

## Product Context
- **What this is:** B2B lead enrichment tool — paste domains, get structured company intelligence streamed back live
- **Who it's for:** Sales reps, recruiters, investors, founders doing competitive research
- **Space/industry:** B2B devtools / sales intelligence (peers: Apollo, Clay, Hunter, Clearbit)
- **Project type:** Web app (two pages: marketing landing + power-tool app)

## Aesthetic Direction
- **Direction:** Precision Signal
- **Decoration level:** Intentional — subtle depth, glow accents on active states, gradient borders on hover
- **Mood:** Bloomberg terminal crossed with Linear. Data-dense but beautiful. Feels like infrastructure, not a form. Every element earns its place. The product is about intelligence extraction — the UI should feel like a precision instrument.
- **Reference sites:** linear.app, vercel.com, resend.com, posthog.com

## Typography
- **Display/Hero:** Satoshi, weight 700–900 — geometric, modern, confident at large sizes. Letter-spacing -0.02em to -0.03em on headings.
- **Body/UI:** Geist — clean, neutral, excellent at 12–15px UI density. The system font for all labels, descriptions, copy.
- **Data/Tables:** Geist Mono — tabular-nums, domain names, metrics, status text. Font-variant-numeric: tabular-nums.
- **Code:** Geist Mono
- **Loading:** Google Fonts CDN: `https://fonts.googleapis.com/css2?family=Satoshi:wght@400;500;600;700;800;900&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap`
- **Scale:**
  - hero: 72–80px / font-weight 800 / letter-spacing -0.03em
  - h1: 48px / 800 / -0.03em
  - h2: 32px / 700 / -0.02em
  - h3: 20px / 700 / -0.02em
  - body-lg: 18px / 400 / line-height 1.75
  - body: 14px / 400 / line-height 1.6
  - body-sm: 12px / 400
  - label: 11px / 500
  - mono-sm: 10–11px Geist Mono
  - caption: 9–10px Geist Mono / uppercase / letter-spacing 0.10em

## Color
- **Approach:** Restrained — amber is rare and meaningful. Used on CTAs, active states, and signals only.
- **BG:** #0B0A0E — warm near-black with a slight purple tint. More premium than gray-950.
- **Surface:** #111018 — cards, panels, sidebars
- **Surface Hi:** #18161F — elevated elements, hover states
- **Surface Hi2:** #1E1B28 — dropdowns, tooltips
- **Border:** #1F1D28 — standard separators
- **Border Hi:** #2A2740 — hover borders, focus rings
- **Text:** #F4F3FF — primary (slightly purple-white, not pure white)
- **Muted:** #6B6880 — secondary text, placeholders, descriptions
- **Dim:** #3D3B4E — tertiary text, timestamps, disabled states
- **Accent (Amber):** #F59E0B — primary CTA, loading states, active borders, signal indicators
- **Amber Dim:** rgba(245,158,11,0.12) — badge backgrounds, glow rings
- **Amber Glow:** rgba(245,158,11,0.25) — box-shadow on hover
- **Indigo:** #818CF8 — "steady" hiring velocity, secondary signals
- **Green:** #34D399 — success states, "enriched" status
- **Red:** #F87171 — error states, "failed" status
- **Yellow:** #FCD34D — "slow" hiring velocity
- **Dark mode:** This IS the dark mode. The product is dark-only.

## Spacing
- **Base unit:** 8px
- **Scale:** 2(2px) 4(4px) 6(6px) 8(8px) 10(10px) 12(12px) 14(14px) 16(16px) 20(20px) 24(24px) 32(32px) 40(40px) 48(48px) 64(64px) 80(80px)
- **Density:** Comfortable — not compact. Cards breathe. Content has room.
- **Card padding:** 13–16px vertical, 16–20px horizontal
- **Section padding:** 48–80px vertical

## Layout
- **Approach:** Grid-disciplined
- **Max content width:** 1200px
- **Border radius:**
  - xs: 4px (tech badges, small chips)
  - sm: 6px (buttons-sm, inner elements)
  - md: 10px (cards, inputs, buttons)
  - lg: 16px (panels, app shell, modals)
  - full: 9999px (pills, tags)
- **App page:** Sidebar (190px) + main panel flex layout
- **Landing:** Max 1200px centered, hero 640px max-width

## Motion
- **Approach:** Intentional — animations aid comprehension or signal state
- **Easing:** enter: ease-out, exit: ease-in, move: ease-in-out
- **Duration:** micro: 100ms, short: 150ms, medium: 250ms, long: 400ms
- **Key animations:**
  - pill-dot: 2s pulse (opacity + scale) — active indicator
  - scanpulse: 1.5s ease-in-out — loading card left border
  - ticker scroll: 24s linear infinite — landing hero ticker
  - card hover: translateY(-2px) + border-color, 150ms
  - btn-primary hover: translateY(-1px) + box-shadow, 150ms
  - input focus: box-shadow 0 0 0 3px amber-dim, 150ms

## Key UI Patterns
- **Hiring velocity:** 4-bar signal bars (like radio signal strength), not text badges alone
  - Aggressive: 4 amber bars
  - Steady: 3 indigo bars
  - Slow: 2 yellow bars
  - None: 4 gray bars
- **Loading card:** amber 3px left border with scanpulse animation + amber "scraping" status text
- **Expanded card:** grid layout, card-detail-label (mono, uppercase, dim) + card-detail-value (body, muted)
- **Key signals list:** amber bullet dot (·) + body text
- **Live ticker:** horizontal scrolling monospace feed on landing hero showing fake live enrichments
- **Input focus:** amber border + 0 0 0 3px amber-dim ring
- **CTAs:** amber background, black text, Satoshi 700, md border-radius
- **Nav logo:** "Prospect" in text color + "IQ" in amber

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-15 | Amber gold as primary accent | Unique in B2B intel space — emerald is overused, blue is Salesforce. Amber reads as "signal" and "intelligence." |
| 2026-04-15 | Warm near-black (#0B0A0E) instead of gray-950 | Slight purple tint adds depth and premium feel without being purple-gradient. |
| 2026-04-15 | Signal bar velocity indicator | More expressive and scannable than text badges — reads like radio signal strength. |
| 2026-04-15 | Live ticker on landing hero | Subagent insight: show the product running on fake data, creates "is this real?" moment. |
| 2026-04-15 | Satoshi + Geist pairing | Satoshi for display personality, Geist for UI clarity — confident and readable at all sizes. |
