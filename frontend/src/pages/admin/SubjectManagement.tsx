import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Edit, Trash2, X, Plus } from 'lucide-react';

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT' | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  const fetchSubjects = async () => {
    try {
      const resp: any = await adminApi.getSubjects();
      setSubjects(resp?.data || resp || []);
    } catch (error) {
      console.error('Lỗi lấy danh sách môn học:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmDelete = await Swal.fire({
      title: 'Xác nhận xóa môn học',
      text: 'Bạn có chắc chắn muốn xoá môn học này? Các câu hỏi và bài thi liên quan có thể bị ảnh hưởng!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });
    if (!confirmDelete.isConfirmed) return;
    try {
      await adminApi.deleteSubject(id);
      fetchSubjects();
      toast.success('Xoá môn học thành công!');
    } catch (error) {
      toast.error('Không thể xoá Môn học do còn dữ liệu phụ thuộc (Ví dụ: Câu hỏi, Kỳ thi).');
    }
  };

  const handleOpenModal = (mode: 'CREATE' | 'EDIT', subject?: any) => {
    setModalMode(mode);
    if (mode === 'EDIT' && subject) {
      setEditId(subject.id);
      setFormData({ name: subject.name });
    } else {
      setEditId(null);
      setFormData({ name: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'CREATE') {
        await adminApi.createSubject(formData);
      } else if (modalMode === 'EDIT' && editId) {
        await adminApi.updateSubject(editId, formData);
      }
      setModalMode(null);
      fetchSubjects();
      toast.success(modalMode === 'CREATE' ? 'Thêm môn học thành công' : 'Cập nhật thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Môn học</h1>
          <p className="text-slate-500 mt-1">Tạo và cấu hình các môn thi</p>
        </div>
        <button onClick={() => handleOpenModal('CREATE')} className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm">
          <Plus size={18} className="mr-2" /> Thêm môn học
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 border-r border-slate-100 w-24">ID</th>
              <th className="px-6 py-4 w-full">Tên môn học</th>
              <th className="px-6 py-4 text-center w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={3} className="text-center py-8">Đang tải...</td></tr>
            ) : subjects.map(subject => (
              <tr key={subject.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 border-r border-slate-100 font-medium">{subject.id}</td>
                <td className="px-6 py-4 font-semibold text-slate-800">{subject.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-3">
                    <button onClick={() => handleOpenModal('EDIT', subject)} className="text-indigo-600 hover:text-indigo-900 transition-colors">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(subject.id)} className="text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {modalMode === 'CREATE' ? 'Thêm môn học mới' : `Sửa môn học #${editId}`}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên môn học</label>
                <input 
                  type="text" required placeholder="Nhập tên môn"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setModalMode(null)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">Ghi lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
