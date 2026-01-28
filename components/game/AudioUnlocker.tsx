"use client";
import { useState, useEffect } from "react";

export default function AudioUnlocker({ children }: { children: React.ReactNode }) {
  const [audioAccepted, setAudioAccepted] = useState(false);

  // Auto-unlock attempt
  useEffect(() => {
    const unlock = async () => {
        try {
            // Attempt to create and play audio context
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (ctx.state === 'suspended') {
                // Suspended means we need interaction
                setAudioAccepted(false);
            } else {
                setAudioAccepted(true);
            }
        } catch {
            setAudioAccepted(false);
        }
    };
    unlock();
  }, []);

  const handleUnlockAudio = () => {
      const audio = new Audio();
      audio.play().catch(() => {}); 
      setAudioAccepted(true);
  };

  if (!audioAccepted) {
      return (
          <div 
            onClick={handleUnlockAudio}
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center cursor-pointer"
          >
              <div className="text-8xl mb-6 animate-bounce">👆</div>
              <h1 className="text-4xl font-black text-white mb-2">CHẠM ĐỂ KÍCH HOẠT ÂM THANH</h1>
              <p className="text-slate-400">Trình duyệt đang chặn tự động phát. Vui lòng chạm vào màn hình.</p>
          </div>
      );
  }

  return <>{children}</>;
}
