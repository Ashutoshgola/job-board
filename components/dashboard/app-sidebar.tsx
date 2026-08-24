'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Briefcase01Icon,
  CreditCardIcon,
  File02Icon,
  Settings01Icon,
  TaskDone01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'

const mainNavItems = [
  { title: 'Jobs', href: '/dashboard/jobs', icon: Briefcase01Icon },
  { title: 'Resume', href: '/dashboard/resume', icon: File02Icon },
  { title: 'Profile', href: '/dashboard/profile', icon: UserIcon },
  {
    title: 'Application Status',
    href: '/dashboard/application-status',
    icon: TaskDone01Icon,
  },
] as const

const footerNavItems = [
  {
    title: 'Billing / Credits',
    href: '/dashboard/billing',
    icon: CreditCardIcon,
  },
  {
    title: 'Profile Settings',
    href: '/dashboard/settings',
    icon: Settings01Icon,
  },
] as const

const CREDITS_TOTAL = 100
const CREDITS_USED = 0

function CreditsWidget() {
  const remaining = CREDITS_TOTAL - CREDITS_USED
  const usagePercent = (CREDITS_USED / CREDITS_TOTAL) * 100

  return (
    <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3 group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-sidebar-foreground">Credits</p>
        <p className="text-xs tabular-nums text-sidebar-foreground/70">
          {CREDITS_USED} / {CREDITS_TOTAL}
        </p>
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
        {remaining}
        <span className="ml-1 text-xs font-normal text-sidebar-foreground/70">
          remaining
        </span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sidebar-border">
        <div
          className="h-full rounded-full bg-sidebar-primary transition-all"
          style={{ width: `${usagePercent}%` }}
        />
      </div>
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              tooltip="JobBuddy AI"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                JB
              </span>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">JobBuddy AI</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <CreditsWidget />
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {footerNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
