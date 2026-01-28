"use client";
import { useSocketContext } from "@/components/providers/SocketProvider";
import { usePlayers } from "@/hooks/usePlayers";
import GameRoundContainer from "../../GameRoundContainer";
import { ArrowLeft, RotateCcw, Play, Star, Bell, SkipForward } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Toast, ToastType } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Finish Line State Interface
interface FinishLineState {
  status: "IDLE" | "PACK_SELECTION" | "PLAYING_QUESTION" | "FINISHED" | "STAR_SELECTION";
  selectedPlayerId?: string;
  selectedPlayerName?: string;
  availablePacks?: Array<{ packType: 40 | 60 | 80; count: number }>;
  currentPack?: {
    packId: string;
    packType: 40 | 60 | 80;
    ownerId: string;
    ownerName: string;
    questions: Array<{
      questionId: string;
      questionText: string;
      questionDescription?: string;
      mediaType?: "VIDEO" | "IMAGE" | "AUDIO";
      mediaUrl?: string;
      referenceAnswer: string;
      points: 10 | 20 | 30;
      answer?: {
        playerId: string;
        playerName: string;
        answerText: string;
        submittedAt: number;
        isCorrect: boolean;
        pointsEarned: number;
      } | null;
      starActivated?: boolean;
      stealAttempts?: Array<{
        playerId: string;
        playerName: string;
        answerText: string;
        isCorrect: boolean;
        pointsEarned: number;
        timestamp: number;
      }>;
    }>;
  };
  currentQuestionIndex: number;
  isTimerRunning: boolean;
  timeLeft: number;
  buzzerEnabled: boolean;
  buzzerQueue: Array<{
    playerId: string;
    playerName: string;
    buzzTime: number;
  }>;
  selectedStealerId?: string;
  finishedPlayerIds?: string[];
  bankId?: string;
}

interface FinishLineMCProps {
  finishLine: FinishLineState;
}

export default function FinishLineMC({ finishLine }: FinishLineMCProps) {
  const { socket } = useSocketContext();
  const { players } = usePlayers();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [judgedWrong, setJudgedWrong] = useState(false);
  const [localStealAttempt, setLocalStealAttempt] = useState<{
    answerText: string;
    playerName: string;
    playerId: string;
  } | null>(null);

  // Reset state when question changes
  useEffect(() => {
    if (judgedWrong) setJudgedWrong(false);
    setLocalStealAttempt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishLine.currentQuestionIndex, finishLine.currentPack?.packId]);

  // Listen for real-time steal updates (patch for prop lag)
  useEffect(() => {
    if (!socket) return;

    const handleStealReview = (data: { playerId: string; playerName: string; answerText: string }) => {
      console.log("MC received steal answer:", data);
      if (data.playerId === finishLine.selectedStealerId) {
        setLocalStealAttempt({
          playerId: data.playerId,
          playerName: data.playerName,
          answerText: data.answerText,
        });
      }
    };

    socket.on("finishline_steal_needs_review", handleStealReview);
    return () => {
      socket.off("finishline_steal_needs_review", handleStealReview);
    };
  }, [socket, finishLine.selectedStealerId]);

  // Error Handler
  const handleError = (data: { message: string }) => {
      setToast({ message: data.message, type: "error" });
  };
   
  useEffect(() => {
     socket?.on("error", handleError);
     return () => { socket?.off("error", handleError); };
  }, [socket]);

  const handleJudgeCorrect = () => {
    socket?.emit("mc_finishline_judge_answer", { correct: true });
    // Auto next question after 3 seconds to show result
    setTimeout(() => {
      socket?.emit("mc_finishline_next_question");
    }, 3000);
  };

  const handleJudgeWrong = () => {
    socket?.emit("mc_finishline_judge_answer", { correct: false });
    setJudgedWrong(true);
  };

  const handleReset = () => {
    if (confirm("⚠️ Reset vòng Về Đích? (Không xóa Question Bank)")) {
      socket?.emit("mc_finishline_reset", { keepBank: true });
      setToast({ message: "✅ Đã reset vòng Về Đích!", type: "success" });
    }
  };

  const handleSelectPlayer = (playerId: string) => {
    const player = players?.find((p) => p._id === playerId);
    if (!player) return;

    socket?.emit("mc_finishline_select_player", { playerId });
    setToast({ message: `✅ Đã chọn ${player.name}`, type: "success" });
  };

  const handleToggleStar = () => {
    const currentQ = finishLine.currentPack?.questions[finishLine.currentQuestionIndex];
    if (!currentQ) return;

    socket?.emit("mc_finishline_toggle_star", { enabled: !currentQ.starActivated });
  };

  const handleStartTimer = () => {
    socket?.emit("mc_finishline_start_timer", { duration: 30 });
  };

  const handleEnableBuzzer = () => {
    socket?.emit("mc_finishline_enable_buzzer");
    setToast({ message: "🔔 Đã kích hoạt buzzer!", type: "success" });
  };

  const handleNextQuestion = () => {
    socket?.emit("mc_finishline_next_question");
  };

  const handleSelectStealer = (playerId: string) => {
    socket?.emit("mc_finishline_select_stealer", { playerId });
    setToast({ message: "✅ Đã chọn người cướp điểm!", type: "success" });
  };

  // IDLE state
  if (finishLine.status === "IDLE") {
    return (
      <GameRoundContainer>
        <div className="absolute top-6 left-6">
          <button
            onClick={() => socket?.emit("mc_set_phase", "IDLE")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 font-bold shadow-lg"
          >
            <ArrowLeft size={20} /> Quay lại Dashboard
          </button>
        </div>

        <div className="flex flex-col items-center justify-center h-full gap-6">
          <h1 className="text-5xl font-black text-purple-400">🏁 VÒNG VỀ ĐÍCH</h1>
          <p className="text-slate-400 text-lg">
            Chuẩn bị sẵn sàng để bắt đầu vòng thi cuối cùng
          </p>
          <div className="bg-amber-900/20 border border-amber-500 rounded-lg p-4 max-w-md">
            <p className="text-amber-400 text-sm text-center">
              ⚠️ Đảm bảo đã tạo Question Bank trước khi bắt đầu!
            </p>
          </div>
          <button
            onClick={() => {
              socket?.emit("mc_finishline_start_round");
              setToast({ message: "✅ Đã bắt đầu vòng Về Đích!", type: "success" });
            }}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
          >
            <Play className="inline mr-2" size={24} />
            BẮT ĐẦU VÒNG THI
          </button>
        </div>
      </GameRoundContainer>
    );
  }

  // PACK_SELECTION state
  if (finishLine.status === "PACK_SELECTION") {
    return (
      <GameRoundContainer className="p-6">
        <AnimatePresence>
          {toast && (
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-purple-400">🏁 VỀ ĐÍCH - CHỌN GÓI</h1>
            <p className="text-slate-400">
              Chọn player để chơi gói tiếp theo
              {finishLine.selectedPlayerName && (
                <span className="text-white font-bold ml-2">
                  → {finishLine.selectedPlayerName}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => socket?.emit("mc_set_phase", "IDLE")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2 border border-slate-700"
            >
              <ArrowLeft size={16} /> Dashboard
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>

        {/* Available Packs Display */}
        <div className="mb-6 bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">📦 GÓI CÒN LẠI:</h2>
          <div className="grid grid-cols-3 gap-4">
            {finishLine.availablePacks?.map((pack) => (
              <div
                key={pack.packType}
                className={`rounded-lg p-4 text-center border-2 transition-all ${
                  pack.count > 0
                    ? "bg-slate-900 border-purple-500"
                    : "bg-slate-900/50 border-slate-700 opacity-50"
                }`}
              >
                <div className="text-3xl font-black text-purple-400">{pack.packType}đ</div>
                <div className="text-slate-400 text-sm mt-2">
                  Còn: <span className="text-white font-bold">{pack.count}</span> gói
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Selection */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">👥 CHỌN PLAYER:</h2>
          <div className="grid grid-cols-2 gap-4">
            {players?.map((player) => {
              const isFinished = (finishLine.finishedPlayerIds || []).includes(player._id);
              const isSelected = finishLine.selectedPlayerId === player._id;

              return (
                <button
                  key={player._id}
                  onClick={() => !isFinished && handleSelectPlayer(player._id)}
                  disabled={isFinished}
                  className={`p-4 border-2 rounded-xl text-left transition-all group relative overflow-hidden ${
                    isSelected
                      ? "bg-purple-600 border-purple-400"
                      : isFinished
                      ? "bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed grayscale"
                      : "bg-slate-900 border-slate-700 hover:bg-purple-600 hover:border-purple-400"
                  }`}
                >
                  {isFinished && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                      <span className="text-green-500 font-bold border-2 border-green-500 px-3 py-1 rounded rotate-12 uppercase text-sm">
                        ĐÃ THI XONG
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl font-bold text-white">{player.name}</p>
                      <p className="text-slate-400 text-sm">
                        Điểm:{" "}
                        <span className="text-purple-400 font-bold">
                          {player.scores?.total || 0}
                        </span>
                      </p>
                    </div>
                    {!isFinished && (
                      <div className="text-3xl group-hover:scale-125 transition-transform">
                        👉
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </GameRoundContainer>
    );
  }

  // PLAYING_QUESTION state
  if (finishLine.status === "PLAYING_QUESTION" && finishLine.currentPack) {
    const currentQ = finishLine.currentPack.questions[finishLine.currentQuestionIndex];

    return (
      <GameRoundContainer className="p-4">
        <AnimatePresence>
          {toast && (
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          )}
        </AnimatePresence>

        {/* Compact Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🏁 {finishLine.currentPack.packType}đ - Q{finishLine.currentQuestionIndex + 1}/{finishLine.currentPack.questions.length}
            </h1>
            {currentQ.starActivated && (
              <div className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-sm font-bold rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
                <Star size={14} fill="currentColor" />
                STAR
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Player:</span>
            <span className="text-white font-bold">{finishLine.currentPack.ownerName}</span>
            <button
              onClick={handleReset}
              className="ml-2 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3 h-[calc(100vh-140px)]">
          {/* Left: Media + Question */}
          <div className="col-span-5 flex flex-col gap-3 overflow-y-auto pr-2">
            {/* Question Text - Compact */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-purple-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
                  {currentQ.points} ĐIỂM
                </span>
              </div>
              <p className="text-xl font-bold text-white leading-tight mb-2">{currentQ.questionText}</p>
              {currentQ.questionDescription && (
                <p className="text-slate-300 text-sm italic mb-3">💡 {currentQ.questionDescription}</p>
              )}
              <div className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-2.5">
                <p className="text-amber-400 text-xs">
                  <strong>Đáp án:</strong> {currentQ.referenceAnswer}
                </p>
              </div>
            </div>

            {/* Media - If exists */}
            {currentQ.mediaUrl && (
              <div className="bg-slate-800 rounded-xl p-3 flex-1 min-h-0">
                <div className="bg-black rounded-lg overflow-hidden h-full">
                  {currentQ.mediaType === "IMAGE" && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={currentQ.mediaUrl}
                      alt="Question media"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {currentQ.mediaType === "VIDEO" && (
                    <video src={currentQ.mediaUrl} controls className="w-full h-full" />
                  )}
                  {currentQ.mediaType === "AUDIO" && (
                    <div className="flex items-center justify-center h-full">
                      <audio src={currentQ.mediaUrl} controls className="w-full" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls - Compact */}
          <div className="col-span-7 flex flex-col gap-3 overflow-y-auto pr-2">
            {/* Star + Timer Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Star Toggle - Compact */}
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <span className="text-sm font-bold text-white">Ngôi Sao</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${
                      currentQ.starActivated
                        ? "bg-yellow-500 text-black shadow-lg"
                        : "bg-slate-700 text-slate-500"
                    }`}>
                    {currentQ.starActivated ? "BẬT" : "TẮT"}
                  </div>
                </div>
                <p className="text-xs text-slate-400">Đúng: x2 | Sai: -gốc</p>
              </div>

              {/* Timer - Compact */}
              <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400 font-semibold">Thời gian</span>
                  <span
                    className={`text-2xl font-mono font-black ${
                      finishLine.timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-white"
                    }`}>
                    {finishLine.timeLeft}s
                  </span>
                </div>
                {!finishLine.isTimerRunning && !currentQ.answer && (
                  <button
                    onClick={handleStartTimer}
                    className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                    <Play size={14} /> START
                  </button>
                )}
              </div>
            </div>

            {/* Answer Display & Judge Controls */}
            {currentQ.answer ? (
              <div className="bg-slate-800 rounded-xl p-6 border-2 border-slate-600">
                <h3 className="text-sm text-slate-400 mb-3 uppercase">
                  Câu trả lời của {currentQ.answer.playerName}
                </h3>
                
                {/* Answer Text */}
                <div className="bg-slate-900 rounded-lg p-5 mb-6 text-center shadow-inner">
                  <p className="text-3xl font-black text-white">
                    &ldquo;{currentQ.answer.answerText}&rdquo;
                  </p>
                </div>

                {/* Judge Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleJudgeCorrect}
                    className={`py-4 rounded-xl font-bold text-xl flex flex-col items-center justify-center transition-all ${
                      currentQ.answer.isCorrect
                        ? "bg-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.5)] scale-105"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
                    }`}
                  >
                    <span className="text-3xl mb-1">✅</span>
                    ĐÚNG
                    {currentQ.answer.isCorrect && <span className="text-xs mt-1">+{currentQ.answer.pointsEarned} điểm</span>}
                    {currentQ.answer.isCorrect && <span className="text-[10px] mt-1 text-slate-200">(Auto-next in 3s)</span>}
                  </button>

                  <button
                    onClick={handleJudgeWrong}
                    className={`py-4 rounded-xl font-bold text-xl flex flex-col items-center justify-center transition-all ${
                      judgedWrong || (!currentQ.answer.isCorrect && currentQ.answer.pointsEarned !== undefined && currentQ.answer.pointsEarned !== 0)
                        ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] scale-105"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
                    }`}
                  >
                     <span className="text-3xl mb-1">❌</span>
                     SAI
                     {!currentQ.answer.isCorrect && <span className="text-xs mt-1">Mở Buzzer?</span>}
                  </button>
                </div>

                {/* Steal Prompt (Only if Judged Wrong) */}
                {(!currentQ.answer.isCorrect && judgedWrong) && (
                   <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-center text-slate-400 mb-2 text-sm">Đã xác nhận SAI. Mở Buzzer cho các thí sinh khác:</p>
                      {!finishLine.buzzerEnabled ? (
                        <button
                          onClick={handleEnableBuzzer}
                          className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 animate-pulse shadow-lg"
                        >
                          <Bell size={20} /> KÍCH HOẠT BUZZER
                        </button>
                      ) : (
                         <div className="text-center text-orange-400 font-bold border border-orange-500 rounded-lg p-2 bg-orange-900/20">
                            🔔 BUZZER ĐANG MỞ
                         </div>
                      )}
                   </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl p-6 h-full flex flex-col items-center justify-center opacity-50">
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-slate-400 font-bold">Đang chờ câu trả lời...</p>
              </div>
            )}

            {/* Steal Answer Judge Controls */}
            {finishLine.selectedStealerId && (
              <div className="bg-orange-900/20 border-2 border-orange-500 rounded-xl p-6 mb-4 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-sm text-orange-400 mb-3 uppercase font-bold flex items-center gap-2">
                   <Bell size={16} /> CƯỚP ĐIỂM: {
                     finishLine.buzzerQueue.find(p => p.playerId === finishLine.selectedStealerId)?.playerName || 'PLAYER'
                   }
                </h3>

                {(() => {
                   // Find the latest attempt for the selected stealer (from props OR local state)
                   const propAttempt = currentQ.stealAttempts
                     ?.filter(a => a.playerId === finishLine.selectedStealerId)
                     ?.sort((a, b) => b.timestamp - a.timestamp)[0];
                   
                   // Access localAttempt safely
                   const attemptText = propAttempt?.answerText || (localStealAttempt?.playerId === finishLine.selectedStealerId ? localStealAttempt.answerText : null);
                   const isAnswered = !!attemptText;
                   const isJudged = propAttempt?.pointsEarned !== 0 && propAttempt?.isCorrect !== undefined && (propAttempt.isCorrect || propAttempt.pointsEarned !== 0);

                   if (isAnswered) {
                     return (
                        <>
                          {/* Answer Text */}
                          <div className="bg-slate-900 rounded-lg p-5 mb-6 text-center shadow-inner border border-orange-500/30">
                            <p className="text-3xl font-black text-white">
                              &ldquo;{attemptText}&rdquo;
                            </p>
                          </div>

                          {/* Judge Controls */}
                          {!isJudged ? ( 
                              <div className="grid grid-cols-2 gap-4">
                                <button
                                  onClick={() => socket?.emit("mc_finishline_judge_steal", { correct: true })}
                                  className="py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xl flex flex-col items-center justify-center transition-all shadow-lg hover:scale-105"
                                >
                                  <span className="text-3xl mb-1">✅</span>
                                  CHẤP NHẬN
                                </button>

                                <button
                                  onClick={() => socket?.emit("mc_finishline_judge_steal", { correct: false })}
                                  className="py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xl flex flex-col items-center justify-center transition-all shadow-lg hover:scale-105"
                                >
                                  <span className="text-3xl mb-1">❌</span>
                                  TỪ CHỐI
                                </button>
                              </div>
                          ) : (
                               <div className={`text-center p-4 rounded-lg font-bold text-xl ${propAttempt?.isCorrect ? 'bg-green-600' : 'bg-red-600'}`}>
                                  {propAttempt?.isCorrect ? 'ĐÃ CHẤP NHẬN' : 'ĐÃ TỪ CHỐI'}
                               </div>
                          )}
                        </>
                     );
                   } else {
                     return (
                        <div className="text-center py-8 opacity-60">
                           <div className="text-4xl mb-2 animate-bounce">⏳</div>
                           <p className="text-slate-300 font-bold">Đang chờ câu trả lời...</p>
                        </div>
                     );
                   }
                })()}
              </div>
            )}

            {/* Buzzer Queue */}
            {finishLine.buzzerEnabled && (
              <div className="bg-orange-900/30 border-2 border-orange-500 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={24} className="text-orange-400 animate-bounce" />
                  <h3 className="text-xl font-bold text-orange-400">DANH SÁCH BẤM CHUÔNG</h3>
                </div>

                {finishLine.buzzerQueue.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">Đang chờ player bấm chuông...</p>
                ) : (
                  <div className="space-y-2">
                    {finishLine.buzzerQueue.map((buzz, idx) => (
                      <div
                        key={buzz.playerId}
                        className="bg-slate-900 rounded-lg p-4 flex justify-between items-center border-2 border-orange-700"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                          </span>
                          <div>
                            <p className="font-bold text-white">{buzz.playerName}</p>
                            <p className="text-xs text-slate-400">{buzz.buzzTime}ms</p>
                          </div>
                        </div>
                        {!finishLine.selectedStealerId && (
                          <button
                            onClick={() => handleSelectStealer(buzz.playerId)}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold"
                          >
                            CHỌN
                          </button>
                        )}
                        {finishLine.selectedStealerId === buzz.playerId && (
                          <span className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold">
                            ĐÃ CHỌN
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={handleNextQuestion}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <SkipForward size={20} /> CÂU TIẾP THEO
              </button>
            </div>

            {/* Pack Progress */}
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-sm text-slate-400 mb-3">TIẾN ĐỘ GÓI</h3>
              <div className="space-y-2">
                {finishLine.currentPack.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 text-sm ${
                      idx === finishLine.currentQuestionIndex
                        ? "text-purple-400 font-bold"
                        : q.answer
                        ? "text-green-400"
                        : "text-slate-500"
                    }`}
                  >
                    <span>
                      {q.answer
                        ? q.answer.isCorrect
                          ? "✅"
                          : "❌"
                        : idx === finishLine.currentQuestionIndex
                        ? "▶"
                        : "⬜"}
                    </span>
                    Câu {idx + 1}: {q.points} điểm
                    {q.answer && ` - ${q.answer.isCorrect ? "Đúng" : "Sai"}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GameRoundContainer>
    );
  }

  // FINISHED state
  if (finishLine.status === "FINISHED") {
    return (
      <GameRoundContainer>
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <h1 className="text-5xl font-black text-purple-400">🎉 HOÀN THÀNH</h1>
          <p className="text-slate-400 text-lg">Vòng Về Đích đã kết thúc!</p>
          <button
            onClick={handleReset}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
          >
            <RotateCcw className="inline mr-2" size={24} />
            CHƠI LẠI
          </button>
        </div>
      </GameRoundContainer>
    );
  }

  return (
    <GameRoundContainer>
      <LoadingSpinner  />
    </GameRoundContainer>
  );
}
