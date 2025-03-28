"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUp, ArrowDown, Loader2, Filter, Search } from "lucide-react"
import { analyzePatterns, type PatternData } from "@/lib/pattern-data"

interface PatternAnalyzerProps {
  patternType: "all" | "bullish" | "bearish"
}

export function PatternAnalyzer({ patternType = "all" }: PatternAnalyzerProps) {
  const [loading, setLoading] = useState(true)
  const [patternData, setPatternData] = useState<PatternData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<"pattern" | "successRate" | "occurrences">("successRate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await analyzePatterns("1h", 30)

        // Filter patterns by type if needed
        let filteredData = data.patternData
        if (patternType === "bullish") {
          filteredData = data.patternData.filter((pattern) => pattern.type === "bullish")
        } else if (patternType === "bearish") {
          filteredData = data.patternData.filter((pattern) => pattern.type === "bearish")
        }

        setPatternData(filteredData)
      } catch (error) {
        console.error("Error analyzing patterns:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [patternType])

  // Handle sorting
  const handleSort = (field: "pattern" | "successRate" | "occurrences") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Sort and filter the pattern data
  const sortedAndFilteredPatterns = patternData
    .filter((pattern) => pattern.pattern.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0

      if (sortField === "pattern") {
        comparison = a.pattern.localeCompare(b.pattern)
      } else if (sortField === "successRate") {
        comparison = a.successRate - b.successRate
      } else if (sortField === "occurrences") {
        comparison = a.occurrences - b.occurrences
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

  // Render sort indicator
  const renderSortIndicator = (field: "pattern" | "successRate" | "occurrences") => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Analyzing patterns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patterns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%] cursor-pointer" onClick={() => handleSort("pattern")}>
              Pattern {renderSortIndicator("pattern")}
            </TableHead>
            <TableHead className="w-[20%] cursor-pointer" onClick={() => handleSort("occurrences")}>
              Occurrences {renderSortIndicator("occurrences")}
            </TableHead>
            <TableHead className="w-[20%] cursor-pointer" onClick={() => handleSort("successRate")}>
              Success Rate {renderSortIndicator("successRate")}
            </TableHead>
            <TableHead className="w-[20%]">Signal Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAndFilteredPatterns.map((pattern) => (
            <TableRow key={pattern.pattern}>
              <TableCell className="font-medium">{pattern.pattern}</TableCell>
              <TableCell>{pattern.occurrences}</TableCell>
              <TableCell className={pattern.successRate > 70 ? "text-green-500 font-medium" : ""}>
                {pattern.successRate}%
              </TableCell>
              <TableCell>
                <Badge
                  variant={pattern.type === "bullish" ? "default" : "destructive"}
                  className={pattern.type === "bullish" ? "bg-green-500" : ""}
                >
                  {pattern.type === "bullish" ? "Bullish" : "Bearish"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {sortedAndFilteredPatterns.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No patterns found matching your filters
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="mt-4 space-y-4">
        <h3 className="text-sm font-medium">How to Use Pattern Data:</h3>
        <ul className="list-disc ml-6 space-y-2 text-sm text-muted-foreground">
          <li>
            <strong>Success Rate</strong>: The percentage of times the pattern led to the expected price movement
          </li>
          <li>
            <strong>Occurrences</strong>: How many times the pattern was detected in the historical data
          </li>
          <li>
            <strong>Signal Type</strong>: Whether the pattern typically signals a bullish or bearish price movement
          </li>
          <li>
            Higher success rates indicate more reliable patterns, but always use in conjunction with other analysis
            tools
          </li>
        </ul>
      </div>
    </div>
  )
}

