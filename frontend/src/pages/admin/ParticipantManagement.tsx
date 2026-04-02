import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { Users, UserPlus, ArrowLeft, Shield, User } from 'lucide-react';

const ParticipantManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [participants, setParticipants] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.success('Thêm thí sinh thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi thêm thí sinh');
    }
  };

  if (loading) {
    return <div className="text-center p-12">Đang tải dữ liệu...</div>;
  }

  const participantIds = participants.map(p => p.id);
  const addableUsers = allUsers.filter(u => u.role === 'STUDENT' && !participantIds.includes(u.id));

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <Link to="/admin/exams" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-4">
          <ArrowLeft size={16} className="mr-1" /> Quay lại Quản lý đợt thi
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center">
          <Users className="mr-2 text-indigo-600" /> Quản lý Thí sinh cho Đợt thi #{id}
        </h1>
        <p className="text-slate-500 mt-1">Chỉ những thí sinh trong danh sách này mới có thể thấy và tham gia kỳ thi.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Danh sách đã thêm */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50">
              <h3 className="font-bold text-emerald-800">Danh sách đã thêm ({participants.length})</h3>
            </div>
            <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {participants.length === 0 ? (
                <li className="p-6 text-center text-slate-500">Chưa có thí sinh nào</li>
              ) : participants.map(p => (
                <li key={p.id} className="p-4 flex flex-col hover:bg-slate-50">
                  <span className="font-bold text-slate-800 flex items-center">
                    <User size={14} className="mr-2 text-slate-400" /> {p.name}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 ml-6">User ID: {p.id}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Danh sách có thể thêm */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">Tài khoản Student trống ({addableUsers.length})</h3>
            </div>
            <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {addableUsers.length === 0 ? (
                <li className="p-6 text-center text-slate-500">Không có tài khoản mới để thêm</li>
              ) : addableUsers.map(u => (
                <li key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 flex items-center">
                      <User size={14} className="mr-2 text-slate-400" /> {u.name}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 ml-6">User ID: {u.id}</span>
                  </div>
                  <button 
                    onClick={() => handleAddParticipant(u.id)}
                    className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    <UserPlus size={16} className="mr-1" /> Thêm
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
