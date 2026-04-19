import { AppSidebar } from "@/components/app-sidebar";
import { getSession, requireAuth } from "@/lib/auth-session";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let session = null;
    try {
        session = await requireAuth();

    } catch (error) {
        console.error("Error fetching session:", error);
    }
    if (!session?.user) {
        redirect("/");
    }
    return (
        <SidebarProvider>
            <AppSidebar user={session.user} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                    </div>
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}