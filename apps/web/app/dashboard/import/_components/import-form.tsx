"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Rocket01Icon } from "@hugeicons/core-free-icons"
import { GithubRepository } from "@/lib/types"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { EnvVar, EnvVarsInput } from "./env-vars-input"

interface ImportFormProps {
    selectedRepo: GithubRepository | null
    setSelectedRepo: (repo: GithubRepository | null) => void
    projectName: string
    setProjectName: (name: string) => void
    defaultBranch: string
    setDefaultBranch: (branch: string) => void
    buildCommand: string
    setBuildCommand: (cmd: string) => void
    startCommand: string
    setStartCommand: (cmd: string) => void
    rootDirectory: string
    setRootDirectory: (dir: string) => void
    envs: EnvVar[]
    setEnvs: (envs: EnvVar[]) => void
    handleDeploy: () => void
    isImporting: boolean
    submitError: string | undefined
}

export function ImportForm({
    selectedRepo,
    setSelectedRepo,
    projectName,
    setProjectName,
    defaultBranch,
    setDefaultBranch,
    buildCommand,
    setBuildCommand,
    startCommand,
    setStartCommand,
    rootDirectory,
    setRootDirectory,
    envs,
    setEnvs,
    handleDeploy,
    isImporting,
    submitError
}: ImportFormProps) {
    if (!selectedRepo) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full space-y-4">
                <div className="rounded-full bg-muted/20 p-6 border border-dashed">
                    <HugeiconsIcon icon={Rocket01Icon} size={48} className="text-muted-foreground/30" />
                </div>
                <div className="space-y-2 max-w-sm">
                    <h2 className="text-2xl font-semibold tracking-tight">Select a repository</h2>
                    <p className="text-sm text-muted-foreground">
                        Search and select a Git repository from the list on the left to start configuring your deployment.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-muted/5 justify-center items-center p-6 w-full">
            <div className="max-w-xl w-full space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedRepo(null)}
                    className="mb-2 w-fit -ml-4"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="mr-2" />
                    Cancel selection
                </Button>

                <Card className="shadow-lg border-primary/20 bg-background/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Configure Project</CardTitle>
                        <CardDescription className="text-base">
                            You are importing <strong className="text-foreground">{selectedRepo.fullName}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {submitError && (
                            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                                {submitError}
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label htmlFor="projectName" className="text-sm font-medium">Project Name</Label>
                            <Input
                                id="projectName"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="my-awesome-project"
                                disabled={isImporting}
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="defaultBranch" className="text-sm font-medium">Production Branch</Label>
                            <Input
                                id="defaultBranch"
                                value={defaultBranch}
                                onChange={(e) => setDefaultBranch(e.target.value)}
                                disabled={isImporting}
                                className="h-11"
                            />
                            <p className="text-xs text-muted-foreground">
                                This branch will be deployed automatically on every push.
                            </p>
                        </div>

                        <Accordion className="w-full">
                            <AccordionItem value="advanced" className="border-none">
                                <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline rounded-md px-3 bg-muted/40 hover:bg-muted/60 transition-colors">
                                    Advanced Settings
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 pb-2 px-1 space-y-4">
                                    <div className="space-y-3">
                                        <Label htmlFor="rootDirectory" className="text-sm font-medium">Root Directory</Label>
                                        <Input
                                            id="rootDirectory"
                                            value={rootDirectory}
                                            onChange={(e) => setRootDirectory(e.target.value)}
                                            placeholder="./"
                                            disabled={isImporting}
                                            className="h-11"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            The directory within your repository where your code is located.
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="buildCommand" className="text-sm font-medium">Build Command</Label>
                                        <Input
                                            id="buildCommand"
                                            value={buildCommand}
                                            onChange={(e) => setBuildCommand(e.target.value)}
                                            placeholder="npm run build"
                                            disabled={isImporting}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="startCommand" className="text-sm font-medium">Start Command</Label>
                                        <Input
                                            id="startCommand"
                                            value={startCommand}
                                            onChange={(e) => setStartCommand(e.target.value)}
                                            placeholder="npm start"
                                            disabled={isImporting}
                                            className="h-11"
                                        />
                                    </div>

                                    <div className="pt-2 border-t">
                                        <EnvVarsInput 
                                            envs={envs} 
                                            setEnvs={setEnvs} 
                                            disabled={isImporting} 
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-3 pt-6 border-t bg-muted/20">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedRepo(null)}
                            disabled={isImporting}
                            size="lg"
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleDeploy} disabled={isImporting} size="lg" className="min-w-[120px]">
                            {isImporting ? (
                                "Importing..."
                            ) : (
                                <>
                                    <HugeiconsIcon icon={Rocket01Icon} size={18} className="mr-2" />
                                    Deploy
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
