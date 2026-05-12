import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { FileText, Search, Download, TrendingUp, Users, Award, BarChart3, ChevronRight, Hash, ChevronDown, Check } from 'lucide-react';
import CustomSelect from '../../components/common/CustomSelect';

const ExamReports: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const resp: any = await adminApi.getExams();
        setExams(resp?.data || resp || []);
      } catch (error) {
        console.error('Lỗi lấy danh sách đề thi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Thống kê & Báo cáo</h1>
          <p className="text-slate-500 mt-2 font-medium">Phân tích kết quả, xếp hạng và xuất bảng điểm thí sinh</p>
        </div>
        
        <div className="w-full md:w-80">
          <CustomSelect 
            options={exams.map(ex => ({ id: ex.id, name: ex.title }))}
            value={selectedExamId}
            onChange={(val) => setSelectedExamId(val.toString())}
            placeholder="-- Chọn đợt thi --"
            icon={<BarChart3 size={20} />}
          />
        </div>
      </div>

      {!selectedExamId ? (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-20 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mb-6 animate-bounce duration-1000">
            <FileText size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Trung tâm Phân tích Dữ liệu</h3>
          <p className="text-slate-400 mt-4 max-w-sm font-medium leading-relaxed">Vui lòng chọn một đợt thi từ danh mục phía trên để xem các báo cáo thống kê chi tiết.</p>
        </div>
      ) : !report ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold">Đang tổng hợp dữ liệu...</p>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in duration-700">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="modern-card p-8 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-0">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Đợt thi hiện tại</p>
                <Award size={24} className="text-indigo-300" />
              </div>
              <p className="text-2xl font-black line-clamp-2 leading-tight">{report.examTitle}</p>
            </div>
            
            <div className="modern-card p-8 group hover:scale-[1.02] transition-all">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tổng thí sinh nộp bài</p>
                <Users size={24} className="text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-slate-900">{report.totalSubmitted}</p>
                <span className="text-slate-400 font-bold text-sm uppercase">Học viên</span>
              </div>
            </div>

            <div className="modern-card p-8 group hover:scale-[1.02] transition-all">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Điểm trung bình</p>
                <TrendingUp size={24} className="text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-slate-900">{report.averageScore?.toFixed(2) || '0.00'}</p>
                <span className="text-slate-400 font-bold text-sm uppercase">/ 10</span>
              </div>
            </div>
          </div>

          {/* Ranking Table Section */}
          <div className="modern-card overflow-hidden border-slate-100 shadow-2xl shadow-slate-200/40">
            <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
              <div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Bảng xếp hạng Chi tiết</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sắp xếp theo điểm số từ cao xuống thấp</p>
              </div>
              <button className="flex items-center px-8 py-3.5 bg-white hover:bg-slate-900 hover:text-white text-slate-900 font-black rounded-2xl transition-all text-xs uppercase tracking-widest border border-slate-200 shadow-sm gap-2">
                <Download size={16} /> Xuất Bảng điểm (CSV)
              </button>
            </div>

            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="px-10 py-6 text-center w-24">Hạng</th>
                  <th className="px-10 py-6">Học viên</th>
                  <th className="px-10 py-6">Kết quả</th>
                  <th className="px-10 py-6">Độ chính xác</th>
                  <th className="px-10 py-6">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {report.results && report.results.length > 0 ? (
                  report.results.map((r: any, idx: number) => (
                    <tr key={r.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-10 py-6">
                        <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center font-black text-sm border-2 ${
                          idx === 0 ? 'bg-amber-50 border-amber-200 text-amber-600' : 
                          idx === 1 ? 'bg-slate-50 border-slate-200 text-slate-400' : 
                          idx === 2 ? 'bg-orange-50 border-orange-200 text-orange-700' : 
                          'bg-white border-slate-50 text-slate-300'
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 uppercase text-xs">
                             {r.studentName.charAt(0)}
                          </div>
                          <span className="font-black text-slate-800 text-base">{r.studentName}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="text-xl font-black text-indigo-600">{r.score.toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Thang điểm 10</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1.5 w-32">
                          <div className="flex justify-between text-[10px] font-black text-slate-500">
                             <span>{r.totalCorrect}/{r.totalQuestions} câu</span>
                             <span>{Math.round((r.totalCorrect/r.totalQuestions)*100)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-emerald-500 rounded-full transition-all" 
                               style={{ width: `${(r.totalCorrect/r.totalQuestions)*100}%` }}
                             ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col text-slate-400 font-bold">
                           <span className="text-xs">{new Date(r.submittedAt).toLocaleTimeString('vi-VN')}</span>
                           <span className="text-[10px]">{new Date(r.submittedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="text-center py-20 text-slate-400 font-bold">Chưa có dữ liệu thí sinh nộp bài trong đợt thi này.</td></tr>
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
