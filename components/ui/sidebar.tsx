"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const sidebarVariants = cva("relative flex h-full flex-col border-r bg-background transition-all", {
  variants: {
    variant: {
      default: "w-64",
      inset: "w-64",
    },
    collapsible: {
      icon: "w-64 data-[collapsed=true]:w-16",
      full: "w-64 data-[collapsed=true]:w-0",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface SidebarContextValue {
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

function useSidebarContext() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

function SidebarProvider({ children, defaultCollapsed = false }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

  return <SidebarContext.Provider value={{ collapsed, setCollapsed }}>{children}</SidebarContext.Provider>
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof sidebarVariants> {
  children?: React.ReactNode
}

function Sidebar({ children, className, variant, collapsible, ...props }: SidebarProps) {
  const { collapsed } = useSidebarContext()

  return (
    <div
      className={cn(sidebarVariants({ variant, collapsible }), className)}
      data-collapsed={collapsible ? collapsed : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("border-b px-4 py-3", className)} {...props} />,
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex-1 overflow-auto", className)} {...props} />,
)
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("border-t px-4 py-3", className)} {...props} />,
)
SidebarFooter.displayName = "SidebarFooter"

function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { collapsed, setCollapsed } = useSidebarContext()

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      onClick={() => setCollapsed(!collapsed)}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("h-5 w-5 transition-transform", collapsed ? "rotate-180" : "rotate-0")}
      >
        <path d="m15 6-6 6 6 6" />
      </svg>
      <span className="sr-only">Toggle sidebar</span>
    </button>
  )
}

const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("px-2 py-2", className)} {...props} />,
)
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { collapsed } = useSidebarContext()

    return (
      <div
        ref={ref}
        className={cn("mb-2 px-2 text-xs font-semibold text-muted-foreground", collapsed && "sr-only", className)}
        {...props}
      />
    )
  },
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("space-y-1", className)} {...props} />,
)
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("space-y-1", className)} {...props} />,
)
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />,
)
SidebarMenuItem.displayName = "SidebarMenuItem"

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
  tooltip?: string
  asChild?: boolean
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive, tooltip, asChild = false, ...props }, ref) => {
    const { collapsed } = useSidebarContext()
    const Comp = asChild ? React.Fragment : "button"
    const childProps = asChild ? {} : props

    return (
      <Comp {...childProps}>
        <button
          ref={ref}
          className={cn(
            "group relative flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground",
            className,
          )}
          {...(!asChild ? {} : props)}
        >
          {props.children}
          {collapsed && tooltip && (
            <div className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground opacity-0 shadow group-hover:opacity-100">
              {tooltip}
            </div>
          )}
        </button>
      </Comp>
    )
  },
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
}

