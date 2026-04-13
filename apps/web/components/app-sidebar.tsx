"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home11Icon, Folder01Icon, PlusSignIcon, Rocket01Icon, Plug01Icon, Settings01Icon } from "@hugeicons/core-free-icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@workspace/ui/components/sidebar"
import { User } from "@/lib/auth"

const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: <HugeiconsIcon icon={Home11Icon} strokeWidth={2} size={16} />,
    },
    {
      title: "Projects",
      url: "/dashboard/projects",
      icon: <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} size={16} />,
    },
    {
      title: "Import",
      url: "/dashboard/import",
      icon: <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} size={16} />,
    },
    {
      title: "Deployments",
      url: "/dashboard/deployments",
      icon: <HugeiconsIcon icon={Rocket01Icon} strokeWidth={2} size={16} />,
    },
    {
      title: "Integrations",
      url: "/dashboard/integrations",
      icon: <HugeiconsIcon icon={Plug01Icon} strokeWidth={2} size={16} />,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} size={16} />,
    },
  ],
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: User }) {

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-pink-500 text-white">
                <HugeiconsIcon icon={Rocket01Icon} size={20} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-lg">Hakuro</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}



