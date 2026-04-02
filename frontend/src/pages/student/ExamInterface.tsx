import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, Send, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, BookOpen } from 'lucide-react';
import Swal from 'sweetalert2';
import { studentApi, type ExamQuestionResponseDTO, type SubmitSessionRequestDTO } from '../../api/studentApi';

const ExamInterface: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<ExamQuestionResponseDTO[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Trạng thái lưu trữ đáp án: map { examQuestionId: [selectedAnswerIds] }
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gọi hàm nộp bài
  const submitExam = useCallback(async (isAutoSubmit = false) => {
    if (!sessionId) return;
    if (submitting) return;

    if (!isAutoSubmit) {
      const confirmSubmit = await Swal.fire({
        title: 'Nộp bài ngay?',
        text: 'Bạn có chắc chắn muốn nộp bài ngay bây giờ?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Nộp bài',
        cancelButtonText: 'Hủy'
      });
      if (!confirmSubmit.isConfirmed) return;
    }

    setSubmitting(true);
    try {
      const payload: SubmitSessionRequestDTO = {
        answers: Object.entries(answers).map(([qId, aIds]) => ({
          examQuestionId: Number(qId),
          selectedExamAnswerIds: aIds,
        }))
      };
      
      await studentApi.submitSession(Number(sessionId), payload);
      
      // Xóa localStorage timer
      localStorage.removeItem(`exam_end_${sessionId}`);
      
      // Chuyển hướng sang trang kết quả
      navigate(`/student/results/session/${sessionId}`, { replace: true });
    } catch (error) {
      console.error('Lỗi khi nộp bài:', error);
      if (!isAutoSubmit) toast.error('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      setSubmitting(false);
    }
  }, [sessionId, answers, navigate, submitting]);

  // Khởi tạo
  useEffect(() => {
    const fetchQuestionsAndSetupTimer = async () => {
      try {
        if (!sessionId) return;
        
        // 1. Fetch câu hỏi
        const qData: any = await studentApi.getSessionQuestions(Number(sessionId));
        const qList = qData?.data || qData || [];
        setQuestions(qList);
        
        // 2. Setup timer từ localStorage (Do API không cung cấp session info)
        const endTimeStr = localStorage.getItem(`exam_end_${sessionId}`);
        if (endTimeStr) {
          const endTime = new Date(endTimeStr).getTime();
          const now = new Date().getTime();
          const diffSeconds = Math.floor((endTime - now) / 1000);
          
          if (diffSeconds > 0) {
            setTimeLeft(diffSeconds);
          } else {
            // Đã hết giờ từ trước
            setTimeLeft(0);
            submitExam(true);
          }
        } else {
          // Fallback nếu không có endTime (ví dụ truy cập thẳng link)
          // Tạm set 60 phút
          setTimeLeft(60 * 60);
        }
      } catch (error) {
        console.error('Lỗi tải câu hỏi:', error);
        toast.error('Lỗi tải câu hỏi kỳ thi!');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestionsAndSetupTimer();
  }, [sessionId, submitExam]);

  // Bộ đếm thời gian
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return;

    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timerId);
          submitExam(true); // Hết giờ tự nộp
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, submitting, submitExam]);

  // Format thời gian HH:mm:ss
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (questionId: number, answerId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: [answerId] // Hiện tại chỉ hỗ trợ chọn 1 đáp án (Radio). Nếu Multicheck thì sẽ đổi logic.
    }));
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isTimeWarning = timeLeft !== null && timeLeft <= 300; // Cảnh báo 5 phút cuối

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center">
          <BookOpen className="text-indigo-600 mr-3" size={24} />
          <h1 className="text-xl font-bold text-slate-800">Đang làm bài thi</h1>
        </div>
        
        <div className={`flex items-center px-5 py-2.5 rounded-full font-mono text-xl font-bold shadow-sm border transition-colors ${
          isTimeWarning ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          <Clock size={20} className="mr-2" />
          {formatTime(timeLeft)}
        </div>
        
        <button
          onClick={() => submitExam(false)}
          disabled={submitting}
          className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {submitting ? 'Đang nộp...' : <><Send size={18} className="mr-2" /> Nộp bài</>}
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Question Form */}
        <div className="flex-1 flex flex-col">
          {currentQuestion ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="mb-6 flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-800">
                  Câu hỏi {currentQuestionIndex + 1}
                </h2>
                <span className="text-sm font-medium text-slate-400">
                  ID: {currentQuestion.examQuestionId}
                </span>
              </div>
              
              <div className="text-lg text-slate-700 leading-relaxed mb-8 font-medium">
                {currentQuestion.content}
              </div>
              
              <div className="space-y-4 mb-auto">
                {currentQuestion.answers?.map((answer) => {
                  const isSelected = answers[currentQuestion.examQuestionId]?.includes(answer.examAnswerId);
                  
                  return (
                    <label 
                      key={answer.examAnswerId}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative flex items-center justify-center mr-4">
                        <input
                          type="radio"
                          name={`question_${currentQuestion.examQuestionId}`}
                          checked={isSelected || false}
                          onChange={() => handleSelectAnswer(currentQuestion.examQuestionId, answer.examAnswerId)}
                          className="peer sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-indigo-600' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-in zoom-in duration-200" />}
                        </div>
                      </div>
                      <span className={`text-base ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                        {answer.content}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={20} className="mr-1" /> Câu trước
                </button>
                
                {isLastQuestion ? (
                  <button
                    onClick={() => submitExam(false)}
                    className="flex items-center px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold transition-colors"
                  >
                    <CheckCircle2 size={20} className="mr-2" /> Hoàn thành
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors"
                  >
                    Câu tiếp <ChevronRight size={20} className="ml-1" />
                  </button>
                )}
              </div>
            </div>
          ) : (
             <div className="text-center p-12 text-slate-500">Đang khởi tạo dữ liệu câu hỏi...</div>
          )}
        </div>

        {/* Right Side: Navigation Panel */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-28">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              Mục lục câu hỏi
            </h3>
            
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isSelected = !!answers[q.examQuestionId]?.length;
                const isCurrent = currentQuestionIndex === idx;
                
                return (
                  <button
                    key={q.examQuestionId}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`
                      w-full aspect-square flex items-center justify-center rounded-lg text-sm font-semibold border transition-all
                      ${isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}
                      ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3 text-sm text-slate-600">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-indigo-600 rounded mr-3"></div> Đã trả lời
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white border border-slate-300 rounded mr-3"></div> Chưa trả lời
              </div>
            </div>

            {isTimeWarning && (
              <div className="mt-6 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs font-medium flex items-start animate-in fade-in duration-300">
                <AlertTriangle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                Thời gian sắp hết. Hệ thống sẽ tự động nộp bài khi đếm ngược về 0!
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExamInterface;
