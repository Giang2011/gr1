import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Trash2, X, Plus, Filter, CheckCircle2, Eye, Image as ImageIcon, Upload, Book, Layers, Save, Loader2, ChevronDown, Check } from 'lucide-react';
import CustomSelect from '../../components/common/CustomSelect';

const IMG_BASE_URL = 'http://localhost:8080/uploads/';

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter
  const [filterSubjectId, setFilterSubjectId] = useState<string>('');

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    content: '',
    subjectId: '',
    chapterId: '',
    contentImage: null,
    contentImagePreview: null,
    answers: [
      { content: '', isCorrect: false, optionImage: null, optionImagePreview: null },
      { content: '', isCorrect: false, optionImage: null, optionImagePreview: null }
    ]
  });

  // View Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedViewQuestion, setSelectedViewQuestion] = useState<any>(null);

  const fetchQuestions = async () => {
    try {
      const resp: any = await adminApi.getQuestions(filterSubjectId ? Number(filterSubjectId) : undefined);
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

  const fetchChapters = async (subjectId: number) => {
    try {
      const resp: any = await adminApi.getChapters(subjectId);
      setChapters(resp?.data || resp || []);
    } catch (error) {
      console.error('Lỗi lấy chương:', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [filterSubjectId]);

  const handleSubjectChange = (subjectId: string) => {
    setFormData({ ...formData, subjectId, chapterId: '' });
    if (subjectId) {
      fetchChapters(Number(subjectId));
    } else {
      setChapters([]);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = await Swal.fire({
      title: 'Ẩn câu hỏi?',
      text: 'Câu hỏi này sẽ được chuyển vào kho lưu trữ (Soft Delete) và không xuất hiện trong các đề thi mới.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'Đồng ý ẩn'
    });
    if (!confirmDelete.isConfirmed) return;
    try {
      await adminApi.deleteQuestion(id);
      fetchQuestions();
      toast.success('Đã ẩn câu hỏi thành công!');
    } catch (error) {
      toast.error('Không thể thực hiện. Câu hỏi có thể đang thuộc một bài thi đang diễn ra.');
    }
  };

  const openCreateModal = () => {
    setFormData({
      content: '',
      subjectId: filterSubjectId || '',
      chapterId: '',
      contentImage: null,
      contentImagePreview: null,
      answers: [
        { content: '', isCorrect: false, optionImage: null, optionImagePreview: null },
        { content: '', isCorrect: false, optionImage: null, optionImagePreview: null }
      ]
    });
    if (filterSubjectId) fetchChapters(Number(filterSubjectId));
    setIsModalOpen(true);
  };

  const handleAddAnswer = () => {
    setFormData((prev: any) => ({
      ...prev,
      answers: [...prev.answers, { content: '', isCorrect: false, optionImage: null, optionImagePreview: null }]
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
      return { ...prev, answers: newAnswers };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'CONTENT' | 'ANSWER', index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'CONTENT') {
        setFormData({ ...formData, contentImage: file, contentImagePreview: reader.result });
      } else if (type === 'ANSWER' && index !== undefined) {
        const newAnswers = [...formData.answers];
        newAnswers[index] = { ...newAnswers[index], optionImage: file, optionImagePreview: reader.result };
        setFormData({ ...formData, answers: newAnswers });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId || !formData.chapterId) {
      toast.error('Vui lòng chọn đầy đủ Môn học và Chương'); return;
    }
    if (!formData.answers.some((a: any) => a.isCorrect)) {
      toast.error('Phải có ít nhất 1 đáp án đúng!'); return;
    }
    
    setSubmitLoading(true);
    try {
      const form = new FormData();
      form.append('content', formData.content);
      form.append('subjectId', formData.subjectId);
      form.append('chapterId', formData.chapterId);
      
      if (formData.contentImage) {
        form.append('contentImage', formData.contentImage);
      }

      formData.answers.forEach((ans: any) => {
        form.append('answerContents', ans.content || ' '); // Tránh empty string gây lỗi list index
        form.append('isCorrects', ans.isCorrect.toString());
        if (ans.optionImage) {
          form.append('answerImages', ans.optionImage);
        } else {
          // Gửi blob rỗng để giữ đúng thứ tự index nếu backend yêu cầu đủ số lượng File
          form.append('answerImages', new Blob(), 'null.png');
        }
      });

      await adminApi.createQuestion(form);
      setIsModalOpen(false);
      fetchQuestions();
      toast.success('Tạo câu hỏi thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi khi tạo câu hỏi');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ngân hàng câu hỏi</h1>
          <p className="text-slate-500 mt-2 font-medium">Quản lý kho tri thức và học liệu thông minh</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <CustomSelect 
            options={subjects}
            value={filterSubjectId}
            onChange={(val) => setFilterSubjectId(val.toString())}
            placeholder="Tất cả môn học"
            icon={<Filter size={18} />}
            className="min-w-[220px]"
          />
          
          <button 
            onClick={openCreateModal} 
            className="premium-gradient px-8 py-4 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Plus size={20} /> Thêm câu hỏi
          </button>
        </div>
      </div>

      <div className="modern-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Câu hỏi</th>
                <th className="px-8 py-5">Phân loại</th>
                <th className="px-8 py-5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={3} className="text-center py-20 text-slate-400 font-bold">Đang tải dữ liệu...</td></tr>
              ) : questions.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-20 text-slate-500 font-bold">Chưa có câu hỏi nào.</td></tr>
              ) : questions.map(q => (
                <tr key={q.id} className="group hover:bg-slate-50/80 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex gap-4">
                      {q.imageUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                          <img src={`${IMG_BASE_URL}${q.imageUrl}`} className="w-full h-full object-cover" alt="Q" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800 line-clamp-2 leading-relaxed">{q.content}</div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                          <CheckCircle2 size={10} /> {q.answers?.length || 0} Đáp án
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg w-fit">
                        {q.subjectName}
                      </span>
                      {q.chapterName && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                          {q.chapterName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => { setSelectedViewQuestion(q); setIsViewModalOpen(true); }} className="p-3 text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <Eye size={20} />
                      </button>
                      <button onClick={() => handleDelete(q.id)} className="p-3 text-red-500 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-white/20">
            <div className="flex items-center justify-between px-10 py-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-2xl text-slate-900 tracking-tight">Soạn thảo câu hỏi mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm border border-slate-100 transition-all hover:rotate-90"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto flex-1 space-y-8">
              {/* Classification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CustomSelect 
                  label="Môn học"
                  options={subjects}
                  value={formData.subjectId}
                  onChange={(val) => handleSubjectChange(val.toString())}
                  placeholder="-- Chọn môn --"
                  icon={<Book size={12} />}
                />
                <CustomSelect 
                  label="Chương (Phân loại)"
                  options={chapters}
                  value={formData.chapterId}
                  onChange={(val) => setFormData({...formData, chapterId: val.toString()})}
                  placeholder="-- Chọn chương --"
                  icon={<Layers size={12} />}
                  className={!formData.subjectId ? 'opacity-50 pointer-events-none' : ''}
                />
              </div>

              {/* Content & Image */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nội dung câu hỏi</label>
                  <textarea 
                    required rows={4} placeholder="Nhập nội dung câu hỏi tại đây..."
                    value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800 text-lg leading-relaxed"
                  />
                </div>
                <div className="md:col-span-4 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Ảnh minh họa (Tùy chọn)</label>
                  <div className="relative h-[120px] group">
                    {formData.contentImagePreview ? (
                      <div className="relative w-full h-full rounded-2xl overflow-hidden ring-2 ring-indigo-500 ring-offset-2">
                        <img src={formData.contentImagePreview as string} className="w-full h-full object-cover" alt="Preview" />
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, contentImage: null, contentImagePreview: null})}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-100 hover:border-indigo-300 transition-all cursor-pointer group">
                        <Upload size={24} className="text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tải ảnh lên</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'CONTENT')} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Danh sách đáp án</label>
                  <button type="button" onClick={handleAddAnswer} className="text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">+ Thêm lựa chọn</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.answers.map((ans: any, idx: number) => (
                    <div key={idx} className={`p-5 rounded-3xl border-2 transition-all flex flex-col gap-4 ${ans.isCorrect ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}>
                      <div className="flex items-start gap-4">
                        <input 
                          type="checkbox" checked={ans.isCorrect}
                          onChange={(e) => handleAnswerChange(idx, 'isCorrect', e.target.checked)}
                          className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500/20 mt-1 cursor-pointer transition-all border-slate-300" 
                        />
                        <textarea 
                          required placeholder={`Nhập đáp án ${idx + 1}`}
                          value={ans.content} onChange={e => handleAnswerChange(idx, 'content', e.target.value)}
                          className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 placeholder-slate-400 resize-none h-12 py-1"
                        />
                        <button type="button" onClick={() => handleRemoveAnswer(idx)} disabled={formData.answers.length <= 2} className="p-2 text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      {/* Answer Image */}
                      <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                        {ans.optionImagePreview ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden ring-1 ring-slate-200">
                            <img src={ans.optionImagePreview} className="w-full h-full object-cover" alt="Ans" />
                            <button type="button" onClick={() => handleAnswerChange(idx, 'optionImage', null) || handleAnswerChange(idx, 'optionImagePreview', null)} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors uppercase tracking-widest">
                            <ImageIcon size={14} /> + Ảnh đáp án
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'ANSWER', idx)} />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
            
            <div className="flex justify-end gap-4 px-10 py-6 border-t border-slate-100 bg-slate-50/50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-500 hover:bg-slate-100 font-black text-xs uppercase tracking-widest rounded-2xl transition-all">Hủy</button>
              <button 
                onClick={handleSubmit} 
                disabled={submitLoading}
                className="px-8 py-4 premium-gradient text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-70"
              >
                {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Lưu câu hỏi</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedViewQuestion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-10 py-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col">
                <h3 className="font-black text-2xl text-slate-900 tracking-tight">Chi tiết câu hỏi</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: #{selectedViewQuestion.id} | {selectedViewQuestion.subjectName} / {selectedViewQuestion.chapterName}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm border border-slate-100 transition-all"><X size={20} /></button>
            </div>
            
            <div className="p-10 overflow-y-auto flex-1 space-y-10">
              {/* Question Body */}
              <div className="space-y-6">
                <div className="text-xl font-bold text-slate-800 leading-relaxed bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                  {selectedViewQuestion.content}
                </div>
                {selectedViewQuestion.imageUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={`${IMG_BASE_URL}${selectedViewQuestion.imageUrl}`} 
                      className="max-w-full max-h-[300px] rounded-3xl shadow-2xl ring-4 ring-white" 
                      alt="Question" 
                    />
                  </div>
                )}
              </div>

              {/* Answers Grid */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Danh sách lựa chọn</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedViewQuestion.answers?.map((ans: any, idx: number) => (
                    <div 
                      key={ans.id || idx} 
                      className={`relative p-6 rounded-3xl border-2 flex flex-col gap-4 ${ans.isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${ans.isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                          {ans.isCorrect ? <CheckCircle2 size={18} /> : String.fromCharCode(65 + idx)}
                        </div>
                        <div className={`text-lg font-bold ${ans.isCorrect ? 'text-emerald-900' : 'text-slate-700'}`}>
                          {ans.content}
                        </div>
                      </div>
                      {ans.imageUrl && (
                        <div className="mt-2 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                          <img src={`${IMG_BASE_URL}${ans.imageUrl}`} className="w-full h-32 object-cover" alt="Ans" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
