import React, { useEffect, useState } from 'react';
import GameRoundContainer from "../../GameRoundContainer";
import { WarmUpState } from "@/server/game/GameConstants";
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface WarmUpPlayerProps {
    warmUp: WarmUpState;
}

import { useCurrentPlayer } from "@/hooks/useCurrentPlayer";

export default function WarmUpPlayer({ warmUp }: WarmUpPlayerProps) {
    const myId = useCurrentPlayer();
    const [showCorrect, setShowCorrect] = useState(false);
    const [showWrong, setShowWrong] = useState(false);

    // Effect for Answer Feedback
    // Effect for Answer Feedback
    useEffect(() => {
        const lastAns = warmUp.lastAnswer;
        if (!lastAns || Date.now() - (lastAns.timestamp || 0) > 2000) return;

        // Reset and then Trigger
        // Using setTimeout to avoid synchronous setState in useEffect lint error
        setTimeout(() => {
            setShowCorrect(false);
            setShowWrong(false);
            
            // Short delay to allow 'false' state to register if we need to restart animation
            // or just set true immediately after clearing
            setTimeout(() => {
                 if (lastAns.result === 'CORRECT') {
                    setShowCorrect(true);
                    const timer = setTimeout(() => setShowCorrect(false), 2000);
                    return () => clearTimeout(timer);
                } else if (lastAns.result === 'WRONG') {
                    setShowWrong(true);
                    const timer = setTimeout(() => setShowWrong(false), 2000);
                    return () => clearTimeout(timer);
                }
            }, 50);
        }, 0);
        
    }, [warmUp.lastAnswer]);

    const isActivePlayer = myId && warmUp.currentPlayerId === myId;

    return (
        <GameRoundContainer className="text-slate-100">
            {/* Header / Info */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
                 <div className="bg-slate-900/80 backdrop-blur px-4 py-2 rounded-lg border border-white/10 shadow-lg">
                     <span className="text-slate-400 text-sm font-mono uppercase mr-2">Vòng Thi:</span>
                     <span className="text-amber-500 font-bold uppercase">Khởi Động</span>
                 </div>
                 
                 {/* TIMER - Only show if Playing or Ready */}
                 {(warmUp.status === 'PLAYING' || warmUp.status === 'READY') && (
                     <div className={clsx(
                         "text-6xl md:text-8xl font-black font-mono tracking-tighter drop-shadow-lg",
                         warmUp.timer <= 10 ? "text-red-500 animate-pulse" : "text-white"
                     )}>
                        {warmUp.timer}
                     </div>
                 )}
            </div>

            {/* CORRECT ANIMATION OVERLAY */}
            <AnimatePresence>
                {showCorrect && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="absolute bottom-1/4 left-0 right-0 z-50 flex justify-center pointer-events-none"
                    >
                        <div className="text-green-500 text-8xl font-black drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] stroke-black bg-black/40 px-8 py-2 rounded-xl border border-green-500/50 backdrop-blur-sm">
                            ĐÚNG!
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* WRONG ANIMATION OVERLAY */}
            <AnimatePresence>
                {showWrong && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="absolute bottom-1/4 left-0 right-0 z-50 flex justify-center pointer-events-none"
                    >
                        <div className="text-red-500 text-8xl font-black drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] bg-black/40 px-8 py-2 rounded-xl border border-red-500/50 backdrop-blur-sm">
                            SAI
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col justify-center items-center w-full max-w-5xl relative z-0">
                <AnimatePresence mode="wait">
                    {/* IDLE STATE */}
                    {warmUp.status === 'IDLE' && (
                        <motion.div 
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center"
                        >
                            {/* Check for Preview Selection */}
                            {(warmUp.previewSelectedPlayerId) ? (
                                <div className="animate-in fade-in zoom-in duration-500 w-full max-w-4xl mx-auto">
                                     {myId === warmUp.previewSelectedPlayerId ? (
                                         <div className="bg-slate-900/60 border border-amber-500/50 p-8 rounded-2xl relative overflow-hidden backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                                             {/* Background Glow */}
                                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-amber-500/5 blur-3xl rounded-full animate-pulse-slow"></div>
                                             
                                             <div className="relative z-10 flex flex-col items-center">
                                                 <div className="bg-amber-500/10 text-amber-500 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-amber-500/20">
                                                     Thông báo từ MC
                                                 </div>
                                                 
                                                 <h2 className="text-3xl md:text-5xl font-black text-white uppercase mb-4 drop-shadow-xl text-center leading-tight">
                                                     Bạn Được Chọn
                                                 </h2>
                                                 
                                                 <div className="w-16 h-1 bg-amber-500 rounded-full mb-6"></div>

                                                 <div className="flex flex-col items-center gap-2">
                                                     <span className="text-slate-400 text-sm uppercase tracking-wide">Gói câu hỏi dự kiến</span>
                                                     <span className="text-2xl text-cyan-400 font-bold bg-cyan-950/30 px-6 py-2 rounded-lg border border-cyan-500/20">
                                                         {warmUp.previewSelectedPackName || "..."}
                                                     </span>
                                                 </div>

                                                 <div className="mt-8 text-amber-500/60 text-xs font-mono animate-bounce tracking-widest">
                                                     HÃY CHUẨN BỊ TINH THẦN...
                                                 </div>
                                             </div>
                                         </div>
                                     ) : (
                                        <div className="bg-slate-900/40 backdrop-blur-md p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                                            {/* Decorative Background */}
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                            
                                            <div className="relative z-10">
                                                <div className="text-slate-500 text-sm uppercase tracking-[0.3em] mb-6 font-bold">Thông tin từ MC</div>
                                                
                                                <div className="flex flex-col gap-2 mb-8">
                                                    <span className="text-slate-400 text-lg">Đang cân nhắc thí sinh</span>
                                                    <span className="text-4xl md:text-6xl text-white font-black uppercase tracking-tight drop-shadow-lg">
                                                        {warmUp.previewSelectedPlayerName || "..."}
                                                    </span>
                                                </div>

                                                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent my-6"></div>

                                                <div className="flex flex-col gap-2">
                                                    <span className="text-slate-400 text-lg">Dự kiến gói câu hỏi</span>
                                                    <span className="text-3xl text-cyan-400 font-bold uppercase">
                                                        {warmUp.previewSelectedPackName || "..."}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Debug Info (Only in Dev/Debug mode - removed for prod, but useful now) */}
                                            <div className="absolute bottom-2 right-2 text-[10px] text-slate-800 font-mono">
                                                ID: {myId?.slice(-4)} | Target: {warmUp.previewSelectedPlayerId?.slice(-4)}
                                            </div>
                                        </div>
                                     )}
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-3xl text-slate-400 font-bold uppercase mb-4 tracking-widest">Đang chờ tín hiệu từ MC...</h2>
                                    <div className="animate-spin text-5xl text-amber-500/50">✦</div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* FINISHED STATE */}
                    {warmUp.status === 'FINISHED' && (
                        <motion.div 
                            key="finished"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center"
                        >
                             <h2 className="text-5xl text-red-500 font-black uppercase mb-4">Kết Thúc Lượt Thi</h2>
                             <div className="text-2xl text-white">
                                 Thí sinh: <span className="text-amber-500 font-bold">{warmUp.currentPlayerName}</span>
                             </div>
                             <div className="text-2xl text-white mt-2">
                                 Điểm số: <span className="text-yellow-400 font-mono font-bold">{warmUp.totalScoreReceived}</span>
                             </div>
                             <div className="mt-8 text-slate-400 text-sm">Chờ lượt tiếp theo...</div>
                        </motion.div>
                    )}

                    {/* READY STATE */}
                    {warmUp.status === 'READY' && (
                        <motion.div 
                            key="ready"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center bg-slate-900/80 p-8 rounded-3xl border border-amber-900/50"
                        >
                            <div className="text-slate-400 text-xl uppercase mb-2">Chuẩn bị thi đấu</div>
                            <h2 className="text-5xl text-white font-black uppercase mb-6">{warmUp.currentPlayerName}</h2>
                            <div className="text-amber-500 text-xl font-bold mb-8">Gói câu hỏi: {warmUp.currentPackName}</div>
                            
                            {isActivePlayer ? (
                                <div className="py-12">
                                    <motion.div 
                                        animate={{ scale: [1, 1.05, 1] }} 
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                        className="text-amber-500 font-black text-4xl md:text-6xl uppercase mb-6 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]"
                                    >
                                        BẠN LÀ NGƯỜI ĐƯỢC CHỌN!
                                    </motion.div>
                                    
                                    <div className="text-xl text-slate-300 font-mono mb-8">Hãy chuẩn bị tinh thần...</div>

                                </div>
                            ) : (
                                <div className="py-8 opacity-80">
                                     <div className="text-7xl mb-6">🎯</div>
                                     <div className="text-slate-300 text-2xl font-light">Thí sinh <span className="text-amber-500 font-bold">{warmUp.currentPlayerName}</span> đang chuẩn bị thi đấu.</div>
                                     <div className="mt-4 text-slate-500 text-sm uppercase tracking-[0.2em] animate-pulse">Vui lòng giữ trật tự</div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* PLAYING STATE */}
                    {warmUp.status === 'PLAYING' && (
                        <motion.div 
                            key="playing"
                            className="w-full"
                        >
                            {isActivePlayer ? (
                                // ACTIVE PLAYER VIEW
                                <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-amber-500 rounded-3xl p-8 md:p-16 text-center shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                                    {warmUp.currentQuestion ? (
                                        <h2 className="text-3xl md:text-5xl font-bold leading-relaxed text-slate-100">
                                            {warmUp.currentQuestion.content}
                                        </h2>
                                    ) : (
                                        <div className="text-slate-500 animate-pulse">Đang tải câu hỏi...</div>
                                    )}
                                </div>
                            ) : (
                                // INACTIVE PLAYER VIEW - NOW SHOWING QUESTION
                                <div className="text-center">
                                    <h3 className="text-slate-400 text-sm uppercase mb-4">Câu hỏi dành cho <span className="text-amber-500 font-bold">{warmUp.currentPlayerName}</span></h3>
                                    <div className="bg-slate-800/60 p-8 rounded-2xl border border-white/5 mb-8 min-h-[200px] flex items-center justify-center">
                                         {warmUp.currentQuestion ? (
                                            <h2 className="text-2xl md:text-3xl font-medium text-slate-300">
                                                {warmUp.currentQuestion.content}
                                            </h2>
                                         ) : (
                                             <div className="text-slate-600 italic">...</div>
                                         )}
                                    </div>
                                    <div className="inline-block bg-slate-900 px-6 py-3 rounded-xl">
                                        Điểm tạm tính: <span className="text-amber-500 font-bold text-2xl ml-2">{warmUp.totalScoreReceived}</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GameRoundContainer>
    );
}
