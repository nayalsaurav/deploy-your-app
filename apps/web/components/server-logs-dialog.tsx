"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, TerminalFreeIcons } from "@hugeicons/core-free-icons"

interface ServerLogsDialogProps {
  projectId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ServerLogsDialog({
  projectId,
  isOpen,
  onOpenChange,
}: ServerLogsDialogProps) {
  const [logs, setLogs] = React.useState<string[]>([])
  const logsEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let eventSource: EventSource | null = null

    if (isOpen) {
      eventSource = new EventSource(`/api/v1/projects/${projectId}/server-logs`)

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLogs((prev) => [...prev, data.text])
        } catch (e) {
          console.error("Failed to parse log message", e)
        }
      }

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error)
        eventSource?.close()
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      // Optional: Clear logs on close if you want a fresh state every time
      // setLogs([])
    }
  }, [projectId, isOpen])

  // Auto-scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] flex flex-col max-h-[85vh]">
        <DialogHeader className="flex flex-row items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={TerminalFreeIcons} size={20} className="text-muted-foreground" />
            <div>
              <DialogTitle>Live Server Logs</DialogTitle>
              <DialogDescription>
                Streaming output directly from your application container.
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLogs([])}
            className="mr-10"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            <span className="ml-2">Clear Logs</span>
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-300 p-4 rounded-xl border border-zinc-800 font-mono text-xs leading-relaxed mt-4">
          {logs.length === 0 ? (
            <div className="text-zinc-500 italic">Waiting for logs...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap break-all">
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
