import { NextRequest, NextResponse } from "next/server";
import { getRepositories } from "@/lib/github";

export const GET = async (req: NextRequest) => {
    try {
        const repositories = await getRepositories();
        return NextResponse.json({ repositories });
    } catch (error: any) {
        console.error("Error fetching repositories:", error);
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}