# adkit-react

A drop-in React component for selling direct, bookable ad space on your site — no AdSense, no programmatic networks, no middlemen.

[![npm](https://img.shields.io/npm/v/adkit-react)](https://www.npmjs.com/package/adkit-react)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> Not using React? See [adkit-js](https://github.com/adkit-dev/adkit-js) for the vanilla JavaScript SDK.

---

## Overview

Add `<AdkitProvider>` and `<AdSlot>` to your app. Each slot either renders a paid advertiser's creative or a "Rent this spot" placeholder that lets visitors book ads directly on your page. You set a flat daily price, and Adkit handles the booking flow, payment, and approval process, allowing you to monetize your site effortlessly.

---

## Installation

```bash
npm install adkit-react
```

---

## Quick start

```tsx
import { AdkitProvider, AdSlot } from "adkit-react"
import "adkit-react/styles.css"

function App() {
  return (
    <AdkitProvider siteId="your-site-id">
      <AdSlot slot="sidebar" aspectRatio="4:3" price={2500} />
    </AdkitProvider>
  )
}
```

Your site ID is found in the Adkit dashboard. The slot above goes live at $25/day immediately.

---

## Setup

### 1. Wrap your app with `<AdkitProvider>`

```tsx
import { AdkitProvider } from "adkit-react"
import "adkit-react/styles.css"

export default function RootLayout({ children }) {
  return (
    <AdkitProvider siteId="your-site-id">
      {children}
    </AdkitProvider>
  )
}
```

The provider shares your site ID across all slots in its subtree and manages the refresh lifecycle. You only need one provider per site.

### 2. Place `<AdSlot>` components where you want ad placements

```tsx
import { AdSlot } from "adkit-react"

export default function Sidebar() {
  return (
    <aside>
      <AdSlot slot="sidebar" aspectRatio="4:3" price={2500} />
    </aside>
  )
}
```

### 3. Import the stylesheet

```tsx
import "adkit-react/styles.css"
```

Import this once at the root of your app. It covers all slot and modal styles.

---

## Components

### `<AdkitProvider>`

Wraps your app (or any subtree) to provide site ID context and slot lifecycle management to all child `<AdSlot>` components.

```tsx
<AdkitProvider siteId="your-site-id">
  {children}
</AdkitProvider>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `siteId` | `string` | Yes | Your Adkit site ID from the dashboard |
| `children` | `ReactNode` | Yes | Your app or subtree |

---

### `<AdSlot>`

Renders a single ad placement. Fetches its status from the Adkit API and renders either an active ad or a booking placeholder.

```tsx
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
|---|---|---|---|
| `slot` | `string` | — | **Required.** Unique placement name. Letters, numbers, hyphens, underscores only. |
| `aspectRatio` | `AspectRatio` | — | **Required.** Slot shape — see [Aspect Ratios](#aspect-ratios). |
| `price` | `number` | — | Daily price in cents (e.g. `2500` = $25/day). See [Pricing](#pricing). |
| `siteId` | `string` | — | Manual site ID override. Not needed inside `<AdkitProvider>`. |
| `size` | `"sm" \| "md" \| "lg"` | `"lg"` | Placeholder text size. |
| `theme` | `"light" \| "dark" \| "auto"` | `"auto"` | Color theme. `"auto"` follows system preference. |
| `className` | `string` | — | CSS class(es) applied to the slot container. Use this to set width. |
| `styles` | `AdSlotStyles` | — | Custom color overrides for the placeholder. Does not affect rendered ads. |
| `silent` | `boolean` | `false` | Disable all analytics event tracking for this slot. |

#### Without a Provider

You can use `<AdSlot>` without a provider by passing `siteId` directly:

```tsx
<AdSlot
  siteId="your-site-id"
  slot="sidebar"
  aspectRatio="4:3"
  price={2500}
/>
```

This is useful for embedding a single slot without modifying your app's root.

---

### `<BookingModal>`

The booking modal is opened automatically when a visitor clicks a placeholder. It's also exported for advanced use cases where you need to trigger it programmatically.

```tsx
import { BookingModal } from "adkit-react"

<BookingModal
  siteId="your-site-id"
  slot="sidebar"
  price={2500}
  onClose={() => setOpen(false)}
/>
```

| Prop | Type | Description |
|---|---|---|
| `siteId` | `string` | Your Adkit site ID |
| `slot` | `string` | Slot name |
| `price` | `number` | Daily price in cents (optional — modal renders without a price if omitted) |
| `onClose` | `() => void` | Called when the modal is dismissed |

The modal closes on Escape key, backdrop click, or the Cancel button. Body scroll is locked while it's open. The "Book this ad" CTA redirects to `https://adkit.dev/book?siteId=...&slot=...&ref=...`. The price is not included in the URL — the booking page fetches it server-side to prevent manipulation.

---

## Aspect Ratios

| Value | Ratio | Best for |
|---|---|---|
| `"16:9"` | 16:9 | Hero banners, video-style placements |
| `"4:3"` | 4:3 | Sidebars, content blocks |
| `"1:1"` | 1:1 | Square placements, social-style |
| `"9:16"` | 9:16 | Vertical/mobile, stories format |
| `"banner"` | 728:90 | Leaderboard banners |

The aspect ratio is enforced by the component via CSS `aspect-ratio`. Set width via `className` — height is always derived automatically.

```tsx
// Width via Tailwind
<AdSlot slot="sidebar" aspectRatio="4:3" price={2500} className="w-[300px]" />

// Width via inline style
<AdSlot slot="sidebar" aspectRatio="4:3" price={2500} style={{ width: 300 }} />
```

---

## Pricing

### Setting a Price

Pass `price` in cents. The first time the slot mounts, it's registered at that price and becomes immediately bookable.

```tsx
<AdSlot slot="sidebar" aspectRatio="4:3" price={2500} />  {/* $25/day */}
<AdSlot slot="hero" aspectRatio="16:9" price={10000} />   {/* $100/day */}
```

### Changing a Price

Update the `price` prop and redeploy. The SDK sends the new value on the next `slot_mount` event.

- **Price increases** — applied immediately, no confirmation required
- **Price decreases** — you'll receive a confirmation via email or dashboard notification before the change takes effect, preventing accidental or manipulated price reductions

You can also change prices directly in the Adkit dashboard. Dashboard changes take effect immediately in either direction.

### How Pricing Works Under the Hood

The `price` prop has two roles:

1. **During loading** — displayed in the placeholder while the API fetch is in-flight, so the slot shows a price rather than a blank state
2. **After API response** — replaced by the server-authoritative price from the API response

The server price always wins once the fetch resolves. Billing always uses the confirmed database price.

---

## Slot Behavior

### Loading State

On mount, the slot immediately renders with `"ad space"` as the label and your `price` prop as a hint. This prevents layout shift — the slot occupies its full dimensions before the API responds.

### Active Ad State

When a booking is active, the slot renders the advertiser's creative as a full-size image linked to their destination URL. Impressions are tracked at 50% viewport visibility. Clicks are tracked on the link. If the image fails to load, the slot automatically falls back to placeholder state.

### Placeholder State

When no booking is active, the slot renders a dashed-border card with "Your ad here", the server-confirmed daily price, and a "Rent this spot" CTA. Clicking opens the booking modal. Banner slots show a compact "Rent" label to fit the narrow format.

---

## Theming

### Built-in Themes

```tsx
<AdSlot slot="sidebar" aspectRatio="4:3" price={2500} theme="light" />
<AdSlot slot="sidebar" aspectRatio="4:3" price={2500} theme="dark" />
<AdSlot slot="sidebar" aspectRatio="4:3" price={2500} theme="auto" />  {/* default */}
```

`"auto"` subscribes to `prefers-color-scheme` changes and re-renders automatically when the user switches system theme.

### Custom Colors

Use the `styles` prop to override placeholder colors per-slot:

```tsx
<AdSlot
  slot="branded"
  aspectRatio="1:1"
  price={3000}
  styles={{
    backgroundColor: "#fef3c7",
    textColorPrimary: "#92400e",
    textColorSecondary: "#d97706",
    borderColor: "#f59e0b",
  }}
/>
```

| Field | Description |
|---|---|
| `backgroundColor` | Placeholder background (default: transparent) |
| `textColorPrimary` | Price text color |
| `textColorSecondary` | Label and CTA text color |
| `borderColor` | Dashed border color (rendered at 40% opacity, 60% on hover via `color-mix()`) |

These styles apply to the **placeholder only**. When an active ad is displayed, the advertiser controls their creative.

Border color requires `color-mix()` support: Chrome 111+, Firefox 113+, Safari 16.2+.

### Size Presets

The `size` prop scales the label, price, and CTA text together:

| Value | Best for |
|---|---|
| `"sm"` | Compact slots under ~200px wide |
| `"md"` | Standard slots 200–400px wide |
| `"lg"` | Large/hero slots over 400px wide (default) |

---

## Hooks

### `useAdkit()`

Access the Adkit context from any component inside `<AdkitProvider>`. Throws if called outside a provider — this is intentional, as missing a provider is a developer error.

```tsx
import { useAdkit } from "adkit-react"

function RefreshButton() {
  const { refresh } = useAdkit()
  return <button onClick={refresh}>Refresh ads</button>
}
```

#### Context values

| Value | Type | Description |
|---|---|---|
| `siteId` | `string` | The site ID passed to the provider |
| `refresh` | `() => void` | Re-fetches all slots in the subtree |
| `refreshKey` | `number` | Increments on each refresh — used internally by `<AdSlot>` |

### `refresh()`

Calling `refresh()` does the following:

1. Clears the registered slot set (duplicate detection resets)
2. Clears the mounted slots set (mount events re-fire)
3. Increments `refreshKey`, triggering a re-fetch in every `<AdSlot>` in the subtree

Use this after SPA navigation or any time you want slots to re-check their booking status.

```tsx
// Re-fetch on route change
const { refresh } = useAdkit()
const pathname = usePathname()

useEffect(() => {
  refresh()
}, [pathname])
```

---

## Analytics Events

The SDK sends four event types to `https://adkit.dev/api/events`. All events use `navigator.sendBeacon()` with a `fetch` fallback. Errors are silently swallowed — analytics never break your app.

### `slot_mount`

Fires once per slot identity per page load, on mount (before the API responds). Carries the `price` prop to register or update the slot's price on the server.

```json
{
  "type": "slot_mount",
  "siteId": "your-site-id",
  "slot": "sidebar",
  "pathname": "/blog/my-post",
  "price": 2500,
  "aspectRatio": "4:3",
  "timestamp": 1743264000000
}
```

`price` is omitted if the prop is not set.

### `slot_view`

Fires when 50% of the slot enters the viewport via `IntersectionObserver`. Fires for both active ads and placeholders — this enables fill rate calculation. Fires at most once per slot per page load.

```json
{
  "type": "slot_view",
  "slotId": "your-site-id:sidebar",
  "bookingId": "booking-abc123",
  "pathname": "/blog/my-post",
  "viewport": "1440x900",
  "timestamp": 1743264000000
}
```

`bookingId` is only present when an active ad is displayed.

### `slot_click`

Fires when a visitor clicks an active ad. Does not fire for placeholder clicks.

```json
{
  "type": "slot_click",
  "slotId": "your-site-id:sidebar",
  "bookingId": "booking-abc123",
  "pathname": "/blog/my-post",
  "viewport": "1440x900",
  "timestamp": 1743264000000
}
```

### `slot_duplicate`

Fires when two `<AdSlot>` components share the same `siteId:slot` identity on the same page. Both slots still render.

```json
{
  "type": "slot_duplicate",
  "siteId": "your-site-id",
  "slot": "sidebar",
  "pathname": "/blog/my-post",
  "timestamp": 1743264000000
}
```

### Disabling Tracking

```tsx
<AdSlot slot="test" aspectRatio="1:1" price={500} silent />
```

---

## Error Handling

The SDK logs errors with the `[Adkit]` prefix and degrades gracefully — a misconfigured slot renders `null` rather than crashing the React tree.

| Scenario | Behavior |
|---|---|
| Missing `aspectRatio` | Renders `null`, `console.error` logged |
| Invalid `slot` name | Renders `null`, `console.error` logged |
| Missing `siteId` (no provider, no prop) | Renders `null`, `console.error` logged |
| `useAdkit()` called outside provider | Throws — this is a developer error |
| Duplicate slot identity | Both render, `console.warn` + analytics event |
| API fetch timeout (5s) | Falls back to placeholder |
| API non-200 or network failure | Falls back to placeholder |
| Ad image load failure | Falls back to placeholder |

---

## Next.js

`adkit-react` is fully compatible with the App Router. All components are marked `"use client"` at the bundle level — you don't need to add the directive yourself.

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
```

```tsx
// app/components/Sidebar.tsx — no "use client" needed
import { AdSlot } from "adkit-react"

export default function Sidebar() {
  return <AdSlot slot="sidebar" aspectRatio="4:3" price={2500} />
}
```

### Pages Router

```tsx
// pages/_app.tsx
import { AdkitProvider } from "adkit-react"
import "adkit-react/styles.css"

export default function App({ Component, pageProps }) {
  return (
    <AdkitProvider siteId="your-site-id">
      <Component {...pageProps} />
    </AdkitProvider>
  )
}
```

---

## TypeScript

Full TypeScript support is included. Types are exported from the package root.

```tsx
import type { AspectRatio, AdSlotProps, AdSlotStyles } from "adkit-react"

const ratio: AspectRatio = "16:9"

const customStyles: AdSlotStyles = {
  borderColor: "#3b82f6",
  backgroundColor: "transparent",
  textColorPrimary: "#1a1a1a",
  textColorSecondary: "#666",
}
```

---

## Slot Identity

A slot's identity is `siteId:slot` — the combination of your site ID and the slot name. This identity is **not** page-scoped. A slot named `"sidebar"` on `/blog/post-1` and `/blog/post-2` is the same placement, and a single booking covers both pages.

This is intentional: when an advertiser rents your sidebar, they expect their ad to appear everywhere your sidebar appears — not just on one URL.

If you need page-specific placements, use distinct slot names:

```tsx
<AdSlot slot="homepage-hero" aspectRatio="16:9" price={5000} />
<AdSlot slot="blog-sidebar" aspectRatio="4:3" price={2500} />
```

---

## Content Security Policy

If your site uses CSP headers, add:

```
connect-src https://adkit.dev;
img-src     https://ufs.sh;
```

`connect-src` covers the serve API (`/api/serve`) and analytics (`/api/events`). `img-src` covers ad creatives stored on UploadThing.

---

## Browser Support

| Browser | Minimum Version |
|---|---|
| Chrome | 88+ |
| Firefox | 89+ |
| Safari | 15+ |
| Edge | 88+ |

**Required APIs:** `IntersectionObserver`, `ResizeObserver`, `fetch`, CSS `aspect-ratio`.

`borderColor` in `styles` requires `color-mix()`: Chrome 111+, Firefox 113+, Safari 16.2+.

---

## License

MIT
