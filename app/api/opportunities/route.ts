import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Opportunity {
  type: string
  title: string
  count: number
  potential_revenue: number
  reasoning: string
  recommended_channel: string
  color: string
}

async function getAIReasoning() {
  try {
    const response = await fetch('http://localhost:3000/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'opportunities' }),
    })
    const data = await response.json()
    return JSON.parse(data.response)
  } catch (error) {
    console.log('Error:', error)
    return null
  }
}

export async function GET() {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')

    if (error) {
      console.log('Response sent'); return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!customers || customers.length === 0) {
      console.log('Response sent'); return NextResponse.json([])
    }

    // Get AI-generated reasoning
    const aiReasoning = await getAIReasoning()

    const today = new Date()
    const opportunities: Opportunity[] = []

    // Segment 1: Dormant VIP
    const dormantVIPs = customers.filter((c) => {
      if (!c.last_purchase || c.ltv <= 150000) return false
      const lastPurchase = new Date(c.last_purchase)
      const daysSince = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
      return daysSince > 60
    })

    if (dormantVIPs.length > 0) {
      const totalRevenue = dormantVIPs.reduce((sum, c) => sum + (c.ltv || 0), 0)
      opportunities.push({
        type: 'dormant_vip',
        title: 'Dormant VIPs',
        count: dormantVIPs.length,
        potential_revenue: Math.round(totalRevenue * 0.3),
        reasoning: aiReasoning?.dormant_vip || 'High-value customers who haven\'t purchased in 60+ days.',
        recommended_channel: 'WhatsApp',
        color: 'red',
      })
    }

    // Segment 2: One-Time Buyers
    const oneTimeBuyers = customers.filter((c) => c.purchase_count === 1)

    if (oneTimeBuyers.length > 0) {
      const totalRevenue = oneTimeBuyers.reduce((sum, c) => sum + (c.ltv || 0), 0)
      opportunities.push({
        type: 'one_time_buyer',
        title: 'One-Time Buyers',
        count: oneTimeBuyers.length,
        potential_revenue: Math.round(totalRevenue * 0.5),
        reasoning: aiReasoning?.one_time_buyer || 'Customers who made a single purchase.',
        recommended_channel: 'Email',
        color: 'amber',
      })
    }

    // Segment 3: Recent Active
    const recentActive = customers.filter((c) => {
      if (!c.last_purchase) return false
      const lastPurchase = new Date(c.last_purchase)
      const daysSince = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
      return daysSince <= 14
    })

    if (recentActive.length > 0) {
      const totalRevenue = recentActive.reduce((sum, c) => sum + (c.ltv || 0), 0)
      opportunities.push({
        type: 'recent_active',
        title: 'Recent Active',
        count: recentActive.length,
        potential_revenue: Math.round(totalRevenue * 0.25),
        reasoning: aiReasoning?.recent_active || 'Customers who purchased recently.',
        recommended_channel: 'SMS',
        color: 'green',
      })
    }

    // Segment 4: Churn Risk
    const churnRisk = customers.filter((c) => {
      if (!c.last_purchase || c.purchase_count < 2 || c.purchase_count > 4) return false
      const lastPurchase = new Date(c.last_purchase)
      const daysSince = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
      return daysSince >= 40 && daysSince <= 60
    })

    if (churnRisk.length > 0) {
      const totalRevenue = churnRisk.reduce((sum, c) => sum + (c.ltv || 0), 0)
      opportunities.push({
        type: 'churn_risk',
        title: 'Churn Risk',
        count: churnRisk.length,
        potential_revenue: Math.round(totalRevenue * 0.4),
        reasoning: aiReasoning?.churn_risk || 'Regular customers at risk of churn.',
        recommended_channel: 'WhatsApp',
        color: 'orange',
      })
    }

    console.log('Response sent'); return NextResponse.json(opportunities)
  } catch (error) {
    console.log('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.log('Response sent'); return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
