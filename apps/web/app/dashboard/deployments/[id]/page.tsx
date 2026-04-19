"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import type { Deployment, Project } from "@workspace/database"
import {
  HugeiconsIcon
} from "@hugeicons/react"
import {
  GitBranchIcon,
  Link01Icon,
  Time02Icon,
  Calendar01Icon,
  ArrowRight01Icon,
  Tick02Icon,
  CircleIcon,
  AlertCircleIcon,
  TerminalIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

export default function DeploymentDetail() {
  const { id } = useParams()
  const logEndRef = useRef<HTMLDivElement>(null)
  const [logs, setLogs] = useState<string>("")

  const { data, isLoading, error } = useQuery<{ data: { deployment: Deployment & { project: Project } } }>({
    queryKey: ["deployment", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/deployments/${id}`)
      if (!res.ok) throw new Error("Failed to fetch deployment")
      return res.json()
    },
  })

  const deployment = data?.data?.deployment

  useEffect(() => {
    if (!deployment) return
    if (deployment.logs) setLogs(deployment.logs)

    // If deployment is in progress, stream logs
    if (['BUILDING', 'CLONING', 'DEPLOYING'].includes(deployment.status)) {
      const eventSource = new EventSource(`/api/v1/deployments/${id}/logs`)

      eventSource.onmessage = (event) => {
        try {
          const { text } = JSON.parse(event.data)
          setLogs((prev) => prev + text)
        } catch (e) {
          console.error("Failed to parse log event", e)
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
      }

      return () => eventSource.close()
    }
  }, [deployment, id])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  if (isLoading) return <DeploymentDetailSkeleton />
  if (error || !deployment) return <DeploymentError />

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">Projects</Link>
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
            <Link href={`/dashboard/projects/${deployment.projectId}`} className="hover:text-foreground transition-colors">{deployment.project.name}</Link>
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
            <span className="text-foreground font-medium">Deployment</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold tracking-tight">Deployment</h1>
            <StatusBadge status={deployment.status} />
          </div>
          <p className="text-muted-foreground font-mono text-xs">{deployment.id}</p>
        </div>

        <div className="flex items-center gap-3">
            {deployment.url && (
              <a
                href={
                  deployment.url.includes(".")
                    ? deployment.url.startsWith("http")
                      ? deployment.url
                      : deployment.url.endsWith(".localhost")
                        ? `http://${deployment.url}`
                        : `https://${deployment.url}`
                    : `http://${deployment.url}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost"}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <HugeiconsIcon icon={Link01Icon} size={16} />
                <span>Visit Deployment</span>
              </a>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HugeiconsIcon icon={InformationCircleIcon} size={18} className="text-primary" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Project</p>
                <p className="font-medium">{deployment.project.name}</p>
              </div>
              <Separator className="bg-border/30" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Branch</p>
                <div className="flex items-center gap-1.5 font-medium">
                  <HugeiconsIcon icon={GitBranchIcon} size={14} />
                  <span>{deployment.branch}</span>
                </div>
              </div>
              <Separator className="bg-border/30" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Timeline</p>
                <div className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-muted-foreground" />
                  <span>Created {new Date(deployment.createdAt).toLocaleString()}</span>
                </div>
                {deployment.completedAt && (
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <HugeiconsIcon icon={Tick02Icon} size={14} className="text-muted-foreground" />
                    <span>Finished {new Date(deployment.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
              {deployment.port && (
                <>
                  <Separator className="bg-border/30" />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Port Allocation</p>
                    <p className="font-mono text-sm">{deployment.port}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {deployment.error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                  <HugeiconsIcon icon={AlertCircleIcon} size={18} />
                  Error Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono text-red-700 whitespace-pre-wrap">
                  {deployment.error}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <HugeiconsIcon icon={TerminalIcon} size={20} className="text-primary" />
              Build Logs
            </h3>
            <Badge variant="outline" className="font-mono text-[10px] tracking-tighter">
              REALTIME_FEED
            </Badge>
          </div>

          <Card className="bg-black border-zinc-800 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono ml-2">builder.sh — 80x24</span>
              </div>
              <ScrollArea className="h-[600px] w-full bg-black">
                <div className="p-4 font-mono text-xs leading-relaxed text-zinc-300">
                  {logs ? (
                    <pre className="whitespace-pre-wrap break-all whitespace-pre-wrap">
                      {logs}
                      <div ref={logEndRef} className="h-1" />
                    </pre>
                  ) : (
                    <p className="text-zinc-600 italic">No logs available for this deployment step.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    SUCCESS: { label: "Success", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Tick02Icon },
    BUILDING: { label: "Building", color: "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse", icon: CircleIcon },
    FAILED: { label: "Failed", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertCircleIcon },
    PENDING: { label: "Queued", color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20", icon: CircleIcon },
    CLONING: { label: "Cloning", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: CircleIcon },
    DEPLOYING: { label: "Deploying", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: CircleIcon },
  } as const

  const badge = config[status as keyof typeof config] || config.PENDING
  const { label, color, icon } = badge

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${color}`}>
      <HugeiconsIcon icon={icon} size={14} strokeWidth={3} />
      <span>{label}</span>
    </div>
  )
}

function DeploymentDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-7xl mx-auto w-full animate-pulse">
      <div className="h-12 w-96 bg-muted rounded-xl mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="h-[400px] bg-muted rounded-2xl" />
        <div className="lg:col-span-2 h-[600px] bg-muted rounded-2xl" />
      </div>
    </div>
  )
}

function DeploymentError() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
      <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 text-destructive">
        <HugeiconsIcon icon={AlertCircleIcon} size={32} />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Deployment not found</h2>
      <p className="text-muted-foreground mt-2 max-w-sm">
        We couldn't retrieve the details for this deployment.
      </p>
      <Link href="/dashboard/projects" className="mt-8 text-primary font-medium hover:underline">
        Back to projects
      </Link>
    </div>
  )
}
