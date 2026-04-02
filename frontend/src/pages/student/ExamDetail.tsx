import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Clock, BookOpen, AlertCircle, Calendar, Play } from 'lucide-react';
import { studentApi, type ExamResponseDTO } from '../../api/studentApi';

const ExamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchExamDetail = async () => {
      try {
        const data: any = await studentApi.getExamById(Number(id));
        setExam(data?.data || data);
      } catch (error) {
        console.error('Lỗi khi tải chi tiết kì thi:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchExamDetail();
  }, [id]);

  const handleStartExam = async () => {
    if (!exam) return;
    
    // Nếu status không phải ONGOING, chặn trên giao diện
    if (exam.status !== 'ONGOING') {
      toast.error('Kỳ thi chưa mở hoặc đã kết thúc!');
      return;
    }

    const confirmStart = await Swal.fire({
      title: 'Bắt đầu làm bài?',
      text: 'Thời gian làm bài sẽ đếm ngược ngay lập tức. Bạn đã sẵn sàng?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Bắt đầu',
      cancelButtonText: 'Hủy'
    });
    if (!confirmStart.isConfirmed) return;

    setStarting(true);
    try {
      const response: any = await studentApi.startSession(exam.id);
      const sessionData = response?.data || response;
      if (sessionData.endTime) {
        localStorage.setItem(`exam_end_${sessionData.id}`, sessionData.endTime);
      }
      navigate(`/student/exam-session/${sessionData.id}`);
    } catch (error: any) {
      console.error('Lỗi khi bắt đầu kì thi:', error);
      toast.error(error.response?.data?.message || 'Không thể bắt đầu kỳ thi ngay lúc này.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!exam) {
    return <div className="text-center p-8 text-slate-500">Không tìm thấy thông tin kỳ thi.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-10 text-white text-center pb-16">
          <div className="inline-flex py-1 px-3 rounded-full bg-white/20 text-white text-xs font-semibold mb-4 backdrop-blur-sm">
            {exam.subjectName}
          </div>
          <h1 className="text-4xl font-bold mb-4">{exam.title}</h1>
          <p className="text-indigo-100 max-w-2xl mx-auto opacity-90">
            Hãy chuẩn bị môi trường yên tĩnh, kết nối mạng ổn định trước khi bắt đầu bài thi.
          </p>
        </div>
        
        <div className="px-8 pb-10 relative mt-[-2rem]">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 flex flex-col md:flex-row gap-8 justify-between relative z-10">
            
            <div className="grid grid-cols-2 gap-6 flex-1">
              <div className="flex items-start">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mr-4"><Clock size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Thời gian</p>
                  <p className="text-lg font-bold text-slate-800">{exam.duration} Phút</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mr-4"><BookOpen size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Số lượng</p>
                  <p className="text-lg font-bold text-slate-800">{exam.totalQuestions} Câu hỏi</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mr-4"><Calendar size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Trạng thái</p>
                  <p className="text-lg font-bold text-emerald-600">{exam.status}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center min-w-[250px] border-l border-slate-100 pl-8">
              <button
                onClick={handleStartExam}
                disabled={starting || exam.status !== 'ONGOING'}
                className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {starting ? 'Đang khởi tạo...' : (
                  <>
                    Bắt đầu làm bài <Play size={20} className="ml-2" fill="currentColor" />
                  </>
                )}
              </button>
              {exam.status !== 'ONGOING' && (
                <p className="text-xs text-red-500 mt-3 font-medium flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  Hiện chưa đến thời gian thi
                </p>
              )}
            </div>
            
          </div>

          <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center text-lg">
              <AlertCircle size={20} className="text-amber-500 mr-2" />
              Quy chế thi
            </h3>
            <ul className="space-y-3 text-slate-600 text-sm list-disc list-inside marker:text-indigo-400">
              <li>Bài thi sẽ được đếm ngược ngay sau khi ấn <strong>Bắt đầu</strong>.</li>
              <li>Hệ thống <strong>không</strong> hỗ trợ tạm dừng. Nếu đóng trình duyệt, đồng hồ vẫn chạy.</li>
              <li>Khi hết thời gian, hệ thống tự động lưu và gửi các câu trả lời đang có.</li>
              <li>Sử dụng phím điều hướng hoặc click bảng số câu hỏi bên tay phải để chuyển câu nhanh.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExamDetail;
