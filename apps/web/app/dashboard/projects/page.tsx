"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Project } from "@workspace/database"
import {
  HugeiconsIcon
} from "@hugeicons/react"
import {
  Folder01Icon,
  GithubIcon,
  Time02Icon,
  Settings02Icon,
  Link01Icon,
  PlusSignIcon,
  GitBranchIcon,
  Delete02Icon
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu"
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
import { useState } from "react"

export default function ProjectsPage() {
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery<{ data: { projects: Project[] } }>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/v1/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete project")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setDeletingId(null)
    },
  })

  const projects = data?.data?.projects || []

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and deploy your applications with ease.
          </p>
        </div>
        <Link
          href="/dashboard/import"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={18} />
          <span>New Project</span>
        </Link>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted/30 animate-pulse border border-border/50" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-destructive/20 bg-destructive/10">
          <p className="text-destructive font-medium">Failed to load projects. Please try again later.</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/10">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
            <HugeiconsIcon icon={Folder01Icon} size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            You haven't created any projects yet. Start by importing a repository to deploy.
          </p>
          <Link
            href="/dashboard/import"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground shadow-sm transition-all hover:bg-secondary/80"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={18} />
            <span>Create First Project</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-xl hover:border-border/80"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <HugeiconsIcon icon={Folder01Icon} size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <HugeiconsIcon icon={GithubIcon} size={14} />
                      <span className="line-clamp-1">{project.repositoryFullName}</span>
                    </div>
                  </div>
                </div>


              </div>

              {/* URL */}
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
                  className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <HugeiconsIcon icon={Link01Icon} size={14} />
                  <span>
                    {project.deploymentUrl.includes(".")
                      ? project.deploymentUrl.replace("https://", "")
                      : `${project.deploymentUrl}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost"}`}
                  </span>
                </a>
              )}

              <div className="mt-auto pt-6 flex items-center justify-between border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                    <HugeiconsIcon icon={GitBranchIcon} size={14} />
                    <span>{project.defaultBranch}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Time02Icon} size={14} />
                    <span>
                      {new Date(project.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Overlay Layer */}
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="absolute inset-x-0 bottom-0 top-[88px] z-10"
                aria-label={`View ${project.name}`}
              />
            </div>
          ))}
        </div>
      )}
      {/* Deletion Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              project and remove all associated deployment data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
