const API_URL = "https://adkit.dev/api/events"

type SlotViewClickPayload = {
  type: "slot_view" | "slot_click"
  slotId: string
  bookingId?: string
  pathname: string
  viewport: string
}

type SlotMountPayload = {
  type: "slot_mount"
  siteId: string
  slot: string
  pathname: string
  price?: number
  aspectRatio: string
}

type SlotDuplicatePayload = {
  type: "slot_duplicate"
  siteId: string
  slot: string
  pathname: string
}

type SendEventPayload = SlotViewClickPayload | SlotMountPayload | SlotDuplicatePayload

export function sendEvent(payload: SendEventPayload) {
  const body = JSON.stringify({ ...payload, timestamp: Date.now() })

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" })
      const sent = navigator.sendBeacon(API_URL, blob)
      if (sent) return
    }
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    }).catch(() => {})
  } catch {
    // never throw from SDK
  }
}
