import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocketContext } from '@/components/providers/SocketProvider';
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer';
import GameRoundContainer from '../../GameRoundContainer';
import MediaPlayer from './MediaPlayer';
import { AccelerationState } from '@/server/game/GameConstants';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizonal, CheckCircle2, XCircle } from 'lucide-react';

interface AccelerationPlayerProps {
  acceleration: AccelerationState;
}

export default function AccelerationPlayer({ acceleration }: AccelerationPlayerProps) {
  return <AccelerationPlayerContent acceleration={acceleration} />;
}

function AccelerationPlayerContent({ acceleration }: AccelerationPlayerProps) {
  /* eslint-disable react-hooks/set-state-in-effect */
  const { socket } = useSocketContext();
  const playerId = useCurrentPlayer();
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const myAnswer = acceleration.answers.find(a => a.playerId === playerId);

  // Reset when new question
  useEffect(() => {
    setAnswer('');
    setSubmitted(false);
  }, [acceleration.questionNumber]);

  const handleSubmit = useCallback(() => {
    if (!playerId || !answer.trim() || submitted) return;

    socket?.emit('player_acceleration_answer', {
      playerId,
      answer: answer.trim()
    });

    setSubmitted(true);
  }, [playerId, answer, submitted, socket]);

  // Auto-focus input when timer starts
  useEffect(() => {
    if (acceleration.status === 'PLAYING' && !submitted) {
      inputRef.current?.focus();
    }
  }, [acceleration.status, submitted]);

  // Auto-submit when time runs out (even if empty)
  useEffect(() => {
    if (acceleration.timeLeft === 0 && !submitted) {
      // Submit answer (even if empty) to mark player as "attempted"
      if (!playerId) return;
      
      socket?.emit('player_acceleration_answer', {
        playerId,
        answer: answer.trim() || '' // Empty string if no answer
      });
      
      setSubmitted(true);
    }
  }, [acceleration.timeLeft, submitted, playerId, answer, socket]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Idle state
  if (!acceleration.questionNumber || acceleration.status === 'IDLE') {
    return (
      <GameRoundContainer>
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <h1 className="text-4xl md:text-6xl font-black text-amber-500">VÒNG TĂNG TỐC</h1>
          <p className="text-xl text-slate-400">Đang chờ MC bắt đầu...</p>
        </div>
      </GameRoundContainer>
    );
  }

  const progressPercent = (acceleration.timeLeft / 30) * 100; // Assuming 30s default

  return (
    <GameRoundContainer className="p-4 md:p-8">
      <div className="flex flex-col h-full gap-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl md:text-4xl font-black text-amber-500">
            VÒNG TĂNG TỐC - CÂU HỎI {acceleration.questionNumber}/4
          </h1>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
             <AnimatePresence mode="wait">
               <motion.div
                 key={acceleration.questionNumber}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.3 }}
                 className="flex flex-col gap-4 h-full"
               >
                  {/* Question Text */}
                  <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-2 border-amber-500/50 rounded-2xl p-6 text-center">
                    <h2 className="text-xl md:text-3xl font-bold text-white leading-relaxed">
                      {acceleration.questionText}
                    </h2>
                    {acceleration.questionDescription && (
                      <p className="text-sm md:text-base text-slate-300 mt-2 italic">
                        {acceleration.questionDescription}
                      </p>
                    )}
                  </div>


                  {/* Media - Only show if exists */}
                  {acceleration.mediaUrl && (
                    <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-2xl relative">
                        <MediaPlayer
                          mediaType={acceleration.mediaType!}
                          mediaUrl={acceleration.mediaUrl}
                        />
                    </div>
                  )}
               </motion.div>
             </AnimatePresence>
        </div>

        {/* Timer */}
        <div className="bg-slate-900 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Thời Gian Còn Lại</span>
            <span className={`text-2xl font-mono font-bold ${
              acceleration.timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-amber-500'
            }`}>
              {acceleration.timeLeft}s
            </span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                progressPercent > 30 ? 'bg-green-500' : progressPercent > 10 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Input or Result */}
        <AnimatePresence mode="wait">
          {!myAnswer ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-800 rounded-xl p-6 space-y-4"
            >
              <label className="block text-sm font-bold text-slate-300">
                Câu Trả Lời Của Bạn:
              </label>
              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={submitted || acceleration.status !== 'PLAYING'}
                className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-700 focus:border-amber-500 rounded-lg text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Nhập đáp án..."
              />
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || submitted || acceleration.status !== 'PLAYING'}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <SendHorizonal size={20} />
                {submitted ? '✅ Đã Gửi' : 'GỬI ĐÁP ÁN'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl p-6 border-2 ${
                myAnswer.isCorrect === undefined
                  ? 'bg-slate-800 border-slate-600'
                  : myAnswer.isCorrect
                  ? 'bg-green-900/30 border-green-500'
                  : 'bg-red-900/30 border-red-500'
              }`}
            >
              {myAnswer.isCorrect === undefined ? (
                <div className="text-center">
                  <div className="animate-pulse text-amber-500 text-lg font-bold mb-2">
                    ⏳ Đang chờ MC chấm điểm...
                  </div>
                  <p className="text-slate-400">&ldquo;{myAnswer.answer}&rdquo;</p>
                  <p className="text-xs text-slate-500 mt-2">Gửi lúc: {myAnswer.responseTime}s còn lại</p>
                </div>
              ) : myAnswer.isCorrect ? (
                <div className="text-center">
                  <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
                  <h2 className="text-3xl md:text-5xl font-black text-green-400 mb-2">
                    +{myAnswer.score} ĐIỂM!
                  </h2>
                  <p className="text-xl text-white">CHÍNH XÁC! 🎉</p>
                  <p className="text-slate-400 mt-2">&ldquo;{myAnswer.answer}&rdquo;</p>
                </div>
              ) : (
                <div className="text-center">
                  <XCircle size={64} className="text-red-500 mx-auto mb-4" />
                  <h2 className="text-3xl md:text-5xl font-black text-red-400 mb-2">
                    0 ĐIỂM
                  </h2>
                  <p className="text-xl text-white">Chưa chính xác</p>
                  <p className="text-slate-400 mt-2">&ldquo;{myAnswer.answer}&rdquo;</p>
                  {acceleration.referenceAnswer && (
                    <p className="text-sm text-amber-400 mt-4">
                      Đáp án đúng: <strong>{acceleration.referenceAnswer}</strong>
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameRoundContainer>
  );
}
