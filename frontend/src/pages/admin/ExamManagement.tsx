import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Plus, Trash2, X, Edit, Users, Calendar, Clock, Book, Layers, AlertCircle, Save, Shuffle } from 'lucide-react';
import CustomSelect from '../../components/common/CustomSelect';

const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    id: undefined,
    title: '',
    subjectId: '',
    duration: 60,
    totalQuestions: 10,
    totalVariants: 1,
    startTime: '',
    endTime: '',
    status: 'UPCOMING',
    chapterQuestions: {} // Map<chapterId, count>
  });

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

  const fetchSubjects = async () => {
    try {
      const resp: any = await adminApi.getSubjects();
      const subjectList = resp?.data || resp || [];
      setSubjects(subjectList);
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
    fetchExams();
    fetchSubjects();
  }, []);

  const handleSubjectChange = (subjectId: string) => {
    setFormData({ ...formData, subjectId, chapterQuestions: {} });
    if (subjectId) {
      fetchChapters(Number(subjectId));
    } else {
      setChapters([]);
    }
  };

  const handleChapterQuestionChange = (chapterId: number, count: number) => {
    setFormData((prev: any) => ({
      ...prev,
      chapterQuestions: {
        ...prev.chapterQuestions,
        [chapterId]: count
      }
    }));
  };

  const totalChapterQuestions = Object.values(formData.chapterQuestions).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
  const isValidQuestionCount = totalChapterQuestions === formData.totalQuestions;

  const handleDelete = async (id: number) => {
    const confirmDelete = await Swal.fire({
      title: 'Hủy bỏ kỳ thi?',
      text: 'Kỳ thi này sẽ được đánh dấu hủy (Soft Delete). Toàn bộ dữ liệu kết quả vẫn được lưu trữ trong hệ thống.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'Đồng ý hủy'
    });
    if (!confirmDelete.isConfirmed) return;
    try {
      await adminApi.deleteExam(id);
      fetchExams();
      toast.success('Đã hủy kỳ thi thành công!');
    } catch (error) {
      toast.error('Không thể thực hiện. Kỳ thi có thể đang diễn ra.');
    }
  };

  const openCreateModal = () => {
    const firstSubId = subjects.length > 0 ? subjects[0].id.toString() : '';
    setFormData({
      id: undefined,
      title: '',
      subjectId: firstSubId,
      duration: 60,
      totalQuestions: 10,
      totalVariants: 4,
      startTime: '',
      endTime: '',
      status: 'UPCOMING',
      chapterQuestions: {}
    });
    if (firstSubId) fetchChapters(Number(firstSubId));
    setIsModalOpen(true);
  };

  const handleEdit = (exam: any) => {
    setFormData({
      id: exam.id,
      title: exam.title,
      subjectId: exam.subjectId.toString(),
      duration: exam.duration,
      totalQuestions: exam.totalQuestions,
      totalVariants: exam.totalVariants || 1,
      startTime: exam.startTime ? exam.startTime.substring(0, 16) : '',
      endTime: exam.endTime ? exam.endTime.substring(0, 16) : '',
      status: exam.status,
      chapterQuestions: exam.chapterQuestions || {}
    });
    fetchChapters(exam.subjectId);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidQuestionCount) {
      toast.error(`Tổng số câu theo chương (${totalChapterQuestions}) phải bằng ${formData.totalQuestions}`);
      return;
    }
    try {
      const payload = {
        title: formData.title,
        duration: formData.duration,
        totalQuestions: formData.totalQuestions,
        totalVariants: formData.totalVariants,
        subjectId: Number(formData.subjectId),
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        chapterQuestions: formData.chapterQuestions
      };

      if (formData.id) {
        await adminApi.updateExam(formData.id, payload);
        toast.success('Cập nhật kỳ thi thành công!');
      } else {
        await adminApi.createExam(payload);
        toast.success('Tạo kỳ thi thành công!');
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi khi lưu kỳ thi');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Đợt thi</h1>
          <p className="text-slate-500 mt-2 font-medium">Thiết lập kỳ thi, cấu hình tráo đề và phân bổ thí sinh</p>
        </div>
        <button 
          onClick={openCreateModal} 
          className="premium-gradient px-8 py-4 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Tạo kỳ thi mới
        </button>
      </div>

      <div className="modern-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-400 uppercase font-black text-[10px] tracking-[0.2em] border-b border-slate-100">
            <tr>
              <th className="px-8 py-5">Thông tin kỳ thi</th>
              <th className="px-8 py-5">Cấu hình</th>
              <th className="px-8 py-5 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={3} className="text-center py-20 text-slate-400 font-bold">Đang tải...</td></tr>
            ) : exams.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-20 text-slate-500 font-bold">Chưa có đợt thi nào.</td></tr>
            ) : exams.map(exam => (
              <tr key={exam.id} className="group hover:bg-slate-50/80 transition-all">
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="font-black text-slate-800 text-lg leading-tight">{exam.title}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">{exam.subjectName}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                        exam.status === 'UPCOMING' ? 'bg-amber-100 text-amber-700' :
                        exam.status === 'ONGOING' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {exam.status}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <Layers size={14} className="text-indigo-500" />
                      <span>{exam.totalQuestions} câu</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <Clock size={14} className="text-indigo-500" />
                      <span>{exam.duration} phút</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <Shuffle size={14} className="text-indigo-500" />
                      <span>{exam.totalVariants || 1} mã đề</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <Link 
                      to={`/admin/exams/${exam.id}/participants`}
                      className="p-3 text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                    >
                      <Users size={20} />
                    </Link>
                    <button 
                      disabled={exam.status !== 'UPCOMING'} 
                      onClick={() => handleEdit(exam)} 
                      className="p-3 text-amber-500 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all disabled:opacity-30"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      disabled={exam.status !== 'UPCOMING'} 
                      onClick={() => handleDelete(exam.id)} 
                      className="p-3 text-red-500 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all disabled:opacity-30"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-white/20">
            <div className="flex items-center justify-between px-10 py-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-2xl text-slate-900 tracking-tight">Cấu hình Kỳ thi</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm border border-slate-100 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto flex-1 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tên kỳ thi</label>
                  <input 
                    type="text" required placeholder="VD: Kiểm tra giữa kỳ..."
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800"
                  />
                </div>
                <div className="md:col-span-4">
                  <CustomSelect 
                    label="Môn học"
                    options={subjects}
                    value={formData.subjectId}
                    onChange={(val) => handleSubjectChange(val.toString())}
                    placeholder="-- Chọn môn --"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tổng số câu hỏi</label>
                  <input 
                    type="number" required min={1}
                    value={formData.totalQuestions} onChange={e => setFormData({...formData, totalQuestions: Number(e.target.value)})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Thời lượng (Phút)</label>
                  <input 
                    type="number" required min={1}
                    value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Số lượng mã đề</label>
                  <input 
                    type="number" required min={1} max={20}
                    value={formData.totalVariants} onChange={e => setFormData({...formData, totalVariants: Number(e.target.value)})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-indigo-600"
                  />
                </div>
              </div>

              {/* Chapter Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Layers size={12} /> Cấu trúc đề thi theo chương
                  </label>
                  <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isValidQuestionCount ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    Đã chọn: {totalChapterQuestions} / {formData.totalQuestions} câu
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  {chapters.length === 0 ? (
                    <div className="col-span-2 py-4 text-center text-slate-400 font-bold text-xs">Vui lòng chọn môn học để tải danh sách chương</div>
                  ) : chapters.map(chapter => (
                    <div key={chapter.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <span className="font-bold text-slate-700 text-sm line-clamp-1">{chapter.name}</span>
                      <input 
                        type="number" min={0}
                        value={formData.chapterQuestions[chapter.id] || 0}
                        onChange={e => handleChapterQuestionChange(chapter.id, Number(e.target.value))}
                        className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Clock size={12} /> Mở đề lúc</label>
                  <input 
                    type="datetime-local"
                    value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Clock size={12} /> Đóng đề lúc</label>
                  <input 
                    type="datetime-local"
                    value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                  />
                </div>
              </div>
            </form>
            
            <div className="flex justify-end gap-4 px-10 py-6 border-t border-slate-100 bg-slate-50/50">
              {!isValidQuestionCount && (
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs mr-auto">
                  <AlertCircle size={16} /> Sai lệch số lượng câu hỏi
                </div>
              )}
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-500 hover:bg-slate-100 font-black text-xs uppercase tracking-widest rounded-2xl transition-all">Hủy</button>
              <button 
                onClick={handleSubmit} 
                className="px-8 py-4 premium-gradient text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
              >
                <Save size={18} /> Lưu kỳ thi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
