"use client"

import * as React from "react"
import type { AdSlotProps } from "./types"
import { sendEvent } from "./eventClient"
import { AdkitContext, deriveSlotIdentity } from "./AdkitContext"
import { BookingModal } from "./BookingModal"

const RATIO_CSS: Record<string, string> = {
  "16:9": "16 / 9",
  "4:3": "4 / 3",
  "1:1": "1 / 1",
  "9:16": "9 / 16",
  "banner": "728 / 90"
}

const RATIO_VALUE: Record<string, number> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
  "9:16": 9 / 16,
  "banner": 728 / 90
}

// In-memory dedupe for slot_mount events
const mountedSlots = new Set<string>()

function useSystemDark() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return isDark
}

export function AdSlot({
  slot,
  siteId: manualSiteId,
  aspectRatio,
  price = 2500,
  size = "lg",
  theme = "auto",
  className,
  styles,
  silent = false
}: AdSlotProps) {
  const slotRef = React.useRef<HTMLDivElement>(null)
  const hasViewedRef = React.useRef(false)
  const systemDark = useSystemDark()

  // Validate aspectRatio
  if (!aspectRatio) {
    throw new Error("[Adkit] Missing aspectRatio. This prop is required and determines the ad format.")
  }

  // Validate slot name
  if (!/^[A-Za-z0-9_-]+$/.test(slot)) {
    throw new Error(`[Adkit] Invalid slot name "${slot}". Only letters, numbers, hyphens, and underscores allowed.`)
  }

  const ctx = React.useContext(AdkitContext)
  const siteId = manualSiteId ?? ctx?.siteId

  if (!siteId) {
    throw new Error('[Adkit] Missing siteId. Either wrap your app with <AdkitProvider siteId="..."> or pass siteId directly.')
  }

  const slotIdentity = deriveSlotIdentity(siteId, slot)
  const expectedRatio = RATIO_VALUE[aspectRatio]

  // Duplicate detection
  React.useEffect(() => {
    if (!ctx) return
    const isUnique = ctx.registerSlot(slotIdentity)
    if (!isUnique) {
      console.warn(`[Adkit] Duplicate slot "${slot}" detected on this page.`)
      if (!silent) {
        sendEvent({ type: "slot_duplicate", siteId, slot, url: window.location.href })
      }
    }
    return () => ctx.unregisterSlot(slotIdentity)
  }, [ctx, siteId, slotIdentity, slot, silent])

  // slot_mount
  React.useEffect(() => {
    if (silent || mountedSlots.has(slotIdentity)) return
    mountedSlots.add(slotIdentity)
    sendEvent({
      type: "slot_mount",
      siteId,
      slot,
      url: typeof window !== "undefined" ? window.location.href : "",
      price,
      aspectRatio
    })
  }, [siteId, slotIdentity, slot, silent, price, aspectRatio])

  // slot_view
  React.useEffect(() => {
    if (silent) return
    const el = slotRef.current
    if (!el || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasViewedRef.current) {
          hasViewedRef.current = true
          sendEvent({
            type: "slot_view",
            siteId,
            slot,
            url: window.location.href,
            viewport: { width: window.innerWidth, height: window.innerHeight }
          })
          observer.disconnect()
        }
      },
      { threshold: [0.5] }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [siteId, slot, silent])

  // Aspect ratio validation
  React.useEffect(() => {
    const el = slotRef.current
    if (!el || typeof ResizeObserver === "undefined") return

    const checkRatio = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width === 0 || height === 0) return
      const diff = Math.abs(width / height - expectedRatio) / expectedRatio
      if (diff > 0.05) {
        console.warn("[Adkit] Slot aspect ratio mismatch. Ads may not render correctly.")
      }
    }

    const observer = new ResizeObserver(checkRatio)
    observer.observe(el)
    checkRatio()
    return () => observer.disconnect()
  }, [expectedRatio])

  const [modalOpen, setModalOpen] = React.useState(false)

  const handleClick = () => {
    if (silent) return
    sendEvent({
      type: "slot_click",
      siteId,
      slot,
      url: typeof window !== "undefined" ? window.location.href : ""
    })
    setModalOpen(true)
  }

  const isDark = theme === "dark" ? true : theme === "light" ? false : systemDark

  const styleVars: React.CSSProperties = {
    "--adkit-aspect": RATIO_CSS[aspectRatio],
    "--adkit-bg": styles?.backgroundColor ?? "transparent",
    "--adkit-text-muted": styles?.textColorSecondary ?? (isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"),
    "--adkit-text": styles?.textColorSecondary ?? (isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"),
    "--adkit-text-strong": styles?.textColorPrimary ?? (isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)"),
    "--adkit-border": styles?.borderColor
      ? `color-mix(in srgb, ${styles.borderColor} 40%, transparent)`
      : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"),
    "--adkit-border-hover": styles?.borderColor
      ? `color-mix(in srgb, ${styles.borderColor} 60%, transparent)`
      : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)")
  } as React.CSSProperties

  const dollars = price / 100
  const formattedPrice = Number.isInteger(dollars)
    ? dollars.toLocaleString()
    : dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const isBanner = aspectRatio === "banner"

  return (
    <>
      <div
        ref={slotRef}
        className={`adkit-slot ${className ?? ""}`}
        style={styleVars}
        data-adkit-site={siteId}
        data-adkit-slot={slot}
        data-adkit-ratio={aspectRatio}
        data-adkit-size={size}
      >
        <div className="adkit-canvas">
          <div className="adkit-box" role="button" tabIndex={0} onClick={handleClick}>
            <div className="adkit-content">
              <div className="adkit-label">Your ad here</div>
              <div className="adkit-price">${formattedPrice}/day</div>
              <div className="adkit-cta">
                {isBanner ? "Rent" : "Rent this spot"}
                <span className="adkit-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <BookingModal
          siteId={siteId}
          slot={slot}
          price={price}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
