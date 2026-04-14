"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useInfiniteQuery, useMutation } from "@tanstack/react-query"
import { GithubRepository } from "@/lib/types"

import { RepoList } from "./_components/repo-list"
import { ImportForm } from "./_components/import-form"

export default function ImportPage() {
    const router = useRouter()
    const [search, setSearch] = useState("")

    const [selectedRepo, setSelectedRepo] = useState<any>(null)

    // Form fields
    const [projectName, setProjectName] = useState("")
    const [defaultBranch, setDefaultBranch] = useState("main")

    // Fetch repositories
    const {
        data,
        isLoading: loading,
        isError,
        error: queryError,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ["repositories"],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await fetch(`/api/v1/repository?page=${pageParam}`)
            if (!res.ok) throw new Error("Failed to fetch repositories")
            const data = (await res.json()) as { repositories: { repos: GithubRepository[], hasMore: boolean } }
            return data.repositories
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage?.hasMore) return undefined
            return allPages.length + 1
        },
        initialPageParam: 1,
        staleTime: 1000 * 60 * 5, // 5 minutes

    })

    const repos = data?.pages.flatMap((page) => page?.repos || []) || []

    // Mutations for deployment
    const importMutation = useMutation({
        mutationFn: async (payload: { repositoryFullName: string, name: string, defaultBranch: string }) => {
            const res = await fetch("/api/v1/projects/import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Failed to import project")
            }
            return data
        },
        onSuccess: () => {
            router.push(`/dashboard/projects`)
        }
    })

    const handleImportClick = (repo: any) => {
        setSelectedRepo(repo)
        setProjectName(repo.name)
        setDefaultBranch(repo.default_branch || "main")
        importMutation.reset()
    }

    const handleDeploy = () => {
        importMutation.mutate({
            repositoryFullName: selectedRepo.fullName,
            name: projectName,
            defaultBranch: defaultBranch
        })
    }

    const filteredRepos = repos.filter((r: GithubRepository) =>
        r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.name?.toLowerCase().includes(search.toLowerCase())
    )

    const isImporting = importMutation.isPending
    const error = isError ? queryError?.message || "Failed to load repositories. Please try again." : null
    const submitError = importMutation.error?.message

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full flex-col md:flex-row overflow-hidden">
            {/* Left Panel: Repository List */}
            <div className="w-full md:w-1/2 lg:w-2/5 h-full">
                <RepoList
                    search={search}
                    setSearch={setSearch}
                    loading={loading}
                    error={error}
                    refetch={refetch}
                    filteredRepos={filteredRepos}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage}
                    onImportClick={handleImportClick}
                    selectedRepo={selectedRepo}
                />
            </div>

            {/* Right Panel: Project Config Form */}
            <div className="hidden md:flex flex-col w-full md:w-1/2 lg:w-3/5 h-full overflow-y-auto">
                <ImportForm
                    selectedRepo={selectedRepo}
                    setSelectedRepo={setSelectedRepo}
                    projectName={projectName}
                    setProjectName={setProjectName}
                    defaultBranch={defaultBranch}
                    setDefaultBranch={setDefaultBranch}
                    handleDeploy={handleDeploy}
                    isImporting={isImporting}
                    submitError={submitError}
                />
            </div>

            {/* Mobile View for the Form */}
            {selectedRepo && (
                <div className="flex md:hidden fixed inset-0 z-50 bg-background overflow-y-auto">
                    <ImportForm
                        selectedRepo={selectedRepo}
                        setSelectedRepo={setSelectedRepo}
                        projectName={projectName}
                        setProjectName={setProjectName}
                        defaultBranch={defaultBranch}
                        setDefaultBranch={setDefaultBranch}
                        handleDeploy={handleDeploy}
                        isImporting={isImporting}
                        submitError={submitError}
                    />
                </div>
            )}
        </div>
    )
}
