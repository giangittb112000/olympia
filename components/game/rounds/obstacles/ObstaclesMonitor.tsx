import React from 'react';
import GameRoundContainer from "../../GameRoundContainer";
import { ObstacleState } from "@/server/game/GameConstants";
import { usePlayers } from "@/hooks/usePlayers";
import { Check, X, Bell, Image as ImageIcon, Eye, Clock, ArrowLeftCircle, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface ObstaclesMonitorProps {
    obstacle: ObstacleState;
}

export default function ObstaclesMonitor({ obstacle }: ObstaclesMonitorProps) {
    const { players } = usePlayers();

    if (!obstacle) return null; // Safety check

    // FINISHED STATE - SUMMARY SCREEN
    if (obstacle.status === 'FINISHED') {
        return (
            <GameRoundContainer className="text-amber-500">
                <div className="flex flex-col items-center justify-center w-full h-full gap-8 animate-fade-in">
                    {/* Header */}
                    <div className="text-center">
                        <h2 className="text-1xl text-slate-400 font-bold uppercase tracking-[0.5em] mb-2">TỪ KHÓA CHƯỚNG NGẠI VẬT</h2>
                        <h1 className="text-6xl md:text-6xl font-black font-display text-white drop-shadow-[0_0_30px_rgba(245,158,11,0.6)] uppercase">
                            {obstacle.finalCNV}
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full max-w-[1600px] flex-1 min-h-0">
                        {/* LEFT: FULL IMAGE */}
                        <div className="lg:col-span-7 flex flex-col justify-center">
                            <div className="w-full aspect-video bg-slate-900 rounded-3xl border-4 border-amber-500/50 shadow-2xl overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"/>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={obstacle.currentImage || "/placeholder.jpg"} 
                                    alt="Final Result"
                                    className="w-full h-full object-contain transition-transform duration-[10s] ease-linear scale-100 group-hover:scale-110"
                                />
                            </div>
                        </div>

                        {/* RIGHT: RANKING SUMMARY */}
                        <div className="lg:col-span-5 flex flex-col justify-center">
                            <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col gap-6 h-full max-h-[600px]">
                                <h3 className="text-2xl font-bold text-white uppercase tracking-wider border-b border-white/10 pb-4">
                                    Bảng Điểm Tạm Thời
                                </h3>
                                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
                                    <MonitorRankingList />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </GameRoundContainer>
        );
    }

    // NORMAL GAMEPLAY STATE
    return (
        <GameRoundContainer className="text-amber-500 overflow-hidden relative">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-amber-900/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="text-center mb-6">
                     <h2 className="text-sm font-bold text-cyan-500 uppercase tracking-[0.5em] mb-1 animate-pulse">Vòng Thi</h2>
                     <h1 className="text-4xl md:text-6xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
                        VƯỢT CHƯỚNG NGẠI VẬT
                     </h1>
                </div>
                
                <div className="flex gap-6 w-full flex-1 min-h-0">
                    {/* Left: Image & Puzzle */}
                    <div className="flex-[4] h-full flex flex-col items-center justify-center relative min-w-0 min-h-0 container-query-root">
                        <div className="aspect-video h-full max-w-full w-auto relative group shadow-2xl mx-auto flex-shrink-0">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500/50 to-purple-600/50 rounded-[20px] blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                            <div className="relative w-full h-full bg-slate-950 rounded-[18px] border border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                                 {/* IMAGE DISPLAY */}
                                 <div className="w-full h-full relative rounded-2xl overflow-hidden bg-black shadow-inner">
                                     {/* eslint-disable-next-line @next/next/no-img-element */}
                                     <img 
                                        src={obstacle.currentImage || "/placeholder.jpg"} 
                                        alt="CNV" 
                                        className={`w-full h-full object-contain transition-all duration-1000 transform ${obstacle.imageRevealed ? 'scale-100 opacity-100' : 'scale-105 opacity-80 '}`} 
                                     />

                                     {/* MASK OVERLAYS */}
                                     {!obstacle.imageRevealed && (
                                         <>
                                            {/* TL (0) */}
                                            <div 
                                                className={`absolute top-0 left-0 w-[50.5%] h-[50.5%] bg-slate-900/95 border-r border-b border-cyan-500/30 flex items-center justify-center transition-all duration-700 z-10 backdrop-blur-sm
                                                ${obstacle.revealedPieces[0] ? 'opacity-0 scale-90' : 'opacity-100'}`}
                                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }}
                                            >
                                                <span className="text-6xl font-black text-slate-700/50 -translate-x-4 -translate-y-4">1</span>
                                            </div>

                                            {/* TR (1) */}
                                            <div 
                                                className={`absolute top-0 right-0 w-[50.5%] h-[50.5%] bg-slate-900/95 border-l border-b border-cyan-500/30 flex items-center justify-center transition-all duration-700 z-10 backdrop-blur-sm
                                                ${obstacle.revealedPieces[1] ? 'opacity-0 scale-90' : 'opacity-100'}`}
                                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 20% 100%, 0 80%)' }}
                                            >
                                                <span className="text-6xl font-black text-slate-700/50 translate-x-4 -translate-y-4">2</span>
                                            </div>

                                            {/* BR (2) */}
                                            <div 
                                                className={`absolute bottom-0 right-0 w-[50.5%] h-[50.5%] bg-slate-900/95 border-l border-t border-cyan-500/30 flex items-center justify-center transition-all duration-700 z-10 backdrop-blur-sm
                                                ${obstacle.revealedPieces[2] ? 'opacity-0 scale-90' : 'opacity-100'}`}
                                                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}
                                            >
                                                <span className="text-6xl font-black text-slate-700/50 translate-x-4 translate-y-4">3</span>
                                            </div>

                                            {/* BL (3) */}
                                            <div 
                                                className={`absolute bottom-0 left-0 w-[50.5%] h-[50.5%] bg-slate-900/95 border-r border-t border-cyan-500/30 flex items-center justify-center transition-all duration-700 z-10 backdrop-blur-sm
                                                ${obstacle.revealedPieces[3] ? 'opacity-0 scale-90' : 'opacity-100'}`}
                                                style={{ clipPath: 'polygon(0 0, 80% 0, 100% 20%, 100% 100%, 0 100%)' }}
                                            >
                                                <span className="text-6xl font-black text-slate-700/50 -translate-x-4 translate-y-4">4</span>
                                            </div>

                                            {/* CENTER (4) - Diamond */}
                                            <div 
                                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25%] aspect-square bg-slate-950/90 border-2 border-amber-500/50 flex items-center justify-center transition-all duration-500 z-20 shadow-[0_0_30px_rgba(0,0,0,0.8)] rotate-45 backdrop-blur-md
                                                ${obstacle.revealedPieces[4] ? 'opacity-0 scale-150' : 'opacity-100'}`}
                                            >
                                                 <div className="-rotate-45 flex flex-col items-center">
                                                    <span className="text-amber-500/50 font-black text-xs uppercase tracking-widest">Từ Khóa</span>
                                                    <span className="text-amber-400 font-bold text-2xl animate-pulse">?</span>
                                                 </div>
                                            </div>
                                         </>
                                     )}
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Rows & Questions & Players */}
                    <div className="flex-[3] flex flex-col gap-4">
                        {/* Rows */}
                        <div className="flex flex-col gap-3 p-4 bg-slate-900/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                            {[0, 1, 2, 3].map((idx) => {
                                const length = obstacle.rowLengths?.[idx] || 0;
                                const content = obstacle.rowContents?.[idx] || "";
                                const isCurrent = obstacle.currentRowIndex === idx;
                                // Dismissed = No content BUT has result (Played)
                                const isDismissed = !content && obstacle.rowResults && obstacle.rowResults[idx];
                                
                                return (
                                    <div 
                                        key={idx} 
                                        className={`
                                            flex items-center justify-between p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group
                                            ${isCurrent 
                                                ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                                                : (content || isDismissed 
                                                    ? 'border-slate-700 bg-slate-900/50 opacity-80' 
                                                    : 'border-slate-800 bg-slate-900 hover:border-slate-600')}
                                        `}
                                    >
                                        {isCurrent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 animate-pulse" />}
                                        
                                        <div className="flex flex-row-reverse justify-between items-center gap-4 w-full relative z-10">
                                            <div className="flex items-center gap-3">
                                                 {/* Status Indicator for Finished Rows */}
                                                 {content && !obstacle.revealedPieces[idx] && (
                                                     <div className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                         ĐÃ MỞ
                                                     </div>
                                                 )}
                                                 {isDismissed && (
                                                     <div className="px-2 py-1 bg-red-900/20 border border-red-900/40 rounded text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                                                         <EyeOff size={10} /> ĐÃ QUA
                                                     </div>
                                                 )}

                                                <span className={`
                                                    w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm border
                                                    ${obstacle.revealedPieces[idx] 
                                                        ? 'bg-green-600/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                                                        : (isDismissed ? 'bg-red-900/10 border-red-900/30 text-red-700' : 'bg-slate-800 border-slate-700 text-slate-500')}
                                                `}>
                                                    {idx + 1}
                                                </span>
                                            </div>
                                            
                                            {/* Content Bubbles */}
                                            <div className="flex flex-wrap gap-1.5 direction-rtl">
                                                {length > 0 ? (
                                                     Array.from({ length }).map((_, charIdx) => (
                                                         <div 
                                                             key={charIdx}
                                                             className={`
                                                                 w-9 h-10 rounded-md flex items-center justify-center text-lg font-black transition-all border shadow-sm
                                                                 ${content 
                                                                     ? (obstacle.revealedPieces[idx] 
                                                                         ? 'bg-gradient-to-br from-green-600 to-green-800 border-green-400 text-white shadow-[0_2px_5px_rgba(0,0,0,0.3)]' // Solved
                                                                         : 'bg-slate-700/50 border-slate-600 text-slate-400') // Finished/Forced
                                                                     : (isDismissed 
                                                                         ? 'bg-slate-900 border-slate-800 text-transparent opacity-50 relative' // Dismissed Style
                                                                         : 'bg-slate-800/80 border-slate-700 text-slate-700')}
                                                             `}
                                                         >
                                                             {content ? (content[charIdx] || "").toUpperCase() : "?"}
                                                             {/* Lock Icon for Dismissed? Optional */}
                                                             {isDismissed && <div className="absolute inset-0 bg-red-900/10" />}
                                                         </div>
                                                     ))
                                                ) : <span className="text-slate-600 text-xs italic tracking-widest">HIDDEN</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                    </div>
                </div>

                <div className='w-full mt-6 flex gap-6 h-[180px]'>
                    {/* Active Question Box */}
                    <div className="flex-[4] bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20 group-hover:opacity-50 transition-opacity" />
                        
                        {obstacle.currentRowIndex >= 0 ? (
                            <>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                                        Hàng Ngang Số {obstacle.currentRowIndex + 1}
                                    </span>
                                    <span className="text-slate-600 text-xs font-mono">•</span>
                                    <span className="text-slate-400 text-xs font-mono uppercase">Length: {obstacle.currentRowLength}</span>
                                </div>
                                <p className="text-2xl md:text-3xl text-white text-center font-bold leading-relaxed max-w-4xl drop-shadow-sm">
                                    {obstacle.currentRowQuestion}
                                </p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 opacity-30">
                                <div className="w-12 h-12 rounded-full border-2 border-slate-500 flex items-center justify-center">
                                    <span className="text-2xl mb-1">?</span>
                                </div>
                                <p className="text-slate-400 font-light tracking-wider">Mời MC chọn hàng ngang</p>
                            </div>
                        )}
                    </div>

                    {/* Player Grid */}
                    <div className="flex-[3] grid grid-cols-2 lg:grid-cols-2 gap-3">
                        <MonitorPlayerGrid obstacle={obstacle} />
                    </div>
                </div>
            </div>

            {/* CNV BUZZER POPUP (Monitor View) */}
            <AnimatePresence>
                {obstacle.buzzerQueue.find(b => !b.isProcessed) && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                     >
                         <div className="bg-slate-900 border-4 border-amber-500 rounded-3xl p-12 max-w-3xl w-full shadow-[0_0_100px_rgba(245,158,11,0.5)] relative overflow-hidden flex flex-col items-center text-center">
                             {/* Background glow */}
                             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none" />
                             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none animate-pulse" />
                             
                             <div className="w-32 h-32 bg-amber-500 rounded-full flex items-center justify-center mb-8 animate-bounce shadow-[0_0_50px_rgba(245,158,11,0.6)] relative z-10">
                                 <Bell size={64} className="text-black fill-black" />
                             </div>
                             
                             <h2 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-wider relative z-10">
                                 CÓ TÍN HIỆU TRẢ LỜI!
                             </h2>
                             
                             <div className="bg-slate-800/80 border border-slate-700 px-8 py-6 rounded-2xl relative z-10 min-w-[300px]">
                                 <p className="text-slate-400 text-lg uppercase tracking-widest mb-2 font-bold">Thí sinh</p>
                                 <p className="text-5xl md:text-7xl font-black text-amber-500 drop-shadow-lg">
                                     {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                     {players?.find((p: any) => p._id === obstacle.buzzerQueue.find(b => !b.isProcessed)?.playerId)?.name || 'Unknown'}
                                 </p>
                             </div>

                             <p className="text-white/50 mt-8 font-mono animate-pulse relative z-10">Đang chờ MC xác nhận...</p>
                         </div>
                     </motion.div>
                )}
            </AnimatePresence>
        </GameRoundContainer>
    );
}

function MonitorPlayerGrid({ obstacle }: { obstacle: ObstacleState }) {
    const { players } = usePlayers(); 
    // Safety check if players hook works here, otherwise fallback to empty
    const activePlayers = players || [];

    return (
        <>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {activePlayers.map((player: any) => {
             const answer = obstacle.answers[player._id];
             const grading = obstacle.grading?.[player._id]; // 'CORRECT' | 'WRONG' | 'NONE'
             const isTyping = !answer && obstacle.status === 'THINKING';
             
             // Determine Styles
             let borderColor = "border-slate-700/50";
             let bgColor = "bg-slate-900/90";
             let answerBg = "bg-white";

             if (grading === 'CORRECT') {
                 borderColor = "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]";
                 bgColor = "bg-green-900/30";
                 answerBg = "bg-green-500 text-white border-green-400";
             } else if (grading === 'WRONG' || (obstacle.status === 'ROW_GRADING' && !answer)) {
                 // Explicit WRONG or Implicit WRONG (No Answer)
                 borderColor = "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
                 bgColor = "bg-red-900/30";
                 answerBg = "bg-red-500 text-white border-red-400";
             }

             return (
                 <div key={player._id} className={`${bgColor} border ${borderColor} p-3 rounded-xl flex flex-col shadow-lg relative overflow-hidden group transition-all duration-500 hover:border-slate-500/50`}>
                     {/* Answer Indicator */}
                     {answer && obstacle.status === 'THINKING' && (
                         <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                     )}
                     
                     {/* Grading Badge */}
                     {grading && (
                         <div className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg text-[10px] font-black uppercase tracking-wider ${grading === 'CORRECT' ? 'bg-green-500 text-black' : 'bg-red-600 text-white'}`}>
                             {grading === 'CORRECT' ? 'ĐÚNG' : 'SAI'}
                         </div>
                     )}

                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-700">
                            {player.pin || "?"}
                        </div>
                        <span className="text-slate-300 font-bold text-sm truncate">{player.name}</span>
                     </div>
                     
                     <div className={`
                        flex-1 rounded-lg flex items-center justify-center font-black text-lg border transition-all duration-500
                        ${answer 
                            ? (obstacle.status === 'THINKING' 
                                ? 'bg-slate-800/50 border-slate-700 text-slate-600' 
                                : `${answerBg} border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] text-black scale-[1.02]`) 
                            : 'bg-black/20 border-dashed border-slate-800 text-slate-700'}
                     `}>
                         {obstacle.status === 'THINKING' && !answer && isTyping && (
                             <span className="animate-pulse text-xs text-slate-600">Thinking...</span>
                         )}
                         {answer && obstacle.status === 'THINKING' && (
                             <span className="text-2xl">🔒</span>
                         )}
                         {answer && obstacle.status !== 'THINKING' && answer}
                         {!answer && obstacle.status !== 'THINKING' && "-"}
                     </div>
                 </div>
             );
        })}
        </>
    );
}

function MonitorRankingList() {
    const { players } = usePlayers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedPlayers = [...(players || [])].sort((a: any, b: any) => b.scores.total - a.scores.total);

    return (
        <div className="flex flex-col gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {sortedPlayers.map((player: any, index: number) => (
                <div key={player._id} className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800 animate-in slide-in-from-right fade-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className={`
                        w-12 h-12 rounded-lg flex items-center justify-center font-black text-xl border-2 shadow-lg
                        ${index === 0 ? 'bg-yellow-500 border-yellow-300 text-black' : 
                          index === 1 ? 'bg-slate-400 border-slate-300 text-black' : 
                          index === 2 ? 'bg-amber-700 border-amber-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}
                    `}>
                        {index + 1}
                    </div>
                    <div className="flex-1">
                        <div className="text-lg font-bold text-white">{player.name}</div>
                        <div className="text-xs text-slate-500 font-mono">PIN: {player.pin || "N/A"}</div>
                    </div>
                    <div className="text-3xl font-black text-amber-500 font-mono">
                        {player.scores.total}
                    </div>
                </div>
            ))}
        </div>
    );
}
