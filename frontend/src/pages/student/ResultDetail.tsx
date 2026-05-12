import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Calendar, Clock, ArrowLeft, Trophy, CheckCircle2, Target, Hash } from 'lucide-react';
import { studentApi, type ResultResponseDTO } from '../../api/studentApi';

const ResultDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<ResultResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        if (!sessionId) return;
        const data: any = await studentApi.getResultBySession(Number(sessionId));
        setResult(data?.data || data);
      } catch (error) {
        console.error('Lỗi khi tải chi tiết kết quả:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold">Đang chấm điểm và xếp hạng...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center p-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
        <p className="text-slate-500 font-bold">Không tìm thấy thông tin kết quả.</p>
        <Link to="/student/results" className="mt-4 inline-block text-indigo-600 font-bold hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  const scorePercentage = Math.round((result.totalCorrect / result.totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <div className="mb-8">
        <Link to="/student/results" className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-all">
          <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Quay lại lịch sử thi
        </Link>
      </div>

      <div className="modern-card overflow-hidden">
        {/* Banner with Gradient */}
        <div className="h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative z-10 text-center text-white">
            <h1 className="text-3xl font-black tracking-tight">{result.examTitle}</h1>
            <p className="text-white/80 text-xs font-bold uppercase tracking-[0.3em] mt-2">Báo cáo kết quả chi tiết</p>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="p-10 -mt-10 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Rank Card */}
            <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 delay-100">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                <Trophy size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Xếp hạng</p>
              <div className="text-3xl font-black text-slate-900 mt-1 flex items-baseline">
                <span className="text-amber-500 mr-0.5">#</span>{result.rank || '--'}
              </div>
            </div>

            {/* Score Card */}
            <div className="md:col-span-2 bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-between animate-in zoom-in duration-500 delay-200">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Điểm số</p>
                <div className="text-5xl font-black text-white flex items-baseline gap-2">
                  {result.score.toFixed(2)}
                  <span className="text-white/30 text-xl">/ 10</span>
                </div>
              </div>
              <div className="w-20 h-20 relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={226.1} strokeDashoffset={226.1 - (226.1 * scorePercentage) / 100} className="text-indigo-400" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
                  {scorePercentage}%
                </div>
              </div>
            </div>

            {/* Correct Answers Card */}
            <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 delay-300">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đúng / Tổng</p>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {result.totalCorrect} <span className="text-slate-300 mx-1">/</span> {result.totalQuestions}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Target size={18} className="text-indigo-600" />
                Thông tin thi sinh
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Họ và tên</span>
                  <span className="font-black text-slate-800">{result.studentName}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thời gian nộp</span>
                  <span className="font-black text-slate-800">{new Date(result.submittedAt).toLocaleTimeString('vi-VN')} {new Date(result.submittedAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phiên thi</span>
                  <span className="font-black text-indigo-600">#{result.examSessionId}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-200/50 mb-4">
                  <Hash size={32} />
                </div>
                <h4 className="text-lg font-black text-indigo-900 tracking-tight">Thành tích của bạn</h4>
                <p className="text-sm text-indigo-700/70 font-medium mt-2 leading-relaxed">
                  {scorePercentage >= 80 ? 'Thật tuyệt vời! Bạn đã hoàn thành bài thi với kết quả xuất sắc.' : 
                   scorePercentage >= 50 ? 'Khá tốt! Hãy tiếp tục phát huy ở những bài thi tiếp theo nhé.' : 
                   'Cố gắng lên! Bạn cần ôn luyện thêm để đạt kết quả tốt hơn.'}
                </p>
                <div className="mt-8 flex gap-4 w-full">
                  <Link to="/student/exams" className="flex-1 py-4 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-sm transition-all text-center">Ôn tập lại</Link>
                  <Link to="/student/results" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 transition-all text-center">Lịch sử thi</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDetail;
