export type AspectRatio = "16:9" | "4:3" | "1:1" | "9:16" | "banner"

/**
 * Event types sent to the Adkit API
 *
 * - slot_mount: Fires once per slot per page load (installation verification)
 * - slot_view: Fires once when ≥50% visible (billable impression)
 * - slot_click: Fires on user click
 * - slot_duplicate: Diagnostics only — never billable, never blocks rendering
 */
export type AdkitEventType = "slot_mount" | "slot_view" | "slot_click" | "slot_duplicate"

/**
 * Custom style overrides for the AdSlot placeholder.
 *
 * IMPORTANT: These styles affect the PLACEHOLDER only, not rendered ads.
 * When a real ad is displayed, the advertiser controls the creative.
 * Publishers cannot override ad content styling.
 */
export type AdSlotStyles = {
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

export type AdSlotProps = {
  /**
   * Semantic slot name (e.g. "sidebar", "header-1", "footer").
   * Must be unique per placement. Only letters, numbers, hyphens, and underscores allowed.
   */
  slot: string

  /**
   * Manual site ID override. Only needed without a Provider.
   * With AdkitProvider, siteId is inherited from context.
   */
  siteId?: string

  /**
   * Aspect ratio of the ad slot. Required.
   * Determines the type/format of ad that will be displayed.
   */
  aspectRatio: AspectRatio
  /** Daily rental price in cents (e.g. 2500 = $25.00) */
  price?: number

  /** Size variant for the placeholder content */
  size?: "sm" | "md" | "lg"

  /** Color theme. "auto" follows system preference. */
  theme?: "light" | "dark" | "auto"
  /** Additional CSS class names */
  className?: string
  /** Custom style overrides for the placeholder (does not affect rendered ads) */
  styles?: AdSlotStyles
  /** Disable all event tracking */
  silent?: boolean
}
