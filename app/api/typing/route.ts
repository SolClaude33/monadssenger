import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { room, username, user_color } = body

    if (!room || !username || !user_color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upsert typing indicator
    await query(
      `INSERT INTO typing_indicators (room, username, user_color, updated_at) 
       VALUES ($1, $2, $3, NOW()) 
       ON CONFLICT (room, username) 
       DO UPDATE SET updated_at = NOW(), user_color = $3`,
      [room, username, user_color]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating typing indicator:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const room = searchParams.get("room")
    const username = searchParams.get("username")

    if (!room || !username) {
      return NextResponse.json({ error: "Missing room or username" }, { status: 400 })
    }

    await query(`DELETE FROM typing_indicators WHERE room = $1 AND username = $2`, [room, username])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting typing indicator:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const room = searchParams.get("room") || "lobby"

    // Get typing indicators from the last 10 seconds
    const result = await query(
      `SELECT room, username, user_color, updated_at 
       FROM typing_indicators 
       WHERE room = $1 AND updated_at > NOW() - INTERVAL '10 seconds'`,
      [room]
    )

    return NextResponse.json({ typing: result.rows || [] })
  } catch (error) {
    console.error("Error fetching typing indicators:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
