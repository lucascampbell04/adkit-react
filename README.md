# adkit-react

A drop-in React component for selling direct, bookable ads on your site — no AdSense required.

## Installation

```bash
npm install adkit-react
```

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

## Components

### `<AdkitProvider>`

Wrap your app (or ad-containing subtree) with the provider to share your site ID across all slots.

```tsx
<AdkitProvider siteId="your-site-id">
  {children}
</AdkitProvider>
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `siteId` | `string` | Yes | Your Adkit site ID |
| `children` | `ReactNode` | Yes | Child components |

### `<AdSlot>`

Renders an ad placement. When no ad is booked, displays a placeholder inviting visitors to rent the space.

```tsx
<AdSlot
  slot="sidebar"
  aspectRatio="16:9"
  size="lg"
  theme="auto"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `slot` | `string` | — | **Required.** Unique slot name (letters, numbers, hyphens, underscores) |
| `aspectRatio` | `AspectRatio` | — | **Required.** `"16:9"` \| `"4:3"` \| `"1:1"` \| `"9:16"` \| `"banner"` |
| `siteId` | `string` | — | Manual override (not needed inside `AdkitProvider`) |
| `price` | `number` | — | Loading-state hint only. Server price always takes precedence. |
| `size` | `"sm"` \| `"md"` \| `"lg"` | `"lg"` | Placeholder content size |
| `theme` | `"light"` \| `"dark"` \| `"auto"` | `"auto"` | Color theme (`"auto"` follows system) |
| `className` | `string` | — | Additional CSS classes |
| `styles` | `AdSlotStyles` | — | Custom style overrides for placeholder |
| `silent` | `boolean` | `false` | Disable all event tracking |

### `<BookingModal>`

Exported for advanced use cases. Normally opened automatically when a visitor clicks an empty slot.

## Pricing

**Prices are server-authoritative.** The `price` prop is only a loading-state hint — the actual price displayed to advertisers always comes from the Adkit API. This means:

- Your prices can't be tampered with via browser dev tools
- You can update prices in your dashboard without redeploying
- Billing is always based on your configured price, never client-side values

## Types

```tsx
import type { AspectRatio, AdSlotProps, AdSlotStyles } from "adkit-react"

const ratio: AspectRatio = "16:9"

const customStyles: AdSlotStyles = {
  borderColor: "#3b82f6",
  backgroundColor: "transparent",
  textColorPrimary: "#1a1a1a",
  textColorSecondary: "#666",
  buttonColor: "#3b82f6"
}
```

## Styling

Import the default styles:

```tsx
import "adkit-react/styles.css"
```

Control slot width via `className`:

```tsx
<AdSlot slot="sidebar" aspectRatio="1:1" className="w-[300px]" />
```

The aspect ratio is enforced by the component — only width needs to be set.

## Hooks

### `useAdkit()`

Access the Adkit context from any child component:

```tsx
import { useAdkit } from "adkit-react"

function MyComponent() {
  const { siteId, refresh } = useAdkit()

  return <button onClick={refresh}>Refresh Ads</button>
}
```

The `refresh()` function re-fetches all ads, useful for SPA navigation or after a booking completes.

## Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete API reference, architecture details, and advanced usage.

## License

MIT
