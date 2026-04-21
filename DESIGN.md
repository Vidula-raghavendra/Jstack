# Design System — Lode

## Product Context
- **What this is:** B2B company intelligence — paste domains, get pack-specific signals extracted by stealth crawler
- **Who it's for:** SDRs, recruiters, VCs, founders doing competitive research
- **Space/industry:** B2B devtools / sales intelligence
- **Project type:** Web app (landing + power-tool app)

## Brand
- **Name:** Lode
- **Tagline:** "Intelligence runs deep."
- **Voice:** Expert, unhurried, precise. We know the real value of any company. Not a dashboard — a dealer. Think fine art appraisal applied to B2B data.
- **Tone:** Quiet confidence. The kind that doesn't need to shout.

## Aesthetic Direction
- **Direction:** Gallery Intelligence — the visual language of a fine art dealer, applied to data extraction
- **Mood:** Editorial dark. Warm, expert, unhurried. Premium without trying.
- **Reference:** pieterkoopt.nl — dark backgrounds, very large editorial type, generous space, numbered process steps, personal expert tone
- **Decoration level:** Restrained. Space and typography do all the work. No glassmorphism, no gradient text, no particle effects, no card grids with glow borders.
- **The one thing to remember:** It should feel like a quiet expert in a dark room, not a SaaS dashboard.

## Typography
- **Display:** Bodoni Moda — editorial, gallery-catalogue. Italic for headline emphasis.
  - Source: Google Fonts `Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,700;1,6..96,400;1,6..96,700`
- **Body:** Figtree — warm, clean, readable at all sizes
  - Source: Google Fonts `Figtree:wght@300;400;500;600`
- **Mono:** Geist Mono — data labels, code, enrichment output
  - Source: next/font/google

### Scale
- hero-xl: `clamp(64px, 10vw, 140px)` / Bodoni Moda 400 italic / tracking -0.02em / leading 0.92
- hero: `clamp(44px, 6.5vw, 96px)` / Bodoni Moda 700 / tracking -0.03em / leading 1.0
- h2: `clamp(32px, 4.5vw, 64px)` / Bodoni Moda 700 / tracking -0.025em / leading 1.05
- h3: 20px / Figtree 600 / tracking -0.01em
- body-lg: 18px / Figtree 300 / line-height 1.85
- body: 15px / Figtree 400 / line-height 1.7
- body-sm: 13px / Figtree 400 / line-height 1.6
- label: 10px / Figtree 500 / tracking 0.14em / uppercase
- mono: 11–12px / Geist Mono

## Color
- **BG:** `#0C0B09` — very dark warm black. Like carbon, like a gallery at night.
- **Surface:** `#141210` — cards, panels
- **Surface Hi:** `#1C1A16` — elevated, hover
- **Border:** `#242118` — subtle warm separator
- **Border Hi:** `#302D26` — hover borders
- **Text:** `#F0EDE6` — warm off-white. Aged paper. Not pure white.
- **Muted:** `#7A7168` — secondary copy, descriptions
- **Dim:** `#3D3A32` — timestamps, disabled, tertiary
- **Gold:** `#C9A96E` — primary accent. Ore-like. Used on: logo mark, active borders, key signals, CTAs. Rare and meaningful.
- **Gold Dim:** `rgba(201,169,110,0.10)` — badge/pill backgrounds
- **Gold Glow:** `rgba(201,169,110,0.15)` — hover box-shadows
- **Indigo:** `#8B90C8` — Recruiter pack
- **Sage:** `#7EA88A` — VC pack / success
- **Red:** `#C87070` — error states

## Packs
- **SDR Pack** — Gold `#C9A96E` — buying signals, decision-makers, pricing model
- **Recruiter Pack** — Indigo `#8B90C8` — hiring trajectory, tech stack, eng leaders
- **VC Pack** — Sage `#7EA88A` — funding, traction, team caliber

## Spacing
- **Base unit:** 8px
- **Section padding:** 96–128px vertical (generous, gallery-like breathing room)
- **Content max-width:** 1200px
- **Card padding:** 28–36px

## Layout
- **Approach:** Generous. Content breathes. Sections feel like gallery rooms.
- **Grid:** 12-col, max 1200px centered
- **Border radius:** xs: 2px · sm: 4px · md: 8px · lg: 12px (smaller than typical — precision instrument)

## Motion
- **Approach:** Minimal and purposeful. Entries fade and lift. Nothing spins or bounces.
- **Easing:** ease-out for entries, ease-in for exits
- **Duration:** 500–900ms for sections, 150ms for micro-interactions
- **No:** spring physics overload, 3D transforms on marketing content, particle systems

## Key UI Patterns
- **Logo:** `L·ode` — with a small gold dot between L and ode, or just `Lode` in Bodoni Moda with gold period/dot accent
- **Section labels:** mono, uppercase, 10px, gold color, `/ label text`
- **Process steps:** Large numbered (01 02 03) in Bodoni Moda italic, very large
- **Terminal demo:** Dark card showing live enrichment output with monospace lines
- **CTAs:** Gold background, dark text, Figtree 600, borderRadius 4px (sharp-ish)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-21 | Renamed ProspectIQ → Lode | "Lode" = vein of ore. One syllable, premium, owns the mining/extraction metaphor. Completely distinctive in B2B intel space. |
| 2026-04-21 | Bodoni Moda editorial serif | Gallery-catalogue feel. Pairs with pieterkoopt.nl reference. Italic headlines create personality without needing color. |
| 2026-04-21 | Warm dark #0C0B09 vs cool dark | Carbon/wood warmth vs slate coldness. Warmer = more premium, less generic SaaS. |
| 2026-04-21 | Gold #C9A96E vs amber #F59E0B | Previous amber too saturated, startup-y. New gold reads as ore, precious metal, expertise. |
| 2026-04-21 | Figtree for body | Warm geometric sans, not on the reflex-reject list, excellent readability, pairs well with Bodoni editorial display. |
