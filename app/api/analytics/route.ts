import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Get campaign analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      console.log('Response sent'); return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
    }

    // Get campaign info
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      console.log('Response sent'); return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get communications metrics
    const { data: communications, error: commError } = await supabase
      .from('communications')
      .select('*')
      .eq('campaign_id', campaignId)

    if (commError) {
      console.log('Response sent'); return NextResponse.json({ error: commError.message }, { status: 400 })
    }

    // Calculate analytics
    const totalSent = communications?.filter((c) => c.status === 'sent').length || 0
    const totalOpened = communications?.filter((c) => c.opened).length || 0
    const totalClicked = communications?.filter((c) => c.clicked).length || 0
    const totalConverted = communications?.filter((c) => c.converted).length || 0

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0
    const conversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0

    console.log('Response sent'); return NextResponse.json({
      campaign,
      metrics: {
        totalSent,
        totalOpened,
        totalClicked,
        totalConverted,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      communications,
    })
  } catch (error) {
    console.log('Error:', error)
    console.error('Error fetching analytics:', error)
    console.log('Response sent'); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
