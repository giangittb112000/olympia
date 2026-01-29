"use client";
import { motion, AnimatePresence } from "framer-motion";
import { FinishLineState } from "@/server/game/GameConstants";
import { usePlayers } from "@/hooks/usePlayers";
import { Star, Package, CheckCircle, Loader2 } from "lucide-react";
import LiveRankingBoard from "./LiveRankingBoard";
import BuzzerQueueDisplay from "./BuzzerQueueDisplay";
import EffectsManager from "./EffectsManager";
import FinishLineAnswerDisplay from "./FinishLineAnswerDisplay";

interface FinishLineMonitorProps {
  finishLine: FinishLineState;
}

export default function FinishLineMonitor({ finishLine }: FinishLineMonitorProps) {
  return <FinishLineMonitorContent finishLine={finishLine} />;
}

function FinishLineMonitorContent({ finishLine }: FinishLineMonitorProps) {
  const { players } = usePlayers();

  // IDLE / WAITING state
  if (finishLine.status === "IDLE" || !finishLine.status) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-slate-950 via-purple-950 to-black flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, type: "spring" }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-9xl mb-8 block"
          >
            🏁
          </motion.div>
          <h1 className="text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-6">
            VÒNG VỀ ĐÍCH
          </h1>
          <p className="text-3xl text-slate-400 font-bold">
            Chuẩn bị bắt đầu...
          </p>
        </motion.div>
      </div>
    );
  }

  // FINISHED State OR All Players Finished
  const allPlayersFinished = players.length > 0 && (finishLine.finishedPlayerIds?.length || 0) >= players.length;

  if (finishLine.status === "FINISHED" || (finishLine.status === "PACK_SELECTION" && allPlayersFinished)) {
      return (
        <div className="h-screen w-screen pt-[120px] overflow-hidden bg-gradient-to-b from-slate-950 via-purple-950 to-black p-8 flex flex-col items-center justify-center">
            <EffectsManager finishLineState={{...finishLine, status: "FINISHED"}} />
            
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center mb-12"
            >
                <h1 className="text-8xl font-black text-amber-500 mb-8 bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    {finishLine.status === "FINISHED" ? "KẾT THÚC VÒNG THI" : "ĐÃ HOÀN THÀNH"}
                </h1>
                <div className="text-9xl mb-4 animate-bounce">🏁</div>
            </motion.div>
            <div className="w-full max-w-5xl h-[600px]">
                <LiveRankingBoard players={players || []} />
            </div>
        </div>
      );
  }

  // PACK_SELECTION state
  if (finishLine.status === "PACK_SELECTION") {
    return (
      <div className="h-screen pt-[100px] w-screen overflow-hidden bg-gradient-to-b from-slate-950 via-purple-950 to-black p-8 flex flex-col">
        <EffectsManager finishLineState={finishLine} />
        
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-10 shrink-0"
        >
          <h1 className="text-6xl font-black text-purple-400 mb-2">
            📦 CHỌN GÓI CÂU HỎI
          </h1>
          {finishLine.selectedPlayerName && (
            <p className="text-4xl text-white">
              Đang chờ:{" "}
              <span className="text-amber-400 font-black">
                {finishLine.selectedPlayerName}
              </span>
            </p>
          )}
        </motion.div>

        {/* Available Packs */}
        <div className="grid grid-cols-3 gap-12 mb-6 flex-1 items-center px-20">
          {[
            { type: 40, emoji: "📗", color: "green" },
            { type: 60, emoji: "📘", color: "blue" },
            { type: 80, emoji: "📕", color: "red" },
          ].map((pack, idx) => {
            const remaining =
              finishLine.availablePacks?.find((p) => p.packType === pack.type)
                ?.count || 0;

            return (
              <motion.div
                key={pack.type}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: idx * 0.2, type: "spring" }}
                className={`bg-slate-900/50 backdrop-blur-md border-4 ${
                  remaining > 0
                    ? "border-purple-500"
                    : "border-slate-700 opacity-50 grayscale"
                } rounded-3xl p-10 text-center shadow-2xl flex flex-col items-center justify-center h-full max-h-[400px]`}
              >
                <div className="text-9xl mb-8">{pack.emoji}</div>
                <div className="text-8xl font-black text-white mb-4">
                  {pack.type}đ
                </div>
                <div className="text-3xl text-slate-400">
                  Còn:{" "}
                  <span className="text-white font-bold">{remaining}</span> gói
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Player Progress Footer */}
        <div className="h-[120px] shrink-0 grid grid-cols-4 gap-4 px-10">
            {players.map((player) => {
                const isFinished = finishLine.finishedPlayerIds?.includes(player._id);
                const isSelecting = finishLine.selectedPlayerId === player._id;

                return (
                    <motion.div
                        key={player._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border-2 flex items-center justify-between px-6 py-2 shadow-lg transition-all ${
                            isFinished 
                                ? "bg-slate-900/50 border-slate-700 opacity-60" 
                            : isSelecting 
                                ? "bg-purple-900/80 border-amber-400 scale-105 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-2 ring-amber-400/50" 
                                : "bg-slate-800/50 border-slate-600"
                        }`}
                    >
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold uppercase tracking-wider ${isSelecting ? "text-amber-400" : "text-slate-400"}`}>
                                {isFinished ? "ĐÃ THI XONG" : isSelecting ? "ĐANG CHỌN..." : "CHƯA THI"}
                            </span>
                            <span className={`text-2xl font-black ${isSelecting ? "text-white" : "text-slate-200"}`}>
                                {player.name}
                            </span>
                        </div>
                        
                        {isFinished ? (
                            <div className="bg-green-600/20 p-2 rounded-full border border-green-500">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <CheckCircle size={32} className="text-green-500" />
                                </motion.div>
                            </div>
                        ) : isSelecting ? (
                            <div className="bg-amber-500/20 p-2 rounded-full border border-amber-500 animate-pulse">
                                <Loader2 size={32} className="text-amber-500 animate-spin" />
                            </div>
                        ) : (
                             <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-slate-500">
                                 {player.name.charAt(0)}
                             </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
      </div>
    );
  }

  // STAR_SELECTION state
  if (finishLine.status === "STAR_SELECTION") {
      return (
        <div className="h-screen pt-[100px] w-screen overflow-hidden bg-gradient-to-b from-slate-950 via-purple-950 to-black p-8 flex flex-col items-center justify-center">
             <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
             >
                 <div className="text-9xl mb-8 animate-pulse">⭐</div>
                 <h1 className="text-6xl font-black text-amber-400 mb-4">NGÔI SAO HY VỌNG</h1>
                 <p className="text-2xl text-white">Thí sinh <span className="font-bold text-amber-300">{finishLine.selectedPlayerName || "..."}</span> đang ra quyết định...</p>
             </motion.div>
        </div>
      );
  }

  // PLAYING_QUESTION state
  if (finishLine.status === "PLAYING_QUESTION" && finishLine.currentPack) {
    const currentQ =
      finishLine.currentPack.questions[finishLine.currentQuestionIndex];

    return (
      <div className="h-screen w-screen pt-[100px] overflow-hidden bg-gradient-to-b from-slate-950 via-purple-950 to-black p-6 flex flex-col">
        <EffectsManager finishLineState={finishLine} />
        
        {/* Top Bar */}
        <div className="flex justify-between items-stretch mb-6 gap-6 h-[100px] shrink-0">
          {/* Pack Info */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-purple-900/30 backdrop-blur-md border-2 border-purple-500 rounded-2xl px-6 py-2 flex-1 flex items-center justify-start gap-4"
          >
            <Package size={48} className="text-purple-400 shrink-0" />
            <div>
              <div className="text-2xl font-black text-white leading-none mb-1">
                GÓI {finishLine.currentPack.packType} ĐIỂM
              </div>
              <div className="text-xl text-slate-400 leading-none">
                Thí sinh: <span className="text-white font-bold">{finishLine.currentPack.ownerName}</span>
              </div>
            </div>
          </motion.div>

          {/* Timer */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`bg-slate-900/80 backdrop-blur-md border-4 rounded-3xl w-[200px] flex items-center justify-center shadow-2xl relative ${
              finishLine.timeLeft <= 10
                ? "border-red-500 animate-pulse bg-red-900/30"
                : "border-amber-500"
            }`}
          >
            <div className="text-center">
              <div className="text-6xl font-mono font-black text-white leading-none">
                {finishLine.timeLeft}
              </div>
              <div className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest absolute bottom-2 w-full left-0 text-center">Giây</div>
            </div>
          </motion.div>

          {/* Question Progress */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-slate-900/30 backdrop-blur-md border-2 border-slate-600 rounded-2xl px-6 py-2 flex-1 flex flex-col items-center justify-center"
          >
            <div className="text-xl font-black text-white text-center mb-2">
              CÂU HỎI {finishLine.currentQuestionIndex + 1}/{finishLine.currentPack.questions.length}
            </div>
            <div className="flex gap-3 justify-center">
              {finishLine.currentPack.questions.map((q, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    idx === finishLine.currentQuestionIndex
                      ? "bg-purple-500 scale-150 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                      : q.answer // Valid check for completion
                      ? "bg-green-500"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
          {/* Left: Question & Media */}
          <div className="col-span-8 flex flex-col gap-6 h-full min-h-0">
            
            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={finishLine.currentQuestionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className={`bg-gradient-to-br from-purple-900/60 to-blue-900/60 backdrop-blur-md border-4 border-purple-500 rounded-3xl p-8 relative flex flex-col shadow-2xl ${!currentQ.mediaUrl ? "flex-1 justify-center items-center text-center" : "h-auto shrink-0"}`}
              >
                {/* Star Badge */}
                {currentQ.starActivated && (
                  <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-5 -right-5 z-20"
                  >
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-black text-xl shadow-xl flex items-center gap-2 border-4 border-white animate-pulse">
                          <Star fill="black" size={24} />
                          NGÔI SAO HY VỌNG
                      </div>
                  </motion.div>
                )}

                <div className={`flex items-center gap-4 mb-4 ${!currentQ.mediaUrl ? "justify-center" : ""}`}>
                  <span className="px-5 py-1 bg-purple-600 text-white rounded-xl text-2xl font-black shadow-lg">
                    {currentQ.points} ĐIỂM
                  </span>
                  {currentQ.questionDescription && (
                      <span className="text-xl text-slate-300 italic bg-black/30 px-4 py-1 rounded-xl">
                          💡 {currentQ.questionDescription}
                      </span>
                  )}
                </div>
                
                <h2 className={`font-black text-white leading-tight drop-shadow-md ${
                      currentQ.questionText.length > 150 ? "text-3xl" : "text-5xl"
                }`}>
                  {currentQ.questionText}
                </h2>
              </motion.div>
            </AnimatePresence>

            {/* Media - Only show if exists */}
            {currentQ.mediaUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 bg-black rounded-3xl overflow-hidden shadow-2xl relative border-2 border-slate-700 min-h-0"
              >
                {currentQ.mediaType === "IMAGE" && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentQ.mediaUrl}
                    alt="Question media"
                    className="w-full h-full object-contain absolute inset-0"
                  />
                )}
                {currentQ.mediaType === "VIDEO" && (
                  <video
                    src={currentQ.mediaUrl}
                    autoPlay
                    muted={false}
                    controls={false}
                    className="w-full h-full absolute inset-0"
                  />
                )}
                {currentQ.mediaType === "AUDIO" && (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 to-purple-900 absolute inset-0">
                    <div className="text-center">
                      <motion.div 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="text-9xl mb-8 block"
                      >🎵</motion.div>
                      <audio
                        src={currentQ.mediaUrl}
                        controls
                        autoPlay
                        className="w-[500px]"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right: Ranking + Buzzer + Answers */}
          <div className="col-span-4 flex flex-col gap-4 h-full pb-6 overflow-hidden">
            {/* Answer Display - Takes priority if active */}
             <div className="shrink-0 flex flex-col z-10">
                  <FinishLineAnswerDisplay 
                     question={currentQ} 
                     isRevealed={finishLine.timeLeft === 0 || !!currentQ.answer} 
                  />
             </div>

            <div className="flex-1 min-h-[150px]">
               <LiveRankingBoard players={players || []} compact />
            </div>
            
            {/* Show buzzer if enabled or queue has people */}
            {(finishLine.buzzerEnabled || finishLine.buzzerQueue.length > 0) && (
              <div className="flex-1 min-h-[150px]">
                 <BuzzerQueueDisplay queue={finishLine.buzzerQueue} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return <div className="text-white text-center mt-20">Loading...</div>;
}
