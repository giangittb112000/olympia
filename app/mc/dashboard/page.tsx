"use client";

import { useMCSocket } from "@/hooks/socket/useMCSocket";
import { useGameState } from "@/components/providers/GameStateProvider";

import { GameScreenRouter } from "@/components/game/GameScreenRouter";
import Link from "next/link";
import MCGuard from "@/components/auth/MCGuard";
import RoundResetButton from "@/components/game/shared/RoundResetButton";
import { PlayCircle } from "lucide-react";



export default function MCDashboardPage() {
  const socket = useMCSocket();
  const { gameState } = useGameState();




  // Handle Score Reset
  const handleResetScore = async (type: string) => {
    const confirmMsg = type === 'all' 
        ? "CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ điểm của tất cả người chơi không?" 
        : `Bạn có chắc chắn muốn xóa điểm vòng ${type.toUpperCase()} không?`;
    
    if (!confirm(confirmMsg)) return;

    try {
        const payload = type === 'all' ? { all: true } : { round: type };
        const res = await fetch('/api/scores/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            alert("Đã reset điểm thành công!");
            socket?.emit('mc_refresh_ranking'); 
        } else {
            alert("Lỗi: " + data.error);
        }
    } catch (e) {
        console.error(e);
        alert("Lỗi kết nối reset điểm");
    }
  };

  return (
    <MCGuard>
      <GameScreenRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
          
          {/* DEBUG PANEL - Visible only on Dashboard */}
          <div className="fixed bottom-4 right-4 bg-black/80 border border-slate-700 p-4 text-xs font-mono rounded z-50">
              <div className={socket?.connected ? "text-green-400" : "text-red-400"}>
                  SOCKET: {socket?.connected ? "CONNECTED" : "DISCONNECTED"} ({socket?.id})
              </div>
              <div className="text-blue-400 mt-1">
                  PHASE: {gameState.phase}
              </div>
              <div className="text-slate-500 mt-1">
                  TS: {gameState.timestamp}
              </div>
          </div>

          <header className="mb-12 border-b border-amber-900/50 pb-6 flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-amber-500 font-display">QUẢN TRỊ MC</h1>
                <p className="text-amber-700 uppercase tracking-widest text-sm">Dashboard</p>
              </div>
              <div className="text-right">
                 <div className={`text-sm font-mono ${socket?.connected ? 'text-green-500' : 'text-red-500'}`}>
                      SOCKET: {socket?.connected ? 'ĐÃ KẾT NỐI' : 'MẤT KẾT NỐI'}
                 </div>
              </div>
          </header>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
               {/* ROUND CONTROLS */}
               <div className="lg:col-span-3">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                      <h2 className="text-xl font-bold mb-4 text-purple-400">Điều Khiển Vòng Thi</h2>
                      
                      {/* Grid Layout for Round Buttons + Reset Triggers */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* WARM UP */}
                          <div className="flex gap-2 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                               <button 
                                   onClick={() => socket?.emit('mc_set_phase', 'WARMUP')}
                                   className="flex-1 px-4 py-3 bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white rounded-lg font-bold transition-all border border-slate-700 hover:border-amber-500"
                               >
                                   KHỞI ĐỘNG
                               </button>
                               <button 
                                   onClick={() => socket?.emit('mc_play_video', { url: '/videos/vong-1.mp4' })}
                                   className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700 mx-1 flex items-center justify-center"
                                   title="Phát Video Hướng Dẫn"
                               >
                                   <PlayCircle size={20} />
                               </button>
                               <RoundResetButton 
                                   apiUrl="/api/warmup/reset-all"
                                   className="px-2"
                                   label="" // Icon only
                                   confirmMessage="Bạn có chắc muốn xóa trạng thái 'Đã thi' của TẤT CẢ gói câu hỏi Khởi Động?"
                               />
                          </div>

                          {/* OBSTACLES (Placeholder Reset) */}
                          <div className="flex gap-2 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                               <button 
                                   onClick={() => socket?.emit('mc_set_phase', 'OBSTACLES')}
                                   className="flex-1 px-4 py-3 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-lg font-bold transition-all border border-slate-700 hover:border-cyan-500"
                               >
                                   VƯỢT CHƯỚNG NGẠI VẬT
                               </button>
                               <button 
                                   onClick={() => socket?.emit('mc_play_video', { url: '/videos/vong-2.mp4' })}
                                   className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700 mx-1 flex items-center justify-center"
                                   title="Phát Video Hướng Dẫn"
                               >
                                   <PlayCircle size={20} />
                               </button>
                               <RoundResetButton
                                   apiUrl="/api/obstacles/reset"
                                   className="px-2"
                                   label=""
                                   confirmMessage="Bạn có chắc chắn muốn RESET dữ liệu vòng VCNV?\n(Hành động này sẽ xóa DB và bộ nhớ Server)"
                                   onSuccess={() => socket?.emit('mc_obstacle_reset')}
                               />
                          </div>

                          {/* ACCELERATION */}
                          <div className="flex gap-2 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                               <button 
                                   onClick={() => socket?.emit('mc_set_phase', 'ACCELERATION')}
                                   className="flex-1 px-4 py-3 bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white rounded-lg font-bold transition-all border border-slate-700 hover:border-purple-500"
                               >
                                   TĂNG TỐC
                               </button>
                               <button 
                                   onClick={() => socket?.emit('mc_play_video', { url: '/videos/vong-3.mp4' })}
                                   className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700 mx-1 flex items-center justify-center"
                                   title="Phát Video Hướng Dẫn"
                               >
                                   <PlayCircle size={20} />
                               </button>
                               <RoundResetButton 
                                   label=""
                                   apiUrl="/api/acceleration/reset"
                                   confirmMessage="Bạn có chắc chắn muốn RESET vòng Tăng Tốc?\n(Answers sẽ bị xóa)"
                                   onSuccess={() => socket?.emit('mc_acceleration_reset')}
                               />
                          </div>

                          {/* FINISH LINE */}
                          <div className="flex gap-2 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                               <button 
                                   onClick={() => socket?.emit('mc_set_phase', 'FINISH')}
                                   className="flex-1 px-4 py-3 bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white rounded-lg font-bold transition-all border border-slate-700 hover:border-red-500"
                               >
                                   VỀ ĐÍCH
                               </button>
                               <button 
                                   onClick={() => socket?.emit('mc_play_video', { url: '/videos/vong-4.mp4' })}
                                   className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700 mx-1 flex items-center justify-center"
                                   title="Phát Video Hướng Dẫn"
                               >
                                   <PlayCircle size={20} />
                               </button>
                               <RoundResetButton 
                                   label=""
                                   apiUrl="/api/finishline/reset"
                                   confirmMessage="Bạn có chắc chắn muốn RESET vòng Về Đích?\n(Question Bank sẽ được giữ lại)"
                                   onSuccess={() => socket?.emit('mc_finishline_reset')}
                               />
                          </div>

                      </div>

                      <div className="mt-6 flex justify-end">
                          <button 
                               onClick={() => socket?.emit('mc_set_phase', 'IDLE')}
                               className="px-6 py-3 bg-slate-950 text-slate-500 hover:text-slate-300 rounded-lg font-mono border border-slate-800 transition-colors"
                          >
                               RESET GAME PHASE (IDLE)
                          </button>
                      </div>
                  </div>
              </div>


         {/* SCORE CONTROLS */}
         <div className="lg:col-span-3 mb-8">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold mb-4 text-amber-400">Quản Lý Điểm Số</h2>
                <div className="flex gap-4 flex-wrap items-center">
                    <span className="text-slate-400 text-sm">Reset Điểm Vòng:</span>
                    <button 
                        onClick={() => handleResetScore('warmup')}
                        className="px-4 py-2 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-red-400 rounded-lg text-sm border border-slate-700 transition-colors"
                    >
                        Khởi Động
                    </button>
                    <button 
                        onClick={() => handleResetScore('obstacles')}
                        className="px-4 py-2 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-red-400 rounded-lg text-sm border border-slate-700 transition-colors"
                    >
                        VCNV
                    </button>
                    <button 
                         onClick={() => handleResetScore('acceleration')}
                        className="px-4 py-2 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-red-400 rounded-lg text-sm border border-slate-700 transition-colors"
                    >
                        Tăng Tốc
                    </button>
                    <button 
                         onClick={() => handleResetScore('finish')}
                        className="px-4 py-2 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-red-400 rounded-lg text-sm border border-slate-700 transition-colors"
                    >
                        Về Đích
                    </button>
                    
                    <div className="h-8 w-px bg-slate-700 mx-2"></div>

                    <button 
                         onClick={() => handleResetScore('all')}
                        className="px-4 py-2 bg-red-950/50 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-sm font-bold border border-red-900 hover:border-red-500 transition-all ml-auto"
                    >
                        RESET TOÀN BỘ ĐIỂM
                    </button>
                </div>
            </div>
        </div>

               {/* ADMIN LINKS */}
               <div className="lg:col-span-1">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 h-full">
                      <h2 className="text-xl font-bold mb-4 text-cyan-400">Quản Lý</h2>
                      <Link 
                          href="/mc/users"
                          className="block w-full bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white p-4 rounded-lg font-bold text-center border border-slate-700 transition-all mb-4"
                      >
                          QUẢN LÝ USER &rarr;
                      </Link>
                      <Link 
                          href="/mc/questions/warmup"
                          className="block w-full bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white p-4 rounded-lg font-bold text-center border border-slate-700 transition-all"
                      >
                          QUẢN LÝ CÂU HỎI V1 &rarr;
                      </Link>
                      <Link 
                          href="/mc/questions/obstacles"
                          className="block w-full bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white p-4 rounded-lg font-bold text-center border border-slate-700 transition-all mt-4"
                      >
                          QUẢN LÝ CÂU HỎI V2 &rarr;
                      </Link>
                      <Link 
                          href="/mc/questions/acceleration"
                          className="block w-full bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white p-4 rounded-lg font-bold text-center border border-slate-700 transition-all mt-4"
                      >
                          QUẢN LÝ CÂU HỎI V3 &rarr;
                      </Link>
                      <Link 
                          href="/mc/questions/finishline"
                          className="block w-full bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white p-4 rounded-lg font-bold text-center border border-slate-700 transition-all mt-4"
                      >
                          QUẢN LÝ CÂU HỎI V4 &rarr;
                      </Link>
                  </div>
              </div>
           </div>
        </div>
      </GameScreenRouter>
    </MCGuard>
  );
}
