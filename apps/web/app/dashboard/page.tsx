import { getSession } from "@/lib/auth-session"
import { prisma } from "@workspace/database"
import { redirect } from "next/navigation"
import { formatDateDistance } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    Folder01Icon,
    Rocket01Icon,
    Alert01Icon,
    CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"

export default async function Page() {
    const session = await getSession()
    if (!session) {
        redirect("/login")
    }

    const totalProjects = await prisma.project.count({
        where: { userId: session.user.id },
    })

    const successDeployments = await prisma.deployment.count({
        where: {
            project: { userId: session.user.id },
            status: "SUCCESS",
        },
    })

    const failedDeployments = await prisma.deployment.count({
        where: {
            project: { userId: session.user.id },
            status: "FAILED",
        },
    })

    const totalDeployments = await prisma.deployment.count({
        where: { project: { userId: session.user.id } },
    })

    const successRate =
        totalDeployments > 0
            ? Math.round((successDeployments / totalDeployments) * 100)
            : 0

    const topProjects = await prisma.project.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
            _count: {
                select: { deployments: true },
            },
        },
    })

    const topDeployments = await prisma.deployment.findMany({
        where: { project: { userId: session.user.id } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
            project: true,
        },
    })

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of your projects, deployments, and metrics.
                    </p>
                </div>
            </div>

            <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                <Card size="sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Total Projects</CardTitle>
                        <HugeiconsIcon icon={Folder01Icon} className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProjects}</div>
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Total Deployments</CardTitle>
                        <HugeiconsIcon icon={Rocket01Icon} className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDeployments}</div>
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Success Rate</CardTitle>
                        <HugeiconsIcon
                            icon={CheckmarkCircle01Icon}
                            className="size-4 text-emerald-500"
                        />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{successRate}%</div>
                    </CardContent>
                </Card>

                <Card size="sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Failed</CardTitle>
                        <HugeiconsIcon icon={Alert01Icon} className="size-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{failedDeployments}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Projects</CardTitle>
                        <CardDescription>Your latest updated projects.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead className="text-right">Deployments</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topProjects.length > 0 ? (
                                    topProjects.map((project) => (
                                        <TableRow key={project.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/dashboard/projects/${project.id}`}
                                                    className="flex items-center gap-2 font-medium hover:underline"
                                                >
                                                    <HugeiconsIcon
                                                        icon={Folder01Icon}
                                                        className="size-4 text-muted-foreground"
                                                    />
                                                    {project.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono text-[10px]">
                                                    {project.defaultBranch}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {project._count.deployments}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No projects found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Latest Deployments</CardTitle>
                        <CardDescription>Activity from your recent deployments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topDeployments.length > 0 ? (
                                    topDeployments.map((deployment) => (
                                        <TableRow key={deployment.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/dashboard/deployments/${deployment.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {deployment.project.name}
                                                </Link>
                                                <div className="w-32 truncate text-xs text-muted-foreground md:w-auto">
                                                    {deployment.commitHash
                                                        ? deployment.commitHash.slice(0, 7)
                                                        : deployment.branch}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        deployment.status === "SUCCESS"
                                                            ? "default"
                                                            : deployment.status === "FAILED"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                    className={
                                                        deployment.status === "SUCCESS"
                                                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                                            : ""
                                                    }
                                                >
                                                    {deployment.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                {formatDateDistance(deployment.createdAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No deployments yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
