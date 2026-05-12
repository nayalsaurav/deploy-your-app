import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"

export default function IntegrationsPage() {
    return (
        <div className="flex flex-1 flex-col gap-8 p-4 pt-0 md:p-8 md:pt-0 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Integrations</h1>
                    <p className="text-muted-foreground mt-1">
                        Connect your projects with third-party analytics and notification services.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* Analytics Section */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Analytics</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="flex flex-col border-border/50 bg-card/40 transition-all hover:bg-card hover:border-primary/20 hover:shadow-sm">
                            <CardHeader>
                                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                                    </svg>
                                </div>
                                <CardTitle className="text-lg">Kairox</CardTitle>
                                <CardDescription>
                                    Powerful product analytics, event tracking, and usage insights.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                            </CardContent>
                            <CardFooter>
                                <a href="https://kairox.nayalsaurav.in/" target="_blank" rel="noreferrer" className="w-full">
                                    <Button variant="outline" className="w-full">Connect</Button>
                                </a>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

                {/* Notifications Section */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                        {/* Discord */}
                        <Card className="flex flex-col border-border/50 bg-card/40 transition-all hover:bg-card hover:border-[#5865F2]/30 hover:shadow-sm">
                            <CardHeader>
                                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#5865F2]/10 text-[#5865F2]">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                    </svg>
                                </div>
                                <CardTitle className="text-lg">Discord</CardTitle>
                                <CardDescription>
                                    Get pipeline status alerts directly in your Discord channels.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <Badge variant="outline" className="bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20">Connected</Badge>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">Configure</Button>
                            </CardFooter>
                        </Card>

                        {/* Slack */}
                        <Card className="flex flex-col border-border/50 bg-card/40 transition-all hover:bg-card hover:border-[#E01E5A]/30 hover:shadow-sm">
                            <CardHeader>
                                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E01E5A]/10 text-[#E01E5A]">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521h-6.313A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                                    </svg>
                                </div>
                                <CardTitle className="text-lg">Slack</CardTitle>
                                <CardDescription>
                                    Notify your team on Slack when a deployment succeeds or fails.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">Connect</Button>
                            </CardFooter>
                        </Card>

                        {/* WhatsApp */}
                        <Card className="flex flex-col border-border/50 bg-card/40 transition-all hover:bg-card hover:border-[#25D366]/30 hover:shadow-sm">
                            <CardHeader>
                                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                </div>
                                <CardTitle className="text-lg">WhatsApp</CardTitle>
                                <CardDescription>
                                    Receive instant critical alerts right on your mobile device.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">Connect</Button>
                            </CardFooter>
                        </Card>

                        {/* Email */}
                        <Card className="flex flex-col border-border/50 bg-card/40 transition-all hover:bg-card hover:border-orange-500/30 hover:shadow-sm">
                            <CardHeader>
                                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </div>
                                <CardTitle className="text-lg">Email</CardTitle>
                                <CardDescription>
                                    Send deployment summaries and reports directly to your inbox.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">Connect</Button>
                            </CardFooter>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    )
}
