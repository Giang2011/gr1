import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Edit, Trash2, X, Plus, Book, ChevronRight, Layers, ListOrdered, Save } from 'lucide-react';

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Subject Modal States
  const [subjectModal, setSubjectModal] = useState<{mode: 'CREATE' | 'EDIT', id?: number} | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: '' });

  // Chapter States
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chapterModal, setChapterModal] = useState<{mode: 'CREATE' | 'EDIT', id?: number} | null>(null);
  const [chapterForm, setChapterForm] = useState({ name: '', chapterOrder: 1 });

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

  // --- Subject Actions ---
  const handleOpenSubjectModal = (mode: 'CREATE' | 'EDIT', subject?: any) => {
    setSubjectModal({ mode, id: subject?.id });
    setSubjectForm({ name: subject?.name || '' });
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (subjectModal?.mode === 'CREATE') {
        await adminApi.createSubject(subjectForm);
      } else {
        await adminApi.updateSubject(subjectModal?.id!, subjectForm);
      }
      setSubjectModal(null);
      fetchSubjects();
      toast.success('Thao tác môn học thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteSubject = async (id: number) => {
    const confirm = await Swal.fire({
      title: 'Ẩn môn học?',
      text: 'Môn học sẽ được đánh dấu ẩn (Soft Delete). Toàn bộ chương và câu hỏi liên quan cũng sẽ không hiển thị.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'Đồng ý ẩn'
    });
    if (!confirm.isConfirmed) return;
    try {
      await adminApi.deleteSubject(id);
      fetchSubjects();
      toast.success('Đã ẩn môn học thành công');
    } catch (error) {
      toast.error('Không thể thực hiện do ràng buộc hệ thống');
    }
  };

  // --- Chapter Actions ---
  const handleViewChapters = async (subject: any) => {
    setSelectedSubject(subject);
    fetchChapters(subject.id);
  };

  const fetchChapters = async (subjectId: number) => {
    setChaptersLoading(true);
    try {
      const resp: any = await adminApi.getChapters(subjectId);
      const data = resp?.data || resp || [];
      // Sort by chapterOrder
      setChapters(data.sort((a: any, b: any) => a.chapterOrder - b.chapterOrder));
    } catch (error) {
      toast.error('Lỗi tải danh sách chương');
    } finally {
      setChaptersLoading(false);
    }
  };

  const handleOpenChapterModal = (mode: 'CREATE' | 'EDIT', chapter?: any) => {
    setChapterModal({ mode, id: chapter?.id });
    setChapterForm({ 
      name: chapter?.name || '', 
      chapterOrder: chapter?.chapterOrder || (chapters.length + 1) 
    });
  };

  const handleChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (chapterModal?.mode === 'CREATE') {
        await adminApi.createChapter(selectedSubject.id, chapterForm);
      } else {
        await adminApi.updateChapter(chapterModal?.id!, chapterForm);
      }
      setChapterModal(null);
      fetchChapters(selectedSubject.id);
      toast.success('Thao tác chương thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteChapter = async (id: number) => {
    const confirm = await Swal.fire({
      title: 'Gỡ bỏ chương?',
      text: 'Chương này sẽ được đánh dấu ẩn và không xuất hiện trong đề thi mới.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'Xác nhận gỡ'
    });
    if (!confirm.isConfirmed) return;
    try {
      await adminApi.deleteChapter(id);
      fetchChapters(selectedSubject.id);
      toast.success('Đã gỡ bỏ chương');
    } catch (error) {
      toast.error('Lỗi khi xóa chương');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hệ thống Môn học</h1>
          <p className="text-slate-500 mt-2 font-medium">Quản lý môn thi và cấu trúc chương đào tạo</p>
        </div>
        <button 
          onClick={() => handleOpenSubjectModal('CREATE')}
          className="premium-gradient px-8 py-4 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm Môn học
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Subjects List */}
        <div className={`transition-all duration-500 ${selectedSubject ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          <div className="modern-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                <Book size={14} />
                Danh mục môn học
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-slate-400 uppercase font-bold text-[10px] tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Tên môn</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={2} className="text-center py-20 text-slate-400">Đang tải...</td></tr>
                  ) : subjects.map(subject => (
                    <tr 
                      key={subject.id} 
                      className={`group hover:bg-slate-50/80 transition-all cursor-pointer ${selectedSubject?.id === subject.id ? 'bg-indigo-50/50' : ''}`}
                      onClick={() => handleViewChapters(subject)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${selectedSubject?.id === subject.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                            {subject.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800">{subject.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenSubjectModal('EDIT', subject); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                          <ChevronRight size={16} className={`text-slate-300 transition-transform ${selectedSubject?.id === subject.id ? 'rotate-90 text-indigo-500' : ''}`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        {selectedSubject && (
          <div className="lg:col-span-7 animate-in slide-in-from-right-8 duration-500">
            <div className="modern-card">
              <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    <Layers size={12} />
                    Chapters
                  </div>
                  <button 
                    onClick={() => setSelectedSubject(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedSubject.name}</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Quản lý cấu trúc các chương trong môn học này</p>
              </div>

              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Danh sách chương ({chapters.length})</span>
                  <button 
                    onClick={() => handleOpenChapterModal('CREATE')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                  >
                    <Plus size={14} /> Thêm chương mới
                  </button>
                </div>

                <div className="space-y-4">
                  {chaptersLoading ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : chapters.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 font-medium">
                      Môn học này chưa có chương nào.
                    </div>
                  ) : chapters.map((chapter) => (
                    <div key={chapter.id} className="group p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center font-black text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          {chapter.chapterOrder}
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{chapter.name}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenChapterModal('EDIT', chapter)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subject Modal */}
      {subjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in px-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-900 tracking-tight">
                {subjectModal.mode === 'CREATE' ? 'Thêm môn học mới' : 'Cập nhật môn học'}
              </h3>
              <button onClick={() => setSubjectModal(null)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm border border-slate-100 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubjectSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tên môn học</label>
                <div className="relative">
                  <Book className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="text" required 
                    value={subjectForm.name} onChange={e => setSubjectForm({name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    placeholder="VD: Toán rời rạc..."
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4 premium-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2">
                <Save size={18} /> Ghi lại
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chapter Modal */}
      {chapterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] animate-in fade-in px-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-900 tracking-tight">
                {chapterModal.mode === 'CREATE' ? 'Thêm chương mới' : 'Cập nhật chương'}
              </h3>
              <button onClick={() => setChapterModal(null)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm border border-slate-100 transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleChapterSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tên chương</label>
                <div className="relative">
                  <Layers className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="text" required 
                    value={chapterForm.name} onChange={e => setChapterForm({...chapterForm, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    placeholder="VD: Chương 1: Cơ sở..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Thứ tự hiển thị</label>
                <div className="relative">
                  <ListOrdered className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="number" required 
                    value={chapterForm.chapterOrder} onChange={e => setChapterForm({...chapterForm, chapterOrder: parseInt(e.target.value)})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2">
                <Save size={18} /> Ghi lại
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
