import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Launch a campaign (send it to channel service)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId } = body

    if (!campaignId) {
      console.log('Response sent'); return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      console.log('Response sent'); return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get target customers
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('segment', campaign.target_segment || 'general')

    if (customerError) {
      console.log('Response sent'); return NextResponse.json({ error: customerError.message }, { status: 400 })
    }

    // Create communications records
    const communications = customers.map((customer) => ({
      customer_id: customer.id,
      campaign_id: campaignId,
      channel: 'email',
      status: 'queued',
      message_content: campaign.template_message,
    }))

    const { error: commError } = await supabase
      .from('communications')
      .insert(communications)

    if (commError) {
      console.log('Response sent'); return NextResponse.json({ error: commError.message }, { status: 400 })
    }

    // Update campaign status
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'active', scheduled_at: new Date() })
      .eq('id', campaignId)

    if (updateError) {
      console.log('Response sent'); return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Notify channel service to process the campaign
    try {
    console.log('API request started')
      await fetch(`${channelServiceUrl}/api/process-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          communications,
          templateMessage: campaign.template_message,
        }),
      })
    } catch (err) {
      console.warn('Channel service not available, communications queued')
    }

    console.log('Response sent'); return NextResponse.json({
      success: true,
      message: 'Campaign launched',
      communicationCount: communications.length,
    })
  } catch (error) {
    console.log('Error:', error)
    console.error('Error launching campaign:', error)
    console.log('Response sent'); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
