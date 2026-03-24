# Travelgentic Landing Page — Implementation Plan

## Overview

Major redesign from current dark/gold aesthetic to the **Horizon Ethos** design system (light background, deep navy, vibrant orange), following the provided mockups. This plan covers structure, components, and implementation order.

---

## 1. Design System Update

### Color Palette (from design spec)
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#003580` (Deep Navy) | Headings, buttons, logo |
| Accent | `#FF7D54` (Vibrant Orange) | Highlights, "Your Way", underlines, badges |
| Background | `#F8FAFC` (Light Gray/Off-white) | Page & section backgrounds |
| Text Primary | `#001A41` (approx) | Body text, headings |
| Text Secondary | `#64748b` (Blue-gray) | Secondary text, icons |

### Typography
- **Font:** Plus Jakarta Sans (replace DM Sans + Fraunces in `layout.js`)
- **Headlines:** Bold, -0.02em tracking
- **Body:** Medium, 1.6 line height

### Layout
- **Corner radius:** 8px (Round Eight)
- **Spacing:** 8px base grid (8, 16, 24, 32px)
- **Transitions:** duration-300 for hovers

### Files to Modify
- `layout.js` — Add Plus Jakarta Sans, update Clerk variables to new colors
- `globals.css` — Update `:root` vars, body bg, Clerk overrides

---

## 2. Navigation Bar (AppHeader)

### Design (from mockup)
- **Background:** Very light gray/off-white (`#F8FAFC` or white)
- **Glassmorphism:** `bg-white/80`, `backdrop-blur-xl`, subtle bottom shadow
- **Logo:** "Travelgentic" — bold, dark navy, sans-serif
- **Links (center):** Home, My Trips, Destinations
  - Active: thin orange underline (e.g., Home)
  - "My Trips": light-blue dashed border
  - Destinations: standard link
- **Actions (right):**
  - Login: light-blue dashed border, dark blue text
  - Sign Up: solid navy button, white text, 8px radius

### Implementation Notes
- Sticky header
- Keep existing auth logic (Clerk `SignInButton`, `UserButton`, etc.)
- Map links: Home → `/#`, My Trips → `/dashboard` (or `/#onboarding` for signed-out), Destinations → `/destinations` (or `/#destinations`)
- Match nav items to mockup styling (underline for active, dashed for secondary)

### File
- `AppHeader.js` — Full restyle

---

## 3. Hero Section

### Design (from mockup)
- **Background:** Full-width coastal image (turquoise water, white sand, lush green hills)
  - Slight blur + darkened overlay for text legibility
  - ~80vh height
- **Headline:** "Travel **Your Way**" — "Travel" white, "Your Way" orange
- **Subheadline:** "Your next trip, planned in seconds. Discover, plan, and explore the world's most hidden gems."
  - White, centered, smaller font
- **NO search bar** (per your request)

### Implementation Notes
- Replace `AuroraBackground` with a `section` using:
  - `background-image` (hero image — need to add to `public/` or use a placeholder/Unsplash)
  - `before:` or overlay div for dark gradient
- Add a "Start Planning" or CTA button that scrolls to `#onboarding`
- Responsive: ensure text scales on mobile

### Assets
- Hero image: Add to `public/hero-coastal.jpg` or similar. Use high-res tropical coastline (free from Unsplash/Pexels if needed).

### File
- `page.js` — Hero section markup
- Optionally: `HeroSection.jsx` component for cleanliness

---

## 4. How It Works Section

### Design (from mockup)
- **Layout:** Three-column grid, left-aligned, generous padding (`py-24`)
- **Section title:** "How It Works" — bold navy, large. Short orange underline beneath.
- **Columns:** Each has:
  - Icon in rounded square (pastel bg): Plan = light blue, Generate = light peach, Explore = light orange
  - Numbered heading: "1. Plan", "2. Generate", "3. Explore"
  - Body text (medium gray)

### Current Wording (keep these)
1. **Plan:** "Tell us your vibe" — "Where you're going, your budget, interests, and the type of experience you want."
2. **Generate:** "AI builds your plan" — "We map local gems, check the weather, and design a day-by-day schedule just for you."
3. **Explore:** "Refine & share" — "Swap out days you don't love, then share a beautiful read-only link with your travel crew."

### Icons
- Plan: Calendar with pencil (line-art)
- Generate: Two arrows in circular motion (line-art)
- Explore: Compass (line-art)

Can use Lucide, Heroicons, or inline SVG.

### File
- `page.js` — Replace current vertical timeline with three-column layout
- Optionally: `HowItWorksSection.jsx`

---

## 5. Featured Destinations Section (New)

### Design (from mockup)
- **Header:** 
  - Title: "Featured Destinations" (bold navy)
  - Subtitle: "Curated by our expert editorial team and AI insights."
  - "View All" link (right-aligned, with arrow icon)
- **Grid:** CSS Grid, 4-column × 2-row
  - **Bali, Indonesia:** `grid-column: span 2; grid-row: span 2` — large left card, "TRENDING" badge
  - **Kyoto, Japan:** `grid-column: span 2; grid-row: span 1` — top right
  - **Santorini:** `grid-column: span 1; grid-row: span 1` — bottom left of right side
  - **Venice:** `grid-column: span 1; grid-row: span 1` — bottom right

### Card Structure
- Rounded corners (12–16px)
- Background image with `object-fit: cover`
- Dark gradient at bottom for text readability
- Text: Title (bold white), Subtitle (smaller white) where applicable
- Bali: orange "TRENDING" pill badge

### Links
- **Every card is a link** (`<Link>` or `<a>`)
- Use placeholder hrefs: `/destinations/bali`, `/destinations/kyoto`, etc. — ready for future destination pages

### Assets
- Destination images: Add to `public/destinations/` or use placeholder URLs (Unsplash)

### File
- `FeaturedDestinations.jsx` — New component
- `page.js` — Import and render below How It Works

---

## 6. Onboarding Section

### Placement
- Below Featured Destinations (same as current, but after new section)

### Design Adjustments
- **Color tone:** Match new page design
  - Background: light gray `#F8FAFC` or subtle gradient
  - Card: white/light with navy text, orange accents
  - Borders: light gray instead of white/10
  - Replace gold (#C8A96E) with orange (#FF7D54) for buttons, focus states, badges
  - Text: navy for headings, gray for body

### Content
- Keep existing flow (StepOne, StepTwo, CompletionScreen)
- Section header: "Try It Now" / "Plan your next adventure" — restyle to match

### Files
- `OnboardingFlow.js` — Update colors (primary, borders, backgrounds)
- `StepOne.js`, `StepTwo.js` — Update accent colors, borders
- `CompletionScreen.js` — Same
- `page.js` — Section wrapper styling

---

## 7. Footer

### Design (from mockup)
- **Layout:** Three columns, light gray background
- **Column 1 — Brand:**
  - "Travelgentic" (bold navy)
  - Description: "Your digital concierge for a more meaningful way to see the world."
  - Icons: Globe, Share, Camera (horizontal)
- **Column 2 — Discover:**
  - Header: "DISCOVER" (uppercase, small, bold navy)
  - Links: About Us, Contact, Privacy Policy, Terms of Service
- **Column 3 — Connect:**
  - Header: "CONNECT" (uppercase, small, bold navy)
  - Text: "24/7 Support via our concierge dashboard."
  - Copyright: "© 2024 Travelgentic. The Digital Concierge."

### Links
- Use placeholder `href="#"` or `/about`, `/contact`, `/privacy`, `/terms` for future pages

### File
- `page.js` — Replace current footer with new three-column layout
- Optionally: `Footer.jsx`

---

## 8. Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Update design tokens (colors, font) | `layout.js`, `globals.css` |
| 2 | Restyle AppHeader to match mockup | `AppHeader.js` |
| 3 | Replace hero with coastal image + new copy, no search bar | `page.js` |
| 4 | Rebuild How It Works as 3-column with current wording | `page.js` |
| 5 | Create Featured Destinations component (all cards linked) | `FeaturedDestinations.jsx`, `page.js` |
| 6 | Insert onboarding section below Featured Destinations, restyle colors | `page.js`, `OnboardingFlow.js`, `StepOne.js`, `StepTwo.js`, `CompletionScreen.js` |
| 7 | Implement new footer | `page.js` or `Footer.jsx` |
| 8 | Add hero + destination images to `public/` | `public/` |
| 9 | Final pass: responsive tweaks, hover states, Clerk theme sync | Multiple |

---

## 9. Asset Checklist

- [ ] Hero coastal image (tropical coastline, turquoise water)
- [ ] Bali destination image (limestone cliffs, turquoise water)
- [ ] Kyoto destination image (temple, cherry blossoms)
- [ ] Santorini destination image (white buildings, blue domes)
- [ ] Venice destination image (gondola, canal)

---

## 10. Responsive Considerations

- **Desktop-first** per design spec
- Nav: Consider hamburger menu on small screens
- How It Works: Stack columns vertically on tablet/mobile
- Featured Destinations: Simplify grid on mobile (e.g., 1 col)
- Footer: Stack columns on mobile

---

## Summary

This plan preserves your existing onboarding flow and wording while applying the new visual identity. The Featured Destinations section is fully link-ready for future destination pages. All changes align with the Horizon Ethos design system and the provided mockups.
