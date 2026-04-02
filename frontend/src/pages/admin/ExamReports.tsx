import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { FileText, Search, Download } from 'lucide-react';

const ExamReports: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load danh sách kỳ thi để chọn
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const resp: any = await adminApi.getExams();
        setExams(resp?.data || resp || []);
      } catch (error) {
        console.error('Lỗi lấy danh sách đề thi:', error);
      }
    };
    fetchExams();
  }, []);

  // Fetch Report khi chọn Exam
  useEffect(() => {
    if (!selectedExamId) {
      setReport(null);
      return;
    }
    const fetchReport = async () => {
      try {
        const resp: any = await adminApi.getExamResults(Number(selectedExamId));
        setReport(resp?.data || resp);
      } catch (error) {
        console.error('Lỗi lấy báo cáo:', error);
        setReport(null);
      }
    };
    fetchReport();
  }, [selectedExamId]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Báo cáo & Chấm điểm</h1>
          <p className="text-slate-500 mt-1">Xem thống kê và xuất bảng điểm thí sinh theo đợt thi</p>
        </div>
        
        <div className="flex items-center min-w-[300px]">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <select 
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 shadow-sm appearance-none"
            >
              <option value="">-- Chọn một đợt thi để xem --</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!selectedExamId ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center mt-8">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Chưa chọn đợt thi</h3>
          <p className="text-slate-500 mt-2">Vui lòng dùng thanh xổ xuống phía trên để chọn đợt thi cần xuất báo cáo.</p>
        </div>
      ) : !report ? (
        <div className="text-center p-12">Đang tải báo cáo hoặc không có dữ liệu...</div>
      ) : (
        <div className="space-y-6">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Môn thi</p>
              <p className="text-xl font-bold text-indigo-600 line-clamp-1">{report.examTitle}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Đã nộp bài</p>
              <p className="text-2xl font-black text-slate-800">{report.totalSubmitted}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Điểm trung bình</p>
              <p className="text-2xl font-black text-emerald-600">{report.averageScore?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Bảng điểm chi tiết</h3>
              <button className="flex items-center px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors text-sm">
                <Download size={16} className="mr-2" /> Xuất Excel
              </button>
            </div>

            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-white text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-16 text-center border-r border-slate-100">Hạng</th>
                  <th className="px-6 py-4">Tên Thí sinh</th>
                  <th className="px-6 py-4">Điểm số</th>
                  <th className="px-6 py-4">Số câu đúng</th>
                  <th className="px-6 py-4">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.results && report.results.length > 0 ? (
                  report.results.map((r: any, idx: number) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-black text-center border-r border-slate-100 text-slate-400">
                        {idx === 0 ? <span className="text-amber-500">#1</span> 
                        : idx === 1 ? <span className="text-slate-400">#2</span> 
                        : idx === 2 ? <span className="text-amber-700">#3</span> 
                        : `#${idx + 1}`}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{r.studentName}</td>
                      <td className="px-6 py-4 font-bold text-indigo-600 text-lg">{r.score.toFixed(2)}</td>
                      <td className="px-6 py-4">{r.totalCorrect} / {r.totalQuestions}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(r.submittedAt).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có thí sinh nào nộp bài.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamReports;
