'use client';
import { useState } from 'react';
import { useSocketContext } from '@/components/providers/SocketProvider';
import { usePlayers } from '@/hooks/usePlayers';
import GameRoundContainer from '../../GameRoundContainer';
import MediaPlayer from './MediaPlayer';
import { AccelerationState } from '@/server/game/GameConstants';
import { Play, SkipForward, Check, X, RotateCcw, Trophy, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast, ToastType } from '@/components/ui/Toast';

import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface AccelerationMCProps {
  acceleration: AccelerationState;
}

export default function AccelerationMC({ acceleration }: AccelerationMCProps) {
  const { socket } = useSocketContext();
  const { players } = usePlayers();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'info' | 'warning' | 'danger' | 'success';
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleStartRound = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Bắt đầu vòng thi',
      message: 'Bạn có chắc chắn muốn bắt đầu vòng Tăng Tốc?',
      onConfirm: () => socket?.emit('mc_acceleration_start_round'),
      type: 'info'
    });
  };

  const handleStartTimer = () => {
    socket?.emit('mc_acceleration_start_timer');
  };

  const handleGrade = (playerId: string, isCorrect: boolean) => {
    socket?.emit('mc_acceleration_grade', { playerId, isCorrect });
  };

  const handleNext = () => {
    // Validate all graded
    const ungraded = (acceleration.answers || []).filter((a: { isCorrect?: boolean }) => a.isCorrect === undefined);
    if (ungraded.length > 0) {
      setToast({ 
        message: `Bạn chưa chấm ${ungraded.length} đáp án. Vui lòng chấm hết trước khi next.`,
        type: 'error'
      });
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Chuyển câu hỏi',
      message: 'Xác nhận chuyển sang câu tiếp theo?',
      onConfirm: () => socket?.emit('mc_acceleration_next_question'),
      type: 'info'
    });
  };

  const handleFinish = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Kết thúc vòng',
      message: 'Bạn có chắc chắn muốn kết thúc vòng Tăng Tốc?',
      onConfirm: () => socket?.emit('mc_acceleration_finish_round'),
      type: 'success'
    });
  };

  const handleReset = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Cảnh báo Reset',
      message: '⚠️ Reset toàn bộ vòng Tăng Tốc? (Tất cả đáp án đã nộp sẽ bị xóa)',
      onConfirm: () => socket?.emit('mc_acceleration_reset'),
      type: 'warning'
    });
  };

  // Idle state
  if (!acceleration.questionNumber) {
    return (
      <GameRoundContainer>
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>
        <ConfirmModal 
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          type={confirmConfig.type}
        />
        <div className="absolute top-6 left-6">
          <button
            onClick={() => socket?.emit('mc_set_phase', 'IDLE')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 font-bold shadow-lg"
          >
            <ArrowLeft size={20} /> Quay lại Dashboard
          </button>
        </div>
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <h1 className="text-4xl font-black text-amber-500">VÒNG TĂNG TỐC</h1>
          <p className="text-slate-400 text-lg">Chuẩn bị sẵn sàng để bắt đầu</p>
          <button
            onClick={handleStartRound}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Bắt Đầu Vòng Thi
          </button>
        </div>
      </GameRoundContainer>
    );
  }

  // Defensive check for answers array
  const answers = acceleration.answers || [];
  const sortedAnswers = [...answers].sort((a, b) => a.submittedAt - b.submittedAt);
  const gradedCount = answers.filter(a => a.isCorrect !== undefined).length;
  const totalAnswers = answers.length;

  return (
    <GameRoundContainer className="p-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        type={confirmConfig.type}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-4 w-full mb-[30px]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setConfirmConfig({
                isOpen: true,
                title: 'Quay lại Dashboard',
                message: 'Quay lại màn hình chọn vòng thi?',
                onConfirm: () => socket?.emit('mc_set_phase', 'IDLE'),
                type: 'info'
              });
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
            title="Quay lại Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-amber-500">TĂNG TỐC - CÂU {acceleration.questionNumber}/4</h1>
            <p className="text-slate-400 text-sm">
              Status: <span className="text-white font-bold">{acceleration.status}</span> | 
              Timer: <span className={`font-bold ${acceleration.timeLeft <= 5 ? 'text-red-500' : 'text-white'}`}>{acceleration.timeLeft}s</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      <div className="h-[calc(100%-80px)] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={acceleration.questionNumber}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-12 gap-6 h-full"
          >
            {/* Left: Media */}
            {acceleration.mediaUrl && (
              <div className="col-span-5 bg-slate-800 rounded-xl p-4 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2">Media</h3>
                <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
                    <MediaPlayer
                      mediaType={acceleration.mediaType!}
                      mediaUrl={acceleration.mediaUrl}
                    />
                </div>
              </div>
            )}

            {/* Right: Controls + Answers */}
            <div className={`${acceleration.mediaUrl ? 'col-span-7' : 'col-span-12'} flex flex-col gap-4`}>
              {/* Question Text */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-sm text-slate-400 mb-2">NỘI DUNG CÂU HỎI</h3>
                <p className="text-2xl font-bold text-white">{acceleration.questionText}</p>
                {acceleration.questionDescription && (
                  <p className="text-sm text-slate-300 mt-2 italic">{acceleration.questionDescription}</p>
                )}
                {acceleration.referenceAnswer && (
                  <p className="text-sm text-amber-400 mt-3 bg-amber-900/20 px-3 py-2 rounded-lg">
                    💡 Đáp án tham khảo: <strong>{acceleration.referenceAnswer}</strong>
                  </p>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                {acceleration.status === 'IDLE' && (
                  <button
                    onClick={handleStartTimer}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                  >
                    <Play size={20} /> BẮT ĐẦU TÍNH GIỜ
                  </button>
                )}
                {(acceleration.status === 'GRADING' && acceleration.questionNumber < 4) && (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                  >
                    <SkipForward size={20} /> CÂU TIẾP THEO
                  </button>
                )}
                {(acceleration.status === 'GRADING' && acceleration.questionNumber === 4) && (
                  <button
                    onClick={handleFinish}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                  >
                    <Trophy size={20} /> KẾT THÚC VÒNG
                  </button>
                )}
              </div>

              {/* Answer List */}
              <div className="flex-1 bg-slate-800 rounded-xl p-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Danh Sách Đáp Án</h3>
                  <span className="text-sm text-slate-400">
                    Đã chấm: {gradedCount}/{totalAnswers}
                  </span>
                </div>

                {sortedAnswers.length === 0 ? (
                  <p className="text-slate-500 text-center py-8 italic">Chưa có đáp án nào...</p>
                ) : (
                  <div className="space-y-3">
                    {sortedAnswers.map((answer, idx) => {
                      const player = players?.find(p => p._id === answer.playerId);
                      const isGraded = answer.isCorrect !== undefined;

                      return (
                        <div
                          key={answer.playerId}
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            answer.isCorrect === true
                              ? 'bg-green-900/20 border-green-500'
                              : answer.isCorrect === false
                              ? 'bg-red-900/20 border-red-500'
                              : 'bg-slate-700 border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '4️⃣'}
                              </span>
                              <div>
                                <p className="font-bold text-white">{player?.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-400">{answer.responseTime}s còn lại</p>
                              </div>
                            </div>
                            {isGraded && (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                answer.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              }`}>
                                {answer.isCorrect ? `+${answer.score} điểm` : '0 điểm'}
                              </span>
                            )}
                          </div>

                          <p className="text-lg text-white mb-3">&lsquo;{answer.answer}&rsquo;</p>

                          {!isGraded && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleGrade(answer.playerId, true)}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                              >
                                <Check size={16} /> ĐÚNG
                              </button>
                              <button
                                onClick={() => handleGrade(answer.playerId, false)}
                                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                              >
                                <X size={16} /> SAI
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </GameRoundContainer>
  );
}
