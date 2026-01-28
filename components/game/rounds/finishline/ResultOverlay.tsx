"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface ResultOverlayProps {
  show: boolean;
  type: "correct" | "wrong" | "steal_success" | "steal_fail";
  points?: number;
  onClose: () => void;
}

export default function ResultOverlay({
  show,
  type,
  points,
  onClose,
}: ResultOverlayProps) {
  // Trigger confetti on success
  useEffect(() => {
    if (show && (type === "correct" || type === "steal_success")) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FF6347"],
      });
    }
  }, [show, type]);

  // Auto-close after 3 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const config = {
    correct: {
      bg: "from-green-600 to-emerald-700",
      icon: "✅",
      title: "CHÍNH XÁC!",
      subtitle: `+${points} ĐIỂM`,
    },
    wrong: {
      bg: "from-red-600 to-rose-700",
      icon: "❌",
      title: "SAI RỒI!",
      subtitle: points ? `-${Math.abs(points)} ĐIỂM` : "",
    },
    steal_success: {
      bg: "from-amber-600 to-orange-700",
      icon: "🏆",
      title: "CƯỚP THÀNH CÔNG!",
      subtitle: `+${points} ĐIỂM`,
    },
    steal_fail: {
      bg: "from-red-700 to-rose-800",
      icon: "💥",
      title: "CƯỚP THẤT BẠI!",
      subtitle: `-${Math.abs(points || 0)} ĐIỂM`,
    },
  }[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", duration: 0.6 }}
            className={`bg-gradient-to-br ${config.bg} rounded-2xl p-6 shadow-2xl text-center max-w-sm`}
          >
            <div className="text-6xl mb-4">{config.icon}</div>
            <h1 className="text-3xl font-black text-white mb-2">
              {config.title}
            </h1>
            {config.subtitle && (
              <p className="text-xl font-bold text-white/90">
                {config.subtitle}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
