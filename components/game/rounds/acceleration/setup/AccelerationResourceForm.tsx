'use client';
import { useState, useEffect } from 'react';
import { Video, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { Toast, ToastType } from '@/components/ui/Toast';
import { AnimatePresence } from 'framer-motion';

interface Question {
  questionNumber: 1 | 2 | 3 | 4;
  mediaType: 'VIDEO' | 'IMAGE';
  mediaUrl: string;
  questionText: string;
  questionDescription?: string;
  timeLimit: number;
  referenceAnswer?: string;
}

export default function AccelerationResourceForm() {
  const [questions, setQuestions] = useState<Question[]>([
    { questionNumber: 1, mediaType: 'VIDEO', mediaUrl: '', questionText: '', timeLimit: 30 },
    { questionNumber: 2, mediaType: 'VIDEO', mediaUrl: '', questionText: '', timeLimit: 30 },
    { questionNumber: 3, mediaType: 'VIDEO', mediaUrl: '', questionText: '', timeLimit: 30 },
    { questionNumber: 4, mediaType: 'VIDEO', mediaUrl: '', questionText: '', timeLimit: 30 },
  ]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Load existing data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const response = await fetch('/api/acceleration/resource');
        if (response.ok) {
          const data = await response.json();
          if (data.resource) {
            setResourceId(data.resource._id);
            setQuestions(data.resource.questions);
          }
        }
      } catch (error) {
        console.error('Failed to load existing data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExistingData();
  }, []);

  const handleMediaUpload = async (questionIndex: number, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/acceleration/upload-media', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      const newQuestions = [...questions];
      newQuestions[questionIndex].mediaUrl = data.url;
      newQuestions[questionIndex].mediaType = data.mediaType as 'VIDEO' | 'IMAGE';
      setQuestions(newQuestions);
    } catch (error) {
      console.error('Upload failed:', error);
      setToast({ message: 'Upload thất bại. Vui lòng thử lại.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    // Validate
    for (const q of questions) {
      if (!q.mediaUrl || !q.questionText.trim()) {
        setToast({ 
          message: `Câu hỏi ${q.questionNumber}: Vui lòng upload media và nhập nội dung câu hỏi.`, 
          type: 'error' 
        });
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch('/api/acceleration/resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          questions,
          resourceId // Send existing ID to update instead of create
        })
      });

      if (!response.ok) throw new Error('Save failed');

      const data = await response.json();
      
      // Update resourceId if it was a new creation
      if (!resourceId && data.resourceId) {
        setResourceId(data.resourceId);
      }
      
      setToast({ message: `✅ Đã lưu Resource thành công!`, type: 'success' });
    } catch (error) {
      console.error('Save failed:', error);
      setToast({ message: 'Lưu thất bại. Vui lòng thử lại.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 rounded-2xl flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-500 mx-auto mb-4" size={40} />
          <p className="text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-900 rounded-2xl">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
      <h2 className="text-2xl font-bold text-amber-500">Quản Lý Câu Hỏi Tăng Tốc</h2>

      {questions.map((q, idx) => (
        <div key={idx} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Câu {q.questionNumber}</h3>
            <div className="flex gap-2 items-center text-slate-400">
              {q.mediaType === 'VIDEO' ? <Video size={20} /> : <ImageIcon size={20} />}
              <span className="text-sm">{q.mediaType}</span>
            </div>
          </div>

          {/* Upload Media */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Upload Media (Video hoặc Hình ảnh)
            </label>
            <input
              type="file"
              accept="video/*,image/*"
              onChange={(e) => e.target.files && handleMediaUpload(idx, e.target.files[0])}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white hover:file:bg-amber-500"
              disabled={uploading}
            />
            {q.mediaUrl && (
              <p className="text-xs text-green-400 mt-2">✅ Uploaded: {q.mediaUrl.slice(0, 50)}...</p>
            )}
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Nội Dung Câu Hỏi *
            </label>
            <textarea
              value={q.questionText}
              onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
              rows={2}
              placeholder="VD: Thủ đô của nước Pháp là gì?"
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Gợi Ý (Tùy chọn)
            </label>
            <input
              type="text"
              value={q.questionDescription || ''}
              onChange={(e) => updateQuestion(idx, { questionDescription: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="VD: Nằm bên bờ sông Seine"
            />
          </div>

          {/* Reference Answer */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Đáp Án Tham Khảo (Tùy chọn)
            </label>
            <input
              type="text"
              value={q.referenceAnswer || ''}
              onChange={(e) => updateQuestion(idx, { referenceAnswer: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="VD: Paris"
            />
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Thời Gian: {q.timeLimit}s
            </label>
            <input
              type="range"
              min={15}
              max={60}
              step={5}
              value={q.timeLimit}
              onChange={(e) => updateQuestion(idx, { timeLimit: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-95"
      >
        <Save size={20} />
        {saving ? 'Đang lưu...' : 'Lưu Resource'}
      </button>
    </div>
  );
}
