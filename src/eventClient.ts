import type { AdkitEventType } from "./types"

const API_URL = "http://track.localhost:3000"

type SendEventPayload = {
  type: AdkitEventType
  siteId: string
  slot: string
  url: string
  price?: number // in cents
  aspectRatio?: string
  viewport?: {
    width: number
    height: number
  }
}

export function sendEvent(payload: SendEventPayload) {
  try {
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, timestamp: Date.now() }),
      keepalive: true
    }).catch(() => {})
  } catch {
    // never throw from SDK
  }
}
