import React, { useEffect, useState } from 'react';
import GameRoundContainer from "../../GameRoundContainer";
import { WarmUpState } from "@/server/game/GameConstants";
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface WarmUpMonitorProps {
    warmUp: WarmUpState;
}

export default function WarmUpMonitor({ warmUp }: WarmUpMonitorProps) {
    const [showCorrect, setShowCorrect] = useState(false);
    const [showWrong, setShowWrong] = useState(false);

    // Effect for Correct Answer Animation
    // Effect for Correct/Wrong Answer Animation
    // Effect for Correct/Wrong Answer Animation
    useEffect(() => {
        const lastAns = warmUp.lastAnswer;
        if (!lastAns || Date.now() - (lastAns.timestamp || 0) > 2000) return;

        setTimeout(() => {
            setShowCorrect(false);
            setShowWrong(false);

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

    return (
        <GameRoundContainer className="text-slate-100 overflow-hidden relative">
            
            {/* BACKGROUND ELEMENTS */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90 z-0"></div>
            
            {/* CORRECT ANIMATION OVERLAY */}
            <AnimatePresence>
                {showCorrect && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                         className="absolute bottom-32 left-0 right-0 z-50 flex justify-center pointer-events-none"
                    >
                        <div className="bg-green-600/90 text-white px-12 py-6 rounded-2xl text-6xl font-black shadow-[0_0_50px_rgba(34,197,94,0.6)] border-4 border-white/20 transform -rotate-3 backdrop-blur-md">
                            ĐÚNG! (+10)
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* WRONG ANIMATION OVERLAY */}
            <AnimatePresence>
                {showWrong && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="absolute bottom-32 left-0 right-0 z-50 flex justify-center pointer-events-none"
                    >
                        <div className="bg-red-600/90 text-white px-12 py-6 rounded-2xl text-6xl font-black shadow-[0_0_50px_rgba(239,68,68,0.6)] border-4 border-white/20 transform rotate-3 backdrop-blur-md">
                            SAI
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="relative z-10 w-full max-w-7xl mx-auto flex justify-between items-start pt-6 px-4">
                <div className="bg-amber-600 px-8 py-3 rounded-br-3xl clip-path-polygon shadow-lg shadow-amber-900/40 transform skew-x-[-10deg]">
                    <h1 className="text-3xl font-black uppercase tracking-widest text-white transform skew-x-[10deg]">KHỞI ĐỘNG</h1>
                </div>
                
                {/* TIMER */}
                {(warmUp.status === 'READY' || warmUp.status === 'PLAYING') && (
                    <div className="flex flex-col items-center">
                        <div className={clsx(
                            "text-8xl md:text-9xl font-black font-mono leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]",
                            warmUp.timer <= 10 ? "text-red-500 animate-pulse scale-110" : "text-white"
                        )}>
                            {warmUp.timer}
                        </div>
                        <div className="text-sm font-mono text-slate-500 uppercase tracking-[0.5em] mt-2">Giây</div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto px-8">
                <AnimatePresence mode="wait">
                    
                    {/* IDLE */}
                    {warmUp.status === 'IDLE' && (
                         <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center w-full"
                        >
                            {warmUp.previewSelectedPlayerId ? (
                                <div className="grid grid-cols-2 gap-8 w-full max-w-5xl mx-auto items-stretch">
                                   {/* PREVIEW CANDIDATE */}
                                   <div className="bg-slate-900/80 p-10 rounded-3xl border border-amber-500/30 animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.2)] flex flex-col justify-center">
                                       <div className="text-amber-500 text-sm uppercase tracking-[0.3em] mb-4 font-bold border-b border-white/10 pb-4">Thí sinh dự kiến</div>
                                       <div className="text-5xl md:text-6xl font-black text-white uppercase leading-none break-words">
                                           {warmUp.previewSelectedPlayerName || "..."}
                                       </div>
                                       {warmUp.previewSelectedPlayerName && (
                                            <div className="mt-6 text-slate-400 font-mono text-sm">Waiting for MC confirmation...</div>
                                       )}
                                   </div>

                                   {/* PREVIEW PACK */}
                                   <div className="bg-slate-900/80 p-10 rounded-3xl border border-cyan-500/30 animate-pulse shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col justify-center">
                                       <div className="text-cyan-500 text-sm uppercase tracking-[0.3em] mb-4 font-bold border-b border-white/10 pb-4">Gói câu hỏi</div>
                                       <div className="text-4xl md:text-5xl font-black text-white uppercase leading-tight">
                                            {warmUp.previewSelectedPackName || "..."}
                                       </div>
                                       {warmUp.previewSelectedPackName && (
                                            <div className="mt-6 text-slate-400 font-mono text-xs overflow-hidden">
                                                <div className="inline-block px-3 py-1 bg-cyan-900/30 rounded text-cyan-300 border border-cyan-500/20">60 Giây</div>
                                            </div>
                                       )}
                                   </div>
                                </div>
                            ) : (
                                <h2 className="text-6xl font-thin text-slate-600 uppercase tracking-[0.2em]">Chờ Lượt Thi</h2>
                            )}
                        </motion.div>
                    )}

                    {/* READY */}
                    {warmUp.status === 'READY' && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full flex flex-col items-center"
                        >
                            {/* VS STYLE INTRO */}
                            <div className="relative w-full max-w-5xl bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                                
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                                
                                <div className="grid grid-cols-5 h-[400px]">
                                    {/* LEFT: CANDIDATE */}
                                    <div className="col-span-3 p-12 flex flex-col justify-center border-r border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20">
                                        <div className="text-amber-500/80 font-black text-2xl uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                            <span className="w-12 h-[2px] bg-amber-500"></span> Phần thi
                                        </div>
                                        <h2 className="text-4xl font-black text-white uppercase leading-[0.9] drop-shadow-2xl">
                                            <span className="block text-4xl">{warmUp.currentPlayerName}</span>
                                        </h2>
                                    </div>

                                    {/* RIGHT: PACK INFO */}
                                    <div className="col-span-2 p-12 flex flex-col justify-center bg-slate-950/50">
                                        <div className="text-cyan-500/80 font-bold text-lg uppercase tracking-widest mb-6">Gói Câu Hỏi</div>
                                        
                                        <div className="text-5xl font-bold text-white mb-2">{warmUp.currentPackName}</div>
                                        <div className="text-slate-500 font-mono text-sm">60 Giây / Trắc Nghiệm</div>

                                        <div className="mt-12">
                                            <div className="text-slate-400 text-xs uppercase tracking-widest mb-2">Trạng thái</div>
                                            <div className="inline-flex items-center gap-2 text-green-400 font-bold uppercase animate-pulse">
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div> Sẵn Sàng
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* PLAYING */}
                    {warmUp.status === 'PLAYING' && warmUp.currentQuestion && (
                        <motion.div
                            key={warmUp.currentQuestion.id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5, type: "spring" }}
                            className="bg-slate-900/60 backdrop-blur-md border border-white/20 p-12 rounded-3xl w-full text-center shadow-2xl relative"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-600 px-6 py-2 rounded-full text-lg text-slate-300 font-mono uppercase shadow-xl">
                                Câu hỏi
                            </div>
                            <h2 className="text-5xl md:text-7xl font-bold leading-tight text-white drop-shadow-md py-8">
                                {warmUp.currentQuestion.content}
                            </h2>
                        </motion.div>
                    )}

                    {/* FINISHED */}
                    {warmUp.status === 'FINISHED' && (
                         <motion.div
                            key="finished"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <h2 className="text-6xl font-black text-white uppercase mb-4">Hoàn Thành</h2>
                            <div className="text-3xl text-slate-400">
                                Tổng điểm vòng này: <span className="text-amber-500 font-bold text-5xl ml-2">{warmUp.totalScoreReceived}</span>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* FOOTER: PLAYER INFO (Always visible if Name exists) */}
            {warmUp.currentPlayerId && (
                <div className="relative z-10 w-full bg-gradient-to-t from-black to-transparent pb-8 pt-12">
                     <div className="max-w-7xl mx-auto px-8 flex items-end gap-6">
                         {/* AVATAR PLACEHOLDER */}
                         <div className="w-24 h-24 bg-slate-800 rounded-xl border-2 border-amber-500 shadow-[0_0_30px_#f59e0b] relative overflow-hidden flex items-center justify-center">
                              <span className="text-4xl text-amber-500 font-bold">
                                  {warmUp.currentPlayerName?.charAt(0).toUpperCase()}
                              </span>
                         </div>
                         
                         <div className="mb-2">
                             <div className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-0">Thí sinh thi đấu</div>
                             <div className="text-5xl font-black text-white uppercase">{warmUp.currentPlayerName}</div>
                         </div>
    
                         <div className="ml-auto mb-2 text-right">
                             <div className="text-slate-400 text-sm font-bold uppercase tracking-widest">Điểm Vòng Này</div>
                             <div className="text-5xl font-mono font-black text-amber-500">{warmUp.totalScoreReceived}</div>
                         </div>
                     </div>
                </div>
            )}
        </GameRoundContainer>
    );
}
