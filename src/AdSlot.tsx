"use client"

import * as React from "react"
import type { AdSlotProps, ServedAd } from "./types"
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

const mountedSlots = new Set<string>()
const SERVE_BASE = "https://adkit.dev"
const FETCH_TIMEOUT_MS = 5000

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
  price,
  size = "lg",
  theme = "auto",
  className,
  styles,
  silent = false
}: AdSlotProps) {
  const slotRef = React.useRef<HTMLDivElement>(null)
  const hasViewedRef = React.useRef(false)
  const bookingIdRef = React.useRef<string | undefined>(undefined)
  const systemDark = useSystemDark()
  const [servedAd, setServedAd] = React.useState<ServedAd>({ status: "loading" })

  React.useEffect(() => {
    bookingIdRef.current = servedAd.status === "active" ? servedAd.bookingId : undefined
  }, [servedAd])

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
  const refreshKey = ctx?.refreshKey ?? 0

  if (!siteId) {
    throw new Error('[Adkit] Missing siteId. Either wrap your app with <AdkitProvider siteId="..."> or pass siteId directly.')
  }

  const slotIdentity = deriveSlotIdentity(siteId, slot)
  const expectedRatio = RATIO_VALUE[aspectRatio]

  React.useEffect(() => {
    if (!ctx) return
    const isUnique = ctx.registerSlot(slotIdentity)
    if (!isUnique) {
      console.warn(`[Adkit] Duplicate slot "${slot}" detected on this page.`)
      if (!silent) {
        sendEvent({ type: "slot_duplicate", siteId, slot, pathname: window.location.pathname })
      }
    }
    return () => ctx.unregisterSlot(slotIdentity)
  }, [ctx, siteId, slotIdentity, slot, silent])

  React.useEffect(() => {
    if (silent || mountedSlots.has(slotIdentity)) return
    mountedSlots.add(slotIdentity)
    const payload: Parameters<typeof sendEvent>[0] = {
      type: "slot_mount",
      siteId,
      slot,
      pathname: typeof window !== "undefined" ? window.location.pathname : "",
      aspectRatio
    }
    if (price != null) payload.price = price
    sendEvent(payload)
  }, [siteId, slotIdentity, slot, silent, price, aspectRatio])

  React.useEffect(() => {
    setServedAd({ status: "loading" })
    hasViewedRef.current = false

    const ac = new AbortController()
    const timeoutId = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)

    fetch(`${SERVE_BASE}/api/serve?slotId=${encodeURIComponent(slotIdentity)}`, { signal: ac.signal })
      .then(res => res.json())
      .then((data: unknown) => {
        clearTimeout(timeoutId)
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const d = data as Record<string, unknown>
          if (d.status === "active" && typeof d.imageUrl === "string" && typeof d.linkUrl === "string") {
            const bookingId = typeof d.bookingId === "string" ? d.bookingId : undefined
            setServedAd({ status: "active", bookingId, imageUrl: d.imageUrl, linkUrl: d.linkUrl })
            return
          }
          if (d.status === "empty") {
            const serverPrice = typeof d.price === "number" ? d.price : undefined
            setServedAd({ status: "empty", price: serverPrice })
            return
          }
        }
        setServedAd({ status: "empty" })
      })
      .catch(() => {
        clearTimeout(timeoutId)
        setServedAd({ status: "empty" })
      })

    return () => {
      clearTimeout(timeoutId)
      ac.abort()
    }
  }, [slotIdentity, refreshKey])

  React.useEffect(() => {
    if (silent) return
    const el = slotRef.current
    if (!el || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasViewedRef.current) {
          hasViewedRef.current = true
          const payload: Parameters<typeof sendEvent>[0] = {
            type: "slot_view",
            slotId: slotIdentity,
            pathname: window.location.pathname,
            viewport: `${window.innerWidth}x${window.innerHeight}`
          }
          if (bookingIdRef.current) payload.bookingId = bookingIdRef.current
          sendEvent(payload)
          observer.disconnect()
        }
      },
      { threshold: [0.5] }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [slotIdentity, siteId, slot, silent])

  // Aspect ratio validation
  React.useEffect(() => {
    const el = slotRef.current
    if (!el || typeof ResizeObserver === "undefined") return

    const checkRatio = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width === 0 || height === 0) return
      const diff = Math.abs(width / height - expectedRatio) / expectedRatio
      if (diff > 0.05) {
        console.warn("[Adkit] Slot aspect ratio mismatch. External CSS may be interfering.")
      }
    }

    const observer = new ResizeObserver(checkRatio)
    observer.observe(el)
    checkRatio()
    return () => observer.disconnect()
  }, [expectedRatio])

  const [modalOpen, setModalOpen] = React.useState(false)

  const sendSlotClick = (bookingId: string) => {
    if (typeof window === "undefined") return
    sendEvent({
      type: "slot_click",
      slotId: slotIdentity,
      bookingId,
      pathname: window.location.pathname,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    })
  }

  const handlePlaceholderClick = () => {
    setModalOpen(true)
  }

  const handleAdClick = () => {
    if (!silent && servedAd.status === "active" && servedAd.bookingId) {
      sendSlotClick(servedAd.bookingId)
    }
  }

  const handleImageError = () => {
    setServedAd({ status: "empty" })
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
      : (isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.1)"),
    "--adkit-border-hover": styles?.borderColor
      ? `color-mix(in srgb, ${styles.borderColor} 60%, transparent)`
      : (isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.2)")
  } as React.CSSProperties

  const displayPrice = servedAd.status === "empty"
    ? (servedAd.price ?? price)
    : servedAd.status === "loading"
      ? price
      : undefined

  const formattedPrice = displayPrice != null
    ? (() => {
        const dollars = displayPrice / 100
        return Number.isInteger(dollars)
          ? dollars.toLocaleString()
          : dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      })()
    : null

  const isBanner = aspectRatio === "banner"
  const isActive = servedAd.status === "active"
  const isLoading = servedAd.status === "loading"

  return (
    <>
      <div
        ref={slotRef}
        className={`adkit-slot ${className ? className : "adkit-slot--default-width"}`}
        style={styleVars}
        data-adkit-site={siteId}
        data-adkit-slot={slot}
        data-adkit-ratio={aspectRatio}
        data-adkit-size={size}
      >
        <div className="adkit-canvas">
          {isActive ? (
            <a
              id={slot}
              href={servedAd.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              style={{ display: "block", width: "100%", height: "100%" }}
            >
              <img
                src={servedAd.imageUrl}
                alt=""
                style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
                onError={handleImageError}
              />
            </a>
          ) : (
            <div
              id={`${slot}-placeholder`}
              className="adkit-box"
              role="button"
              tabIndex={0}
              onClick={isLoading ? undefined : handlePlaceholderClick}
              style={isLoading ? { cursor: "default" } : undefined}
            >
              <div className="adkit-content">
                <div className="adkit-label">{isLoading ? "ad space" : "Your ad here"}</div>
                {formattedPrice != null && (
                  <div className="adkit-price">${formattedPrice}/day</div>
                )}
                {!isLoading && (
                  <div className="adkit-cta">
                    {formattedPrice != null
                      ? (isBanner ? "Rent" : "Rent this spot")
                      : "Learn more"}
                    <span className="adkit-arrow">→</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isActive && !isLoading && modalOpen && (
        <BookingModal
          siteId={siteId}
          slot={slot}
          price={displayPrice}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
