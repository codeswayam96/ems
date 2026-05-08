"use client";

export function PremiumLoader() {
  return (
    <div className="flex min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Fake sidebar skeleton */}
      <div className="hidden md:flex w-64 min-h-screen flex-col" style={{ background: 'hsl(var(--sidebar))' }}>
        {/* Logo area */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/30 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
            <div className="h-2 w-28 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        {/* Nav skeleton */}
        <div className="flex-1 px-4 py-4 space-y-6">
          {[['w-10', 'w-24'], ['w-10', 'w-16', 'w-20', 'w-28', 'w-16'], ['w-10', 'w-24', 'w-20'], ['w-10', 'w-16']].map((group, gi) => (
            <div key={gi}>
              <div className="h-2 w-12 bg-white/10 rounded mb-3 animate-pulse" />
              <div className="space-y-1">
                {group.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-4 h-4 rounded bg-white/10 animate-pulse flex-shrink-0" />
                    <div className={`h-3 ${w} bg-white/10 rounded animate-pulse`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content — centered loader */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        {/* Pulsing ring logo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-violet-500/10 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute w-16 h-16 rounded-full bg-violet-500/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.25s' }} />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/40">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">EMS System</h2>
          <p className="text-sm text-muted-foreground animate-pulse">Initializing application...</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
            style={{ width: '60%', animation: 'loading-progress 1.8s ease-in-out infinite' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loading-progress {
          0%   { width: 10%; margin-left: 0%; }
          50%  { width: 60%; margin-left: 20%; }
          100% { width: 10%; margin-left: 90%; }
        }
      `}</style>
    </div>
  );
}
