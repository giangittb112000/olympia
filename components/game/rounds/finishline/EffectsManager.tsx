"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { FinishLineState } from "@/server/game/GameConstants";

interface EffectsManagerProps {
  finishLineState: FinishLineState;
}

export default function EffectsManager({
  finishLineState,
}: EffectsManagerProps) {
  // Confetti on correct answer
  useEffect(() => {
    const currentQ =
      finishLineState.currentPack?.questions?.[
        finishLineState.currentQuestionIndex
      ];

    if (currentQ?.answer && currentQ?.answer?.isCorrect) {
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FFD700", "#FFA500", "#FF4500"],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FFD700", "#FFA500", "#FF4500"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [finishLineState.currentQuestionIndex, finishLineState.currentPack?.questions]); 

  // Star glow effect
  useEffect(() => {
    const currentQ = finishLineState.currentPack?.questions?.[finishLineState.currentQuestionIndex];

    if (currentQ?.starActivated) {
      document.body.classList.add("star-glow");
    } else {
      document.body.classList.remove("star-glow");
    }

    return () => {
      document.body.classList.remove("star-glow");
    };
  }, [finishLineState.currentPack?.questions, finishLineState.currentQuestionIndex]);

  return null;
}
