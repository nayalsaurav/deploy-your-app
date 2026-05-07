"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import type { Project, Deployment, Env } from "@workspace/database"
import { EnvManager } from "@/components/env-manager"
import {
  HugeiconsIcon
} from "@hugeicons/react"
import {
  GithubIcon,
  GitBranchIcon,
  Link01Icon,
  Time02Icon,
  Calendar01Icon,
  ArrowRight01Icon,
  Tick02Icon,
  CircleIcon,
  AlertCircleIcon,
  Folder01Icon,
  Delete02Icon,
  TerminalFreeIcons
} from "@hugeicons/core-free-icons"
import { ServerLogsDialog } from "@/components/server-logs-dialog"
import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"

export default function ProjectDetail() {
  const { id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)

  const { data, isLoading, error } = useQuery<{ data: { project: Project & { deployments: Deployment[], envs: Env[] } } }>({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete project")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      router.push("/dashboard/projects")
    },
  })

  const deployMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/projects/${id}/deploy`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to queue deployment")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] })
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
    },
  })

  const project = data?.data?.project

  if (isLoading) return <ProjectDetailSkeleton />
  if (error || !project) return <ProjectError />

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      {/* Upper Part: Project Info */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">Projects</Link>
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
              <span className="text-foreground font-medium">{project.name}</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            {project.deploymentUrl && (
              <a
                href={
                  project.deploymentUrl.includes(".")
                    ? project.deploymentUrl.startsWith("http")
                      ? project.deploymentUrl
                      : project.deploymentUrl.endsWith(".localhost")
                        ? `http://${project.deploymentUrl}`
                        : `https://${project.deploymentUrl}`
                    : `http://${project.deploymentUrl}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost"}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <HugeiconsIcon icon={Link01Icon} size={16} />
                <span>Visit Site</span>
              </a>
            )}
            <button
              onClick={() => deployMutation.mutate()}
              disabled={deployMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              <HugeiconsIcon icon={Tick02Icon} size={16} className="text-muted-foreground" />
              <span>{deployMutation.isPending ? "Deploying..." : "Redeploy"}</span>
            </button>

            <button
              onClick={() => setShowLogsDialog(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <HugeiconsIcon icon={TerminalFreeIcons} size={16} className="text-muted-foreground" />
              <span>Server Logs</span>
            </button>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger render={
                <Button variant="destructive" className={"px-5 py-2.5 text-sm font-medium shadow-sm"}>
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
                  <span>Delete</span>
                </Button>
              } />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete <strong>{project.name}</strong> and remove all associated deployment data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HugeiconsIcon icon={GithubIcon} size={16} /> Repository
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold truncate">{project.repositoryFullName}</p>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <HugeiconsIcon icon={GitBranchIcon} size={14} />
                <span>{project.defaultBranch}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HugeiconsIcon icon={Calendar01Icon} size={16} /> Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {new Date(project.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
              <span className="text-sm text-muted-foreground">Registration date</span>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HugeiconsIcon icon={Link01Icon} size={16} /> Production URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold truncate">
                {project.deploymentUrl
                  ? project.deploymentUrl.includes(".")
                    ? project.deploymentUrl.replace("https://", "")
                    : `${project.deploymentUrl}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost"}`
                  : "No deployment yet"}
              </p>
              <span className="text-sm text-muted-foreground">Main domain</span>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="bg-border/50" />

      {/* Middle Part: Environment Variables */}
      <section>
        <EnvManager projectId={id as string} envs={project.envs || []} />
      </section>

      <Separator className="bg-border/50" />

      {/* Lower Part: Deployments */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Deployments</h2>
          <Badge variant="outline" className="rounded-full px-3 py-1 font-medium bg-muted/30">
            {project.deployments.length} total
          </Badge>
        </div>

        <div className="space-y-4">
          {project.deployments.map((deployment) => (
            <Link
              key={deployment.id}
              href={`/dashboard/deployments/${deployment.id}`}
              className="group block"
            >
              <Card className="border-border/50 bg-card/30 transition-all hover:bg-card/80 hover:border-primary/20 hover:shadow-md overflow-hidden relative">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={deployment.status} />
                      <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        {deployment.id.slice(0, 8)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-medium text-base group-hover:text-primary transition-colors">
                        Deployment to {deployment.branch}
                      </h4>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <HugeiconsIcon icon={GithubIcon} size={14} />
                        <span>
                          {deployment.commitHash
                            ? `Triggered by GitHub push (${deployment.commitHash.substring(0, 7)})`
                            : "Triggered manually via dashboard"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <HugeiconsIcon icon={Time02Icon} size={14} />
                      <span>{new Date(deployment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {new Date(deployment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Visual progression indicator if building */}
                {deployment.status === 'BUILDING' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
                    <div className="h-full bg-primary animate-[shimmer_1s_infinite] w-1/3" />
                  </div>
                )}
              </Card>
            </Link>
          ))}

          {project.deployments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <HugeiconsIcon icon={Folder01Icon} size={28} />
              </div>
              <h3 className="text-lg font-semibold">No deployments yet</h3>
              <p className="text-muted-foreground max-w-xs mt-1">
                Once you trigger a build, your deployment history will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      <ServerLogsDialog
        projectId={id as string}
        isOpen={showLogsDialog}
        onOpenChange={setShowLogsDialog}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    SUCCESS: { label: "Ready", variant: "default", icon: Tick02Icon, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    BUILDING: { label: "Building", variant: "secondary", icon: CircleIcon, color: "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse" },
    FAILED: { label: "Error", variant: "destructive", icon: AlertCircleIcon, color: "bg-red-500/10 text-red-600 border-red-500/20" },
    PENDING: { label: "Queued", variant: "outline", icon: CircleIcon, color: "bg-muted/50 text-muted-foreground" },
    CLONING: { label: "Cloning", variant: "outline", icon: CircleIcon, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  } as const

  const badge = config[status as keyof typeof config] || config.PENDING
  const { label, icon, color } = badge

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <HugeiconsIcon icon={icon} size={12} strokeWidth={3} />
      <span>{label}</span>
    </div>
  )
}

function ProjectDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-7xl mx-auto w-full animate-pulse">
      <div className="h-12 w-64 bg-muted rounded-xl mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
      </div>
      <div className="h-1 bg-muted w-full my-4" />
      <div className="space-y-4">
        <div className="h-8 w-40 bg-muted rounded-lg" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
      </div>
    </div>
  )
}

function ProjectError() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
      <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 text-destructive">
        <HugeiconsIcon icon={AlertCircleIcon} size={32} />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Project not found</h2>
      <p className="text-muted-foreground mt-2 max-w-sm">
        We couldn't find the project you're looking for. It may have been deleted or you may not have access to it.
      </p>
      <Link href="/dashboard/projects" className="mt-8 text-primary font-medium hover:underline">
        Back to projects
      </Link>
    </div>
  )
}
