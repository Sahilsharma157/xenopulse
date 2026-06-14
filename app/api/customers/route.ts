import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Calculate segment based on purchase behavior and days since last purchase
function calculateSegment(ltv: number, purchaseCount: number, lastPurchaseDate: string | null): string {
  if (!lastPurchaseDate) return 'new'

  const today = new Date()
  const lastPurchase = new Date(lastPurchaseDate)
  const daysSinceLastPurchase = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))

  // Dormant VIP: ltv > 150000 AND last_purchase older than 60 days
  if (ltv > 150000 && daysSinceLastPurchase > 60) {
    return 'dormant_vip'
  }

  // One-Time Buyer: purchase_count = 1
  if (purchaseCount === 1) {
    return 'one_time_buyer'
  }

  // Churn Risk: purchase_count between 2-4 AND last_purchase between 40-60 days ago
  if (purchaseCount >= 2 && purchaseCount <= 4 && daysSinceLastPurchase >= 40 && daysSinceLastPurchase <= 60) {
    return 'churn_risk'
  }

  // Recent Active: last_purchase within last 14 days
  if (daysSinceLastPurchase <= 14) {
    return 'recent_active'
  }

  // Default fallback
  return 'at_risk'
}

// Get all customers
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Response sent'); return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Add calculated segment to each customer
    const customersWithSegment = (data || []).map((customer) => ({
      ...customer,
      segment: calculateSegment(customer.ltv || 0, customer.purchase_count || 0, customer.last_purchase),
    }))

    console.log('Response sent'); return NextResponse.json(customersWithSegment)
  } catch (error) {
    console.log('Error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Internal server error'
    console.log('Response sent'); return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

// Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, phone, category, ltv, purchase_count, last_purchase } = body

    if (!email || !name) {
      console.log('Response sent'); return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const insertPayload = {
      email:          email.trim(),
      name:           name.trim(),
      phone:          phone || null,
      category:       category || 'General',
      ltv:            Number(ltv)            || 0,
      purchase_count: Number(purchase_count) || 0,
      last_purchase:  last_purchase          || null,
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([insertPayload])
      .select()

    if (error) {
      console.log('Response sent'); return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const customer = data?.[0]
    console.log('Response sent'); return NextResponse.json({
      ...customer,
      segment: calculateSegment(
        customer.ltv || 0,
        customer.purchase_count || 0,
        customer.last_purchase
      ),
    })
  } catch (error) {
    console.log('Error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Internal server error'
    console.log('Response sent'); return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
