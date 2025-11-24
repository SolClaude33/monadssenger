import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const room = searchParams.get("room") || "lobby"
    const limit = parseInt(searchParams.get("limit") || "50")

    const result = await query(
      `SELECT id, room, username, user_color, message, created_at 
       FROM messages 
       WHERE room = $1 
       ORDER BY created_at ASC 
       LIMIT $2`,
      [room, limit]
    )

    const messages = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      user_color: row.user_color,
      message: row.message,
      created_at: row.created_at,
      room: row.room,
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { room, username, user_color, message } = body

    if (!username || !user_color || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate message length
    if (message.length > 1000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO messages (room, username, user_color, message, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, room, username, user_color, message, created_at`,
      [room || "lobby", username, user_color, message]
    )

    return NextResponse.json({ message: result.rows[0] })
  } catch (error) {
    console.error("Error inserting message:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
