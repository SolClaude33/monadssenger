"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("[data-modal-header]") && modalRef.current) {
        isDragging.current = true
        const rect = modalRef.current.getBoundingClientRect()
        dragOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && modalRef.current) {
        modalRef.current.style.left = `${e.clientX - dragOffset.current.x}px`
        modalRef.current.style.top = `${e.clientY - dragOffset.current.y}px`
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    document.addEventListener("keydown", handleEscape)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.3)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="bg-white"
        style={{
          borderRadius: "10px",
          border: "1px solid var(--msn-border)",
          boxShadow: "0 4px 12px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.7)",
          minWidth: "400px",
          maxWidth: "600px",
          position: "absolute",
        }}
      >
        <div
          data-modal-header
          className="p-3 flex items-center justify-between cursor-move"
          style={{
            background: "linear-gradient(to bottom, var(--msn-blue-200), var(--msn-blue-100))",
            borderBottom: "1px solid #B6C9E6",
            borderRadius: "10px 10px 0 0",
          }}
        >
          <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "15px" }}>{title}</span>
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center transition-all"
            style={{
              borderRadius: "4px",
              background: "linear-gradient(to bottom, #FFFFFF, #EAF2FB)",
              border: "1px solid var(--msn-border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#E74C3C"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(to bottom, #FFFFFF, #EAF2FB)"
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
