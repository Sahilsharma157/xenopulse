import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Seed customers with sample data matching segment definitions
export async function POST() {
  try {
    // Clear existing data first to avoid duplicates
    await supabase.from('communications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const today = new Date()
    const dateOffset = (days: number) => {
      const d = new Date(today)
      d.setDate(d.getDate() - days)
      return d.toISOString().split('T')[0]
    }

    const customers = [
      // Dormant VIP: ltv > 150000 AND last_purchase older than 60 days (5 customers)
      { name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', phone: '+91-98765-43201', last_purchase: dateOffset(75), purchase_count: 18, ltv: 250000, category: 'Electronics' },
      { name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91-98765-43202', last_purchase: dateOffset(90), purchase_count: 22, ltv: 320000, category: 'Fashion' },
      { name: 'Amit Singh', email: 'amit.singh@example.com', phone: '+91-98765-43203', last_purchase: dateOffset(120), purchase_count: 25, ltv: 450000, category: 'Electronics' },
      { name: 'Deepika Patel', email: 'deepika.patel@example.com', phone: '+91-98765-43204', last_purchase: dateOffset(65), purchase_count: 20, ltv: 280000, category: 'Luxury' },
      { name: 'Vikram Verma', email: 'vikram.verma@example.com', phone: '+91-98765-43205', last_purchase: dateOffset(100), purchase_count: 30, ltv: 550000, category: 'Electronics' },

      // One-Time Buyer: purchase_count = 1 (5 customers)
      { name: 'Neha Gupta', email: 'neha.gupta@example.com', phone: '+91-98765-43206', last_purchase: dateOffset(45), purchase_count: 1, ltv: 50000, category: 'Books' },
      { name: 'Arjun Desai', email: 'arjun.desai@example.com', phone: '+91-98765-43207', last_purchase: dateOffset(10), purchase_count: 1, ltv: 80000, category: 'Fashion' },
      { name: 'Sneha Reddy', email: 'sneha.reddy@example.com', phone: '+91-98765-43208', last_purchase: dateOffset(30), purchase_count: 1, ltv: 35000, category: 'Electronics' },
      { name: 'Rohan Chopra', email: 'rohan.chopra@example.com', phone: '+91-98765-43209', last_purchase: dateOffset(55), purchase_count: 1, ltv: 62000, category: 'Home' },
      { name: 'Isha Iyer', email: 'isha.iyer@example.com', phone: '+91-98765-43210', last_purchase: dateOffset(25), purchase_count: 1, ltv: 45000, category: 'Beauty' },

      // Recent Active: last_purchase within last 14 days (5 customers)
      { name: 'Karan Malhotra', email: 'karan.malhotra@example.com', phone: '+91-98765-43211', last_purchase: dateOffset(3), purchase_count: 8, ltv: 120000, category: 'Electronics' },
      { name: 'Anya Sinha', email: 'anya.sinha@example.com', phone: '+91-98765-43212', last_purchase: dateOffset(7), purchase_count: 5, ltv: 85000, category: 'Fashion' },
      { name: 'Nikhil Sharma', email: 'nikhil.sharma@example.com', phone: '+91-98765-43213', last_purchase: dateOffset(2), purchase_count: 12, ltv: 180000, category: 'Electronics' },
      { name: 'Pooja Nair', email: 'pooja.nair@example.com', phone: '+91-98765-43214', last_purchase: dateOffset(10), purchase_count: 6, ltv: 95000, category: 'Fashion' },
      { name: 'Sanjay Bhat', email: 'sanjay.bhat@example.com', phone: '+91-98765-43215', last_purchase: dateOffset(5), purchase_count: 9, ltv: 140000, category: 'Sports' },

      // Churn Risk: purchase_count between 2-4 AND last_purchase between 40-60 days ago (5 customers)
      { name: 'Madhavi Singh', email: 'madhavi.singh@example.com', phone: '+91-98765-43216', last_purchase: dateOffset(45), purchase_count: 3, ltv: 42000, category: 'Books' },
      { name: 'Tarun Agarwal', email: 'tarun.agarwal@example.com', phone: '+91-98765-43217', last_purchase: dateOffset(50), purchase_count: 2, ltv: 28000, category: 'Electronics' },
      { name: 'Divya Saxena', email: 'divya.saxena@example.com', phone: '+91-98765-43218', last_purchase: dateOffset(55), purchase_count: 4, ltv: 55000, category: 'Fashion' },
      { name: 'Akshay Kumar', email: 'akshay.kumar@example.com', phone: '+91-98765-43219', last_purchase: dateOffset(48), purchase_count: 3, ltv: 38000, category: 'Home' },
      { name: 'Ritika Verma', email: 'ritika.verma@example.com', phone: '+91-98765-43220', last_purchase: dateOffset(58), purchase_count: 2, ltv: 22000, category: 'Beauty' },
    ]

    const { data, error } = await supabase.from('customers').insert(customers).select()

    if (error) {
      console.log('Response sent'); return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Response sent'); return NextResponse.json({ success: true, data, count: data?.length || 0 })
  } catch (error) {
    console.log('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.log('Response sent'); return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
