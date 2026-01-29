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

  const handleUnlockAudio = async () => {
      try {
          // 1. Resume Context if exists
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContext();
          await ctx.resume();

          // 2. Play a distinct silent buffer to engage audio engine
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          
          // Legacy safe start
          if (source.start) {
            source.start(0);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (source as any).noteOn(0);
          }

          // 3. Briefly unmute any potential video/audio elements if needed
          // But usually, the interaction above is enough. 
          // We specifically avoid the faulty "new Audio(base64)" which caused the NotSupportedError
          
      } catch (e) {
          console.error("Audio unlock attempt failed", e);
      } finally {
          setAudioAccepted(true);
      }
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
