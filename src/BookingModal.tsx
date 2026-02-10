"use client"

import * as React from "react"

/**
 * BookingModal — intentionally simple.
 *
 * This modal is informational only. It exists to build trust with the visitor
 * before redirecting them to adkit.io where the actual booking flow lives.
 * No forms, no checkout, no data fetching — just copy and a redirect.
 */

type BookingModalProps = {
  siteId: string
  slot: string
  /** Daily price in cents (e.g. 2500 = $25) */
  price: number
  onClose: () => void
}

export function BookingModal({ siteId, slot, price, onClose }: BookingModalProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null)

  // Close on Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  // Lock body scroll while modal is open
  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close when clicking the backdrop (not the card)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const dollars = price / 100
  const formatted = Number.isInteger(dollars)
    ? `$${dollars}`
    : `$${dollars.toFixed(2)}`

  const handleBook = () => {
    const params = new URLSearchParams({
      siteId,
      slot,
      price: String(price),
      ref: window.location.href
    })
    window.location.href = `https://adkit.io/book?${params.toString()}`
  }

  return (
    <div
      ref={overlayRef}
      className="adkit-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Book this ad space"
    >
      <div className="adkit-modal-card">
        <h2 className="adkit-modal-headline">
          Advertise directly on {typeof window !== "undefined" ? window.location.hostname : "this site"}.
        </h2>
        <p className="adkit-modal-subhead">
          Rent this ad space for a fixed price and reach your target audience where they really are: <strong>right here</strong>.
        </p>

        <ul className="adkit-modal-bullets">
        <li>Exclusive placement, no other ads will be shown</li>
          <li>Fixed price — no bidding, auctions, or fees</li>
          <li>See your ad before you pay, no commitments</li>
          <li>Track your ad's performance on your dashboard</li>
          <li>Guaranteed to display 24/7 or your money back</li>
        </ul>

        <div className="adkit-modal-price-section">
          <span className="adkit-modal-price">{formatted} / day</span>
          <span className="adkit-modal-price-helper">Zero commitment. No minimum booking period.</span>
        </div>

        <div className="adkit-modal-actions">
          <button className="adkit-modal-cta" onClick={handleBook}>
            Book this ad
          </button>
          <span className="adkit-modal-redirect-hint">
            You'll be redirected to Adkit to upload your ad and choose dates.
          </span>
          <button className="adkit-modal-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="adkit-modal-footer">Powered by <a href="https://adkit.dev" target="_blank" rel="noopener noreferrer">Adkit</a></div>
      </div>
    </div>
  )
}
