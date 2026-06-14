import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`{1,3}(.+?)`{1,3}/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKeys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean)
  let quotaExceeded = false
  
  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const apiKey = apiKeys[keyIdx]
    const keyLabel = `KEY${keyIdx + 1}`
    
    for (const model of GEMINI_MODELS) {
      try {
        const body: any = {
          contents: [{ parts: [{ text: prompt }] }]
        }
        
        if (systemInstruction) {
          body.systemInstruction = { parts: [{ text: systemInstruction }] }
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }
        )
        
        if (response.status === 429) {
          quotaExceeded = true
          continue
        }
        
        if (response.ok) {
          const data = await response.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            return text
          }
        } else {
        }
      } catch (e) {
        // try next
      }
    }
  }
  
  if (quotaExceeded) {
    return 'The AI feature limit for today is over. Come back in some time.'
  }
  
  return 'AI temporarily unavailable'
}

export async function POST(req: NextRequest) {
  
  const { type, segment, message, history } = await req.json()

  const apiKeys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean)
  
  if (apiKeys.length === 0) {
    console.log('Response sent'); return NextResponse.json(
      { error: 'AI not configured. Please add GEMINI_API_KEY to environment variables.' },
      { status: 200 }
    )
  }


  try {
    // Always fetch fresh data from DB
    const { data: customers } = await supabase.from('customers').select('*')
    
    const { data: campaigns } = await supabase.from('campaigns').select('*')

    const dormantVips = customers?.filter(c => 
      c.ltv > 150000 && new Date(c.last_purchase) < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    ) || []
    
    const oneTimeBuyers = customers?.filter(c => c.purchase_count === 1) || []
    
    const recentActives = customers?.filter(c => 
      new Date(c.last_purchase) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    ) || []
    
    const churnRisk = customers?.filter(c => 
      c.purchase_count >= 2 && c.purchase_count <= 4 &&
      new Date(c.last_purchase) < new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) &&
      new Date(c.last_purchase) > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    ) || []


    const totalRevenue = customers?.reduce((sum, c) => sum + (c.ltv || 0), 0) || 0
    const avgLTV = customers?.length ? Math.round(totalRevenue / customers.length) : 0
    const totalCampaigns = campaigns?.length || 0
    const avgDeliveryRate = campaigns?.length 
      ? Math.round(campaigns.reduce((sum, c) => sum + (c.sent_count > 0 ? c.delivered_count / c.sent_count * 100 : 0), 0) / campaigns.length)
      : 0

    const brandContext = `
You are XenoPulse AI, a professional marketing assistant for a D2C brand.

CURRENT BRAND DATA (real-time):
Total customers: ${customers?.length || 0}
Total revenue potential: ₹${totalRevenue.toLocaleString('en-IN')}
Average customer LTV: ₹${avgLTV.toLocaleString('en-IN')}
Dormant VIPs (60+ days inactive): ${dormantVips.length} customers worth ₹${dormantVips.reduce((s,c) => s+c.ltv, 0).toLocaleString('en-IN')}
One-Time Buyers: ${oneTimeBuyers.length} customers
Recent Actives (last 14 days): ${recentActives.length} customers
Churn Risk: ${churnRisk.length} customers
Total campaigns sent: ${totalCampaigns}
Average delivery rate: ${avgDeliveryRate}%

STRICT OUTPUT RULES — follow without exception:
1. Output plain text only. No markdown of any kind.
2. Never use asterisks (*), underscores (_), hashtags (#), backticks or any markdown symbols.
3. Write in natural flowing sentences like a professional advisor.
4. Keep responses to 2-3 sentences. Always include real numbers from the data above.
5. No bullet points, no numbered lists, no headers.
  `

    let userPrompt = ''

    if (type === 'draft') {
      userPrompt = `Write a short personalized ${segment} campaign message for WhatsApp. Max 2-3 sentences. Warm tone, soft call to action. Reference the customer segment context. Return only the message text.`
    } else if (type === 'chat') {
      const historyText = history?.map((h: any) => `${h.role}: ${h.content}`).join('\n') || ''
      userPrompt = `${historyText}\nuser: ${message}`
    } else if (type === 'opportunities') {
      userPrompt = `Based on the customer data, give me a one-sentence reasoning for why each segment needs attention now. Return as JSON: { "dormant_vip": "...", "one_time_buyer": "...", "churn_risk": "...", "recent_active": "..." }`
    }


    const raw = await callGemini(userPrompt, brandContext)

    // Don't strip markdown from JSON responses (opportunities type)
    const response = type === 'opportunities' ? raw : stripMarkdown(raw)

    console.log('Response sent'); return NextResponse.json({ response })
  } catch (error) {
    console.log('Error:', error)
    console.log('Response sent'); return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
