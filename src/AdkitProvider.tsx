"use client"

import * as React from "react"
import { AdkitContext } from "./AdkitContext"

export type AdkitProviderProps = {
  /** Your Adkit site ID */
  siteId: string
  children: React.ReactNode
}

export function AdkitProvider({ siteId, children }: AdkitProviderProps) {
  // Track registered slots for duplicate detection
  const slotsRef = React.useRef<Set<string>>(new Set())

  const registerSlot = React.useCallback((identity: string): boolean => {
    if (slotsRef.current.has(identity)) {
      return false // duplicate
    }
    slotsRef.current.add(identity)
    return true
  }, [])

  const unregisterSlot = React.useCallback((identity: string): void => {
    slotsRef.current.delete(identity)
  }, [])

  const value = React.useMemo(
    () => ({ siteId, registerSlot, unregisterSlot }),
    [siteId, registerSlot, unregisterSlot]
  )

  return (
    <AdkitContext.Provider value={value}>
      {children}
    </AdkitContext.Provider>
  )
}
