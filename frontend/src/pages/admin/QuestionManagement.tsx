import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Trash2, X, Plus, Filter, CheckCircle2 } from 'lucide-react';

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lọc
  const [filterSubjectId, setFilterSubjectId] = useState<string>('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    content: '',
    subjectId: '',
    answers: [
      { content: '', isCorrect: false },
      { content: '', isCorrect: false }
    ]
  });

  const fetchQuestions = async () => {
    try {
      const resp: any = await adminApi.getQuestions(filterSubjectId ? Number(filterSubjectId) : undefined);
      // API trả về Page<QuestionResponseDTO> nên list nằm trong resp.data.content
      const content = resp?.data?.content || resp?.content || [];
      setQuestions(content);
    } catch (error) {
      console.error('Lỗi lấy danh sách câu hỏi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const resp: any = await adminApi.getSubjects();
      setSubjects(resp?.data || resp || []);
    } catch (error) {
      console.error('Lỗi lấy môn học:', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [filterSubjectId]);

  const handleDelete = async (id: number) => {
    const confirmDelete = await Swal.fire({
      title: 'Xác nhận xóa câu hỏi',
      text: 'Bạn có chắc chắn muốn xoá câu hỏi này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });
    if (!confirmDelete.isConfirmed) return;
    try {
      await adminApi.deleteQuestion(id);
      fetchQuestions();
      toast.success('Xoá câu hỏi thành công!');
    } catch (error) {
      toast.error('Không thể xoá câu hỏi. Có thể nó đang nằm trong một bài thi.');
    }
  };

  const openCreateModal = () => {
    setFormData({
      content: '',
      subjectId: filterSubjectId || (subjects.length > 0 ? subjects[0].id.toString() : ''),
      answers: [
        { content: '', isCorrect: false },
        { content: '', isCorrect: false }
      ]
    });
    setIsModalOpen(true);
  };

  const handleAddAnswer = () => {
    setFormData((prev: any) => ({
      ...prev,
      answers: [...prev.answers, { content: '', isCorrect: false }]
    }));
  };

  const handleRemoveAnswer = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      answers: prev.answers.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleAnswerChange = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const newAnswers = [...prev.answers];
      newAnswers[index] = { ...newAnswers[index], [field]: value };
      
      // Nếu Radio (chỉ 1 câu đúng), update các câu khác thành false
      if (field === 'isCorrect' && value === true) {
        newAnswers.forEach((a, i) => {
          if (i !== index) a.isCorrect = false;
        });
      }
      
      return { ...prev, answers: newAnswers };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId) {
      toast.error('Vui lòng chọn môn học'); return;
    }
    const hasCorrect = formData.answers.some((a: any) => a.isCorrect);
    if (!hasCorrect) {
      toast.error('Phải có ít nhất 1 đáp án đúng!'); return;
    }
    
    try {
      await adminApi.createQuestion({
        ...formData,
        subjectId: Number(formData.subjectId)
      });
      setIsModalOpen(false);
      fetchQuestions();
      toast.success('Tạo câu hỏi thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi khi tạo câu hỏi');
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ngân hàng câu hỏi</h1>
          <p className="text-slate-500 mt-1">Quản lý câu hỏi trắc nghiệm theo môn học</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1 shadow-sm">
            <Filter size={16} className="text-slate-400 mr-2" />
            <select 
              value={filterSubjectId} 
              onChange={e => setFilterSubjectId(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 py-1"
            >
              <option value="">-- Tất cả môn học --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <button onClick={openCreateModal} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm">
            <Plus size={18} className="mr-2" /> Thêm câu hỏi
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-16">ID</th>
              <th className="px-6 py-4">Nội dung câu hỏi</th>
              <th className="px-6 py-4 w-40">Môn học</th>
              <th className="px-6 py-4 text-center w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8">Đang tải...</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-slate-500">Chưa có câu hỏi nào.</td></tr>
            ) : questions.map(q => (
              <tr key={q.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium">{q.id}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">
                  <div className="line-clamp-2">{q.content}</div>
                  <div className="text-xs font-normal text-emerald-600 mt-1 flex items-center">
                    <CheckCircle2 size={12} className="mr-1" /> Có {q.answers?.length || 0} đáp án
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-medium">
                    {q.subjectName || `Subject #${q.subjectId}`}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-3">
                    <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-lg text-slate-800">Thêm Câu Hỏi Trắc Nghiệm</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nội dung câu hỏi</label>
                  <textarea 
                    required rows={3} placeholder="Ví dụ: Thủ đô của Việt Nam là gì?"
                    value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Chuyên môn (Subject)</label>
                  <select 
                    required value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" disabled>-- Chọn môn --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-slate-700">Các đáp án</label>
                  <button type="button" onClick={handleAddAnswer} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                    + Thêm đáp án
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.answers.map((ans: any, idx: number) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${ans.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                      <div className="pt-2 pl-2">
                        <input 
                          type="radio" name="correctAnswer" checked={ans.isCorrect}
                          onChange={() => handleAnswerChange(idx, 'isCorrect', true)}
                          className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" 
                        />
                      </div>
                      <input 
                        type="text" required placeholder={`Đáp án ${idx + 1}`}
                        value={ans.content} onChange={e => handleAnswerChange(idx, 'content', e.target.value)}
                        className={`flex-1 bg-transparent border-none outline-none font-medium px-2 py-1.5 ${ans.isCorrect ? 'text-emerald-800' : 'text-slate-700'}`}
                      />
                      <button type="button" onClick={() => handleRemoveAnswer(idx)} disabled={formData.answers.length <= 2} className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 font-medium flex items-center">
                  <CheckCircle2 size={14} className="mr-1 text-emerald-500" /> Hãy chọn vào ô tròn ở đáp án đúng nhất.
                </p>
              </div>
            </form>
            
            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
              <button onClick={handleSubmit} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm">Tạo câu hỏi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
