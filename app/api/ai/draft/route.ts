import { NextRequest, NextResponse } from 'next/server'

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']

// Strip any markdown that Gemini sneaks in despite instructions
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')    // **bold**
    .replace(/\*(.+?)\*/g, '$1')          // *italic*
    .replace(/__(.+?)__/g, '$1')           // __bold__
    .replace(/_(.+?)_/g, '$1')             // _italic_
    .replace(/#{1,6}\s+/g, '')             // # headings
    .replace(/`{1,3}(.+?)`{1,3}/g, '$1')  // `code`
    .replace(/^\s*[-*+]\s+/gm, '')         // - bullet points
    .replace(/^\s*\d+\.\s+/gm, '')         // 1. numbered lists
    .replace(/\n{3,}/g, '\n\n')            // excess blank lines
    .trim()
}

async function callGemini(prompt: string): Promise<string> {
  const apiKeys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean)
  
  if (!apiKeys.length) {
    return 'AI not configured. Please add GEMINI_API_KEY to environment variables.'
  }
  
  
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
          continue
        }
        
        if (response.ok) {
          const data = await response.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            return text
          }
        } else {
          const errorText = await response.text().catch(() => '')
        }
      } catch (e) {
      }
    }
  }
  
  if (quotaExceeded) {
    return 'The AI feature daily limit is over. Come back in a few hours.'
  }
  
  return 'AI temporarily unavailable'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { segment, count, reasoning, existingMessage, channel } = body

    const segmentNames: Record<string, string> = {
      dormant_vip: 'Dormant VIP customers',
      one_time_buyer: 'One-Time Buyer customers',
      recent_active: 'Recent Active customers',
      churn_risk: 'Churn Risk customers',
    }

    let prompt: string

    if (existingMessage && existingMessage.trim().length > 0) {
      prompt = `You are a marketing expert. Refine the following rough draft into a polished, professional ${channel || 'message'} (max 3 sentences). Keep the original intent but make it more compelling. Do not add placeholder text like [Name]. Output plain text only — no asterisks, no bold, no markdown or symbols of any kind.

User draft: "${existingMessage.trim()}"

Return only the refined message, nothing else.`
    } else {
      prompt = `You are a marketing expert for a D2C brand in India. Write a short, warm, personalized ${channel || 'WhatsApp'} message (max 3 sentences) for this customer segment. Make it feel human, not like a bulk blast. Include a soft call to action. Do not use placeholder text like [Name]. Output plain text only — no asterisks, no bold, no markdown or symbols of any kind.

Segment: ${segmentNames[segment] || segment}
Customer Count: ${count}
Context: ${reasoning}

Return only the message text, nothing else.`
    }

    const raw = await callGemini(prompt)
    console.log('Response sent'); return NextResponse.json({ message: stripMarkdown(raw).trim() })
  } catch (error) {
    console.log('Error:', error)
    console.log('Response sent'); return NextResponse.json({ response: 'AI temporarily unavailable' }, { status: 200 })
  }
}
