const express = require('express')
const app = express()
app.use(express.json())

const CRM_URL = process.env.CRM_URL || 'http://localhost:3003'

app.post('/send', async (req, res) => {
  const { campaign_id, communications } = req.body
  console.log(`[Channel Service] Received campaign ${campaign_id} for ${communications.length} customers`)
  res.json({ accepted: communications.length })

  for (const comm of communications) {
    // Delivered: 2-4 seconds
    setTimeout(async () => {
      try {
        await fetch(`${CRM_URL}/api/callbacks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ communication_id: comm.communication_id, status: 'delivered' })
        })
        console.log(`[Channel Service] Delivered to ${comm.communication_id}`)
      } catch (error) {
        console.error(`[Channel Service] Error delivering ${comm.communication_id}:`, error)
      }
    }, 2000 + Math.random() * 2000)

    // Opened: 70% chance, 5-8 seconds
    if (Math.random() < 0.7) {
      setTimeout(async () => {
        try {
          await fetch(`${CRM_URL}/api/callbacks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ communication_id: comm.communication_id, status: 'opened' })
          })
          console.log(`[Channel Service] Opened by ${comm.communication_id}`)
        } catch (error) {
          console.error(`[Channel Service] Error opening ${comm.communication_id}:`, error)
        }
      }, 5000 + Math.random() * 3000)
    }

    // Clicked: 30% chance, 10-14 seconds
    if (Math.random() < 0.3) {
      setTimeout(async () => {
        try {
          await fetch(`${CRM_URL}/api/callbacks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ communication_id: comm.communication_id, status: 'clicked' })
          })
          console.log(`[Channel Service] Clicked by ${comm.communication_id}`)
        } catch (error) {
          console.error(`[Channel Service] Error clicking ${comm.communication_id}:`, error)
        }
      }, 10000 + Math.random() * 4000)
    }

    // Converted: 10% chance, 15-20 seconds
    if (Math.random() < 0.1) {
      setTimeout(async () => {
        try {
          await fetch(`${CRM_URL}/api/callbacks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ communication_id: comm.communication_id, status: 'converted' })
          })
          console.log(`[Channel Service] Converted by ${comm.communication_id}`)
        } catch (error) {
          console.error(`[Channel Service] Error converting ${comm.communication_id}:`, error)
        }
      }, 15000 + Math.random() * 5000)
    }
  }
})

app.listen(3001, () => console.log('[Channel Service] Running on port 3001'))
