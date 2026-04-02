import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { Edit, Trash2, Shield, User, X } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Modal Edit
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
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xoá người dùng này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Xóa',
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
      // API update cần { name, role, password? }
      const payload: any = { name: formData.name, role: formData.role };
      if (formData.password) {
        payload.password = formData.password; // Back-end có thể nhận password mới
      } else {
        payload.password = 'KEEP_OLD'; // Tùy thuộc backend xử lý, thường nếu blank sẽ bị lỗi @NotBlank
        // Sửa tạm: Nếu backend bắt buộc pass, ta yêu cầu Admin nhập password nếu sửa
      }

      await adminApi.updateUser(editUser.id, payload);
      setEditUser(null);
      fetchUsers();
      toast.success('Cập nhật thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật người dùng');
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h1>
        <p className="text-slate-500 mt-1">Xem, chỉnh sửa và xoá tài khoản trong hệ thống</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 border-r border-slate-100">ID</th>
              <th className="px-6 py-4">Tên hiển thị / Username</th>
              <th className="px-6 py-4">Vai trò (Role)</th>
              <th className="px-6 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8">Đang tải...</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3 border-r border-slate-100 font-medium">{user.id}</td>
                <td className="px-6 py-3 font-semibold text-slate-800">
                  <div className="flex items-center">
                    <User size={16} className="text-slate-400 mr-2" />
                    {user.name}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'ADMIN' ? <Shield size={12} className="mr-1" /> : null}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center space-x-3">
                    <button onClick={() => handleEditClick(user)} className="text-indigo-600 hover:text-indigo-900 transition-colors">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Cập nhật User #{editUser.id}</h3>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
                <input 
                  type="text" required 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Vai trò</label>
                <select 
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="STUDENT">Thí sinh (STUDENT)</option>
                  <option value="ADMIN">Quản trị (ADMIN)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu mới</label>
                <input 
                  type="password" required placeholder="Bắt buộc nhập mật khẩu (do cấu hình backend)"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditUser(null)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors">Hủy</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
