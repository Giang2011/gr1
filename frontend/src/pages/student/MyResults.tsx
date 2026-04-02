import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Target, Calendar, ArrowRight } from 'lucide-react';
import { studentApi, type ResultResponseDTO } from '../../api/studentApi';

const MyResults: React.FC = () => {
  const [results, setResults] = useState<ResultResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data: any = await studentApi.getMyResults();
        setResults(data?.data || data || []);
      } catch (error) {
        console.error('Lỗi khi tải kết quả bài thi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Kết quả học tập</h1>
        <p className="text-slate-500 mt-2">Theo dõi tiến độ và lịch sử làm bài</p>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Chưa có kết quả</h3>
          <p className="text-slate-500 mt-1">Bạn chưa hoàn thành bất kỳ bài thi nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Kỳ thi / Môn học</th>
                  <th className="px-6 py-4">Kết quả đáp án</th>
                  <th className="px-6 py-4">Điểm số / Thứ hạng</th>
                  <th className="px-6 py-4">Ngày nộp</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{result.examTitle}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-emerald-600 font-medium">
                        <Target size={16} className="mr-2" />
                        {result.totalCorrect} / {result.totalQuestions} đúng
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-indigo-600 text-lg">{result.score.toFixed(1)} đ</span>
                        {result.rank && <span className="text-xs text-slate-500 mt-1">Hạng: #{result.rank}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2" />
                        {new Date(result.submittedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link 
                        to={`/student/results/session/${result.examSessionId}`}
                        className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        Chi tiết <ArrowRight size={14} className="ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyResults;
