# adkit-react — Complete Documentation

React SDK for Adkit ad slots. Drop-in components for selling direct, bookable ads on your site — no AdSense required.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Components](#components)
  - [AdkitProvider](#adkitprovider)
  - [AdSlot](#adslot)
  - [BookingModal](#bookingmodal)
- [Hooks](#hooks)
  - [useAdkit](#useadkit)
- [Types](#types)
- [Styling](#styling)
- [Events & Analytics](#events--analytics)
- [Architecture](#architecture)
- [Server-Authoritative Pricing](#server-authoritative-pricing)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Browser Support](#browser-support)
- [Known Limitations](#known-limitations)

---

## Overview

`adkit-react` is a lightweight React component library that renders ad slots on any React application. When no active ad booking exists, it displays a placeholder with pricing that opens a booking modal when clicked.

### Key Features

- **React-native** — Built with React hooks and context, works with React 17+
- **Next.js compatible** — Includes `"use client"` directives for App Router
- **Server-authoritative pricing** — Prices come from the Adkit API, not client props
- **Theme support** — Light, dark, or auto (follows system preference)
- **Custom styling** — Override placeholder colors via props
- **Analytics** — Tracks mount, view, and click events
- **Responsive** — Aspect ratio locked, width flexible
- **Resilient** — 5s fetch timeout, image error fallback, silent failures

---

## Quick Start

```tsx
import { AdkitProvider, AdSlot } from "adkit-react"
import "adkit-react/styles.css"

function App() {
  return (
    <AdkitProvider siteId="your-site-id">
      <AdSlot slot="sidebar" aspectRatio="4:3" />
    </AdkitProvider>
  )
}
```

That's it! The component will automatically fetch ad data and render either an active ad or a placeholder.

---

## Installation

```bash
npm install adkit-react
```

Or with other package managers:

```bash
yarn add adkit-react
pnpm add adkit-react
```

### Peer Dependencies

- `react` >= 17.0.0
- `react-dom` >= 17.0.0

---

## Components

### AdkitProvider

Context provider that shares your site ID and manages slot registration across all ad slots.

```tsx
import { AdkitProvider } from "adkit-react"

function App() {
  return (
    <AdkitProvider siteId="your-site-id">
      {/* Your app content */}
    </AdkitProvider>
  )
}
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `siteId` | `string` | Yes | Your Adkit site ID |
| `children` | `ReactNode` | Yes | Child components |

#### Behavior

- Provides `siteId` to all descendant `<AdSlot>` components via React context
- Maintains an internal slot registry for duplicate detection
- Slots register on mount and unregister on unmount
- Multiple providers can exist (e.g., for different site IDs), but slots only see their nearest ancestor provider

#### When to Use

Wrap your entire app or the subtree containing ad slots:

```tsx
// Wrap entire app (recommended)
<AdkitProvider siteId="your-site-id">
  <App />
</AdkitProvider>

// Or wrap specific section
<AdkitProvider siteId="your-site-id">
  <Sidebar>
    <AdSlot slot="sidebar" aspectRatio="4:3" />
  </Sidebar>
</AdkitProvider>
```

---

### AdSlot

Renders an ad placement. Fetches ad data from the Adkit API and displays either an active ad or a placeholder.

```tsx
import { AdSlot } from "adkit-react"

<AdSlot
  slot="sidebar"
  aspectRatio="4:3"
  price={2500}
  size="lg"
  theme="auto"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `slot` | `string` | — | **Required.** Unique slot name. Only letters, numbers, hyphens, and underscores allowed. |
| `aspectRatio` | `AspectRatio` | — | **Required.** `"16:9"` \| `"4:3"` \| `"1:1"` \| `"9:16"` \| `"banner"` |
| `siteId` | `string` | — | Manual override. Not needed inside `<AdkitProvider>`. |
| `price` | `number` | — | **Loading-state hint only.** Shown while fetching. Server price overrides on response. |
| `size` | `"sm"` \| `"md"` \| `"lg"` | `"lg"` | Placeholder text size variant |
| `theme` | `"light"` \| `"dark"` \| `"auto"` | `"auto"` | Color theme. `"auto"` follows system preference. |
| `className` | `string` | — | Additional CSS classes for width control |
| `styles` | `AdSlotStyles` | — | Custom style overrides for placeholder |
| `silent` | `boolean` | `false` | Disable all event tracking |

#### Aspect Ratios

| Value | CSS Ratio | Use Case |
|-------|-----------|----------|
| `"16:9"` | 16 / 9 | Hero banners, video-style |
| `"4:3"` | 4 / 3 | Sidebar, content blocks |
| `"1:1"` | 1 / 1 | Square, social-style |
| `"9:16"` | 9 / 16 | Vertical/mobile, stories |
| `"banner"` | 728 / 90 | Leaderboard banner |

#### Size Presets

| Size | Label | Price | CTA | Gap |
|------|-------|-------|-----|-----|
| `sm` | 7px | 10px | 6px | 2px |
| `md` | 9px | 14px | 8px | 4px |
| `lg` | 11px | 18px | 10px | 4px |

#### Rendering States

Each slot goes through these states:

1. **Loading State** — Rendered immediately, before fetch completes
   - Shows aspect-ratio-locked container (prevents layout shift)
   - If `price` prop provided: shows placeholder with that price
   - If `price` prop not provided: shows "ad space" label only
   - Not clickable during loading

2. **Active Ad State** — Serve API returned `status: "active"`
   - Renders clickable image linking to advertiser URL
   - Opens in new tab (`target="_blank"`)
   - Tracks `slot_view` on 50% visibility
   - Tracks `slot_click` on click

3. **Placeholder State (With Price)** — Serve API returned `status: "empty"` with `price`
   - Renders placeholder with **server-returned price**
   - Shows "Rent this spot →" CTA (or "Rent →" for banner)
   - Click opens booking modal with server price

4. **Placeholder State (No Price)** — Serve API returned `status: "empty"` without `price`
   - Renders placeholder without price
   - Shows "Learn more →" CTA
   - Click opens booking modal without price displayed

5. **Error/Fallback State** — Fetch failed (timeout, network error, non-200)
   - Falls back to placeholder
   - If `price` prop was provided: shows that price
   - If not: shows generic placeholder without price

#### Slot Identity

Slot identity is derived as `{siteId}:{slot}`. This means:
- The same slot name on different pages shares the same ad
- Advertisers rent a "placement" (e.g., "sidebar"), not a page-specific slot
- URL pathname is tracked in events for analytics but doesn't affect identity

#### Validation

The component throws errors for invalid configuration:

```
[Adkit] Missing aspectRatio. This prop is required and determines the ad format.
[Adkit] Invalid slot name "my slot!". Only letters, numbers, hyphens, and underscores allowed.
[Adkit] Missing siteId. Either wrap your app with <AdkitProvider siteId="..."> or pass siteId directly.
```

#### Duplicate Detection

If two slots have the same identity on the same page:
- A warning is logged: `[Adkit] Duplicate slot "sidebar" detected on this page.`
- A `slot_duplicate` event is sent (unless `silent`)
- Both slots still render (to avoid breaking the page)

#### Aspect Ratio Validation

The component monitors its rendered size and warns if external CSS distorts the aspect ratio:

```
[Adkit] Slot aspect ratio mismatch. External CSS may be interfering.
```

This fires when the actual ratio differs from expected by more than 5%.

---

### BookingModal

Informational modal that redirects visitors to Adkit for the actual booking flow. Normally opened automatically when a visitor clicks an empty slot.

```tsx
import { BookingModal } from "adkit-react"

<BookingModal
  siteId="your-site-id"
  slot="sidebar"
  price={2500}
  onClose={() => setOpen(false)}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `siteId` | `string` | Yes | Your Adkit site ID |
| `slot` | `string` | Yes | Slot name |
| `price` | `number` | No | Daily price in cents. If undefined, price section is hidden. |
| `onClose` | `() => void` | Yes | Close callback |

#### Modal Content

- **Headline**: "Advertise directly on {hostname}."
- **Subhead**: "Rent this ad space for a fixed price. Your ad will be reviewed by the site owner before going live."
- **Features**:
  - Exclusive placement, no other ads will be shown
  - Fixed price — no bidding, auctions, or fees
  - See your ad before you pay, no commitments
  - Track your ad's performance on your dashboard
  - Guaranteed to display 24/7 or your money back
- **Price**: Formatted as "$X / day" or "$X.XX / day" (only shown if price is provided)
- **Helper**: "Zero commitment. No minimum booking period."
- **CTA**: "Book this ad" → redirects to Adkit booking page
- **Cancel**: Closes modal
- **Footer**: "Powered by Adkit" (linked)

#### Booking Redirect

The "Book this ad" button redirects to:

```
https://adkit.dev/book?siteId={siteId}&slot={slot}&ref={currentUrl}
```

**Important**: The price is NOT included in the URL. The booking page fetches the price server-side to prevent tampering.

#### Behavior

- Closes on Escape key
- Closes on backdrop click (not card click)
- Locks body scroll while open (`overflow: hidden`)
- ARIA attributes for accessibility (`role="dialog"`, `aria-modal="true"`)
- Animated entrance (fade + slide up)

---

## Hooks

### useAdkit

Access the Adkit context from any child component.

```tsx
import { useAdkit } from "adkit-react"

function MyComponent() {
  const { siteId, refresh } = useAdkit()

  return (
    <button onClick={refresh}>
      Refresh Ads
    </button>
  )
}
```

#### Return Value

```ts
type AdkitContextValue = {
  siteId: string
  refreshKey: number
  refresh: () => void
  registerSlot: (identity: string) => boolean
  unregisterSlot: (identity: string) => void
}
```

| Property | Description |
|----------|-------------|
| `siteId` | The site ID from the provider |
| `refreshKey` | Internal counter that increments on refresh (for dependency tracking) |
| `refresh` | Call to re-fetch all ads. Clears tracking state and triggers new API requests. |
| `registerSlot` | Internal: registers a slot identity, returns false if duplicate |
| `unregisterSlot` | Internal: unregisters a slot identity on unmount |

#### Refresh Behavior

`refresh()` will:
1. Clear the slot registry (duplicate detection resets)
2. Increment `refreshKey` (triggers re-fetch in all slots)
3. Reset view tracking (slots can fire `slot_view` again)

#### When to Call `refresh()`

- **SPA route changes** — If ads should update on navigation
- **After booking** — To show newly booked ads immediately
- **User-triggered** — If you provide a "refresh ads" button
- **Visibility change** — To check for expired bookings when tab becomes visible

```tsx
// Refresh on visibility change
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      refresh()
    }
  }
  document.addEventListener("visibilitychange", handleVisibility)
  return () => document.removeEventListener("visibilitychange", handleVisibility)
}, [refresh])
```

#### Error

Throws if used outside `<AdkitProvider>`:

```
[Adkit] <AdSlot /> must be used inside <AdkitProvider />.
Wrap your app with <AdkitProvider siteId="your-site-id">.
```

---

## Types

All types are exported from the main entry point:

```tsx
import type {
  AspectRatio,
  AdSlotProps,
  AdSlotStyles,
  AdkitEventType,
  AdkitProviderProps
} from "adkit-react"
```

### AspectRatio

```ts
type AspectRatio = "16:9" | "4:3" | "1:1" | "9:16" | "banner"
```

### AdkitEventType

```ts
type AdkitEventType = "slot_mount" | "slot_view" | "slot_click" | "slot_duplicate"
```

| Event | When | Purpose |
|-------|------|---------|
| `slot_mount` | Component mounts | Installation verification, auto-slot creation |
| `slot_view` | ≥50% visible | Billable impression |
| `slot_click` | Active ad clicked | Engagement tracking |
| `slot_duplicate` | Duplicate slot detected | Diagnostics only |

### AdSlotStyles

Custom style overrides for the **placeholder only** (not rendered ads):

```ts
type AdSlotStyles = {
  /** Border color of the dashed placeholder outline */
  borderColor?: string
  /** Background color of the placeholder (default: transparent) */
  backgroundColor?: string
  /** Primary text color for placeholder (price, CTA) */
  textColorPrimary?: string
  /** Secondary text color for placeholder (label, subtext) */
  textColorSecondary?: string
  /** Button background color on hover (placeholder only) */
  buttonColor?: string
}
```

**Important**: These styles affect the PLACEHOLDER only. When a real ad is displayed, the advertiser controls the creative. Publishers cannot override ad content styling.

### AdSlotProps

```ts
type AdSlotProps = {
  slot: string
  siteId?: string
  aspectRatio: AspectRatio
  price?: number
  size?: "sm" | "md" | "lg"
  theme?: "light" | "dark" | "auto"
  className?: string
  styles?: AdSlotStyles
  silent?: boolean
}
```

### AdkitProviderProps

```ts
type AdkitProviderProps = {
  siteId: string
  children: React.ReactNode
}
```

### ServeResponse (Internal)

```ts
type ServeResponse =
  | { status: "active"; bookingId: string; imageUrl: string; linkUrl: string; expiresAt?: string }
  | { status: "empty"; price?: number; aspectRatio?: string }
```

### ServedAd (Internal)

```ts
type ServedAd =
  | { status: "active"; bookingId?: string; imageUrl: string; linkUrl: string }
  | { status: "empty"; price?: number }
  | { status: "loading" }
```

---

## Styling

### Import Styles

Import the default stylesheet:

```tsx
import "adkit-react/styles.css"
```

This is required for the components to render correctly.

### Width Control

The slot container has no default width when you pass a `className`. Control width via CSS:

```tsx
// Tailwind
<AdSlot slot="sidebar" aspectRatio="4:3" className="w-[300px]" />

// Inline style wrapper
<div style={{ width: 300 }}>
  <AdSlot slot="sidebar" aspectRatio="4:3" />
</div>

// CSS class
<AdSlot slot="sidebar" aspectRatio="4:3" className="my-ad-width" />
```

If no `className` is passed, the slot defaults to `width: 100%`.

### Height

Height is **always** derived from width via aspect ratio. External height styles are overridden with `!important` to prevent distortion.

### CSS Classes

| Class | Description |
|-------|-------------|
| `.adkit-slot` | Container element |
| `.adkit-slot--default-width` | Applied when no className passed (width: 100%) |
| `.adkit-canvas` | Aspect ratio container |
| `.adkit-box` | Placeholder interactive area |
| `.adkit-content` | Placeholder text container |
| `.adkit-label` | "Your ad here" / "ad space" text |
| `.adkit-price` | Price display |
| `.adkit-cta` | Call-to-action text |
| `.adkit-arrow` | CTA arrow icon |

### CSS Custom Properties

The component sets these CSS variables for theming:

| Variable | Description |
|----------|-------------|
| `--adkit-aspect` | Aspect ratio value (e.g., "4 / 3") |
| `--adkit-bg` | Background color |
| `--adkit-text-muted` | Muted text color |
| `--adkit-text` | Secondary text color |
| `--adkit-text-strong` | Primary text color |
| `--adkit-border` | Border color |
| `--adkit-border-hover` | Border color on hover |
| `--adkit-label-size` | Label font size |
| `--adkit-price-size` | Price font size |
| `--adkit-cta-size` | CTA font size |
| `--adkit-gap` | Content gap |
| `--adkit-cta-mt` | CTA margin top |
| `--adkit-padding` | Content padding |

### Theme Colors

**Light Theme** (default on light backgrounds):
- Text muted: `rgba(0,0,0,0.6)`
- Text: `rgba(0,0,0,0.5)`
- Text strong: `rgba(0,0,0,0.9)`
- Border: `rgba(0,0,0,0.1)`
- Border hover: `rgba(0,0,0,0.2)`

**Dark Theme** (for dark backgrounds):
- Text muted: `rgba(255,255,255,0.6)`
- Text: `rgba(255,255,255,0.5)`
- Text strong: `rgba(255,255,255,0.9)`
- Border: `rgba(255,255,255,0.22)`
- Border hover: `rgba(255,255,255,0.38)`

### Custom Border Colors

The `borderColor` style uses CSS `color-mix()` to apply 40%/60% opacity:

```tsx
<AdSlot
  slot="sidebar"
  aspectRatio="4:3"
  styles={{ borderColor: "#3b82f6" }}
/>
```

This requires modern browsers (Chrome 111+, Firefox 113+, Safari 16.2+). On older browsers, custom border colors render at full opacity.

---

## Events & Analytics

The SDK sends events to `https://adkit.dev/api/events`.

### Event Types

#### slot_mount

Sent once when a slot is first initialized (per page load).

```json
{
  "type": "slot_mount",
  "siteId": "your-site-id",
  "slot": "sidebar",
  "pathname": "/page",
  "aspectRatio": "4:3",
  "price": 2500,
  "timestamp": 1234567890
}
```

Note: `price` is only present if the `price` prop was set. This comes from the prop (not server) because the event fires before the fetch completes. The backend uses this to auto-create unconfirmed slot records.

#### slot_view

Sent when 50% of the slot is visible in viewport (IntersectionObserver). Fires once per page load, for both active ads and placeholders.

```json
{
  "type": "slot_view",
  "slotId": "your-site-id:sidebar",
  "bookingId": "booking-123",
  "pathname": "/page",
  "viewport": "1920x1080",
  "timestamp": 1234567890
}
```

Note: `bookingId` is only present when an active ad is displayed.

#### slot_click

Sent when an **active ad** is clicked. Not sent for placeholder clicks.

```json
{
  "type": "slot_click",
  "slotId": "your-site-id:sidebar",
  "bookingId": "booking-123",
  "pathname": "/page",
  "viewport": "1920x1080",
  "timestamp": 1234567890
}
```

#### slot_duplicate

Sent when a duplicate slot identity is detected on the same page.

```json
{
  "type": "slot_duplicate",
  "siteId": "your-site-id",
  "slot": "sidebar",
  "pathname": "/page",
  "timestamp": 1234567890
}
```

### Event Delivery

- **Primary**: `navigator.sendBeacon()` (non-blocking, survives page unload)
- **Fallback**: `fetch()` with `keepalive: true`
- All errors are silently swallowed — never logged, never thrown
- Events are skipped entirely if `silent={true}`

### Disabling Analytics

```tsx
<AdSlot slot="test-slot" aspectRatio="4:3" silent />
```

When `silent` is true:
- No `slot_mount` event
- No `slot_view` event
- No `slot_click` event
- No `slot_duplicate` event

---

## Architecture

### Initialization Flow

```
1. Component mounts
2. Validate props (aspectRatio, slot name, siteId)
3. Register slot with provider (for duplicate detection)
4. Send slot_mount event (if not silent, not already mounted)
5. Fetch ad from API with 5s timeout
6. Parse response:
   - Active: store bookingId, imageUrl, linkUrl
   - Empty: store server price (if provided)
   - Error: fall back to empty state
7. Render appropriate state (loading → active/placeholder)
8. Setup IntersectionObserver for view tracking
9. Setup ResizeObserver for aspect ratio validation
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://adkit.dev/api/serve` | GET | Fetch active ad for a slot |
| `https://adkit.dev/api/events` | POST | Send analytics events |
| `https://adkit.dev/book` | — | Booking flow redirect |

### Serve API

```
GET https://adkit.dev/api/serve?slotId={siteId}:{slot}
```

**Active ad response:**
```json
{
  "status": "active",
  "bookingId": "booking-123",
  "imageUrl": "https://...",
  "linkUrl": "https://...",
  "expiresAt": "2026-03-28T04:59:59.999Z"
}
```

**Empty slot response:**
```json
{
  "status": "empty",
  "price": 2500,
  "aspectRatio": "4:3"
}
```

### Fetch Behavior

- **Timeout**: 5 seconds via `AbortController`
- **Retries**: None. Fail fast to placeholder.
- **Errors**: Silently swallowed. Falls back to placeholder.

---

## Server-Authoritative Pricing

**The serve API is the single source of truth for slot data.** The SDK never uses client-side props for any value that affects billing or booking.

### Why This Matters

Your ad prices can't be tampered with. Even if someone opens browser dev tools and changes the `price` prop to `1` (one cent), it won't affect what advertisers actually pay. The booking page fetches the real price from your database — the client-side value is just a loading hint.

This protects you from:
- Malicious users trying to book ads at fake prices
- Bugs where different SDK versions show different prices
- Stale prices after you update them in the dashboard

### How Pricing Works

1. The `price` prop is an **optional loading-state hint only**. If provided, it's shown in the placeholder while the serve API fetch is in-flight.

2. The moment the serve response arrives, the server's `price` value replaces whatever the prop said.

3. If the server returns `status: "empty"` without a `price`, no price is shown.

4. The booking modal displays the **server-returned price**, not the prop price.

5. The booking redirect URL does NOT include a price parameter:
   ```
   https://adkit.dev/book?siteId={siteId}&slot={slot}&ref={currentUrl}
   ```
   The booking page fetches the price from the database server-side.

6. The `slot_mount` event payload includes `price` if the prop is present (for auto-slot-creation on the backend), but this price is never used for billing — it's only a suggestion for the publisher to confirm in the dashboard.

### Why Server-Authoritative?

- Prevents price tampering via browser dev tools
- Ensures consistent pricing across all SDK versions
- Allows publishers to update prices without redeploying
- Single source of truth for billing

---

## Error Handling

### Missing Required Props

The component throws immediately for missing required props:

```
[Adkit] Missing aspectRatio. This prop is required and determines the ad format.
[Adkit] Missing siteId. Either wrap your app with <AdkitProvider siteId="..."> or pass siteId directly.
```

### Invalid Slot Names

```
[Adkit] Invalid slot name "my slot!". Only letters, numbers, hyphens, and underscores allowed.
```

### Fetch Failures

- 5-second timeout via AbortController
- No retry on failure
- Falls back to placeholder state
- No error thrown (SDK never breaks the host app)

### Image Load Failures

If an active ad's image fails to load (broken URL, CDN down), the `onError` handler automatically falls back to the placeholder. Users never see a broken image icon.

### Duplicate Slots

- Warning logged: `[Adkit] Duplicate slot "sidebar" detected on this page.`
- `slot_duplicate` event sent
- Both slots still render

### Aspect Ratio Mismatch

- Warning logged: `[Adkit] Slot aspect ratio mismatch. External CSS may be interfering.`
- Fires when actual ratio differs from expected by >5%
- Slot still renders (warning only)

---

## Examples

### Basic Sidebar

```tsx
<AdkitProvider siteId="your-site-id">
  <AdSlot slot="sidebar" aspectRatio="4:3" />
</AdkitProvider>
```

### With Price Hint

```tsx
<AdSlot
  slot="premium-banner"
  aspectRatio="banner"
  price={10000}  // $100/day shown during loading
/>
```

### Dark Theme

```tsx
<div className="bg-gray-900 p-4">
  <AdSlot
    slot="dark-sidebar"
    aspectRatio="4:3"
    theme="dark"
  />
</div>
```

### Custom Styled

```tsx
<AdSlot
  slot="branded"
  aspectRatio="1:1"
  styles={{
    backgroundColor: "#fef3c7",
    textColorPrimary: "#92400e",
    textColorSecondary: "#d97706",
    borderColor: "#f59e0b"
  }}
/>
```

### Fixed Width

```tsx
<AdSlot
  slot="fixed-width"
  aspectRatio="4:3"
  className="w-[300px]"
/>
```

### Silent Mode (No Tracking)

```tsx
<AdSlot
  slot="test-slot"
  aspectRatio="1:1"
  silent
/>
```

### Without Provider

```tsx
<AdSlot
  siteId="your-site-id"
  slot="standalone"
  aspectRatio="4:3"
/>
```

### Multiple Slots

```tsx
<AdkitProvider siteId="your-site-id">
  <header>
    <AdSlot slot="header" aspectRatio="banner" className="w-[728px]" />
  </header>
  
  <main>
    <article>{/* content */}</article>
    <aside>
      <AdSlot slot="sidebar" aspectRatio="4:3" className="w-[300px]" />
    </aside>
  </main>
  
  <footer>
    <AdSlot slot="footer" aspectRatio="16:9" />
  </footer>
</AdkitProvider>
```

### Next.js App Router

```tsx
// app/layout.tsx
import { AdkitProvider } from "adkit-react"
import "adkit-react/styles.css"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AdkitProvider siteId="your-site-id">
          {children}
        </AdkitProvider>
      </body>
    </html>
  )
}

// app/page.tsx
import { AdSlot } from "adkit-react"

export default function Page() {
  return (
    <div>
      <AdSlot slot="hero" aspectRatio="16:9" />
    </div>
  )
}
```

---

## Browser Support

- Chrome 88+
- Firefox 89+
- Safari 15+
- Edge 88+

### Required APIs

- `IntersectionObserver` — for view tracking
- `ResizeObserver` — for aspect ratio validation
- `fetch` — for API requests
- CSS `aspect-ratio` property — for layout

### Custom Border Colors

The `borderColor` style uses CSS `color-mix()` which requires:
- Chrome 111+
- Firefox 113+
- Safari 16.2+

On older browsers, custom border colors render at full opacity (no transparency blend). Default themes work on all supported browsers.

---

## Known Limitations

### Ad Expiry

The serve API returns an `expiresAt` timestamp for active bookings. However, the SDK does **not** currently:
- Poll for expiry
- Check expiry on `visibilitychange`
- Auto-refresh when a booking expires

If a user has a tab open for hours and a booking expires, the ad continues displaying until page reload.

### No Retry Logic

Failed API requests are not retried. The SDK fails to placeholder immediately. This is intentional:
- Retries add complexity and latency
- A failed request likely indicates a real issue
- Placeholder is an acceptable fallback

### Single Ad Per Slot

Each slot displays one ad at a time. There's no rotation, carousel, or fallback chain. For multiple ads, create multiple slots.

### No SSR

The SDK is client-side only. For SSR frameworks (Next.js, Remix), the slot renders after hydration. The loading state prevents layout shift.

### No Automatic Expiry Refresh

The SDK does not automatically refresh when a booking expires. Call `refresh()` manually or on `visibilitychange` if needed.

---

## File Structure

```
adkit-react/
├── src/
│   ├── index.ts           # Public exports
│   ├── AdSlot.tsx         # Main ad slot component
│   ├── AdkitProvider.tsx  # Context provider
│   ├── AdkitContext.tsx   # Context definition, useAdkit hook
│   ├── BookingModal.tsx   # Booking modal component
│   ├── eventClient.ts     # Analytics event sending
│   ├── types.ts           # TypeScript type definitions
│   └── styles.css         # Component styles
├── dist/                  # Built output
├── package.json
├── tsconfig.json
└── README.md
```

---

## License

MIT
