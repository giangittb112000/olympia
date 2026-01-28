"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, User } from "lucide-react";

interface Answer {
  playerId: string;
  playerName: string;
  answerText: string;
  submittedAt: number;
  isCorrect?: boolean;
  pointsEarned: number;
}

interface StealAttempt {
  playerId: string;
  playerName: string;
  answerText: string;
  isCorrect?: boolean;
  pointsEarned: number;
  timestamp: number;
}

interface QuestionData {
  answer?: Answer | null;
  stealAttempts?: StealAttempt[];
}

interface AnswerDisplayProps {
  question: QuestionData;
  isRevealed?: boolean;
}

export default function FinishLineAnswerDisplay({ question, isRevealed = true }: AnswerDisplayProps) {
  if (!question) return null;

  const { answer: ownerAnswer, stealAttempts } = question;
  // Show owner answer ONLY when isRevealed is true (Timer ends)
  const showOwner = ownerAnswer && isRevealed;
  
  const hasSteal = stealAttempts && stealAttempts.length > 0;
  const hasActivity = showOwner || hasSteal;

  if (!hasActivity) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
        {/* Owner Answer Section */}
        <AnimatePresence>
            {showOwner && (
                <motion.div
                    key="owner-answer"
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ 
                        opacity: hasSteal ? 0.6 : 1, // Dim if stolen
                        scale: hasSteal ? 0.95 : 1,
                        y: 0,
                        borderColor: ownerAnswer.isCorrect === true 
                            ? ["#22c55e", "#4ade80", "#22c55e"] 
                            : ownerAnswer.isCorrect === false
                            ? ["#ef4444", "#f87171", "#ef4444"]
                            : undefined
                    }}
                    transition={{ 
                        default: { type: "spring", bounce: 0.5 },
                        borderColor: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className={`bg-gradient-to-b from-slate-900 to-black backdrop-blur-xl border-4 rounded-3xl p-6 shadow-2xl relative pt-[40px] z-10 ${
                         ownerAnswer.isCorrect === true
                            ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]" 
                            : ownerAnswer.isCorrect === false
                            ? "border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                            : "border-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    }`}
                >
                     {/* Badge */}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full font-black text-sm uppercase shadow-lg border-2 border-white flex items-center gap-2">
                        <User size={16} /> CÂU TRẢ LỜI
                    </div>

                    <div className="flex justify-between items-start mb-4 mt-2">
                         <div className="flex items-center gap-3">
                             <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-black text-xl border-2 border-slate-500 shadow-md">
                                 {ownerAnswer.playerName.charAt(0)}
                             </div>
                             <div>
                                 <span className="text-purple-400 font-bold block text-sm">THÍ SINH CHÍNH</span>
                                 <span className="text-3xl font-black text-white leading-none">{ownerAnswer.playerName}</span>
                             </div>
                         </div>
                         
                         {/* Result Icon */}
                         {ownerAnswer.isCorrect !== undefined && (
                             <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.5, 1] }} 
                                className="bg-white rounded-full p-1"
                             >
                                 {ownerAnswer.isCorrect ? (
                                     <CheckCircle size={40} className="text-green-600" fill="white" />
                                 ) : (
                                     <XCircle size={40} className="text-red-600" fill="white" />
                                 )}
                             </motion.div>
                         )}
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-2xl p-4 mb-3 border border-slate-700">
                        <div className={`text-4xl font-black text-center italic ${
                            ownerAnswer.isCorrect ? "text-green-400" : "text-white"
                        }`}>
                            &ldquo;{ownerAnswer.answerText || "..."}&rdquo;
                        </div>
                    </div>
                    
                    {ownerAnswer.pointsEarned !== 0 && (
                        <div className="flex justify-end border-t border-slate-800 pt-3">
                             <div className={`text-2xl font-black ${
                                 ownerAnswer.pointsEarned > 0 ? "text-green-400" : "text-red-400"
                             }`}>
                                 {ownerAnswer.pointsEarned > 0 ? "+" : ""}{ownerAnswer.pointsEarned} ĐIỂM
                             </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Steal Attempts Section */}
        <AnimatePresence>
            {stealAttempts?.map((steal, idx) => (
                <motion.div
                    key={`${steal.playerId}-${idx}`}
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        borderColor: steal.isCorrect === true 
                            ? ["#ca8a04", "#eab308", "#ca8a04"] 
                            : steal.isCorrect === false
                            ? ["#ef4444", "#f87171", "#ef4444"]
                            : undefined 
                    }}
                    transition={{ 
                        default: { type: "spring", bounce: 0.5 },
                        borderColor: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="relative z-20"
                >
                    {/* Floating Badge */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full font-black text-sm uppercase shadow-lg border-2 border-white flex items-center gap-2 animate-bounce">
                        <AlertTriangle size={16} /> CƯỚP ĐIỂM
                    </div>

                    <div className={`bg-gradient-to-b from-slate-900 to-black backdrop-blur-xl border-4 rounded-3xl p-6 shadow-2xl ${
                        steal.isCorrect === true
                            ? "border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.6)]" 
                            : steal.isCorrect === false
                            ? "border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                            : "border-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.4)]"
                    }`}>
                        
                        <div className="flex justify-between items-start mb-4 mt-2">
                             <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-black font-black text-xl border-2 border-white shadow-md">
                                     {steal.playerName.charAt(0)}
                                 </div>
                                 <div>
                                     <span className="text-yellow-500 font-bold block text-sm">THÍ SINH CƯỚP ĐIỂM</span>
                                     <span className="text-3xl font-black text-white leading-none">{steal.playerName}</span>
                                 </div>
                             </div>
                             
                             {/* Result Icon */}
                             {steal.isCorrect !== undefined && (
                                 <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [0, 1.5, 1] }} 
                                    className="bg-white rounded-full p-1"
                                 >
                                     {steal.isCorrect ? (
                                         <CheckCircle size={40} className="text-green-600" fill="white" />
                                     ) : (
                                         <XCircle size={40} className="text-red-600" fill="white" />
                                     )}
                                 </motion.div>
                             )}
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-4 mb-3 border border-slate-700">
                             <div className="text-4xl font-black text-white text-center italic">
                                 &ldquo;{steal.answerText}&rdquo;
                             </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                             <div className="text-slate-400 text-sm">
                                 Thời gian bấm: <span className="text-white font-mono">{(steal.timestamp || 0).toString().slice(-4)}</span>
                             </div>
                             <div className={`text-2xl font-black ${steal.pointsEarned > 0 ? "text-green-400" : "text-red-400"}`}>
                                 {steal.pointsEarned > 0 ? "+" : ""}{steal.pointsEarned} ĐIỂM
                             </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    </div>
  );
}
