import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']

async function callGemini(prompt: string): Promise<string> {
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean) as string[]

  if (apiKeys.length === 0) return 'AI not configured'

  let quotaExceeded = false

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const apiKey = apiKeys[keyIdx]
    const keyLabel = `KEY${keyIdx + 1}`
    
    for (const model of GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        )

        if (response.status === 429) {
          quotaExceeded = true
          break // Try next API key
        }

        if (response.ok) {
          const data = await response.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) return text
        }
      } catch (e) {
        // Network error — try next
      }
    }
  }

  if (quotaExceeded) {
    return 'The AI feature limit for today is over. Come back in some time.'
  }

  return 'AI temporarily unavailable'
}

// Generate AI message using Gemini
export async function POST(request: NextRequest) {
  const hasKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_3
  if (!hasKey) {
    console.log('Response sent'); return NextResponse.json({ response: 'AI not configured. Please add GEMINI_API_KEY to environment variables.' }, { status: 200 })
  }

  try {
    const body = await request.json()
    const { prompt, customerName, segment } = body

    if (!prompt) {
      console.log('Response sent'); return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const userPrompt = `Generate a marketing message with this context:
Prompt: ${prompt}
Customer Name: ${customerName || 'Customer'}
Segment: ${segment || 'general'}

Keep it concise (1-2 sentences max) and personalized. Return only the message text.`

    const generatedMessage = await callGemini(userPrompt)

    console.log('Response sent'); return NextResponse.json({
      success: true,
      message: generatedMessage,
    })
  } catch (error) {
    console.log('Error:', error)
    console.log('Response sent'); return NextResponse.json({ response: 'AI temporarily unavailable' }, { status: 200 })
  }
}
