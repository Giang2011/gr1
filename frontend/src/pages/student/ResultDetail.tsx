import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Calendar, Search, ArrowLeft } from 'lucide-react';
import { studentApi, type ResultResponseDTO } from '../../api/studentApi';

const ResultDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<ResultResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data: any = await studentApi.getResultBySession(Number(sessionId));
        setResult(data?.data || data);
      } catch (error) {
        console.error('Lỗi khi tải chi tiết kết quả:', error);
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!result) {
    return <div className="text-center p-8 text-slate-500">Không tìm thấy thông tin kết quả.</div>;
  }

  // Chuyển đổi điểm số sang % để làm progress bar
  const scorePercentage = Math.round((result.totalCorrect / result.totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      
      <div className="mb-6">
        <Link to="/student/results" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Decorative Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
        </div>
        
        {/* Profile / Trophy Icon */}
        <div className="px-8 absolute top-16 left-0 right-0 flex justify-center">
          <div className="w-24 h-24 bg-white rounded-full p-2 shadow-xl border border-slate-100">
            <div className={`w-full h-full rounded-full flex items-center justify-center ${
              scorePercentage >= 80 ? 'bg-emerald-100 text-emerald-600' :
              scorePercentage >= 50 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
            }`}>
              <Award size={40} />
            </div>
          </div>
        </div>

        <div className="pt-20 px-8 pb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-800">{result.examTitle}</h1>
          <p className="text-slate-500 mt-2 font-medium">Báo cáo kết quả của: {result.studentName}</p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* Box 1: Điểm */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Điểm tổng kết</p>
              <div className="text-4xl font-black text-indigo-600">{result.score.toFixed(2)}</div>
              <p className="text-xs text-slate-400 mt-1">/ 10 điểm</p>
            </div>
            
            {/* Box 2: Tỉ lệ Đúng Sai */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Số câu đúng</p>
              <div className="text-4xl font-black text-emerald-500">{result.totalCorrect}</div>
              <p className="text-xs text-slate-400 mt-1">/ {result.totalQuestions} câu hỏi</p>
            </div>

            {/* Box 3: Thông tin */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-slate-600 space-y-3">
              <div className="flex items-center text-sm font-medium w-full justify-center">
                <Calendar size={18} className="mr-2 text-slate-400" />
                {new Date(result.submittedAt).toLocaleDateString('vi-VN')}
              </div>
              <div className="flex items-center text-sm font-medium w-full justify-center">
                <Search size={18} className="mr-2 text-slate-400" />
                Thời gian nộp bài: <br/>{new Date(result.submittedAt).toLocaleTimeString('vi-VN')}
              </div>
            </div>
          </div>

          <div className="mt-12 max-w-2xl mx-auto text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700">Tỉ lệ hoàn thành xuất sắc</span>
              <span className="font-bold text-indigo-600">{scorePercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-3 rounded-full ${
                  scorePercentage >= 80 ? 'bg-emerald-500' :
                  scorePercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`} 
                style={{ width: `${scorePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDetail;
