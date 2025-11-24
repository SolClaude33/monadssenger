"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, UserPlus, Settings, Mail, Phone, Video, ImageIcon, Smile, Loader2, Zap } from "lucide-react"
import Image from "next/image"
// Removed Supabase dependency - using PostgreSQL direct with polling
import { Modal } from "@/components/modal"
import { EmojiPicker } from "@/components/emoji-picker"
import { useToast } from "@/hooks/use-toast"

type Message = {
  id: string
  username: string
  user_color: string
  message: string
  created_at: string
  room: string
}

type TypingIndicator = {
  username: string
  user_color: string
  updated_at?: string // Added optional field for type safety
}

const EMOJI_SHORTCUTS: Record<string, string> = {
  ":rocket:": "🚀",
  ":fire:": "🔥",
  ":heart:": "❤️",
  ":smile:": "😊",
  ":laugh:": "😂",
  ":cool:": "😎",
  ":thumbsup:": "👍",
  ":thumbsdown:": "👎",
  ":clap:": "👏",
  ":party:": "🎉",
}

const PROFANITY_WORDS = ["fuck", "shit", "bitch", "ass", "damn", "hell", "crap"]

const CRYPTO_MEME_NAMES = [
  "Hodler",
  "DiamondHands",
  "ToTheMoon",
  "Degen",
  "Ape",
  "Whale",
  "Shrimp",
  "Moonboy",
  "Bagholder",
  "Gigachad",
  "Wojak",
  "Pepe",
  "Bobo",
  "Wagmi",
  "Ngmi",
  "Gm",
  "Ser",
  "Anon",
  "Fren",
  "Rekt",
  "Pump",
  "Dump",
  "Shill",
  "Fud",
  "Fomo",
  "Yolo",
  "Lambo",
  "Wen",
  "Cope",
  "Hopium",
]

function filterProfanity(text: string): string {
  let filtered = text
  PROFANITY_WORDS.forEach((word) => {
    const regex = new RegExp(word, "gi")
    filtered = filtered.replace(regex, "*".repeat(word.length))
  })
  return filtered
}

function replaceEmojiShortcuts(text: string): string {
  let result = text
  Object.entries(EMOJI_SHORTCUTS).forEach(([shortcut, emoji]) => {
    result = result.replace(new RegExp(shortcut, "g"), emoji)
  })
  return result
}

export default function MonadssengerPage() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [currentRoom, setCurrentRoom] = useState("lobby")
  const [username, setUsername] = useState("")
  const [userColor, setUserColor] = useState("")
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isNudging, setIsNudging] = useState(false)
  const [useInMemory, setUseInMemory] = useState(false)
  const [inMemoryMessages, setInMemoryMessages] = useState<Record<string, Message[]>>({
    lobby: [],
    bnb: [],
    usa: [],
    dev: [],
  })

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [filesModalOpen, setFilesModalOpen] = useState(false)
  const [activitiesModalOpen, setActivitiesModalOpen] = useState(false)
  const [webcamModalOpen, setWebcamModalOpen] = useState(false)
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [addContactModalOpen, setAddContactModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)

  const { toast } = useToast()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const lastMessageTimeRef = useRef<number[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const randomName = CRYPTO_MEME_NAMES[Math.floor(Math.random() * CRYPTO_MEME_NAMES.length)]
    const randomNum = Math.floor(Math.random() * 10000)
    const randomColor = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`
    setUsername(`${randomName}${randomNum}`)
    setUserColor(randomColor)
  }, [])

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Try to fetch messages to verify database connection
        const response = await fetch(`/api/messages?room=lobby&limit=1`)
        if (!response.ok) {
          throw new Error("Failed to fetch messages")
        }
        console.log("[Monadssenger] Database available")
        setUseInMemory(false)
      } catch (err) {
        console.log("[Monadssenger] Database check failed, using in-memory storage:", err)
        setUseInMemory(true)
      }
    }
    checkDatabase()
  }, [])

  // Fetch initial messages and set up real-time subscription
  useEffect(() => {
    if (!username) return

    if (useInMemory) {
      setMessages(inMemoryMessages[currentRoom] || [])
      return
    }

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?room=${currentRoom}&limit=50`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error("[Monadssenger] Error fetching messages:", error)
        setUseInMemory(true)
        setMessages(inMemoryMessages[currentRoom] || [])
      }
    }

    fetchMessages()

    // Set up polling for real-time updates (every 2 seconds)
    console.log("[Monadssenger] Setting up polling for room:", currentRoom)

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/messages?room=${currentRoom}&limit=50`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error("[Monadssenger] Error polling messages:", error)
      }
    }, 2000) // Poll every 2 seconds

    return () => {
      console.log("[Monadssenger] Cleaning up polling for room:", currentRoom)
      clearInterval(pollInterval)
    }
  }, [currentRoom, username, useInMemory, inMemoryMessages])

  useEffect(() => {
    if (!username || useInMemory) return

    // Poll for typing indicators
    const fetchTypingIndicators = async () => {
      try {
        const response = await fetch(`/api/typing?room=${currentRoom}`)
        if (response.ok) {
          const data = await response.json()
          const indicators: TypingIndicator[] = (data.typing || [])
            .filter((indicator: any) => indicator.username !== username)
            .map((indicator: any) => ({
              username: indicator.username,
              user_color: indicator.user_color,
            }))
          setTypingUsers(indicators)
        }
      } catch (error) {
        // Silently fail
        console.log("Typing indicator error", error)
      }
    }

    // Fetch immediately
    fetchTypingIndicators()

    // Set up polling every 2 seconds for typing indicators
    const interval = setInterval(fetchTypingIndicators, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [currentRoom, username, useInMemory])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleTyping = useCallback(async () => {
    if (!username || useInMemory) return

    try {
      await fetch("/api/typing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room: currentRoom,
          username,
          user_color: userColor,
        }),
      })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/typing?room=${currentRoom}&username=${username}`, {
            method: "DELETE",
          })
        } catch (e) {
          // ignore
        }
      }, 3000)
    } catch (err) {
      // Silently fail
    }
  }, [username, userColor, currentRoom, useInMemory])

  const checkRateLimit = useCallback(() => {
    const now = Date.now()
    const recentMessages = lastMessageTimeRef.current.filter((time) => now - time < 5000)

    if (recentMessages.length >= 3) {
      toast({
        title: "Slow down!",
        description: "You're sending messages too quickly. Please wait a moment.",
        variant: "destructive",
      })
      return false
    }

    lastMessageTimeRef.current = [...recentMessages, now]
    return true
  }, [toast])

  const handleSend = async () => {
    if (!message.trim() || !username) return
    if (!checkRateLimit()) return

    console.log("[v0] Sending message:", message)

    const processedMessage = replaceEmojiShortcuts(filterProfanity(message.trim()))

    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      room: currentRoom,
      username,
      user_color: userColor,
      message: processedMessage,
      created_at: new Date().toISOString(),
    }

    // Optimistic update
    setMessages((prev) => [...prev, newMessage])
    setMessage("")

    if (useInMemory) {
      // Store in memory
      setInMemoryMessages((prev) => ({
        ...prev,
        [currentRoom]: [...(prev[currentRoom] || []), newMessage],
      }))
      console.log("[Monadssenger] Message stored in memory")
      return
    }

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room: currentRoom,
          username,
          user_color: userColor,
          message: processedMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      console.log("[Monadssenger] Message sent to database successfully")

      // Clear typing indicator
      try {
        await fetch(`/api/typing?room=${currentRoom}&username=${username}`, {
          method: "DELETE",
        })
      } catch (err) {
        // Silently fail
      }
    } catch (err) {
      console.log("[Monadssenger] Failed to send message:", err)
      // Message is already in local state
      // Switch to in-memory mode if write fails
      setUseInMemory(true)
      setInMemoryMessages((prev) => ({
        ...prev,
        [currentRoom]: [...(prev[currentRoom] || []), newMessage],
      }))
    }
  }

  const handleNudge = () => {
    setIsNudging(true)
    setTimeout(() => setIsNudging(false), 500)
    toast({
      title: "Nudge!",
      description: "You sent a nudge to the chat room!",
    })
  }

  const handleFakeAction = async (actionName: string) => {
    setModalLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setModalLoading(false)
    toast({
      title: "Success!",
      description: `${actionName} completed successfully.`,
    })
    // Close all modals
    setInviteModalOpen(false)
    setFilesModalOpen(false)
    setActivitiesModalOpen(false)
    setWebcamModalOpen(false)
    setCallModalOpen(false)
    setAddContactModalOpen(false)
    setSettingsModalOpen(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "i") {
        e.preventDefault()
        setInviteModalOpen(true)
      }
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault()
        setFilesModalOpen(true)
      }
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault()
        handleNudge()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const contactGroups = [
    {
      label: "Online (6)",
      contacts: [
        { name: "CZ (Binance)", status: "online", message: "Building quietly. BUIDL 🧱", avatar: "/avatars/cz.png" },
        { name: "Elon Musk", status: "online", message: "Sending memes to Mars 🚀", avatar: "/avatars/elon.png" },
        {
          name: "Vitalik Buterin",
          status: "online",
          message: "Thinking in quadratic funding",
          avatar: "/avatars/vitalik.png",
        },
        { name: "Nayib Bukele", status: "online", message: "Volcano node is warm 🌋", avatar: "/avatars/bukele.png" },
        {
          name: "Brian Armstrong",
          status: "online",
          message: "On-ramping humans → crypto",
          avatar: "/avatars/brian.png",
        },
        { name: "Balaji S.", status: "online", message: "Network state musings", avatar: "/avatars/balaji.png" },
      ],
    },
    {
      label: "Away (4)",
      contacts: [
        { name: "Donald Trump", status: "away", message: "BRB, posting on X", avatar: "/avatars/trump.png" },
        { name: "Joe Biden", status: "away", message: "In a briefing…", avatar: "/avatars/biden.png" },
        { name: "Jack Dorsey", status: "away", message: "Decentralize all the things", avatar: "/avatars/dorsey.png" },
        { name: "Michael Saylor", status: "away", message: "Energy for sound money ⚡", avatar: "/avatars/saylor.png" },
      ],
    },
    {
      label: "Busy (4)",
      contacts: [
        { name: "Janet Yellen", status: "busy", message: "Macro meeting in progress", avatar: "/avatars/yellen.png" },
        { name: "Gensler (SEC)", status: "busy", message: "Reviewing filings…", avatar: "/avatars/gensler.png" },
        { name: "Kathy Wood", status: "busy", message: "Updating ARK thesis", avatar: "/avatars/kathy.png" },
        { name: "J. Powell", status: "busy", message: "Watching CPI charts", avatar: "/avatars/powell.png" },
      ],
    },
    {
      label: "Offline (6)",
      contacts: [
        { name: "SBF", status: "offline", message: "", avatar: "/avatars/sbf.png" },
        { name: "Sam Altman", status: "offline", message: "", avatar: "/avatars/sam-altman.png" },
        { name: "Naval Ravikant", status: "offline", message: "", avatar: "/avatars/naval.png" },
        { name: "Chamath P.", status: "offline", message: "", avatar: "/avatars/chamath.png" },
        { name: "Marc Andreessen", status: "offline", message: "", avatar: "/avatars/marc.png" },
        { name: "Linus Torvalds", status: "offline", message: "", avatar: "/avatars/linus.png" },
      ],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "var(--success-green)"
      case "away":
        return "var(--alert-orange)"
      case "busy":
        return "#E74C3C"
      case "offline":
        return "#95A5A6"
      default:
        return "var(--success-green)"
    }
  }

  const rooms = [
    { id: "lobby", label: "Lobby" },
    { id: "bnb", label: "BNB" },
    { id: "usa", label: "USA" },
    { id: "dev", label: "Dev" },
  ]

  return (
    <div
      className={`h-screen flex p-2 ${isNudging ? "animate-shake" : ""}`}
      style={{ background: "linear-gradient(to bottom, #836EF9, #5E3A8A)" }} // Updated to Monad purple gradient
    >
      {/* Left Sidebar - Contacts */}
      <div
        className="w-80 bg-white flex flex-col overflow-hidden"
        style={{
          borderRadius: "10px",
          border: "1px solid var(--msn-border)",
          boxShadow: "0 2px 6px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.7)",
        }}
      >
        {/* Header */}
        <div
          className="p-3 flex items-center gap-2"
          style={{
            background: "linear-gradient(to bottom, var(--msn-blue-200), var(--msn-blue-100))",
            borderBottom: "1px solid var(--msn-border)", // use var
          }}
        >
          <Image src="/monad-logo.png" alt="Monadssenger" width={24} height={24} className="flex-shrink-0" />
          <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "15px" }}>Monadssenger</span>
        </div>

        {/* Toolbar */}
        <div
          className="p-2 flex gap-1"
          style={{
            background: "var(--msn-silver-200)",
            borderBottom: "1px solid var(--msn-border)",
          }}
        >
          <button
            className="h-8 w-8 flex items-center justify-center transition-all"
            style={{
              borderRadius: "6px",
              background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)", // updated gradient
              border: "1px solid var(--msn-border)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)" // updated gradient
              e.currentTarget.style.outline = "1px solid var(--msn-blue-500)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)" // updated gradient
              e.currentTarget.style.outline = "none"
            }}
            aria-label="Mail"
          >
            <Mail className="h-4 w-4" style={{ color: "var(--msn-blue-700)" }} />
          </button>
          <button
            className="h-8 w-8 flex items-center justify-center transition-all"
            style={{
              borderRadius: "6px",
              background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)", // updated gradient
              border: "1px solid var(--msn-border)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)" // updated gradient
              e.currentTarget.style.outline = "1px solid var(--msn-blue-500)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)" // updated gradient
              e.currentTarget.style.outline = "none"
            }}
            aria-label="Phone"
          >
            <Phone className="h-4 w-4" style={{ color: "var(--msn-blue-700)" }} />
          </button>
          <button
            className="h-8 w-8 flex items-center justify-center transition-all"
            style={{
              borderRadius: "6px",
              background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)", // updated gradient
              border: "1px solid var(--msn-border)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)" // updated gradient
              e.currentTarget.style.outline = "1px solid var(--msn-blue-500)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)" // updated gradient
              e.currentTarget.style.outline = "none"
            }}
            aria-label="Video"
          >
            <Video className="h-4 w-4" style={{ color: "var(--msn-blue-700)" }} />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setSettingsModalOpen(true)}
            title="Settings"
            className="h-8 w-8 flex items-center justify-center transition-all"
            style={{
              borderRadius: "6px",
              background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)", // updated gradient
              border: "1px solid var(--msn-border)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)" // updated gradient
              e.currentTarget.style.outline = "1px solid var(--msn-blue-500)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)" // updated gradient
              e.currentTarget.style.outline = "none"
            }}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" style={{ color: "var(--msn-blue-700)" }} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3" style={{ borderBottom: "1px solid var(--msn-silver-200)" }}>
          <div className="relative">
            <input
              placeholder="Find a contact..."
              className="w-full h-8 pr-16 text-sm transition-all outline-none"
              style={{
                borderRadius: "16px",
                border: "1px solid var(--msn-border)",
                paddingLeft: "12px",
                paddingRight: "64px",
                fontSize: "13px",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,.08)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid rgba(90,161,227,.4)"
                e.currentTarget.style.outlineOffset = "0px"
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "none"
              }}
            />
            <div className="absolute right-1 top-1 flex gap-1">
              <button
                onClick={() => setAddContactModalOpen(true)}
                title="Add contact"
                className="h-6 w-6 flex items-center justify-center transition-all"
                style={{
                  borderRadius: "6px",
                  background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                  border: "1px solid var(--msn-border)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
                }}
                aria-label="Add contact"
              >
                <UserPlus className="h-3 w-3" style={{ color: "var(--success-green)" }} />
              </button>
              <button
                className="h-6 w-6 flex items-center justify-center transition-all"
                style={{
                  borderRadius: "6px",
                  background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                  border: "1px solid var(--msn-border)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
                }}
                aria-label="Search"
              >
                <Search className="h-3 w-3" style={{ color: "var(--msn-blue-700)" }} />
              </button>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <ScrollArea className="flex-1" style={{ background: "linear-gradient(to bottom, #EAF3FF, #FFFFFF)" }}>
          <div className="p-2">
            {contactGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-2">
                <div
                  className="text-xs font-semibold mb-2 flex items-center gap-1 px-2 py-1"
                  style={{
                    background: "#EEF3F9",
                    borderRadius: "6px",
                    color: "var(--text-primary)",
                  }}
                >
                  <span style={{ fontSize: "10px" }}>▼</span>
                  <span>{group.label}</span>
                </div>
                {group.contacts.map((contact, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 cursor-pointer transition-all"
                    style={{ borderRadius: "8px" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#F5FAFF"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                    }}
                  >
                    <div className="relative">
                      {contact.avatar.startsWith("/avatars/") ? (
                        <Image
                          src={contact.avatar || "/placeholder.svg"}
                          alt={contact.name}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                          style={{
                            border: "1px solid rgba(0,0,0,.1)",
                          }}
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{
                            background: "linear-gradient(to bottom right, #43B649, #5AA1E3)",
                            border: "1px solid rgba(0,0,0,.1)",
                          }}
                        />
                      )}
                      {contact.status !== "offline" && (
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                          style={{
                            background: getStatusColor(contact.status),
                            border: "1px solid white",
                            boxShadow: "0 0 2px rgba(0,0,0,.2)",
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold" style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                        {contact.name}
                      </div>
                      {contact.message && (
                        <div className="truncate" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {contact.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Advertisement */}
        <div className="p-2" style={{ borderTop: "1px solid var(--msn-border)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            Advertisement
          </div>
          <div
            className="rounded p-2 flex items-center gap-2"
            style={{
              background: "linear-gradient(to right, var(--msn-blue-500), #a855f7)",
              border: "1px solid var(--msn-border)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.3)",
            }}
          >
            <div className="text-xs font-bold text-white flex-1">Monadssenger Live</div>
            <Image
              src="/monad-logo.png"
              alt="Monadssenger"
              width={32}
              height={32}
              className="flex-shrink-0 rounded"
              style={{
                border: "1px solid rgba(255,255,255,.3)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className="flex-1 ml-2 bg-white flex flex-col overflow-hidden"
        style={{
          borderRadius: "10px",
          border: "1px solid var(--msn-border)",
          boxShadow: "0 2px 6px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.7)",
        }}
      >
        {/* Chat Header */}
        <div
          className="p-2 flex items-center justify-between"
          style={{
            background: "linear-gradient(to bottom, var(--msn-blue-200), var(--msn-blue-100))",
            borderBottom: "1px solid var(--msn-border)",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInviteModalOpen(true)}
              title="Invite (Ctrl+I)"
              className="h-8 w-8 flex items-center justify-center transition-all"
              style={{
                borderRadius: "6px",
                background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                border: "1px solid var(--msn-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
              }}
              aria-label="Invite"
            >
              <Mail className="h-4 w-4" style={{ color: "var(--msn-blue-700)" }} />
            </button>
            <button
              onClick={() => setFilesModalOpen(true)}
              title="Send Files (Ctrl+F)"
              className="h-8 w-8 flex items-center justify-center transition-all"
              style={{
                borderRadius: "6px",
                background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                border: "1px solid var(--msn-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
              }}
              aria-label="Send Files"
            >
              <ImageIcon className="h-4 w-4" style={{ color: "var(--msn-blue-700)" }} />
            </button>
            <button
              onClick={() => setWebcamModalOpen(true)}
              title="Webcam"
              className="h-8 w-8 flex items-center justify-center transition-all"
              style={{
                borderRadius: "6px",
                background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                border: "1px solid var(--msn-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
              }}
              aria-label="Webcam"
            >
              <Video className="h-4 w-4" style={{ color: "var(--msn-blue-700)" }} />
            </button>
            <button
              onClick={() => setCallModalOpen(true)}
              title="Call"
              className="h-8 w-8 flex items-center justify-center transition-all"
              style={{
                borderRadius: "6px",
                background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                border: "1px solid var(--msn-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
              }}
              aria-label="Call"
            >
              <Phone className="h-4 w-4" style={{ color: "var(--msn-blue-700)" }} />
            </button>
            <button
              onClick={handleNudge}
              title="Nudge (Ctrl+N)"
              className="h-8 w-8 flex items-center justify-center transition-all"
              style={{
                borderRadius: "6px",
                background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                border: "1px solid var(--msn-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
              }}
              aria-label="Nudge"
            >
              <Zap className="h-4 w-4" style={{ color: "var(--alert-orange)" }} />
            </button>
          </div>
          <div className="flex gap-2">
            <Image
              src="/profile.jpg"
              alt="Profile"
              width={40}
              height={40}
              className="rounded object-cover"
              style={{
                border: "2px solid rgba(255,255,255,.8)",
                boxShadow: "0 1px 3px rgba(0,0,0,.2)",
              }}
            />
            <Image
              src="/profile.jpg"
              alt="Profile"
              width={40}
              height={40}
              className="rounded object-cover"
              style={{
                border: "2px solid rgba(255,255,255,.8)",
                boxShadow: "0 1px 3px rgba(0,0,0,.2)",
              }}
            />
          </div>
        </div>

        <div
          className="px-4 py-2 flex items-center justify-end"
          style={{
            background: "var(--msn-blue-100)",
            borderBottom: "1px solid var(--msn-blue-200)",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            You are: <span style={{ color: userColor, fontWeight: "600" }}>{username}</span>
          </span>
        </div>

        {/* Messages Area */}
        <ScrollArea
          className="flex-1 p-4"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6EEF7",
          }}
        >
          <div className="space-y-0">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className="py-1 px-2"
                style={{
                  fontSize: "13px",
                  background: i % 2 === 0 ? "transparent" : "#FAFCFF",
                }}
              >
                <span style={{ fontWeight: "600", color: msg.user_color }}>{msg.username}:</span>{" "}
                <span style={{ color: "var(--text-primary)" }}>{msg.message}</span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginLeft: "8px",
                  }}
                >
                  {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {typingUsers.length > 0 && (
            <div className="py-2 px-2 text-xs italic" style={{ color: "var(--text-muted)" }}>
              {typingUsers
                .map((user) => (
                  <span key={user.username} style={{ color: user.user_color }}>
                    {user.username}
                  </span>
                ))
                .reduce((prev, curr) => [prev, ", ", curr] as any)}{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing...
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-3" style={{ borderTop: "1px solid var(--msn-border)" }}>
          <div
            className="flex gap-1 mb-2 p-1"
            style={{
              background: "var(--msn-silver-100)",
              borderRadius: "6px",
            }}
          >
            <button
              className="h-7 px-2 flex items-center justify-center transition-all text-xs font-semibold"
              style={{
                borderRadius: "4px",
                background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                border: "1px solid var(--msn-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
              }}
              aria-label="Font"
            >
              Font
            </button>
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="h-7 w-7 flex items-center justify-center transition-all"
                style={{
                  borderRadius: "4px",
                  background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                  border: "1px solid var(--msn-border)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
                }}
                aria-label="Emoticons"
              >
                <Smile className="h-4 w-4" style={{ color: "var(--alert-orange)" }} />
              </button>
              {showEmojiPicker && (
                <EmojiPicker
                  onSelect={(emoji) => setMessage((prev) => prev + emoji)}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>
            <button
              onClick={() => setMessage((prev) => prev + "😊")}
              className="h-7 w-7 flex items-center justify-center transition-all"
              style={{
                borderRadius: "4px",
                background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                border: "1px solid var(--msn-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
              }}
            >
              <span style={{ fontSize: "14px" }}>😊</span>
            </button>
            <button
              onClick={() => setMessage((prev) => prev + "😂")}
              className="h-7 w-7 flex items-center justify-center transition-all"
              style={{
                borderRadius: "4px",
                background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                border: "1px solid var(--msn-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
              }}
            >
              <span style={{ fontSize: "14px" }}>😂</span>
            </button>
            <button
              onClick={() => setMessage((prev) => prev + "😎")}
              className="h-7 w-7 flex items-center justify-center transition-all"
              style={{
                borderRadius: "4px",
                background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                border: "1px solid var(--msn-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
              }}
            >
              <span style={{ fontSize: "14px" }}>😎</span>
            </button>
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                handleTyping()
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 h-9 px-3 outline-none transition-all"
              style={{
                borderRadius: "6px",
                border: "1px solid var(--msn-border)",
                fontSize: "13px",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,.08)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid rgba(90,161,227,.4)"
                e.currentTarget.style.outlineOffset = "0px"
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "none"
              }}
            />
            <button
              onClick={handleSend}
              className="px-6 h-9 font-semibold transition-all"
              style={{
                borderRadius: "6px",
                background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                border: "1px solid var(--msn-border)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FAF5FF, #EDE9FE)"
                e.currentTarget.style.outline = "1px solid var(--msn-blue-500)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #F5F3FF)"
                e.currentTarget.style.outline = "none"
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,.15)"
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.7)"
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Avatar */}
      <div className="w-32 ml-2 flex flex-col gap-2">
        <div
          className="bg-white p-3 flex items-center justify-center"
          style={{
            borderRadius: "10px",
            border: "1px solid var(--msn-border)",
            boxShadow: "0 2px 6px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.7)",
          }}
        >
          <Image
            src="/profile.jpg"
            alt="Profile"
            width={80}
            height={80}
            className="rounded object-cover"
            style={{
              border: "2px solid rgba(0,0,0,.1)",
              boxShadow: "0 2px 4px rgba(0,0,0,.15)",
            }}
          />
        </div>
      </div>

      <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite Someone">
        <div className="space-y-4">
          <p style={{ fontSize: "13px", color: "var(--text-primary)" }}>
            Enter the email address of the person you'd like to invite to this conversation.
          </p>
          <input
            placeholder="username@example.com"
            className="w-full h-9 px-3 outline-none"
            style={{
              borderRadius: "6px",
              border: "1px solid var(--msn-border)",
              fontSize: "13px",
            }}
          />
          <button
            onClick={() => handleFakeAction("Invite")}
            disabled={modalLoading}
            className="w-full h-9 font-semibold flex items-center justify-center gap-2"
            style={{
              borderRadius: "6px",
              background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
              border: "1px solid var(--msn-border)",
              color: "var(--text-primary)",
            }}
          >
            {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={filesModalOpen} onClose={() => setFilesModalOpen(false)} title="Send Files">
        <div className="space-y-4">
          <p style={{ fontSize: "13px", color: "var(--text-primary)" }}>Select files to send to the chat room.</p>
          <div className="border-2 border-dashed rounded p-8 text-center" style={{ borderColor: "var(--msn-border)" }}>
            <ImageIcon className="h-12 w-12 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Drag and drop files here or click to browse</p>
          </div>
          <button
            onClick={() => handleFakeAction("File Transfer")}
            disabled={modalLoading}
            className="w-full h-9 font-semibold flex items-center justify-center gap-2"
            style={{
              borderRadius: "6px",
              background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
              border: "1px solid var(--msn-border)",
              color: "var(--text-primary)",
            }}
          >
            {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Files"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={activitiesModalOpen} onClose={() => setActivitiesModalOpen(false)} title="Activities">
        <div className="space-y-4">
          <p style={{ fontSize: "13px", color: "var(--text-primary)" }}>
            Choose an activity to start with your contacts.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {["Games", "Music", "Photos", "Videos"].map((activity) => (
              <button
                key={activity}
                onClick={() => handleFakeAction(activity)}
                className="h-16 font-semibold"
                style={{
                  borderRadius: "6px",
                  background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
                  border: "1px solid var(--msn-border)",
                  color: "var(--text-primary)",
                }}
              >
                {activity}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={webcamModalOpen} onClose={() => setWebcamModalOpen(false)} title="Start Webcam">
        <div className="space-y-4">
          <p style={{ fontSize: "13px", color: "var(--text-primary)" }}>
            Start a video call with your contacts using your webcam.
          </p>
          <div
            className="aspect-video bg-gray-900 rounded flex items-center justify-center"
            style={{ border: "1px solid var(--msn-border)" }}
          >
            <Video className="h-16 w-16 text-gray-600" />
          </div>
          <button
            onClick={() => handleFakeAction("Webcam")}
            disabled={modalLoading}
            className="w-full h-9 font-semibold flex items-center justify-center gap-2"
            style={{
              borderRadius: "6px",
              background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
              border: "1px solid var(--msn-border)",
              color: "var(--text-primary)",
            }}
          >
            {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Video Call"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={callModalOpen} onClose={() => setCallModalOpen(false)} title="Start Call">
        <div className="space-y-4">
          <p style={{ fontSize: "13px", color: "var(--text-primary)" }}>Start an audio call with your contacts.</p>
          <div
            className="aspect-video bg-gray-100 rounded flex items-center justify-center"
            style={{ border: "1px solid var(--msn-border)" }}
          >
            <Phone className="h-16 w-16" style={{ color: "var(--msn-blue-700)" }} />
          </div>
          <button
            onClick={() => handleFakeAction("Call")}
            disabled={modalLoading}
            className="w-full h-9 font-semibold flex items-center justify-center gap-2"
            style={{
              borderRadius: "6px",
              background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
              border: "1px solid var(--msn-border)",
              color: "var(--text-primary)",
            }}
          >
            {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Audio Call"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={addContactModalOpen} onClose={() => setAddContactModalOpen(false)} title="Add Contact">
        <div className="space-y-4">
          <p style={{ fontSize: "13px", color: "var(--text-primary)" }}>
            Enter the email or username of the contact you'd like to add.
          </p>
          <input
            placeholder="username@example.com"
            className="w-full h-9 px-3 outline-none"
            style={{
              borderRadius: "6px",
              border: "1px solid var(--msn-border)",
              fontSize: "13px",
            }}
          />
          <button
            onClick={() => handleFakeAction("Add Contact")}
            disabled={modalLoading}
            className="w-full h-9 font-semibold flex items-center justify-center gap-2"
            style={{
              borderRadius: "6px",
              background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
              border: "1px solid var(--msn-border)",
              color: "var(--text-primary)",
            }}
          >
            {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Contact"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} title="Settings">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2" style={{ fontSize: "13px", color: "var(--text-primary)" }}>
              Your Profile
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Username: <span style={{ color: userColor, fontWeight: "600" }}>{username}</span>
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ fontSize: "13px", color: "var(--text-primary)" }}>
              Notifications
            </h3>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>Enable sound notifications</span>
            </label>
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ fontSize: "13px", color: "var(--text-primary)" }}>
              Privacy
            </h3>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>Show typing indicators</span>
            </label>
          </div>
          <button
            onClick={() => handleFakeAction("Settings Update")}
            disabled={modalLoading}
            className="w-full h-9 font-semibold flex items-center justify-center gap-2"
            style={{
              borderRadius: "6px",
              background: "linear-gradient(to bottom, #FFFFFF, #F5F3FF)",
              border: "1px solid var(--msn-border)",
              color: "var(--text-primary)",
            }}
          >
            {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Settings"}
          </button>
        </div>
      </Modal>
    </div>
  )
}
