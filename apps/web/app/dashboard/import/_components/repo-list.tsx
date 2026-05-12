"use client"

import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { GithubRepository } from "@/lib/types"

interface RepoListProps {
    search: string
    setSearch: (search: string) => void
    loading: boolean
    error: string | null
    refetch: () => void
    filteredRepos: GithubRepository[]
    hasNextPage: boolean
    isFetchingNextPage: boolean
    fetchNextPage: () => void
    onImportClick: (repo: GithubRepository) => void
    selectedRepo: GithubRepository | null
}

export function RepoList({
    search,
    setSearch,
    loading,
    error,
    refetch,
    filteredRepos,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    onImportClick,
    selectedRepo
}: RepoListProps) {
    return (
        <div className="flex flex-col h-full bg-background border-r border-border">
            {/* Header & Search */}
            <div className="p-6 border-b border-border shrink-0 space-y-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Import Git Repository</h1>
                    <p className="text-sm text-muted-foreground">
                        Select a repository from your GitHub account to deploy.
                    </p>
                </div>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        <HugeiconsIcon icon={Search01Icon} size={16} />
                    </div>
                    <Input
                        placeholder="Search repositories..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Card key={i} className="animate-pulse flex flex-col p-4 shadow-sm space-y-2">
                                <div className="h-5 bg-muted rounded w-1/3"></div>
                                <div className="h-4 bg-muted rounded w-1/4"></div>
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-6 text-red-500 flex flex-col items-center">
                            <p className="mb-4 text-sm font-medium">{error}</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()}>
                                Retry
                            </Button>
                        </CardContent>
                    </Card>
                ) : filteredRepos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full border border-dashed rounded-xl bg-background">
                        <HugeiconsIcon icon={Search01Icon} size={32} className="mb-4 opacity-50" />
                        <p className="text-sm">No repositories found.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredRepos.map((repo) => (
                            <Card
                                key={repo.id}
                                className={`p-4 shadow-sm transition-all duration-200 hover:border-primary/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${selectedRepo?.id === repo.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''}`}
                                onClick={() => onImportClick(repo)}
                            >
                                <div className="flex flex-col space-y-1 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold truncate">{repo.name}</h3>
                                        {repo.private && (
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border">
                                                Private
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{repo.fullName}</p>

                                    <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
                                        {repo.language && (
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-primary/40"></span>
                                                {repo.language}
                                            </span>
                                        )}
                                        {repo.updatedAt && (
                                            <>
                                                <span>•</span>
                                                <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onImportClick(repo);
                                    }}
                                    variant={selectedRepo?.id === repo.id ? "default" : "secondary"}
                                    size="sm"
                                    className="shrink-0"
                                >
                                    {selectedRepo?.id === repo.id ? "Selected" : "Import"}
                                </Button>
                            </Card>
                        ))}

                        {hasNextPage && (
                            <Button
                                variant="ghost"
                                className="mt-2 w-full text-muted-foreground"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage || !!search}
                            >
                                {isFetchingNextPage ? "Loading more..." : "Load More Repositories"}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
