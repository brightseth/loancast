'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'

interface DropdownMenuProps {
  items: Array<{
    label: string
    onClick: () => void
    href?: string
    className?: string
  }>
}

export function DropdownMenu({ items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
        aria-label="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick()
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                  item.className || 'text-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}