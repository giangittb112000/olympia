import React, { useEffect, useState } from 'react';
import { useSocketContext } from "@/components/providers/SocketProvider";
import GameRoundContainer from "../../GameRoundContainer";
import { WarmUpState } from "@/server/game/GameConstants";
import clsx from 'clsx';
import { Player } from '@/types';

interface WarmUpMCProps {
    warmUp: WarmUpState;
}

interface Pack {
    _id: string;
    name: string;
    playedBy: string | null;
}

export default function WarmUpMC({ warmUp }: WarmUpMCProps) {
    const { socket } = useSocketContext();
    const [players, setPlayers] = useState<Player[]>([]);
    const [packs, setPacks] = useState<Pack[]>([]);
    
    // Setup State
    const [selectedPlayer, setSelectedPlayer] = useState<string>("");
    const [selectedPack, setSelectedPack] = useState<string>("");

    // Realtime Preview Emission
    useEffect(() => {
        socket?.emit('mc_warmup_preview_change', { 
            playerId: selectedPlayer, 
            packId: selectedPack 
        });
    }, [selectedPlayer, selectedPack, socket]);

    const fetchSetupData = async () => {
        try {
            const [usersRes, packsRes] = await Promise.all([
                fetch('/api/players'),
                fetch('/api/warmup/packs')
            ]);
            
            const usersData = await usersRes.json();
            if (usersData.success) {
                setPlayers(usersData.data);
            }

            const packsData = await packsRes.json();
            if (packsData.success) {
                setPacks(packsData.data);
            }

        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
             fetchSetupData();
        }, 0);
        return () => clearTimeout(timer);
    }, [warmUp.status]); // Refetch when status changes (e.g., IDLE -> READY, FINISHED -> IDLE)

    // ACTIONS
    const handleSetup = () => {
        if (!selectedPlayer || !selectedPack) return;
        socket?.emit('mc_warmup_setup', { playerId: selectedPlayer, packId: selectedPack });
    };

    const handleStartTimer = () => socket?.emit('mc_warmup_start');
    
    const handleGrade = (result: 'CORRECT' | 'WRONG' | 'PASS') => {
        socket?.emit('mc_warmup_grade', { result });
    };

    return (
        <GameRoundContainer className="text-slate-100">
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4 w-full max-w-5xl">
                <h1 className="text-4xl font-black font-display text-amber-500">KHỞI ĐỘNG (MC)</h1>
                <div className="flex gap-4 items-center">
                    {(warmUp.status === 'PLAYING' || warmUp.status === 'READY') && (
                         <button 
                            onClick={() => {
                                if (confirm('Bạn có chắc muốn DỪNG vòng thi này?')) {
                                    socket?.emit('mc_warmup_reset');
                                }
                            }}
                            className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 px-4 py-2 rounded font-bold text-sm transition-colors"
                        >
                            DỪNG (STOP)
                        </button>
                    )}
                    <button 
                        onClick={() => socket?.emit('mc_set_phase', 'IDLE')}
                        className="text-slate-500 hover:text-white text-sm font-bold uppercase transition-colors"
                    >
                        &larr; Quay về Menu
                    </button>
                </div>
            </div>

            <div className="w-full max-w-5xl animate-in fade-in duration-300">
                {(warmUp.status === 'IDLE' || warmUp.status === 'FINISHED') ? (
                    // SETUP VIEW
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-xl font-bold text-amber-500 mb-6 uppercase border-b border-slate-700 pb-2">Thiết Lập Lượt Chơi</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            {/* SELECT PLAYER GRID */}
                            <div className="flex flex-col h-full">
                                <label className="block text-slate-400 mb-3 font-mono text-sm uppercase tracking-wider">Chọn Thí Sinh</label>
                                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {players.map(p => {
                                        const isFinished = packs.some(pack => pack.playedBy === p._id);
                                        const isSelected = selectedPlayer === p._id;
                                        
                                        return (
                                            <button
                                                key={p._id}
                                                onClick={() => !isFinished && setSelectedPlayer(p._id)}
                                                disabled={isFinished}
                                                className={clsx(
                                                    "relative p-4 rounded-xl border-2 text-left transition-all group",
                                                    isSelected 
                                                        ? "bg-amber-600/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                                                        : isFinished
                                                            ? "bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed"
                                                            : "bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                                                )}
                                            >
                                                <div className="font-bold text-white truncate">{p.name}</div>
                                                {isFinished && (
                                                    <div className="text-xs text-green-500 font-mono mt-1">✓ Đã thi xong</div>
                                                )}
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]"></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* SELECT PACK GRID */}
                            <div className="flex flex-col h-full">
                                 <label className="block text-slate-400 mb-3 font-mono text-sm uppercase tracking-wider">Chọn Gói Câu Hỏi</label>
                                 <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {packs.map(p => {
                                        const isUsed = !!p.playedBy;
                                        const isSelected = selectedPack === p._id;
                                        
                                        // Find who played it if used
                                        const playedByName = isUsed ? players.find(u => u._id === p.playedBy)?.name : null;

                                        return (
                                            <button
                                                key={p._id}
                                                onClick={() => !isUsed && setSelectedPack(p._id)}
                                                disabled={isUsed}
                                                className={clsx(
                                                    "relative p-4 rounded-xl border-2 text-left transition-all",
                                                    isSelected 
                                                        ? "bg-cyan-600/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                                                        : isUsed
                                                            ? "bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed"
                                                            : "bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                                                )}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-white text-lg">{p.name}</span>
                                                    {/* <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">15 câu</span> */}
                                                </div>
                                                
                                                {isUsed ? (
                                                    <div className="text-xs text-red-400 font-mono mt-1">
                                                        ✖ Đã dùng bởi: <span className="font-bold text-white">{playedByName || "Unknown"}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-500 font-mono mt-1">Sẵn sàng sử dụng</div>
                                                )}

                                                {isSelected && (
                                                    <div className="absolute top-1/2 right-4 -translate-y-1/2">
                                                        <div className="w-4 h-4 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4] flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-6 border-t border-slate-700">
                            {(() => {
                                const isPlayerFinished = packs.some(p => p.playedBy === selectedPlayer);
                                const selectedPackObj = packs.find(p => p._id === selectedPack);
                                const isPackUsed = !!selectedPackObj?.playedBy;
                                const isValid = selectedPlayer && selectedPack && !isPlayerFinished && !isPackUsed;

                                return (
                                    <button 
                                        onClick={handleSetup}
                                        disabled={!isValid}
                                        className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-12 py-4 rounded-xl font-black text-lg transition-all shadow-lg shadow-amber-900/20 hover:scale-105 active:scale-95 flex items-center gap-3 grayscale disabled:grayscale-1"
                                    >
                                        <span>THIẾT LẬP & VÀO GAME</span>
                                        <span className="text-xl">&rarr;</span>
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    // GAME PLAY CONTROLS
                    <div className="flex flex-col gap-6">
                        {/* INFO BAR */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                                <div className="text-slate-500 text-xs font-mono uppercase mb-1">Thí sinh</div>
                                <div className="text-xl font-bold text-white truncate">
                                    {players.find(p => p._id === warmUp.currentPlayerId)?.name || "Unknown"}
                                </div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                                <div className="text-slate-500 text-xs font-mono uppercase mb-1">Thời Gian</div>
                                <div className={clsx(
                                    "text-3xl font-black font-mono",
                                    warmUp.timer <= 10 ? "text-red-500 animate-pulse" : "text-white"
                                )}>
                                    {warmUp.timer}s
                                </div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                                <div className="text-slate-500 text-xs font-mono uppercase mb-1">Điểm Lượt Này</div>
                                <div className="text-3xl font-black text-amber-500">
                                    {warmUp.totalScoreReceived}
                                </div>
                            </div>
                        </div>

                        {/* QUESTION CARD */}
                        <div className="bg-slate-900 border border-amber-900/30 p-8 rounded-2xl min-h-[300px] flex flex-col justify-center items-center text-center relative overflow-hidden">
                            <div className="relative z-10 w-full">
                                 {warmUp.currentQuestion ? (
                                     <>
                                        <h3 className="text-2xl md:text-3xl font-medium text-slate-200 mb-6 leading-relaxed">
                                            {warmUp.currentQuestion.content}
                                        </h3>
                                        <div className="bg-slate-800/50 inline-block px-6 py-3 rounded-lg border border-slate-700">
                                            <span className="text-amber-500 font-bold mr-2">ĐÁP ÁN:</span>
                                            <span className="text-white font-mono">{warmUp.currentQuestion.description || "(Không có)"}</span>
                                        </div>
                                     </>
                                 ) : (
                                     <div className="text-slate-500 italic">Đang chờ dữ liệu câu hỏi...</div>
                                 )}
                            </div>
                        </div>

                        {/* CONTROLS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                             {warmUp.status === 'READY' ? (
                                 <button 
                                    onClick={handleStartTimer}
                                    className="col-span-4 bg-green-600 hover:bg-green-500 text-white py-6 rounded-xl font-black text-2xl shadow-lg shadow-green-900/20 active:scale-[0.98] transition-all"
                                 >
                                    BẮT ĐẦU (START)
                                 </button>
                             ) : (
                                 <>
                                    <button 
                                        onClick={() => handleGrade('CORRECT')}
                                        className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-xl font-bold text-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all"
                                    >
                                        ĐÚNG (+10)
                                    </button>
                                    <button 
                                        onClick={() => handleGrade('WRONG')}
                                        className="col-span-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-6 rounded-xl font-bold text-xl shadow-lg active:scale-[0.98] transition-all"
                                    >
                                        SAI
                                    </button>
                                    <button 
                                        onClick={() => handleGrade('PASS')}
                                        className="col-span-1 bg-yellow-700 hover:bg-yellow-600 text-yellow-100 py-6 rounded-xl font-bold text-xl border border-yellow-600 active:scale-[0.98] transition-all"
                                    >
                                        BỎ QUA
                                    </button>
                                 </>
                             )}
                        </div>
                    </div>
                )}
            </div>
        </GameRoundContainer>
    );
}
