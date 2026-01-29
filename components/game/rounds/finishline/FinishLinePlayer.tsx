"use client";
import { useState, useEffect } from "react";
import { useSocketContext } from "@/components/providers/SocketProvider";
import { useCurrentPlayer } from "@/hooks/useCurrentPlayer";
import GameRoundContainer from "../../GameRoundContainer";
import { FinishLineState } from "@/server/game/GameConstants";
import { motion, AnimatePresence } from "framer-motion";
import { Star, SendHorizontal } from "lucide-react";
import ResultOverlay from "./ResultOverlay";
import MiniRankingBoard from "@/components/game/MiniRankingBoard";
import { Toast, ToastType } from "@/components/ui/Toast";
import { ConfirmModal, ConfirmModalProps } from "@/components/ui/ConfirmModal";
interface FinishLinePlayerProps {
  finishLine: FinishLineState;
}

export default function FinishLinePlayer({ finishLine }: FinishLinePlayerProps) {
  return <FinishLinePlayerContent finishLine={finishLine} />;
}

function FinishLinePlayerContent({ finishLine }: FinishLinePlayerProps) {
  const { socket } = useSocketContext();
  const playerId = useCurrentPlayer(); // ✅ Returns string | null from localStorage
  const [resultOverlay, setResultOverlay] = useState<{
    show: boolean;
    type: "correct" | "wrong" | "steal_success" | "steal_fail";
    points?: number;
  }>({ show: false, type: "correct" });

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<Omit<ConfirmModalProps, 'onCancel'>>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Listen for result events
  useEffect(() => {
    const handleAnswerResult = (data: {
      playerId: string;
      isCorrect: boolean;
      pointsEarned: number;
    }) => {
      if (data.playerId === playerId) {
        setResultOverlay({
          show: true,
          type: data.isCorrect ? "correct" : "wrong",
          points: Math.abs(data.pointsEarned),
        });
      }
    };

    const handleStealResult = (data: {
      stealerId: string;
      isCorrect: boolean;
      stealerPointsChange: number;
    }) => {
      if (data.stealerId === playerId) {
        setResultOverlay({
          show: true,
          type: data.isCorrect ? "steal_success" : "steal_fail",
          points: Math.abs(data.stealerPointsChange),
        });
      }
    };

    const handleError = (data: { message: string }) => {
        setToast({ message: `LỖI: ${data.message}`, type: 'error' });
    };

    socket?.on("finishline_answer_result", handleAnswerResult);
    socket?.on("finishline_steal_result", handleStealResult);
    socket?.on("error", handleError);

    return () => {
      socket?.off("finishline_answer_result", handleAnswerResult);
      socket?.off("finishline_steal_result", handleStealResult);
      socket?.off("error", handleError);
    };
  }, [socket, playerId]);

  // IDLE or FINISHED state
  if (finishLine.status === "IDLE" || finishLine.status === "FINISHED") {
    return (
      <GameRoundContainer>
        <MiniRankingBoard />
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>

        <ConfirmModal 
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          type={confirmConfig.type}
        />
        <div className="flex flex-col items-center justify-center h-full gap-6 pt-16">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <h1 className="text-6xl font-black text-purple-400 text-center">
              🏁
            </h1>
            <h2 className="text-4xl font-black text-white text-center mt-4">
              VÒNG VỀ ĐÍCH
            </h2>
          </motion.div>
          <p className="text-slate-400 text-lg text-center">
            {finishLine.status === "IDLE"
              ? "Chờ MC bắt đầu vòng thi..."
              : "Vòng thi đã kết thúc!"}
          </p>
        </div>
      </GameRoundContainer>
    );
  }

  // PACK_SELECTION state
  if (finishLine.status === "PACK_SELECTION") {
    const canSelect = finishLine.selectedPlayerId === playerId;

    return (
      <GameRoundContainer className="p-4 md:p-8 pt-16">
        <MiniRankingBoard />
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-purple-400 mb-2">
             📦 CHỌN GÓI CÂU HỎI
          </h1>
          {canSelect ? (
            <p className="text-xl text-green-400 font-bold">
              ✨ Đến lượt bạn chọn gói!
            </p>
          ) : (
            <p className="text-slate-400">
              Chờ {finishLine.selectedPlayerName || "player khác"} chọn gói...
            </p>
          )}
        </div>

        {/* Pack Cards */}
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">
                ⏳ Vui lòng đợi MC chọn gói câu hỏi...
            </h2>
            <p className="text-slate-400">Bạn hãy thông báo lựa chọn của mình cho MC</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto opacity-80 pointer-events-none grayscale">
          {[
            {
              type: 40 as const,
              emoji: "📗",
              color: "from-green-600 to-emerald-700",
              structure: "2×10đ + 1×20đ",
            },
            {
              type: 60 as const,
              emoji: "📘",
              color: "from-blue-600 to-cyan-700",
              structure: "3×10đ + 1×20đ + 1×30đ",
            },
            {
              type: 80 as const,
              emoji: "📕",
              color: "from-red-600 to-rose-700",
              structure: "1×20đ + 2×30đ",
            },
          ].map((pack) => {
            const remaining =
              finishLine.availablePacks?.find((p) => p.packType === pack.type)
                ?.count || 0;

            const isDisabled = remaining === 0;
           
            return (
              <div
                key={pack.type}
                className={`relative p-8 rounded-2xl border-4 transition-all ${
                  isDisabled
                    ? "border-slate-700 bg-slate-800/30 opacity-50"
                    : "border-slate-500 bg-slate-800"
                }`}
              >
                {/* Badge */}
                <div className="absolute -top-3 -right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Còn {remaining}
                </div>

                {/* Emoji */}
                <div className="text-7xl mb-4">{pack.emoji}</div>

                {/* Type */}
                <div
                  className={`text-5xl font-black mb-2 bg-gradient-to-r ${pack.color} bg-clip-text text-transparent`}
                >
                  {pack.type} ĐIỂM
                </div>

                {/* Structure */}
                <p className="text-slate-300 text-sm mb-4">{pack.structure}</p>

                {remaining === 0 && (
                  <div className="bg-slate-700 text-slate-400 py-2 px-4 rounded-lg">
                    HẾT GÓI
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Available Packs Info */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            💡 Mỗi gói có cấu trúc câu hỏi khác nhau. Chọn gói phù hợp với điểm
            hiện tại của bạn!
          </p>
        </div>
      </GameRoundContainer>
    );
  }

  // STAR_SELECTION state
  if (finishLine.status === "STAR_SELECTION") {
      const canSelect = finishLine.selectedPlayerId === playerId; // Should match
      
      return (
          <GameRoundContainer className="p-4 md:p-8 pt-16 flex items-center justify-center">
             <MiniRankingBoard />
             <AnimatePresence>
                {toast && (
                    <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            <ConfirmModal 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                type={confirmConfig.type}
            />
             
             {canSelect ? (
                 <div className="bg-slate-900/80 backdrop-blur-md border-4 border-amber-500 rounded-3xl p-8 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden">
                     {/* Bkg Effect */}
                     <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-amber-900/20 animate-pulse pointer-events-none" />
                     
                     <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-8xl mb-6 relative z-10"
                     >
                         ⭐
                     </motion.div>
                     
                     <h2 className="text-3xl font-black text-white mb-2 relative z-10">NGÔI SAO HY VỌNG</h2>
                     <p className="text-slate-300 mb-8 relative z-10">Bạn có muốn đặt Ngôi sao hy vọng cho câu hỏi này không?</p>
                     
                     <div className="grid grid-cols-2 gap-6 relative z-10">
                          <button
                            onClick={() => {
                                setConfirmConfig({
                                    isOpen: true,
                                    title: 'Xác nhận',
                                    message: 'Bạn chắc chắn KHÔNG dùng ngôi sao?',
                                    onConfirm: () => socket?.emit('player_finishline_confirm_star', { useStar: false }),
                                    type: 'warning'
                                });
                            }}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-6 rounded-2xl text-xl transition-all active:scale-95"
                         >
                             KHÔNG DÙNG
                         </button>
                         
                         <button
                            onClick={() => {
                                setConfirmConfig({
                                    isOpen: true,
                                    title: 'Ngôi sao hy vọng',
                                    message: 'Xác nhận DÙNG Ngôi sao hy vọng? (Chỉ được dùng 1 lần)',
                                    onConfirm: () => socket?.emit('player_finishline_confirm_star', { useStar: true }),
                                    type: 'success'
                                });
                            }}
                            className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black font-black py-6 rounded-2xl text-xl shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all active:scale-95 flex flex-col items-center justify-center"
                         >
                             <span>DÙNG NGÔI SAO</span>
                             <span className="text-sm font-normal opacity-80">Nhân đôi điểm số</span>
                         </button>
                     </div>
                 </div>
             ) : (
                 <div className="text-center">
                     <div className="text-6xl mb-4 animate-bounce">⭐</div>
                     <h2 className="text-2xl font-bold text-slate-400">Đang chờ thí sinh chọn Ngôi Sao Hy Vọng...</h2>
                 </div>
             )}
          </GameRoundContainer>
      );
  }

  // PLAYING_QUESTION state
  if (finishLine.status === "PLAYING_QUESTION" && finishLine.currentPack) {
    const currentQ =
      finishLine.currentPack.questions[finishLine.currentQuestionIndex];
    const isMyPack = finishLine.currentPack.ownerId === playerId;

    return (
      <GameRoundContainer className="p-3 md:p-4 pt-16">
        <MiniRankingBoard />
        <AnimatePresence>
            {toast && (
                <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
                />
            )}
        </AnimatePresence>

        <ConfirmModal 
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            type={confirmConfig.type}
        />
        
        {/* Decorative Background Elements */}
        <ResultOverlay
          show={resultOverlay.show}
          type={resultOverlay.type}
          points={resultOverlay.points}
          onClose={() => setResultOverlay({ show: false, type: "correct" })}
        />

        <div className="flex flex-col gap-3">
          {/* Compact Header */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🏁 {finishLine.currentPack.packType}đ
              </h1>
              <p className="text-sm text-slate-400">
                {isMyPack ? "✨ Của bạn" : finishLine.currentPack.ownerName}
              </p>
            </div>
            <div className="text-right flex items-center gap-3">
              <div className="text-xs text-slate-400">
                Q{finishLine.currentQuestionIndex + 1}/{finishLine.currentPack.questions.length}
              </div>
              <div className={`text-2xl md:text-3xl font-mono font-black ${
                finishLine.timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-white"
              }`}>
                {finishLine.timeLeft}s
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={finishLine.currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-3 h-[calc(100vh-140px)] overflow-y-auto"
          >
            {/* Question Card - Compact */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/50 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
                  {currentQ.points} ĐIỂM
                </span>
                {currentQ.starActivated && (
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold rounded-full flex items-center gap-1 animate-pulse shadow-lg">
                    <Star size={12} fill="currentColor" /> x2
                  </span>
                )}
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white leading-tight">
                {currentQ.questionText}
              </h2>
              {currentQ.questionDescription && (
                <p className="text-slate-300 text-xs md:text-sm mt-2 italic">
                  💡 {currentQ.questionDescription}
                </p>
              )}
            </div>

            {/* Media - Compact if exists */}
            {currentQ.mediaUrl && (
              <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-xl min-h-0">
                {currentQ.mediaType === "IMAGE" && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentQ.mediaUrl}
                    alt="Question media"
                    className="w-full h-full object-contain"
                  />
                )}
                {currentQ.mediaType === "VIDEO" && (
                    <video 
                        src={currentQ.mediaUrl} 
                        autoPlay 
                        className="w-full h-full"
                        onEnded={() => {
                            console.log("Video ended, notifying server...");
                            socket?.emit('client_finishline_video_ended');
                        }}
                        // Disable controls to prevent skipping
                        controls={false}
                    />
                )}
                {currentQ.mediaType === "AUDIO" && (
                  <div className="flex items-center justify-center h-full p-4">
                    <audio
                      src={currentQ.mediaUrl}
                      controls
                      className="w-full max-w-md"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Answer Input or Buzzer - Compact */}
            <div className="flex-shrink-0">
              {isMyPack ? (
                <AnswerInput 
                  currentQ={currentQ} 
                  playerId={playerId} 
                  isTimerRunning={finishLine.isTimerRunning} 
                  setToast={setToast}
                  setConfirmConfig={setConfirmConfig}
                />
              ) : finishLine.selectedStealerId === playerId ? (
                <StealAnswerInput 
                  playerId={playerId} 
                  setToast={setToast}
                  setConfirmConfig={setConfirmConfig}
                />
              ) : (
                <BuzzerButton
                  questionId={currentQ.questionId}
                  playerId={playerId}
                  buzzerEnabled={finishLine.buzzerEnabled}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </GameRoundContainer>
    );
  }

  return (
    <GameRoundContainer>
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400 text-lg">Loading...</p>
      </div>
    </GameRoundContainer>
  );
}

// ========================
// Answer Input Component
// ========================

interface AnswerInputProps {
  currentQ: {
    questionId: string;
    answer?: {
      answerText: string;
    } | null;
  };
  playerId: string | null;
  isTimerRunning?: boolean;
  setToast: (val: { message: string; type: ToastType } | null) => void;
  setConfirmConfig: (val: Omit<ConfirmModalProps, 'onCancel'>) => void;
}

function AnswerInput({ currentQ, playerId, isTimerRunning = false, setToast, setConfirmConfig }: AnswerInputProps) {
  const { socket } = useSocketContext();
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim() || !playerId) {
      setToast({ message: "Vui lòng nhập đáp án!", type: 'error' });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Gửi đáp án',
      message: `Gửi đáp án: "${answer}"?`,
      onConfirm: () => {
        socket?.emit("player_finishline_answer", {
          playerId, // ✅ Send string playerId
          answerText: answer.trim(),
        });
        setSubmitted(true);
      },
      type: 'info'
    });
  };

  // Reset when question changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setAnswer("");
    setSubmitted(false);
  }, [currentQ.questionId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (currentQ.answer || submitted) {
    return (
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="text-center">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-slate-300 text-sm">
            Đã gửi đáp án. Đợi MC xác nhận...
          </p>
          {currentQ.answer && (
            <div className="mt-3 bg-slate-900 rounded-lg p-3">
              <p className="text-lg font-bold text-white">
                &ldquo;{currentQ.answer.answerText}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Timer Constraint Check
  if (!isTimerRunning) {
      return (
        <div className="bg-slate-800 border-2 border-slate-700 rounded-xl p-4 opacity-75">
          <h3 className="text-sm font-bold text-slate-400 mb-2 text-center">
            🔒 CHỜ BẮT ĐẦU TÍNH GIỜ
          </h3>
          <p className="text-center text-slate-500 text-xs">
            Bạn sẽ có thể nhập đáp án khi thời gian bắt đầu chạy.
          </p>
        </div>
      );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500 rounded-xl p-4 shadow-xl">
      <h3 className="text-sm font-bold text-purple-400 mb-3 text-center">
        ✏️ NHẬP ĐÁP ÁN
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Nhập đáp án..."
          className="flex-1 px-4 py-3 bg-slate-900 border-2 border-slate-700 focus:border-purple-400 rounded-lg text-white text-lg font-bold placeholder:text-slate-600 focus:outline-none transition-colors"
          autoFocus={isTimerRunning}
        />
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all active:scale-95"
        >
          <SendHorizontal size={20} />
        </button>
      </div>
      <p className="text-slate-400 text-xs text-center mt-2">
        💡 Nhấn Enter để gửi nhanh
      </p>
    </div>
  );
}

// ========================
// Buzzer Button Component
// ========================

interface BuzzerButtonProps {
  questionId: string;
  playerId: string | null;
  buzzerEnabled: boolean;
}

function BuzzerButton({
  questionId,
  playerId,
  buzzerEnabled,
}: BuzzerButtonProps) {
  const { socket } = useSocketContext();
  const [buzzed, setBuzzed] = useState(false);
  const [buzzPosition, setBuzzPosition] = useState<number | null>(null);

  const handleBuzz = () => {
    if (!buzzerEnabled || buzzed || !playerId) return;

    socket?.emit("player_finishline_buzz", { playerId });
    setBuzzed(true);
  };

  // Reset when question changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setBuzzed(false);
    setBuzzPosition(null);
  }, [questionId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Listen for buzz confirmation
  useEffect(() => {
    const handleBuzzRegistered = (data: {
      playerId: string;
      position: number;
    }) => {
      if (data.playerId === playerId) {
        setBuzzPosition(data.position);
      }
    };

    socket?.on("finishline_buzz_registered", handleBuzzRegistered);

    return () => {
      socket?.off("finishline_buzz_registered", handleBuzzRegistered);
    };
  }, [socket, playerId]);

  if (!buzzerEnabled) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="text-center text-slate-500">
          <div className="text-4xl mb-2 opacity-30">🔔</div>
          <p className="text-sm">Buzzer chưa được kích hoạt</p>
        </div>
      </div>
    );
  }

  if (buzzed && buzzPosition !== null) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 shadow-2xl"
      >
        <div className="text-center text-white">
          <div className="text-5xl mb-3">
            {buzzPosition === 1
              ? "🥇"
              : buzzPosition === 2
              ? "🥈"
              : buzzPosition === 3
              ? "🥉"
              : `#${buzzPosition}`}
          </div>
          <h2 className="text-2xl font-black mb-2">ĐÃ BẤM CHUÔNG!</h2>
          <p className="text-lg">
            Vị trí: <span className="font-black">#{buzzPosition}</span>
          </p>
          <p className="text-xs mt-3 opacity-80">
            Chờ MC chọn người trả lời...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={handleBuzz}
      disabled={buzzed}
      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:from-slate-700 disabled:to-slate-600 text-white rounded-xl p-8 shadow-2xl transition-all"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-6xl mb-3"
        >
          🔔
        </motion.div>
        <h2 className="text-3xl font-black mb-2">BẤM CHUÔNG</h2>
        <p className="text-lg opacity-90">Nhanh tay cướp điểm!</p>
      </div>
    </motion.button>
  );
}

// ==========================
// Steal Answer Input Component
// ==========================

interface StealAnswerInputProps {
  playerId: string | null;
  setToast: (val: { message: string; type: ToastType } | null) => void;
  setConfirmConfig: (val: Omit<ConfirmModalProps, 'onCancel'>) => void;
}

function StealAnswerInput({ playerId, setToast, setConfirmConfig }: StealAnswerInputProps) {
  const { socket } = useSocketContext();
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim() || !playerId) {
      setToast({ message: "Vui lòng nhập đáp án!", type: 'error' });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận cướp điểm',
      message: `Gửi đáp án cướp điểm: "${answer}"?`,
      onConfirm: () => {
        socket?.emit("player_finishline_steal_answer", {
          playerId,
          answerText: answer.trim(),
        });
        setSubmitted(true);
      },
      type: 'warning'
    });
  };

  if (submitted) {
    return (
      <div className="bg-orange-900/30 border-2 border-orange-500 rounded-xl p-5">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-white text-lg font-bold">Đã gửi đáp án cướp điểm!</p>
          <p className="text-slate-300 mt-2 text-sm">Đợi MC xác nhận kết quả...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-2 border-orange-500 rounded-xl p-4 shadow-xl">
      <div className="text-center mb-3">
        <h3 className="text-lg font-black text-orange-400 mb-1">🎯 LƯỢT CỦA BẠN!</h3>
        <p className="text-white text-sm">Nhập đáp án để cướp điểm</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Nhập đáp án..."
          className="flex-1 px-4 py-3 bg-slate-900 border border-orange-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg font-semibold"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          className="px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg flex items-center gap-2 transition-colors active:scale-95"
        >
          <SendHorizontal size={18} />
          Gửi
        </button>
      </div>
    </div>
  );
}
