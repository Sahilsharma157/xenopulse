'use client'

import { MainLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function NewCampaignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const segment = searchParams.get('segment') || ''
  const count = searchParams.get('count') || '0'
  const revenue = searchParams.get('revenue') || '0'
  const channel = searchParams.get('channel') || 'whatsapp'

  const [selectedChannel, setSelectedChannel] = useState(channel.toLowerCase())
  const [messageText, setMessageText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const segmentNames: Record<string, string> = {
    dormant_vip: 'Dormant VIPs',
    one_time_buyer: 'One-Time Buyers',
    recent_active: 'Recent Active',
    churn_risk: 'Churn Risk',
  }

  const segmentReasons: Record<string, string> = {
    dormant_vip: 'High-value customers who haven\'t purchased in 60+ days',
    one_time_buyer: 'Customers who made a single purchase',
    recent_active: 'Customers who purchased recently',
    churn_risk: 'Regular customers at risk of churn',
  }

  const channels = ['WhatsApp', 'SMS', 'Email', 'RCS']

  const getChannelEmoji = (ch: string) => {
    const emojiMap: Record<string, string> = {
      whatsapp: '💬',
      sms: '📱',
      email: '📧',
      rcs: '📨',
    }
    return emojiMap[ch.toLowerCase()] || ''
  }

  const getPreviewComponent = () => {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })

    if (!messageText) {
      return (
        <div className="text-[#6B7280] text-sm italic w-full text-center pt-8">
          Message preview will appear here
        </div>
      )
    }

    if (selectedChannel === 'whatsapp') {
      return (
        <div className="w-full">
          <div className="bg-[#DCF8C6] border border-[#CCCCCC] rounded-lg p-3 max-w-[75%] break-words" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <p className="text-[#111111] text-sm break-words">{messageText}</p>
          </div>
          <p className="text-[#6B7280] text-[10px] mt-1 ml-1">{timestamp}</p>
        </div>
      )
    }

    if (selectedChannel === 'sms') {
      return (
        <div className="w-full">
          <div className="bg-white border border-[#CCCCCC] rounded-lg p-3 max-w-[75%] break-words" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <p className="text-[#111111] text-sm break-words">{messageText}</p>
          </div>
          <p className="text-[#6B7280] text-[10px] mt-1 ml-1">{timestamp}</p>
        </div>
      )
    }

    if (selectedChannel === 'email') {
      return (
        <div className="w-full bg-white border border-[#E5E7EB] rounded-lg overflow-hidden max-w-full">
          <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-4 py-3">
            <p className="text-[#111111] text-xs font-semibold">Subject: Re: Your Special Offer</p>
          </div>
          <div className="px-4 py-4">
            <p className="text-[#111111] text-sm leading-1.6 whitespace-pre-wrap break-words" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{messageText}</p>
          </div>
          <div className="bg-[#F9FAFB] border-t border-[#E5E7EB] px-4 py-3">
            <p className="text-[#6B7280] text-xs">{timestamp}</p>
          </div>
        </div>
      )
    }

    if (selectedChannel === 'rcs') {
      return (
        <div className="w-full">
          <div className="bg-[#E3F2FD] border border-[#CCCCCC] rounded-lg p-3 max-w-[75%] break-words" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <p className="text-[#111111] text-sm break-words">{messageText}</p>
          </div>
          <p className="text-[#6B7280] text-[10px] mt-1 ml-1">{timestamp}</p>
        </div>
      )
    }

    return null
  }

  const formatRupees = (value: string | number) => {
    const num = typeof value === 'string' ? parseInt(value) : value
    return '₹ ' + num.toLocaleString('en-IN')
  }

  const handleDraftWithAI = async () => {
    if (!segment) return
    setIsGenerating(true)
    setErrorMessage('')
    try {
      const response = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment,
          count: parseInt(count),
          reasoning: segmentReasons[segment] || '',
          existingMessage: messageText,
          channel: selectedChannel,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate message')
      const data = await response.json()
      setMessageText(data.message || data.response || '')
    } catch (error) {
      setErrorMessage('Failed to generate message. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!messageText || !segment) {
      setErrorMessage('Message and segment are required')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment_type: segment,
          message: messageText,
          channel: selectedChannel.toLowerCase(),
          count: parseInt(count),
        }),
      })

      if (!response.ok) throw new Error('Failed to send campaign')
      const data = await response.json()

      setSentCount(data.sent_to)
      setShowSuccess(true)
    } catch (error) {
      setErrorMessage('Failed to send campaign')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-300">
        {/* Back Button - RELIABLE NAVIGATION */}
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="flex items-center gap-1 text-[#6B7280] hover:text-[#111111] transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Page Header */}
        <div className="border-b border-[#E5E7EB] pb-4 mb-8">
          <h1 className="text-3xl font-bold text-[#111111]">
            Campaign for {segmentNames[segment] || 'New Campaign'}
          </h1>
          <p className="text-[#6B7280] mt-2">
            {count} customers · {formatRupees(revenue)} potential
          </p>
        </div>

        {/* Channel Selector */}
        <div className="mb-8">
          <label className="text-sm font-semibold text-[#111111] block mb-3">Channel</label>
          <div className="flex gap-3 flex-wrap">
            {channels.map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch.toLowerCase())}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  selectedChannel === ch.toLowerCase()
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'bg-white text-[#111111] border-[#E5E7EB] hover:border-[#0A0A0A]'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Message Editor */}
          <div className="lg:col-span-1">
            <p className="text-sm font-medium text-[#111111] mb-3">Message</p>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Describe your campaign message..."
              className="w-full h-64 p-4 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] resize-none"
            />
            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleDraftWithAI}
                disabled={isGenerating}
                style={{
                  backgroundColor: '#0A0A0A',
                  color: '#FFFFFF',
                }}
              >
                {isGenerating
                  ? 'Generating...'
                  : messageText.trim()
                    ? 'Refine with AI'
                    : 'Draft with AI'}
              </Button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-2">
            <p className="text-sm font-medium text-[#111111] mb-3">Preview</p>
            <div className="bg-[#E5DDD5] rounded-lg p-6 min-h-64 flex flex-col items-start gap-3 w-full">
              {getPreviewComponent()}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {errorMessage}
          </div>
        )}

        {/* Send Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSendCampaign}
            disabled={isSending || !messageText}
            style={{
              backgroundColor: '#0A0A0A',
              color: '#FFFFFF',
              padding: '12px 24px',
              fontSize: '16px',
            }}
          >
            {isSending ? 'Sending...' : 'Send Campaign'}
          </Button>
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-center w-16 h-16 bg-[#DCFCE7] rounded-full mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#111111] text-center mb-2">Campaign Launched!</h2>
              <p className="text-[#6B7280] text-center text-sm mb-6">
                Your campaign is being delivered to <span className="font-semibold text-[#111111]">{sentCount} customers</span>. 
                Track performance in real-time on Analytics.
              </p>
              <div className="flex gap-3">
                <button onClick={() => window.location.href = '/analytics'} 
                  className="flex-1 bg-[#0A0A0A] text-white py-2.5 rounded-lg font-medium hover:bg-[#1a1a1a] transition-colors">
                  View Analytics →
                </button>
                <button onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 border border-[#E5E7EB] text-[#111111] py-2.5 rounded-lg font-medium hover:bg-[#F9FAFB] transition-colors">
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
