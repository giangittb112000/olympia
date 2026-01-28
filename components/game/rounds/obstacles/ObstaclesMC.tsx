import React from 'react';
import { useSocketContext } from "@/components/providers/SocketProvider";
import GameRoundContainer from "../../GameRoundContainer";
import { ObstacleState } from "@/server/game/GameConstants";
import { Check, X, Bell, Image as ImageIcon, Eye, Clock, ArrowLeftCircle, EyeOff } from "lucide-react";
import MiniRankingBoard from "../../MiniRankingBoard";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayers, type Player } from "@/hooks/usePlayers";

interface ObstaclesMCProps {
    obstacle: ObstacleState;
}

export default function ObstaclesMC({ obstacle }: ObstaclesMCProps) {
    const { socket } = useSocketContext();
    const { players } = usePlayers(); 

    const handleSelectRow = (rowIndex: number) => {
        if (obstacle.status !== 'IDLE' && obstacle.status !== 'SHOW_ROW') {
             if (!confirm("Đang trong lượt chơi, bạn có chắc muốn chuyển câu hỏi?")) return;
        }
        socket?.emit('mc_obstacle_select_row', { rowIndex });
    };

    const handleStartTimer = () => {
        socket?.emit('mc_obstacle_start_timer');
    };

    const handleGradePlayer = (playerId: string, isCorrect: boolean) => {
        socket?.emit('mc_obstacle_grade_player', { playerId, isCorrect });
    };

    const handleOpenPiece = (index: number) => {
        socket?.emit('mc_obstacle_open_piece', { pieceIndex: index });
    };

    const handleFinishRow = () => {
        if (confirm("Xác nhận hiện đáp án hàng ngang này? \n(Sẽ KHÔNG mở mảnh ghép hình ảnh)")) {
            socket?.emit('mc_obstacle_finish_row');
        }
    };
        
    const handleSolveCNV = (playerId: string, isCorrect: boolean) => {
         // Show confirm dialog
         if(confirm(`Xác nhận ${isCorrect ? 'ĐÚNG' : 'SAI'} cho thí sinh này?`)) {
             socket?.emit('mc_obstacle_solve_cnv', { playerId, isCorrect });
         }
    };
    
    const handleShowImage = () => {
        if(confirm("Bạn có chắc chắn muốn mở toàn bộ hình ảnh?")) {
            socket?.emit('mc_obstacle_show_image');
        }
    };

    // Sort Buzzer Queue
    const activeBuzz = obstacle.buzzerQueue.find(b => !b.isProcessed);

    // MC FINISHED VIEW
    if (obstacle.status === 'FINISHED') {
        return (
            <GameRoundContainer className="text-slate-100" fullWidth>
                <MiniRankingBoard />
                
                <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in pb-12">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/30 mb-4 font-bold uppercase text-xs tracking-wider">
                            <Check size={14} /> Vòng thi đã hoàn tất
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] uppercase tracking-tight">
                            {obstacle.finalCNV}
                        </h1>
                        <p className="text-slate-400 font-mono mt-2">TỪ KHÓA CHƯỚNG NGẠI VẬT</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl items-center">
                         {/* Image Review */}
                         <div className="aspect-video bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-2xl relative overflow-hidden group">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={obstacle.currentImage || "/placeholder.jpg"} className="w-full h-full object-cover" alt="Result"/>
                             <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center text-xs text-white backdrop-blur-sm">
                                 HÌNH ẢNH GỐC
                             </div>
                         </div>

                         {/* Navigation Controls */}
                         <div className="flex flex-col gap-4">
                             <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 mb-4">
                                 <h3 className="text-slate-400 font-bold text-sm uppercase mb-3">Điều hướng tiếp theo</h3>
                                 <button 
                                     onClick={() => socket?.emit('mc_set_phase', 'ACCELERATION')}
                                     className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                 >
                                     VÀO VÒNG TĂNG TỐC &rarr;
                                 </button>
                             </div>
                             
                             <button
                                  onClick={() => socket?.emit('mc_set_phase', 'IDLE')}
                                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-sm rounded-xl border border-slate-700 transition-colors"
                             >
                                 QUAY VỀ TRẠNG THÁI CHỜ (IDLE)
                             </button>
                         </div>
                    </div>
                </div>
            </GameRoundContainer>
        );
    }

    return (
        <GameRoundContainer className="text-slate-100" fullWidth>
            <MiniRankingBoard />

            {/* HEADER */}
            <div className="w-full flex justify-between items-center mb-6 pl-4 border-l-4 border-amber-500">
                <div>
                    <h1 className="text-4xl font-black font-display text-white">VƯỢT CHƯỚNG NGẠI VẬT</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm font-mono text-slate-400">
                         <span className={`px-2 py-1 rounded ${obstacle.status === 'THINKING' ? 'bg-amber-500/20 text-amber-500 animate-pulse' : 'bg-slate-800'}`}>
                             STATUS: {obstacle.status}
                         </span>
                         <span>TIMER: {obstacle.timer}s</span>
                         <span>ROW: {obstacle.currentRowIndex >= 0 ? obstacle.currentRowIndex + 1 : 'NONE'}</span>
                    </div>
                </div>
                
                {/* GLOBAL CONTROLS */}
                <div className="flex gap-2">
                    <button 
                        onClick={handleShowImage}
                        className="bg-purple-900/50 hover:bg-purple-600 border border-purple-500/50 text-purple-200 px-4 py-2 rounded font-bold flex items-center gap-2 text-sm"
                    >
                        <ImageIcon size={16} /> Mở Hình Ảnh
                    </button>
                    <button 
                         onClick={() => socket?.emit('mc_set_phase', 'IDLE')}
                         className="bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 px-4 py-2 rounded font-bold text-sm border border-slate-700 transition-colors"
                    >
                        KẾT THÚC VÒNG
                    </button>
                </div>
            </div>

            {/* MAIN LAYOUT: 2 ROWS */}
            <div className="w-full flex flex-col h-full gap-6 pb-8">
                
                {/* ROW 1: GAMEVIEW (Image) + PLAYERS (Action) */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px]">
                    {/* TOP LEFT: IMAGE BOARD (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col gap-4 items-center justify-center bg-slate-900/30 rounded-2xl border border-slate-800/50 p-2">
                         <div className="w-full aspect-video bg-slate-900/80 border border-slate-800 rounded-xl relative overflow-hidden group flex items-center justify-center shadow-lg shadow-black/50">
                             {/* MAIN IMAGE */}
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img 
                                src={obstacle.currentImage || "/placeholder.jpg"} 
                                onError={(e) => { e.currentTarget.src = "https://placehold.co/800x450?text=No+Image"; }}
                                alt="CNV" 
                                className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-1000 ${obstacle.imageRevealed ? 'opacity-100' : 'opacity-100'}`} 
                             />
    
                             {/* MASK OVERLAYS */}
                             {!obstacle.imageRevealed && (
                                 <>
                                    {/* TL (0) */}
                                    <div 
                                        className={`absolute top-0 left-0 w-[50.2%] h-[50.2%] bg-slate-800 border-r border-b border-slate-900/50 flex items-center justify-center transition-opacity duration-500 z-10 
                                        ${obstacle.revealedPieces[0] ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }}
                                    >
                                        <span className="text-4xl font-bold text-slate-600 -translate-x-2 -translate-y-2">1</span>
                                    </div>
                                    {/* TR (1) */}
                                    <div 
                                        className={`absolute top-0 right-0 w-[50.2%] h-[50.2%] bg-slate-800 border-l border-b border-slate-900/50 flex items-center justify-center transition-opacity duration-500 z-10 
                                        ${obstacle.revealedPieces[1] ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 20% 100%, 0 80%)' }}
                                    >
                                        <span className="text-4xl font-bold text-slate-600 translate-x-2 -translate-y-2">2</span>
                                    </div>
                                    {/* BR (2) */}
                                    <div 
                                        className={`absolute bottom-0 right-0 w-[50.2%] h-[50.2%] bg-slate-800 border-l border-t border-slate-900/50 flex items-center justify-center transition-opacity duration-500 z-10 
                                        ${obstacle.revealedPieces[2] ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                        style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}
                                    >
                                        <span className="text-4xl font-bold text-slate-600 translate-x-2 translate-y-2">3</span>
                                    </div>
                                    {/* BL (3) */}
                                    <div 
                                        className={`absolute bottom-0 left-0 w-[50.2%] h-[50.2%] bg-slate-800 border-r border-t border-slate-900/50 flex items-center justify-center transition-opacity duration-500 z-10 
                                        ${obstacle.revealedPieces[3] ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                        style={{ clipPath: 'polygon(0 0, 80% 0, 100% 20%, 100% 100%, 0 100%)' }}
                                    >
                                        <span className="text-4xl font-bold text-slate-600 -translate-x-2 translate-y-2">4</span>
                                    </div>
                                    {/* CENTER (4) - Diamond */}
                                    <div 
                                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] aspect-square bg-slate-900 border-4 border-amber-500/50 flex items-center justify-center transition-opacity duration-300 z-20 shadow-2xl rotate-45
                                        ${obstacle.revealedPieces[4] ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                    >
                                         <span className="text-amber-500 font-black text-xl -rotate-45">CNV</span>
                                    </div>
                                 </>
                             )}
                        </div>
                        {/* Manual Controls Row */}
                        <div className="grid grid-cols-5 gap-2 px-2">
                             {[0, 1, 2, 3, 4].map(idx => (
                                 <button
                                     key={idx}
                                     onClick={() => handleOpenPiece(idx)}
                                     className={`
                                         py-1 px-1 rounded font-bold text-[10px] uppercase flex justify-center items-center gap-1 border transition-colors
                                         ${obstacle.revealedPieces[idx] 
                                             ? 'bg-green-900/10 border-green-900/30 text-green-700' 
                                             : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-amber-500 hover:text-amber-500'}
                                     `}
                                 >
                                     <Eye size={10} /> {idx === 4 ? 'CNV' : `Góc ${idx+1}`}
                                 </button>
                             ))}
                        </div>
                    </div>

                    {/* TOP RIGHT: PLAYERS GRID (7 cols) */}
                    <div className="lg:col-span-7 bg-slate-900/50 rounded-2xl p-3 border border-slate-800 flex flex-col">
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2 px-1 flex justify-between items-center">
                            <span>Thí Sinh & Trả Lời</span>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500">Live Monitor</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto pr-1">
                            {(players || []).map((player: Player, index: number) => {
                                 const answer = obstacle.answers[player._id];
                                 const grading = obstacle.grading?.[player._id]; // 'CORRECT' | 'WRONG' | 'NONE'
                                 const isTyping = !answer && obstacle.status === 'THINKING'; 
                                 
                                 // Determine Border/Bg Color based on Grading
                                 let borderColor = "border-slate-800";
                                 let bgColor = "bg-slate-900";
                                 if (grading === 'CORRECT') {
                                     borderColor = "border-green-500";
                                     bgColor = "bg-green-900/20";
                                 } else if (grading === 'WRONG' || (obstacle.status === 'ROW_GRADING' && !answer)) {
                                     // Default to Wrong if no answer during grading
                                     borderColor = "border-red-500";
                                     bgColor = "bg-red-900/20";
                                 } else if (answer) {
                                     borderColor = "border-amber-500/50";
                                     bgColor = "bg-slate-800";
                                 }

                                 return (
                                     <div key={player._id} className={`${bgColor} border-2 ${borderColor} p-3 rounded-xl flex flex-col justify-between gap-2 shadow-lg relative overflow-hidden transition-all duration-300`}>
                                         
                                         {/* Header */}
                                         <div className="flex justify-between items-start z-10">
                                             <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center font-black text-slate-500 text-sm border border-slate-800 shadow-inner">
                                                    {player.pin || (index + 1)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-base text-white leading-tight truncate w-[120px]">{player.name}</span>
                                                    <span className="text-xs text-amber-500 font-mono font-bold leading-none">{player.scores.total} điểm</span>
                                                </div>
                                             </div>
                                             {/* Grading Status Badge */}
                                             {grading && (
                                                 <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${grading === 'CORRECT' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                                     {grading === 'CORRECT' ? 'ĐÚNG' : 'SAI'}
                                                 </div>
                                             )}
                                         </div>
                                         
                                         {/* Answer Area */}
                                         <div className={`
                                            w-full rounded-lg flex items-center justify-center text-center py-3 px-2 border-2 transition-all relative overflow-hidden min-h-[60px]
                                            ${answer 
                                                ? (grading === 'CORRECT' ? 'bg-green-500/10 border-green-500/50 text-green-400' : (grading === 'WRONG' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-slate-800 border-slate-600 text-white'))
                                                : 'bg-slate-950/30 border-slate-800 text-slate-600 dashed-border'}
                                         `}>
                                             {answer ? (
                                                 <span className="text-xl md:text-2xl font-black uppercase tracking-widest break-words leading-none">{answer}</span>
                                             ) : (
                                                 isTyping ? <span className="animate-pulse text-xs text-slate-500 flex items-center gap-1">Đang suy nghĩ...</span> : <span className="text-xl opacity-20">---</span>
                                             )}
                                         </div>
    
                                         {/* Grading Controls (Only show if answered and not yet graded correctly - actually allow re-grading anytime) */}
                                         {/* STRICT RULE: Only allow grading when Timer is Finished (ROW_GRADING) */}
                                         {obstacle.status === 'ROW_GRADING' && (
                                             <div className="grid grid-cols-2 gap-2 mt-1">
                                                 <button 
                                                     onClick={() => handleGradePlayer(player._id, true)}
                                                     disabled={grading === 'CORRECT'}
                                                     className={`
                                                        py-2 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-1 transition-all
                                                        ${grading === 'CORRECT' ? 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg active:scale-95'}
                                                     `}
                                                 >
                                                     <Check size={16} /> ĐÚNG
                                                 </button>
                                                 <button 
                                                     onClick={() => handleGradePlayer(player._id, false)}
                                                     disabled={grading === 'WRONG'}
                                                     className={`
                                                        py-2 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-1 transition-all
                                                        ${grading === 'WRONG' ? 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : 'bg-rose-700 hover:bg-rose-600 text-white shadow-lg active:scale-95'}
                                                     `}
                                                 >
                                                     <X size={16} /> SAI
                                                 </button>
                                             </div>
                                         )}
                                     </div>
                                 );
                            })}
                        </div>
                    </div>
                </div>

                {/* ROW 2: CONTROLS (Row List & Question) */}
                <div className="h-[280px] grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* BOTTOM LEFT: ROW LIST (4 Cols) */}
                    <div className="lg:col-span-4 flex flex-col gap-2 h-full overflow-y-auto pr-1">
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1 px-1">Chọn Hàng Ngang</h3>
                        <div className="flex flex-col gap-2">
                             {[0, 1, 2, 3].map(idx => {
                                 const length = obstacle.rowLengths?.[idx] || 0;
                                 const content = obstacle.rowContents?.[idx] || "";
                                 const isSolved = !!content; // Content revealed = Solved/Finished (green/slate)
                                 const isDismissed = !content && obstacle.rowResults && obstacle.rowResults[idx]; // No content but has result = Dismissed
                                 const isCurrent = obstacle.currentRowIndex === idx;

                                 return (
                                     <button 
                                         key={idx}
                                         onClick={() => (!isSolved && !isDismissed) && handleSelectRow(idx)}
                                         disabled={isSolved || !!isDismissed}
                                         className={`
                                             group p-2 rounded-xl border transition-all text-left relative overflow-hidden
                                             ${(isSolved || isDismissed) 
                                                 ? 'bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed' 
                                                 : (isCurrent 
                                                     ? 'bg-amber-900/10 border-amber-500/50 hover:bg-amber-900/20' 
                                                     : 'bg-transparent border-transparent hover:bg-slate-800 hover:border-slate-700')}
                                         `}
                                     >
                                         <div className="flex items-center gap-2 mb-1">
                                             <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${isCurrent ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                                                 {idx + 1}
                                             </div>
                                             <span className={`text-xs font-bold ${isCurrent ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                                 Hàng ngang số {idx + 1}
                                             </span>
                                             {obstacle.revealedPieces[idx] && <Check size={12} className="text-green-500 ml-auto"/>}
                                             {isSolved && !obstacle.revealedPieces[idx] && (
                                                <span className="ml-auto text-[10px] font-bold text-slate-500 uppercase border border-slate-700 px-2 rounded bg-slate-950">Đã mở</span>
                                             )}
                                             {isDismissed && (
                                                 <span className="ml-auto text-[10px] font-bold text-red-500 uppercase border border-red-900/30 px-2 rounded bg-red-900/10 flex items-center gap-1">
                                                     <EyeOff size={10} /> ĐÃ QUA
                                                 </span>
                                             )}
                                         </div>

                                         {/* BUBBLES */}
                                         <div className="flex flex-wrap gap-1">
                                             {length > 0 ? (
                                                 Array.from({ length }).map((_, charIdx) => (
                                                     <div 
                                                         key={charIdx}
                                                         className={`
                                                             w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                                             ${content 
                                                                 ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                                                                 : 'bg-slate-800 text-slate-700 border border-slate-700'}
                                                             ${content && obstacle.revealedPieces[idx] ? 'bg-green-600 text-white border-green-500' : ''}
                                                         `}
                                                     >
                                                         {content ? (content[charIdx] || "").toUpperCase() : ""}
                                                     </div>
                                                 ))
                                             ) : <span className="text-[10px] text-slate-600 italic">No Data</span>}
                                         </div>
                                     </button>
                                 );
                             })}
                        </div>
                    </div>

                    {/* BOTTOM RIGHT: ACTIVE QUESTION (8 Cols) */}
                    <div className="lg:col-span-8 bg-slate-900 border border-slate-700 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl">
                         {/* Background Elements */}
                         <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                         
                         {obstacle.currentRowIndex >= 0 ? (
                             <>
                                 <div className="flex justify-between items-start z-10">
                                     <div className="flex flex-col gap-1">
                                         <div className="flex items-center gap-2">
                                             <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-xs font-black uppercase tracking-wider border border-amber-500/20">Câu hỏi hàng ngang {obstacle.currentRowIndex + 1}</span>
                                             <span className="text-slate-500 text-xs font-mono">ID: #{obstacle.currentRowIndex + 1}02</span>
                                         </div>
                                         <h2 className="text-sm text-slate-400">Nội dung câu hỏi:</h2>
                                     </div>
                                     <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 flex flex-col items-center">
                                         <span className="text-[10px] text-slate-500 uppercase font-bold">Length</span>
                                         <span className="text-lg font-mono font-black text-white leading-none">{obstacle.currentRowLength}</span>
                                     </div>
                                 </div>
                                 
                                 <div className="flex-1 flex items-center justify-center py-4 z-10">
                                     <p className="text-2xl md:text-3xl font-bold text-white text-center leading-relaxed max-w-4xl">
                                         {obstacle.currentRowQuestion}
                                     </p>
                                 </div>
                                 
                                 <div className="z-10 mt-2">
                                     {/* Logic: If Solved -> Show Keyword/Status. If Not -> Show Timer Control */}
                                     {obstacle.rowContents?.[obstacle.currentRowIndex] ? (
                                         <div className="w-full h-14 bg-green-900/40 border border-green-500/50 rounded-xl flex items-center justify-center gap-2">
                                             <Check className="text-green-500" />
                                             <span className="text-green-400 font-bold uppercase tracking-wider">Hàng ngang đã được giải</span>
                                         </div>
                                     ) : (
                                         obstacle.status === 'THINKING' ? (
                                             <div className="flex flex-col w-full gap-2">
                                                  <div className="w-full h-14 bg-slate-800 rounded-xl font-bold text-2xl flex items-center justify-center gap-4 text-amber-500 border border-amber-500/30 relative overflow-hidden">
                                                       <div className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-1000 ease-linear" style={{ width: `${(obstacle.timer / 15) * 100}%` }} />
                                                       <span className="animate-ping w-2 h-2 rounded-full bg-amber-500" />
                                                       <span className="font-mono">{obstacle.timer}s</span>
                                                  </div>
                                             </div>
                                         ) : obstacle.status === 'ROW_GRADING' ? (
                                             <div className="flex flex-col w-full gap-2">
                                                  <div className="w-full h-14 bg-slate-800 rounded-xl font-bold text-2xl flex items-center justify-center gap-4 text-amber-500 border border-amber-500/30 relative overflow-hidden">
                                                       <div className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-1000 ease-linear" style={{ width: `${(obstacle.timer / 15) * 100}%` }} />
                                                       <span className="animate-ping w-2 h-2 rounded-full bg-amber-500" />
                                                       <span className="font-mono">{obstacle.timer}s</span>
                                                  </div>
                                                  
                                                  <div className="flex gap-2 w-full">
                                                      <button 
                                                          onClick={handleFinishRow}
                                                          className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-[10px] sm:text-xs font-bold uppercase border border-slate-600 hover:border-slate-500 transition-all flex items-center justify-center gap-1 active:scale-95"
                                                      >
                                                          <Eye size={14} /> HIỆN ĐÁP ÁN
                                                      </button>
                                                      <button 
                                                          onClick={() => {
                                                              if(confirm("Xác nhận ĐÓNG hàng ngang này mà KHÔNG mở đáp án?")) {
                                                                  socket?.emit('mc_obstacle_dismiss_row');
                                                              }
                                                          }}
                                                          className="flex-1 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg text-[10px] sm:text-xs font-bold uppercase border border-red-500/30 hover:border-red-500/50 transition-all flex items-center justify-center gap-1 active:scale-95"
                                                      >
                                                          <EyeOff size={14} /> KHÔNG MỞ
                                                      </button>
                                                  </div>
                                              </div>
                                         ) : (
                                             <button 
                                                 onClick={handleStartTimer}
                                                 className="w-full h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30 active:scale-[0.99]"
                                             >
                                                 <Clock className="w-5 h-5 animate-pulse" /> BẮT ĐẦU TÍNH GIỜ (15s)
                                             </button>
                                         )
                                     )}
                                 </div>
                             </>
                         ) : (
                             <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                                 <ArrowLeftCircle size={64} />
                                 <span className="text-xl font-light">Chọn hàng ngang để hiển thị nội dung</span>
                             </div>
                         )}
                    </div>
                </div>
            </div>

            {/* CNV BUZZER POPUP */}
            <AnimatePresence>
                {activeBuzz && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                         <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-amber-900/50 relative overflow-hidden">
                             {/* Background glow */}
                             <div className="absolute top-0 left-0 w-full h-full bg-amber-500/5 pointer-events-none animate-pulse" />
                             
                             <div className="flex flex-col items-center text-center relative z-10">
                                 <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-amber-500/50">
                                     <Bell size={40} className="text-black" />
                                 </div>
                                 
                                 <h2 className="text-3xl font-black text-white mb-2 uppercase">CÓ TÍN HIỆU TRẢ LỜI!</h2>
                                 <p className="text-slate-400 mb-8">Thí sinh <b className="text-amber-400 text-xl">{players.find((p: Player) => p._id === activeBuzz.playerId)?.name || 'Unknown'}</b> đã bấm chuông.</p>
                                 
                                 <div className="grid grid-cols-2 gap-4 w-full">
                                     <button 
                                         onClick={() => handleSolveCNV(activeBuzz.playerId, false)}
                                         className="py-4 rounded-xl bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white font-bold border border-slate-700 hover:border-red-500 transition-all flex flex-col items-center gap-1"
                                     >
                                         <X size={24} />
                                         TRẢ LỜI SAI
                                         <span className="text-[10px] font-normal opacity-70">(Loại khỏi vòng chơi)</span>
                                     </button>
                                     <button 
                                         onClick={() => handleSolveCNV(activeBuzz.playerId, true)}
                                         className="py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-900/30 transition-all flex flex-col items-center gap-1"
                                     >
                                         <Check size={24} />
                                         TRẢ LỜI ĐÚNG
                                         <span className="text-[10px] font-normal opacity-70">(Chiến thắng vòng chơi)</span>
                                     </button>
                                 </div>
                             </div>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </GameRoundContainer>
    );
}
