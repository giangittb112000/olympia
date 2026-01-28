'use client';
import { useEffect, useRef } from 'react';
import { usePlayers } from '@/hooks/usePlayers';
import GameRoundContainer from '../../GameRoundContainer';
import MediaPlayer from './MediaPlayer';
import { AccelerationState } from '@/server/game/GameConstants';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
interface AccelerationMonitorProps {
  acceleration: AccelerationState;
}

export default function AccelerationMonitor({ acceleration }: AccelerationMonitorProps) {
  return <AccelerationMonitorContent acceleration={acceleration} />;
}

function AccelerationMonitorContent({ acceleration }: AccelerationMonitorProps) {
  const { players } = usePlayers();
  const prevAnswerCount = useRef(0);

  // Confetti effect when someone gets correct answer
  useEffect(() => {
    const correctAnswers = acceleration.answers.filter(a => a.isCorrect === true);
    if (correctAnswers.length > prevAnswerCount.current) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Optional: Play sound
      // new Audio('/sounds/correct.mp3').play();
    }
    prevAnswerCount.current = correctAnswers.length;
  }, [acceleration.answers]);

  // Sound effect when new answer
  useEffect(() => {
    if (acceleration.answers.length > 0) {
      // new Audio('/sounds/beep.mp3').play();
    }
  }, [acceleration.answers.length]);

  if (!acceleration.questionNumber) {
    return (
      <GameRoundContainer>
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <h1 className="text-6xl font-black text-amber-500">VÒNG TĂNG TỐC</h1>
          <p className="text-2xl text-slate-400">Đang chờ bắt đầu...</p>
        </div>
      </GameRoundContainer>
    );
  }

  // Defensive check for answers array
  const answers = acceleration.answers || [];
  const sortedAnswers = [...answers].sort((a, b) => a.submittedAt - b.submittedAt);
  const progressPercent = (acceleration.timeLeft / 30) * 100;

  return (
    <GameRoundContainer className="h-screen overflow-hidden p-0 bg-[url('/grid.svg')] bg-cover" fullWidth noTopPadding>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/20 to-black pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full max-h-screen p-6 md:p-8 gap-6 max-w-[1920px] mx-auto w-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-6">
             <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-black px-6 py-2 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-amber-500/20">
                Tăng Tốc
             </div>
             <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                  Câu hỏi số <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 text-5xl">{acceleration.questionNumber}</span>
                </h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.5em] mt-1">Olympiad Championship 2024</p>
             </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="hidden xl:flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Mã định danh</span>
                <span className="text-slate-300 font-mono font-bold tracking-widest">ACC-Q{acceleration.questionNumber}-SECURE</span>
             </div>
             <div className="h-12 w-[1px] bg-white/10 hidden xl:block" />
             <div className={`flex items-center gap-4 px-8 py-3 rounded-xl border border-white/10 transition-all ${
               acceleration.timeLeft <= 5 
                 ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
                 : 'bg-black/50 border-amber-500/30'
             }`}>
               <span className="text-2xl animate-pulse">⏱️</span>
               <span className={`text-5xl font-mono font-black tracking-tighter ${
                 acceleration.timeLeft <= 5 ? 'text-red-500' : 'text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400'
               }`}>
                 {acceleration.timeLeft < 10 ? `0${Math.floor(acceleration.timeLeft)}` : Math.floor(acceleration.timeLeft)}
               </span>
               <span className="text-sm font-bold text-slate-500 self-end mb-2">SEC</span>
             </div>
          </div>
        </div>

        {/* Main Content Space */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
          {/* Left: Media & Question Content */}
          <div className="col-span-8 flex flex-col gap-6 min-h-0">
            {/* Large Media Player Frame */}
            <div className="flex-[3] bg-black rounded-3xl overflow-hidden shadow-2xl relative border-4 border-slate-900 ring-1 ring-white/10">
              {acceleration.mediaUrl ? (
                <MediaPlayer
                  mediaType={acceleration.mediaType!}
                  mediaUrl={acceleration.mediaUrl!}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
                   <div className="text-center opacity-50">
                      <div className="w-32 h-32 border-4 border-dashed border-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-[spin_10s_linear_infinite]">
                         <span className="text-5xl">🎬</span>
                      </div>
                      <p className="text-slate-600 font-black text-2xl uppercase tracking-widest">Visual Content Placeholder</p>
                   </div>
                </div>
              )}
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-500/50 rounded-tl-xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-500/50 rounded-tr-xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-500/50 rounded-bl-xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-500/50 rounded-br-xl pointer-events-none" />
            </div>

            {/* Cinematic Question Box */}
            <div className="flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 via-purple-500 to-blue-500" />
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-1000" />
              
              <div className="relative z-10 flex flex-col justify-center h-full">
                <div className="flex items-center gap-4 mb-4">
                   <div className="bg-white/10 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border border-white/5 tracking-widest">
                      Question Content
                   </div>
                </div>
                <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 leading-tight drop-shadow-lg">
                  {acceleration.questionText}
                </p>
                {acceleration.questionDescription && (
                  <div className="mt-4 flex items-center gap-3">
                     <div className="h-px w-10 bg-amber-500/50" />
                     <p className="text-xl text-amber-500/80 font-medium italic font-serif">{acceleration.questionDescription}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Answer Feed */}
          <div className="col-span-4 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col shadow-2xl overflow-hidden relative">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

            <div className="p-6 border-b border-white/5 relative z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-br from-red-500 to-orange-500 text-white"></span>
                  </span>
                  LIVE FEED
                </h3>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 shadow-inner">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Responses</span>
                  <span className="text-lg font-black text-amber-500 leading-none">{answers.length}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative z-10">
              <AnimatePresence mode="popLayout">
                {sortedAnswers.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center opacity-60"
                  >
                    <div className="w-20 h-20 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin mb-8" />
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Waiting for signals...</p>
                  </motion.div>
                ) : (
                  sortedAnswers.map((answer, idx) => {
                    const player = players?.find(p => p._id === answer.playerId);
                    const isGraded = answer.isCorrect !== undefined;
                    
                    return (
                      <motion.div
                        key={answer.playerId}
                        layout
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        className={`group relative rounded-2xl p-1 transition-all duration-500 ${
                          answer.isCorrect === true
                            ? 'bg-gradient-to-r from-green-500/50 to-emerald-900/50'
                            : answer.isCorrect === false
                            ? 'bg-gradient-to-r from-red-500/50 to-rose-900/50'
                            : 'bg-gradient-to-r from-slate-800 to-slate-900'
                        }`}
                      >
                        <div className="bg-slate-950/90 rounded-xl p-4 h-full border border-white/5 relative overflow-hidden">
                           {/* Glow Effect */}
                           <div className={`absolute -right-10 -top-10 w-20 h-20 blur-2xl rounded-full opacity-20 transition-colors ${
                              answer.isCorrect === true ? 'bg-green-500' :
                              answer.isCorrect === false ? 'bg-red-500' :
                              'bg-amber-500'
                           }`} />

                           <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded flex items-center justify-center font-black text-sm transform -skew-x-12 ${
                                   idx === 0 ? 'bg-amber-500 text-black shadow-[0_0_10px_#f59e0b]' : 'bg-slate-800 text-slate-400'
                                 }`}>
                                   <div className="skew-x-12">{idx + 1}</div>
                                 </div>
                                 <span className="font-black text-lg text-white truncate max-w-[140px] tracking-wide">
                                   {player?.name?.toUpperCase()}
                                 </span>
                              </div>
                              <div className="text-right">
                                 <span className="text-[10px] block font-black text-slate-600 leading-none mb-1">TIME</span>
                                 <span className="text-base font-mono font-black text-amber-500 tracking-tight">{answer.responseTime}s</span>
                              </div>
                           </div>
                           
                           <div className="bg-black/40 rounded-lg py-4 px-4 border border-white/5 group-hover:border-white/20 transition-all relative z-10">
                             <p className="text-xl font-black text-white text-center truncate tracking-widest uppercase glow-text">
                               {answer.answer}
                             </p>
                           </div>

                           {isGraded && (
                              <div className={`absolute top-1/2 -translate-y-1/2 -right-2 shadow-xl border-l-4 py-2 pl-4 pr-6 rounded-l-xl flex items-center justify-center backdrop-blur-md transition-all ${
                                answer.isCorrect 
                                  ? 'bg-green-900/90 border-green-500' 
                                  : 'bg-red-900/90 border-red-500'
                              }`}>
                                <span className={`text-2xl font-black ${answer.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                   {answer.isCorrect ? `+${answer.score}` : 'FAILED'}
                                </span>
                              </div>
                           )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Visual Footer */}
            <div className="p-6 bg-black/40 border-t border-white/5 mt-auto relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent" />
               <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative z-10">
                  <motion.div
                    className="h-full absolute top-0 left-0 bottom-0 bg-gradient-to-r from-amber-600 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                  />
               </div>
               <div className="flex justify-between mt-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10">
                  <span>Round Progress</span>
                  <span>{Math.round(progressPercent)}%</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </GameRoundContainer>
  );
}
