## XenoPulse Channel Service

The channel service simulates message delivery across WhatsApp, SMS, Email, and RCS channels. It receives campaign data from the main app and simulates realistic delivery patterns.

### Setup & Running Locally

#### 1. Install Dependencies
```bash
cd channel-service
npm install
```

#### 2. Start the Channel Service
```bash
npm start
# Server runs on http://localhost:3001
```

The service will:
- Listen on port 3001
- Receive POST requests at `/send` from the main app
- Simulate message delivery (delivered after 1-2 seconds)
- Simulate opens (25-40% of delivered messages)
- Simulate clicks (10-20% of delivered messages)  
- Simulate conversions (5-10% of clicked messages)
- Send callback updates to `http://localhost:3000/api/callbacks`

### How It Works

**Flow:**
1. Campaign created in app → sends to `http://localhost:3001/send`
2. Channel service receives campaign data (segment, customers, channel, message)
3. Simulates sending to each customer with realistic delays
4. Starts tracking: delivered → opened → clicked → converted
5. Calls back to `http://localhost:3000/api/callbacks` with each status update
6. Main app /api/callbacks route updates campaign metrics in Supabase
7. Analytics page shows real-time metrics

### Testing

1. Open dashboard and click "Launch Campaign" on any segment
2. Select channel (WhatsApp, SMS, Email, RCS)
3. Type message or click "Draft with AI"
4. Click "Send Campaign"
5. Within 2-3 seconds, you'll see:
   - Console logs in channel service showing delivery
   - Campaign record created in Supabase
   - Communications created for each customer
6. Go to Analytics page
7. Select the campaign from dropdown
8. Watch metrics update in real-time as channel service simulates opens/clicks/conversions

### Environment Variables

The channel service uses:
- `MAIN_APP_URL`: Defaults to `http://localhost:3000`
- `PORT`: Defaults to `3001`

To change, set in `.env`:
```
MAIN_APP_URL=http://localhost:3000
PORT=3001
```

### What Gets Simulated

- **Delivered**: Message reaches customer (instant to 2s delay)
- **Opened**: Customer reads message (5-30s after delivery)
- **Clicked**: Customer clicks link in message (10-40s after opening)
- **Converted**: Customer completes action (15-60s after clicking)

Each metric is random based on channel:
- WhatsApp: Highest open rates (35-45%), high click rates (15-25%)
- SMS: Good open rates (25-35%), moderate click rates (10-20%)
- Email: Variable open rates (20-30%), lower click rates (5-15%)
- RCS: Similar to SMS with better formatting (28-38% open, 12-22% click)

### Monitoring

Check the main app's `http://localhost:3000/analytics` page to see:
- Campaign metrics updating in real-time
- Delivery rates by channel
- Click-through rates
- Conversion rates
- Total revenue impact

All data persists in Supabase, so metrics survive server restarts.
