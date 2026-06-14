import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { segment_type, message, channel, count } = body

    if (!segment_type || !message || !channel) {
      console.log('Response sent'); return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get customers matching segment
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')

    if (customersError) {
      console.log('Response sent'); return NextResponse.json({ error: customersError.message }, { status: 400 })
    }

    if (!customers || customers.length === 0) {
      console.log('Response sent'); return NextResponse.json(
        { error: 'No customers found' },
        { status: 400 }
      )
    }

    // Filter customers by segment
    const today = new Date()
    let segmentCustomers = customers

    if (segment_type === 'dormant_vip') {
      segmentCustomers = customers.filter((c) => {
        if (!c.last_purchase || c.ltv <= 150000) return false
        const lastPurchase = new Date(c.last_purchase)
        const daysSince = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince > 60
      })
    } else if (segment_type === 'one_time_buyer') {
      segmentCustomers = customers.filter((c) => c.purchase_count === 1)
    } else if (segment_type === 'recent_active') {
      segmentCustomers = customers.filter((c) => {
        if (!c.last_purchase) return false
        const lastPurchase = new Date(c.last_purchase)
        const daysSince = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince <= 14
      })
    } else if (segment_type === 'churn_risk') {
      segmentCustomers = customers.filter((c) => {
        if (!c.last_purchase || c.purchase_count < 2 || c.purchase_count > 4) return false
        const lastPurchase = new Date(c.last_purchase)
        const daysSince = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince >= 40 && daysSince <= 60
      })
    }

    const campaignId = uuidv4()

    // Create campaign record
    const { error: campaignError } = await supabase.from('campaigns').insert({
      id: campaignId,
      name: `Campaign for ${segment_type}`,
      segment_type,
      message,
      channel,
      status: 'sent',
      sent_count: segmentCustomers.length,
      metrics: {
        sent: segmentCustomers.length,
        opened: 0,
        clicked: 0,
        converted: 0,
      },
    })

    if (campaignError) {
      console.log('Response sent'); return NextResponse.json({ error: campaignError.message }, { status: 400 })
    }

    // Create communication records
    const communications = segmentCustomers.map((customer) => ({
      id: uuidv4(),
      campaign_id: campaignId,
      customer_id: customer.id,
      status: 'sent',
      created_at: new Date().toISOString(),
    }))

    const { error: communicationsError } = await supabase
      .from('communications')
      .insert(communications)

    if (communicationsError) {
      console.log('Response sent'); return NextResponse.json({ error: communicationsError.message }, { status: 400 })
    }

    // Call channel service
    const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001'
    const channelPayload = {
      campaign_id: campaignId,
      communications: segmentCustomers.map((customer) => ({
        communication_id: communications.find((c) => c.customer_id === customer.id)?.id,
        customer_id: customer.id,
        phone: customer.phone || '+91-0000000000',
        message,
        channel: channel.toUpperCase(),
      })),
    }

    try {
    console.log('API request started')
      await fetch(`${channelServiceUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelPayload),
      })
    } catch (channelError) {
    }

    console.log('Response sent'); return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      sent_to: segmentCustomers.length,
    })
  } catch (error) {
    console.log('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.log('Response sent'); return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
