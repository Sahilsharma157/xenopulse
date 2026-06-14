'use client'

import { MainLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Customer {
  id: string
  name: string
  email: string
  ltv: number
  segment: string
}

interface Campaign {
  id: string
  name: string
  status: string
}

interface Opportunity {
  type: string
  title: string
  count: number
  potential_revenue: number
  reasoning: string
  recommended_channel: string
  color: string
}

export default function DashboardPage() {
  const router = useRouter()

  const { data: customers = [], isLoading: customersLoading } = useSWR<Customer[]>(
    '/api/customers',
    fetcher,
    { revalidateOnFocus: true, revalidateOnMount: true }
  )
  const { data: campaigns = [], isLoading: campaignsLoading } = useSWR<Campaign[]>(
    '/api/campaigns',
    fetcher,
    { revalidateOnFocus: true, revalidateOnMount: true }
  )
  const { data: opportunities = [], isLoading: opportunitiesLoading } = useSWR<Opportunity[]>(
    '/api/opportunities',
    fetcher,
    { revalidateOnFocus: true, revalidateOnMount: true }
  )

  const isLoading = customersLoading || campaignsLoading || opportunitiesLoading

  const formatRupees = (value: number) => {
    return '₹ ' + value.toLocaleString('en-IN')
  }

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'border-l-red-500 bg-red-50',
      amber: 'border-l-amber-500 bg-amber-50',
      green: 'border-l-green-500 bg-green-50',
      orange: 'border-l-orange-500 bg-orange-50',
    }
    return colorMap[color] || 'border-l-gray-500'
  }

  const getChannelStyle = (channel: string) => {
    const channelMap: Record<string, { color: string; bg: string; border: string }> = {
      WhatsApp: { color: '#16A34A', bg: '#DCFCE7', border: '#86EFAC' },
      SMS: { color: '#2563EB', bg: '#DBEAFE', border: '#93C5FD' },
      Email: { color: '#7C3AED', bg: '#F3E8FF', border: '#E9D5FF' },
      RCS: { color: '#0891B2', bg: '#CFFAFE', border: '#A5F3FC' },
    }
    return channelMap[channel] || { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB' }
  }

  const handleLaunchCampaign = (opportunity: Opportunity) => {
    const params = new URLSearchParams({
      segment: opportunity.type,
      count: opportunity.count.toString(),
      revenue: opportunity.potential_revenue.toString(),
      channel: opportunity.recommended_channel.toLowerCase(),
    })
    window.location.href = `/campaigns/new?${params.toString()}`
  }

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="border-b border-[#E5E7EB] pb-4 mb-6">
          <h1 className="text-3xl font-bold text-[#111111]">Dashboard</h1>
          <p className="text-[#6B7280] mt-2">
            Welcome to XenoPulse. Manage your customer campaigns and analytics.
          </p>
        </div>

        {/* Top Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-[#E5E7EB] rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-[#F3F4F6] rounded w-24 mb-3" />
                <div className="h-8 bg-[#F3F4F6] rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 hover:shadow-md transition-shadow">
              <p className="text-[#6B7280] text-sm font-medium mb-3">Total Customers</p>
              <p className="text-3xl font-semibold text-[#111111]">
                {Array.isArray(customers) ? customers.length : 0}
              </p>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 hover:shadow-md transition-shadow">
              <p className="text-[#6B7280] text-sm font-medium mb-3">Campaigns Sent</p>
              <p className="text-3xl font-semibold text-[#111111]">
                {Array.isArray(campaigns) ? campaigns.filter((c) => c.status === 'sent').length : 0}
              </p>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 hover:shadow-md transition-shadow">
              <p className="text-[#6B7280] text-sm font-medium mb-3">Average LTV</p>
              <p className="text-3xl font-semibold text-[#111111]">
                {customers && customers.length > 0
                  ? formatRupees(Math.round(customers.reduce((sum, c) => sum + (c.ltv || 0), 0) / customers.length))
                  : '₹ 0'}
              </p>
            </div>
          </div>
        )}

        {/* AI Opportunities Feed */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#111111] mb-1">AI Opportunities</h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Proactively surfaced from your customer data
          </p>

          {opportunities && opportunities.length > 0 ? (
            <div className="space-y-3">
              {opportunities.map((opp, idx) => {
                const segmentColor = {
                  red: '#EF4444',
                  amber: '#F59E0B',
                  green: '#10B981',
                  orange: '#F97316',
                }[opp.color] || '#6B7280'
                
                const channelStyle = getChannelStyle(opp.recommended_channel)

                return (
                  <div
                    key={idx}
                    className="border border-[#E5E7EB] rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    style={{ borderLeft: `4px solid ${segmentColor}` }}
                  >
                    {/* Top row: title + channel badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#111111] text-base">{opp.title}</span>
                        <span className="text-xs text-[#6B7280] font-normal">{opp.count} customers</span>
                      </div>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full border"
                        style={{
                          color: channelStyle.color,
                          borderColor: channelStyle.border,
                          background: channelStyle.bg,
                        }}
                      >
                        {opp.recommended_channel}
                      </span>
                    </div>

                    {/* Middle row: reasoning */}
                    <p className="text-sm text-[#6B7280] mb-3 leading-relaxed">{opp.reasoning}</p>

                    {/* Bottom row: revenue + button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#6B7280]">Potential Revenue</p>
                        <p className="text-lg font-semibold text-[#111111]">{formatRupees(opp.potential_revenue)}</p>
                      </div>
                      <button
                        onClick={() => handleLaunchCampaign(opp)}
                        className="group flex items-center gap-2 bg-[#0A0A0A] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#2563EB] transition-all duration-200 hover:scale-105 hover:shadow-lg"
                        style={{
                          boxShadow: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 20px rgba(37, 99, 235, 0.25)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        Launch Campaign
                        <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-12 text-center">
              <p className="text-[#6B7280] mb-4">No customer data yet.</p>
              <Button
                onClick={() => window.location.href = '/customers'}
                style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF' }}
              >
                Add Customers
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
