"use client"

import * as React from "react"
import { AdkitContext } from "./AdkitContext"

export type AdkitProviderProps = {
  /** Your Adkit site ID */
  siteId: string
  children: React.ReactNode
}

export function AdkitProvider({ siteId, children }: AdkitProviderProps) {
  const slotsRef = React.useRef<Set<string>>(new Set())
  const [refreshKey, setRefreshKey] = React.useState(0)

  const registerSlot = React.useCallback((identity: string): boolean => {
    if (slotsRef.current.has(identity)) {
      return false
    }
    slotsRef.current.add(identity)
    return true
  }, [])

  const unregisterSlot = React.useCallback((identity: string): void => {
    slotsRef.current.delete(identity)
  }, [])

  const refresh = React.useCallback(() => {
    slotsRef.current.clear()
    setRefreshKey(k => k + 1)
  }, [])

  const value = React.useMemo(
    () => ({ siteId, refreshKey, refresh, registerSlot, unregisterSlot }),
    [siteId, refreshKey, refresh, registerSlot, unregisterSlot]
  )

  return (
    <AdkitContext.Provider value={value}>
      {children}
    </AdkitContext.Provider>
  )
}
