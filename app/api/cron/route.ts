import { type NextRequest, NextResponse } from "next/server"
import { updateAllData } from "@/lib/background-jobs"

export async function GET(request: NextRequest) {
  try {
    // Check for a secret token to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    const expectedToken = process.env.CRON_SECRET

    if (expectedToken && (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.slice(7) !== expectedToken)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update all data
    await updateAllData()

    return NextResponse.json({ success: true, message: "Data updated successfully" })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 })
  }
}

