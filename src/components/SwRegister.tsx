"use client";

import { useEffect, useState } from "react";

let deferredPrompt: any = null;

export function SwRegister() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // next-pwa auto-registers its generated SW; we just need the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-violet-700 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-violet-900/40 border border-violet-500/30 max-w-sm w-[calc(100%-2rem)]">
      <div className="flex-1">
        <p className="font-bold text-sm">Install EMS App</p>
        <p className="text-xs text-white/70">Add to home screen for quick access</p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-white text-violet-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
      >
        Install
      </button>
      <button
        onClick={() => setShowBanner(false)}
        className="text-white/60 hover:text-white text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
