import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function calculateSegment(ltv: number, purchaseCount: number, lastPurchaseDate: string | null): string {
  if (!lastPurchaseDate) return 'new'
  const days = Math.floor((Date.now() - new Date(lastPurchaseDate).getTime()) / 86400000)
  if (ltv > 5000 && days > 60)                                              return 'dormant_vip'
  if (purchaseCount === 1)                                                   return 'one_time_buyer'
  if (purchaseCount >= 2 && purchaseCount <= 4 && days >= 40 && days <= 60) return 'churn_risk'
  if (days <= 14)                                                            return 'recent_active'
  return 'at_risk'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customers } = body

    if (!Array.isArray(customers) || customers.length === 0) {
      console.log('Response sent'); return NextResponse.json({ error: 'No customers provided' }, { status: 400 })
    }

    // Validate and map each row — phone may arrive as a number from xlsx
    const validationErrors: string[] = []
    const valid = customers.map((row: any, i: number) => {
      const rowNum = i + 2
      const name  = String(row.name  || '').trim()
      const email = String(row.email || '').trim().toLowerCase()
      // phone can be a number (xlsx reads it as such) — convert to string first
      const rawPhone  = row.phone !== undefined && row.phone !== '' ? String(row.phone).replace(/[\s\-+]/g, '') : ''
      const phone     = rawPhone || null

      if (!name)  validationErrors.push(`Row ${rowNum}: name is required`)
      if (!email) validationErrors.push(`Row ${rowNum}: email is required`)
      if (phone && !/^\d{10}$/.test(phone))
        validationErrors.push(`Row ${rowNum}: phone must be 10 digits — got "${phone}"`)

      return {
        name,
        email,
        phone,
        category:       String(row.category || 'General').trim(),
        ltv:            Number(row.total_spent)    || 0,
        purchase_count: Number(row.purchase_count) || 0,
        last_purchase:  row.last_purchase_date ? String(row.last_purchase_date) : null,
      }
    }).filter((row: any) => row.name && row.email) // skip completely blank rows

    if (validationErrors.length > 0) {
      console.log('Response sent'); return NextResponse.json({ error: validationErrors.slice(0, 5).join(' | ') }, { status: 400 })
    }

    // Fetch existing emails to avoid unique constraint errors
    const { data: existing } = await supabase
      .from('customers')
      .select('email')

    const existingEmails = new Set((existing || []).map((r: any) => r.email.toLowerCase()))

    // Split into new inserts vs updates
    const toInsert = valid.filter((r: any) => !existingEmails.has(r.email))
    const toUpdate = valid.filter((r: any) =>  existingEmails.has(r.email))

    let insertedCount = 0
    let insertError: string | null = null

    if (toInsert.length > 0) {
      const { data: insertData, error: iErr } = await supabase
        .from('customers')
        .insert(toInsert)
        .select()
      if (iErr) { insertError = iErr.message }
      else { insertedCount += (insertData || []).length }
    }

    // Update existing ones individually (Supabase doesn't support bulk update easily)
    for (const row of toUpdate) {
      const { error: uErr } = await supabase
        .from('customers')
        .update({
          name:           row.name,
          phone:          row.phone,
          category:       row.category,
          ltv:            row.ltv,
          purchase_count: row.purchase_count,
          last_purchase:  row.last_purchase,
        })
        .eq('email', row.email)
      if (!uErr) insertedCount++
    }

    if (insertError && insertedCount === 0) {
      console.log('Response sent'); return NextResponse.json({ error: insertError }, { status: 400 })
    }

    console.log('Response sent'); return NextResponse.json({
      success: true,
      inserted: insertedCount,
      updated: toUpdate.length,
    })
  } catch (err) {
    console.log('Response sent'); return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
