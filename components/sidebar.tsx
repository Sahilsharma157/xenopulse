'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Mail,
  BarChart3,
  Menu,
  X,
  Home,
} from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navigationItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Customers',
      href: '/customers',
      icon: Users,
    },
    {
      label: 'Campaigns',
      href: '/campaigns',
      icon: Mail,
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
    },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 hover:bg-muted rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <a href="/" className="flex items-center gap-2 px-4 py-6 border-b border-[#1f1f1f] hover:opacity-80 transition-opacity cursor-pointer">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Top left */}
            <circle cx="9" cy="9" r="5" fill="#2563EB"/>
            {/* Top right */}
            <circle cx="23" cy="9" r="5" fill="#2563EB"/>
            {/* Bottom left */}
            <circle cx="9" cy="23" r="5" fill="#2563EB"/>
            {/* Bottom right */}
            <circle cx="23" cy="23" r="5" fill="#2563EB"/>
            {/* Diagonal connection between top-right and bottom-left only */}
            <line x1="23" y1="9" x2="9" y2="23" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <span className="text-white font-semibold text-lg tracking-tight">XenoPulse</span>
        </a>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 border-l-2 ${
                    isActive
                      ? 'bg-[#1F2937] text-white border-l-white'
                      : 'text-[#FFFFFF] hover:bg-[#1F2937] border-l-transparent'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 p-4 bg-sidebar-accent rounded-lg">
          <p className="text-xs text-sidebar-foreground/60">
            Version 1.0.0
          </p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
