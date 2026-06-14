'use client'

import { MainLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Campaign {
  id: string
  name: string
  segment_type: string
  channel: string
  created_at: string
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  converted_count: number
}

export default function CampaignsPage() {
  const router = useRouter()
  const [refreshCount, setRefreshCount] = useState(0)
  
  const { data: campaigns = [], isLoading, mutate } = useSWR<Campaign[]>(
    '/api/campaigns',
    fetcher
  )

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      mutate()
      setRefreshCount(c => c + 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [mutate])

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      WhatsApp: 'bg-green-100 text-green-800',
      SMS: 'bg-blue-100 text-blue-800',
      Email: 'bg-purple-100 text-purple-800',
      RCS: 'bg-indigo-100 text-indigo-800',
    }
    return colors[channel] || 'bg-gray-100 text-gray-800'
  }

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      dormant_vip: 'bg-red-50 border-l-red-500',
      one_time_buyer: 'bg-amber-50 border-l-amber-500',
      recent_active: 'bg-green-50 border-l-green-500',
      churn_risk: 'bg-orange-50 border-l-orange-500',
    }
    return colors[segment] || 'bg-gray-50 border-l-gray-500'
  }

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-300">
        {/* Header */}
        <div className="border-b border-[#E5E7EB] pb-4 mb-6">
          <h1 className="text-3xl font-bold text-[#111111]">Campaigns</h1>
          <p className="text-[#6B7280] mt-2">
            View all campaigns and their performance metrics
          </p>
        </div>

        {/* Past Campaigns Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#111111]">Past Campaigns</h2>
            <Button
              onClick={() => window.location.href = '/dashboard'}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#0A0A0A',
                border: '1px solid #0A0A0A',
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Go to Dashboard
            </Button>
          </div>

          {isLoading ? (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-12 text-center">
              <p className="text-[#6B7280]">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-12 text-center">
              <p className="text-[#6B7280] mb-4">No campaigns sent yet. Launch one from the Dashboard.</p>
              <Button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  backgroundColor: '#0A0A0A',
                  color: '#FFFFFF',
                }}
              >
                Launch Campaign from Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`border-l-4 rounded-lg p-5 bg-white border border-[#E5E7EB] hover:shadow-md transition-shadow ${getSegmentColor(campaign.segment_type)}`}
                >
                  {/* Campaign Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#111111]">{campaign.name}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getChannelColor(campaign.channel)}`}>
                          {campaign.channel}
                        </span>
                        <span className="text-xs text-[#6B7280]">
                          Sent {new Date(campaign.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="grid grid-cols-5 gap-4">
                    <div className="bg-[#F9FAFB] rounded-lg p-3">
                      <p className="text-xs text-[#6B7280] font-medium mb-1">Sent</p>
                      <p className="text-2xl font-bold text-[#111111]">{campaign.sent_count}</p>
                    </div>
                    <div className="bg-[#F9FAFB] rounded-lg p-3">
                      <p className="text-xs text-[#6B7280] font-medium mb-1">Delivered</p>
                      <p className="text-2xl font-bold text-[#111111]">{campaign.delivered_count}</p>
                    </div>
                    <div className="bg-[#F9FAFB] rounded-lg p-3">
                      <p className="text-xs text-[#6B7280] font-medium mb-1">Opened</p>
                      <p className="text-2xl font-bold text-[#111111]">{campaign.opened_count}</p>
                    </div>
                    <div className="bg-[#F9FAFB] rounded-lg p-3">
                      <p className="text-xs text-[#6B7280] font-medium mb-1">Clicked</p>
                      <p className="text-2xl font-bold text-[#111111]">{campaign.clicked_count}</p>
                    </div>
                    <div className="bg-[#F9FAFB] rounded-lg p-3">
                      <p className="text-xs text-[#6B7280] font-medium mb-1">Converted</p>
                      <p className="text-2xl font-bold text-[#111111]">{campaign.converted_count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Launch campaigns from the AI Opportunity Feed on your dashboard. Each opportunity is pre-analyzed for maximum impact on your target segment.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
