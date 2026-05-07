"use client"

import { useState } from "react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, Delete01Icon, FileCodeIcon, LeftToRightListBulletIcon } from "@hugeicons/core-free-icons"

export interface EnvVar {
    key: string
    value: string
}

interface EnvVarsInputProps {
    envs: EnvVar[]
    setEnvs: (envs: EnvVar[]) => void
    disabled?: boolean
}

export function EnvVarsInput({ envs, setEnvs, disabled }: EnvVarsInputProps) {
    const [isBulkEdit, setIsBulkEdit] = useState(false)
    const [bulkText, setBulkText] = useState("")

    const handleAdd = () => {
        setEnvs([...envs, { key: "", value: "" }])
    }

    const handleRemove = (index: number) => {
        setEnvs(envs.filter((_, i) => i !== index))
    }

    const handleChange = (index: number, field: keyof EnvVar, value: string) => {
        let processedValue = value
        if (field === "value") {
            processedValue = value.trim()
            if ((processedValue.startsWith('"') && processedValue.endsWith('"')) ||
                (processedValue.startsWith("'") && processedValue.endsWith("'"))) {
                processedValue = processedValue.slice(1, -1)
            }
        }

        const newEnvs = envs.map((env, i) =>
            i === index ? { ...env, [field]: processedValue } : env
        )
        setEnvs(newEnvs)
    }

    const parseAndSetEnvs = (text: string) => {
        const parsed = text
            .split("\n")
            .filter(line => line.trim() && !line.startsWith("#"))
            .map(line => {
                const firstEqual = line.indexOf("=")
                if (firstEqual === -1) return { key: line.trim(), value: "" }
                const key = line.slice(0, firstEqual).trim()
                let value = line.slice(firstEqual + 1).trim()

                // Strip quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1)
                }

                return { key, value }
            })
            .filter(e => e.key)
        setEnvs(parsed)
    }

    const handleBulkChange = (text: string) => {
        setBulkText(text)
        parseAndSetEnvs(text)
    }

    const handleBulkSwitch = () => {
        if (!isBulkEdit) {
            // Convert current envs to .env format
            const text = envs
                .filter(e => e.key)
                .map(e => `${e.key}=${e.value}`)
                .join("\n")
            setBulkText(text)
        }
        setIsBulkEdit(!isBulkEdit)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Environment Variables</Label>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBulkSwitch}
                    disabled={disabled}
                    className="text-xs h-8"
                >
                    <HugeiconsIcon 
                        icon={isBulkEdit ? LeftToRightListBulletIcon : FileCodeIcon} 
                        size={14} 
                        className="mr-2" 
                    />
                    {isBulkEdit ? "Switch to List" : "Paste .env"}
                </Button>
            </div>

            {isBulkEdit ? (
                <div className="space-y-2">
                    <Textarea
                        placeholder="KEY=VALUE&#10;DATABASE_URL=postgres://..."
                        value={bulkText}
                        onChange={(e) => handleBulkChange(e.target.value)}
                        disabled={disabled}
                        className="min-h-[200px] font-mono text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                        Each variable should be on a new line in KEY=VALUE format.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {envs.map((env, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                placeholder="VARIABLE_NAME"
                                value={env.key}
                                onChange={(e) => handleChange(index, "key", e.target.value)}
                                disabled={disabled}
                                className="h-9 text-xs font-mono"
                            />
                            <Input
                                placeholder="value"
                                value={env.value}
                                onChange={(e) => handleChange(index, "value", e.target.value)}
                                disabled={disabled}
                                className="h-9 text-xs font-mono"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(index)}
                                disabled={disabled}
                                className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                            >
                                <HugeiconsIcon icon={Delete01Icon} size={16} />
                            </Button>
                        </div>
                    ))}
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAdd}
                        disabled={disabled}
                        className="w-full h-9 border-dashed"
                    >
                        <HugeiconsIcon icon={PlusSignIcon} size={14} className="mr-2" />
                        Add Variable
                    </Button>
                </div>
            )}
        </div>
    )
}
