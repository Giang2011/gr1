import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, Send, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Layout, ShieldAlert } from 'lucide-react';
import Swal from 'sweetalert2';
import { studentApi, type ExamQuestionResponseDTO, type SubmitSessionRequestDTO } from '../../api/studentApi';

const IMG_BASE_URL = 'http://localhost:8080/uploads/';

const ExamInterface: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<ExamQuestionResponseDTO[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Anti-cheat violations count
  const [violations, setViolations] = useState(0);
  const isFirstLoad = useRef(true);

  // Submit Logic
  const submitExam = useCallback(async (isAutoSubmit = false) => {
    if (!sessionId || submitting) return;

    if (!isAutoSubmit) {
      const confirmSubmit = await Swal.fire({
        title: 'Xác nhận nộp bài?',
        text: 'Bạn sẽ không thể thay đổi đáp án sau khi nộp.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Nộp bài ngay',
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
      toast.success(isAutoSubmit ? 'Hết giờ! Bài thi đã được tự động nộp.' : 'Nộp bài thành công!');
      navigate(`/student/results/session/${sessionId}`, { replace: true });
    } catch (error) {
      console.error('Lỗi khi nộp bài:', error);
      toast.error('Lỗi khi nộp bài. Đang thử lại...');
      setSubmitting(false);
    }
  }, [sessionId, answers, navigate, submitting]);

  // Anti-cheat Listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submitting && !loading) {
        setViolations(v => v + 1);
        toast.error('Cảnh báo: Bạn đã rời khỏi tab thi! Hành vi này sẽ được ghi lại.', {
          icon: '⚠️',
          duration: 5000
        });
      }
    };

    const handleBlur = () => {
      if (!submitting && !loading) {
        setViolations(v => v + 1);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [submitting, loading]);

  // Initialize Data & Timer
  useEffect(() => {
    const initExam = async () => {
      try {
        if (!sessionId) return;
        
        const [sessionData, questionsData]: any = await Promise.all([
          studentApi.getSessionById(Number(sessionId)),
          studentApi.getSessionQuestions(Number(sessionId))
        ]);

        const session = sessionData?.data || sessionData;
        const qList = questionsData?.data || questionsData || [];
        setQuestions(qList);
        
        // Calculate Time Left based on server's startTime and endTime
        const endTime = new Date(session.endTime).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((endTime - now) / 1000);
        
        if (diff > 0) {
          setTimeLeft(diff);
        } else {
          submitExam(true);
        }
      } catch (error) {
        toast.error('Lỗi khởi tạo bài thi. Vui lòng quay lại trang danh sách.');
        navigate('/student/exams');
      } finally {
        setLoading(false);
      }
    };
    initExam();
  }, [sessionId, navigate, submitExam]);

  // Countdown Interval
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (prev === 1) submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting, submitExam]);

  const handleSelectAnswer = (questionId: number, answerId: number, isMultiple: boolean = false) => {
    setAnswers(prev => {
      if (!isMultiple) return { ...prev, [questionId]: [answerId] };
      
      const current = prev[questionId] || [];
      const updated = current.includes(answerId)
        ? current.filter(id => id !== answerId)
        : [...current, answerId];
        
      return { ...prev, [questionId]: updated };
    });
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">Đang thiết lập môi trường thi...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isTimeWarning = timeLeft !== null && timeLeft <= 300;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col selection:bg-indigo-100">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none">Hệ thống Thi trực tuyến</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mã phiên thi: #{sessionId}</p>
          </div>
        </div>
        
        <div className={`flex items-center px-6 py-2 rounded-2xl font-mono text-2xl font-black transition-all ${
          isTimeWarning ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-900 text-white'
        }`}>
          <Clock size={22} className="mr-3" />
          {formatTime(timeLeft)}
        </div>
        
        <button
          onClick={() => submitExam(false)}
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? 'Đang nộp...' : <><Send size={16} /> Nộp bài</>}
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 flex flex-col lg:flex-row gap-10">
        
        {/* Left: Question Area */}
        <div className="flex-1 space-y-8">
          {currentQuestion && (
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                    {currentQuestionIndex + 1}
                  </span>
                  <div>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Câu hỏi hiện tại</h2>
                    <p className="text-sm font-bold text-slate-800">Chọn phương án trả lời đúng nhất</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${currentQuestion.isMultipleChoice ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                  {currentQuestion.isMultipleChoice ? 'Nhiều đáp án' : 'Một đáp án'}
                </div>
              </div>
              
              <div className="p-10 space-y-8">
                {/* Question Content */}
                <div className="space-y-6">
                  <div className="text-xl font-bold text-slate-800 leading-relaxed">
                    {currentQuestion.content}
                  </div>
                  {currentQuestion.imageUrl && (
                    <div className="flex justify-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <img src={`${IMG_BASE_URL}${currentQuestion.imageUrl}`} className="max-w-full max-h-[400px] rounded-2xl shadow-lg" alt="Question" />
                    </div>
                  )}
                </div>
                
                {/* Answer Options */}
                <div className="grid grid-cols-1 gap-4">
                  {currentQuestion.answers?.map((answer, idx) => {
                    const isSelected = answers[currentQuestion.examQuestionId]?.includes(answer.examAnswerId);
                    
                    return (
                      <label 
                        key={answer.examAnswerId}
                        className={`group relative flex flex-col p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100/50' 
                            : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <input
                            type={currentQuestion.isMultipleChoice ? "checkbox" : "radio"}
                            name={`question_${currentQuestion.examQuestionId}`}
                            checked={isSelected || false}
                            onChange={() => handleSelectAnswer(currentQuestion.examQuestionId, answer.examAnswerId, !!currentQuestion.isMultipleChoice)}
                            className="sr-only"
                          />
                          <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg' : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-300'
                          }`}>
                            <span className="font-black text-xs">{String.fromCharCode(65 + idx)}</span>
                          </div>
                          <div className={`text-lg font-bold flex-1 ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {answer.content}
                          </div>
                        </div>
                        {answer.imageUrl && (
                          <div className="mt-4 ml-13 pl-13">
                             <img src={`${IMG_BASE_URL}${answer.imageUrl}`} className="max-w-[200px] rounded-xl border border-slate-200 shadow-sm" alt="Option" />
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="px-10 py-8 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={18} /> Câu trước
                </button>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 transition-all shadow-xl shadow-slate-200"
                  >
                    Câu tiếp theo <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Status Sidebar */}
        <div className="lg:w-80 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sticky top-28 space-y-8">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Layout size={14} /> Tiến độ làm bài
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.examQuestionId]?.length;
                  const isCurrent = currentQuestionIndex === idx;
                  
                  return (
                    <button
                      key={q.examQuestionId}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`
                        aspect-square rounded-xl text-xs font-black transition-all flex items-center justify-center border-2
                        ${isCurrent ? 'scale-110 shadow-lg ring-2 ring-indigo-500 ring-offset-2' : ''}
                        ${isAnswered ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-300'}
                      `}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 space-y-4">
               <div className="flex items-center justify-between text-xs font-bold">
                 <span className="text-slate-400">Đã trả lời</span>
                 <span className="text-indigo-600">{Object.keys(answers).length} / {questions.length}</span>
               </div>
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-indigo-600 transition-all duration-500" 
                   style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                 ></div>
               </div>
            </div>

            {violations > 0 && (
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 animate-in shake duration-500">
                <ShieldAlert className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Vi phạm quy chế</p>
                  <p className="text-xs font-bold text-red-700 mt-1">Ghi nhận {violations} lần chuyển tab/mất tập trung.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default ExamInterface;
