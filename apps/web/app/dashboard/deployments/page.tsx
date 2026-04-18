"use client"

import { useQuery } from "@tanstack/react-query"
import type { Deployment, Project } from "@workspace/database"
import { 
  HugeiconsIcon 
} from "@hugeicons/react"
import { 
  GithubIcon, 
  GitBranchIcon, 
  Time02Icon, 
  ArrowRight01Icon,
  Tick02Icon,
  CircleIcon,
  AlertCircleIcon,
  Folder01Icon,
  Rocket01Icon
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

export default function DeploymentsPage() {
  const { data, isLoading, error } = useQuery<{ data: { deployments: (Deployment & { project: Project })[] } }>({
    queryKey: ["deployments"],
    queryFn: async () => {
      const res = await fetch("/api/v1/deployments")
      if (!res.ok) throw new Error("Failed to fetch deployments")
      return res.json()
    },
  })

  const deployments = data?.data?.deployments || []

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Deployments</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and track all your application builds in one place.
          </p>
        </div>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse border border-border/50" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-destructive/20 bg-destructive/10">
          <p className="text-destructive font-medium">Failed to load deployments. Please try again later.</p>
        </div>
      ) : deployments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/10">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
            <HugeiconsIcon icon={Rocket01Icon} size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            When you deploy a project, your build history will appear here.
          </p>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
          >
            <span>View Projects</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {deployments.map((deployment) => (
            <Link 
              key={deployment.id}
              href={`/dashboard/deployments/${deployment.id}`}
              className="group block"
            >
              <Card className="border-border/50 bg-card/40 transition-all hover:bg-card hover:border-primary/20 hover:shadow-lg overflow-hidden relative">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      {/* Project Context */}
                      <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <HugeiconsIcon icon={Folder01Icon} size={24} />
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={deployment.status} />
                          <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                            {deployment.project.name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={GitBranchIcon} size={14} />
                            <span>{deployment.branch}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={GithubIcon} size={14} />
                            <span className="font-mono text-[10px]">{deployment.commitHash?.slice(0, 7) || 'Manual'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-1.5 text-sm">
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <HugeiconsIcon icon={Time02Icon} size={14} />
                        <span>{new Date(deployment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {new Date(deployment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status loading bar */}
                  {['BUILDING', 'CLONING', 'DEPLOYING'].includes(deployment.status) && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10">
                      <div className="h-full bg-primary animate-[shimmer_1s_infinite] w-1/4" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    SUCCESS: { label: "Ready", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Tick02Icon },
    BUILDING: { label: "Building", color: "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse", icon: CircleIcon },
    FAILED: { label: "Error", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: AlertCircleIcon },
    PENDING: { label: "Queued", color: "bg-muted/50 text-muted-foreground border-transparent", icon: CircleIcon },
    CLONING: { label: "Cloning", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: CircleIcon },
    DEPLOYING: { label: "Deploying", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse", icon: CircleIcon },
  } as const

  const badge = config[status as keyof typeof config] || config["PENDING"]
  const { label, color, icon } = badge

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${color}`}>
      <HugeiconsIcon icon={icon} size={10} strokeWidth={4} />
      <span>{label}</span>
    </div>
  )
}
