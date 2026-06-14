import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Get all campaigns
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Response sent'); return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Response sent'); return NextResponse.json(data)
  } catch (error) {
    console.log('Error:', error)
    console.error('Error fetching campaigns:', error)
    console.log('Response sent'); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, template_message, target_segment } = body

    if (!name || !template_message) {
      console.log('Response sent'); return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert([
        {
          name,
          template_message,
          target_segment: target_segment || 'general',
          status: 'draft',
        },
      ])
      .select()

    if (error) {
      console.log('Response sent'); return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Response sent'); return NextResponse.json(data?.[0])
  } catch (error) {
    console.log('Error:', error)
    console.error('Error creating campaign:', error)
    console.log('Response sent'); return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
