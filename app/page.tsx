export default function Page() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] px-8 py-4 flex items-center gap-2">
        <a href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="9" cy="9" r="5" fill="#2563EB"/>
            <circle cx="23" cy="9" r="5" fill="#2563EB"/>
            <circle cx="9" cy="23" r="5" fill="#2563EB"/>
            <circle cx="23" cy="23" r="5" fill="#2563EB"/>
            <line x1="23" y1="9" x2="9" y2="23" stroke="#2563EB" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <span className="font-semibold text-[#111111] text-lg">XenoPulse</span>
        </a>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#2563EB] text-xs font-medium px-3 py-1 rounded-full mb-6">
          AI-Native CRM
        </div>
        <h1 className="text-4xl font-semibold text-[#111111] leading-tight mb-4">
          Reach the right shoppers<br/>at the right moment
        </h1>
        <p className="text-[#6B7280] text-lg mb-8">
          XenoPulse watches your customer data and tells you who to reach, when, and why. You just approve and fire.
        </p>
        
        {/* Buttons */}
        <div className="flex items-center gap-3 mb-12">
          <a
            href="/dashboard"
            className="bg-[#0A0A0A] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#1a1a1a] transition-colors"
          >
            Go to Dashboard →
          </a>
          <a
            href="/customers?upload=true"
            className="border border-[#E5E7EB] text-[#111111] px-6 py-2.5 rounded-lg font-medium hover:bg-[#F9FAFB] transition-colors"
          >
            Upload CSV / Excel
          </a>
        </div>

        {/* 3 feature pills */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-2">
            <span className="w-2 h-2 bg-[#16A34A] rounded-full"/>
            <span className="text-sm text-[#111111] font-medium">AI Opportunity Feed</span>
          </div>
          <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-2">
            <span className="w-2 h-2 bg-[#2563EB] rounded-full"/>
            <span className="text-sm text-[#111111] font-medium">Smart Segmentation</span>
          </div>
          <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-4 py-2">
            <span className="w-2 h-2 bg-[#7C3AED] rounded-full"/>
            <span className="text-sm text-[#111111] font-medium">Live Analytics</span>
          </div>
        </div>
      </div>
    </div>
  )
}

