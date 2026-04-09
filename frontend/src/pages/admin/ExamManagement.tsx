import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Plus, Trash2, X, Edit, Users, Calendar } from 'lucide-react';

const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    id: undefined,
    title: '',
    subjectId: '',
    duration: 60,
    totalQuestions: 10,
    startTime: '',
    endTime: '',
    status: 'UPCOMING'
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
      setSubjects(resp?.data || resp || []);
    } catch (error) {
      console.error('Lỗi lấy môn học:', error);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchSubjects();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmDelete = await Swal.fire({
      title: 'Xác nhận xóa kỳ thi',
      text: 'Xóa kỳ thi này sẽ xóa toàn bộ kết quả liên quan. Tiếp tục?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });
    if (!confirmDelete.isConfirmed) return;
    try {
      await adminApi.deleteExam(id);
      fetchExams();
      toast.success('Xoá kỳ thi thành công!');
    } catch (error) {
      toast.error('Có lỗi khi xóa!');
    }
  };

  const openCreateModal = () => {
    setFormData({
      id: undefined,
      title: '',
      subjectId: subjects.length > 0 ? subjects[0].id.toString() : '',
      duration: 60,
      totalQuestions: 10,
      startTime: '',
      endTime: '',
      status: 'UPCOMING'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (exam: any) => {
    setFormData({
      id: exam.id,
      title: exam.title,
      subjectId: exam.subjectId.toString(),
      duration: exam.duration,
      totalQuestions: exam.totalQuestions,
      startTime: exam.startTime ? exam.startTime.substring(0, 16) : '',
      endTime: exam.endTime ? exam.endTime.substring(0, 16) : '',
      status: exam.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId) {
      toast.error('Vui lòng chọn môn học'); return;
    }
    try {
      const payload = {
        title: formData.title,
        duration: formData.duration,
        totalQuestions: formData.totalQuestions,
        subjectId: Number(formData.subjectId),
        startTime: formData.startTime || null,
        endTime: formData.endTime || null
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
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Đợt thi</h1>
          <p className="text-slate-500 mt-1">Thiết lập cấu hình kỳ thi, thời gian và chỉ định thí sinh</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm">
          <Plus size={18} className="mr-2" /> Tạo kỳ thi
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Tên Kỳ Thi</th>
              <th className="px-6 py-4">Môn Học</th>
              <th className="px-6 py-4">Cấu trúc</th>
              <th className="px-6 py-4">Thời lượng</th>
              <th className="px-6 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Đang tải...</td></tr>
            ) : exams.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có đợt thi nào.</td></tr>
            ) : exams.map(exam => (
              <tr key={exam.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800 text-base">{exam.title}</div>
                  <div className={`mt-1 inline-flex text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    exam.status === 'UPCOMING' ? 'bg-yellow-100 text-yellow-700' :
                    exam.status === 'ONGOING' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {exam.status}
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-indigo-600">{exam.subjectName}</td>
                <td className="px-6 py-4 font-medium">{exam.totalQuestions} Câu hỏi</td>
                <td className="px-6 py-4 text-slate-500">{exam.duration} Phút</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Link 
                      to={`/admin/exams/${exam.id}/participants`}
                      className="w-full flex items-center justify-center text-xs font-semibold py-1.5 px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Users size={14} className="mr-1" /> Thí sinh
                    </Link>
                    <div className="flex w-full space-x-2">
                        <button disabled={exam.status !== 'UPCOMING'} onClick={() => handleEdit(exam)} className="flex-1 flex items-center justify-center text-xs font-semibold py-1.5 px-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <Edit size={14} className="mr-1" /> Sửa
                        </button>
                        <button disabled={exam.status !== 'UPCOMING'} onClick={() => handleDelete(exam.id)} className="flex-1 flex items-center justify-center text-xs font-semibold py-1.5 px-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <Trash2 size={14} className="mr-1" /> Xóa
                        </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex items-center">
                <Calendar className="mr-2 text-indigo-600" /> {formData.id ? 'Chỉnh sửa đợt thi' : 'Thêm đợt thi mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tên kỳ thi</label>
                <input 
                  type="text" required placeholder="Ví dụ: Thi cuối kỳ môn Toán"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Môn Học (Subject)</label>
                  <select 
                    required value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="" disabled>-- Chọn môn sinh đề --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Số lượng câu phát ra</label>
                  <input 
                    type="number" required min={1}
                    value={formData.totalQuestions} onChange={e => setFormData({...formData, totalQuestions: Number(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Hệ thống sẽ bốc ngẫu nhiên</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Thời lượng thi (Phút)</label>
                  <input 
                    type="number" required min={1}
                    value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mở đề lúc</label>
                    <input 
                      type="datetime-local"
                      value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Đóng đề lúc</label>
                    <input 
                      type="datetime-local"
                      value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2 text-xs text-slate-500">
                    Lịch mở đóng đề tự động hiện bỏ trống sẽ mở vô thời hạn (ONGOING).
                  </div>
                </div>
              </div>

            </form>
            
            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
              <button onClick={handleSubmit} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm">Tạo kỳ thi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
