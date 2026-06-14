import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']

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
        }
        // try next
      }
    }
  }
  
  if (quotaExceeded) {
    console.warn('All API keys have exceeded daily quota')
    return 'The AI feature limit for today is over. Come back in some time.'
  }
  
  console.error('All API keys failed to generate response')
  return 'AI temporarily unavailable'
}

export async function POST(request: NextRequest) {
  const apiKeys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean)
  
  if (apiKeys.length === 0) {
    console.log('No GEMINI API keys found in environment')
    return NextResponse.json({ response: 'AI not configured. Please add GEMINI_API_KEY to environment variables.' }, { status: 200 })
  }

  console.log('Chat API called with', apiKeys.length, 'API keys available')


  try {
    const { message, history } = await request.json()

    // Fetch current data from Supabase
    const { data: customers = [] } = await supabase.from('customers').select('*')
    const { data: campaigns = [] } = await supabase.from('campaigns').select('*')

    // Calculate segment counts and metrics
    const dormantVips = customers.filter((c: any) => c.segment === 'dormant_vip')
    const oneTimeBuyers = customers.filter((c: any) => c.segment === 'one_time_buyer')
    const recentActive = customers.filter((c: any) => c.segment === 'recent_active')
    const churnRisk = customers.filter((c: any) => c.segment === 'churn_risk')

    const dormantVipsRevenue = dormantVips.reduce((sum: number, c: any) => sum + (c.ltv || 0), 0)
    const sentCampaigns = campaigns.filter((c: any) => c.status === 'sent').length
    const avgLTV = customers.length > 0 
      ? Math.round(customers.reduce((sum: number, c: any) => sum + (c.ltv || 0), 0) / customers.length)
      : 0

    const systemPrompt = `You are XenoPulse AI, a marketing advisor for an Indian D2C brand.

Current Brand Snapshot
Total Customers: ${customers.length}
Dormant VIPs: ${dormantVips.length} (₹${dormantVipsRevenue.toLocaleString('en-IN')} potential)
One-Time Buyers: ${oneTimeBuyers.length}
Recent Active: ${recentActive.length}
Churn Risk: ${churnRisk.length}
Average Customer Value: ₹${avgLTV.toLocaleString('en-IN')}
Campaigns Sent: ${sentCampaigns}

Response Guidelines - CRITICAL:
NEVER use asterisks (*), dashes (-), hashtags (#), or any markdown formatting.
Write responses as plain, clean text with natural sentence structure.
Use simple line breaks between paragraphs if needed.
Keep responses concise and actionable (2-3 sentences max).
Include specific numbers from the data above.
Be warm but direct and professional.
NO DECORATIONS. NO SYMBOLS. PLAIN TEXT ONLY.

Example good response: "Based on your data, you have 5 Dormant VIPs worth 18.5 lakhs. I'd recommend targeting them first with a re-engagement campaign offering a special discount."

Example bad response: "Based on your data, you have **5 Dormant VIPs** worth *18.5 lakhs*. I'd recommend..." (NO - has asterisks)`

    // Build conversation as simple text for Gemini
    const historyText = history?.map((h: Message) => `${h.role}: ${h.content}`).join('\n') || ''
    const userPrompt = `${historyText}\nuser: ${message}`

    const assistantMessage = await callGemini(userPrompt, systemPrompt)

    console.log('Response sent'); return NextResponse.json({
      response: assistantMessage,
      success: true,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ response: 'AI temporarily unavailable' }, { status: 200 })
  }
}
