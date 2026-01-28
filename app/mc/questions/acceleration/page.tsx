'use client';

import MCGuard from '@/components/auth/MCGuard';
import AccelerationResourceForm from '@/components/game/rounds/acceleration/setup/AccelerationResourceForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AccelerationQuestionsPage() {
  return (
    <MCGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-black p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black text-amber-500 mb-2">
                QUẢN LÝ CÂU HỎI VÒNG TĂNG TỐC
              </h1>
              <p className="text-slate-400">
                Upload và quản lý 4 câu hỏi cho vòng thi Tăng Tốc
              </p>
            </div>
            <Link
              href="/mc/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors border border-slate-700"
            >
              <ArrowLeft size={20} />
              Quay lại Dashboard
            </Link>
          </div>

          {/* Form */}
          <AccelerationResourceForm />
        </div>
      </div>
    </MCGuard>
  );
}
