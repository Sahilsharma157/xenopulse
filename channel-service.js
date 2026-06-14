#!/usr/bin/env node

/**
 * XenoPulse Channel Service
 * A standalone service that simulates campaign delivery across email channels
 * Simulates open, click, and conversion events with realistic delays
 */

import express from 'express'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = parseInt(process.env.CHANNEL_SERVICE_PORT || '3001')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  )
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Middleware
app.use(express.json())

// Helper function to simulate campaign event with delay
async function simulateCampaignEvent(
  communication: any,
  eventType: 'sent' | 'opened' | 'clicked' | 'converted'
) {
  const delays = {
    sent: 1000, // 1 second
    opened: 5000 + Math.random() * 10000, // 5-15 seconds
    clicked: 10000 + Math.random() * 20000, // 10-30 seconds
    converted: 15000 + Math.random() * 30000, // 15-45 seconds
  }

  const randomDelay = delays[eventType]
  const probability = {
    sent: 1.0, // All emails get "sent"
    opened: 0.45, // 45% open rate
    clicked: 0.2, // 20% of opens result in clicks
    converted: 0.1, // 10% of clicks result in conversions
  }

  // Skip event based on probability
  if (Math.random() > probability[eventType]) {
    return
  }

  // Wait for delay
  await new Promise((resolve) => setTimeout(resolve, randomDelay))

  // Update communication record
  const updateData: Record<string, any> = {}
  const timestamp = new Date()

  if (eventType === 'sent') {
    updateData.status = 'sent'
    updateData.sent_at = timestamp
  } else if (eventType === 'opened') {
    updateData.opened = true
    updateData.opened_at = timestamp
  } else if (eventType === 'clicked') {
    updateData.clicked = true
    updateData.clicked_at = timestamp
  } else if (eventType === 'converted') {
    updateData.converted = true
    updateData.converted_at = timestamp
  }

  try {
    await supabase
      .from('communications')
      .update(updateData)
      .eq('id', communication.id)

    console.log(
      `[CHANNEL SERVICE] Event: ${eventType} | Communication: ${communication.id}`
    )
  } catch (error) {
    console.error(`Error updating event ${eventType}:`, error)
  }
}

// Process campaign endpoint
app.post('/api/process-campaign', async (req, res) => {
  try {
    const { campaignId, communications } = req.body

    if (!campaignId || !communications || !Array.isArray(communications)) {
      return res
        .status(400)
        .json({ error: 'Invalid request: missing campaignId or communications' })
    }

    console.log(
      `[CHANNEL SERVICE] Processing campaign: ${campaignId} with ${communications.length} communications`
    )

    // Simulate campaign events asynchronously (fire and forget)
    communications.forEach((communication: any) => {
      // Simulate sent event
      simulateCampaignEvent(communication, 'sent')
        .then(() => simulateCampaignEvent(communication, 'opened'))
        .then(() => simulateCampaignEvent(communication, 'clicked'))
        .then(() => simulateCampaignEvent(communication, 'converted'))
        .catch((error) => {
          console.error('Error in event simulation chain:', error)
        })
    })

    res.json({
      success: true,
      message: 'Campaign processing started',
      campaignId,
      communicationCount: communications.length,
    })
  } catch (error) {
    console.error('Error processing campaign:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'xenopulse-channel-service' })
})

// Start server
app.listen(PORT, () => {
  console.log(`[CHANNEL SERVICE] Running on http://localhost:${PORT}`)
  console.log(`[CHANNEL SERVICE] Ready to process campaigns`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[CHANNEL SERVICE] SIGTERM received, shutting down gracefully')
  process.exit(0)
})
