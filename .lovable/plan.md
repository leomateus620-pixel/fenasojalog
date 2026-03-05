

# Plan: Liquid Glass Menu + Transport Cards Redesign

## Task 1: Mobile Sidebar with Liquid Glass Design

### Current State
- Mobile uses `BottomTabs` (bottom tab bar with 4 tabs + "More" sheet)
- Desktop uses `Sidebar` (vertical sidebar, collapsible)
- User wants the **same sidebar menu on mobile**, with ability to show/hide it, using a liquid glass texture with lighter green

### Changes

**`src/index.css`**
- Add liquid glass utility classes: `.liquid-glass` with `backdrop-blur-xl`, semi-transparent background with subtle noise/gradient, border with glass effect
- Lighten the sidebar CSS variables (both `:root` and `.dark`) to a softer green tone

**`src/components/Sidebar.tsx`**
- Apply liquid glass classes to the sidebar container and menu items
- Accept a new `isMobile`-aware layout: on mobile, render as a slide-in overlay panel (from left) with a close button and backdrop
- Text colors should use the glass-friendly lighter tones

**`src/components/Layout.tsx`**
- Remove `BottomTabs` usage entirely
- On mobile: show a hamburger button (fixed top-left) to toggle the sidebar open/closed
- Render `Sidebar` on both mobile and desktop, passing mobile-specific props
- The sidebar on mobile slides over content with a backdrop overlay

**`src/components/BottomTabs.tsx`**
- No longer imported (can keep file but unused)

### Liquid Glass Style
```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

Sidebar background: lighter green (`--sidebar-background: 148 35% 22%` instead of current `148 40% 16%`).

---

## Task 2: Transport Cards with Liquid Glass Design

### Current State
- Transport items are plain `border bg-card` divs with info crammed horizontally
- On mobile, action buttons overflow and text truncates badly

### Changes

**`src/pages/TransportsPage.tsx`**
- Redesign each transport card with liquid glass styling
- Card layout (mobile-first):
  - **Header row**: Status icon (colored) + Title (bold) + Time/Date (right-aligned)
  - **Route row**: Origin → Destination with arrow icon, clear typography
  - **Info chips row**: Guest name, driver, vehicle plate, flight info as small badges/chips
  - **Action row**: Edit, Delete, Start/Complete buttons — properly spaced, touch-friendly (44px min)
- Use `liquid-glass` class on cards
- Separate cards visually with proper spacing
- Flight info section gets its own mini-card within the transport card when applicable
- Filters bar: wrap better on mobile with full-width inputs stacked vertically on small screens

### Files Changed
- `src/index.css` — add liquid glass utilities + lighter sidebar vars
- `src/components/Sidebar.tsx` — liquid glass styling, mobile overlay support
- `src/components/Layout.tsx` — use sidebar on mobile with hamburger toggle, remove BottomTabs
- `src/pages/TransportsPage.tsx` — redesign transport cards with liquid glass + mobile-optimized layout

