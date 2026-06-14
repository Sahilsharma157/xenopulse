# XenoPulse - Advanced Marketing CRM Platform

XenoPulse is a modern customer engagement platform built with Next.js, Supabase, and AI-powered message generation using Claude. It enables businesses to create, launch, and analyze targeted marketing campaigns with real-time metrics.

## Features

- **Dashboard** - Real-time overview of campaigns, customers, and key metrics
- **Customer Management** - Organize customers into segments (Premium, Standard, Trial, Churned)
- **Campaign Builder** - Create campaigns with AI-powered message generation using Claude
- **Real-time Analytics** - Track email opens, clicks, and conversions with detailed funnel analysis
- **Channel Service** - Simulates campaign delivery and customer engagement events
- **Segment Targeting** - Target specific customer segments with tailored messages

## Tech Stack

- **Frontend**: Next.js 16 with React 19
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR for client-side caching
- **Channel Simulation**: Express.js service

## Prerequisites

Before you get started, ensure you have:

- Node.js 18+ and pnpm installed
- A Supabase project with API credentials
- An Anthropic Claude API key

## Environment Setup

### 1. Set Environment Variables

Create or update your environment variables in the Vercel project settings:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project.supabase.co

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key

# Channel Service (Optional)
CHANNEL_SERVICE_URL=http://localhost:3001
CHANNEL_SERVICE_PORT=3001
```

### 2. Initialize the Database

The database schema will be automatically applied through Supabase migrations. The schema includes:

- **customers** - Customer records with segments
- **campaigns** - Marketing campaign templates
- **communications** - Individual message records with engagement metrics

### 3. Install Dependencies

```bash
pnpm install
```

## Running the Application

### Option 1: Development Mode (Next.js only)

```bash
pnpm dev
```

The Next.js app will run on `http://localhost:3000`

### Option 2: With Channel Service (Recommended for testing analytics)

In one terminal:
```bash
pnpm dev
```

In another terminal:
```bash
pnpm run channel-service
```

The channel service will run on `http://localhost:3001` (or your specified PORT)

## First Steps

1. **Navigate to Home Page** - Visit `http://localhost:3000`
2. **Seed Data** - Click "Get Started" to populate sample customers
3. **Explore Dashboard** - View overview of your campaigns and customers
4. **Create Customers** - Go to Customers page to add more customers or view existing ones
5. **Build Campaign** - Go to Campaigns page to create a new campaign
6. **Generate Message** - Use the AI message generator with a prompt like:
   - "Create a promotional message for a summer sale"
   - "Write a personalized message about our new premium features"
7. **Launch Campaign** - Click "Launch" to send the campaign to your target segment
8. **View Analytics** - Go to Analytics to track opens, clicks, and conversions

## API Routes

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create a new customer

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create a new campaign
- `POST /api/campaigns/launch` - Launch a campaign

### Messages
- `POST /api/generate-message` - Generate AI message using Claude

### Analytics
- `GET /api/analytics?campaignId=<id>` - Get campaign analytics

### Data Management
- `POST /api/seed` - Seed sample data

## Channel Service

The Channel Service is a standalone Express.js application that simulates campaign delivery and customer engagement:

### How It Works

1. When you launch a campaign, communications are created in the database
2. The channel service receives a notification and starts simulating events
3. Events are simulated with realistic delays and probabilities:
   - **Sent**: Immediate (all emails)
   - **Opened**: 5-15 seconds delay (45% probability)
   - **Clicked**: 10-30 seconds delay (20% of opens)
   - **Converted**: 15-45 seconds delay (10% of clicks)

### Endpoints

- `POST /api/process-campaign` - Process a campaign (called automatically)
- `GET /health` - Health check

## Project Structure

```
├── app/
│   ├── api/              # API routes for backend functionality
│   ├── dashboard/        # Dashboard page
│   ├── customers/        # Customer management page
│   ├── campaigns/        # Campaign builder page
│   ├── analytics/        # Analytics and metrics page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/
│   ├── sidebar.tsx       # Navigation sidebar
│   ├── layout.tsx        # Main app layout wrapper
│   └── ui/               # UI components
├── lib/
│   ├── supabase/         # Supabase client and schema
│   └── utils.ts          # Utility functions
├── channel-service.js    # Standalone channel service
└── package.json
```

## Key Features Explained

### AI Message Generation

Uses Anthropic's Claude model to generate personalized marketing messages based on:
- Campaign prompt
- Customer segment
- Context

The prompt is sent to Claude with the campaign context to generate relevant, engaging copy.

### Campaign Segmentation

Target specific customer groups:
- **Premium** - High-value customers
- **Standard** - Regular customers
- **Trial** - Trial users evaluating the service
- **Churned** - Inactive customers

### Real-time Metrics

Track campaign performance with:
- **Open Rate** - Percentage of emails opened
- **Click Rate** - Percentage of emails with clicks
- **Conversion Rate** - Percentage of clicks that converted
- **Funnel Analysis** - Visual representation of the customer journey

## Troubleshooting

### "Missing environment variables" error
Ensure all required environment variables are set in your Vercel project settings (Vars section).

### Channel Service not processing campaigns
Make sure:
1. Channel service is running on the correct port
2. `CHANNEL_SERVICE_URL` is correctly set
3. Supabase credentials are correct in the channel service

### Database connection errors
Check:
1. Supabase URL and keys are correct
2. Database tables exist (run schema migrations)
3. Network connectivity to Supabase

### Claude API errors
Ensure:
1. `ANTHROPIC_API_KEY` is set correctly
2. Your API key has valid credits
3. The model name in the API call is correct

## Development

### Adding New Routes

Create new route files in `app/api/[route]/route.ts` following the existing patterns.

### Modifying the UI

Components are built with shadcn/ui and Tailwind CSS. Modify styling in:
- `app/globals.css` - Global theme colors
- Component files - Individual component styles

### Database Migrations

To modify the database schema, update `lib/supabase/schema.sql` and apply changes through Supabase dashboard.

## Deployment

To deploy to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel project settings
4. Deploy

Note: The channel service runs locally during development. For production, you may want to deploy it separately or use a serverless function.

## License

MIT

## Support

For issues or questions, please check the troubleshooting section or open an issue on GitHub.
