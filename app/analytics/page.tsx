'use client'

import { MainLayout } from '@/components/layout'
import { useEffect, useState, useRef } from 'react'
import useSWR from 'swr'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Campaign {
  id: string
  name: string
  segment_type: string
  channel: string
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  converted_count: number
  created_at: string
}

// Live simulated overlay on top of real DB values
interface SimulatedStats {
  delivered: number
  opened: number
  clicked: number
  converted: number
}

const SEGMENT_LABELS: Record<string, string> = {
  dormant_vip: 'Dormant VIP',
  one_time_buyer: 'One-Time Buyer',
  recent_active: 'Recent Active',
  churn_risk: 'Churn Risk',
}

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#16A34A',
  email: '#2563EB',
  sms: '#D97706',
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (value === prev.current) return
    const start = prev.current
    const diff = value - start
    const duration = 5000 // 5 seconds
    const startTime = performance.now()

    const frame = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) {
        requestAnimationFrame(frame)
      } else {
        prev.current = value
      }
    }

    const raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <span>{display}</span>
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0)

export default function AnalyticsPage() {
  const { data: campaigns = [], isLoading } = useSWR<Campaign[]>(
    '/api/campaigns',
    fetcher,
    { refreshInterval: 10000 }
  )

  // Simulated stats per campaign id
  const [simulated, setSimulated] = useState<Record<string, SimulatedStats>>({})
  const simulatedRef = useRef<Record<string, SimulatedStats>>({})

  // Seed initial simulated values once campaigns load
  useEffect(() => {
    if (campaigns.length === 0) return
    const seed: Record<string, SimulatedStats> = {}
    campaigns.forEach(c => {
      if (!simulatedRef.current[c.id]) {
        const sent = c.sent_count || 0
        seed[c.id] = {
          delivered: c.delivered_count || Math.round(sent * 0.70),
          opened:    c.opened_count    || Math.round(sent * 0.45),
          clicked:   c.clicked_count   || Math.round(sent * 0.28),
          converted: c.converted_count || Math.round(sent * 0.10),
        }
      } else {
        seed[c.id] = simulatedRef.current[c.id]
      }
    })
    simulatedRef.current = seed
    setSimulated({ ...seed })
  }, [campaigns])

  // Live simulation: every 3s advance exactly ONE metric for ONE campaign (round-robin)
  const campaignsRef = useRef(campaigns)
  const tickIndexRef = useRef(0)
  useEffect(() => { campaignsRef.current = campaigns }, [campaigns])

  useEffect(() => {
    const interval = setInterval(() => {
      const ids = Object.keys(simulatedRef.current)
      if (!ids.length) return

      // Round-robin: pick one campaign per tick
      const id  = ids[tickIndexRef.current % ids.length]
      tickIndexRef.current += 1

      const cur  = simulatedRef.current[id]
      if (!cur) return

      const sent         = campaignsRef.current.find(c => c.id === id)?.sent_count || 0
      const maxDelivered = Math.round(sent * 0.98)
      const maxOpened    = Math.round(cur.delivered * 0.80)
      const maxClicked   = Math.round(cur.opened * 0.65)
      const maxConverted = Math.round(cur.clicked * 0.55)

      const updated = { ...cur }
      let changed   = false

      if (cur.delivered < maxDelivered) {
        updated.delivered = Math.min(cur.delivered + 1, maxDelivered)
        changed = true
      } else if (cur.opened < maxOpened) {
        updated.opened = Math.min(cur.opened + 1, maxOpened)
        changed = true
      } else if (cur.clicked < maxClicked) {
        updated.clicked = Math.min(cur.clicked + 1, maxClicked)
        changed = true
      } else if (cur.converted < maxConverted) {
        updated.converted = Math.min(cur.converted + 1, maxConverted)
        changed = true
      }

      if (changed) {
        simulatedRef.current = { ...simulatedRef.current, [id]: updated }
        setSimulated({ ...simulatedRef.current })
      }
    }, 3000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps — created once, reads live data via refs

  // Merge real + simulated
  const merged = campaigns.map(c => ({
    ...c,
    delivered_count: simulated[c.id]?.delivered ?? c.delivered_count ?? 0,
    opened_count:    simulated[c.id]?.opened    ?? c.opened_count    ?? 0,
    clicked_count:   simulated[c.id]?.clicked   ?? c.clicked_count   ?? 0,
    converted_count: simulated[c.id]?.converted ?? c.converted_count ?? 0,
  }))

  const totalSent      = merged.reduce((s, c) => s + (c.sent_count || 0), 0)
  const totalDelivered = merged.reduce((s, c) => s + c.delivered_count, 0)
  const totalOpened    = merged.reduce((s, c) => s + c.opened_count, 0)
  const totalClicked   = merged.reduce((s, c) => s + c.clicked_count, 0)
  const totalConverted = merged.reduce((s, c) => s + c.converted_count, 0)

  const barData = merged.map(c => ({
    name: SEGMENT_LABELS[c.segment_type] || c.segment_type,
    Sent:      c.sent_count || 0,
    Delivered: c.delivered_count,
    Opened:    c.opened_count,
    Clicked:   c.clicked_count,
    Converted: c.converted_count,
  }))

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-300">

        {/* Header */}
        <div className="border-b border-[#E5E7EB] pb-4 mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-[#111111]">Analytics</h1>
            <span className="flex items-center gap-1.5 text-xs text-[#16A34A] font-medium bg-[#DCFCE7] px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-[#6B7280] mt-1.5 text-sm">
            Track campaign performance and customer engagement in real-time
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-16 text-center">
            <p className="text-[#6B7280] text-sm">No campaigns yet. Launch a campaign to see analytics here.</p>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Total Sent',  value: totalSent,      sub: `${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''}`, accent: '#111111', bg: '#F9FAFB', border: '#E5E7EB' },
                { label: 'Delivered',   value: totalDelivered, sub: `${pct(totalDelivered, totalSent)}% delivery rate`,               accent: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
                { label: 'Opened',      value: totalOpened,    sub: `${pct(totalOpened, totalSent)}% open rate`,                      accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                { label: 'Clicked',     value: totalClicked,   sub: `${pct(totalClicked, totalSent)}% click rate`,                    accent: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                { label: 'Converted',   value: totalConverted, sub: `${pct(totalConverted, totalSent)}% conversion`,                  accent: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
              ].map(card => (
                <div
                  key={card.label}
                  className="rounded-xl p-5 border transition-all duration-300"
                  style={{ background: card.bg, borderColor: card.border }}
                >
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">{card.label}</p>
                  <p className="text-4xl font-bold tabular-nums" style={{ color: card.accent }}>
                    <AnimatedNumber value={card.value} />
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-2">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Bar + Pie side by side */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 mb-6">
              {/* Card header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold text-[#111111]">Campaign Performance Overview</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Reach breakdown and overall engagement split</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-[#16A34A] font-medium bg-[#F0FDF4] px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full animate-pulse" />
                  Updating live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">

                {/* Left — Bar chart */}
                <div>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Reach per Campaign</p>
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    {[
                      { label: 'Sent',      color: '#111111' },
                      { label: 'Delivered', color: '#16A34A' },
                      { label: 'Opened',    color: '#F59E0B' },
                      { label: 'Clicked',   color: '#3B82F6' },
                      { label: 'Converted', color: '#DC2626' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: l.color }} />
                        <span className="text-xs text-[#6B7280]">{l.label}</span>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData} barGap={6} barCategoryGap="12%" margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        axisLine={false}
                        tickLine={false}
                        dy={6}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        width={20}
                      />
                      <Tooltip
                        contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: '10px 14px' }}
                        cursor={{ fill: '#F9FAFB' }}
                        formatter={(value: any, name: string) => [`${value} customers`, name]}
                      />
                      <Bar dataKey="Sent"      fill="#111111" radius={[5, 5, 0, 0]} barSize={22} />
                      <Bar dataKey="Delivered" fill="#16A34A" radius={[5, 5, 0, 0]} barSize={22} />
                      <Bar dataKey="Opened"    fill="#F59E0B" radius={[5, 5, 0, 0]} barSize={22} />
                      <Bar dataKey="Clicked"   fill="#3B82F6" radius={[5, 5, 0, 0]} barSize={22} />
                      <Bar dataKey="Converted" fill="#DC2626" radius={[5, 5, 0, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Divider */}
                <div className="border-l border-[#F3F4F6] pl-6">
                  {/* Right — Pie chart (totals across all campaigns) */}
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Overall Engagement Split</p>
                  <div className="flex flex-col items-center justify-center h-full">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Delivered', value: totalDelivered || 0,                                             color: '#16A34A' },
                            { name: 'Opened',    value: totalOpened    || 0,                                             color: '#F59E0B' },
                            { name: 'Clicked',   value: totalClicked   || 0,                                             color: '#3B82F6' },
                            { name: 'Converted', value: totalConverted || 0,                                             color: '#DC2626' },
                            { name: 'Pending',   value: Math.max(0, totalSent - totalDelivered), color: '#E5E7EB' },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="46%"
                          innerRadius={0}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          animationDuration={400}
                        >
                          {[
                            { name: 'Delivered', value: totalDelivered, color: '#16A34A' },
                            { name: 'Opened',    value: totalOpened,    color: '#F59E0B' },
                            { name: 'Clicked',   value: totalClicked,   color: '#3B82F6' },
                            { name: 'Converted', value: totalConverted, color: '#DC2626' },
                            { name: 'Pending',   value: Math.max(0, totalSent - totalDelivered), color: '#E5E7EB' },
                          ].filter(d => d.value > 0).map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: any, name: string) => [`${v} customers`, name]}
                          contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>

            {/* Per campaign detail cards */}
            <div className="space-y-5">
              {merged.map(campaign => {
                const sent = campaign.sent_count || 0

                const funnelRows = [
                  { label: 'Delivery Rate',   value: campaign.delivered_count, color: '#16A34A' },
                  { label: 'Open Rate',        value: campaign.opened_count,    color: '#D97706' },
                  { label: 'Click Rate',       value: campaign.clicked_count,   color: '#2563EB' },
                  { label: 'Conversion Rate',  value: campaign.converted_count, color: '#DC2626' },
                ]

                const channelColor = CHANNEL_COLORS[campaign.channel] || '#6B7280'

                return (
                  <div key={campaign.id} className="bg-white border border-[#E5E7EB] rounded-xl p-6">

                    {/* Campaign header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#111111] text-sm">
                          {campaign.name || `Campaign for ${SEGMENT_LABELS[campaign.segment_type] || campaign.segment_type}`}
                        </h3>
                        <span className="text-xs px-2.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded-full">
                          {SEGMENT_LABELS[campaign.segment_type] || campaign.segment_type}
                        </span>
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full capitalize font-medium"
                          style={{ background: `${channelColor}18`, color: channelColor }}
                        >
                          {campaign.channel}
                        </span>
                      </div>
                      <span className="text-xs text-[#9CA3AF] shrink-0">
                        {new Date(campaign.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-6">
                      {/* Left: metric chips + funnel bars */}
                      <div className="col-span-3">
                        <div className="grid grid-cols-5 gap-2 mb-5">
                          {[
                            { label: 'Sent',      value: sent,                        accent: '#111111', bg: '#F9FAFB' },
                            { label: 'Delivered', value: campaign.delivered_count,    accent: '#16A34A', bg: '#F0FDF4' },
                            { label: 'Opened',    value: campaign.opened_count,       accent: '#D97706', bg: '#FFFBEB' },
                            { label: 'Clicked',   value: campaign.clicked_count,      accent: '#2563EB', bg: '#EFF6FF' },
                            { label: 'Converted', value: campaign.converted_count,    accent: '#DC2626', bg: '#FEF2F2' },
                          ].map(m => (
                            <div key={m.label} className="rounded-lg p-3 text-center transition-all duration-300" style={{ background: m.bg }}>
                              <p className="text-xl font-bold tabular-nums transition-all duration-500" style={{ color: m.accent }}>
                                <AnimatedNumber value={m.value} />
                              </p>
                              <p className="text-xs font-medium mt-0.5" style={{ color: m.accent }}>{m.label}</p>
                              <p className="text-xs text-[#9CA3AF] mt-0.5">{pct(m.value, sent)}%</p>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Conversion Funnel</p>
                        <div className="space-y-3">
                          {funnelRows.map(row => {
                            const p = pct(row.value, sent)
                            return (
                              <div key={row.label}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-xs text-[#6B7280]">{row.label}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-[#9CA3AF]">
                                      <AnimatedNumber value={row.value} /> customers
                                    </span>
                                    <span className="text-xs font-semibold w-8 text-right tabular-nums" style={{ color: row.color }}>{p}%</span>
                                  </div>
                                </div>
                                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                                  <div
                                    className="h-2 rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${Math.max(p, 1)}%`, background: row.color }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Right: Estimated Revenue panel */}
                      {(() => {
                        const AOV = 1499
                        const estRevenue = campaign.converted_count * AOV
                        const potentialRevenue = sent * AOV
                        const recoveryPct = pct(estRevenue, potentialRevenue)
                        return (
                          <div className="col-span-2 flex flex-col justify-center gap-4 pl-2">
                            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Estimated Revenue</p>

                            {/* Big revenue number */}
                            <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4">
                              <p className="text-xs text-[#16A34A] font-medium mb-1">Total from Conversions</p>
                              <p className="text-3xl font-bold text-[#16A34A] tabular-nums">
                                ₹<AnimatedNumber value={estRevenue} />
                              </p>
                              <p className="text-xs text-[#6B7280] mt-1">
                                <AnimatedNumber value={campaign.converted_count} /> customers × ₹{AOV.toLocaleString('en-IN')} avg order
                              </p>
                            </div>

                            {/* Recovery bar */}
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs text-[#6B7280]">Revenue Recovery</span>
                                <span className="text-xs font-semibold text-[#16A34A]">{recoveryPct}%</span>
                              </div>
                              <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                                <div
                                  className="h-2.5 rounded-full transition-all duration-700 ease-out bg-[#16A34A]"
                                  style={{ width: `${Math.max(recoveryPct, 1)}%` }}
                                />
                              </div>
                              <p className="text-xs text-[#9CA3AF] mt-1.5">
                                of ₹{potentialRevenue.toLocaleString('en-IN')} potential
                              </p>
                            </div>

                            {/* Mini stat row */}
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: 'Lost (not converted)', value: `₹${((sent - campaign.converted_count) * AOV).toLocaleString('en-IN')}`, color: '#9CA3AF' },
                                { label: 'Per converted customer', value: `₹${AOV.toLocaleString('en-IN')}`, color: '#2563EB' },
                              ].map(s => (
                                <div key={s.label} className="bg-[#F9FAFB] rounded-lg p-3">
                                  <p className="text-xs text-[#9CA3AF] mb-1">{s.label}</p>
                                  <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
