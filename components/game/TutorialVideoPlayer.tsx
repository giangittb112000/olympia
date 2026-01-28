"use client";
import { useEffect, useState, useRef } from "react";
import { useSocketContext } from "@/components/providers/SocketProvider";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialVideoPlayerProps {
    role: string;
}

export default function TutorialVideoPlayer({ role }: TutorialVideoPlayerProps) {
  const { socket } = useSocketContext();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for video events
    // We restrict this mainly to Monitor/Guest, but check role if needed
    if (role !== "monitor" && role !== "guest") return;

    const handlePlay = (data: { url: string }) => {
       console.log("[VideoPlayer] Playing:", data.url);
       setVideoUrl(data.url);
    };

    const handleStop = () => {
       setVideoUrl(null);
    };

    socket.on("play_tutorial_video", handlePlay);
    socket.on("stop_tutorial_video", handleStop);

    return () => {
      socket.off("play_tutorial_video", handlePlay);
      socket.off("stop_tutorial_video", handleStop);
    };
  }, [socket, role]);

  return (
    <AnimatePresence>
      {videoUrl && (
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
        >
           <video 
              ref={videoRef}
              src={videoUrl} 
              className="w-full h-full object-contain"
              autoPlay
              onEnded={() => setVideoUrl(null)}
           />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
