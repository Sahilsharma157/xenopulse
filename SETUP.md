# XenoPulse Setup Guide

## Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager
- Free Gemini API key from Google AI Studio
- Supabase project (optional for self-hosted, already configured for demo)

---

## Environment Variables

Create a `.env.local` file in the project root with:

```env
# Supabase Configuration (Pre-configured for demo)
NEXT_PUBLIC_SUPABASE_URL=https://klusuxstysszblefisgi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXN1eHN0eXNzemJsZWZpc2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc0OTI4MzAsImV4cCI6MTk3MzA2ODgzMH0.4oZXAw5ZPqV5lNx3V3sBo1Vc9_C-dJNqL8R1F6lEwQw

# Google Gemini API Key (FREE - Get from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Channel Service URL
CHANNEL_SERVICE_URL=http://localhost:3001
```

---

## Get Your Gemini API Key

1. Go to: **https://aistudio.google.com/**
2. Click **"Get API Key"** button
3. Create a new API key (no credit card required)
4. Copy the API key
5. Paste it into `.env.local` as: `GEMINI_API_KEY=your_key_here`

---

## Installation & Setup

### Terminal 1: Next.js Development Server

```bash
# 1. Install dependencies (one time only)
npm install
# or
pnpm install

# 2. Ensure .env.local is created with your Gemini API key

# 3. Start development server
npm run dev
# or
pnpm dev
```

The app will run at **http://localhost:3000**

### Terminal 2: Channel Service (Optional but recommended)

```bash
# 1. Navigate to channel service directory
cd channel-service

# 2. Install dependencies (one time only)
npm install

# 3. Start channel service
node server.js
```

The channel service will run at **http://localhost:3001**

---

## Test the Complete Flow

### Step 1: Load Demo Data
1. Open **http://localhost:3000** in browser
2. Click **"Load Demo Data"** button
3. Wait for confirmation (5-10 seconds)

### Step 2: View Dashboard
1. Navigate to **Dashboard** (left sidebar)
2. You should see 4 "AI Opportunity" cards with:
   - Customer segment names
   - AI-generated reasoning about why to target them
   - Customer count and revenue metrics
   - "Launch Campaign" button

### Step 3: Create Campaign
1. Click **"Launch Campaign"** on any opportunity card
2. You'll be taken to campaign creation page with pre-filled segment
3. Click **"Draft with AI"** button
4. Wait for AI to generate a message
5. Review the generated message
6. Click **"Send Campaign"**

### Step 4: Success Modal
1. You'll see a success modal showing:
   - Green checkmark icon
   - Number of customers campaign was sent to
   - Two buttons: "View Analytics" and "Back to Dashboard"

### Step 5: View Live Analytics
1. Click **"View Analytics"** button
2. See real-time campaign metrics:
   - Summary cards (Total Sent, Delivered, Opened, Clicked)
   - Per-campaign performance cards
   - Conversion funnels with percentages
   - Auto-refreshing every 3 seconds (Live indicator pulsing)

### Step 6: Chat with AI Agent
1. Click floating chat button (bottom-right corner)
2. Ask questions like:
   - "Who should I target next?"
   - "How many dormant VIPs do we have?"
   - "What's our average customer lifetime value?"
3. AI responds with insights based on real database data

---

## Troubleshooting

### "AI not configured" message appears
- **Solution**: Check that `GEMINI_API_KEY` is set in `.env.local`
- Make sure it's a valid key from https://aistudio.google.com/
- Restart dev server after adding the key

### Campaign creation fails
- **Solution**: Ensure both Next.js server and channel service are running
- Check that `.env.local` has both `GEMINI_API_KEY` and Supabase keys
- Look at terminal output for error details

### Analytics not updating
- **Solution**: Page auto-refreshes every 3 seconds, wait a moment
- Check that campaigns were actually sent by viewing success modal count
- If no campaigns exist, create one first via Dashboard

### Chat not responding
- **Solution**: Verify `GEMINI_API_KEY` is set correctly
- Check browser console (F12) for error messages
- Ensure you have demo data loaded first

---

## Key Features Working Locally

✅ **AI Campaign Generation** - Uses Gemini 2.0 Flash (Experimental)
✅ **Real-time Analytics** - Live metrics with auto-refresh
✅ **Chat Agent** - Responds to questions using backend data
✅ **Multi-segment Targeting** - Dormant VIPs, One-Time Buyers, Recent Actives, Churn Risk
✅ **Database Integration** - Connects to Supabase for real data
✅ **Success Confirmations** - Modal feedback after campaign launch

---

## Running Without Channel Service

The app can run with just Terminal 1 (Next.js). The channel service is optional and used for sending real SMS/WhatsApp messages. For local demo, it's not required - campaigns will be created and analytics will show.

---

## Support

If you encounter any issues:
1. Check that all environment variables are set in `.env.local`
2. Verify Gemini API key is valid (visit aistudio.google.com)
3. Restart the dev server after any changes
4. Check browser console (F12) and terminal output for error messages

Happy marketing! 🚀
