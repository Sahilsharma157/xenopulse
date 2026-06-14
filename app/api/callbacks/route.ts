import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { communication_id, status } = await req.json()
    

    // Update communication status
    const { error: updateError } = await supabase
      .from('communications')
      .update({ status })
      .eq('id', communication_id)

    if (updateError) {
      console.log('Response sent'); return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Get campaign_id for this communication
    const { data: comm, error: fetchError } = await supabase
      .from('communications')
      .select('campaign_id')
      .eq('id', communication_id)
      .single()

    if (fetchError) {
      console.log('Response sent'); return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    if (comm?.campaign_id) {
      const columnMap: Record<string, string> = {
        delivered: 'delivered_count',
        opened: 'opened_count',
        clicked: 'clicked_count',
        converted: 'converted_count'
      }
      const column = columnMap[status]
      
      if (column) {
        
        const { error: rpcError } = await supabase.rpc('increment_campaign_count', {
          campaign_id: comm.campaign_id,
          column_name: column
        })

        if (rpcError) {
          console.log('Response sent'); return NextResponse.json({ error: rpcError.message }, { status: 400 })
        }
      }
    }

    console.log('Response sent'); return NextResponse.json({ success: true, status, communication_id })
  } catch (error) {
    console.log('Error:', error)
    console.log('Response sent'); return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
