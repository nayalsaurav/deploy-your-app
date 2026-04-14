import { NextRequest, NextResponse } from "next/server"
import { getRepositories } from "@/lib/github"

export const GET = async (req: NextRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")

    const repositories = await getRepositories(page)
    console.log("Fetched repositories page:", page)
    return NextResponse.json({ repositories })
  } catch (error: any) {
    console.error("Error fetching repositories:", error)
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
