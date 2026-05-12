import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { adminApi } from '../../api/adminApi';
import { Users, UserPlus, ArrowLeft, User, Trash2, Search, CheckCircle2, UserCheck } from 'lucide-react';

const ParticipantManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [participants, setParticipants] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      if (!id) return;
      const [partsResp, usersResp]: any = await Promise.all([
        adminApi.getExamParticipants(Number(id)),
        adminApi.getUsers()
      ]);
      setParticipants(partsResp?.data || partsResp || []);
      setAllUsers(usersResp?.data || usersResp || []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu thí sinh:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddParticipant = async (userId: number) => {
    try {
      await adminApi.addExamParticipant(Number(id), { userId });
      fetchData(); // Refresh list
      toast.success('Thêm thí sinh vào đợt thi thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi thêm thí sinh');
    }
  };

  const handleRemoveParticipant = async (userId: number) => {
    const confirm = await Swal.fire({
      title: 'Gỡ thí sinh?',
      text: 'Thí sinh này sẽ không thể tham gia đợt thi nữa. Kết quả thi (nếu có) vẫn được giữ lại.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Gỡ bỏ',
      cancelButtonText: 'Hủy'
    });

    if (!confirm.isConfirmed) return;

    try {
      await adminApi.removeExamParticipant(Number(id), userId);
      fetchData();
      toast.success('Đã gỡ thí sinh khỏi đợt thi');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi gỡ thí sinh');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold">Đang tải danh sách thí sinh...</p>
      </div>
    );
  }

  const participantIds = participants.map(p => p.id);
  const addableUsers = allUsers.filter(u => 
    u.role === 'STUDENT' && 
    !participantIds.includes(u.id) &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || (u.studentId && u.studentId.includes(searchTerm)))
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <Link to="/admin/exams" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-all mb-4">
          <ArrowLeft size={14} className="mr-2" /> Quay lại Quản lý đợt thi
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Users size={32} className="text-indigo-600" /> Quản lý Thí sinh
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Chỉ định quyền truy cập kỳ thi cho thí sinh cụ thể</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc MSSV..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Danh sách đã thêm */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <UserCheck size={14} className="text-emerald-500" /> Danh sách đã ghi danh ({participants.length})
            </span>
          </div>
          <div className="modern-card overflow-hidden">
            <ul className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {participants.length === 0 ? (
                <li className="p-10 text-center text-slate-400 font-bold text-sm">Chưa có thí sinh nào trong đợt thi này</li>
              ) : participants.map(p => (
                <li key={p.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{p.name}</span>
                      <span className="text-xs text-slate-400 font-medium">MSSV: {p.studentId || 'N/A'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-slate-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Danh sách có thể thêm */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <User size={14} className="text-indigo-500" /> Tài khoản Student trống ({addableUsers.length})
            </span>
          </div>
          <div className="modern-card overflow-hidden">
            <ul className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {addableUsers.length === 0 ? (
                <li className="p-10 text-center text-slate-400 font-bold text-sm">Không có tài khoản mới phù hợp</li>
              ) : addableUsers.map(u => (
                <li key={u.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{u.name}</span>
                      <span className="text-xs text-slate-400 font-medium">MSSV: {u.studentId || 'N/A'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAddParticipant(u.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    <UserPlus size={14} /> Thêm
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantManagement;
