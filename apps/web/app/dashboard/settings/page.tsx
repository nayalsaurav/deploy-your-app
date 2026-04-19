"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@workspace/ui/components/dialog"
import { Session } from "@/lib/auth"
import { parseUserAgent } from "@/lib/utils"

export default function SettingsPage() {
    const { data: session, isPending } = authClient.useSession()

    const [name, setName] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [deleteInput, setDeleteInput] = useState("")
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const [sessions, setSessions] = useState<Session[]>([])
    const [isLoadingSessions, setIsLoadingSessions] = useState(true)

    // Load user name
    useEffect(() => {
        if (session?.user?.name) {
            setName(session.user.name)
        }
    }, [session])

    // Fetch sessions
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data, error } = await authClient.listSessions()
                if (error) throw error
                setSessions(data || [])
            } catch {
                toast.error("Failed to load sessions")
            } finally {
                setIsLoadingSessions(false)
            }
        }

        fetchSessions()
    }, [])

    if (isPending) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-2xl">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
            </div>
        )
    }

    if (!session?.user) {
        return <div className="p-4 flex-1">Please log in to view settings.</div>
    }

    const { user } = session

    // Update profile
    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            setIsUpdating(true)
            const { error } = await authClient.updateUser({ name })
            if (error) throw error
            toast.success("Profile updated successfully")
        } catch (error: any) {
            toast.error("Failed to update profile", {
                description: error.message || "Unknown error",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    // Sign out current session
    const handleSignOut = async () => {
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        window.location.href = "/"
                    },
                },
            })
        } catch {
            toast.error("Failed to sign out")
        }
    }

    // Revoke specific session
    const handleRevokeSession = async (token: string, sessionId: string) => {
        try {
            await authClient.revokeSession({ token })
            setSessions((prev) => prev.filter((s) => s.id !== sessionId))
            toast.success("Session revoked")
        } catch {
            toast.error("Failed to revoke session")
        }
    }

    // Sign out all devices
    const handleSignOutAll = async () => {
        try {
            await authClient.revokeOtherSessions()
            toast.success("Signed out from all devices")
            window.location.href = "/"
        } catch {
            toast.error("Failed to sign out from all devices")
        }
    }

    // Delete account
    const handleDeleteAccount = async () => {
        try {
            await authClient.deleteUser()
            toast.success("Account deleted")
            window.location.href = "/"
        } catch (err: any) {
            toast.error("Failed to delete account", {
                description: err.message,
            })
        } finally {
            setIsDeleteDialogOpen(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0 max-w-2xl">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            {/* Profile */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                        Update your public profile information.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="size-16">
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback>
                                {user.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col gap-1">
                            <span className="font-medium text-lg">{user.name}</span>
                            <span className="text-sm text-muted-foreground">
                                {user.email}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Display Name</FieldLabel>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isUpdating}
                                />
                                <FieldDescription>
                                    Your public display name.
                                </FieldDescription>
                            </Field>

                            <Field>
                                <FieldLabel>Email</FieldLabel>
                                <Input value={user.email} disabled />
                            </Field>
                        </FieldGroup>

                        <Button
                            type="submit"
                            disabled={isUpdating || name === user.name || !name.trim()}
                        >
                            {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Sessions */}
            <Card>
                <CardHeader>
                    <CardTitle>Sessions</CardTitle>
                    <CardDescription>
                        Manage devices where you're logged in.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                    {isLoadingSessions ? (
                        <Skeleton className="h-24 w-full" />
                    ) : sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No active sessions found.
                        </p>
                    ) : (
                        sessions.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between border rounded-lg p-4"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium">
                                        {parseUserAgent(s.userAgent)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {s.ipAddress || "Unknown IP"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(s.updatedAt).toLocaleString()}
                                    </span>
                                </div>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRevokeSession(s.token, s.id)}
                                >
                                    Revoke
                                </Button>
                            </div>
                        ))
                    )}

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSignOut}>
                            Sign out (this device)
                        </Button>

                        <Button variant="outline" onClick={handleSignOutAll}>
                            Sign out all
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Permanent and irreversible actions.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Delete Account</p>
                        <p className="text-sm text-muted-foreground">
                            This will permanently delete your account and all data.
                        </p>
                    </div>

                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-9 px-4 py-2">
                            Delete Account
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete your account?</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col gap-4 py-4">
                                <Field>
                                    <FieldLabel>Type <span className="font-bold select-none">delete my account</span> to continue.</FieldLabel>
                                    <Input
                                        value={deleteInput}
                                        onChange={(e) => setDeleteInput(e.target.value)}
                                        placeholder="delete my account"
                                        className="h-10"
                                    />
                                    {deleteInput !== "delete my account" && deleteInput.length > 0 && (
                                        <FieldDescription className="text-destructive">
                                            Please type the exact text to continue.
                                        </FieldDescription>
                                    )}
                                </Field>
                            </div>

                            <DialogFooter>
                                <DialogClose className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2" onClick={() => setDeleteInput("")}>
                                    Cancel
                                </DialogClose>
                                <Button
                                    variant="destructive"
                                    disabled={deleteInput !== "delete my account"}
                                    onClick={handleDeleteAccount}
                                >
                                    Confirm Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    )
}