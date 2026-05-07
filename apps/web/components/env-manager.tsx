"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Delete02Icon,
  ViewIcon,
  ViewOffIcon,
  InformationCircleIcon,
  Shield01Icon
} from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { toast } from "sonner"
import type { Env } from "@workspace/database"

interface EnvManagerProps {
  projectId: string
  envs: Env[]
}

export function EnvManager({ projectId, envs }: EnvManagerProps) {
  const queryClient = useQueryClient()
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [visibleEnvs, setVisibleEnvs] = useState<Record<string, boolean>>({})

  const addMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch(`/api/v1/projects/${projectId}/envs`, {
        method: "POST",
        body: JSON.stringify({ key, value }),
      })
      if (!res.ok) throw new Error("Failed to save environment variable")
      return res.json()
    },
    onSuccess: () => {
      setNewKey("")
      setNewValue("")
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Environment variable saved")
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (envId: string) => {
      const res = await fetch(`/api/v1/projects/${projectId}/envs?envId=${envId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete environment variable")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Environment variable deleted")
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey || !newValue) return
    addMutation.mutate({ key: newKey, value: newValue })
  }

  const toggleVisibility = (id: string) => {
    setVisibleEnvs(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <HugeiconsIcon icon={Shield01Icon} size={20} className="text-primary" />
          <CardTitle className="text-xl">Environment Variables</CardTitle>
        </div>
        <CardDescription className="flex items-center gap-1.5">
          <HugeiconsIcon icon={InformationCircleIcon} size={14} />
          Variables added here will be available to your build and runtime environments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form to add new env */}
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3 items-end bg-muted/20 p-4 rounded-2xl border border-border/50">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Key</label>
            <Input
              placeholder="e.g. API_KEY"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              className="bg-background/50 border-border/50 rounded-xl"
            />
          </div>
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Value</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="bg-background/50 border-border/50 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={addMutation.isPending || !newKey || !newValue}
            className="rounded-xl px-6"
          >
            {addMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={Add01Icon} size={18} />
                Add Variable
              </span>
            )}
          </Button>
        </form>

        {/* List of existing envs */}
        <div className="space-y-3">
          {envs.length > 0 ? (
            envs.map((env) => (
              <div
                key={env.id}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border/30 bg-background/30 hover:bg-background/50 transition-colors group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 flex-1 min-w-0">
                  <div className="w-full md:w-1/3 truncate">
                    <code className="text-sm font-mono font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded uppercase tracking-tight">
                      {env.key}
                    </code>
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <code className="text-sm font-mono text-muted-foreground truncate">
                      {visibleEnvs[env.id] ? "Encrypted (Value hidden)" : "••••••••••••••••"}
                    </code>
                    {/* Note: We don't actually reveal the value from the client side because it's encrypted in DB and we don't send decrypted values to GET */}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={() => toggleVisibility(env.id)}
                    title={visibleEnvs[env.id] ? "Hide" : "Show info"}
                  >
                    <HugeiconsIcon icon={visibleEnvs[env.id] ? ViewOffIcon : ViewIcon} size={18} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete ${env.key}?`)) {
                        deleteMutation.mutate(env.id)
                      }
                    }}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={18} />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border/30 rounded-2xl bg-muted/5">
              <HugeiconsIcon icon={Shield01Icon} size={32} className="text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">No environment variables defined yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
