"use client"

import * as React from "react"

export type AdkitContextValue = {
  siteId: string
  // Slot registry for duplicate detection (per page render only)
  registerSlot: (identity: string) => boolean
  unregisterSlot: (identity: string) => void
}

export const AdkitContext = React.createContext<AdkitContextValue | null>(null)

export function useAdkit(): AdkitContextValue {
  const ctx = React.useContext(AdkitContext)
  if (!ctx) {
    throw new Error(
      "[Adkit] <AdSlot /> must be used inside <AdkitProvider />. " +
      "Wrap your app with <AdkitProvider siteId=\"your-site-id\">."
    )
  }
  return ctx
}

/**
 * Derive a stable slot identity from siteId and slot name.
 *
 * IMPORTANT: Pathname is intentionally NOT included.
 *
 * Why placement-level identity (not page-level):
 * - A slot represents a named placement on a site (e.g. "sidebar", "footer")
 * - When an advertiser rents the "sidebar" slot, their ad should appear
 *   on EVERY page that declares <AdSlot slot="sidebar" />
 * - Including pathname would fragment inventory: the same visual placement
 *   would become hundreds of separate rentable units (one per URL)
 * - This would break advertiser expectations and complicate booking
 *
 * The URL is still sent in events for analytics, but it does NOT affect identity.
 */
export function deriveSlotIdentity(siteId: string, slot: string): string {
  return `${siteId}:${slot}`
}
