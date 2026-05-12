import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Edit, Trash2, Shield, User, X, Users } from 'lucide-react';
import CustomSelect from '../../components/common/CustomSelect';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Modal Create
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [studentForm, setStudentForm] = useState({ studentId: '', name: '' });
  const [teacherForm, setTeacherForm] = useState({ username: '', password: '', name: '' });
  const [generatedCreds, setGeneratedCreds] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', role: '', password: '' });

  const fetchUsers = async () => {
    try {
      const resp: any = await adminApi.getUsers();
      setUsers(resp?.data || resp || []);
    } catch (error) {
      console.error('Lỗi lấy danh sách user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmDelete = await Swal.fire({
      title: 'Lưu trữ tài khoản?',
      text: 'Tài khoản này sẽ bị ẩn khỏi hệ thống (Soft Delete). Bạn vẫn có thể khôi phục lại từ cơ sở dữ liệu nếu cần thiết.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'Đồng ý ẩn',
      cancelButtonText: 'Hủy'
    });
    if (!confirmDelete.isConfirmed) return;
    try {
      await adminApi.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      toast.success('Xoá người dùng thành công!');
    } catch (error) {
      toast.error('Có lỗi khi xoá! Vui lòng thử lại.');
    }
  };

  const handleEditClick = (user: any) => {
    setEditUser(user);
    setFormData({ name: user.name, role: user.role, password: '' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { name: formData.name, role: formData.role };
      if (formData.password) payload.password = formData.password;

      await adminApi.updateUser(editUser.id, payload);
      setEditUser(null);
      fetchUsers();
      toast.success('Cập nhật thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật người dùng');
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response: any = await adminApi.createStudent(studentForm);
      setGeneratedCreds(response); // Chứa username và password tự sinh
      setShowCreateStudent(false);
      setStudentForm({ studentId: '', name: '' });
      fetchUsers();
      toast.success('Tạo thí sinh thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo thí sinh');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.createTeacher(teacherForm);
      setShowCreateTeacher(false);
      setTeacherForm({ username: '', password: '', name: '' });
      fetchUsers();
      toast.success('Tạo giáo viên thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo giáo viên');
    } finally {
      setLoading(false);
    }
  };

  const currentRole = localStorage.getItem('role');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý người dùng</h1>
          <p className="text-slate-500 mt-2 font-medium">Hệ thống phân quyền và giám sát tài khoản</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateStudent(true)}
            className="bg-white border border-slate-200 px-6 py-4 text-slate-700 rounded-2xl font-bold transition-all shadow-sm hover:bg-slate-50 active:scale-[0.98] flex items-center gap-2"
          >
            + Thí sinh
          </button>
          {currentRole === 'ADMIN' && (
            <button 
              onClick={() => setShowCreateTeacher(true)}
              className="premium-gradient px-6 py-4 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Shield size={18} />
              + Teacher
            </button>
          )}
        </div>
      </div>

      <div className="modern-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
            <Users size={14} />
            Danh sách thành viên
          </div>
          <div className="text-slate-400 text-xs font-medium">
            Tổng cộng: <span className="text-indigo-600 font-bold">{users.length}</span> người dùng
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-400 uppercase font-bold text-[10px] tracking-[0.15em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Thành viên</th>
                <th className="px-8 py-5">Vai trò</th>
                <th className="px-8 py-5">Trạng thái</th>
                {currentRole === 'ADMIN' && <th className="px-8 py-5 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && users.length === 0 ? (
                <tr><td colSpan={currentRole === 'ADMIN' ? 4 : 3} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-slate-400">Đang tải dữ liệu...</span>
                  </div>
                </td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 
                        user.role === 'TEACHER' ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</span>
                        <span className="text-xs text-slate-400 font-medium">ID: #{user.id} {user.studentId ? `| MSSV: ${user.studentId}` : ''}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-100' : 
                      user.role === 'TEACHER' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' :
                      'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                    }`}>
                      {user.role === 'ADMIN' && <Shield size={10} className="mr-1.5" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Active</span>
                    </div>
                  </td>
                  {currentRole === 'ADMIN' && (
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => handleEditClick(user)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                          <Edit size={20} />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Student Modal */}
      {showCreateStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300 px-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-900 tracking-tight">Tạo Thí sinh mới</h3>
              <button onClick={() => setShowCreateStudent(false)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm border border-slate-100 transition-all hover:rotate-90"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateStudent} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">MSSV (Student ID)</label>
                <input 
                  type="text" required 
                  value={studentForm.studentId} onChange={e => setStudentForm({...studentForm, studentId: e.target.value})}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  placeholder="VD: 20216001..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Họ và tên</label>
                <input 
                  type="text" required 
                  value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  placeholder="VD: Nguyễn Văn A..."
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowCreateStudent(false)} className="flex-1 py-4 text-slate-500 hover:bg-slate-100 font-bold rounded-2xl transition-all">Hủy</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Teacher Modal */}
      {showCreateTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300 px-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-900 tracking-tight">Tạo Teacher mới</h3>
              <button onClick={() => setShowCreateTeacher(false)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm border border-slate-100 transition-all hover:rotate-90"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTeacher} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Username</label>
                <input 
                  type="text" required 
                  value={teacherForm.username} onChange={e => setTeacherForm({...teacherForm, username: e.target.value})}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Họ và tên</label>
                <input 
                  type="text" required 
                  value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Mật khẩu</label>
                <input 
                  type="password" required 
                  value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowCreateTeacher(false)} className="flex-1 py-4 text-slate-500 hover:bg-slate-100 font-bold rounded-2xl transition-all">Hủy</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Credentials Modal (One-time display) */}
      {generatedCreds && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[60] animate-in fade-in duration-300 px-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-white/20 animate-in zoom-in-95 duration-500">
            <div className="premium-gradient p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
              <div className="w-20 h-20 bg-white/20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl backdrop-blur-md">
                <Shield size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">Tài khoản đã sẵn sàng!</h3>
              <p className="text-indigo-100 text-sm mt-2 font-bold opacity-80 uppercase tracking-widest">Vui lòng ghi lại thông tin</p>
            </div>
            <div className="p-10 space-y-8">
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</span>
                  <span className="text-indigo-600 font-black text-sm">{generatedCreds.username}</span>
                </div>
                <div className="h-px bg-slate-200/50"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mật khẩu</span>
                  <span className="text-slate-900 font-black text-sm bg-amber-100 px-2 py-1 rounded-lg">{generatedCreds.password}</span>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                <div className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">!</div>
                <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase">Mật khẩu này chỉ hiển thị một lần duy nhất. Bạn sẽ không thể xem lại sau khi đóng cửa sổ này.</p>
              </div>

              <button 
                onClick={() => setGeneratedCreds(null)}
                className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                Tôi đã ghi lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300 px-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Cập nhật tài khoản</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">User ID: #{editUser.id}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-xl shadow-sm border border-slate-100 transition-all hover:rotate-90"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tên hiển thị</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="text" required 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>
                <CustomSelect 
                  label="Vai trò hệ thống"
                  options={[
                    { id: 'STUDENT', name: 'Thí sinh (STUDENT)' },
                    { id: 'TEACHER', name: 'Giáo viên (TEACHER)' },
                    { id: 'ADMIN', name: 'Quản trị viên (ADMIN)' }
                  ]}
                  value={formData.role}
                  onChange={(val) => setFormData({...formData, role: val.toString()})}
                  placeholder="-- Chọn vai trò --"
                  icon={<Shield size={14} />}
                />
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Mật khẩu mới (Nếu muốn đổi)</label>
                <input 
                  type="password" placeholder="••••••••"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 py-4 text-slate-500 hover:bg-slate-100 font-bold rounded-2xl transition-all">Hủy</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
