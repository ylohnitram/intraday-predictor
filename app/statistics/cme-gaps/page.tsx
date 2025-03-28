import { DashboardLayout } from "@/components/dashboard-layout"
import { GapTradingStrategy } from "@/components/gap-trading-strategy"

export default function CMEGapsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold tracking-tight mb-4">CME Gap Analysis</h1>
        <GapTradingStrategy />
      </div>
    </DashboardLayout>
  )
}

