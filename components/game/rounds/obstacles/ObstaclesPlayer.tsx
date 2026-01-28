import React from 'react';
import { useSocketContext } from "@/components/providers/SocketProvider";
import GameRoundContainer from "../../GameRoundContainer";
import { ObstacleState } from "@/server/game/GameConstants";
import { Check, X } from "lucide-react";
import MiniRankingBoard from "../../MiniRankingBoard";
import { motion, AnimatePresence } from "framer-motion";

interface ObstaclesPlayerProps {
    obstacle: ObstacleState;
}

export default function ObstaclesPlayer({ obstacle }: ObstaclesPlayerProps) {
    const { socket } = useSocketContext();
    const [myAnswer, setMyAnswer] = React.useState("");
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    
    // Get Persistent Player ID
    const [playerId, setPlayerId] = React.useState<string>("");

    React.useEffect(() => {
        const storedId = localStorage.getItem("olympia_player_id");
        if (storedId) setPlayerId(storedId);
        else if (socket?.id) setPlayerId(socket.id);
    }, [socket?.id]);

    // Reset answer
    React.useEffect(() => {
        setMyAnswer("");
        setIsSubmitted(false);
    }, [obstacle.currentRowIndex, obstacle.status]);

    const handleSubmitAnswer = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!myAnswer.trim()) return;
        // Use ID
        socket?.emit('player_obstacle_answer', { playerId: playerId || socket?.id, answer: myAnswer });
        setIsSubmitted(true);
    };

    const isEliminated = obstacle.eliminatedPlayerIds.includes(playerId || socket?.id || '');
    const myAnswerRecorded = obstacle.answers[playerId || socket?.id || ''];
    
    // Use Server Grading instead of Local Calculation
    const grading = obstacle.grading?.[playerId || socket?.id || ''];
    // Re-introduce isRowRevealed for UI logic
    const isRowRevealed = obstacle.rowContents?.[obstacle.currentRowIndex];


    // Animation Logic
    const [showCorrectAnim, setShowCorrectAnim] = React.useState(false);
    const prevGradingRef = React.useRef<string | undefined>(undefined);
    
    React.useEffect(() => {
        if (grading === 'CORRECT' && prevGradingRef.current !== 'CORRECT') {
             setShowCorrectAnim(true);
             const timer = setTimeout(() => setShowCorrectAnim(false), 3000);
             return () => clearTimeout(timer);
        }
        prevGradingRef.current = grading;
    }, [grading]);

    if (!obstacle) return null;

    // PLAYER FINISHED VIEW
    if (obstacle.status === 'FINISHED') {
        return (
            <GameRoundContainer className="text-amber-500" fullWidth>
                <MiniRankingBoard />
                <div className="flex flex-col items-center justify-center h-full w-full gap-8 p-8 animate-fade-in relative z-10">
                     <div className="text-center">
                         <div className="inline-block px-4 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest border border-slate-700 mb-4">
                             Vòng thi kết thúc
                         </div>
                         <h1 className="text-5xl md:text-7xl font-black text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)] uppercase">
                             {obstacle.finalCNV}
                         </h1>
                         <p className="text-white/60 font-medium mt-2">Từ khóa chướng ngại vật</p>
                     </div>

                     <div className="w-full max-w-2xl aspect-video bg-slate-900 rounded-2xl border-4 border-amber-500/30 overflow-hidden shadow-2xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={obstacle.currentImage || "/placeholder.jpg"} className="w-full h-full object-cover" alt="Result"/>
                     </div>

                     <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-6 py-4 rounded-xl text-center">
                         <p className="text-white font-bold">Vui lòng chờ MC chuyển sang phần thi tiếp theo</p>
                         <p className="text-slate-500 text-sm mt-1">Chuẩn bị cho: TĂNG TỐC</p>
                     </div>
                </div>
            </GameRoundContainer>
        );
    }

    return (
        <GameRoundContainer className="text-amber-500" fullWidth>
            <MiniRankingBoard />
            
            <AnimatePresence>
                {showCorrectAnim && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -50 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-green-600/90 backdrop-blur-md border-4 border-green-400 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-bounce-subtle">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <Check size={60} className="text-green-600 stroke-[4px]" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-5xl font-black text-white uppercase drop-shadow-md">Chính Xác!</h2>
                                <p className="text-white/90 text-xl font-bold mt-2 font-mono">+10 ĐIỂM</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN LAYOUT */ }
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 h-full pb-24 relative z-0">
                
                {/* LEFT: IMAGE BOARD (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col justify-center">
                     <div className="w-full aspect-video bg-slate-900 border-4 border-slate-800 rounded-3xl relative overflow-hidden shadow-2xl shadow-black">
                         {/* MAIN IMAGE */}
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img 
                            src={obstacle.currentImage || "/placeholder.jpg"} 
                            onError={(e) => { e.currentTarget.src = "https://placehold.co/800x450?text=No+Image"; }}
                            alt="CNV" 
                            className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-1000 ${obstacle.imageRevealed ? 'opacity-100' : 'opacity-100'}`} 
                         />

                         {/* MASK OVERLAYS - Uniform Style */}
                         {!obstacle.imageRevealed && (
                             <>
                                {/* Piece 1 (TL) */}
                                <div 
                                    className={`absolute top-0 left-0 w-[50.2%] h-[50.2%] bg-slate-800 border-r border-b border-slate-900 flex items-center justify-center transition-all duration-700 z-10 
                                    ${obstacle.revealedPieces[0] ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
                                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }}
                                >
                                    <span className="text-6xl font-black text-slate-700 select-none">1</span>
                                </div>
                                {/* Piece 2 (TR) */}
                                <div 
                                    className={`absolute top-0 right-0 w-[50.2%] h-[50.2%] bg-slate-800 border-l border-b border-slate-900 flex items-center justify-center transition-all duration-700 z-10 
                                    ${obstacle.revealedPieces[1] ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
                                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 20% 100%, 0 80%)' }}
                                >
                                    <span className="text-6xl font-black text-slate-700 select-none">2</span>
                                </div>
                                {/* Piece 3 (BR) */}
                                <div 
                                    className={`absolute bottom-0 right-0 w-[50.2%] h-[50.2%] bg-slate-800 border-l border-t border-slate-900 flex items-center justify-center transition-all duration-700 z-10 
                                    ${obstacle.revealedPieces[2] ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
                                    style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}
                                >
                                    <span className="text-6xl font-black text-slate-700 select-none">3</span>
                                </div>
                                {/* Piece 4 (BL) */}
                                <div 
                                    className={`absolute bottom-0 left-0 w-[50.2%] h-[50.2%] bg-slate-800 border-r border-t border-slate-900 flex items-center justify-center transition-all duration-700 z-10 
                                    ${obstacle.revealedPieces[3] ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
                                    style={{ clipPath: 'polygon(0 0, 80% 0, 100% 20%, 100% 100%, 0 100%)' }}
                                >
                                    <span className="text-6xl font-black text-slate-700 select-none">4</span>
                                </div>
                                {/* Center (CNV) - Blend in */}
                                <div 
                                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] aspect-square bg-slate-900 border-4 border-slate-700 flex items-center justify-center transition-all duration-500 z-20 shadow-2xl rotate-45
                                    ${obstacle.revealedPieces[4] ? 'opacity-0 scale-150' : 'opacity-100 scale-100'}`}
                                >
                                     {/* Center Icon? */}
                                </div>
                             </>
                         )}
                    </div>
                </div>

                {/* RIGHT: ROWS (Tech List) & INTERACTION */}
                <div className="lg:col-span-5 flex flex-col h-full relative">
                    
                    {/* 1. TECH BUBBLE ROW LIST (Always Visible) */}
                    <div className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 overflow-y-auto mb-4 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-amber-500 font-black text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>
                                Dữ liệu hàng ngang
                            </h3>
                            <div className="text-[10px] text-slate-500 font-mono">
                                DECIPHERING...
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {[0, 1, 2, 3].map(idx => {
                                const length = obstacle.rowLengths?.[idx] || 0;
                                const content = obstacle.rowContents?.[idx] || "";
                                const isCurrent = obstacle.currentRowIndex === idx;
                                const isDismissed = !content && obstacle.rowResults && obstacle.rowResults[idx];

                                return (
                                    <div key={idx} className={`
                                        p-3 rounded-xl border transition-all duration-500 relative
                                        ${isCurrent 
                                            ? 'bg-amber-900/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                            : (content || isDismissed 
                                                ? 'bg-slate-800/20 border-slate-700/50 opacity-80' 
                                                : 'bg-slate-800/40 border-slate-700/50')}
                                    `}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`
                                                w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors
                                                ${isCurrent ? 'bg-amber-500 text-black' : (isDismissed ? 'bg-red-900/20 text-red-700' : 'bg-slate-700 text-slate-400')}
                                            `}>
                                                {idx + 1}
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-amber-400' : 'text-slate-500'}`}>
                                                {isCurrent ? 'Đang giải mã...' : `Hàng ngang số ${idx + 1}`}
                                            </span>
                                            {obstacle.revealedPieces[idx] && <Check size={14} className="text-green-500 ml-auto" />}
                                            {/* Finished but not solved */}
                                            {content && !obstacle.revealedPieces[idx] && (
                                                <span className="ml-auto text-[10px] font-bold text-slate-500 uppercase border border-slate-700 px-2 rounded bg-slate-800">Đã mở</span>
                                            )}
                                            {isDismissed && (
                                                <span className="ml-auto text-[10px] font-bold text-red-500 uppercase border border-red-900/30 px-2 rounded bg-red-900/10">Đã qua</span>
                                            )}
                                        </div>
                                        
                                        {/* BUBBLES */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {length > 0 ? (
                                                Array.from({ length }).map((_, charIdx) => (
                                                    <div 
                                                        key={charIdx}
                                                        className={`
                                                            w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-lg md:text-xl font-bold transition-all duration-500 border
                                                            ${content 
                                                                ? (obstacle.revealedPieces[idx]
                                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-700 text-white border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)] scale-100 rotate-0' // Solved
                                                                    : 'bg-slate-800 text-slate-500 border-slate-700 scale-100') // Finished
                                                                : (isDismissed 
                                                                    ? 'bg-slate-900 border-slate-800 text-transparent opacity-50 relative' // Dismissed
                                                                    : (isCurrent
                                                                        ? 'bg-slate-800/80 border-amber-500/50 text-transparent shadow-[0_0_10px_rgba(245,158,11,0.1)] animate-pulse' 
                                                                        : 'bg-slate-900/50 border-slate-800 text-transparent'))}
                                                        `}
                                                    >
                                                        {content ? (content[charIdx] || "").toUpperCase() : "?"}
                                                        {isDismissed && (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-900/40" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex gap-1 animate-pulse">
                                                    <span className="w-2 h-2 rounded-full bg-slate-700"/>
                                                    <span className="w-2 h-2 rounded-full bg-slate-700 delay-75"/>
                                                    <span className="w-2 h-2 rounded-full bg-slate-700 delay-150"/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>



                    {/* 2. QUESTION & INPUT (Bottom/Floating) */}
                    {(obstacle.status === 'THINKING' || (isRowRevealed && myAnswerRecorded)) && (
                        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl relative animate-in slide-in-from-bottom-5 fade-in duration-300">
                             
                             {obstacle.status === 'THINKING' ? (
                                 <>
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                                CÂU HỎI {obstacle.currentRowIndex + 1}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"/>
                                            <span className="font-mono text-red-500 font-bold text-xl">{obstacle.timer}s</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4 max-h-[100px] overflow-y-auto custom-scrollbar">
                                        <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
                                            {obstacle.currentRowQuestion}
                                        </p>
                                    </div>

                                    {/* INPUT */}
                                    {!isEliminated ? (
                                        isSubmitted ? (
                                            <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-600">
                                                <p className="text-slate-400 text-[10px] uppercase mb-1">Đã gửi câu trả lời</p>
                                                <p className="text-2xl font-black text-amber-500 uppercase tracking-widest">{myAnswer}</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmitAnswer} className="relative flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={myAnswer}
                                                    onChange={(e) => setMyAnswer(e.target.value.toUpperCase())}
                                                    placeholder="NHẬP ĐÁP ÁN..."
                                                    className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-amber-500 text-white text-xl font-bold py-3 px-4 rounded-xl outline-none text-center tracking-widest placeholder:text-slate-700 transition-colors uppercase"
                                                    autoFocus
                                                />
                                                <button type="submit" className="bg-amber-600 hover:bg-amber-500 px-6 rounded-xl font-bold text-white uppercase text-sm transition-colors shadow-lg shadow-amber-900/40 active:scale-95">Gửi</button>
                                            </form>
                                        )
                                    ) : (
                                        <div className="text-red-500 font-bold text-center border border-red-900/30 p-3 rounded-xl bg-red-900/10 text-sm uppercase tracking-wider">
                                            Bạn đã bị loại
                                        </div>
                                    )}
                                 </>
                             ) : (
                                 /* RESULT REVIEW */
                                 <div className="text-center py-1">
                                     <div className="flex items-center justify-center gap-2 mb-2">
                                         <span className="text-slate-500 text-[10px] uppercase font-bold">Đáp án hàng ngang</span>
                                         <div className="h-px w-12 bg-slate-800"/>
                                     </div>
                                     <div className="text-2xl font-black text-white mb-3 tracking-[0.2em] uppercase text-shadow-glow">
                                         {obstacle.rowContents?.[obstacle.currentRowIndex] || "???"}
                                     </div>
                                     {myAnswerRecorded && grading && (
                                         <div className={`
                                            inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border shadow-inner
                                            ${grading === 'CORRECT' 
                                                ? 'bg-green-500/10 border-green-500 text-green-400' 
                                                : 'bg-red-500/10 border-red-500 text-red-500'}
                                         `}>
                                             <span>BẠN TRẢ LỜI: {myAnswerRecorded}</span>
                                             {grading === 'CORRECT' ? <Check size={14}/> : <X size={14}/>}
                                         </div>
                                     )}
                                     {/* Case Explicit Wrong or Implicit Wrong (No Answer) */}
                                     {(!myAnswerRecorded || (myAnswerRecorded && !grading)) && (
                                         <div className={`
                                            inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border shadow-inner
                                            ${(!myAnswerRecorded || (grading === 'WRONG')) 
                                                ? 'bg-red-500/10 border-red-500 text-red-500' // Fail
                                                : 'border-slate-700 text-slate-500'} // Pending/Neutral
                                         `}>
                                             {!myAnswerRecorded ? "KHÔNG CÓ CÂU TRẢ LỜI" : `ĐÃ GHI NHẬN: ${myAnswerRecorded}`}
                                             {(!myAnswerRecorded || grading === 'WRONG') && <X size={14}/>}
                                         </div>
                                     )}
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
             
            {/* CNV BUZZER FAB - REDESIGNED */}
            <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={() => {
                            if (confirm("XÁC NHẬN TRẢ LỜI CHƯỚNG NGẠI VẬT? \n(Nếu sai bạn sẽ bị loại khỏi phần thi này)")) {
                                socket?.emit('player_obstacle_buzz', { playerId: playerId || socket?.id });
                            }
                        }} 
                        disabled={obstacle.cnvLocked || isEliminated}
                        className={`
                            group relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 shadow-2xl transition-all duration-300 active:scale-95 flex flex-col items-center justify-center overflow-hidden
                            ${obstacle.cnvLocked || isEliminated
                                ? 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed grayscale' 
                                : 'bg-gradient-to-b from-rose-600 to-red-700 border-red-400 hover:brightness-110 cursor-pointer shadow-red-900/50 hover:shadow-red-600/50'}
                        `}
                    >
                        {/* Inner Ring */}
                        <div className={`absolute inset-1 rounded-full border-2 border-white/20 ${!obstacle.cnvLocked && !isEliminated && 'animate-spin-slow'}`} />
                        
                        {/* Icon/Text */}
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-8 h-8 md:w-10 md:h-10 mb-1">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-md">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/>
                                </svg>
                            </div>
                            <span className="font-black text-[10px] md:text-xs text-white uppercase tracking-wider leading-none">Trả lời</span>
                            <span className="font-black text-sm md:text-lg text-white uppercase tracking-tighter leading-none">CNV</span>
                        </div>
                    </button>
            </div>
        </GameRoundContainer>
    );
}
