import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Users, ArrowRight } from 'lucide-react';
import { studentApi, type ExamResponseDTO } from '../../api/studentApi';

const ExamList: React.FC = () => {
  const [exams, setExams] = useState<ExamResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data: any = await studentApi.getExams();
        // Giả sử API trả về mảng trực tiếp hoặc nằm trong data.data
        setExams(data?.data || data || []);
      } catch (error) {
        console.error('Lỗi khi tải danh sách bài thi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Sắp diễn ra</span>;
      case 'ONGOING':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Đang diễn ra</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">Đã kết thúc</span>;
      default:
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Danh sách kỳ thi</h1>
          <p className="text-slate-500 mt-2">Tham gia các kỳ thi do Giảng viên phân công</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Không có kỳ thi nào</h3>
          <p className="text-slate-500 mt-1">Hiện chưa có kỳ thi nào dành cho bạn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <BookOpen size={24} />
                </div>
                {getStatusBadge(exam.status)}
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2">{exam.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{exam.subjectName}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-slate-600">
                  <Clock size={16} className="mr-2 text-slate-400" />
                  Thời gian: <span className="font-semibold ml-1">{exam.duration} phút</span>
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Users size={16} className="mr-2 text-slate-400" />
                  Số câu hỏi: <span className="font-semibold ml-1">{exam.totalQuestions}</span>
                </div>
              </div>
              
              <Link 
                to={`/student/exams/${exam.id}`}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-xl font-medium transition-colors border border-slate-100 hover:border-indigo-100"
              >
                Xem chi tiết
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamList;
