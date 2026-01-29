"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toast, ToastType } from "@/components/ui/Toast";
import { AnimatePresence } from "framer-motion";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Question {
  _id?: string;
  questionText: string;
  questionDescription?: string;
  mediaType?: "VIDEO" | "IMAGE" | "AUDIO";
  mediaUrl?: string;
  referenceAnswer: string;
  isUsed?: boolean;
}

export default function FinishLineBankPage() {
  const [activeTab, setActiveTab] = useState<"10pt" | "20pt" | "30pt">("10pt");
  const [questions10pt, setQuestions10pt] = useState<Question[]>([]);
  const [questions20pt, setQuestions20pt] = useState<Question[]>([]);
  const [questions30pt, setQuestions30pt] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  // Load existing bank
  useEffect(() => {
    loadBank();
  }, []);

  const loadBank = async () => {
    try {
      setLoading(true);
      // Prevent caching to ensure fresh data
      const res = await fetch("/api/finishline/bank", {
        headers: { "Cache-Control": "no-store" },
        cache: "no-store"
      });
      const data = await res.json();
      
      console.log("Loaded Bank Data:", data); // Debug log

      if (data.success && data.bank) {
        setQuestions10pt(data.bank.questions10pt || []);
        setQuestions20pt(data.bank.questions20pt || []);
        setQuestions30pt(data.bank.questions30pt || []);
        setToast({ message: "✅ Đã tải ngân hàng câu hỏi!", type: "success" });
      }
    } catch (error) {
      console.error("Error loading bank:", error);
      setToast({ message: "❌ Lỗi khi tải ngân hàng!", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBank = async () => {
    // Validation
    if (questions10pt.length < 3) {
      setToast({ message: "❌ Cần ít nhất 3 câu hỏi 10 điểm!", type: "error" });
      return;
    }
    if (questions20pt.length < 3) {
      setToast({ message: "❌ Cần ít nhất 3 câu hỏi 20 điểm!", type: "error" });
      return;
    }
    if (questions30pt.length < 3) {
      setToast({ message: "❌ Cần ít nhất 3 câu hỏi 30 điểm!", type: "error" });
      return;
    }

    // Check for empty questions
    const allQuestions = [...questions10pt, ...questions20pt, ...questions30pt];
    const hasEmpty = allQuestions.some(
      (q) => !q.questionText.trim() || !q.referenceAnswer.trim()
    );
    if (hasEmpty) {
      setToast({
        message: "❌ Tất cả câu hỏi phải có nội dung và đáp án!",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Add points field to each question
      const payload = {
        questions10pt: questions10pt.map(q => ({ ...q, points: 10 as 10 | 20 | 30 })),
        questions20pt: questions20pt.map(q => ({ ...q, points: 20 as 10 | 20 | 30 })),
        questions30pt: questions30pt.map(q => ({ ...q, points: 30 as 10 | 20 | 30 })),
      };
      
      console.log("Saving Payload:", payload); // Debug log

      const res = await fetch("/api/finishline/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setToast({ message: "✅ Đã lưu ngân hàng câu hỏi!", type: "success" });
        loadBank();
      } else {
        setToast({ message: `❌ Lỗi: ${data.error}`, type: "error" });
      }
    } catch (error) {
      console.error("Error saving bank:", error);
      setToast({ message: "❌ Lỗi khi lưu!", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (
    file: File,
    category: "10pt" | "20pt" | "30pt",
    index: number
  ) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/finishline/upload-media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        updateQuestion(category, index, {
          mediaUrl: data.url,
          mediaType: data.mediaType
        });
        setToast({ message: "✅ Upload thành công!", type: "success" });
      } else {
        setToast({ message: `❌ Upload thất bại: ${data.error}`, type: "error" });
      }
    } catch (error) {
      console.error("Error uploading:", error);
      setToast({ message: "❌ Lỗi khi upload!", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const addQuestion = (category: "10pt" | "20pt" | "30pt") => {
    const newQuestion: Question = {
      questionText: "",
      referenceAnswer: "",
    };

    if (category === "10pt") {
      setQuestions10pt([...questions10pt, newQuestion]);
    } else if (category === "20pt") {
      setQuestions20pt([...questions20pt, newQuestion]);
    } else {
      setQuestions30pt([...questions30pt, newQuestion]);
    }
  };

  const updateQuestion = (
    category: "10pt" | "20pt" | "30pt",
    index: number,
    fieldOrUpdates: keyof Question | Partial<Question>,
    value?: string
  ) => {
    const updateList = (list: Question[]) => {
      const updated = [...list];
      if (typeof fieldOrUpdates === "string") {
        updated[index] = { ...updated[index], [fieldOrUpdates]: value };
      } else {
        updated[index] = { ...updated[index], ...fieldOrUpdates };
      }
      return updated;
    };

    if (category === "10pt") {
      setQuestions10pt((prev) => updateList(prev));
    } else if (category === "20pt") {
      setQuestions20pt((prev) => updateList(prev));
    } else {
      setQuestions30pt((prev) => updateList(prev));
    }
  };

  const deleteQuestion = (category: "10pt" | "20pt" | "30pt", index: number) => {
    setConfirmConfig({
        isOpen: true,
        title: "Xóa câu hỏi",
        message: "Xóa câu hỏi này?",
        onConfirm: () => {
            if (category === "10pt") {
              setQuestions10pt(questions10pt.filter((_, i) => i !== index));
            } else if (category === "20pt") {
              setQuestions20pt(questions20pt.filter((_, i) => i !== index));
            } else {
              setQuestions30pt(questions30pt.filter((_, i) => i !== index));
            }
            setToast({ message: "Đã xóa câu hỏi", type: "info" });
        },
        type: 'danger'
    });
  };


  const currentQuestions: Question[] =
    activeTab === "10pt"
      ? questions10pt
      : activeTab === "20pt"
      ? questions20pt
      : questions30pt;

  if (loading && questions10pt.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-purple-400">
            📚 Quản lý Ngân hàng Câu hỏi - Vòng Về Đích
          </h1>
          <p className="text-slate-400 mt-2">
            Mỗi loại cần tối thiểu 3 câu hỏi. Total:{" "}
            <span className="text-white font-bold">
              {questions10pt.length + questions20pt.length + questions30pt.length}
            </span>
          </p>
        </div>
        <button
          onClick={handleSaveBank}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95"
        >
          {loading ? (
            <>
              <LoadingSpinner />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              LƯU NGÂN HÀNG
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 pb-2">
        {(["10pt", "20pt", "30pt"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-t-lg font-bold transition-all ${
              activeTab === tab
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Câu {tab} (
            {tab === "10pt"
              ? questions10pt.length
              : tab === "20pt"
              ? questions20pt.length
              : questions30pt.length}
            )
          </button>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={() => addQuestion(activeTab)}
        className="mb-6 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95"
      >
        <Plus size={20} />
        Thêm câu hỏi {activeTab}
      </button>

      {/* Question List */}
      <div className="space-y-4">
        {currentQuestions.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg">
              &quot;Thêm câu hỏi&quot; để bắt đầu!
            </p>
          </div>
        ) : (
          currentQuestions.map((q, idx) => (
            <div
              key={idx}
              className="bg-slate-800 border-2 border-purple-500 rounded-xl p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">
                  #{idx + 1}
                </span>
                <button
                  onClick={() => deleteQuestion(activeTab, idx)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <label className="block text-white font-bold mb-2">
                  Câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={q.questionText}
                  onChange={(e) =>
                    updateQuestion(activeTab, idx, "questionText", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                  rows={3}
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-white font-bold mb-2">
                  Mô tả / Gợi ý (tùy chọn)
                </label>
                <textarea
                  value={q.questionDescription || ""}
                  onChange={(e) =>
                    updateQuestion(activeTab, idx, "questionDescription", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                  rows={2}
                  placeholder="Gợi ý hoặc thông tin thêm..."
                />
              </div>

              {/* Media Upload */}
              <div className="mb-4">
                <label className="block text-white font-bold mb-2">
                  Media (Image/Video/Audio) -{" "}
                  <span className="text-slate-400 font-normal text-sm">Tùy chọn</span>
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleMediaUpload(file, activeTab, idx);
                      }
                    }}
                    className="flex-1 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer"
                    disabled={uploading}
                  />
                  {q.mediaUrl && (
                    <a
                      href={q.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      Xem file
                    </a>
                  )}
                </div>
                {q.mediaType && (
                  <p className="text-sm text-slate-400 mt-2">
                    Type: <span className="text-purple-400 font-bold">{q.mediaType}</span>
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  💡 Không bắt buộc - Có thể tạo câu hỏi chỉ có text
                </p>
              </div>

              {/* Reference Answer */}
              <div>
                <label className="block text-white font-bold mb-2">
                  Đáp án tham khảo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={q.referenceAnswer}
                  onChange={(e) =>
                    updateQuestion(activeTab, idx, "referenceAnswer", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                  placeholder="Nhập đáp án chính xác..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Hệ thống sẽ tự động so sánh đáp án player với đáp án này (fuzzy matching)
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
