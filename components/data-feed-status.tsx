"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function DataFeedStatus({ className }: { className?: string }) {
  const [status, setStatus] = useState<"online" | "offline">("online")

  // Check Binance API status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("https://fapi.binance.com/fapi/v1/ping")
        if (response.ok) {
          setStatus("online")
        } else {
          setStatus("offline")
        }
      } catch (error) {
        console.error("Error checking API status:", error)
        setStatus("offline")
      }
    }

    // Check status immediately
    checkStatus()

    // Then check every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {status === "online" ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="text-xs">{status === "online" ? "Connected" : "Disconnected"}</span>
    </div>
  )
}

