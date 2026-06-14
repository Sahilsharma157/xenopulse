'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, Send, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_QUESTIONS = [
  'Who should I target this week?',
  'Draft a message for Dormant VIPs',
  'How are my campaigns performing?',
  'Which channel works best?',
]

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showStarters, setShowStarters] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText) return

    // Add user message
    const userMessage: Message = { role: 'user', content: messageText }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setShowStarters(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          message: messageText,
          history: messages,
        }),
      })

      const data = await response.json()
      if (data.response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-12 h-12 bg-[#0A0A0A] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 ${
          isOpen ? 'hidden' : 'flex'
        }`}
        style={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6" cy="6" r="5" fill="white"/>
          <circle cx="18" cy="6" r="5" fill="white"/>
          <circle cx="6" cy="18" r="5" fill="white"/>
          <circle cx="18" cy="18" r="5" fill="white"/>
          <path d="M 14 9 Q 11 12 9 15" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl border border-[#E5E7EB] shadow-xl flex flex-col"
          style={{
            height: '500px',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <style>{`
            @keyframes slideUp {
              from {
                transform: translateY(400px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            
            @keyframes pulse {
              0%, 60%, 100% {
                opacity: 0.3;
              }
              30% {
                opacity: 1;
              }
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Image src="/xenopulse-logo.png" alt="XenoPulse" width={24} height={24} />
              <span className="font-semibold text-[#111111] text-sm">XenoPulse AI</span>
              <span className="text-[10px] text-[#16A34A] font-medium bg-[#DCFCE7] px-2 py-0.5 rounded-full">Online</span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false)
                setMessages([])
                setShowStarters(true)
              }}
              className="text-[#6B7280] hover:text-[#111111] transition-colors text-lg"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && showStarters && (
              <div className="flex flex-col gap-3 h-full justify-center">
                <p className="text-sm text-[#6B7280] text-center">
                  Hi! I'm your XenoPulse AI. Ask me anything about your customers or campaigns.
                </p>
                <div className="space-y-2">
                  {STARTER_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleSendMessage(question)}
                      className="w-full text-left px-3 py-2 text-sm bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111111] rounded-lg transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#0A0A0A] text-white rounded-br-none'
                      : 'bg-[#F3F4F6] text-[#111111] rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#F3F4F6] text-[#111111] px-4 py-2 rounded-2xl rounded-bl-none flex gap-1">
                  <span
                    style={{ animation: 'pulse 1.4s infinite' }}
                  >
                    ●
                  </span>
                  <span
                    style={{ animation: 'pulse 1.4s infinite 0.2s' }}
                  >
                    ●
                  </span>
                  <span
                    style={{ animation: 'pulse 1.4s infinite 0.4s' }}
                  >
                    ●
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[#E5E7EB] p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSendMessage()
                  }
                }}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] text-sm"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                className="bg-[#0A0A0A] text-white px-3 py-2 rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
