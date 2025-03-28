"use client"

import React, { type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Calculator, Calendar, Cog, Home, Menu, X, Signal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [selectedSymbol] = React.useState("BTCUSDT")

  // Check if it's Sunday or Monday to show the special Sunday-Monday link
  const isSundayOrMonday = React.useMemo(() => {
    const day = new Date().getDay()
    return day === 0 || day === 1 // 0 is Sunday, 1 is Monday
  }, [])

  // Routes for navigation (dynamic based on the day)
  const routes = React.useMemo(() => {
    const baseRoutes = [
      { name: "Dashboard", path: "/", icon: Home },
      { name: "Signals", path: "/signals", icon: Signal },
      { name: "Statistics", path: "/statistics", icon: BarChart3 },
      { name: "Calculator", path: "/calculator", icon: Calculator },
      { name: "Settings", path: "/settings", icon: Cog },
    ]

    // Add Sunday-Monday link only if it's Sunday or Monday
    if (isSundayOrMonday) {
      baseRoutes.splice(3, 0, { name: "Sunday-Monday", path: "/sunday-monday", icon: Calendar })
    }

    return baseRoutes
  }, [isSundayOrMonday])

  // Clone children with selectedSymbol prop
  const childrenWithProps = React.Children.map(children, (child) => {
    // Check if child is a valid React element
    if (React.isValidElement(child)) {
      // Clone the element with additional props
      return React.cloneElement(child, { selectedSymbol } as any)
    }
    return child
  })

  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold hidden md:inline-block">BTC Intraday Predictor</span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:gap-6">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.path ? "text-primary" : "text-muted-foreground",
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">{childrenWithProps}</div>
      </main>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
          <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-background p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <BarChart3 className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">BTC Intraday Predictor</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
            <nav className="mt-6">
              <ul className="space-y-2">
                {routes.map((route) => (
                  <li key={route.path}>
                    <Link
                      href={route.path}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                        pathname === route.path
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <route.icon className="h-4 w-4" />
                      <span>{route.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

